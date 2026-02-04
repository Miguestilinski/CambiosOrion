<?php
// 1. Incluir la conexión centralizada
require_once __DIR__ . '/../../../../data/conexion.php';

// 2. Buffer y Configuración
// Mantenemos ob_start() porque tu catch usa ob_clean()
ob_start();
ini_set('display_errors', 0);
error_reporting(E_ALL);

try {
    // Verificación de seguridad
    if (!isset($conn)) {
        throw new Exception("Error: No se pudo cargar la conexión centralizada.");
    }

    // --- PARÁMETROS FILTROS ---
    $buscar = isset($_GET['buscar']) ? $conn->real_escape_string($_GET['buscar']) : '';
    $pais = isset($_GET['pais']) ? $conn->real_escape_string($_GET['pais']) : '';
    $tipo = isset($_GET['tipo']) ? $conn->real_escape_string($_GET['tipo']) : '';
    
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 25;
    if($limit < 1) $limit = 25;
    $offset = ($page - 1) * $limit;

    // --- CONSTRUCCIÓN QUERY ---
    $where = "WHERE 1=1";

    if ($buscar !== '') {
        $where .= " AND (nombre LIKE '%$buscar%' OR codigo LIKE '%$buscar%' OR simbolo LIKE '%$buscar%')";
    }
    if ($pais !== '') {
        $where .= " AND pais LIKE '%$pais%'";
    }
    if ($tipo !== '') {
        $where .= " AND tipo_divisa = '$tipo'";
    }

    // --- CONTEO TOTAL ---
    $sqlCount = "SELECT COUNT(*) as total FROM divisas_internas $where";
    $countRes = $conn->query($sqlCount);
    $total = $countRes->fetch_assoc()['total'];

    // --- DATOS ---
    $sqlData = "SELECT id, nombre, pais, codigo, simbolo, fraccionable, icono, tipo_divisa, estado 
                FROM divisas_internas 
                $where 
                ORDER BY nombre ASC 
                LIMIT $limit OFFSET $offset";
    
    $result = $conn->query($sqlData);
    $data = [];
    
    if($result) {
        while($row = $result->fetch_assoc()) {
            $data[] = $row;
        }
    }

    $response = [
        "data" => $data,
        "total" => (int)$total,
        "page" => $page,
        "totalPages" => ceil($total / $limit)
    ];

    ob_clean();
    echo json_encode($response);

} catch (Exception $e) {
    ob_clean();
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}
?>