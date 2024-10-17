<?php
$servername = "localhost"; // Cambia esto si tu servidor no es localhost
$username = "cambioso_admin"; // Reemplaza con tu nombre de usuario de la base de datos
$password = "sFI2J7P.%3bO"; // Reemplaza con tu contraseña de la base de datos
$dbname = "cambioso_db"; // Reemplaza con el nombre de tu base de datos

// Intenta establecer la conexión
$conn = new mysqli($servername, $username, $password, $dbname);

// Verifica la conexión
if ($conn->connect_error) {
    die("Conexión fallida: " . $conn->connect_error);
}
?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mi Aplicación</title>
    <link rel="stylesheet" href="styles.css"> <!-- Agrega tu CSS aquí -->
</head>
<body>
    <header>
        <h1>Bienvenido a mi Aplicación</h1>
    </header>
    <main>
        <p>Esta es la página principal de mi aplicación.</p>
        <!-- Puedes agregar más contenido aquí -->
    </main>
    <footer>
        <p>&copy; <?php echo date("Y"); ?> Mi Aplicación. Todos los derechos reservados.</p>
    </footer>
</body>
</html>
