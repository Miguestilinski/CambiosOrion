// app.js
const express = require('express');
const path = require('path');
const mysql = require('mysql');
const axios = require('axios');
const session = require('express-session');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

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
    cookie: { secure: true }, // Ajustar en producción a true con HTTPS
  })
);

const compression = require('compression');
app.use(compression());

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
  connectTimeout: 10000,
};

// Conectar a la base de datos
let db = mysql.createConnection(dbConfig);
db.connect((error) => {
  if (error) console.error('Error al conectar a la base de datos:', error);
  else console.log('Conectado a la base de datos.');
});

// Rutas estáticas
app.use('/assets', express.static(path.join(__dirname, 'orionapp/assets')));
app.use('/icons', express.static(path.join(__dirname, 'orionapp/icons')));
app.use('/sounds', express.static(path.join(__dirname, 'orionapp/sounds')));

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(503).send("Servicio no disponible temporalmente. Por favor, intenta más tarde.");
});

// Middleware para identificar subdominios
app.use((req, res, next) => {
  const subdomain = req.headers.host.split('.')[0];  // Obtener el subdominio
  req.subdomain = subdomain;
  next();
});

// Ruta principal para cada subdominio
app.get('/', (req, res) => {
  switch (req.subdomain) {
    case 'pizarras':
      res.sendFile(path.join(__dirname, 'subdominios/pizarras', 'index.html'));
      break;
    case 'clientes':
      res.sendFile(path.join(__dirname, 'subdominios/clientes', 'index.html'));
      break;
    case 'admin':
      res.sendFile(path.join(__dirname, 'subdominios/admin', 'index.html'));
      break;
    default:
      res.sendFile(path.join(__dirname, 'public', 'landing.html'));
  }
});

// Ruta SSE para enviar datos de divisas en tiempo real
app.get('/api/divisas/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Keep-Alive', 'timeout=60, max=100');

  const NodeCache = require('node-cache');
  const cache = new NodeCache({ stdTTL: 60, checkperiod: 120 });

  let lastData = null;

  const sendData = () => {
    db.query('SELECT nombre, icono, compra, venta, tasa FROM divisas', (error, results) => {
      if (error) {
        console.error('Error al consultar la base de datos:', error);
        res.write(`event: error\ndata: ${JSON.stringify({ error: 'Error' })}\n\n`);
      } else if (JSON.stringify(results) !== JSON.stringify(lastData)) {
        lastData = results;
        res.write(`data: ${JSON.stringify(results)}\n\n`);
      }
    });
  };

  const intervalId = setInterval(sendData, 5000); // Enviar datos cada 5 segundos

  req.on('close', () => {
    clearInterval(intervalId);
    res.end();
    console.log('Cliente desconectado, limpieza de intervalos');
  });

  sendData(); // Enviar datos inmediatamente al conectarse
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
