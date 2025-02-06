<?php
header("Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}

// Mostrar errores (solo en desarrollo)
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Conexión a la base de datos
$servername = "localhost";
$username = "cambioso_admin";
$password = "sFI2J7P.%3bO";
$dbname = "cambioso_db";

$conn = new mysqli($servername, $username, $password, $dbname);

// Verificar conexión
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["error" => "Error en la conexión a la base de datos."]);
    exit();
}

// Obtener el método HTTP
$method = $_SERVER['REQUEST_METHOD'];

// Procesar la solicitud según el método
switch ($method) {
    case 'GET':
        // Obtener todas las divisas
        $sql = "SELECT nombre, compra, venta, tasa, icono_circular, icono_cuadrado FROM divisas";
        $result = $conn->query($sql);

        if ($result && $result->num_rows > 0) {
            $divisas = [];
            while ($row = $result->fetch_assoc()) {
                $divisas[] = $row;
            }
            header('Content-Type: application/json');
            echo json_encode($divisas);
        } else {
            http_response_code(404);
            echo json_encode(["error" => "No se encontraron datos de divisas."]);
        }
        break;
        
    case 'PUT':
        $data = json_decode(file_get_contents("php://input"), true);

        if (!is_array($data) || !isset($data['nombre'], $data['compra'], $data['venta'])) {
            http_response_code(400);
            echo json_encode(["error" => "Faltan datos necesarios."]);
            exit();
        }

        $nombre = $conn->real_escape_string($data['nombre']);
        $compra = (float)$data['compra'];
        $venta = (float)$data['venta'];
        $fecha_actualizacion = date("Y-m-d H:i:s");

    $sql = "UPDATE divisas 
            SET compra = '$compra', venta = '$venta', fecha_actualizacion = '$fecha_actualizacion' 
            WHERE nombre = '$nombre'";

        if ($conn->query($sql) === TRUE) {
            http_response_code(200);
            echo json_encode(["message" => "Divisa actualizada con éxito.", "fecha_actualizacion" => $fecha_actualizacion]);
        } else {
            http_response_code(500);
            echo json_encode(["error" => "Error al actualizar la divisa."]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(["error" => "Método no permitido."]);
        break;
}

// Cerrar la conexión
$conn->close();
?>