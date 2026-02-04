<?php
// 1. Incluir la conexión centralizada
// Esto carga headers, maneja el OPTIONS y crea la variable $conn
require_once __DIR__ . '/../../../../data/conexion.php';

// 2. Configuraciones locales (Mantenemos tu configuración original)
ini_set('display_errors', 0);
error_reporting(E_ALL);

// Verificación de seguridad
if (!isset($conn)) {
    die(json_encode(["error" => "Error: No se pudo cargar la conexión centralizada."]));
}

// --- POST: Anular Egreso de Utilidad ---
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    if (($data['action'] ?? '') === 'anular' && !empty($data['id'])) {
        $id = intval($data['id']);
        
        // 1. Obtener datos para revertir
        // Validamos que sea categoria Utilidad para seguridad
        $q = $conn->query("SELECT monto, divisa_id, caja_id, estado FROM egresos WHERE id = $id AND categoria='Utilidad'");
        $egreso = $q->fetch_assoc();
        
        if (!$egreso) { echo json_encode(["success"=>false, "message"=>"Egreso no encontrado o no es de Utilidad"]); exit; }
        if ($egreso['estado'] === 'Anulado') { echo json_encode(["success"=>false, "message"=>"Ya está anulado"]); exit; }

        $conn->begin_transaction();
        try {
            // 2. Cambiar estado a Anulado
            $conn->query("UPDATE egresos SET estado = 'Anulado' WHERE id = $id");
            
            // 3. Devolver dinero al inventario (Tabla 'inventarios')
            $stmt = $conn->prepare("UPDATE inventarios SET cantidad = cantidad + ? WHERE divisa_id = ? AND caja_id = ?");
            $stmt->bind_param("dsi", $egreso['monto'], $egreso['divisa_id'], $egreso['caja_id']);
            $stmt->execute();
            
            $conn->commit();
            echo json_encode(["success" => true]);
        } catch (Exception $e) {
            $conn->rollback();
            echo json_encode(["success" => false, "message" => $e->getMessage()]);
        }
        exit;
    }
}

// --- GET: Obtener Detalle ---
if (!isset($_GET['id'])) {
    echo json_encode(['error' => 'ID no proporcionado']);
    exit;
}
$id = intval($_GET['id']);

$sql = "
    SELECT 
        e.id,
        e.estado,
        e.tipo_egreso,
        e.monto,
        e.observaciones AS detalle,
        e.fecha,
        e.item_utilidad, -- El concepto o beneficiario
        
        -- Caja Origen
        c.nombre AS nombre_caja,

        -- Cajero Responsable
        IFNULL(eq.nombre, 'Sistema') AS nombre_cajero,
        
        -- Divisa
        d.nombre AS nombre_divisa,
        d.simbolo AS simbolo_divisa,
        d.icono AS icono_divisa,
        
        -- Cuenta Destino (si fue transferencia a cuenta propia o externa guardada)
        cta.nombre AS nombre_cuenta_destino,
        d_cta.codigo AS moneda_cuenta
        
    FROM egresos e
    LEFT JOIN cajas c ON e.caja_id = c.id
    LEFT JOIN divisas_internas d ON e.divisa_id = d.id
    LEFT JOIN cuentas cta ON e.cuenta_id = cta.id
    LEFT JOIN divisas_internas d_cta ON cta.divisa_id = d_cta.id
    LEFT JOIN equipo eq ON e.usuario_id = eq.id
    WHERE e.id = $id AND e.categoria = 'Utilidad'
";

$res = $conn->query($sql);

if (!$res) { echo json_encode(['error' => 'Error SQL: ' . $conn->error]); exit; }
if ($res->num_rows === 0) { echo json_encode(['error' => 'Retiro no encontrado']); exit; }

$egreso = $res->fetch_assoc();

echo json_encode(['egreso' => $egreso]);
$conn->close();
?>