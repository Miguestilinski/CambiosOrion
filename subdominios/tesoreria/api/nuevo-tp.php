<?php
// 1. Incluir la conexión centralizada
require_once __DIR__ . '/../../../../data/conexion.php';

// 2. Configuración y Buffer
ob_start(); // Iniciamos buffer para asegurar que ob_clean() funcione
ini_set('display_errors', 0);
error_reporting(E_ALL);

// Helper para errores (Mantenemos tu función, asegurando limpieza de buffer)
function send_error($message) {
    if (ob_get_length()) ob_clean();
    echo json_encode(["success" => false, "error" => $message]);
    exit;
}

try {
    // Verificación de seguridad
    if (!isset($conn)) {
        throw new Exception("Error: No se pudo cargar la conexión centralizada.");
    }

    // --- GET (Datos para selectores) ---
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        
        // Buscar Cajas
        if (isset($_GET['buscar_cajas'])) {
            $cajas = [];
            $sql = "SELECT id, nombre FROM cajas WHERE estado = 1 ORDER BY CASE WHEN nombre LIKE '%Tesoreria%' THEN 0 ELSE 1 END, nombre ASC";
            $res = $conn->query($sql);
            while ($row = $res->fetch_assoc()) {
                $cajas[] = ["id" => $row['id'], "nombre" => $row['nombre']];
            }
            echo json_encode($cajas);
            exit;
        }

        // Buscar Divisas (Con Iconos)
        if (isset($_GET['buscar_divisas'])) {
            $divisas = [];
            $sql = "SELECT id, nombre, codigo, icono FROM divisas_internas WHERE estado = 1 OR estado = 'Habilitada' ORDER BY codigo ASC";
            $res = $conn->query($sql);
            while ($row = $res->fetch_assoc()) $divisas[] = $row;
            echo json_encode($divisas);
            exit;
        }
    }

    // --- POST (Registrar Traspaso) ---
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);

        $origen_id = $data['origen_id'] ?? null;
        $destino_id = $data['destino_id'] ?? null;
        $divisa_id = $data['divisa_id'] ?? null;
        $monto = floatval($data['monto'] ?? 0);
        $observaciones = $data['observaciones'] ?? '';
        $usuario_id = $data['usuario_id'] ?? 0;

        // Validaciones
        if (!$origen_id || !$destino_id || !$divisa_id || $monto <= 0) {
            send_error("Faltan datos obligatorios.");
        }
        if ($origen_id == $destino_id) {
            send_error("La caja de origen y destino no pueden ser la misma.");
        }

        // 1. Validar fondos en Origen
        $stmtInv = $conn->prepare("SELECT cantidad FROM inventarios WHERE divisa_id = ? AND caja_id = ?");
        $stmtInv->bind_param("si", $divisa_id, $origen_id);
        $stmtInv->execute();
        $resInv = $stmtInv->get_result();
        $rowInv = $resInv->fetch_assoc();
        $stmtInv->close();

        $saldoActual = $rowInv['cantidad'] ?? 0;
        
        if ($saldoActual < $monto) {
            send_error("Fondos insuficientes en la caja de origen. Disponible: " . number_format($saldoActual, 2));
        }

        // 2. Insertar Traspaso (Estado: Pendiente)
        $stmt = $conn->prepare("INSERT INTO traspasos (fecha, origen_id, destino_id, divisa_id, monto, estado, metodo_pago, usuario_id, observaciones) VALUES (NOW(), ?, ?, ?, ?, 'Pendiente', 'Efectivo', ?, ?)");
        
        $stmt->bind_param("iisdis", $origen_id, $destino_id, $divisa_id, $monto, $usuario_id, $observaciones);
        
        if (!$stmt->execute()) throw new Exception("Error al crear registro: " . $stmt->error);
        $stmt->close();

        // 3. MOVIMIENTO DE INVENTARIO (INMEDIATO)
        // Descontar de Origen
        $stmtRestar = $conn->prepare("UPDATE inventarios SET cantidad = cantidad - ? WHERE divisa_id = ? AND caja_id = ?");
        $stmtRestar->bind_param("dsi", $monto, $divisa_id, $origen_id);
        $stmtRestar->execute();
        $stmtRestar->close();

        // Sumar a Destino (Crear si no existe)
        $stmtSumar = $conn->prepare("UPDATE inventarios SET cantidad = cantidad + ? WHERE divisa_id = ? AND caja_id = ?");
        $stmtSumar->bind_param("dsi", $monto, $divisa_id, $destino_id);
        $stmtSumar->execute();
        
        if ($stmtSumar->affected_rows === 0) {
            $stmtInsert = $conn->prepare("INSERT INTO inventarios (caja_id, divisa_id, cantidad, pmp) VALUES (?, ?, ?, 0)");
            $stmtInsert->bind_param("isd", $destino_id, $divisa_id, $monto);
            $stmtInsert->execute();
            $stmtInsert->close();
        }
        $stmtSumar->close();

        // Actualizar estado a completado si el movimiento es inmediato
        // Si tu lógica requiere aceptación, comenta el bloque de movimiento de inventario arriba y cambia estado a Pendiente.
        // Asumimos movimiento inmediato entre cajas propias:
        $conn->query("UPDATE traspasos SET estado = 'Completado' WHERE id = " . $conn->insert_id);

        echo json_encode(["success" => true, "message" => "Traspaso realizado correctamente."]);
        exit;
    }

} catch (Exception $e) {
    send_error("Error del servidor: " . $e->getMessage());
}
?>