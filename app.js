// app.js

const express = require('express');
const path = require('path');
const mysql = require('mysql');
const app = express();
const port = process.env.PORT || 3000; // Usar el puerto de la variable de entorno o 3000

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
    return process.exit(1); // Salir del proceso en caso de error
  }
  console.log('Conectado a la base de datos.');
});

// Servir archivos estáticos desde el directorio "public"
app.use(express.static(path.join(__dirname, 'public')));

// Ruta principal ("/") que sirve el archivo index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Ruta para obtener las tasas de cambio
app.get('/api/divisas', (req, res) => {
  const { from, to } = req.query;

  if (!from || !to) {
    return res.status(400).send('Se requieren los parámetros from y to.');
  }

  const query = `SELECT rate FROM divisas WHERE currency_from = ? AND currency_to = ? ORDER BY updated_at DESC LIMIT 1`;
  db.query(query, [from, to], (error, results) => {
    if (error) {
      console.error('Error al consultar la base de datos:', error);
      return res.status(500).send('Error al consultar la base de datos');
    }
    if (results.length > 0) {
      res.json({ rate: results[0].rate });
    } else {
      res.status(404).send('Tasa de cambio no encontrada');
    }
  });
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
