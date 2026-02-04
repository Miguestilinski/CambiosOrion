<?php
// 1. Incluir la conexión centralizada
require_once __DIR__ . '/../../../../data/conexion.php';

// 2. Blindaje de errores (Mantenemos tu función original)
register_shutdown_function(function() {
    $error = error_get_last();
    if ($error && ($error['type'] === E_ERROR || $error['type'] === E_PARSE || $error['type'] === E_CORE_ERROR)) {
        if (ob_get_length()) ob_clean();
        http_response_code(500);
        echo json_encode(["error" => "Error Fatal PHP: " . $error['message'] . " en línea " . $error['line']]);
        exit;
    }
});

// 3. Buffer y Configuración
// Mantenemos ob_start() para proteger la salida JSON
ob_start();
ini_set('display_errors', 0);
error_reporting(E_ALL);

try {
    // Verificación de seguridad
    if (!isset($conn)) {
        throw new Exception("Error: No se pudo cargar la conexión centralizada.");
    }

    // --- PARÁMETROS ---
    $modo = $_GET['tipo'] ?? 'Operaciones';
    $periodo = $_GET['periodo'] ?? 'dia';
    
    // Fechas
    $dia = $_GET['dia'] ?? date('Y-m-d');
    $mes = $_GET['mes'] ?? date('m');
    $año = $_GET['año'] ?? date('Y');
    $trimestre = $_GET['trimestre'] ?? 1;

    $fecha_inicio = date('Y-m-d 00:00:00');
    $fecha_fin = date('Y-m-d 23:59:59');

    // Lógica de Rangos
    if ($periodo === 'dia') {
        $fecha_inicio = "$dia 00:00:00";
        $fecha_fin = "$dia 23:59:59";
    } elseif ($periodo === 'mes') {
        $fecha_inicio = "$año-$mes-01 00:00:00";
        $fecha_fin = date("Y-m-t 23:59:59", strtotime($fecha_inicio));
    } elseif ($periodo === 'trimestre') {
        $mes_inicio = ($trimestre - 1) * 3 + 1;
        $mes_fin = $mes_inicio + 2;
        $fecha_inicio = "$año-" . str_pad($mes_inicio, 2, '0', STR_PAD_LEFT) . "-01 00:00:00";
        $fecha_fin = date("Y-m-t 23:59:59", strtotime("$año-" . str_pad($mes_fin, 2, '0', STR_PAD_LEFT) . "-01"));
    } elseif ($periodo === 'año') {
        $fecha_inicio = "$año-01-01 00:00:00";
        $fecha_fin = "$año-12-31 23:59:59";
    }

    // --- CONSULTAS SQL ---

    $posiciones = [];
    $compras = [];
    $ventas = [];

    // Validar Tablas: Intentamos usar 'operaciones_detalle' (singular)
    // Si tus tablas tienen otro nombre, ajusta aquí.
    
    if ($modo === 'Operaciones') {
        // 1. TABLA PRINCIPAL (Agrupado por Divisa)
        // Se asume que operaciones_detalle tiene: operacion_id, divisa_id, monto, tasa_cambio
        $sqlPos = "SELECT 
                        d.nombre AS nombre_divisa,
                        d.icono,
                        SUM(det.monto) as cantidad_total,
                        SUM(det.monto * det.tasa_cambio) as monto_clp_total
                   FROM operaciones_detalle det
                   JOIN operaciones op ON det.operacion_id = op.id
                   LEFT JOIN divisas_internas d ON det.divisa_id = d.id
                   WHERE op.fecha BETWEEN '$fecha_inicio' AND '$fecha_fin'
                   AND op.estado = 'Vigente'
                   GROUP BY det.divisa_id";

        $res = $conn->query($sqlPos);
        if ($res) {
            while ($row = $res->fetch_assoc()) {
                $cant = floatval($row['cantidad_total']);
                $total = floatval($row['monto_clp_total']);
                $promedio = $cant > 0 ? $total / $cant : 0;
                
                $posiciones[] = [
                    'nombre' => $row['nombre_divisa'] ?? 'Desconocida',
                    'icono' => $row['icono'],
                    'cantidad' => $cant,
                    'promedio' => $promedio,
                    'monto_total' => $total
                ];
            }
        }

        // 2. GRÁFICOS (Compras vs Ventas)
        // Compras
        $sqlC = "SELECT d.nombre, SUM(det.monto * det.tasa_cambio) as total 
                 FROM operaciones_detalle det
                 JOIN operaciones op ON det.operacion_id = op.id
                 LEFT JOIN divisas_internas d ON det.divisa_id = d.id
                 WHERE op.tipo_transaccion = 'Compra' 
                 AND op.fecha BETWEEN '$fecha_inicio' AND '$fecha_fin' 
                 AND op.estado = 'Vigente'
                 GROUP BY d.nombre";
        $resC = $conn->query($sqlC);
        if($resC) while($r = $resC->fetch_assoc()) $compras[] = ['nombre' => $r['nombre'], 'monto_total' => $r['total']];

        // Ventas
        $sqlV = "SELECT d.nombre, SUM(det.monto * det.tasa_cambio) as total 
                 FROM operaciones_detalle det
                 JOIN operaciones op ON det.operacion_id = op.id
                 LEFT JOIN divisas_internas d ON det.divisa_id = d.id
                 WHERE op.tipo_transaccion = 'Venta' 
                 AND op.fecha BETWEEN '$fecha_inicio' AND '$fecha_fin' 
                 AND op.estado = 'Vigente'
                 GROUP BY d.nombre";
        $resV = $conn->query($sqlV);
        if($resV) while($r = $resV->fetch_assoc()) $ventas[] = ['nombre' => $r['nombre'], 'monto_total' => $r['total']];

    } 
    elseif ($modo === 'Ingresos') {
        // Ingresos: Usualmente no tienen tabla detalle, usan la tabla 'ingresos' directa
        $sql = "SELECT divisa, SUM(monto) as total FROM ingresos 
                WHERE fecha BETWEEN '$fecha_inicio' AND '$fecha_fin' 
                AND estado = 'Vigente' 
                GROUP BY divisa";
        $res = $conn->query($sql);
        if ($res) {
            while ($row = $res->fetch_assoc()) {
                $posiciones[] = [
                    'nombre' => $row['divisa'],
                    'icono' => null,
                    'cantidad' => 1, // Dummy
                    'promedio' => 0,
                    'monto_total' => floatval($row['total'])
                ];
                // Para ingresos, llenamos "Compras" como entrada positiva
                $compras[] = ['nombre' => $row['divisa'], 'monto_total' => floatval($row['total'])];
            }
        }
    } 
    elseif ($modo === 'Egresos') {
        $sql = "SELECT divisa, SUM(monto) as total FROM egresos 
                WHERE fecha BETWEEN '$fecha_inicio' AND '$fecha_fin' 
                AND estado = 'Vigente' 
                GROUP BY divisa";
        $res = $conn->query($sql);
        if ($res) {
            while ($row = $res->fetch_assoc()) {
                $posiciones[] = [
                    'nombre' => $row['divisa'],
                    'icono' => null,
                    'cantidad' => 1, 
                    'promedio' => 0,
                    'monto_total' => floatval($row['total'])
                ];
                $ventas[] = ['nombre' => $row['divisa'], 'monto_total' => floatval($row['total'])];
            }
        }
    }

    // Limpiar buffer y enviar JSON puro
    ob_clean();
    echo json_encode([
        'posiciones_divisas' => $posiciones,
        'compras_divisas' => $compras,
        'ventas_divisas' => $ventas,
        'debug' => "Rango: $fecha_inicio a $fecha_fin"
    ]);

} catch (Exception $e) {
    ob_clean();
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

if ($conn) $conn->close();
?>