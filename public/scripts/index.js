let exchangeRates = {};

// Llamar a la función para cargar las divisas al inicio
window.onload = function() {
    loadCurrencies();
    loadExchangeRates();
};

function loadCurrencies() {
    fetch('/api/divisas') // Cambiado a la ruta correcta de tu API
        .then(response => response.json())
        .then(data => {
            const currency1Select = document.getElementById("currency1");
            const currency2Select = document.getElementById("currency2");

            data.forEach(divisa => {
                const option1 = document.createElement("option");
                option1.value = divisa.nombre; // Asumiendo que 'nombre' es el campo correcto
                option1.textContent = `${divisa.icono} ${divisa.nombre}`;
                currency1Select.appendChild(option1);

                const option2 = document.createElement("option");
                option2.value = divisa.nombre;
                option2.textContent = `${divisa.icono} ${divisa.nombre}`;
                currency2Select.appendChild(option2);
            });
        })
        .catch(error => console.error('Error al cargar las divisas:', error));
}

function loadExchangeRates() {
    fetch('/api/divisas') // Cambiado a la ruta correcta de tu API
        .then(response => response.json())
        .then(data => {
            exchangeRates = {};
            data.forEach(divisa => {
                // Guardar las tasas de conversión en el objeto exchangeRates
                exchangeRates[divisa.nombre] = {
                    compra: divisa.compra, // Asegúrate de que estos campos existan en tu respuesta
                    venta: divisa.venta,
                    tasa: divisa.tasa
                };
            });
        })
        .catch(error => console.error('Error al cargar las tasas de cambio:', error));
}

function convert() {
    const amount1 = document.getElementById("amount1").value;
    const currency1 = document.getElementById("currency1").value;
    const currency2 = document.getElementById("currency2").value;

    if (amount1 && exchangeRates[currency1]) {
        const rate = exchangeRates[currency1].venta; // Usar la tasa de venta
        const result = amount1 * rate;
        document.getElementById("amount2").value = result.toFixed(2);
    } else {
        document.getElementById("amount2").value = "0.00";
    }
}
