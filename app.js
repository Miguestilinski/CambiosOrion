// app.js

const express = require('express');
const path = require('path');
const mysql = require('mysql');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

// Cargar las variables de entorno
require('dotenv').config();

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

// Ruta principal que sirve el archivo index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

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


// NUEVA RUTA: Proxy para la API de Google Places
app.get('/api/place-details', async (req, res) => {
  const placeId = req.query.place_id; // Obtén el Place ID desde el query parameter
  const apiKey = "AIzaSyDNWdnOEsPOqlKvBHcg2AN7YY5AGlZ5fcM"; // Clave de la API de Google

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
