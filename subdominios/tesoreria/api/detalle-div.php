<?php
// 1. Incluir la conexión centralizada
// Esto carga headers, conexión ($conn) y maneja el Preflight (OPTIONS)
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

    // Aseguramos charset utf8mb4 (igual que tu archivo original)
    $conn->set_charset("utf8mb4");

    $method = $_SERVER['REQUEST_METHOD'];

    // --- GET DETALLE ---
    if ($method === 'GET') {
        if (!isset($_GET['id'])) throw new Exception("ID no proporcionado");
        
        $id = $conn->real_escape_string($_GET['id']);
        $cajaId = isset($_GET['caja_id']) ? intval($_GET['caja_id']) : 0;

        // 1. Info Divisa
        $sql = "SELECT id, nombre, simbolo, codigo, pais, estado, icono, fraccionable, denominacion 
                FROM divisas_internas WHERE id = '$id'";
        $result = $conn->query($sql);

        if (!$result || $result->num_rows === 0) throw new Exception("Divisa no encontrada");
        $divisa = $result->fetch_assoc();

        // 2. Historial de Operaciones
        $filtroCajaSQL = "";
        if ($cajaId > 0) {
            $filtroCajaSQL = " AND o.caja_id = $cajaId ";
        }

        $sqlOp = "SELECT 
                    o.id, 
                    c.razon_social AS nombre_cliente,
                    o.tipo_transaccion, 
                    SUM(do.monto) AS monto, 
                    AVG(do.tasa_cambio) AS tasa_cambio,
                    o.total, 
                    o.estado,
                    DATE_FORMAT(o.fecha, '%Y-%m-%d %H:%i') as fecha,
                    cj.nombre as nombre_caja
                FROM operaciones o
                JOIN detalles_operaciones do ON o.id = do.operacion_id
                LEFT JOIN clientes c ON o.cliente_id = c.id
                LEFT JOIN cajas cj ON o.caja_id = cj.id
                WHERE do.divisa_id = '$id' 
                $filtroCajaSQL 
                GROUP BY o.id
                ORDER BY o.fecha DESC
                LIMIT 50";

        $resultOp = $conn->query($sqlOp);
        $operaciones = [];
        if ($resultOp) {
            while ($row = $resultOp->fetch_assoc()) {
                $operaciones[] = $row;
            }
        }

        // 3. Obtener Nombre de la Caja Filtrada (Para mostrar en el Header)
        $cajaNombre = null;
        if ($cajaId > 0) {
            $stmtCaja = $conn->prepare("SELECT nombre FROM cajas WHERE id = ?");
            $stmtCaja->bind_param("i", $cajaId);
            $stmtCaja->execute();
            $stmtCaja->bind_result($cajaNombre);
            $stmtCaja->fetch();
            $stmtCaja->close();
        }

        ob_clean();
        echo json_encode([
            "divisa" => $divisa, 
            "operaciones" => $operaciones,
            "filtro_caja_aplicado" => ($cajaId > 0),
            "caja_filtrada_id" => $cajaId,
            "caja_filtrada_nombre" => $cajaNombre // <--- Nuevo dato enviado
        ]);
        exit;
    }

    // --- POST EDITAR ---
    if ($method === 'POST') {
        $data = json_decode(file_get_contents("php://input"), true);
        
        $id = $conn->real_escape_string($data['id'] ?? '');
        $nombre = $conn->real_escape_string($data['nombre'] ?? '');
        $codigo = $conn->real_escape_string($data['codigo'] ?? ''); // No se usa en UPDATE generalmente si es clave, pero aquí parece campo normal
        $simbolo = $conn->real_escape_string($data['simbolo'] ?? '');
        $pais = $conn->real_escape_string($data['pais'] ?? ''); 
        $estado = isset($data['estado']) ? intval($data['estado']) : 1;
        $fraccionable = isset($data['fraccionable']) ? intval($data['fraccionable']) : 0;
        $denominacion = $conn->real_escape_string($data['denominacion'] ?? '');
        $icono = $conn->real_escape_string($data['url_icono'] ?? '');

        if (!$id || !$nombre) throw new Exception("Datos incompletos");

        // QUERY CORRECTA
        $sqlUpd = "UPDATE divisas_internas SET 
                    nombre=?, simbolo=?, pais=?, estado=?, icono=?, fraccionable=?, denominacion=? 
                   WHERE id=?";
        
        $stmt = $conn->prepare($sqlUpd);
        if (!$stmt) throw new Exception("Error en prepare: " . $conn->error);

        // BIND CORRECTO: 8 variables -> "sssisiss"
        // s=string, i=int
        // 1. nombre (s), 2. simbolo (s), 3. pais (s), 4. estado (i)
        // 5. icono (s), 6. fraccionable (i), 7. denominacion (s), 8. id (s)
        $stmt->bind_param("sssisiss", $nombre, $simbolo, $pais, $estado, $icono, $fraccionable, $denominacion, $id);
        
        if ($stmt->execute()) {
            ob_clean();
            echo json_encode(["success" => true, "message" => "Divisa actualizada correctamente"]);
        } else {
            throw new Exception("Error al actualizar: " . $stmt->error);
        }
        exit;
    }

} catch (Exception $e) {
    ob_clean();
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}
?>