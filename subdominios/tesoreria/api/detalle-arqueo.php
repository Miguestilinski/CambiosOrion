<?php
// 1. Incluir la conexión centralizada
// Esto carga headers, variables de entorno y la conexión $conn
require_once __DIR__ . '/../../../../data/conexion.php';

// Configuraciones para proteger el JSON
ini_set('display_errors', 0);
error_reporting(E_ALL);

try {
    // Verificación de seguridad
    if (!isset($conn)) {
        throw new Exception("Error: No se pudo cargar la conexión centralizada.");
    }

    // Validación de parámetros
    if (!isset($_GET['id'])) {
        throw new Exception("ID no proporcionado");
    }
    $arqueo_id = intval($_GET['id']);

    // 1. Maestro
    $sqlMaster = "SELECT a.id, a.fecha, a.observacion, a.caja_id, 
                         c.nombre AS nombre_caja, e.nombre AS nombre_usuario
                  FROM arqueos a
                  LEFT JOIN cajas c ON a.caja_id = c.id
                  LEFT JOIN equipo e ON a.usuario_id = e.id
                  WHERE a.id = ?";
    
    $stmt = $conn->prepare($sqlMaster);
    $stmt->bind_param("i", $arqueo_id);
    $stmt->execute();
    $resMaster = $stmt->get_result();
    $master = $resMaster->fetch_assoc();
    $stmt->close();

    if (!$master) throw new Exception("Arqueo no encontrado");

    // 2. Detalles (SOLUCIÓN DEL ERROR DE COLACIÓN)
    // Forzamos ambas columnas a utf8mb4_unicode_ci para asegurar compatibilidad
    $sqlDet = "SELECT ad.divisa_id, 
                      d.nombre AS nombre_divisa, 
                      d.icono,
                      ad.total_sistema, 
                      ad.total_arqueo, 
                      ad.denominaciones
               FROM arqueos_detalle ad
               LEFT JOIN divisas_internas d 
               ON ad.divisa_id COLLATE utf8mb4_unicode_ci = d.id COLLATE utf8mb4_unicode_ci
               WHERE ad.arqueo_id = ?
               ORDER BY d.nombre ASC";

    $stmt = $conn->prepare($sqlDet);
    if(!$stmt) throw new Exception("Error SQL Detalle: " . $conn->error);

    $stmt->bind_param("i", $arqueo_id);
    $stmt->execute();
    $resDet = $stmt->get_result();
    $detalles = [];
    while ($row = $resDet->fetch_assoc()) {
        $detalles[] = $row;
    }
    $stmt->close();

    // 3. Navegación (Mismo caja, anterior y siguiente)
    $caja_id = $master['caja_id'];
    $fecha_actual = $master['fecha'];

    // Prev
    $sqlPrev = "SELECT id FROM arqueos WHERE caja_id = ? AND fecha < ? ORDER BY fecha DESC LIMIT 1";
    $stmt = $conn->prepare($sqlPrev);
    $stmt->bind_param("is", $caja_id, $fecha_actual);
    $stmt->execute();
    $prev_id = $stmt->get_result()->fetch_assoc()['id'] ?? null;
    $stmt->close();

    // Next
    $sqlNext = "SELECT id FROM arqueos WHERE caja_id = ? AND fecha > ? ORDER BY fecha ASC LIMIT 1";
    $stmt = $conn->prepare($sqlNext);
    $stmt->bind_param("is", $caja_id, $fecha_actual);
    $stmt->execute();
    $next_id = $stmt->get_result()->fetch_assoc()['id'] ?? null;
    $stmt->close();

    ob_clean();
    echo json_encode([
        "master" => $master,
        "detalles" => $detalles,
        "navegacion" => [
            "prev_id" => $prev_id,
            "next_id" => $next_id
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}

if (isset($conn)) $conn->close();
?>