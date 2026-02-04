<?php
// 1. Incluir la conexión centralizada
require_once __DIR__ . '/../../../../data/conexion.php';

// Configuraciones de errores para este archivo
// Recomendación: ponlo en 0 para que los 'Warnings' no rompan el JSON
ini_set('display_errors', 0); 
error_reporting(E_ALL);

// Verificación de seguridad básica por si falla el require
if (!isset($conn)) {
    echo json_encode(["error" => "No hay conexión a la base de datos"]);
    exit;
}

// --- 1. MANEJAR POST (Activar/Desactivar) ---
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    if (isset($data['id']) && isset($data['activo'])) {
        $id = $data['id'];
        $activo = $data['activo'] ? 1 : 0;
        $stmt = $conn->prepare("UPDATE clientes SET activo = ? WHERE id = ?");
        $stmt->bind_param("is", $activo, $id);
        echo json_encode(["success" => $stmt->execute()]);
        $stmt->close();
        exit;
    }
}

// --- 2. BÚSQUEDA RÁPIDA (Sugerencias para el Dropdown) ---
if (isset($_GET['buscar_sugerencia'])) {
    $busqueda = "%" . $conn->real_escape_string($_GET['buscar_sugerencia']) . "%";
    // Buscamos por Razón Social O RUT, ordenado alfabéticamente
    $sql_sug = "SELECT id, razon_social, rut 
                FROM clientes 
                WHERE razon_social LIKE ? OR rut LIKE ? 
                ORDER BY razon_social ASC";
    $stmt = $conn->prepare($sql_sug);
    $stmt->bind_param("ss", $busqueda, $busqueda);
    $stmt->execute();
    $res = $stmt->get_result();
    
    $sugerencias = [];
    while($row = $res->fetch_assoc()) { 
        $sugerencias[] = $row; 
    }
    echo json_encode($sugerencias);
    exit;
}

// --- 3. FILTROS PRINCIPALES ---
// Capturamos los parámetros del GET de forma segura
$nombre = !empty($_GET['nombre']) ? "%" . $_GET['nombre'] . "%" : "%";

// RUT: Limpiamos puntos y guiones del INPUT para buscar solo números y K
// Esto permite que el usuario escriba como quiera (12.345 o 12345)
$rut_raw = !empty($_GET['rut']) ? $_GET['rut'] : "";
$rut_clean = str_replace(['.', '-'], '', $rut_raw);
$rut_param = !empty($rut_clean) ? "%" . $rut_clean . "%" : "%";

$tipo = !empty($_GET['tipo']) ? $_GET['tipo'] : "%";
$estado_doc = !empty($_GET['estado_doc']) ? $_GET['estado_doc'] : "%";
// isset permite capturar el "0" (Inactivo)
$estado_cli = (isset($_GET['estado']) && $_GET['estado'] !== '') ? $_GET['estado'] : "%";

$fecha_inicio = !empty($_GET['fecha_inicio']) ? $_GET['fecha_inicio'] . ' 00:00:00' : "1900-01-01 00:00:00";
$fecha_fin = !empty($_GET['fecha_fin']) ? $_GET['fecha_fin'] . ' 23:59:59' : "2100-12-31 23:59:59";

$mostrar = isset($_GET['mostrar_registros']) ? (int)$_GET['mostrar_registros'] : 25;
$pagina = isset($_GET['pagina']) ? (int)$_GET['pagina'] : 1;
$offset = ($pagina - 1) * $mostrar;

// Construimos el WHERE con exactamente 12 parámetros (6 condiciones dobles)
// Eliminamos 'direccion', 'fono' y la búsqueda redundante final para evitar errores
$where_sql = " WHERE (fecha_ingreso BETWEEN ? AND ?)
               AND (tipo LIKE ? OR ? = '%')
               AND (razon_social LIKE ? OR ? = '%')
               AND (REPLACE(REPLACE(rut, '.', ''), '-', '') LIKE ? OR ? = '%')
               AND (activo LIKE ? OR ? = '%')
               AND (estado_documentacion LIKE ? OR ? = '%')";

// Array de parámetros en orden estricto
$params_where = [
    $fecha_inicio, $fecha_fin, 
    $tipo, $tipo, 
    $nombre, $nombre, 
    $rut_param, $rut_param,
    $estado_cli, $estado_cli, 
    $estado_doc, $estado_doc
];
// Tipos: 12 strings ('s')
$types_where = "ssssssssssss";

// --- 4. CONSULTA DE TOTALES (Para Paginación) ---
$sql_count = "SELECT COUNT(*) as total FROM clientes $where_sql";
$stmt_count = $conn->prepare($sql_count);
$stmt_count->bind_param($types_where, ...$params_where);
$stmt_count->execute();
$total_registros = $stmt_count->get_result()->fetch_assoc()['total'];
$total_paginas = ceil($total_registros / $mostrar);
$stmt_count->close();

// --- 5. CONSULTA DE DATOS (Para la Tabla) ---
// Añadimos LIMIT y OFFSET (2 enteros 'i')
$sql_data = "SELECT * FROM clientes $where_sql ORDER BY fecha_ingreso DESC LIMIT ? OFFSET ?";
$params_data = array_merge($params_where, [$mostrar, $offset]);
$types_data = $types_where . "ii";

$stmt_data = $conn->prepare($sql_data);
$stmt_data->bind_param($types_data, ...$params_data);
$stmt_data->execute();
$result_data = $stmt_data->get_result();

$clientes = [];
while ($row = $result_data->fetch_assoc()) {
    $clientes[] = $row;
}
$stmt_data->close();

// --- 6. RESPUESTA JSON ---
echo json_encode([
    "clientes" => $clientes,
    "total_paginas" => $total_paginas,
    "pagina_actual" => $pagina,
    "total_registros" => $total_registros
]);

// Cerrar
if (isset($conn)) $conn->close();
?>