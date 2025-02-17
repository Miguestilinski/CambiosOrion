<?php
header("Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");
header('Content-Type: application/json');

session_start();

// Verifica si la sesión está activa
if (!isset($_SESSION['user'])) {
    header("Location: https://cambiosorion.cl/sin-acceso");
    exit;
}

// Restringir acceso si el rol es "otro"
if ($_SESSION['user']['tipo'] !== 'administrativo' || $_SESSION['user']['rol'] === 'otro') {
    header("Location: https://cambiosorion.cl/sin-acceso");
    exit;
}

// Obtener el subdominio actual
$host = $_SERVER['HTTP_HOST']; // Ejemplo: admin.cambiosorion.cl
$subdomain = explode('.', $host)[0]; // Extraer la primera parte del subdominio

// Verificar si ya estamos en el índice del subdominio
if ($_SERVER['REQUEST_URI'] !== '/' && $_SERVER['REQUEST_URI'] !== '/') {
    exit; // No hacer nada si el usuario ya está en la ruta correcta
}

// Construir la URL correcta del subdominio
$url = "https://$host/";

// Redirigir al índice del subdominio
header("Location: $url");
exit;
?>
