<?php
// 1. Incluir la conexión centralizada
// Esto carga headers, gestiona OPTIONS y crea la variable $conn
require_once __DIR__ . '/../../../../data/conexion.php';

// 2. Buffer y Configuración
ob_start();
// Importante: Errors en 0 para evitar corromper archivos Excel o JSON
ini_set('display_errors', 0); 
error_reporting(E_ALL);

// 3. Cargar Librerías (Preservamos tu carga de autoload)
require __DIR__ . '/../orionapp/vendor/autoload.php';

use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Alignment;

// Verificación de seguridad
if (!isset($conn)) {
    die(json_encode(["error" => "Error: No se pudo cargar la conexión centralizada."]));
}

// Parametros
$numero_val = !empty($_GET['numero']) ? (int)$_GET['numero'] : 0;
$cliente = !empty($_GET['cliente']) ? "%" . $conn->real_escape_string($_GET['cliente']) . "%" : "%";
$tipo_doc = !empty($_GET['tipo_doc']) ? $conn->real_escape_string($_GET['tipo_doc']) : "%";
$n_doc = !empty($_GET['n_doc']) ? "%" . $conn->real_escape_string($_GET['n_doc']) . "%" : "%";
$n_nota = !empty($_GET['n_nota']) ? "%" . $conn->real_escape_string($_GET['n_nota']) . "%" : "%";
$tipo_transaccion = !empty($_GET['tipo_transaccion']) ? $conn->real_escape_string($_GET['tipo_transaccion']) : "%";
$estado = !empty($_GET['estado']) ? $conn->real_escape_string($_GET['estado']) : "%";
$divisa = !empty($_GET['divisa']) ? "%" . $conn->real_escape_string($_GET['divisa']) . "%" : "%";
$buscar = !empty($_GET['buscar']) ? "%" . $conn->real_escape_string($_GET['buscar']) . "%" : "%";

$fecha_inicio = !empty($_GET['fecha_inicio']) ? $_GET['fecha_inicio'] . ' 00:00:00' : "1900-01-01 00:00:00";
$fecha_fin = !empty($_GET['fecha_fin']) ? $_GET['fecha_fin'] . ' 23:59:59' : "2100-12-31 23:59:59";

$emitidas = isset($_GET['emitidas']);
$no_emitidas = isset($_GET['no_emitidas']);
$sii_sql = "";
if ($emitidas && !$no_emitidas) {
    // Solo emitidas
    $sii_sql = " AND (o.numero_documento IS NOT NULL AND o.numero_documento != '') ";
} elseif (!$emitidas && $no_emitidas) {
    // Solo NO emitidas
    $sii_sql = " AND (o.numero_documento IS NULL OR o.numero_documento = '') ";
}

$mostrar_registros = isset($_GET['mostrar_registros']) ? (int)$_GET['mostrar_registros'] : 25;
$pagina = isset($_GET['pagina']) ? (int)$_GET['pagina'] : 1;
if ($pagina < 1) $pagina = 1;
$offset = ($pagina - 1) * $mostrar_registros;

$where_sql = "
FROM operaciones o
LEFT JOIN detalles_operaciones do ON o.id = do.operacion_id
LEFT JOIN clientes c ON o.cliente_id = c.id
LEFT JOIN (
    SELECT DISTINCT operacion_id, GROUP_CONCAT(DISTINCT d.nombre SEPARATOR ', ') AS divisas
    FROM detalles_operaciones do
    LEFT JOIN divisas_internas d ON do.divisa_id = d.id
    GROUP BY operacion_id
) AS d_agg ON o.id = d_agg.operacion_id
WHERE (? = 0 OR o.id = ?)
  AND (c.razon_social LIKE ? OR ? = '%')
  AND (o.tipo_documento LIKE ? OR ? = '%')
  AND (o.numero_documento LIKE ? OR ? = '%')
  AND (o.numero_nota LIKE ? OR ? = '%')
  AND (o.tipo_transaccion LIKE ? OR ? = '%')
  AND (o.estado LIKE ? OR ? = '%')
  AND (o.fecha BETWEEN ? AND ?)
  AND (c.razon_social LIKE ? OR o.id LIKE ?)
  AND (d_agg.divisas LIKE ? OR ? = '%')
  $sii_sql
";

$params_where = [
    $numero_val, $numero_val,
    $cliente, $cliente,
    $tipo_doc, $tipo_doc,
    $n_doc, $n_doc,
    $n_nota, $n_nota,
    $tipo_transaccion, $tipo_transaccion,
    $estado, $estado,
    $fecha_inicio, $fecha_fin,
    $buscar, $buscar,
    $divisa, $divisa
];
// (2)i + (6)ss + (1)ss + (1)ss + (1)ss = 20 parámetros
$types_where = "iissssssssssssssssss";

// --- BLOQUE EXPORTACIÓN ---
if (isset($_GET['export']) && $_GET['export'] == 'excel') {
    // 1. Limpiar cualquier salida previa (espacios, warnings, etc.)
    if (ob_get_length()) ob_end_clean();

    // Nombre solicitado: Operaciones Orion_H_i_d_m_Y
    $nombreArchivo = "Operaciones Orion_" . date('H_i_d_m_Y') . ".xlsx";

    // 2. Headers ultra-estrictos para Excel
    header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    header('Content-Disposition: attachment;filename="' . $nombreArchivo . '"');
    header('Cache-Control: max-age=0');

    // SQL DEFINITIVO: Filtramos por di.nombre para que solo salgan las filas de la divisa buscada
    $sql_excel = "SELECT 
                DATE_FORMAT(o.fecha, '%d-%m-%Y') as solo_fecha,
                o.id, 
                c.razon_social AS cliente_nombre, 
                c.rut, 
                o.tipo_documento, 
                o.numero_documento, 
                o.tipo_transaccion, 
                di.nombre AS divisa_nombre, 
                do.monto, 
                do.tasa_cambio, 
                do.subtotal, 
                o.total AS total_operacion, 
                o.estado, 
                do.margen
              FROM operaciones o
              LEFT JOIN detalles_operaciones do ON o.id = do.operacion_id
              LEFT JOIN clientes c ON o.cliente_id = c.id
              LEFT JOIN divisas_internas di ON do.divisa_id = di.id
              WHERE (? = 0 OR o.id = ?)
                AND (c.razon_social LIKE ? OR ? = '%')
                AND (o.tipo_documento LIKE ? OR ? = '%')
                AND (o.numero_documento LIKE ? OR ? = '%')
                AND (o.numero_nota LIKE ? OR ? = '%')
                AND (o.tipo_transaccion LIKE ? OR ? = '%')
                AND (o.estado LIKE ? OR ? = '%')
                AND (o.fecha BETWEEN ? AND ?)
                AND (c.razon_social LIKE ? OR o.id LIKE ?)
                AND (di.nombre LIKE ? OR ? = '%') -- FILTRO POR FILA INDIVIDUAL
                $sii_sql
              ORDER BY o.id DESC";

    $stmt = $conn->prepare($sql_excel);
    if (!empty($types_where)) {
        $stmt->bind_param($types_where, ...$params_where);
    }
    $stmt->execute();
    $result = $stmt->get_result();

    $spreadsheet = new Spreadsheet();
    $sheet = $spreadsheet->getActiveSheet();
    $sheet->setTitle('Operaciones');

    // Cabeceras
    $headers = [
        'Fecha', 'Número (ID)', 'Cliente', 'RUT', 'Tipo de documento', 
        'Número de documento', 'Tipo de transacción', 'Divisa', 'Monto', 
        'Tasa de cambio', 'Sub Total', 'Total', 'Estado', 'Margen'
    ];
    $sheet->fromArray($headers, NULL, 'A1');

    // Estilo de Cabecera (Dark)
    $styleHeader = [
        'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
        'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '333333']],
        'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
        'borders' => [
            'vertical' => ['borderStyle' => \PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN, 'color' => ['rgb' => 'FFFFFF']]
        ]
    ];
    $sheet->getStyle('A1:N1')->applyFromArray($styleHeader);

    $rowNum = 2;
    while ($row = $result->fetch_assoc()) {
        $sheet->setCellValue('A' . $rowNum, $row['solo_fecha']);
        $sheet->setCellValue('B' . $rowNum, $row['id']);
        $sheet->setCellValue('C' . $rowNum, $row['cliente_nombre']);
        $sheet->setCellValue('D' . $rowNum, $row['rut']);
        $sheet->setCellValue('E' . $rowNum, $row['tipo_documento']);
        $sheet->setCellValue('F' . $rowNum, $row['numero_documento']);
        $sheet->setCellValue('G' . $rowNum, $row['tipo_transaccion']);
        $sheet->setCellValue('H' . $rowNum, $row['divisa_nombre']);
        $sheet->setCellValue('I' . $rowNum, (float)$row['monto']);
        $sheet->setCellValue('J' . $rowNum, (float)$row['tasa_cambio']);
        $sheet->setCellValue('K' . $rowNum, (float)$row['subtotal']);
        $sheet->setCellValue('L' . $rowNum, (float)$row['total_operacion']);
        $sheet->setCellValue('M' . $rowNum, $row['estado']);
        $sheet->setCellValue('N' . $rowNum, (float)$row['margen']);

        // Estilos de la fila
        $rangoFila = "A$rowNum:N$rowNum";
        $color = ($row['tipo_transaccion'] == 'Compra') ? 'E3F2FD' : 'E8F5E9';
        
        $sheet->getStyle($rangoFila)->applyFromArray([
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => $color]],
            'borders' => [
                'vertical' => ['borderStyle' => \PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN, 'color' => ['rgb' => 'CCCCCC']],
                'outline' => ['borderStyle' => \PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN, 'color' => ['rgb' => 'CCCCCC']]
            ]
        ]);

        $sheet->getStyle('B' . $rowNum)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        // --- FORMATOS NUMÉRICOS PRECISOS ---
        // Formato para montos sin decimales (separador de miles punto)
        $sheet->getStyle("I$rowNum")->getNumberFormat()->setFormatCode('#,##0');
        $sheet->getStyle("K$rowNum:L$rowNum")->getNumberFormat()->setFormatCode('#,##0');
        $sheet->getStyle("N$rowNum")->getNumberFormat()->setFormatCode('#,##0');

        // Formato para Tasa: Oculta la coma y ceros si es entero, muestra decimales si existen
        $sheet->getStyle("J$rowNum")->getNumberFormat()->setFormatCode('#,##0.##########');

        $rowNum++;
    }

    // Auto-ajustar todas las columnas (A hasta N)
    foreach (range('A', 'N') as $col) {
        $sheet->getColumnDimension($col)->setAutoSize(true);
    }

    $writer = new \PhpOffice\PhpSpreadsheet\Writer\Xlsx($spreadsheet);
    $writer->save('php://output');
    exit;
}

if (isset($_GET['get_filter_data'])) {
    // Obtener Clientes
    $clientes = [];
    $sql_c = "SELECT id, razon_social FROM clientes ORDER BY razon_social ASC";
    $res_c = $conn->query($sql_c);
    if($res_c) while($r = $res_c->fetch_assoc()) $clientes[] = $r;

    // Obtener Divisas (Asumiendo campos: id, nombre, codigo, icono)
    // Si tu tabla no tiene campo 'icono', puedes quitarlo del SELECT
    $divisas = [];
    $sql_d = "SELECT id, nombre, codigo, icono FROM divisas_internas ORDER BY nombre ASC"; 
    $res_d = $conn->query($sql_d);
    if($res_d) while($r = $res_d->fetch_assoc()) $divisas[] = $r;

    echo json_encode(['clientes' => $clientes, 'divisas' => $divisas]);
    exit;
}

$sql_count = "SELECT COUNT(DISTINCT o.id) " . $where_sql;
$stmt_count = $conn->prepare($sql_count);
$stmt_count->bind_param($types_where, ...$params_where);
$stmt_count->execute();
$result_count = $stmt_count->get_result();
$row_count = $result_count->fetch_row();
$totalFiltrado = $row_count[0]; // Aquí definimos la variable que faltaba
$stmt_count->close();

// --- LÓGICA DE ORDENAMIENTO ---
$order_by_sql = "o.fecha DESC"; // Orden por defecto

if (isset($_GET['order_by']) && isset($_GET['order_dir'])) {
    $col = $_GET['order_by'];
    $dir = strtoupper($_GET['order_dir']) === 'ASC' ? 'ASC' : 'DESC';

    // Mapeo seguro de columnas permitidas
    $allowed_columns = [
        'fecha' => 'o.fecha',
        'id' => 'o.id',
        'cliente' => 'c.razon_social',
        'tipo_doc' => 'o.tipo_documento',
        'n_doc' => 'o.numero_documento',
        'tipo_transaccion' => 'o.tipo_transaccion',
        'total' => 'o.total',
        'estado' => 'o.estado'
    ];

    if (array_key_exists($col, $allowed_columns)) {
        $order_by_sql = $allowed_columns[$col] . " " . $dir;
    }
}

// 1. CONSULTA DE DATOS (Modificada para traer Códigos y Subtotales)
$sql_data = "SELECT 
    o.id,
    o.fecha,
    c.razon_social AS nombre_cliente,
    o.tipo_transaccion,
    o.tipo_documento,
    o.numero_documento,
    o.numero_nota,
    o.estado,
    o.observaciones,
    o.total,
    GROUP_CONCAT(DISTINCT CONCAT(d.nombre, ':', d.codigo) ORDER BY d.nombre SEPARATOR '|') AS divisas_data,
    GROUP_CONCAT(DISTINCT do.tasa_cambio ORDER BY d.nombre SEPARATOR '|') AS tasas_cambio,
    GROUP_CONCAT(DISTINCT do.monto ORDER BY d.nombre SEPARATOR '|') AS montos_por_divisa,
    GROUP_CONCAT(DISTINCT do.subtotal ORDER BY d.nombre SEPARATOR '|') AS subtotales_por_divisa
FROM operaciones o
LEFT JOIN detalles_operaciones do ON o.id = do.operacion_id
LEFT JOIN divisas_internas d ON do.divisa_id = d.id
LEFT JOIN clientes c ON o.cliente_id = c.id
LEFT JOIN (
    SELECT DISTINCT operacion_id, GROUP_CONCAT(DISTINCT d.nombre SEPARATOR ', ') AS divisas_nombres
    FROM detalles_operaciones do
    LEFT JOIN divisas_internas d ON do.divisa_id = d.id
    GROUP BY operacion_id
) AS d_agg ON o.id = d_agg.operacion_id
WHERE (? = 0 OR o.id = ?)
  AND (c.razon_social LIKE ? OR ? = '%')
  AND (o.tipo_documento LIKE ? OR ? = '%')
  AND (o.numero_documento LIKE ? OR ? = '%')
  AND (o.numero_nota LIKE ? OR ? = '%')
  AND (o.tipo_transaccion LIKE ? OR ? = '%')
  AND (o.estado LIKE ? OR ? = '%')
  AND (o.fecha BETWEEN ? AND ?)
  AND (c.razon_social LIKE ? OR o.id LIKE ?)
  AND (d_agg.divisas_nombres LIKE ? OR ? = '%')
  $sii_sql
GROUP BY o.id
ORDER BY $order_by_sql
LIMIT ? OFFSET ?";

$params_data = $params_where;
$params_data[] = $mostrar_registros;
$params_data[] = $offset;
$types_data = $types_where . "ii";

$stmt_data = $conn->prepare($sql_data);
$stmt_data->bind_param($types_data, ...$params_data);
$stmt_data->execute();
$result_data = $stmt_data->get_result();

$operaciones = [];
while ($row = $result_data->fetch_assoc()) {
    $operaciones[] = $row;
}
$stmt_data->close();

// 2. CÁLCULO DE TOTALES (Lógica "Opción 3")
$totales = [
    'monto' => 0,
    'total' => 0,
    'es_multidivisa' => false, // Flag para el frontend
    'divisa_filtro' => ''      // Para mostrar símbolo (ej: EUR)
];

// Verificamos si hay filtro de divisa activo (parametro 'divisa' en GET)
$filtro_divisa_raw = trim(str_replace('%', '', $divisa));

if (!empty($filtro_divisa_raw)) {
    // CASO A: FILTRADO POR DIVISA -> Suma ESTRICTA de esa divisa
    $totales['divisa_filtro'] = strtoupper($filtro_divisa_raw); 
    
    // Modificamos la query de sumas para ir directo a detalles y filtrar por código/nombre
    // Reutilizamos el $where_sql que ya filtra por fecha, cliente, etc. en la tabla 'o'
    // Pero agregamos la condición específica sobre 'd' (divisa)
    
    $sql_sums_filtered = "SELECT 
        SUM(do.monto) as sum_monto, 
        SUM(do.subtotal) as sum_subtotal
    FROM operaciones o
    LEFT JOIN detalles_operaciones do ON o.id = do.operacion_id
    LEFT JOIN divisas_internas d ON do.divisa_id = d.id
    LEFT JOIN clientes c ON o.cliente_id = c.id
    LEFT JOIN (
        SELECT DISTINCT operacion_id, GROUP_CONCAT(DISTINCT d.nombre SEPARATOR ', ') AS divisas
        FROM detalles_operaciones do
        LEFT JOIN divisas_internas d ON do.divisa_id = d.id
        GROUP BY operacion_id
    ) AS d_agg ON o.id = d_agg.operacion_id
    WHERE (? = 0 OR o.id = ?)
      AND (c.razon_social LIKE ? OR ? = '%')
      AND (o.tipo_documento LIKE ? OR ? = '%')
      AND (o.numero_documento LIKE ? OR ? = '%')
      AND (o.numero_nota LIKE ? OR ? = '%')
      AND (o.tipo_transaccion LIKE ? OR ? = '%')
      AND (o.estado LIKE ? OR ? = '%')
      AND (o.fecha BETWEEN ? AND ?)
      AND (c.razon_social LIKE ? OR o.id LIKE ?)
      AND (d_agg.divisas LIKE ? OR ? = '%')
      $sii_sql
      AND (d.codigo LIKE ? OR d.nombre LIKE ?) -- FILTRO EXTRA PARA SUMA PRECISA
    ";

    // Agregamos los params del filtro extra
    $params_sums = $params_where;
    $params_sums[] = $divisa; // d.codigo LIKE ...
    $params_sums[] = $divisa; // d.nombre LIKE ...
    $types_sums = $types_where . "ss";

    $stmt_sums = $conn->prepare($sql_sums_filtered);
    $stmt_sums->bind_param($types_sums, ...$params_sums);
    $stmt_sums->execute();
    $row_sums = $stmt_sums->get_result()->fetch_assoc();
    
    $totales['monto'] = $row_sums['sum_monto'] ?? 0;
    $totales['total'] = $row_sums['sum_subtotal'] ?? 0; // Suma solo los pesos de esa divisa
    $stmt_sums->close();

} else {
    // CASO B: SIN FILTRO DE DIVISA -> Multidivisa
    $totales['es_multidivisa'] = true;
    
    // Sumamos el TOTAL GLOBAL (CLP) de las operaciones visibles
    // Usamos la misma lógica de subquery anterior para no duplicar por joins
    $sql_sums_query = "SELECT o.total $where_sql GROUP BY o.id";
    $sql_sums_final = "SELECT SUM(total) as sum_total FROM ($sql_sums_query) as sub";

    $stmt_sums = $conn->prepare($sql_sums_final);
    $stmt_sums->bind_param($types_where, ...$params_where);
    $stmt_sums->execute();
    $row_sums = $stmt_sums->get_result()->fetch_assoc();

    $totales['monto'] = 0; // Irrelevante, se mostrará "Multidivisa"
    $totales['total'] = $row_sums['sum_total'] ?? 0;
    $stmt_sums->close();
}

echo json_encode([
    'operaciones' => $operaciones,
    'totalFiltrado' => $totalFiltrado,
    'totales' => $totales
]);

$conn->close();
?>