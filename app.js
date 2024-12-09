// app.js

const express = require('express');
const path = require('path');
const mysql = require('mysql');
const axios = require('axios');
const WebSocket = require('ws');
const app = express();
const cors = require('cors');
const port = process.env.PORT || 3000;

// Cargar las variables de entorno
require('dotenv').config();

app.use(cors());
app.use(express.json());

// Crear conexión a la base de datos
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME
});

// Conectar a la base de datos y manejar errores
db.connect((error) => {
  if (error) {
    console.error('Error al conectar a la base de datos:', error.stack);
    return process.exit(1);
  }
  console.log('Conectado a la base de datos.');
});

// Servir archivos estáticos desde el directorio "public"
app.use(express.static(path.join(__dirname, 'public')));


// Ruta principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'landing.html'));
});

// Configurar servidor WebSocket
const wss = new WebSocket.Server({ port: 8080 }); // Crear servidor WebSocket en el puerto 8080
console.log('Servidor WebSocket iniciado en el puerto 8080');

// Ruta para obtener todas las divisas
app.get('/api/divisas', (req, res) => {
  console.log('Solicitando divisas...');
  const query = 'SELECT nombre, icono, compra, venta, tasa FROM divisas'; // Ajusta esto según tu tabla

  db.query(query, (error, results) => {
      if (error) {
          console.error('Error al consultar la base de datos:', error);
          return res.status(500).json({ error: 'Error al consultar la base de datos', details: error });
      }
      res.json(results); // Devuelve las divisas en formato JSON
  });
});

// Ejecutar la consulta periódicamente cada 5 segundos
setInterval(sendCurrencyData, 1000);

// Conectar clientes WebSocket
wss.on('connection', (ws) => {
  console.log('Cliente conectado al servidor WebSocket.');

  // Enviar datos inmediatamente después de conectar
  sendCurrencyData();

  ws.on('message', (message) => {
    console.log('Mensaje recibido desde el cliente:', message);
  });

  ws.on('close', () => {
    console.log('Cliente desconectado del servidor WebSocket.');
  });
});

// Simulación del estado de sesión
app.get('/api/session-status', (req, res) => {
  // Simular estado de autenticación (true para autenticado, false para invitado)
  const isAuthenticated = true; // Cambia esto dinámicamente según tu lógica
  res.json({ isAuthenticated });
});

// Logout
app.post('/api/logout', (req, res) => {
  // Aquí puedes manejar la lógica de cierre de sesión, como eliminar cookies o tokens
  res.status(200).json({ message: 'Sesión cerrada correctamente.' });
});

// Proxy para la API de Google Places
app.get('/api/place-details', async (req, res) => {
  const placeId = req.query.place_id; // Obtén el Place ID desde el query parameter
  const apiKey = process.env.GOOGLE_API_KEY; // Clave de la API de Google

  try {
      const response = await axios.get(
          `https://maps.googleapis.com/maps/api/place/details/json`,
          {
              params: {
                  place_id: placeId,
                  fields: "name,rating,user_ratings_total,reviews",
                  key: apiKey,
              },
          }
      );

      res.json(response.data); // Devuelve los datos de Google Places al cliente
  } catch (error) {
      console.error('Error al obtener datos de Google Places:', error.message);
      res.status(500).json({ error: 'Error al obtener datos de Google Places' });
  }
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
