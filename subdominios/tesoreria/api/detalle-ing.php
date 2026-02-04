<?php
// 1. Incluir la conexión centralizada
// Esto carga los headers, gestiona el OPTIONS y crea la variable $conn
require_once __DIR__ . '/../../../../data/conexion.php';

// 2. Configuración local de errores
// Lo ponemos en 0 para evitar que alertas de PHP rompan el JSON
ini_set('display_errors', 0);
error_reporting(E_ALL);

// 3. Validación de conexión
if (!isset($conn)) {
    die(json_encode(["error" => "Error de conexión: No se cargó conexion.php"]));
}

$method = $_SERVER['REQUEST_METHOD'];

// --- MANEJAR POST (Anular Ingreso) ---
if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $id_ingreso = $data['id'] ?? null;
    $accion = $data['action'] ?? null;

    if ($accion === 'anular' && $id_ingreso) {
        $stmt = $conn->prepare("UPDATE ingresos SET estado = 'Anulado' WHERE id = ?");
        $stmt->bind_param("i", $id_ingreso);
        
        if ($stmt->execute()) {
            echo json_encode(["success" => true, "message" => "Ingreso anulado"]);
        } else {
            echo json_encode(["success" => false, "message" => "Error al anular: " . $stmt->error]);
        }
        $stmt->close();
        $conn->close();
        exit;
    }
    echo json_encode(["success" => false, "message" => "Acción POST no válida"]);
    $conn->close();
    exit;
}

// --- MANEJAR GET (Obtener Detalles) ---
if (!isset($_GET['id'])) {
    echo json_encode(['error' => 'ID de ingreso no proporcionado']);
    exit;
}
$id = intval($_GET['id']);

$sql = "
    SELECT 
        i.id,
        i.estado,
        i.tipo_ingreso,
        i.monto,
        i.observaciones AS detalle,
        i.fecha,
        
        -- Caja (Ubicación física del dinero)
        c.nombre AS nombre_caja,
        
        -- Cajero
        IFNULL(e.nombre, 'Sistema') AS nombre_cajero,
        
        -- Divisa
        d.nombre AS nombre_divisa,
        d.simbolo AS simbolo_divisa,
        d.icono AS icono_divisa,
        
        -- Cliente
        cl.razon_social AS nombre_cliente,
        
        -- Cuentas (Contabilidad del cliente)
        cta_origen.nombre AS nombre_cuenta_origen,
        cta_destino.nombre AS nombre_cuenta_destino
        
    FROM 
        ingresos i
    LEFT JOIN 
        cajas c ON i.caja_id = c.id
    LEFT JOIN 
        equipo e ON i.usuario_id = e.id
    LEFT JOIN 
        divisas_internas d ON i.divisa_id = d.id
    LEFT JOIN 
        clientes cl ON i.cliente_id = cl.id
    LEFT JOIN 
        cuentas cta_origen ON i.cuenta_origen_id = cta_origen.id
    LEFT JOIN 
        cuentas cta_destino ON i.cuenta_id = cta_destino.id
    WHERE 
        i.id = ?
";

$stmt = $conn->prepare($sql);
if (!$stmt) {
    die(json_encode(["error" => "Error en la consulta: " . $conn->error]));
}

$stmt->bind_param("i", $id);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode(['error' => 'Ingreso no encontrado']);
    exit;
}
$ingreso = $result->fetch_assoc();
$stmt->close();

// --- Pagos ---
// Devolvemos un array vacío porque en el sistema antiguo la tabla aparece vacía
// a menos que existan pagos parciales reales en otra tabla (que por ahora no estamos consultando).
$pagos = []; 

echo json_encode([
    'ingreso' => $ingreso,
    'pagos' => $pagos 
]);

$conn->close();
?>