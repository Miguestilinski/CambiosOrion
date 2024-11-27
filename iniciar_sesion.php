<?php
header('Content-Type: application/json');

// Conexión a la base de datos
$servername = "localhost";
$username = "cambioso_admin";
$password = "sFI2J7P.%3bO";
$dbname = "cambioso_db";

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    echo json_encode(["success" => false, "message" => "Error en la conexión a la base de datos."]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $rut = isset($_POST['rut']) ? $_POST['rut'] : null;
    $correo = isset($_POST['correo']) ? $_POST['correo'] : null;
    $contrasena = $_POST['contrasena'];

    // Verificamos si se proporcionó un RUT o un correo
    if ($rut) {
        // Buscar en la tabla de clientes (usuarios)
        $sql = "SELECT * FROM usuarios WHERE rut = ? LIMIT 1";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("s", $rut);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows > 0) {
            $usuario = $result->fetch_assoc();
            if (password_verify($contrasena, $usuario['password'])) {
                echo json_encode(["success" => true, "role" => "Cliente", "user" => $usuario['user']]);
            } else {
                echo json_encode(["success" => false, "field" => "contrasena", "message" => "Contraseña incorrecta."]);
            }
        } else {
            echo json_encode(["success" => false, "field" => "rut", "message" => "El RUT no está registrado."]);
        }
        $stmt->close();
    } elseif ($correo) {
        // Buscar en la tabla de administrativos
        $sql = "SELECT * FROM administrativos WHERE user = ? LIMIT 1";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("s", $correo);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows > 0) {
            $administrativo = $result->fetch_assoc();
            if (password_verify($contrasena, $administrativo['password'])) {
                echo json_encode(["success" => true, "role" => "Administrativo", "user" => $administrativo['user']]);
            } else {
                echo json_encode(["success" => false, "field" => "contrasena", "message" => "Contraseña incorrecta."]);
            }
            error_log("Usuario encontrado");
        } else {
            echo json_encode(["success" => false, "field" => "correo", "message" => "El correo no está registrado."]);
            error_log("Usuario no encontrado");
        }
        $stmt->close();
    } else {
        echo json_encode(["success" => false, "message" => "No se proporcionó un RUT ni un correo."]);
    }
}
error_log(print_r($_POST, true));
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);


$conn->close();
?>