let exchangeRates = {};

// Llamar a la función para cargar las divisas al inicio
window.onload = function() {
    loadCurrencies();
};

// Cargar las divisas
function loadCurrencies() {
    fetch('obtener_divisas.php') // Cambia esto al archivo PHP que has mencionado
        .then(response => response.json())
        .then(data => {
            const currency1Select = document.getElementById("currency1");
            const currency2Select = document.getElementById("currency2");

            data.forEach(divisa => {
                // Agregar opción para currency1
                const option1 = document.createElement("option");
                option1.value = divisa.nombre; 
                option1.textContent = `${divisa.icono} ${divisa.nombre}`;
                currency1Select.appendChild(option1);

                // Agregar opción para currency2
                const option2 = document.createElement("option");
                option2.value = divisa.nombre; 
                option2.textContent = `${divisa.icono} ${divisa.nombre}`;
                currency2Select.appendChild(option2);

                // Cargar las tasas de cambio
                exchangeRates[divisa.nombre] = {
                    compra: divisa.compra,
                    venta: divisa.venta,
                    tasa: divisa.tasa
                };
            });
        })
        .catch(error => console.error('Error al cargar las divisas:', error));
}

// Función para convertir divisas
function convert() {
    const amount1 = parseFloat(document.getElementById("amount1").value);
    const currency1 = document.getElementById("currency1").value;
    const currency2 = document.getElementById("currency2").value;

    if (amount1 && exchangeRates[currency1]) {
        const rate = exchangeRates[currency1].venta; // Usar la tasa de venta
        const result = (amount1 / rate) * exchangeRates[currency2].compra; // Convertir al valor de currency2
        document.getElementById("amount2").value = result.toFixed(2);
    } else {
        document.getElementById("amount2").value = "0.00";
    }
}
