// app.js

const express = require('express');
const path = require('path');
const app = express();
const port = 3000; // O el puerto que estés usando

// Servir archivos estáticos desde el directorio "public"
app.use(express.static(path.join(__dirname, 'public')));

// Ruta principal ("/") que sirve el archivo index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Ruta para "/inicio" que sirve el archivo inicio.html
app.get('/inicio', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'inicio.html'));
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
