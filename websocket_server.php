<?php
require 'vendor/autoload.php';
require 'DivisasServer.php';

use Ratchet\WebSocket\WsServer;
use Ratchet\Http\HttpServer;
use React\EventLoop\Factory;
use React\Socket\Server as ReactSocketServer;

// Configura el servidor WebSocket
$loop = Factory::create();
$socketServer = new ReactSocketServer('0.0.0.0:8080', $loop);

$divisasServer = new DivisasServer();
$wsServer = new HttpServer(new \Ratchet\WebSocket\WsServer($divisasServer));

$socketServer->on('connection', function ($conn) use ($divisasServer, $wsServer) {
    $wsServer->onOpen($conn);
    $conn->on('data', function ($msg) use ($conn, $divisasServer) {
        $divisasServer->onMessage($conn, $msg);
    });
    $conn->on('close', function ($conn) use ($divisasServer) {
        $divisasServer->onClose($conn);
    });
    $conn->on('error', function ($error) use ($conn, $divisasServer) {
        $divisasServer->onError($conn, $error);
    });
});

// Ejecutar actualizaciones periódicas cada 5 segundos
$loop->addPeriodicTimer(5, function () use ($divisasServer) {
    $divisasServer->sendCurrencyUpdates();
});

echo "Servidor WebSocket escuchando en el puerto 8080...\n";

$loop->run();
