<?php
// Mostrar errores de PHP (solo en desarrollo)
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Configuración de la base de datos
$servername = "localhost"; // Cambiar si es necesario
$username = "cambioso_admin";   // Cambiar por tu usuario de MySQL
$password = "sFI2J7P.%3bO"; // Cambiar por tu contraseña de MySQL
$dbname = "cambioso_db";     // Cambiar por el nombre de tu base de datos

// Crear conexión
$conn = new mysqli($servername, $username, $password, $dbname);

// Verificar conexión
if ($conn->connect_error) {
    die("Error en la conexión: " . $conn->connect_error);
}

// Verificar si el archivo JSON existe
$json_file = 'divisas.json';
if (!file_exists($json_file)) {
    die("El archivo JSON no se encontró en la ruta: $json_file");
}

// Leer el archivo JSON
$json = file_get_contents($json_file);

// Verificar si se pudo leer el archivo
if ($json === false) {
    die("Error al leer el archivo JSON.");
}

// Decodificar el JSON
$data = json_decode($json, true);

// Verificar si el JSON es válido
if ($data === null) {
    die("Error al decodificar el JSON.");
}

// Preparar la consulta SQL
$sql = "INSERT INTO divisas (nombre, icono, compra, venta, tasa) VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE icono = VALUES(icono), compra = VALUES(compra), venta = VALUES(venta), tasa = VALUES(tasa)";

// Preparar la consulta
$stmt = $conn->prepare($sql);

// Verificar si la preparación fue exitosa
if (!$stmt) {
    die("Error en la preparación de la consulta: " . $conn->error);
}

// Iterar a través de las divisas
foreach ($data['Divisas'] as $nombre => $info) {
    // Convertir los valores de compra y venta a float si son numéricos
    $compra = is_numeric($info['compra']) ? (float) $info['compra'] : null;
    $venta = is_numeric($info['venta']) ? (float) $info['venta'] : null;

    // Verificar si compra y venta son válidos
    if ($compra === null || $venta === null) {
        echo "Error con los valores de compra o venta para $nombre.<br>";
        continue; // Pasar a la siguiente divisa si hay un error
    }

    // Calcular la tasa de diferencia
    $tasa = $venta - $compra;

    // Ejecutar la consulta
    $stmt->bind_param("ssddd", $info['nombre'], $info['icono'], $compra, $venta, $tasa);
    if ($stmt->execute()) {
        echo "Divisa $nombre agregada o actualizada correctamente.<br>";
    } else {
        echo "Error al agregar o actualizar $nombre: " . $stmt->error . "<br>";
    }
}

// Cerrar la consulta preparada
$stmt->close();

// Cerrar la conexión
$conn->close();
?>
