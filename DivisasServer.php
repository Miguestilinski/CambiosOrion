<?php
require 'vendor/autoload.php';

use Ratchet\MessageComponentInterface;
use Ratchet\ConnectionInterface;

class DivisasServer implements MessageComponentInterface
{
    protected $clients = [];

    public function onOpen(ConnectionInterface $conn)
    {
        // Guardar la conexión de cliente
        $this->clients[$conn->resourceId] = $conn;
        echo "Conexión abierta: {$conn->resourceId}\n";
    }

    public function onMessage(ConnectionInterface $from, $msg)
    {
        echo "Mensaje recibido: $msg\n";
    }

    public function onClose(ConnectionInterface $conn)
    {
        unset($this->clients[$conn->resourceId]);
        echo "Conexión cerrada: {$conn->resourceId}\n";
    }

    public function onError(ConnectionInterface $conn, \Exception $e)
    {
        echo "Error en la conexión: {$e->getMessage()}\n";
    }

    public function sendCurrencyUpdates()
    {
        // Simulación de precios actualizados
        $divisas = [
            'USD' => rand(700, 900),
            'EUR' => rand(750, 950),
            'GBP' => rand(800, 1000),
        ];

        $json_data = json_encode($divisas);

        foreach ($this->clients as $client) {
            $client->send($json_data);
        }

        echo "Actualización enviada: $json_data\n";
    }
}
