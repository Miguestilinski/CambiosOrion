<?php
// 1. Incluir la conexión centralizada
require_once __DIR__ . '/../../../../data/conexion.php';

// 2. Blindaje de errores (Mantenemos tu seguridad original)
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
    // Verificación de conexión
    if (!isset($conn)) {
        throw new Exception("Error: No se pudo cargar la conexión centralizada.");
    }
    
    // Mantenemos la codificación robusta original de este archivo
    $conn->set_charset("utf8mb4");

    $method = $_SERVER['REQUEST_METHOD'];

    // --- BÚSQUEDA DIVISAS ---
    if ($method === 'GET' && isset($_GET['buscar_divisa'])) {
        $q = $conn->real_escape_string($_GET['buscar_divisa']);
        $sql = "SELECT id, nombre, icono FROM divisas_internas WHERE nombre LIKE '%$q%' LIMIT 10";
        $res = $conn->query($sql);
        $divisas = [];
        if($res) while($r = $res->fetch_assoc()) $divisas[] = $r;
        ob_clean(); echo json_encode($divisas); exit;
    }

    // --- POST: ACTUALIZAR ---
    if ($method === 'POST') {
        $input = json_decode(file_get_contents("php://input"), true);
        if (!$input || !isset($input["id"])) throw new Exception("Datos incompletos");

        $id = intval($input["id"]);
        $nombre = $conn->real_escape_string($input["nombre"] ?? '');
        $tipo = $conn->real_escape_string($input["tipo_cuenta"] ?? 'general');
        $divisa_id = !empty($input["divisa_id"]) ? "'" . $conn->real_escape_string($input["divisa_id"]) . "'" : 'NULL';
        
        $activa = !empty($input["activa"]) ? 1 : 0;
        $cobrar = !empty($input["por_cobrar"]) ? 1 : 0;
        $pagar = !empty($input["por_pagar"]) ? 1 : 0;

        $sql = "UPDATE cuentas SET 
                nombre='$nombre', tipo_cuenta='$tipo', divisa_id=$divisa_id,
                activa=$activa, por_cobrar=$cobrar, por_pagar=$pagar
                WHERE id=$id";

        if ($conn->query($sql)) {
            ob_clean();
            echo json_encode(["success" => true]);
        } else {
            throw new Exception("Error al actualizar: " . $conn->error);
        }
        exit;
    }

    // --- GET: DATOS CUENTA ---
    if (!isset($_GET['id'])) throw new Exception("ID no proporcionado");
    $id = intval($_GET['id']);

    // 1. Info Cuenta (Solo campos existentes)
    $sqlCta = "SELECT c.id, c.nombre, c.tipo_cuenta, c.divisa_id, 
                      c.me_deben, c.debo, c.por_cobrar, c.por_pagar, c.activa,
                      d.nombre AS nombre_divisa 
               FROM cuentas c
               LEFT JOIN divisas_internas d ON c.divisa_id = d.id
               WHERE c.id = $id";
               
    $resCta = $conn->query($sqlCta);
    if ($resCta->num_rows === 0) throw new Exception("Cuenta no encontrada");
    $cuenta = $resCta->fetch_assoc();

    // 2. Operaciones Recientes
    $sqlOp = "(SELECT id, fecha, 'Ingreso' as tipo_transaccion, monto, 'Ingreso' as nombre_cliente FROM ingresos WHERE cuenta_id = $id)
              UNION ALL
              (SELECT id, fecha, 'Egreso' as tipo_transaccion, monto, 'Egreso' as nombre_cliente FROM egresos WHERE cuenta_id = $id)
              ORDER BY fecha DESC LIMIT 50";
    
    $resOp = $conn->query($sqlOp);
    $operaciones = [];
    if($resOp) while($r = $resOp->fetch_assoc()) $operaciones[] = $r;

    ob_clean();
    echo json_encode([
        "cuenta" => $cuenta,
        "operaciones" => $operaciones
    ]);

} catch (Exception $e) {
    ob_clean();
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}

if (isset($conn)) $conn->close();
?>