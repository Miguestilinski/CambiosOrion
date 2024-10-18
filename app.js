// app.js

const express = require('express');
const path = require('path');
const app = express();
const port = 3000;
const mysql = require('mysql');

// Conexión a la base de datos
const db = mysql.createConnection({
  host: 'localhost',
  user: 'cambioso_admin',
  password: 'sFI2J7P.%3bO',
  database: 'cambioso_db'
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

  const query = `SELECT rate FROM divisas WHERE currency_from = ? AND currency_to = ? ORDER BY updated_at DESC LIMIT 1`;
  db.query(query, [from, to], (error, results) => {
      if (error) {
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
