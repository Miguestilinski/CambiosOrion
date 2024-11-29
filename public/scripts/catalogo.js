// Función para cargar las divisas desde el servidor PHP
function loadCurrencies() {
    const proxyUrl = 'https://corsproxy.io/?';
    const targetUrl = 'https://cambiosorion.cl/data/obtener_divisas.php'; // URL de obtener_divisas.php

    fetch(proxyUrl + targetUrl)
        .then(response => response.json()) // Suponemos que el servidor devuelve un JSON
        .then(data => {
            // Si los datos están en 'contents', intenta parsearlos
            const responseData = data.contents ? JSON.parse(data.contents) : data;

            // Verificar que los datos son un array de divisas
            if (!Array.isArray(responseData)) {
                console.error("Formato de datos inesperado:", responseData);
                return;
            }

            const list = document.getElementById("currency-list");
            list.innerHTML = ''; // Limpiar la lista anterior

            // Ordenar las divisas de acuerdo a la lista predefinida
            const divisasOrdenadas = [
                "USD", "EUR", "ARS", "BRL", "PEN", "COP",
                "UYU", "BOB", "CAD", "GBP", "JPY", "GNY",
                "SEK", "AUD", "MXN", "NZD", "CHF", "DKK",
                "ORO 100"
            ];

            let cambiosDetectados = false;
            let preciosAnteriores = {};
            
            // Recorrer las divisas y mostrar sus detalles
            divisasOrdenadas.forEach((key) => {
                const divisa = responseData.find(d => d.nombre === key); // Buscar la divisa en los datos

                if (divisa) {
                    if (divisa.nombre === 'CLP') return;

                    const { icono_circular, compra, venta } = divisa;

                    // Formatear los valores de compra y venta usando la función removeTrailingZeros
                    const formattedCompra = removeTrailingZeros(compra);
                    const formattedVenta = removeTrailingZeros(venta);

                    // Comparar con los precios anteriores
                    if (preciosAnteriores[key]) {
                        const { compra: compraAnterior, venta: ventaAnterior } = preciosAnteriores[key];
                        if (compraAnterior !== compra || ventaAnterior !== venta) {
                            cambiosDetectados = true; // Se detectaron cambios
                        }
                    }

                    // Guardar los precios actuales
                    preciosAnteriores[key] = { compra, venta };

                    // Crear la fila de la divisa
                    const row = document.createElement("tr");
                    row.innerHTML = `
                        <td class="icono"><img src="${icono_circular}" alt="${key} icon"></td>
                        <td class="nombre">${key}</td>
                        <td class="compra compra-${key}">${formattedCompra}</td> <!-- Se utiliza el valor formateado -->
                        <td class="venta venta-${key}">${formattedVenta}</td> <!-- Se utiliza el valor formateado -->
                    `;

                    list.appendChild(row);
                }
            });

            // Si se detectaron cambios, reproducir el sonido de alerta
            if (cambiosDetectados) {
                const priceAlert = new Audio('/orionapp/sounds/alert.mp3');
                priceAlert.play().catch(error => {
                    console.error("Error reproduciendo el sonido de alerta:", error);
                });
            }

            // Actualizar la interfaz adicional
            updateAddCurrencyDropdown();
            fillCurrencyTable();
        })
        .catch(error => console.error('Error al cargar las divisas:', error));
}

// Función para manejar el estado de conexión (offline/online)
const offlinePopup = document.getElementById('offline-popup');

// Función para mostrar el pop-up si no hay conexión
function updateOnlineStatus() {
    if (!navigator.onLine) {
        offlinePopup.style.display = 'block';
    } else {
        offlinePopup.style.display = 'none';
    }
}

function removeTrailingZeros(value) {
    if (value === null || value === undefined) return '';
    const floatValue = parseFloat(value);
    return floatValue.toString();
}

// Escuchar cambios en el estado de la conexión
window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);
updateOnlineStatus();
