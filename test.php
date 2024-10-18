<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

$servername = "localhost"; // o el nombre del servidor de base de datos
$username = "cambioso_admin";
$password = "sFI2J7P.%3bO"; // asegúrate de usar la contraseña correcta
$dbname = "cambioso_db";

// Crear conexión
$conn = new mysqli($servername, $username, $password, $dbname);

// Verificar conexión
if ($conn->connect_error) {
    die("Conexión fallida: " . $conn->connect_error);
}
echo "Conexión exitosa<br>";

$sql = "SELECT * FROM divisas";
$result = $conn->query($sql);

if ($result->num_rows > 0) {
    // salida de cada fila
    while ($row = $result->fetch_assoc()) {
        $nombre = isset($row["nombre"]) ? $row["nombre"] : "Sin datos";
        echo "id: " . $row["id"] . " - divisa: " . $nombre . "<br>";
    }
} else {
    echo "0 resultados";
}

if (!$result) {
    echo "Error en la consulta: " . $conn->error;
}
?>