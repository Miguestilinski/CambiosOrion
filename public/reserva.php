<?php
header("Access-Control-Allow-Origin: https://cambiosorion.cl");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");
header('Content-Type: application/json; charset=UTF-8');

error_reporting(E_ALL);
ini_set('display_errors', 1);

require __DIR__ . '/../orionapp/vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

use Endroid\QrCode\Builder\Builder;
use Endroid\QrCode\Encoding\Encoding;
use Endroid\QrCode\ErrorCorrectionLevel;
use Endroid\QrCode\Label\LabelAlignment;
use Endroid\QrCode\Label\Font\OpenSans;
use Endroid\QrCode\RoundBlockSizeMode;
use Endroid\QrCode\Writer\PngWriter;

// Leer datos del POST
$data = json_decode(file_get_contents('php://input'), true);
if (!$data) {
    echo json_encode(['success' => false, 'message' => 'Datos inválidos']);
    exit;
}

// Sanitizar y validar
$nombre = trim($data['nombre'] ?? '');
$email = trim($data['email'] ?? '');
$fecha = trim($data['fecha'] ?? '');
$hora = trim($data['hora'] ?? '');
$operacion = trim($data['operacion'] ?? '');
$divisa_id = trim($data['divisa_id'] ?? '');
$total = intval($data['total'] ?? 0);
$tasa_cambio = floatval($data['tasa_cambio'] ?? 0);
$monto = intval($data['monto'] ?? 0);

if (!$nombre || !$email || !$fecha || !$hora || !$operacion || !$divisa_id) {
    echo json_encode(['success' => false, 'message' => 'Faltan datos requeridos']);
    exit;
}

// Conexión DB
$mysqli = new mysqli("localhost", "cambioso_admin", "sFI2J7P.%3bO", "cambioso_db");
if ($mysqli->connect_errno) {
    echo json_encode(['success' => false, 'message' => 'Error de conexión DB']);
    exit;
}

$nombre = $mysqli->real_escape_string($nombre);
$email = $mysqli->real_escape_string($email);
$fecha = $mysqli->real_escape_string($fecha);
$hora = $mysqli->real_escape_string($hora);
$operacion = $mysqli->real_escape_string($operacion);
$divisa_id = $mysqli->real_escape_string($divisa_id);

// Asegurar carpeta qrcodes
$qrDir = __DIR__ . "/qrcodes/";
if (!is_dir($qrDir)) {
    mkdir($qrDir, 0777, true);
}

// Generar QR con Endroid v6
$qrContent = "Reserva Cambios Orion\n".
             "Nombre: $nombre\n".
             "Email: $email\n".
             "Fecha: $fecha\n".
             "Hora: $hora\n".
             "Tipo de operación: $operacion\n".
             "Divisa: $divisa_id\n".
             "Monto: $monto\n".
             "Total: $total CLP";

$qrFileName = uniqid("reserva_", true) . ".png";
$qrFilePath = $qrDir . $qrFileName;
$qrFileDb = "qrcodes/" . $qrFileName;

// Generar QR
try {
    $builder = new Builder(
        writer: new PngWriter(),
        writerOptions: [],
        validateResult: false,
        data: $qrContent,
        encoding: new Encoding('UTF-8'),
        errorCorrectionLevel: ErrorCorrectionLevel::High, // ← aquí
        size: 300,
        margin: 10,
        roundBlockSizeMode: RoundBlockSizeMode::Margin
    );

    $result = $builder->build();
    $result->saveToFile($qrFilePath);

} catch (\Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Error generando QR: ' . $e->getMessage()]);
    exit;
}

$fecha_mysql = date('Y-m-d', strtotime($fecha));
$hora_mysql = date('H:i:s', strtotime($hora));

// Insertar reserva
$sql = "INSERT INTO reservas (nombre,email,fecha,hora,tipo_operacion,divisa_id,total,tasa_cambio,monto,qr_code)
        VALUES ('$nombre','$email','$fecha_mysql','$hora_mysql','$operacion','$divisa_id',$total,$tasa_cambio,$monto,'$qrFileDb')";

if ($mysqli->query($sql)) {
    // Enviar correo con QR
    $mail = new PHPMailer(true);
    try {
        $mail->isSMTP();
        $mail->Host = 'mail.cambiosorion.cl';
        $mail->SMTPAuth = true;
        $mail->Username = 'no-reply@cambiosorion.cl';
        $mail->Password = 'NOREPLYCRILLON76901*';
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
        $mail->Port = 465;

        // Fix charset
        $mail->CharSet = 'UTF-8';
        $mail->Encoding = 'base64';
        $mail->addCustomHeader('Content-Type', 'text/html; charset=UTF-8');

        $mail->setFrom('no-reply@cambiosorion.cl', 'Cambios Orion');
        $mail->addAddress($email, $nombre);
        $mail->isHTML(true);
        $mail->Subject = 'Tu Reserva en Cambios Orion';

        // Adjuntar QR con cid
        $mail->addEmbeddedImage($qrFilePath, 'qrimage', 'qr.png', 'base64', 'image/png');

        $mail->Body = "
        <!DOCTYPE html>
        <html lang='es'>
        <head>
            <meta charset='UTF-8'>
            <style>
                body {
                    margin: 0;
                    padding: 0;
                    font-family: 'Inter', Arial, sans-serif;
                    background: #000 url('https://cambiosorion.cl/orionapp/assets/FondoOrion.jpg') no-repeat center top;
                    background-size: cover;
                }
                .overlay {
                    background: rgba(0,0,0,0.6);
                    padding: 40px 15px;
                }
                .container {
                    max-width: 600px;
                    margin: auto;
                    background: #ffffff;
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                }
                .header {
                    background: #031026;
                    padding: 25px;
                    text-align: center;
                }
                .header img {
                    max-height: 60px;
                }
                .content {
                    padding: 30px;
                    color: #333333;
                    font-size: 16px;
                    line-height: 1.6;
                }
                .content h2 {
                    color: #031026;
                    margin-bottom: 20px;
                    font-size: 22px;
                }
                .qr {
                    text-align: center;
                    margin: 25px 0;
                }
                .qr img {
                    max-width: 180px;
                }
                .details {
                    background: #f4f4f9;
                    border-radius: 8px;
                    padding: 15px;
                    margin: 20px 0;
                }
                .details li {
                    margin: 8px 0;
                }
                .footer {
                    text-align: center;
                    font-size: 12px;
                    color: #aaaaaa;
                    padding: 15px;
                    background: #031026;
                    color: #fff;
                }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <img src='https://cambiosorion.cl/assets/LogoOrion-white.png' alt='Cambios Orion'>
                </div>
                <div class='content'>
                    <h2>Hola $nombre 👋</h2>
                    <p>Tu reserva ha sido <b>confirmada exitosamente</b>.</p>
                    <p>A continuación encontrarás el código QR que deberás presentar en nuestra oficina:</p>
                    <div class='qr'>
                        <img src='cid:qrimage' alt='Código QR' style='max-width:180px;'>
                    </div>
                    <p><b>Detalles de tu reserva:</b></p>
                    <div class='details'>
                        <ul style='list-style:none; padding:0; margin:0;'>
                            <li><b>📅 Fecha:</b> $fecha_mysql</li>
                            <li><b>⏰ Hora:</b> $hora_mysql</li>
                            <li><b>🔄 Operación:</b> $operacion</li>
                            <li><b>💱 Divisa:</b> $divisa_id</li>
                            <li><b>💵 Monto:</b> $monto</li>
                            <li><b>💰 Total:</b> $total CLP</li>
                        </ul>
                    </div>
                    <p>¡Gracias por confiar en <b>Cambios Orion</b>! 💙</p>
                </div>
                <div class='footer'>
                    &copy; " . date('Y') . " Cambios Orion. Todos los derechos reservados.
                </div>
            </div>
        </body>
        </html>
        ";

        $mail->send();
    } catch (Exception $e) {
        // Puedes loggear el error si quieres
    }

    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'message' => $mysqli->error]);
}

$mysqli->close();