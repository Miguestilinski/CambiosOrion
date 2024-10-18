let exchangeRates = {};

function loadExchangeRates() {
    fetch('obtener_divisas.php')
        .then(response => response.json())
        .then(data => {
            exchangeRates = {};
            data.forEach(divisa => {
                // Guardar las tasas de conversión en el objeto exchangeRates
                exchangeRates[divisa.nombre] = {
                    compra: divisa.compra,
                    venta: divisa.venta,
                    tasa: divisa.tasa
                };
            });
        })
        .catch(error => console.error('Error al cargar las tasas de cambio:', error));
}

// Llamar a la función para cargar las tasas al inicio
loadExchangeRates();

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
