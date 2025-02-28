<?php
session_start();
header("Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");
header('Content-Type: application/json');

$host = $_SERVER['HTTP_HOST'];
$partes = explode('.', $host);
$subdominio = $partes[0];

// Configurar la cookie de sesión según el subdominio
if ($subdominio === "clientes") {
    setcookie("user_role", $_SESSION['user']['rol'], [
        'expires' => time() + 86400, // 1 día
        'path' => '/',
        'domain' => 'clientes.cambiosorion.cl', // Para compartir entre subdominios
        'secure' => true,
        'httponly' => true,
        'samesite' => 'Lax'
    ]);
} else {
    setcookie("user_role", $_SESSION['user']['rol'], [
        'expires' => time() + 86400, // 1 día
        'path' => '/',
        'domain' => '.cambiosorion.cl', // Para compartir entre subdominios
        'secure' => true,
        'httponly' => true,
        'samesite' => 'Lax'
    ]);
}

session_start();

$usuario = $_SESSION['user'] ?? null;
$rol_usuario = $_SESSION['user']['rol'] ?? null;

// Si no hay sesión activa
if (!$usuario) {
    if ($subdominio === "clientes") {
        header("Location: https://cambiosorion.cl/login");
    } else {
        header("Location: https://admin.cambiosorion.cl/login");
    }
    exit;
}

// Definir permisos según el subdominio
$permisos = [
    "admin" => ["admin", "socio", "caja", "otro"],
    "pizarras" => ["admin", "socio", "caja"],
    "caja" => ["admin", "socio", "caja"],
    "tesoreria" => ["admin", "socio"],
    "clientes" => ["persona", "empresa"],
];

// Bloquear a los clientes en otros subdominios
if (in_array($usuario['rol'], ["cliente", "persona", "empresa"]) && $subdominio !== "clientes") {
    session_destroy();
    header("Location: https://cambiosorion.cl/sin-acceso");
    exit;
}

// Si el usuario no tiene permisos para el subdominio
if (!isset($permisos[$subdominio]) || !in_array($usuario['rol'], $permisos[$subdominio])) {
    header("Location: https://cambiosorion.cl/sin-acceso");
    exit;
}

// Usuario autorizado, continuar
header("Location: https://$subdominio.cambiosorion.cl");
exit;
?>
