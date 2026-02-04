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

    // --- GET (Datos) ---
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        
        // 1. Cajas
        if (isset($_GET['buscar_cajas'])) {
            $cajas = [];
            $sql = "SELECT id, nombre FROM cajas WHERE estado = 1 ORDER BY CASE WHEN nombre LIKE '%Tesoreria%' THEN 0 ELSE 1 END, nombre ASC";
            $res = $conn->query($sql);
            while ($row = $res->fetch_assoc()) $cajas[] = $row;
            echo json_encode($cajas);
            exit;
        }

        // 2. Divisas
        if (isset($_GET['buscar_divisas'])) {
            $divisas = [];
            $sql = "SELECT id, nombre, codigo, icono FROM divisas_internas WHERE estado = 1 OR estado = 'Habilitada' ORDER BY codigo ASC";
            $res = $conn->query($sql);
            while ($row = $res->fetch_assoc()) $divisas[] = $row;
            echo json_encode($divisas);
            exit;
        }

        // 3. Clientes (Buscador)
        if (isset($_GET['buscar_clientes'])) {
            $q = $conn->real_escape_string($_GET['buscar_clientes']);
            $clientes = [];
            $sql = "SELECT id, razon_social, rut FROM clientes WHERE activo = 1 AND (razon_social LIKE '%$q%' OR rut LIKE '%$q%') LIMIT 15";
            $res = $conn->query($sql);
            while ($row = $res->fetch_assoc()) $clientes[] = $row;
            echo json_encode($clientes);
            exit;
        }

        // 4. Cuentas (Internas / Contables)
        if (isset($_GET['buscar_cuentas'])) {
            $cuentas = [];
            // CORRECCIÓN: Usamos 'c.nombre' (según tu tabla) en lugar de 'c.nombre_cuenta'
            $sql = "SELECT c.id, c.nombre, d.codigo as divisa, cl.razon_social as cliente 
                    FROM cuentas c 
                    LEFT JOIN divisas_internas d ON c.divisa_id = d.id
                    LEFT JOIN clientes cl ON c.cliente_id = cl.id
                    WHERE c.activa = 1 
                    ORDER BY c.nombre ASC";
            
            $res = $conn->query($sql);
            
            if ($res) {
                while ($row = $res->fetch_assoc()) $cuentas[] = $row;
            }
            
            echo json_encode($cuentas);
            exit;
        }
    }

    // --- POST (Registrar Egreso Operacional) ---
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);

        $caja_id = $data['caja_id'] ?? null;
        $cliente_id = $data['cliente_id'] ?? null;
        $divisa_id = $data['divisa_id'] ?? null;
        $monto = floatval($data['monto'] ?? 0);
        $obs = $data['observaciones'] ?? '';
        $usuario_id = $data['usuario_id'] ?? 0;
        
        $es_cuenta = $data['es_cuenta'] ?? false;
        $cuenta_id = ($es_cuenta && !empty($data['cuenta_id'])) ? $data['cuenta_id'] : null;

        if (!$caja_id || !$cliente_id || !$divisa_id || $monto <= 0) {
            send_error("Faltan datos obligatorios (Caja, Cliente, Divisa, Monto).");
        }

        // 1. Validar Stock (Siempre)
        $stmtChk = $conn->prepare("SELECT cantidad FROM inventarios WHERE divisa_id = ? AND caja_id = ?");
        $stmtChk->bind_param("si", $divisa_id, $caja_id);
        $stmtChk->execute();
        $resChk = $stmtChk->get_result();
        
        if ($resChk->num_rows === 0) {
            $stmtChk->close();
            send_error("No hay inventario iniciado para esta divisa en la caja.");
        }
        
        $filaInv = $resChk->fetch_assoc();
        $stockActual = floatval($filaInv['cantidad']);
        $stmtChk->close();

        if ($stockActual < $monto) {
            send_error("Fondos insuficientes en caja. Disponible: " . number_format($stockActual, 2));
        }

        // 2. Transacción
        $conn->begin_transaction();

        try {
            // A. Insertar Egreso (Tipo Fijo: Operacional)
            $sqlIns = "INSERT INTO egresos 
                (fecha, tipo_egreso, categoria, cliente_id, caja_id, cuenta_id, divisa_id, monto, estado, observaciones, usuario_id)
                VALUES (NOW(), 'Operacional', 'Operacional', ?, ?, ?, ?, ?, 'Vigente', ?, ?)";
            
            $stmtIns = $conn->prepare($sqlIns);
            // Tipos: s(cli), i(caja), i(cta), s(div), d(monto), s(obs), i(user)
            $stmtIns->bind_param("siisdsi", $cliente_id, $caja_id, $cuenta_id, $divisa_id, $monto, $obs, $usuario_id);
            
            if (!$stmtIns->execute()) throw new Exception("Error al guardar egreso: " . $stmtIns->error);
            $stmtIns->close();

            // B. Restar Inventario
            $sqlUpd = "UPDATE inventarios SET cantidad = cantidad - ? WHERE divisa_id = ? AND caja_id = ?";
            $stmtUpd = $conn->prepare($sqlUpd);
            $stmtUpd->bind_param("dsi", $monto, $divisa_id, $caja_id);
            
            if (!$stmtUpd->execute()) throw new Exception("Error al actualizar stock.");
            $stmtUpd->close();

            $conn->commit();
            echo json_encode(["success" => true, "message" => "Egreso operacional registrado."]);

        } catch (Exception $ex) {
            $conn->rollback();
            send_error($ex->getMessage());
        }
        exit;
    }

} catch (Exception $e) {
    send_error("Error del servidor: " . $e->getMessage());
}
?>