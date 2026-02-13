<?php
// 1. Configuración de Sesión (DEBE ir antes de incluir conexion.php)
session_set_cookie_params([
    'lifetime' => 86400,
    'path' => '/',
    'domain' => '.cambiosorion.cl',
    'secure' => true,
    'httponly' => true,
    'samesite' => 'None'
]);
session_start();

ini_set('log_errors', 1);
ini_set('display_errors', 0);

// 2. Incluir la conexión centralizada (Maneja CORS, Headers y BD)
require_once __DIR__ . '/../../../../data/conexion.php';

try {
    // 3. Validación de Origen (Referer / Host)
    $allowed_hosts = ['admin.cambiosorion.cl', 'cambiosorion.cl'];
    
    if (!in_array($_SERVER['HTTP_HOST'], $allowed_hosts)) {
        error_log("Acceso no autorizado desde: " . $_SERVER['HTTP_HOST']);
        echo json_encode(["success" => false, "message" => "Acceso no autorizado."]);
        exit;
    }

    // 4. Procesamiento del Login
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $correo = trim($_POST['correo'] ?? '');
        $password = $_POST['password'] ?? '';

        // Si mandan datos vacíos, error genérico inmediato
        if (empty($correo) || empty($password)) {
            error_log("Intento de login con datos vacíos.");
            echo json_encode(["success" => false, "message" => "Correo o contraseña incorrectos."]);
            exit;
        }

        error_log("Intento de login para: " . $correo);
        
        $stmt = $conn->prepare("SELECT * FROM administrativos WHERE correo = ? LIMIT 1");
        $stmt->bind_param("s", $correo);
        $stmt->execute();
        $result = $stmt->get_result();

        // VARIABLES DE CONTROL DE SEGURIDAD
        $login_exitoso = false;
        $datos_usuario = [];

        if ($result->num_rows > 0) {
            $administrativo = $result->fetch_assoc();

            // Verificamos el hash de la contraseña
            if (password_verify($password, $administrativo['password'])) {
                $login_exitoso = true;
                $equipo = null;
                $rol = null;
                $nombre = null;

                // Cargar datos del rol
                if (!empty($administrativo['equipo_id'])) {
                    $stmt_equipo = $conn->prepare("SELECT nombre, rol FROM equipo WHERE id = ? LIMIT 1");
                    $stmt_equipo->bind_param("i", $administrativo['equipo_id']);
                    $stmt_equipo->execute();
                    $result_equipo = $stmt_equipo->get_result();

                    if ($result_equipo->num_rows > 0) {
                        $equipo = $result_equipo->fetch_assoc();
                        $rol = strtolower(trim($equipo['rol']));
                        $nombre = $equipo['nombre'];
                    }
                    $stmt_equipo->close();
                }

                // Preparamos los datos limpios para la sesión
                $datos_usuario = [
                    'id' => $administrativo['id'],
                    'correo' => $administrativo['correo'],
                    'tipo' => 'administrativo',
                    'rol' => $rol,
                    'nombre' => $nombre,
                    'equipo_id' => $administrativo['equipo_id']
                ];
            }
        }
        $stmt->close();

        // 5. RESPUESTA FINAL
        if ($login_exitoso) {
            // Guardamos la sesión solo si todo coincide perfectamente
            $_SESSION['user'] = $datos_usuario;
            error_log("SESION INICIADA CORRECTAMENTE: " . $datos_usuario['correo']);
            
            echo json_encode([
                "success" => true,
                "message" => "Inicio de sesión exitoso.",
                "rol" => $datos_usuario['rol']
            ]);
        } else {
            // Retardo de 1 segundo para despistar bots y evitar ataques de temporización
            sleep(1);
            error_log("Login fallido para: " . $correo);
            
            // MENSAJE GENÉRICO (Falla de correo o falla de contraseña responden igual)
            echo json_encode([
                "success" => false,
                "field" => "general",
                "message" => "Correo o contraseña incorrectos."
            ]);
        }

    } else {
        error_log("Método HTTP no permitido en login.");
        echo json_encode(["success" => false, "message" => "Petición inválida."]);
    }

} catch (Exception $e) {
    error_log("Error interno: " . $e->getMessage());
    echo json_encode(["success" => false, "message" => "Error interno del servidor."]);
} finally {
    if (isset($conn) && $conn instanceof mysqli) {
        $conn->close();
    }
}
exit;
?>