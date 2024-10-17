// Tasa de cambio ficticia para pruebas (puedes conectar una API real si lo prefieres)
const exchangeRates = {
    USD: {
        CLP: 820,
        EUR: 0.95
    },
    EUR: {
        CLP: 870,
        USD: 1.05
    },
    CLP: {
        USD: 0.0012,
        EUR: 0.0011
    }
};

// Función para convertir divisas
function convert() {
    let amount1 = parseFloat(document.getElementById('amount1').value);
    let currency1 = document.getElementById('currency1').value;
    let currency2 = document.getElementById('currency2').value;

    if (isNaN(amount1)) {
        alert("Por favor, introduce un valor válido en el campo de cantidad.");
        return;
    }

    // Comprobar si hay una tasa de cambio para la combinación seleccionada
    let rate = exchangeRates[currency1][currency2];
    if (!rate) {
        alert("No se puede convertir entre estas dos divisas.");
        return;
    }

    // Calcular la conversión
    let amount2 = amount1 * rate;
    document.getElementById('amount2').value = amount2.toFixed(2);
}

// Permitir solo números y decimales en los campos de cantidad
document.getElementById('amount1').addEventListener('input', function (event) {
    const value = event.target.value;
    event.target.value = value.replace(/[^0-9.]/g, ''); // Solo permitir números y puntos decimales
});
