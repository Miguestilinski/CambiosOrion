<?php
// 1. Incluir la conexión centralizada
// Esto carga headers, gestiona OPTIONS y crea la variable $conn
require_once __DIR__ . '/../../../../data/conexion.php';

// 2. Buffer y Configuración
// Mantenemos ob_start() porque el final de tu archivo usa ob_clean()
ob_start();
ini_set('display_errors', 0);
error_reporting(E_ALL);

// Verificación de seguridad
if (!isset($conn)) {
    die(json_encode(["error" => "Error: No se pudo cargar la conexión centralizada."]));
}

// --- 1. Endpoints de Búsqueda (Simplificados para Utilidades) ---

// Buscar Cuentas (Para pagar desde cuenta administrativa)
if (isset($_GET['buscar_cuenta'])) {
    $q = $conn->real_escape_string($_GET['buscar_cuenta']);
    $sql = "SELECT id, nombre FROM cuentas WHERE nombre LIKE '%$q%' AND tipo_cuenta = 'administrativa' LIMIT 10";
    $res = $conn->query($sql);
    $data = [];
    if($res) while($row = $res->fetch_assoc()) $data[] = $row;
    ob_clean(); echo json_encode($data); exit;
}

// --- 2. Lógica Principal ---

$page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
$limit = isset($_GET['mostrar']) ? (int)$_GET['mostrar'] : 25;
if ($limit < 1) $limit = 25;
$offset = ($page - 1) * $limit;

// Filtros
$numero = $conn->real_escape_string($_GET['numero'] ?? '');
$fecha = $conn->real_escape_string($_GET['fecha'] ?? '');
$tipo_egreso = $conn->real_escape_string($_GET['tipo_egreso'] ?? '');
$caja = $conn->real_escape_string($_GET['caja'] ?? '');
$divisa = $conn->real_escape_string($_GET['divisa'] ?? '');
$estado = $conn->real_escape_string($_GET['estado'] ?? '');
$buscar = $conn->real_escape_string($_GET['buscar'] ?? '');

// FILTRO MAESTRO: Solo Utilidades
$where = "WHERE egresos.categoria = 'Utilidad'";

if ($numero !== '') $where .= " AND egresos.id LIKE '%$numero%'";
if ($fecha !== '') $where .= " AND DATE(egresos.fecha) = '$fecha'";
if ($tipo_egreso !== '') $where .= " AND egresos.tipo_egreso = '$tipo_egreso'";
if ($caja !== '') $where .= " AND cajas.nombre LIKE '%$caja%'";
if ($divisa !== '') $where .= " AND divisas_internas.nombre LIKE '%$divisa%'";
if ($estado !== '') $where .= " AND egresos.estado = '$estado'";

if ($buscar !== '') {
    $where .= " AND (egresos.id LIKE '%$buscar%' 
                 OR egresos.item_utilidad LIKE '%$buscar%' 
                 OR egresos.monto LIKE '%$buscar%' 
                 OR egresos.estado LIKE '%$buscar%')";
}

$sqlBaseJoin = "FROM egresos
             LEFT JOIN cajas ON egresos.caja_id = cajas.id
             LEFT JOIN divisas_internas ON egresos.divisa_id = divisas_internas.id
             LEFT JOIN cuentas ctas ON egresos.cuenta_id = ctas.id";

// Contar
$sqlCount = "SELECT COUNT(*) as total $sqlBaseJoin $where";
$countResult = $conn->query($sqlCount);
$totalRegistros = $countResult ? $countResult->fetch_assoc()['total'] : 0;

// Datos
$sqlData = "SELECT 
                egresos.id, 
                egresos.fecha, 
                egresos.tipo_egreso, 
                egresos.item_utilidad, /* CAMBIO: Traemos el concepto de utilidad */
                cajas.nombre AS caja, 
                ctas.nombre AS cuenta_nombre, 
                egresos.cuenta_id AS cuenta_id,
                divisas_internas.nombre AS divisa, 
                egresos.monto, 
                egresos.estado
            $sqlBaseJoin
            $where
            ORDER BY egresos.fecha DESC 
            LIMIT $limit OFFSET $offset";

$result = $conn->query($sqlData);

$data = [];
if ($result) {
    while ($row = $result->fetch_assoc()) {
        $row['cuenta'] = $row['cuenta_nombre'] ?? $row['cuenta_id'] ?? '';
        $data[] = $row;
    }
}

ob_clean();
echo json_encode([
    "data" => $data,
    "total" => (int)$totalRegistros,
    "page" => $page,
    "limit" => $limit,
    "totalPages" => ceil($totalRegistros / $limit)
]);
$conn->close();
?>