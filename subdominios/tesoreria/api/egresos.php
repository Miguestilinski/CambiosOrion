<?php
// 1. Incluir la conexión centralizada
// Esto carga headers, gestiona OPTIONS y crea la variable $conn
require_once __DIR__ . '/../../../../data/conexion.php';

// 2. Buffer y Configuración
// Mantenemos ob_start() para proteger la salida JSON de errores previos
ob_start();
ini_set('display_errors', 0);
error_reporting(E_ALL);

try {
    // Verificación de seguridad
    if (!isset($conn)) {
        throw new Exception("Error: No se pudo cargar la conexión centralizada.");
    }

    // --- 1. Endpoints de Búsqueda Dinámica ---

    // Buscar Clientes
    if (isset($_GET['buscar_cliente'])) {
        $q = $conn->real_escape_string($_GET['buscar_cliente']);
        $sql = "SELECT id, razon_social FROM clientes WHERE razon_social LIKE '%$q%' LIMIT 10";
        $res = $conn->query($sql);
        $data = [];
        if($res) while($row = $res->fetch_assoc()) $data[] = $row;
        ob_clean(); echo json_encode($data); exit;
    }

    // Buscar Cuentas
    if (isset($_GET['buscar_cuenta'])) {
        $q = $conn->real_escape_string($_GET['buscar_cuenta']);
        $sql = "SELECT id, nombre FROM cuentas WHERE nombre LIKE '%$q%' OR id LIKE '%$q%' LIMIT 10";
        $res = $conn->query($sql);
        $data = [];
        if($res) while($row = $res->fetch_assoc()) $data[] = $row;
        ob_clean(); echo json_encode($data); exit;
    }

    // Buscar Divisas
    if (isset($_GET['buscar_divisa'])) {
        $q = $conn->real_escape_string($_GET['buscar_divisa']);
        $sql = "SELECT id, nombre FROM divisas_internas WHERE nombre LIKE '%$q%' LIMIT 10";
        $res = $conn->query($sql);
        $data = [];
        if($res) while($row = $res->fetch_assoc()) $data[] = $row;
        ob_clean(); echo json_encode($data); exit;
    }

    // --- 2. Lógica Principal de Egresos (SOLO OPERACIONALES) ---
    
    // Variables y Filtros
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $limit = isset($_GET['mostrar']) ? (int)$_GET['mostrar'] : 25;
    if ($limit < 1) $limit = 25;
    $offset = ($page - 1) * $limit;

    // Obtener filtros del request
    $numero = $conn->real_escape_string($_GET['numero'] ?? '');
    $fecha = $conn->real_escape_string($_GET['fecha'] ?? '');
    $tipo_egreso = $conn->real_escape_string($_GET['tipo_egreso'] ?? ''); 
    $cliente = $conn->real_escape_string($_GET['cliente'] ?? '');
    $caja = $conn->real_escape_string($_GET['caja'] ?? '');
    $cuenta = $conn->real_escape_string($_GET['cuenta'] ?? '');
    $divisa = $conn->real_escape_string($_GET['divisa'] ?? '');
    $estado = $conn->real_escape_string($_GET['estado'] ?? '');
    $buscar = $conn->real_escape_string($_GET['buscar'] ?? '');

    // --- CORRECCIÓN AQUÍ ---
    // Filtramos explícitamente solo la categoría 'Operacional'
    $where = "WHERE egresos.categoria = 'Operacional'";

    if ($numero !== '') $where .= " AND egresos.id LIKE '%$numero%'";
    if ($fecha !== '') $where .= " AND DATE(egresos.fecha) = '$fecha'";
    if ($tipo_egreso !== '') $where .= " AND egresos.tipo_egreso = '$tipo_egreso'";
    if ($cliente !== '') $where .= " AND clientes.razon_social LIKE '%$cliente%'";
    if ($caja !== '') $where .= " AND cajas.nombre LIKE '%$caja%'";
    if ($cuenta !== '') $where .= " AND (ctas.nombre LIKE '%$cuenta%' OR egresos.cuenta_id LIKE '%$cuenta%')";
    if ($divisa !== '') $where .= " AND divisas_internas.nombre LIKE '%$divisa%'";
    if ($estado !== '') $where .= " AND egresos.estado = '$estado'";

    if ($buscar !== '') {
        $where .= " AND (egresos.id LIKE '%$buscar%' 
                     OR egresos.tipo_egreso LIKE '%$buscar%' 
                     OR clientes.razon_social LIKE '%$buscar%' 
                     OR egresos.monto LIKE '%$buscar%' 
                     OR egresos.estado LIKE '%$buscar%')";
    }

    // JOINs (Tabla principal: egresos)
    $sqlBaseJoin = "FROM egresos
                 LEFT JOIN cajas ON egresos.caja_id = cajas.id
                 LEFT JOIN divisas_internas ON egresos.divisa_id = divisas_internas.id
                 LEFT JOIN clientes ON egresos.cliente_id = clientes.id
                 LEFT JOIN cuentas ctas ON egresos.cuenta_id = ctas.id";

    // Contar Total (Aplicando el filtro Operacional)
    $sqlCount = "SELECT COUNT(*) as total $sqlBaseJoin $where";
    $countResult = $conn->query($sqlCount);
    $totalRegistros = $countResult->fetch_assoc()['total'];

    // Obtener Datos
    $sqlData = "SELECT 
                    egresos.id, 
                    egresos.fecha, 
                    egresos.tipo_egreso, 
                    clientes.razon_social AS cliente, 
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
    while ($row = $result->fetch_assoc()) {
        // Lógica visual para Cuenta
        $nombreCuenta = $row['cuenta_nombre'];
        if (empty($nombreCuenta)) {
            $nombreCuenta = $row['cuenta_id'] ?? '';
        }
        $row['cuenta'] = $nombreCuenta; 
        
        $data[] = $row;
    }

    $response = [
        "data" => $data,
        "total" => (int)$totalRegistros,
        "page" => $page,
        "limit" => $limit,
        "totalPages" => ceil($totalRegistros / $limit)
    ];

    ob_clean();
    echo json_encode($response);

} catch (Exception $e) {
    ob_clean();
    http_response_code(500);
    echo json_encode(["error" => "Error del Servidor: " . $e->getMessage()]);
}

$conn->close();
?>