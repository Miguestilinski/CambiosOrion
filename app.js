const express = require('express');

const app = express();
const port = process.env.PORT || 3000;

// Configurar la ruta principal
app.get('/', (req, res) => {
    try {
        res.send('Hola Mundo!');
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal Server Error');
    }
});


// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});
