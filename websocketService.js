const mysql = require('mysql');
const WebSocket = require('ws');
const dotenv = require('dotenv');
dotenv.config();

// Crear la conexión MySQL
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

// Conectar a la base de datos
db.connect((error) => {
  if (error) {
    console.error('Error al conectar a la base de datos:', error);
    process.exit(1);
  }
  console.log('Conectado a la base de datos.');
});

const wss = new WebSocket.Server({ port: 8080 });

// Función para enviar datos de las divisas a los clientes conectados
function sendCurrencyData() {
  const query = 'SELECT nombre, icono, compra, venta FROM divisas';
  db.query(query, (error, results) => {
    if (error) {
      console.error('Error al obtener datos de la base de datos:', error);
      return;
    }

    const jsonResponse = JSON.stringify(results);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(jsonResponse);
      }
    });
  });
}

// Configurar envío de datos periódicos
setInterval(sendCurrencyData, 1000);

// Exportar el servidor WebSocket y la función
module.exports = { wss, sendCurrencyData };
