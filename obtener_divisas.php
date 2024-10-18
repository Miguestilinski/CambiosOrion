<?php
// Mostrar errores (solo en desarrollo)
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Conexión a la base de datos
$servername = "localhost";
$username = "cambioso_admin";
$password = "sFI2J7P.%3bO";
$dbname = "cambioso_db";

// Crear conexión
$conn = new mysqli($servername, $username, $password, $dbname);

// Verificar conexión
if ($conn->connect_error) {
    die("Error en la conexión: " . $conn->connect_error);
}

// Consultar las divisas
$sql = "SELECT nombre, icono, compra, venta, tasa FROM divisas";
$result = $conn->query($sql);

// Crear un array para almacenar las divisas
$divisas = [];

// Verificar si hay resultados
if ($result && $result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $divisas[] = $row; // Almacenar cada fila en el array
    }
}

// Devolver las divisas en formato JSON
header('Content-Type: application/json');
echo json_encode($divisas);

// Cerrar la conexión
$conn->close();
?>