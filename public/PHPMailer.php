<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require 'vendor/autoload.php';

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
    $mail->Body    = $message;

    $mail->send();
    echo json_encode(['success' => true, 'message' => 'Correo enviado para restablecer tu contraseña.']);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $mail->ErrorInfo]);
}
?>
