<?php
// 1. Incluir la conexión centralizada
require_once __DIR__ . '/../../../../data/conexion.php';

// Configuraciones extra específicas de este archivo
ini_set('display_errors', 0); // Mantener errores ocultos para no romper el JSON
error_reporting(E_ALL);
date_default_timezone_set('America/Santiago');

try {
    // Verificamos que la conexión exista (por seguridad)
    if (!isset($conn)) {
        throw new Exception("Error: No se pudo cargar la conexión centralizada.");
    }

    // =========================================================================
    // GET: LEER INVENTARIO TESORERÍA (Caja 99)
    // =========================================================================
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $caja_id = 99; // Tesorería fija

        // 1. Obtener saldos de inventario
        $inventario = [];
        $sqlInv = "SELECT divisa_id, cantidad FROM inventarios WHERE caja_id = ?";
        $stmt = $conn->prepare($sqlInv);
        if(!$stmt) throw new Exception("Error SQL Inventario: " . $conn->error);
        
        $stmt->bind_param("i", $caja_id);
        $stmt->execute();
        $res = $stmt->get_result();
        while($row = $res->fetch_assoc()) {
            $inventario[$row['divisa_id']] = (float)$row['cantidad'];
        }
        $stmt->close();

        // 2. Obtener lista de divisas activas
        $divisasData = [];
        $sqlDiv = "SELECT id, nombre, codigo, icono, denominacion FROM divisas_internas WHERE estado = 1 ORDER BY nombre ASC";
        $resDiv = $conn->query($sqlDiv);
        
        if($resDiv) {
            while($row = $resDiv->fetch_assoc()) {
                $divisasData[] = [
                    'id' => $row['id'],
                    'nombre' => $row['nombre'],
                    'codigo' => $row['codigo'],
                    'icono' => $row['icono'],
                    'denominacion' => $row['denominacion'],
                    'total_sistema' => isset($inventario[$row['id']]) ? $inventario[$row['id']] : 0
                ];
            }
        }

        echo json_encode([
            "success" => true,
            "caja_id" => $caja_id,
            "divisas" => $divisasData
        ]);
        exit;
    }

    // =========================================================================
    // POST: GUARDAR ARQUEO
    // =========================================================================
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = json_decode(file_get_contents("php://input"), true);
        
        if (!$input) throw new Exception("Datos inválidos (JSON mal formado).");

        $usuario_id = intval($input['equipo_id'] ?? 0);
        $caja_id = intval($input['caja_id'] ?? 99);
        $observacion = $conn->real_escape_string($input['observacion'] ?? '');
        $divisas = $input['divisas'] ?? [];

        if (empty($divisas)) throw new Exception("No hay detalles de divisas.");

        $conn->begin_transaction();

        // 1. Insertar Cabecera
        $sqlHead = "INSERT INTO arqueos (usuario_id, caja_id, fecha, observaciones) VALUES (?, ?, NOW(), ?)";
        $stmtHead = $conn->prepare($sqlHead);
        if(!$stmtHead) throw new Exception("Error SQL Cabecera: " . $conn->error);
        
        $stmtHead->bind_param("iis", $usuario_id, $caja_id, $observacion);
        $stmtHead->execute();
        $arqueo_id = $conn->insert_id;
        $stmtHead->close();

        // 2. Insertar Detalles
        $sqlDet = "INSERT INTO arqueos_detalle (arqueo_id, divisa_id, saldo_sistema, saldo_fisico, denominaciones_json) VALUES (?, ?, ?, ?, ?)";
        $stmtDet = $conn->prepare($sqlDet);
        if(!$stmtDet) throw new Exception("Error SQL Detalle: " . $conn->error);

        foreach ($divisas as $d) {
            $div_id = intval($d['divisa_id']);
            $sis = floatval($d['total_sistema']);
            $fis = floatval($d['total_arqueo']);
            $json = $d['denominaciones_json'] ?? '{}';

            $stmtDet->bind_param("iidds", $arqueo_id, $div_id, $sis, $fis, $json);
            $stmtDet->execute();
        }
        $stmtDet->close();

        $conn->commit();
        echo json_encode(["success" => true, "mensaje" => "Guardado correctamente", "arqueo_id" => $arqueo_id]);
        exit;
    }

} catch (Exception $e) {
    if (isset($conn) && $conn->errno) $conn->rollback();
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}

if (isset($conn)) $conn->close();
?>