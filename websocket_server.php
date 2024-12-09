<?php
require 'vendor/autoload.php';

use Ratchet\MessageComponentInterface;
use Ratchet\ConnectionInterface;
use Ratchet\Server\WebSocketServer;

class DivisasServer implements MessageComponentInterface {
    protected $clients = [];
    private $lastPrices = [];

    public function onOpen(ConnectionInterface $conn) {
        $this->clients[$conn->resourceId] = $conn;
    }

    public function onMessage(ConnectionInterface $from, $msg) {}

    public function onClose(ConnectionInterface $conn) {
        unset($this->clients[$conn->resourceId]);
    }

    public function onError(ConnectionInterface $conn, \Exception $e) {
        unset($this->clients[$conn->resourceId]);
    }

    private function checkAndSendUpdates() {
        $db = new mysqli('localhost', 'usuario', 'contraseña', 'nombre_basedatos');

        if ($db->connect_error) {
            echo "Error en la conexión a la base de datos: " . $db->connect_error;
            return;
        }

        $result = $db->query("SELECT nombre, compra, venta, icono_circular FROM Divisas");

        if (!$result) return;

        $currentPrices = [];
        while ($row = $result->fetch_assoc()) {
            $currentPrices[$row['nombre']] = [
                'compra' => $row['compra'],
                'venta' => $row['venta'],
                'icono_circular' => $row['icono_circular']
            ];
        }

        if ($this->hasChanges($currentPrices)) {
            foreach ($this->clients as $client) {
                $client->send(json_encode($currentPrices));
            }
        }

        $this->lastPrices = $currentPrices;
    }

    private function hasChanges($currentPrices) {
        foreach ($currentPrices as $key => $price) {
            if (!isset($this->lastPrices[$key]) || 
                $this->lastPrices[$key]['compra'] !== $price['compra'] ||
                $this->lastPrices[$key]['venta'] !== $price['venta']) {
                return true;
            }
        }
        return false;
    }

    public function start() {
        $server = new \Ratchet\Server\IoServer(
            new \Ratchet\WebSocket\WsServer(
                new \Ratchet\Http\HttpServer(
                    new \Ratchet\WebSocket\WsServer($this)
                )
            )
        );

        // Llamar periódicamente para enviar actualizaciones
        swoole_timer_tick(1000, [$this, 'checkAndSendUpdates']);
        $server->run();
    }
}

$server = new DivisasServer();
$server->start();
