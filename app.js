// app.js
const express = require('express');
const path = require('path');
const mysql = require('mysql');
const axios = require('axios');
const session = require('express-session');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3306;
const { GoogleAuth } = require('google-auth-library');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
require('dotenv').config();

// Configurar las sesiones
app.use(
  session({
    secret: 'my_secret_key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Ajustar en producción a true con HTTPS
  })
);

// Validar que las variables de entorno están configuradas
const requiredEnv = ['DB_HOST', 'DB_USER', 'DB_PASS', 'DB_NAME', 'GOOGLE_APPLICATION_CREDENTIALS'];
requiredEnv.forEach((envVar) => {
  if (!process.env[envVar]) {
    console.error(`Error: La variable de entorno ${envVar} no está definida.`);
    process.exit(1); // Salir si falta una variable importante
  }
});

// Crear conexión a la base de datos
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
};

// Conectar a la base de datos
let db = mysql.createConnection(dbConfig);
db.connect((error) => {
  if (error) console.error('Error al conectar a la base de datos:', error);
  else console.log('Conectado a la base de datos.');
});

// Servir archivos estáticos desde el directorio "public"
app.use(express.static(path.join(__dirname, 'public')));

// Ruta principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'landing.html'));
});

// Ruta SSE para enviar datos de divisas en tiempo real
app.get('/api/divisas/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const sendData = () => {
    const query = 'SELECT nombre, icono, compra, venta, tasa FROM divisas';
    db.query(query, (error, results) => {
      if (error) {
        console.error('Error al consultar la base de datos:', error);
        res.write(`event: error\ndata: ${JSON.stringify({ error: 'Error' })}\n\n`);
      } else {
        res.write(`data: ${JSON.stringify(results)}\n\n`);
      }
    });
  };

  const intervalId = setInterval(sendData, 1000); // Enviar datos cada 1 segundo

  req.on('close', () => {
    clearInterval(intervalId);
    res.end();
    console.log('Cliente desconectado, limpieza de intervalos');
  });

  sendData(); // Enviar datos inmediatamente al conectarse
});

// Simulación del estado de sesión
app.get('/api/session-status', (req, res) => {
  // Simular estado de autenticación (true para autenticado, false para invitado)
  const isAuthenticated = true; // Cambia esto dinámicamente según tu lógica
  res.json({ isAuthenticated });
});

// Ruta para iniciar sesión
app.post('/api/login', (req, res) => {
  const { username } = req.body;

  if (username) {
    req.session.user = { username }; // Guarda datos en la sesión
    return res.status(200).json({ message: 'Sesión iniciada', username });
  }

  res.status(400).json({ message: 'Faltan credenciales' });
});

// Logout
app.post('/api/logout', (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      console.error('Error al cerrar sesión:', error);
      return res.status(500).json({ message: 'Error al cerrar sesión' });
    }

    res.clearCookie('connect.sid');
    return res.status(200).json({ message: 'Sesión cerrada' });
  });
});

// Configurar autenticación con Google
const auth = new GoogleAuth({
  keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  scopes: 'https://www.googleapis.com/auth/cloud-platform',
});

// Proxy para Google Places
app.get('/api/place-details', async (req, res) => {
  const placeId = req.query.place_id; // Obtener Place ID

  if (!placeId) {
    return res.status(400).json({ error: 'Falta el parámetro place_id' });
  }

  try {
    const client = await auth.getClient();
    const token = await client.getAccessToken(); // Obtener token de acceso
    const response = await axios.get('https://maps.googleapis.com/maps/api/place/details/json', {
      headers: { Authorization: `Bearer ${token.token}` },
      params: {
        place_id: placeId,
        fields: 'name,rating,user_ratings_total,reviews',
      },
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error al obtener datos de Google Places:', error.message);
    res.status(500).json({ error: 'Error al obtener datos de Google Places' });
  }
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});

console.log('Aplicación inicializada con éxito.');
