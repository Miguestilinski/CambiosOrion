<?php
require 'path/to/PHPMailer/src/PHPMailer.php';
require 'path/to/PHPMailer/src/SMTP.php';
require 'path/to/PHPMailer/src/Exception.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// Recuperar el correo electrónico desde la solicitud
$data = json_decode(file_get_contents('php://input'), true);
$correo = $data['correo'];

// Validar el correo
if (!filter_var($correo, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'message' => 'Correo inválido.']);
    exit();
}

// Generar un token único para el restablecimiento de contraseña
$token = bin2hex(random_bytes(16));

// Guardar el token en la base de datos
$conn = new mysqli('localhost', 'usuario', 'contraseña', 'base_datos');
$stmt = $conn->prepare("UPDATE usuarios SET reset_token = ? WHERE correo = ?");
$stmt->bind_param('ss', $token, $correo);
$stmt->execute();

// Crear el enlace de restablecimiento
$link = "https://cambiosorion.cl/reset-password.php?token=" . $token;

// Configuración de PHPMailer
$mail = new PHPMailer(true);

try {
    $mail->isSMTP();
    $mail->Host = 'mail.cambiosorion.cl'; // Servidor SMTP
    $mail->SMTPAuth = true;
    $mail->Username = 'no-reply@cambiosorion.cl'; // Tu correo
    $mail->Password = 'NOREPLYCRILLON76901*'; // Contraseña del correo
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
    $mail->Port = 465;

    // Configurar el correo
    $mail->setFrom('no-reply@cambiosorion.cl', 'Cambios Orion');
    $mail->addAddress($correo);
    $mail->isHTML(true);
    $mail->Subject = 'Recuperación de Contraseña';
    $mail->Body = "
        <html>
        <head>
            <title>Recuperación de Contraseña</title>
        </head>
        <body>
            <p>Hola,</p>
            <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta.</p>
            <p>Haz clic en el siguiente enlace para restablecer tu contraseña:</p>
            <p><a href='$link'>$link</a></p>
            <p>Si no solicitaste este cambio, puedes ignorar este mensaje.</p>
        </body>
        </html>
    ";

    $mail->send();
    echo json_encode(['success' => true, 'message' => 'Correo enviado para restablecer tu contraseña.']);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Hubo un problema al enviar el correo: ' . $mail->ErrorInfo]);
}
