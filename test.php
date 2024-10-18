$servername = "localhost"; // o el nombre del servidor de base de datos
$username = "cambioso_admin";
$password = "tu_contraseña"; // asegúrate de usar la contraseña correcta
$dbname = "cambioso_db";

// Crear conexión
$conn = new mysqli($servername, $username, $password, $dbname);

// Verificar conexión
if ($conn->connect_error) {
    die("Conexión fallida: " . $conn->connect_error);
}
echo "Conexión exitosa";

$sql = "SELECT * FROM divisas";
$result = $conn->query($sql);

if ($result->num_rows > 0) {
    // salida de cada fila
    while($row = $result->fetch_assoc()) {
        echo "id: " . $row["id"]. " - divisa: " . $row["divisa"]. "<br>";
    }
} else {
    echo "0 resultados";
}
if (!$result) {
    echo "Error en la consulta: " . $conn->error;
}
