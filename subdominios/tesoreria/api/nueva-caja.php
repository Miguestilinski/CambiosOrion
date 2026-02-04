<?php
// 1. Incluir la conexión centralizada
// Esto carga headers, gestiona el OPTIONS y crea la variable $conn
require_once __DIR__ . '/../../../../data/conexion.php';

// 2. Configuración de Logs y Timezone (Mantenemos tu configuración original)
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/php_error.log');
error_reporting(E_ALL);

date_default_timezone_set('America/Santiago');

// Helper para errores (Mantenemos tu función auxiliar)
function send_error($message) {
    // Aseguramos que no haya basura en el buffer antes de enviar el JSON de error
    if (ob_get_length()) ob_clean(); 
    echo json_encode(["error" => $message]);
    exit;
}

error_log("Entrando al script"); 

// Verificación de seguridad
if (!isset($conn)) {
    send_error("Error: No se pudo cargar la conexión centralizada.");
}

error_log("Conexión establecida");

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Consultar las divisas internas
    $sql = "SELECT id, nombre, codigo, icono FROM divisas_internas ORDER BY nombre ASC";
    $result = $conn->query($sql);

    if (!$result) {
        error_log("Error al ejecutar query: " . $conn->error);
        send_error("Error al obtener divisas: " . $conn->error);
    }

    $divisas = [];
    while ($row = $result->fetch_assoc()) {
        $divisas[] = $row;
    }
    error_log("Entró en GET, preparando respuesta con divisas: " . json_encode($divisas));
    echo json_encode(["divisas" => $divisas]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents("php://input"), true);
    $nombre = trim($input["nombre"] ?? '');
    $tipo = $input["tipo"] ?? '';
    $divisas = $input["divisas"] ?? []; // Esto es un array de IDs de divisa, ej: ['D99', 'D12']

    if (!$nombre || !$tipo || empty($divisas)) {
        send_error("Faltan datos obligatorios.");
    }

    $stmt = $conn->prepare("INSERT INTO cajas (nombre, tipo) VALUES (?, ?)");
    if (!$stmt) send_error("Error al preparar inserción: " . $conn->error);
    
    $stmt->bind_param("ss", $nombre, $tipo);
    if (!$stmt->execute()) {
        // Manejar error si el nombre de la caja ya existe (si 'nombre' es UNIQUE)
        if ($conn->errno == 1062) { // 1062 = Error de entrada duplicada
             send_error("Ya existe una caja con ese nombre.");
        }
        send_error("Error al crear la caja: " . $stmt->error);
    }
    $caja_id = $stmt->insert_id;
    $stmt->close();

    $stmt = $conn->prepare("INSERT INTO `inventarios` (divisa_id, cantidad, pmp, caja_id) VALUES (?, 0, 0.00, ?)");
    if (!$stmt) send_error("Error preparando inserción en inventarios: " . $conn->error);
    
    foreach ($divisas as $divisa_id) {
        $stmt->bind_param("si", $divisa_id, $caja_id);
        if (!$stmt->execute()) {
            // Si falla aquí, es mejor revertir todo, pero por ahora solo reportamos
            send_error("Error al insertar divisa $divisa_id en inventarios: " . $stmt->error);
        }
    }
    $stmt->close();

    echo json_encode([
        "success" => true,
        "mensaje" => "Caja creada con éxito",
        "caja_id" => $caja_id
    ]);
    
    exit;
}

send_error("Solicitud no válida");
$conn->close();
?>