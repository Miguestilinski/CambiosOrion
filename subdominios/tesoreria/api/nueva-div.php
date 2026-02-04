<?php
// 1. Incluir la conexión centralizada
require_once __DIR__ . '/../../../../data/conexion.php';

// 2. Configuración de Errores
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Helper para errores (Mantenemos tu función, añadiendo limpieza de buffer por seguridad)
function send_error($message) {
    if (ob_get_length()) ob_clean();
    echo json_encode(["error" => $message]);
    exit;
}

// Verificación de seguridad
if (!isset($conn)) {
    send_error("Error: No se pudo cargar la conexión centralizada.");
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $flagsDir = $_SERVER['DOCUMENT_ROOT'] . "/orionapp/node_modules/circle-flags/flags";
    $webBase = "https://cambiosorion.cl/orionapp/node_modules/circle-flags/flags";

    if (!is_dir($flagsDir)) {
        // Fallback si no encuentra directorio, envía array vacío para no romper el front
        echo json_encode([]); 
        exit;
    }

    $flags = [];
    foreach (glob($flagsDir . "/*.svg") as $filePath) {
        $filename = basename($filePath); // ej: cl.svg
        $code = pathinfo($filename, PATHINFO_FILENAME); // ej: cl
        $flags[] = [
            "codigo" => $code,
            "url" => "$webBase/$filename"
        ];
    }

    echo json_encode($flags);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    $nombre = $data['nombre'] ?? null;
    $tipo_divisa = $data['tipo_divisa'] ?? null;
    $pais = $data['pais'] ?? null;
    $codigo = $data['codigo'] ?? null;
    $simbolo = $data['simbolo'] ?? null;
    $icono = $data['url_icono'] ?? null;
    $fraccionable = $data['fraccionable'] ?? 0;
    $denominacion = $data['denominacion'] ?? null;

    if (!$nombre || !$codigo || !$simbolo) {
        send_error("Faltan datos requeridos (nombre, código o símbolo)");
    }

    // Validar si ya existe la divisa
    $stmt = $conn->prepare("SELECT id FROM divisas_internas WHERE codigo = ?");
    $stmt->bind_param("s", $codigo);
    $stmt->execute();
    $stmt->store_result();
    if ($stmt->num_rows > 0) {
        $stmt->close();
        send_error("Ya existe una divisa con ese código");
    }
    $stmt->close();

    // Determinar el prefijo según el tipo de divisa
    $prefix = match (strtolower($tipo_divisa)) {
        'divisa' => 'D',
        'moneda' => 'M',
        default => 'X',
    };

    // Generar ID único
    $maxAttempts = 100;
    $uniqueId = null;

    for ($i = 0; $i < $maxAttempts; $i++) {
        $randomDigits = str_pad(strval(mt_rand(0, 99)), 2, "0", STR_PAD_LEFT);
        $newId = $prefix . $randomDigits;

        $checkStmt = $conn->prepare("SELECT id FROM divisas_internas WHERE id = ?");
        $checkStmt->bind_param("s", $newId);
        $checkStmt->execute();
        $checkStmt->store_result();

        if ($checkStmt->num_rows === 0) {
            $uniqueId = $newId;
            $checkStmt->close();
            break;
        }
        $checkStmt->close();
    }

    if (!$uniqueId) {
        send_error("No se pudo generar un ID único.");
    }

    $sql = "INSERT INTO divisas_internas 
        (id, nombre, tipo_divisa, pais, codigo, simbolo, icono, fraccionable, denominacion)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
    
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        send_error("Error SQL: " . $conn->error);
    }

    $stmt->bind_param("sssssssis", 
        $uniqueId, $nombre, $tipo_divisa, $pais, $codigo, $simbolo, $icono, $fraccionable, $denominacion);

    if ($stmt->execute()) {
        // Crear inventario inicial en Tesorería (Caja ID 99 o buscar por nombre)
        // NOTA: Ajusta el ID de caja si es necesario. Aquí asumo búsqueda por nombre 'Tesoreria'
        $insertInvStmt = $conn->prepare("
            INSERT INTO inventarios (divisa_id, caja_id, cantidad, pmp) 
            SELECT ?, id, 0, 0 FROM cajas WHERE nombre LIKE '%Tesoreria%' LIMIT 1
        ");
        
        if ($insertInvStmt) {
            $insertInvStmt->bind_param("s", $uniqueId);
            $insertInvStmt->execute();
            $insertInvStmt->close();
        }
        
        echo json_encode(["success" => true, "id" => $uniqueId]);
    } else {
        send_error("Error al guardar divisa: " . $stmt->error);
    }

    $stmt->close();
    $conn->close();
    exit;
}

send_error("Solicitud no válida");
?>