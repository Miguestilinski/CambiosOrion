<?php
// 1. Incluir la conexión centralizada
// Esto carga headers, gestiona OPTIONS y crea la variable $conn
require_once __DIR__ . '/../../../../data/conexion.php';

// 2. Configuración de Sesión y Buffer
ob_start();
// Iniciamos sesión si no está activa (importante para $_SESSION['equipo_id'])
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// 3. Configuración de Errores
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Helper para errores (Mantenemos tu función original)
function send_error($message) {
    if (ob_get_length()) ob_clean();
    echo json_encode(["success" => false, "error" => $message]);
    exit;
}

// Verificación de seguridad
if (!isset($conn)) {
    send_error("Error: No se pudo cargar la conexión centralizada.");
}

// --- GET (Buscadores) ---
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (isset($_GET['buscar_cliente'])) {
        $q = $conn->real_escape_string($_GET['buscar_cliente']);
        $res = $conn->query("SELECT id, razon_social FROM clientes WHERE razon_social LIKE '%$q%' LIMIT 10");
        $out = []; while($r=$res->fetch_assoc()) $out[] = ["id"=>$r['id'], "nombre"=>$r['razon_social']];
        echo json_encode($out); exit;
    }
    if (isset($_GET['buscar_cajas'])) {
        $res = $conn->query("SELECT id, nombre FROM cajas WHERE estado=1 ORDER BY CASE WHEN nombre LIKE '%Tesoreria%' THEN 0 ELSE 1 END, nombre ASC");
        $out = []; while($r=$res->fetch_assoc()) $out[] = ["id"=>$r['id'], "nombre"=>$r['nombre']];
        echo json_encode($out); exit;
    }
    if (isset($_GET['buscar_divisa'])) {
        $q = $conn->real_escape_string($_GET['buscar_divisa']);
        $res = $conn->query("SELECT id, nombre, icono FROM divisas_internas WHERE nombre LIKE '%$q%' LIMIT 10");
        $out = []; while($r=$res->fetch_assoc()) $out[] = ["id"=>$r['id'], "nombre"=>$r['nombre'], "icono"=>$r['icono']];
        echo json_encode($out); exit;
    }
    // Precio Sugerido
    if (isset($_GET['precio_divisa'])) {
        $nom = $conn->real_escape_string($_GET['precio_divisa']);
        $tipo = $_GET['tipo'] === 'Venta' ? 'venta' : 'compra';
        // Buscar codigo ISO en internas, luego precio en tabla divisas
        $isoQ = $conn->query("SELECT codigo FROM divisas_internas WHERE nombre='$nom'");
        $precio = null;
        if($iso = $isoQ->fetch_assoc()) {
            $code = $iso['codigo'];
            $pQ = $conn->query("SELECT $tipo FROM divisas WHERE nombre='$code'");
            if($pr = $pQ->fetch_assoc()) $precio = $pr[$tipo];
        }
        echo json_encode(["precio" => $precio]); exit;
    }
    exit;
}

// --- POST (Crear Operación) ---
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents("php://input"), true);
    
    // 1. Usuario
    // Intentamos obtener el ID directamente, si no está, buscamos dentro de 'user' por si acaso
    $vendedor_id = $_SESSION['equipo_id'] ?? $_SESSION['user']['equipo_id'] ?? null;
    if (!$vendedor_id) send_error("Sesión no válida.");

    // 2. Validar
    if (empty($input['detalles']) || empty($input['caja']) || empty($input['total'])) send_error("Datos incompletos.");

    $conn->begin_transaction();
    try {
        // Generar número de documento temporal como placeholder (SOLUCIONADO)
        $temp_doc_num = "DOC-" . time() . rand(100, 999); 

        // Preparar SQL
        $sql = "INSERT INTO operaciones (fecha, cliente_id, vendedor_id, caja_id, tipo_transaccion, tipo_documento, numero_documento, estado, observaciones, total) VALUES (NOW(), ?, ?, ?, ?, ?, ?, 'Vigente', ?, ?)";
        $stmt = $conn->prepare($sql);
        
        if (!$stmt) {
            throw new Exception("Error SQL al preparar operación: " . $conn->error);
        }

        // Manejo de cliente null
        $cli = !empty($input['cliente_id']) ? $input['cliente_id'] : null;
        
        $stmt->bind_param("siissssd", $cli, $vendedor_id, $input['caja'], $input['tipo_transaccion'], $input['tipo_documento'], $temp_doc_num, $input['observaciones'], $input['total']);
        
        if (!$stmt->execute()) {
            throw new Exception("Error al ejecutar INSERT operaciones: " . $stmt->error);
        }

        $op_id = $stmt->insert_id;
        $stmt->close();

        // Generar Código (Tu lógica original preservada)
        $num_op = str_pad($op_id, 4, '0', STR_PAD_LEFT);
        // ... (Logica simplificada de código: TIPO + ID)
        $cod_op = strtoupper(substr($input['tipo_transaccion'],0,1)) . $num_op; 
        
        // Actualizar codigo
        $conn->query("UPDATE operaciones SET codigo_operacion='$cod_op' WHERE id=$op_id");

        // Insertar Detalles
        $stmtDet = $conn->prepare("INSERT INTO detalles_operaciones (operacion_id, divisa_id, monto, tasa_cambio, subtotal, margen) VALUES (?, ?, ?, ?, ?, ?)");
        
        // --- CORRECCIÓN INVENTARIO (Tabla 'inventarios') ---
        // 1. Update (Si ya existe la divisa en esa caja)
        $stmtUpdInv = $conn->prepare("UPDATE inventarios SET cantidad = cantidad + ? WHERE divisa_id = ? AND caja_id = ?");
        
        // 2. Insert (Si es nueva en esa caja). 
        // ¡IMPORTANTE!: Agregamos 'pmp' con valor 0 porque tu tabla dice que es NOT NULL
        $stmtInsInv = $conn->prepare("INSERT INTO inventarios (divisa_id, caja_id, cantidad, pmp) VALUES (?, ?, ?, 0)");

        if(!$stmtUpdInv || !$stmtInsInv) {
             throw new Exception("Error preparando inventario: " . $conn->error);
        }

        foreach($input['detalles'] as $d) {
            $margen = 0; 
            $stmtDet->bind_param("isdddd", $op_id, $d['divisa_id'], $d['monto'], $d['tasa_cambio'], $d['subtotal'], $margen);
            if (!$stmtDet->execute()) throw new Exception("Error detalle: " . $stmtDet->error);

            // Calcular Monto para Inventario
            // Compra (Entra dinero/divisa) = Suma (+)
            // Venta (Sale dinero/divisa) = Resta (-)
            $factor = ($input['tipo_transaccion'] === 'Compra') ? 1 : -1;
            $montoInv = $d['monto'] * $factor;

            // Intentar UPDATE primero
            // Tipos: d (double cantidad), s (string divisa_id), i (int caja_id)
            $stmtUpdInv->bind_param("dsi", $montoInv, $d['divisa_id'], $input['caja']);
            $stmtUpdInv->execute();
            
            // Si no se actualizó ninguna fila (affected_rows 0), significa que no existe -> HACEMOS INSERT
            if ($stmtUpdInv->affected_rows === 0) {
                 // Tipos: s (string divisa_id), i (int caja_id), d (double cantidad)
                 // El pmp va fijo en 0 según la query de arriba
                 $stmtInsInv->bind_param("sid", $d['divisa_id'], $input['caja'], $montoInv);
                 if (!$stmtInsInv->execute()) {
                     throw new Exception("Error creando inventario: " . $stmtInsInv->error);
                 }
            }
        }

        $conn->commit();
        echo json_encode(["success" => true, "operacion_id" => $op_id, "codigo_operacion" => $cod_op]);

    } catch (Exception $e) {
        $conn->rollback();
        send_error($e->getMessage());
    }
    exit;
}
?>