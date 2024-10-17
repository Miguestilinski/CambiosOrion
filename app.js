// app.js
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000; // Cambia el puerto si es necesario

// Middleware para servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Ruta principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Otra ruta de ejemplo
app.get('/api', (req, res) => {
    res.json({ message: 'API funcionando' });
});

// Manejo de errores 404
app.use((req, res) => {
    res.status(404).send('Página no encontrada');
});

// Inicia el servidor
app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
