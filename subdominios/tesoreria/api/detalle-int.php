<?php
// detalle-int.php

// 1. CONFIGURACIÓN DE CABECERAS (CORS y JSON)
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

// Manejo de Preflight (OPTIONS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// 2. INICIO DE SESIÓN Y ERRORES
ini_set('display_errors', 0);
error_reporting(E_ALL);
session_start();

// 3. CONEXIÓN A BASE DE DATOS
$servername = "localhost";
$username = "cambioso_admin";
$password = "sFI2J7P.%3bO";
$dbname = "cambioso_db";

try {
    $conn = new mysqli($servername, $username, $password, $dbname);
    if ($conn->connect_error) throw new Exception("Error BD: " . $conn->connect_error);
    $conn->set_charset("utf8");
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    exit;
}

$myRole = $_SESSION['rol'] ?? '';

// ==========================================
//                 MÉTODO GET
//         (Obtener datos del usuario)
// ==========================================
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $id = isset($_GET['id']) ? intval($_GET['id']) : 0;

    if ($id <= 0) {
        echo json_encode(['success' => false, 'message' => 'ID inválido.']);
        exit;
    }

    // --- CORRECCIÓN CLAVE: USAR LEFT JOIN ---
    // Si usas INNER JOIN y el usuario no tiene datos_equipo, la consulta devuelve vacío.
    // LEFT JOIN trae el usuario SIEMPRE, y pone NULL en los datos bancarios si no existen.
    
    $sql = "SELECT 
                e.id, e.nombre, e.rut, e.email, e.telefono, e.rol, 
                e.tipo_contrato, e.fecha_ingreso, e.sueldo_liquido, 
                e.fecha_nacimiento, e.estado_civil, e.direccion,
                d.banco, d.tipo_cuenta, d.numero_cuenta
            FROM equipo e
            LEFT JOIN datos_equipo d ON e.datos_equipo_id = d.id
            WHERE e.id = ?";

    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        echo json_encode(['success' => false, 'message' => 'Error SQL: ' . $conn->error]);
        exit;
    }

    $stmt->bind_param("i", $id);
    $stmt->execute();
    $res = $stmt->get_result();

    if ($row = $res->fetch_assoc()) {
        // Limpiamos valores nulos para que el JS no falle
        $row['banco'] = $row['banco'] ?? '';
        $row['tipo_cuenta'] = $row['tipo_cuenta'] ?? '';
        $row['numero_cuenta'] = $row['numero_cuenta'] ?? '';
        $row['fecha_nacimiento'] = $row['fecha_nacimiento'] ?? '';
        $row['estado_civil'] = $row['estado_civil'] ?? '';
        $row['direccion'] = $row['direccion'] ?? '';
        
        echo json_encode(['success' => true, 'data' => $row]);
    } else {
        echo json_encode(['success' => false, 'message' => 'No se encontraron datos para este integrante.']);
    }
    exit;
}

// ==========================================
//                 MÉTODO POST
//      (Guardar/Actualizar Integrante)
// ==========================================
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        echo json_encode(['success' => false, 'message' => 'Datos inválidos.']);
        exit;
    }

    $id = isset($input['id']) ? intval($input['id']) : 0;
    
    // Campos obligatorios
    $nombre = $conn->real_escape_string($input['nombre'] ?? '');
    $rut = $conn->real_escape_string($input['rut'] ?? '');
    $email = $conn->real_escape_string($input['email'] ?? '');
    
    // Campos opcionales
    $telefono = $conn->real_escape_string($input['telefono'] ?? '');
    $rol = $conn->real_escape_string($input['rol'] ?? 'Staff');
    $contrato = $conn->real_escape_string($input['tipo_contrato'] ?? 'Indefinido');
    $ingreso = $conn->real_escape_string($input['fecha_ingreso'] ?? date('Y-m-d'));
    $sueldo = intval($input['sueldo_liquido'] ?? 0);
    $nacimiento = !empty($input['fecha_nacimiento']) ? "'" . $conn->real_escape_string($input['fecha_nacimiento']) . "'" : "NULL";
    $civil = $conn->real_escape_string($input['estado_civil'] ?? '');
    $direccion = $conn->real_escape_string($input['direccion'] ?? '');

    // Datos Bancarios
    $banco = $conn->real_escape_string($input['banco'] ?? '');
    $tipo_cuenta = $conn->real_escape_string($input['tipo_cuenta'] ?? '');
    $numero_cuenta = $conn->real_escape_string($input['numero_cuenta'] ?? '');

    // Función auxiliar para verificar permisos de rol (nadie puede editar Socios excepto Socios)
    function esSocio($r) { return strtolower($r) === 'socio' || strtolower($r) === 'dueño'; }

    // --- A) MODO EDICIÓN (UPDATE) ---
    if ($id > 0) {
        // 1. Verificar existencia y rol actual
        $check = $conn->query("SELECT rol, datos_equipo_id FROM equipo WHERE id = $id");
        if (!$check || $check->num_rows === 0) {
            echo json_encode(['success' => false, 'message' => 'Usuario no encontrado.']);
            exit;
        }
        $currentRow = $check->fetch_assoc();
        $targetDatosId = $currentRow['datos_equipo_id'];

        // Seguridad: Si intentas editar a un Socio y no eres Socio, bloquear.
        if (esSocio($currentRow['rol']) && !esSocio($myRole)) {
            echo json_encode(['success' => false, 'message' => 'No tienes permisos para editar a un Socio.']);
            exit;
        }

        // 2. Actualizar o Crear Datos Bancarios
        if ($targetDatosId) {
            $sqlBank = "UPDATE datos_equipo SET banco='$banco', tipo_cuenta='$tipo_cuenta', numero_cuenta='$numero_cuenta' WHERE id=$targetDatosId";
            $conn->query($sqlBank);
        } else {
            // Si no tenía datos bancarios, crearlos
            if ($banco || $tipo_cuenta || $numero_cuenta) {
                $sqlBank = "INSERT INTO datos_equipo (banco, tipo_cuenta, numero_cuenta) VALUES ('$banco', '$tipo_cuenta', '$numero_cuenta')";
                if ($conn->query($sqlBank)) {
                    $newDatosId = $conn->insert_id;
                    $conn->query("UPDATE equipo SET datos_equipo_id = $newDatosId WHERE id = $id");
                }
            }
        }

        // 3. Actualizar Equipo
        $sql = "UPDATE equipo SET 
                    nombre = '$nombre', rut = '$rut', email = '$email', telefono = '$telefono',
                    rol = '$rol', tipo_contrato = '$contrato', fecha_ingreso = '$ingreso', sueldo_liquido = $sueldo,
                    fecha_nacimiento = $nacimiento, estado_civil = '$civil', direccion = '$direccion'
                WHERE id = $id";
        
        if ($conn->query($sql)) {
            echo json_encode(['success' => true, 'message' => 'Perfil actualizado.']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error SQL: ' . $conn->error]);
        }
    } 
    // --- B) MODO CREACIÓN (INSERT) ---
    // (Este archivo puede manejar creación también si se le llama sin ID, aunque tengas nuevo-int.php)
    else {
        echo json_encode(['success' => false, 'message' => 'ID no proporcionado para edición.']);
    }
}
?>