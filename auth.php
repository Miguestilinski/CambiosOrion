<?php
header("Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");
header('Content-Type: application/json');

session_start();

// Obtener el host actual (incluye el subdominio si lo hay)
$host = $_SERVER['HTTP_HOST']; // Ejemplo: admin.cambiosorion.cl
$requestUri = $_SERVER['REQUEST_URI']; // Ruta que se está solicitando

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

// Verifica si el usuario ya está en el subdominio correcto
if (strpos($host, 'cambiosorion.cl') !== false && $host !== 'cambiosorion.cl') {
    // Si está en un subdominio, no hacer nada y permitir que continúe
    exit;
}

// Si el usuario está en el dominio principal y debería estar en un subdominio, redirigirlo
$subdomain = explode('.', $host)[0]; // Extraer la primera parte del subdominio
if ($subdomain !== 'cambiosorion' && $subdomain !== 'www') {
    // Redirigir al índice del subdominio
    header("Location: https://$host$requestUri");
    exit;
}

// Si llega aquí, significa que está en cambiosorion.cl en lugar de un subdominio
header("Location: https://cambiosorion.cl/sin-acceso");
exit;
?>
