const express = require('express');

const app = express();
const port = process.env.PORT || 3000;

// Configurar la ruta principal
app.get('/', (req, res) => {
    res.send('¡Hola, mundo!'); // Responde con un mensaje simple
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});
