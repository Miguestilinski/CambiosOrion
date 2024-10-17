const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000; // Asegúrate de que esto esté configurado correctamente

// Middleware para servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Configurar la ruta principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html')); // Asegúrate de que este archivo exista
});

// Manejo de errores
app.use((req, res, next) => {
    res.status(404).send('404 Not Found'); // Manejo de rutas no encontradas
});

app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});
