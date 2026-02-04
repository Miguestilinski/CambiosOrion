<?php
// 1. Incluir la conexión centralizada
require_once __DIR__ . '/../../../../data/conexion.php';

// 2. Configuración local de Logs y Errores
ini_set('display_errors', 1);
ini_set('error_log', __DIR__ . '/php_error.log');
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Helper para errores (Mantenemos tu función, con limpieza de buffer)
function send_error($message) {
    if (ob_get_length()) ob_clean();
    echo json_encode(["error" => $message]);
    exit;
}

// Verificación de seguridad
if (!isset($conn)) {
    send_error("Error: No se pudo cargar la conexión centralizada.");
}

// Buscar clientes
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['buscar_cliente'])) {
    $query = $conn->real_escape_string($_GET['buscar_cliente']);
    $clientes = [];
    $sql = "SELECT id, razon_social, rut FROM clientes WHERE razon_social LIKE '%$query%' LIMIT 10";
    $result = $conn->query($sql);
    while ($row = $result->fetch_assoc()) {
        $clientes[] = [
            "id" => $row['id'], 
            "nombre" => $row['razon_social'],
            "rut" => $row['rut']
        ];
    }
    echo json_encode($clientes);
    exit;
}

// Buscar divisas
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['buscar_divisa'])) {
    $query = $conn->real_escape_string($_GET['buscar_divisa']);
    $divisas = [];
    $sql = "SELECT id, nombre, codigo FROM divisas_internas WHERE nombre LIKE '%$query%' LIMIT 10";
    $result = $conn->query($sql);
    while ($row = $result->fetch_assoc()) {
        $divisas[] = [
            "id" => $row['id'], 
            "nombre" => $row['nombre'],
            "codigo" => $row['codigo'] 
        ];
    }
    echo json_encode($divisas);
    exit;
}

// Buscar funcionario POR RUT
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['rut'])) {
    $rut_raw = $_GET['rut']; 

    if (empty($rut_raw)) {
        echo json_encode(['es_funcionario' => false, 'error' => 'RUT no proporcionado']);
        exit;
    }

    // Normalizar el RUT de entrada (quitar puntos, guión, -> mayúsculas)
    $rut_normalizado_input = strtoupper(str_replace(['.', '-'], '', $rut_raw)); 
    
    // --- INICIO DE CAMBIO: Normalizar también en la consulta SQL ---
    // Compara el RUT normalizado de entrada con el RUT normalizado de la BD
    $sql = "SELECT COUNT(*) as total 
            FROM equipo 
            WHERE UPPER(REPLACE(REPLACE(rut, '.', ''), '-', '')) = ?"; 
    // --- FIN DE CAMBIO ---
            
    $stmt = $conn->prepare($sql);
    
    if (!$stmt) {
         echo json_encode(['es_funcionario' => false, 'error' => 'Error preparing statement: ' . $conn->error]);
         exit;
    }
    
    // Usar el RUT normalizado de entrada en bind_param
    $stmt->bind_param("s", $rut_normalizado_input); 

    $stmt->execute();
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();
    $stmt->close();

    $es_funcionario = ($row && $row['total'] > 0);

    echo json_encode([
        'es_funcionario' => $es_funcionario
    ]);
    $conn->close(); 
    exit;
}

// Crear cuenta
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $forzar = isset($_GET['forzar']) && $_GET['forzar'] == '1';

    $data = json_decode(file_get_contents('php://input'), true);

    $cliente_id = $data['cliente_id'] ?? null; // Opcional
    $divisa_id = $data['divisa_id'] ?? null;
    $nombre_cuenta = $data['nombre_cuenta'] ?? null;
    $tipo_cuenta = $data['tipo_cuenta'] ?? null;

    if (!$divisa_id) {
        send_error("Divisa es obligatoria");
    }

    if (!$nombre_cuenta || trim($nombre_cuenta) === '') {
        send_error("Nombre de cuenta es obligatorio");
    }

    if (!in_array($tipo_cuenta, ['general', 'cliente', 'administrativa', 'funcionario'])) {
        send_error("Tipo de cuenta inválido");
    }

    // Validaciones si hay cliente  
    $hayAdvertencia = false;

    // Validar si ya existe una cuenta con el mismo nombre (único global)
    $sql_nombre = "SELECT COUNT(*) FROM cuentas WHERE nombre = ?";
    $stmt_nombre = $conn->prepare($sql_nombre);
    if (!$stmt_nombre) {
        send_error("Error al validar nombre: " . $conn->error);
    }
    $stmt_nombre->bind_param("s", $nombre_cuenta);
    $stmt_nombre->execute();
    $stmt_nombre->bind_result($count_nombre);
    $stmt_nombre->fetch();
    $stmt_nombre->close();

    if ($count_nombre > 0) {
        send_error("Ya existe una cuenta con ese nombre.");
    }

    // Verificar si ya hay cuenta con misma divisa (pero permitirla con advertencia)
    $sql_divisa = "SELECT COUNT(*) FROM cuentas WHERE cliente_id = ? AND divisa_id = ?";
    $stmt_divisa = $conn->prepare($sql_divisa);
    if (!$stmt_divisa) {
        send_error("Error al validar divisa: " . $conn->error);
    }
    $stmt_divisa->bind_param("si", $cliente_id, $divisa_id);
    $stmt_divisa->execute();
    $stmt_divisa->bind_result($count_divisa);
    $stmt_divisa->fetch();
    $stmt_divisa->close();

    if ($count_divisa > 0 && !$forzar) {
        echo json_encode([
            "success" => false,
            "warning" => "Ya existe una cuenta para ese cliente con esta divisa. ¿Deseas crear otra de todos modos?",
            "continue_possible" => true,
            "body" => $data
        ]);
        exit;
    }

    // Insertar cuenta con el nombre de cuenta recibido
    $sql = "INSERT INTO cuentas (cliente_id, nombre, divisa_id, me_deben, debo, por_cobrar, por_pagar, activa, tipo_cuenta)
            VALUES (?, ?, ?, 0.00, 0.00, 0, 0, 1, ?)";
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        send_error("Error en la consulta SQL: " . $conn->error);
    }

    // Pasar null o string vacío si no hay cliente
    if ($cliente_id === null || $cliente_id === '') {
        $cliente_id_param = null;
        $stmt->bind_param("ssss", $cliente_id_param, $nombre_cuenta, $divisa_id, $tipo_cuenta);
    } else {
        $stmt->bind_param("ssss", $cliente_id, $nombre_cuenta, $divisa_id, $tipo_cuenta);
    }

    if ($stmt->execute()) {
        $nuevo_id_cuenta = $conn->insert_id;

        echo json_encode([
            "success" => true,
            "id" => $nuevo_id_cuenta,
            "warning" => $hayAdvertencia ? "El cliente ya tenía una cuenta con esa divisa." : null
        ]);
    } else {
        send_error("Error al crear cuenta: " . $stmt->error);
    }

    $stmt->close();
    exit;
}

send_error("Solicitud no válida");
$conn->close();
?>
