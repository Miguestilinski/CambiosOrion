<?php
// 1. Incluir la conexión centralizada
// Esto maneja los headers, el OPTIONS y la variable $conn
require_once __DIR__ . '/../../../../data/conexion.php';

// 2. Configuración local de errores
ini_set('display_errors', 0);
error_reporting(E_ALL);

// 3. Validación de conexión
if (!isset($conn)) {
    die(json_encode(["error" => "Error: No se cargó la conexión centralizada."]));
}

// --- POST: ANULAR TRASPASO ---
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $id = intval($data['id'] ?? 0);
    $action = $data['action'] ?? '';

    if ($action === 'anular' && $id > 0) {
        
        // 1. Obtener estado actual
        $sql = "SELECT id, estado, origen_id, destino_id, divisa_id, monto FROM traspasos WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $res = $stmt->get_result();
        $tp = $res->fetch_assoc();
        $stmt->close();

        if (!$tp) { echo json_encode(["success"=>false, "message"=>"Traspaso no encontrado"]); exit; }
        if ($tp['estado'] === 'Anulado') { echo json_encode(["success"=>false, "message"=>"Ya está anulado"]); exit; }

        $conn->begin_transaction();
        try {
            // Caso A: Si estaba 'Pendiente', no se movió inventario, solo cambiamos estado.
            if ($tp['estado'] === 'Pendiente') {
                $conn->query("UPDATE traspasos SET estado='Anulado' WHERE id=$id");
            } 
            // Caso B: Si estaba 'Pagado' (Completado), el dinero se movió. Hay que revertirlo.
            else if ($tp['estado'] === 'Pagado' || $tp['estado'] === 'Completado') {
                
                // 1. Devolver dinero al Origen (Sumar)
                $stmtRev1 = $conn->prepare("UPDATE inventario_tesoreria SET cantidad = cantidad + ? WHERE divisa_id = ? AND caja_id = ?");
                $stmtRev1->bind_param("dsi", $tp['monto'], $tp['divisa_id'], $tp['origen_id']);
                $stmtRev1->execute();

                // 2. Quitar dinero del Destino (Restar)
                // Nota: Podría quedar negativo si el destino ya gastó la plata, pero es necesario para cuadrar.
                $stmtRev2 = $conn->prepare("UPDATE inventario_tesoreria SET cantidad = cantidad - ? WHERE divisa_id = ? AND caja_id = ?");
                $stmtRev2->bind_param("dsi", $tp['monto'], $tp['divisa_id'], $tp['destino_id']);
                $stmtRev2->execute();

                // 3. Marcar como Anulado
                $conn->query("UPDATE traspasos SET estado='Anulado' WHERE id=$id");
            }

            $conn->commit();
            echo json_encode(["success" => true]);

        } catch (Exception $e) {
            $conn->rollback();
            echo json_encode(["success" => false, "message" => "Error DB: " . $e->getMessage()]);
        }
        exit;
    }
}

// --- GET: OBTENER DETALLE ---
if (!isset($_GET['id'])) {
    echo json_encode(['error' => 'ID no proporcionado']);
    exit;
}
$id = intval($_GET['id']);

$sql = "
    SELECT 
        t.id,
        t.fecha,
        t.monto,
        t.estado,
        t.observaciones,
        t.metodo_pago,
        
        -- Origen
        c_orig.nombre AS origen,
        
        -- Destino
        c_dest.nombre AS destino,
        
        -- Divisa
        d.nombre AS divisa,
        d.simbolo,
        d.codigo,
        d.icono,
        
        -- Usuario
        u.nombre AS usuario

    FROM traspasos t
    LEFT JOIN cajas c_orig ON t.origen_id = c_orig.id
    LEFT JOIN cajas c_dest ON t.destino_id = c_dest.id
    LEFT JOIN divisas_internas d ON t.divisa_id = d.id
    LEFT JOIN equipo u ON t.usuario_id = u.id
    WHERE t.id = ?
";

$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $id);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode(['error' => 'Traspaso no encontrado']);
    exit;
}

$traspaso = $result->fetch_assoc();

echo json_encode(['traspaso' => $traspaso]);
$conn->close();
?>