<?php
// 1. Incluir la conexión centralizada
require_once __DIR__ . '/../../../../data/conexion.php';

// 2. Blindaje de errores (Mantenemos tu función de seguridad original)
register_shutdown_function(function() {
    $error = error_get_last();
    if ($error && ($error['type'] === E_ERROR || $error['type'] === E_PARSE || $error['type'] === E_CORE_ERROR)) {
        if (ob_get_length()) ob_clean();
        http_response_code(500);
        echo json_encode(["success" => false, "error" => "Error Fatal PHP: " . $error['message'], "line" => $error['line']]);
        exit;
    }
});

// 3. Buffer y Configuración
// Mantenemos ob_start() para proteger la salida JSON
ob_start();
ini_set('display_errors', 0);
error_reporting(E_ALL);

// Helper para errores (Mantenemos tu función auxiliar)
function send_error($message) {
    if (ob_get_length()) ob_clean();
    echo json_encode(["success" => false, "error" => $message]);
    exit;
}

try {
    // Verificación de seguridad
    if (!isset($conn)) {
        throw new Exception("Error: No se pudo cargar la conexión centralizada.");
    }

    // 3. Parámetros
    $caja_id = isset($_GET['caja']) ? intval($_GET['caja']) : null;
    $divisa_txt = isset($_GET['divisa']) ? $conn->real_escape_string($_GET['divisa']) : '';
    $buscar_txt = isset($_GET['buscar']) ? $conn->real_escape_string($_GET['buscar']) : '';
    
    // Paginación
    $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
    $limit = isset($_GET['limit']) ? max(1, intval($_GET['limit'])) : 25;
    $offset = ($page - 1) * $limit;

    if ($caja_id === null) {
        // Fallback: Tesorería (ID 99) o error
        $caja_id = 99; 
    }

    // 4. Construcción SQL Dinámica con FIX DE COLLATION
    // Forzamos utf8mb4_unicode_ci en las comparaciones de texto para evitar "Illegal mix of collations"
    $sql_where = " FROM inventarios i
                   LEFT JOIN divisas_internas d ON i.divisa_id COLLATE utf8mb4_unicode_ci = d.id COLLATE utf8mb4_unicode_ci
                   LEFT JOIN cajas c ON i.caja_id = c.id
                   WHERE i.caja_id = ? ";

    $types = "i";
    $params = [$caja_id];

    // Filtros opcionales
    if (!empty($divisa_txt)) {
        $sql_where .= " AND i.divisa_id COLLATE utf8mb4_unicode_ci = ? ";
        $types .= "s";
        $params[] = $divisa_txt;
    }

    if (!empty($buscar_txt)) {
        // Aplicamos COLLATE también en las búsquedas LIKE
        $sql_where .= " AND (
            d.nombre COLLATE utf8mb4_unicode_ci LIKE ? OR 
            d.codigo COLLATE utf8mb4_unicode_ci LIKE ? OR 
            i.divisa_id COLLATE utf8mb4_unicode_ci LIKE ?
        ) ";
        $types .= "sss";
        $term = "%$buscar_txt%";
        $params[] = $term; 
        $params[] = $term; 
        $params[] = $term;
    }

    // --- QUERY DE DATOS ---
    $sql_data = "SELECT 
                    i.id, 
                    i.divisa_id, 
                    COALESCE(d.nombre, 'Divisa Borrada') as divisa_nombre,
                    COALESCE(d.codigo, i.divisa_id) as divisa_codigo,
                    d.icono as divisa_icono,
                    i.cantidad, 
                    i.pmp,
                    COALESCE(c.nombre, 'Caja Desconocida') as caja_nombre
                 $sql_where 
                 ORDER BY d.nombre ASC 
                 LIMIT ? OFFSET ?";

    // Preparar params para Data (añadir limit y offset)
    $types_data = $types . "ii";
    $params_data = $params; // Copia del array base
    $params_data[] = $limit;
    $params_data[] = $offset;

    // PREPARE
    $stmt = $conn->prepare($sql_data);
    if (!$stmt) throw new Exception("Error en Prepare Data: " . $conn->error);

    // BIND PARAM (Usando desempaquetado ...)
    $stmt->bind_param($types_data, ...$params_data);

    // EXECUTE
    if (!$stmt->execute()) throw new Exception("Error en Execute Data: " . $stmt->error);

    $res = $stmt->get_result();
    $data = [];
    while ($row = $res->fetch_assoc()) {
        // Casting y Cálculos
        $row['cantidad'] = floatval($row['cantidad']);
        $row['pmp'] = floatval($row['pmp']);
        $row['total_clp'] = $row['cantidad'] * $row['pmp'];
        
        $data[] = $row;
    }
    $stmt->close();

    // --- QUERY DE TOTALES ---
    $sql_count = "SELECT COUNT(*) as total $sql_where";
    $stmt_c = $conn->prepare($sql_count);
    if (!$stmt_c) throw new Exception("Error en Prepare Count: " . $conn->error);

    $stmt_c->bind_param($types, ...$params);
    $stmt_c->execute();
    $res_c = $stmt_c->get_result();
    $total_registros = $res_c->fetch_assoc()['total'];
    $stmt_c->close();

    // 5. Respuesta Final
    ob_clean();
    echo json_encode([
        "success" => true,
        "data" => $data,
        "total" => $total_registros,
        "page" => $page,
        "totalPages" => ceil($total_registros / $limit)
    ]);

} catch (Throwable $e) {
    // Catch Throwable captura tanto Exception como Error (PHP 7+)
    send_error("Excepción: " . $e->getMessage());
}

$conn->close();
?>