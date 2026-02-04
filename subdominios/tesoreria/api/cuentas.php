<?php
// 1. Incluir la conexión centralizada
// Carga headers, variables de entorno y la conexión $conn
require_once __DIR__ . '/../../../../data/conexion.php';

// Configuraciones para proteger el JSON
ini_set('display_errors', 0);
error_reporting(E_ALL);

// Verificación de seguridad
if (!isset($conn)) {
    echo json_encode(["error" => "No hay conexión a la base de datos"]);
    exit;
}

// Buscar divisas
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['buscar_divisa'])) {
    $query = $conn->real_escape_string($_GET['buscar_divisa']);
    $divisas = [];
    $sql = "SELECT id, nombre FROM divisas_internas WHERE nombre LIKE '%$query%' LIMIT 10";
    $result = $conn->query($sql);
    while ($row = $result->fetch_assoc()) {
        $divisas[] = ["id" => $row['id'], "nombre" => $row['nombre']];
    }
    echo json_encode($divisas);
    exit;
}

// Obtener parámetros de filtrado (igual que antes)
$id_param = isset($_GET['id']) && $_GET['id'] !== '' ? $_GET['id'] : "%";
$nombre = isset($_GET['nombre']) && $_GET['nombre'] !== '' ? "%" . $conn->real_escape_string($_GET['nombre']) . "%" : '%';
$divisa_id = isset($_GET['divisa_id']) && $_GET['divisa_id'] !== '' ? $_GET['divisa_id'] : "%";
$por_cobrar = isset($_GET['por_cobrar']) && $_GET['por_cobrar'] !== '' ? $_GET['por_cobrar'] : "%";
$por_pagar = isset($_GET['por_pagar']) && $_GET['por_pagar'] !== '' ? $_GET['por_pagar'] : "%";
$tipo_cuenta = isset($_GET['tipo_cuenta']) && $_GET['tipo_cuenta'] !== '' ? $_GET['tipo_cuenta'] : '%';
$activa = isset($_GET['activa']) && $_GET['activa'] !== '' ? $_GET['activa'] : "%";
$buscar = isset($_GET['buscar']) ? "%" . $_GET['buscar'] . "%" : "%";

$mostrar_registros = isset($_GET['mostrar_registros']) ? (int)$_GET['mostrar_registros'] : 25;
$pagina = isset($_GET['pagina']) ? (int)$_GET['pagina'] : 1;
if ($pagina < 1) $pagina = 1;
$offset = ($pagina - 1) * $mostrar_registros;

$where_sql = " FROM cuentas c
               LEFT JOIN divisas_internas d ON c.divisa_id = d.id
               WHERE (c.id LIKE ? OR ? = '%') 
                 AND (c.nombre LIKE ? OR ? = '%')
                 AND (c.divisa_id LIKE ? OR ? = '%') 
                 AND (c.por_cobrar LIKE ? OR ? = '%') 
                 AND (c.por_pagar LIKE ? OR ? = '%') 
                 AND (c.activa LIKE ? OR ? = '%') 
                 AND (c.id LIKE ? OR c.nombre LIKE ?) 
                 AND (c.tipo_cuenta LIKE ? OR ? = '%')";

$params_where = [
    $id_param, $id_param,
    $nombre, $nombre,
    $divisa_id, $divisa_id,
    $por_cobrar, $por_cobrar,
    $por_pagar, $por_pagar,
    $activa, $activa,
    $buscar, $buscar,
    $tipo_cuenta, $tipo_cuenta
];
$types_where = "ssssssssssssssss"; // 16 's'

$sql_data = "SELECT c.*, 
                    d.nombre AS divisa, 
                    d.icono AS divisa_icono, -- Añadir icono
                    CASE WHEN c.activa = 1 THEN 'Activa' ELSE 'Inactiva' END AS activa_texto,
                    CASE WHEN c.por_cobrar = 1 THEN 'Sí' ELSE 'No' END AS por_cobrar_texto,
                    CASE WHEN c.por_pagar = 1 THEN 'Sí' ELSE 'No' END AS por_pagar_texto
            $where_sql 
            LIMIT ? OFFSET ?";

$params_data = $params_where;
$params_data[] = $mostrar_registros;
$params_data[] = $offset;
$types_data = $types_where . "ii"; // 16 's' + 2 'i'

$stmt_data = $conn->prepare($sql_data);
$stmt_data->bind_param($types_data, ...$params_data);
$stmt_data->execute();
$result_data = $stmt_data->get_result();

// Crear el array de resultados
$cuentas = [];
while ($row = $result_data->fetch_assoc()) {
    $cuentas[] = $row;
}
$stmt_data->close();

$sql_count = "SELECT COUNT(*) as total $where_sql";
$stmt_count = $conn->prepare($sql_count);
$stmt_count->bind_param($types_where, ...$params_where);
$stmt_count->execute();
$result_count = $stmt_count->get_result();
$row_count = $result_count->fetch_assoc();
$totalFiltrado = (int)$row_count['total'];
$stmt_count->close();

// Devolver los resultados en formato JSON
echo json_encode([
    'cuentas' => $cuentas,         // Cambiado de 'clientes' a 'cuentas'
    'totalFiltrado' => $totalFiltrado
]);

// Cerrar conexión
if (isset($conn)) $conn->close();
?>