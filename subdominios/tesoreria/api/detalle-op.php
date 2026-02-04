<?php
require_once __DIR__ . '/../../../data/conexion.php';

// =================================================================================
// FUNCIÓN CENTRAL: RECALCULAR ESTADO MATEMÁTICAMENTE
// =================================================================================
function recalcularEstadoOperacion($conn, $idOperacion) {
    // 1. Obtener Metas (Lo que se debe pagar)
    $stmt = $conn->prepare("SELECT tipo_transaccion, total FROM operaciones WHERE id = ?");
    $stmt->bind_param("i", $idOperacion);
    $stmt->execute();
    $opData = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$opData) return;

    $esVenta = ($opData['tipo_transaccion'] === 'Venta');
    $metaCLP = floatval($opData['total']);
    
    // Sumar todas las divisas extranjeras del detalle (Meta Divisa)
    $stmt = $conn->prepare("SELECT SUM(monto) as total_divisa FROM detalles_operaciones WHERE operacion_id = ?");
    $stmt->bind_param("i", $idOperacion);
    $stmt->execute();
    $detData = $stmt->get_result()->fetch_assoc();
    $stmt->close();
    
    $metaDivisa = floatval($detData['total_divisa'] ?? 0);

    // 2. Obtener Realidad (Lo que se ha pagado realmente)
    // D47 es el ID interno del Peso Chileno. !D47 = Divisas Extranjeras
    
    // Sumar Ingresos (Lo que pagó el Cliente)
    $sqlIng = "SELECT 
                SUM(CASE WHEN divisa_id = 'D47' THEN monto ELSE 0 END) as pagado_clp,
                SUM(CASE WHEN divisa_id != 'D47' THEN monto ELSE 0 END) as pagado_divisa
               FROM ingresos WHERE operacion_id = ? AND estado != 'Anulado'";
    
    $stmt = $conn->prepare($sqlIng);
    $stmt->bind_param("i", $idOperacion);
    $stmt->execute();
    $ingresos = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    // Sumar Egresos (Lo que pagó Orion)
    $sqlEgr = "SELECT 
                SUM(CASE WHEN divisa_id = 'D47' THEN monto ELSE 0 END) as pagado_clp,
                SUM(CASE WHEN divisa_id != 'D47' THEN monto ELSE 0 END) as pagado_divisa
               FROM egresos WHERE operacion_id = ? AND estado != 'Anulado'";
    
    $stmt = $conn->prepare($sqlEgr);
    $stmt->bind_param("i", $idOperacion);
    $stmt->execute();
    $egresos = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    // 3. Evaluar Cumplimiento (Con pequeña tolerancia por decimales)
    $epsilon = 10.0; 
    $clienteCumplio = false;
    $orionCumplio = false;

    if ($esVenta) {
        // VENTA: Cliente compra divisa.
        // Cliente debe pagar CLP (Ingreso D47) >= Total Operación
        // Orion debe entregar Divisa (Egreso !D47) >= Total Divisas
        
        $clientePagoCLP = floatval($ingresos['pagado_clp'] ?? 0);
        $orionPagoDivisa = floatval($egresos['pagado_divisa'] ?? 0);

        if ($clientePagoCLP >= ($metaCLP - $epsilon)) $clienteCumplio = true;
        if ($orionPagoDivisa >= ($metaDivisa - 0.1)) $orionCumplio = true; 

    } else {
        // COMPRA: Cliente vende divisa.
        // Cliente debe entregar Divisa (Ingreso !D47) >= Total Divisas
        // Orion debe pagar CLP (Egreso D47) >= Total Operación
        
        $clienteEntregoDivisa = floatval($ingresos['pagado_divisa'] ?? 0);
        $orionPagoCLP = floatval($egresos['pagado_clp'] ?? 0);

        if ($clienteEntregoDivisa >= ($metaDivisa - 0.1)) $clienteCumplio = true;
        if ($orionPagoCLP >= ($metaCLP - $epsilon)) $orionCumplio = true;
    }

    // 4. Determinar Nuevo Estado
    $nuevoEstado = 'Vigente';
    
    // Si hay cualquier movimiento de dinero válido, es al menos Abonado
    $totalMovimientos = floatval($ingresos['pagado_clp']) + floatval($ingresos['pagado_divisa']) + 
                        floatval($egresos['pagado_clp']) + floatval($egresos['pagado_divisa']);
    
    if ($totalMovimientos > 0) {
        $nuevoEstado = 'Abonado';
    }

    // Solo si AMBOS cumplieron sus metas al 100%, pasa a Pagado
    if ($clienteCumplio && $orionCumplio) {
        $nuevoEstado = 'Pagado';
    }

    // 5. Actualizar Base de Datos
    $stmt = $conn->prepare("UPDATE operaciones SET estado = ? WHERE id = ?");
    $stmt->bind_param("si", $nuevoEstado, $idOperacion);
    $stmt->execute();
    $stmt->close();
}
// =================================================================================

// --- LOGICA POST (Registrar Pagos / Anular) ---
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);

    if ($data === null) {
        echo json_encode(["success" => false, "message" => "JSON inválido o vacío"]);
        exit;
    }

    $id = intval($data['id']);

    // Caso 1: Registrar pagos o pago
    if (isset($data['pagos'], $data['origen'], $data['tipo_pago'], $data['caja_id'], $data['divisa'])) {
        $pagos = floatval($data['pagos']);
        // NOTA: Ignoramos $data['estado'] enviado por JS. Lo calculamos aquí.
        
        $origen = $conn->real_escape_string($data['origen']);
        $tipo_pago = $conn->real_escape_string($data['tipo_pago']);
        $caja_id = intval($data['caja_id']);
        $divisa_id = $conn->real_escape_string($data['divisa']);
        $cliente_id = isset($data['cliente_id']) ? intval($data['cliente_id']) : 0;
        $cuenta_id = isset($data['cuenta_id']) && !empty($data['cuenta_id']) ? intval($data['cuenta_id']) : null;

        $conn->begin_transaction();

        try {
            if ($origen === "cliente") {
                // Insertar ingreso
                $stmt = $conn->prepare("INSERT INTO ingresos (operacion_id, monto, fecha, tipo_ingreso, estado, caja_id, divisa_id, cliente_id, cuenta_id) VALUES (?, ?, NOW(), ?, 'Vigente', ?, ?, ?, ?)");
                $stmt->bind_param("idsissi", $id, $pagos, $tipo_pago, $caja_id, $divisa_id, $cliente_id, $cuenta_id);
                $stmt->execute();
                $stmt->close();

                // Inventario Suma
                $stmt = $conn->prepare("UPDATE inventarios SET cantidad = cantidad + ? WHERE divisa_id = ? AND caja_id = ?");
                $stmt->bind_param("dsi", $pagos, $divisa_id, $caja_id);
                $stmt->execute();
                
                if ($stmt->affected_rows === 0) {
                     $stmt->close();
                     $pmp_init = 0.0;
                     $stmt = $conn->prepare("INSERT INTO inventarios (divisa_id, caja_id, cantidad, pmp) VALUES (?, ?, ?, ?)");
                     $stmt->bind_param("sidd", $divisa_id, $caja_id, $pagos, $pmp_init);
                     $stmt->execute();
                } else {
                    $stmt->close();
                }

            } elseif ($origen === "orion") {
                // Chequear inventario
                $stmt = $conn->prepare("SELECT cantidad FROM inventarios WHERE divisa_id = ? AND caja_id = ?");
                $stmt->bind_param("si", $divisa_id, $caja_id);
                $stmt->execute();
                $res = $stmt->get_result();
                $row = $res->fetch_assoc();
                $stmt->close();

                if (!$row || $row['cantidad'] < $pagos) {
                     throw new Exception("Inventario insuficiente en Tesorería/Caja para esa divisa.");
                }

                // Egreso
                $stmt = $conn->prepare("INSERT INTO egresos (operacion_id, monto, fecha, tipo_egreso, estado, caja_id, divisa_id, cliente_id, cuenta_id) VALUES (?, ?, NOW(), ?, 'Vigente', ?, ?, ?, ?)");
                $stmt->bind_param("idsissi", $id, $pagos, $tipo_pago, $caja_id, $divisa_id, $cliente_id, $cuenta_id);
                $stmt->execute();
                $stmt->close();

                // Inventario Resta
                $stmt = $conn->prepare("UPDATE inventarios SET cantidad = cantidad - ? WHERE divisa_id = ? AND caja_id = ?");
                $stmt->bind_param("dsi", $pagos, $divisa_id, $caja_id);
                $stmt->execute();
                $stmt->close();
            } else {
                throw new Exception("Origen inválido.");
            }

            // --- AQUÍ LLAMAMOS A LA FUNCIÓN MÁGICA ---
            recalcularEstadoOperacion($conn, $id);

            $conn->commit();
            echo json_encode(["success" => true]);
        } catch (Exception $e) {
            $conn->rollback();
            echo json_encode(["success" => false, "message" => "Error: " . $e->getMessage()]);
        }
        exit;
    }
    
    // Lógica de Anular Operación Completa
    else if (!isset($data['pagos']) && isset($data['id']) && !isset($data['origen'])) {
        $stmt = $conn->prepare("UPDATE operaciones SET estado = 'Anulado' WHERE id = ?");
        $stmt->bind_param("i", $id);
        if ($stmt->execute()) echo json_encode(["success" => true]);
        else echo json_encode(["success" => false, "message" => $stmt->error]);
        $stmt->close();
        exit;
    }

    // Lógica de Eliminar Pago Individual
    else if (isset($data['id'], $data['origen']) && !isset($data['pagos'])) {
        $pagoId = intval($data['id']);
        $origen = $conn->real_escape_string($data['origen']);
        
        $conn->begin_transaction();
        try {
             $tabla = ($origen === 'cliente') ? 'ingresos' : 'egresos';
             
             // Recuperar datos incluyendo ID de operacion
             $stmt = $conn->prepare("SELECT operacion_id, monto, divisa_id, caja_id FROM $tabla WHERE id = ?");
             $stmt->bind_param("i", $pagoId);
             $stmt->execute();
             $res = $stmt->get_result();
             $pagoData = $res->fetch_assoc();
             $stmt->close();
             
             if(!$pagoData) throw new Exception("Pago no encontrado");
             
             $opId = $pagoData['operacion_id']; // Guardamos ID Op

             // Anular registro
             $stmt = $conn->prepare("UPDATE $tabla SET estado = 'Anulado' WHERE id = ?");
             $stmt->bind_param("i", $pagoId);
             $stmt->execute();
             $stmt->close();

             // Revertir Inventario
             $factor = ($origen === 'cliente') ? -1 : 1; 
             $montoAjuste = $pagoData['monto'] * $factor;
             
             if ($montoAjuste > 0) {
                 $stmt = $conn->prepare("UPDATE inventarios SET cantidad = cantidad + ? WHERE divisa_id = ? AND caja_id = ?");
                 $stmt->bind_param("dsi", $montoAjuste, $pagoData['divisa_id'], $pagoData['caja_id']);
             } else {
                 $absMonto = abs($montoAjuste);
                 $stmt = $conn->prepare("UPDATE inventarios SET cantidad = cantidad - ? WHERE divisa_id = ? AND caja_id = ?");
                 $stmt->bind_param("dsi", $absMonto, $pagoData['divisa_id'], $pagoData['caja_id']);
             }
             $stmt->execute();
             $stmt->close();
             
             // --- RECALCULAMOS TAMBIÉN AL BORRAR ---
             // Esto hace que si borras un pago, la operación vuelva a 'Abonado' automáticamente
             recalcularEstadoOperacion($conn, $opId);
             
             $conn->commit();
             echo json_encode(["success" => true]);

        } catch (Exception $e) {
            $conn->rollback();
            echo json_encode(["success" => false, "message" => $e->getMessage()]);
        }
        exit;
    }
}

// --- MANEJAR GET (Obtener Detalles) ---
if ($_SERVER['REQUEST_METHOD'] === 'GET') {

    if (isset($_GET['buscar_divisas'])) {
        $operacionId = intval($_GET['operacion_id']);
        // Incluimos D47 explicitamente
        $sql = "SELECT DISTINCT d.id, d.nombre 
                FROM detalles_operaciones det
                LEFT JOIN divisas_internas d ON det.divisa_id = d.id
                WHERE det.operacion_id = $operacionId
                UNION
                SELECT id, nombre FROM divisas_internas WHERE id = 'D47'";
        $result = $conn->query($sql);
        $divisas = [];
        if ($result) { while ($row = $result->fetch_assoc()) { $divisas[] = $row; } }
        echo json_encode($divisas);
        exit;
    }

    if (!isset($_GET['id'])) {
        echo json_encode(['error' => 'ID no proporcionado']);
        exit;
    }
    $id = intval($_GET['id']);

    // 1. Operación Base
    $sql = "SELECT o.*, cl.razon_social AS nombre_cliente, v.nombre AS vendedor, c.nombre AS caja
            FROM operaciones o
            LEFT JOIN clientes cl ON o.cliente_id = cl.id
            LEFT JOIN equipo v ON o.vendedor_id = v.id
            LEFT JOIN cajas c ON o.caja_id = c.id
            WHERE o.id = $id";
    
    $result = $conn->query($sql);
    if (!$result) { echo json_encode(['error' => 'SQL Error Op: ' . $conn->error]); exit; }
    if ($result->num_rows === 0) { echo json_encode(['error' => 'Operación no encontrada']); exit; }
    $operacion = $result->fetch_assoc();

    // 2. Detalles Divisas
    $detalles = [];
    $sqlDetalles = "SELECT det.*, d.nombre AS divisa, d.icono AS divisa_icono, d.codigo AS divisa_codigo, d.simbolo AS divisa_simbolo
                    FROM detalles_operaciones det
                    LEFT JOIN divisas_internas d ON det.divisa_id = d.id
                    WHERE det.operacion_id = $id";
    
    $resDetalles = $conn->query($sqlDetalles);
    if (!$resDetalles) { echo json_encode(['error' => 'SQL Error Detalles: ' . $conn->error]); exit; }
    while ($row = $resDetalles->fetch_assoc()) { $detalles[] = $row; }

    // 3. Pagos (Ingresos)
    $pagos = [];
    $sqlIngresos = "SELECT i.id, i.fecha, i.tipo_ingreso AS tipo, d.nombre AS divisa, d.icono AS divisa_icono, d.codigo AS divisa_codigo, d.simbolo AS divisa_simbolo, i.monto, 'cliente' AS origen, i.divisa_id, cta.nombre AS cuenta_nombre 
                    FROM ingresos i 
                    LEFT JOIN divisas_internas d ON i.divisa_id = d.id 
                    LEFT JOIN cuentas cta ON i.cuenta_id = cta.id 
                    WHERE i.operacion_id = $id AND i.estado != 'Anulado'";
    
    $resIngresos = $conn->query($sqlIngresos);
    if (!$resIngresos) { echo json_encode(['error' => 'SQL Error Ingresos: ' . $conn->error]); exit; }
    while ($row = $resIngresos->fetch_assoc()) { $pagos[] = $row; }

    // 4. Pagos (Egresos)
    $sqlEgresos = "SELECT e.id, e.fecha, e.tipo_egreso AS tipo, d.nombre AS divisa, d.icono AS divisa_icono, d.codigo AS divisa_codigo, d.simbolo AS divisa_simbolo, e.monto, 'orion' AS origen, e.divisa_id, cta.nombre AS cuenta_nombre 
                   FROM egresos e 
                   LEFT JOIN divisas_internas d ON e.divisa_id = d.id 
                   LEFT JOIN cuentas cta ON e.cuenta_id = cta.id 
                   WHERE e.operacion_id = $id AND e.estado != 'Anulado'";
    
    $resEgresos = $conn->query($sqlEgresos);
    if (!$resEgresos) { echo json_encode(['error' => 'SQL Error Egresos: ' . $conn->error]); exit; }
    while ($row = $resEgresos->fetch_assoc()) { $pagos[] = $row; }

    $totalPagado = 0;
    foreach ($pagos as $p) { $totalPagado += floatval($p['monto']); }
    $operacion['monto_pagado'] = $totalPagado;

    echo json_encode(['operacion' => $operacion, 'detalles' => $detalles, 'pagos' => $pagos]);
    exit;
}
?>