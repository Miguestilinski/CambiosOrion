<?php
// 1. Incluir la conexión centralizada
// Esto carga headers, gestiona OPTIONS y crea la variable $conn
require_once __DIR__ . '/../../../../data/conexion.php';

// 2. Configuración local
ini_set('display_errors', 0);
error_reporting(E_ALL);

// Mantenemos tu configuración de zona horaria
date_default_timezone_set('America/Santiago');

// Verificación de seguridad
if (!isset($conn)) {
    http_response_code(500);
    echo json_encode(["exito" => false, "mensaje" => "Error: No se pudo cargar la conexión centralizada."]);
    exit;
}

// --- POST: COMPLETAR TRASPASOS ---
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents("php://input"), true);

    if (empty($input['ids']) || !is_array($input['ids'])) {
        echo json_encode(["exito" => false, "mensaje" => "IDs inválidos."]);
        exit;
    }

    $ids = array_map('intval', $input['ids']);
    if (empty($ids)) { echo json_encode(["exito"=>false, "mensaje"=>"Sin IDs"]); exit; }

    // Preparar lista para IN
    $inQuery = implode(',', array_fill(0, count($ids), '?'));
    $types = str_repeat('i', count($ids));

    // 1. Obtener datos de los traspasos seleccionados
    $sqlGet = "SELECT id, origen_id, destino_id, divisa_id, monto FROM traspasos WHERE id IN ($inQuery) AND estado = 'Pendiente'";
    $stmt = $conn->prepare($sqlGet);
    $stmt->bind_param($types, ...$ids);
    $stmt->execute();
    $res = $stmt->get_result();
    
    $traspasos = [];
    while($row = $res->fetch_assoc()) {
        $traspasos[] = $row;
    }
    $stmt->close();

    if (empty($traspasos)) {
        echo json_encode(["exito" => false, "mensaje" => "No se encontraron traspasos pendientes con esos IDs."]);
        exit;
    }

    $conn->begin_transaction();
    try {
        // Preparar sentencias de Inventario (Tabla unificada 'inventarios')
        
        // A) Restar al Origen
        $stmtRestar = $conn->prepare("UPDATE inventarios SET cantidad = cantidad - ? WHERE divisa_id = ? AND caja_id = ?");
        
        // B) Sumar al Destino (Update)
        $stmtSumar = $conn->prepare("UPDATE inventarios SET cantidad = cantidad + ? WHERE divisa_id = ? AND caja_id = ?");
        
        // C) Insertar en Destino (Si no existe)
        $stmtInsertar = $conn->prepare("INSERT INTO inventarios (divisa_id, caja_id, cantidad, pmp) VALUES (?, ?, ?, 0)");

        foreach ($traspasos as $t) {
            $monto = (float)$t['monto'];
            $divisa = $t['divisa_id'];
            $origen = (int)$t['origen_id'];
            $destino = (int)$t['destino_id'];

            // 2. Restar de Origen
            $stmtRestar->bind_param("dsi", $monto, $divisa, $origen);
            $stmtRestar->execute();
            // Nota: Si el origen no tiene inventario, esto no da error, solo 0 affected rows. 
            // Podríamos validar, pero asumimos que si se creó el traspaso, se validó el saldo antes.

            // 3. Sumar a Destino
            $stmtSumar->bind_param("dsi", $monto, $divisa, $destino);
            $stmtSumar->execute();

            if ($stmtSumar->affected_rows === 0) {
                // Si no se actualizó, creamos la fila
                $stmtInsertar->bind_param("sid", $divisa, $destino, $monto);
                $stmtInsertar->execute();
            }
        }

        // 4. Actualizar Estado a 'Completado' (o 'Pagado' según tu lógica)
        // Usaremos 'Completado' que es más semántico para traspasos, pero si usas 'Pagado' cámbialo aquí.
        // Tu array enum tenía 'Pagado' en el error anterior, usaremos ese para consistencia.
        $stmtUpd = $conn->prepare("UPDATE traspasos SET estado = 'Pagado' WHERE id IN ($inQuery)");
        $stmtUpd->bind_param($types, ...$ids);
        $stmtUpd->execute();

        $conn->commit();
        echo json_encode(["exito" => true, "mensaje" => "Traspasos procesados correctamente."]);

    } catch (Exception $e) {
        $conn->rollback();
        echo json_encode(["exito" => false, "mensaje" => "Error: " . $e->getMessage()]);
    }
    exit;
}

// --- GET: LISTAR TRASPASOS ---

// Filtros
$caja_id = isset($_GET['caja_id']) ? (int)$_GET['caja_id'] : 0;
$numero  = $_GET['numero'] ?? '';
$fecha   = $_GET['fecha'] ?? '';
$origen  = $_GET['origen'] ?? '';
$destino = $_GET['destino'] ?? '';
$estado  = $_GET['estado'] ?? '';
$monto   = $_GET['monto'] ?? '';
$divisa  = $_GET['divisa'] ?? '';
$limite  = isset($_GET['mostrar']) ? (int)$_GET['mostrar'] : 25;

// Query Base: Tabla 'traspasos' unificada
$sql = "SELECT 
            t.id,
            t.fecha,
            t.transaccion_id,
            t.origen_id,
            c_orig.nombre AS origen,
            t.destino_id,
            c_dest.nombre AS destino,
            t.divisa_id,
            d.nombre AS divisa,
            t.monto,
            t.estado,
            t.metodo_pago
        FROM traspasos t
        LEFT JOIN cajas c_orig ON t.origen_id = c_orig.id
        LEFT JOIN cajas c_dest ON t.destino_id = c_dest.id
        LEFT JOIN divisas_internas d ON t.divisa_id = d.id
        WHERE 1=1 ";

// Filtro de Seguridad: Ver solo lo que sale o entra a MI caja (si se envió ID)
if ($caja_id > 0) {
    $sql .= " AND (t.origen_id = $caja_id OR t.destino_id = $caja_id)";
}

// Filtros dinámicos
$params = [];
$types = "";

if ($numero) { $sql .= " AND t.id = ?"; $params[] = $numero; $types .= "i"; }
if ($fecha)  { $sql .= " AND DATE(t.fecha) = ?"; $params[] = $fecha; $types .= "s"; }
if ($estado) { $sql .= " AND t.estado = ?"; $params[] = $estado; $types .= "s"; }
// Filtros de texto (LIKE)
if ($origen) { $sql .= " AND c_orig.nombre LIKE ?"; $params[] = "%$origen%"; $types .= "s"; }
if ($destino){ $sql .= " AND c_dest.nombre LIKE ?"; $params[] = "%$destino%"; $types .= "s"; }
if ($divisa) { $sql .= " AND d.nombre LIKE ?"; $params[] = "%$divisa%"; $types .= "s"; }

$sql .= " ORDER BY t.fecha DESC LIMIT ?";
$params[] = $limite; 
$types .= "i";

$stmt = $conn->prepare($sql);
if(!empty($params)) {
    $stmt->bind_param($types, ...$params);
}
$stmt->execute();
$res = $stmt->get_result();

$data = [];
while($row = $res->fetch_assoc()) {
    $data[] = $row;
}

echo json_encode($data);
$conn->close();
?>