<?php
// 1. Incluir la conexión centralizada
require_once __DIR__ . '/../../../../data/conexion.php';

// 2. Configuración de Logs y Errores
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
ini_set('error_log', __DIR__ . '/php_error.log'); // Mantenemos tu log local
error_reporting(E_ALL);

// Helpers (Mantenemos tus funciones, agregando limpieza de buffer por seguridad)
function send_error($message) {
    if (ob_get_length()) ob_clean();
    echo json_encode(["error" => $message]);
    exit;
}

function send_success($data = []) {
    if (ob_get_length()) ob_clean();
    echo json_encode(array_merge(["success" => true], $data));
    exit;
}

// Verificación de seguridad
if (!isset($conn)) {
    send_error("Error: No se pudo cargar la conexión centralizada.");
}

// Solo aceptar método POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_error("Método no permitido");
}

// Leer los datos del cuerpo JSON
$data = json_decode(file_get_contents('php://input'), true);
if (!$data) {
    send_error("Datos JSON inválidos");
}

// Validar campos requeridos
$tipo         = trim($data['tipo'] ?? '');
$razon_social = trim($data['razon_social'] ?? '');
$rut          = trim($data['rut'] ?? '');
$correo       = trim($data['correo'] ?? '');
$telefono     = trim($data['telefono'] ?? '');
$direccion    = trim($data['direccion'] ?? '');

if (!$razon_social || !$rut || !$correo) {
    send_error("Los campos razón social, RUT y correo son obligatorios.");
}

// Verificar si ya existe cliente con mismo RUT
$sql_check = "SELECT id FROM clientes WHERE rut = ?";
$stmt_check = $conn->prepare($sql_check);
$stmt_check->bind_param("s", $rut);
$stmt_check->execute();
$stmt_check->store_result();

if ($stmt_check->num_rows > 0) {
    send_error("Ya existe un cliente con este RUT.");
}
$stmt_check->close();

function generar_id_unico($tipo, $conn) {
    $prefijos = [
        'Persona Juridica' => 'J',
        'Persona Natural' => 'N',
        'Extranjero' => 'E',
        'Miembro' => 'M'
    ];

    $prefijo = $prefijos[$tipo] ?? 'X';

    // Intenta generar hasta 10 veces un ID único
    for ($i = 0; $i < 10; $i++) {
        $digitos = str_pad(rand(0, 9999), 4, '0', STR_PAD_LEFT);
        $id = $prefijo . $digitos;

        $stmt_check_id = $conn->prepare("SELECT id FROM clientes WHERE id = ?");
        $stmt_check_id->bind_param("s", $id);
        $stmt_check_id->execute();
        $stmt_check_id->store_result();

        if ($stmt_check_id->num_rows === 0) {
            $stmt_check_id->close();
            return $id; // ID es único
        }

        $stmt_check_id->close();
    }

    return false; // No se pudo generar un ID único
}

// Generar ID único
$id_generado = generar_id_unico($tipo, $conn);
if (!$id_generado) {
    send_error("No se pudo generar un ID único para el cliente.");
}

// Insertar nuevo cliente con ID generado
$sql_insert = "INSERT INTO clientes (id, tipo, razon_social, rut, correo, fono, direccion) VALUES (?, ?, ?, ?, ?, ?, ?)";
$stmt = $conn->prepare($sql_insert);
if (!$stmt) {
    send_error("Error al preparar la consulta: " . $conn->error);
}
$stmt->bind_param("sssssss", $id_generado, $tipo, $razon_social, $rut, $correo, $telefono, $direccion);

if ($stmt->execute()) {
    send_success(["cliente_id" => $id_generado]);
} else {
    send_error("Error al crear cliente: " . $stmt->error);
}

$stmt->close();
$conn->close();
?>