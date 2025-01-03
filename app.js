// app.js
const express = require('express');
const path = require('path');
const mysql = require('mysql');
const axios = require('axios');
const session = require('express-session');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3306;

// Cargar las variables de entorno
require('dotenv').config();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
const requiredEnv = ['DB_HOST', 'DB_USER', 'DB_PASS', 'DB_NAME'];
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
