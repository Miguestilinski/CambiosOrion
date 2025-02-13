<?php
session_start();

// Verifica si la sesión está activa
if (!isset($_SESSION['user'])) {
    header("Location: https://cambiosorion.cl/login");
    exit;
}

// Restringir acceso si el rol es "otro"
if ($_SESSION['user']['tipo'] !== 'administrativo' || $_SESSION['user']['rol'] === 'otro') {
    header("Location: https://cambiosorion.cl/sin-acceso");
    exit;
}

// Redirigir a la página principal
header("Location: /");
exit;
?>
