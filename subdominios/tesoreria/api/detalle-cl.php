<?php
// 1. Incluir la conexión centralizada
// Esto reemplaza tus headers manuales y la creación de $conn
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

// 3. Configuraciones de entorno
ob_start(); // Iniciamos buffer para poder usar ob_clean() en tu catch
ini_set('display_errors', 0);
error_reporting(E_ALL);

try {
    // Verificación de seguridad
    if (!isset($conn)) {
        throw new Exception("Error: No se pudo cargar la conexión centralizada.");
    }

    // --- POST: ACTUALIZAR CLIENTE ---
    if ($method === 'POST') {
        $input = json_decode(file_get_contents("php://input"), true);

        if (!$input || !isset($input["id"])) throw new Exception("Datos incompletos");

        $id = $conn->real_escape_string($input["id"]);
        $razon = $conn->real_escape_string($input["razon_social"] ?? '');
        $rut = $conn->real_escape_string($input["rut"] ?? '');
        $correo = $conn->real_escape_string($input["correo"] ?? '');
        $fono = $conn->real_escape_string($input["fono"] ?? '');
        $dir = $conn->real_escape_string($input["direccion"] ?? '');
        $activo = isset($input["activo"]) && $input["activo"] ? 1 : 0;

        $sql = "UPDATE clientes SET 
                razon_social='$razon', rut='$rut', correo='$correo', 
                fono='$fono', direccion='$dir', activo=$activo 
                WHERE id='$id'";

        if ($conn->query($sql)) {
            ob_clean();
            echo json_encode(["success" => true]);
        } else {
            throw new Exception("Error al actualizar: " . $conn->error);
        }
        exit;
    }

    // --- GET: OBTENER CLIENTE Y OPERACIONES ---
    if (!isset($_GET['id'])) throw new Exception("ID no proporcionado");
    
    $id = $conn->real_escape_string($_GET['id']);

    // 1. Cliente
    $sqlCl = "SELECT id, fecha_ingreso, tipo, razon_social, rut, correo, direccion, fono, activo, estado_documentacion
              FROM clientes WHERE id = '$id'";
    $resCl = $conn->query($sqlCl);
    
    if ($resCl->num_rows === 0) throw new Exception("Cliente no encontrado");
    $cliente = $resCl->fetch_assoc();

    // 2. Operaciones
    $sqlOp = "SELECT 
                o.id, 
                o.tipo_transaccion, 
                MAX(d.nombre) AS divisa, -- Simplificado si hay multiples divisas
                SUM(do.monto) AS monto,
                AVG(do.tasa_cambio) AS tasa_cambio,
                o.total, 
                o.estado,
                o.fecha
            FROM operaciones o
            LEFT JOIN detalles_operaciones do ON o.id = do.operacion_id
            LEFT JOIN divisas_internas d ON do.divisa_id = d.id
            WHERE o.cliente_id = '$id'
            GROUP BY o.id
            ORDER BY o.fecha DESC
            LIMIT 100"; // Límite razonable para historial inmediato

    $resOp = $conn->query($sqlOp);
    $operaciones = [];
    if($resOp) {
        while($row = $resOp->fetch_assoc()) {
            $operaciones[] = $row;
        }
    }

    ob_clean();
    echo json_encode([
        "cliente" => $cliente,
        "operaciones" => $operaciones
    ]);

} catch (Exception $e) {
    ob_clean();
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}

if (isset($conn)) $conn->close();
?>