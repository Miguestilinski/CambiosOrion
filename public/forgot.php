<?php
header("Access-Control-Allow-Origin: https://cambiosorion.cl");
header("Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");
header('Content-Type: application/json');

require '../orionapp/vendor/autoload.php';  // Usando Composer para autoload

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// Recuperar el correo electrónico desde la solicitud
$data = json_decode(file_get_contents('php://input'), true);
if (!$data || !isset($data['correo'])) {
    echo json_encode(["success" => false, "message" => "Correo no proporcionado."]);
    exit;
}

$correo = trim($data['correo']);
if (!filter_var($correo, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'message' => 'Correo inválido.']);
    exit;
}

// Generar un token único para el restablecimiento de contraseña
$token = bin2hex(random_bytes(16));

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Conexión a la base de datos
$servername = "localhost";
$username = "cambioso_admin";
$password = "sFI2J7P.%3bO";
$dbname = "cambioso_db";

$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    error_log("Error en la conexión a la base de datos: " . $conn->connect_error);
    echo json_encode(["success" => false, "message" => "Error en la conexión a la base de datos."]);
    exit;
}

// Actualizar token
// Obtener el user_id basado en el correo
$stmt = $conn->prepare("SELECT id FROM usuarios WHERE correo = ?");
$stmt->bind_param('s', $correo);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    $user = $result->fetch_assoc();
    $userId = $user['id'];
    
    // Insertar el token en password_resets
    $insertStmt = $conn->prepare("INSERT INTO password_resets (user_id, token, created_at) VALUES (?, ?, NOW())");
    $insertStmt->bind_param('is', $userId, $token);
    $insertStmt->execute();
    
    // Verificar si se insertó correctamente
    if ($insertStmt->affected_rows > 0) {
        echo json_encode(['success' => true, 'message' => 'Correo enviado para restablecer tu contraseña.']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Error al insertar el token.']);
    }
    
} else {
    echo json_encode(['success' => false, 'message' => 'Correo no encontrado.']);
}

if ($stmt->affected_rows === 0) {
    echo json_encode(['success' => false, 'message' => 'Correo no encontrado en la base de datos.']);
    $stmt->close();
    $conn->close();
    exit;
} else if ($stmt->error) {
    echo json_encode(['success' => false, 'message' => 'Error al actualizar el token en la base de datos.']);
    $stmt->close();
    $conn->close();
    exit;
}

$stmt->close();
$conn->close();

// Crear el enlace de restablecimiento
$link = "https://cambiosorion.cl/reset-password.php?token=$token";
$mail = new PHPMailer(true);

try {
    $mail->isSMTP();
    $mail->Host = 'mail.cambiosorion.cl';
    $mail->SMTPAuth = true;
    $mail->Username = 'no-reply@cambiosorion.cl';
    $mail->Password = 'NOREPLYCRILLON76901*';
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
    $mail->Port = 465;

    $mail->setFrom('no-reply@cambiosorion.cl', 'Cambios Orion');
    $mail->addAddress($correo);
    $mail->isHTML(true);
    $mail->Subject = 'Recuperación de Contraseña';
    $mail->Charset = 'UTF-8';
    $mail->Body = "
        <html>
        <head>
            <title>Recuperación de Contraseña</title>
            <meta charset='UTF-8'>
            <style>
                /* Agregar los estilos en línea para asegurarse de que el correo sea compatible */
                body {
                    font-family: 'Arial', sans-serif;
                    margin: 0;
                    padding: 0;
                    background: rgba(0, 0, 0, 0.45) url('https://cambiosorion.cl/orionapp/assets/FondoOrion2.jpg') no-repeat center top;
                    background-size: cover;
                    background-attachment: fixed;
                    position: relative;
                    z-index: 1;
                }
                body::after {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    pointer-events: none;
                    z-index: 0;
                }
                .container {
                    width: 100%;
                    max-width: 600px;
                    margin: 3.5rem auto;
                    background-color: #ffffff;
                    border-radius: 0.75rem;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    padding: 20px;
                }
                .header {
                    font-size: 24px;
                    color: #1f2937;
                    text-align: center;
                    margin-bottom: 20px;
                }
                .text {
                    font-size: 16px;
                    color: #4b5563;
                    line-height: 1.5;
                }
                .link-button {
                    display: inline-block;
                    padding: 12px 24px;
                    margin: 20px 0;
                    background-color: #2563eb;
                    color: white;
                    font-size: 16px;
                    font-weight: 600;
                    text-decoration: none;
                    border-radius: 6px;
                    text-align: center;
                    transition: background-color 0.3s ease;
                }
                .link-button:hover {
                    background-color: #1d4ed8;
                }
                .footer {
                    text-align: center;
                    font-size: 12px;
                    color: #6b7280;
                    margin-top: 20px;
                }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    Recuperación de Contraseña
                </div>
                <div class='text'>
                    <p>Hola,</p>
                    <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta.</p>
                    <p>Haz clic en el siguiente enlace para restablecer tu contraseña:</p>
                    <p><a href='$link' class='link-button'>$link</a></p>
                    <p>Si no solicitaste este cambio, puedes ignorar este mensaje.</p>
                </div>
                <div class='footer'>
                    <p>&copy; 2025 Cambios Orion. Todos los derechos reservados.</p>
                </div>
            </div>
        </body>
        </html>
    ";    

    $mail->send();
    echo json_encode(['success' => true, 'message' => 'Correo enviado para restablecer tu contraseña.']);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Error interno del servidor: ' . $e->getMessage()]);
}
?>