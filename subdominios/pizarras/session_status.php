<?php
header("Access-Control-Allow-Origin: https://cambiosorion.cl");
header("Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");
header('Content-Type: application/json');
session_start();

try {
    if (isset($_SESSION['user'])) {
        // Asegúrate de que estos índices existan en la sesión
        $tipo = $_SESSION['user']['tipo'];
        $nombre = isset($_SESSION['user']['nombre']) ? $_SESSION['user']['nombre'] : 'Usuario desconocido';
        $correo = isset($_SESSION['user']['correo']) ? $_SESSION['user']['correo'] : 'Correo no disponible';

        echo json_encode([
            'isAuthenticated' => true,
            'nombre' => $nombre,
            'correo' => $correo,
            'tipo' => $tipo,
        ]);
    } else {
        echo json_encode(['isAuthenticated' => false]);
    }
} catch (Exception $e) {
    http_response_code(500); // Devuelve un código 500 al cliente
    echo json_encode(['error' => $e->getMessage()]);
}
?>
