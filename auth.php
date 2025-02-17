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

// Obtener el host actual (subdominio o dominio principal)
$host = $_SERVER['HTTP_HOST']; // Ejemplo: admin.cambiosorion.cl

// Verifica si el usuario está en un subdominio o en el dominio principal
if ($host === 'cambiosorion.cl') {
    // Si está en el dominio principal, redirigir al subdominio correcto
    $subdomain = 'admin'; // Puedes hacer que esto sea dinámico si quieres

    header("Location: https://$subdomain.$host");
    exit;
}

// Si está en el subdominio correcto, no hace nada, simplemente sigue el flujo
exit;
?>
