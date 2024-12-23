<?php
header("Access-Control-Allow-Origin: https://cambiosorion.cl");
header("Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");
header('Content-Type: application/json');
session_start();

try {
    if (isset($_SESSION['user'])) {
        $user = $_SESSION['user'];

        // Si el usuario es Cliente
        if ($user['tipo'] === 'Cliente') {
            $tipo = $user['tipo'];
            $nombre = $user['nombre'];
            $correo = $user['correo'];
            $rut = $user['rut']; // RUT de cliente

            echo json_encode([
                'isAuthenticated' => true,
                'tipo' => $tipo,
                'nombre' => $nombre,
                'correo' => $correo,
                'rut' => $rut
            ]);
        } else {
            // Si el usuario es Administrativo
            $tipo = $user['tipo'];
            $nombre = $user['nombre'];
            $correo = $user['correo'];

            echo json_encode([
                'isAuthenticated' => true,
                'tipo' => $tipo,
                'nombre' => $nombre,
                'correo' => $correo
            ]);
        }
    } else {
        echo json_encode(['isAuthenticated' => false]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
