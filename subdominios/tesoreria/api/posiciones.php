<?php
// 1. Incluir la conexión centralizada
require_once __DIR__ . '/../../../../data/conexion.php';

// 2. Configuración de Errores
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Verificación de seguridad
if (!isset($conn)) {
    die(json_encode(["error" => "Error: No se pudo cargar la conexión centralizada."]));
}

// --- Bloque para obtener lista de divisas (Autocompletado)
if (isset($_GET['action']) && $_GET['action'] === 'divisas') {
    $sql = "SELECT id, nombre, codigo, icono FROM divisas_internas ORDER BY nombre ASC";
    $result = $conn->query($sql);
    
    $divisas = [];
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $divisas[] = $row;
        }
    }
    // Devolvemos array directo o envuelto, aquí envuelto por consistencia
    echo json_encode(["divisas" => $divisas]);
    $conn->close();
    exit;
}

// --- Obtener parámetros de filtrado ---
$divisa_param = isset($_GET['divisa']) ? "%" . $conn->real_escape_string($_GET['divisa']) . "%" : "%";
$buscar = isset($_GET['buscar']) ? "%" . $conn->real_escape_string($_GET['buscar']) . "%" : "%";

// Paginación
$mostrar_registros = isset($_GET['mostrar_registros']) ? (int)$_GET['mostrar_registros'] : 25;
$pagina = isset($_GET['pagina']) ? (int)$_GET['pagina'] : 1;
if ($pagina < 1) $pagina = 1;
$offset = ($pagina - 1) * $mostrar_registros;

// --- Consulta SQL: Agrupar todo el inventario por divisa ---
$sql_base = "
    SELECT 
        d.nombre AS divisa,
        d.icono,
        SUM(i.cantidad) AS total_cantidad,
        SUM(i.cantidad * i.pmp) AS total_valor_ponderado
    FROM inventarios i
    JOIN divisas_internas d ON i.divisa_id = d.id COLLATE utf8mb4_general_ci
    LEFT JOIN cajas c ON i.caja_id = c.id
    WHERE c.estado = 1 -- Solo cajas activas
      AND (
          d.nombre LIKE ? 
          OR d.codigo LIKE ?
          OR ? = '%'
      )
      AND (d.nombre LIKE ? OR ? = '%') -- Búsqueda general antigua (opcional mantenerla)
    GROUP BY i.divisa_id
";

$stmt = $conn->prepare($sql_base);
$stmt->bind_param("sssss", $divisa_param, $divisa_param, $divisa_param, $buscar, $buscar);
$stmt->execute();
$result = $stmt->get_result();

$data_completa = [];

while ($row = $result->fetch_assoc()) {
    $cantidad = floatval($row['total_cantidad']);
    $valor_ponderado = floatval($row['total_valor_ponderado']);
    
    // Evitar división por cero
    $pmp_global = ($cantidad != 0) ? ($valor_ponderado / $cantidad) : 0;
    $total_global = $cantidad * $pmp_global;

    // Filtros numéricos (Monto, Precio) - Filtrado manual en PHP
    $filtro_monto = $_GET['monto'] ?? '';
    $filtro_precio = $_GET['precio'] ?? '';
    
    if ($filtro_monto !== '' && strpos((string)$cantidad, $filtro_monto) === false) continue;
    if ($filtro_precio !== '' && strpos((string)$pmp_global, $filtro_precio) === false) continue;

    $data_completa[] = [
        'divisa' => $row['divisa'],
        'icono' => $row['icono'],
        'cantidad' => $cantidad,
        'pmp' => $pmp_global,
        'total' => $total_global
    ];
}
$stmt->close();

// --- Paginación Manual (sobre el array) ---
$totalFiltrado = count($data_completa);
$data_paginada = array_slice($data_completa, $offset, $mostrar_registros);

echo json_encode([
    'posiciones' => $data_paginada,
    'totalFiltrado' => $totalFiltrado
]);

$conn->close();
?>