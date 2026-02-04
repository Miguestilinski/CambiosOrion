<?php
// 1. Incluir la conexión centralizada
require_once __DIR__ . '/../../../../data/conexion.php';

// 2. Blindaje de errores (Mantenemos tu función de seguridad original)
register_shutdown_function(function() {
    $error = error_get_last();
    if ($error && ($error['type'] === E_ERROR || $error['type'] === E_PARSE)) {
        if (ob_get_length()) ob_clean();
        http_response_code(500);
        echo json_encode(["error" => "Error Fatal PHP: " . $error['message']]);
        exit;
    }
});

// 3. Buffer y Configuración
ob_start();
ini_set('display_errors', 0);
error_reporting(E_ALL);

try {
    // Verificación de seguridad
    if (!isset($conn)) {
        throw new Exception("Error: No se pudo cargar la conexión centralizada.");
    }

    // Mantenemos la codificación robusta de este archivo
    $conn->set_charset("utf8mb4");

    $method = $_SERVER['REQUEST_METHOD'];

    // --- POST: ANULAR ---
    if ($method === 'POST') {
        $input = json_decode(file_get_contents("php://input"), true);
        
        if (($input['action'] ?? '') === 'anular' && !empty($input['id'])) {
            $id = intval($input['id']);
            
            // Verificar estado actual
            $chk = $conn->query("SELECT estado FROM egresos WHERE id = $id");
            $curr = $chk->fetch_assoc();
            
            if (!$curr) throw new Exception("Egreso no encontrado");
            if ($curr['estado'] === 'Anulado') throw new Exception("Ya está anulado");

            // Actualizar a Anulado
            $sql = "UPDATE egresos SET estado = 'Anulado' WHERE id = $id";
            if ($conn->query($sql)) {
                // AQUÍ SE DEBERÍA REVERTIR EL INVENTARIO/SALDO SI CORRESPONDE
                // (Implementación de reversa pendiente según lógica de negocio)
                
                ob_clean();
                echo json_encode(["success" => true]);
            } else {
                throw new Exception("Error SQL: " . $conn->error);
            }
            exit;
        }
    }

    // --- GET: OBTENER DETALLE ---
    if (!isset($_GET['id'])) throw new Exception("ID no proporcionado");
    $id = intval($_GET['id']);

    // Consulta con JOINs para traer nombres
    $sql = "SELECT 
                e.*,
                c.nombre AS caja_nombre,
                d.nombre AS nombre_divisa,
                cl.razon_social AS nombre_cliente,
                cta.nombre AS nombre_cuenta_destino,
                u.nombre AS usuario_nombre
            FROM egresos e
            LEFT JOIN cajas c ON e.caja_id = c.id
            LEFT JOIN divisas_internas d ON e.divisa_id = d.id
            LEFT JOIN clientes cl ON e.cliente_id = cl.id
            LEFT JOIN cuentas cta ON e.cuenta_id = cta.id
            LEFT JOIN equipo u ON e.usuario_id = u.id
            WHERE e.id = $id";

    $res = $conn->query($sql);
    if (!$res || $res->num_rows === 0) throw new Exception("Egreso no encontrado");
    
    $egreso = $res->fetch_assoc();

    ob_clean();
    echo json_encode(["egreso" => $egreso]);

} catch (Exception $e) {
    ob_clean();
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}

if (isset($conn)) $conn->close();
?>