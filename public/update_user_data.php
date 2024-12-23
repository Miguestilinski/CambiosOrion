<?php
header("Access-Control-Allow-Origin: https://cambiosorion.cl");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");
header('Content-Type: application/json');
session_start();

try {
    if (isset($_SESSION['user']) && $_SERVER['REQUEST_METHOD'] === 'POST') {
        $user = $_SESSION['user'];

        // Obtención de los datos del formulario
        $nombre = $_POST['nombre'] ?? $user['nombre'];
        $correo = $_POST['email'] ?? $user['correo'];
        $password = $_POST['password'] ?? null;
        $rut = $_POST['rut'] ?? $user['rut']; // Solo para clientes

        // Actualización de la base de datos
        // Aquí deberías incluir el código para actualizar la base de datos. Este es un ejemplo básico.

        // Si el usuario es cliente
        if ($user['tipo'] === 'Cliente') {
            // Actualiza el correo y el RUT
            // Código para actualizar cliente en la base de datos
        } else {
            // Si es administrativo, solo actualiza el correo y/o la contraseña
            // Código para actualizar administrativo en la base de datos
        }

        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['error' => 'No autorizado o método incorrecto']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
