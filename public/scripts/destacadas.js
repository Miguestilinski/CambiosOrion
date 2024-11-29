// Función para cargar las divisas desde el servidor PHP
function loadHighlightedCurrencies() {
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

            const highlightedList = document.getElementById("highlighted-currencies");
            const normalList = document.getElementById("normal-currencies");

            // Limpiar las listas anteriores
            highlightedList.innerHTML = '';
            normalList.innerHTML = '';

            let cambiosDetectados = false;
            let preciosAnteriores = {};

            // Lista de divisas a mostrar y destacar
            const divisasFiltradas = [
                "USD", "EUR", "BRL", "ARS", "PEN", "MXN", "ORO 100"
            ];

            // Recorrer las divisas filtradas
            divisasFiltradas.forEach((key) => {
                const divisa = responseData.find(d => d.nombre === key); // Buscar la divisa en los datos

                if (divisa) {
                    const { icono_circular, compra, venta } = divisa;

                    // Comparar con los precios anteriores
                    if (preciosAnteriores[key]) {
                        const { compra: compraAnterior, venta: ventaAnterior } = preciosAnteriores[key];
                        if (compraAnterior !== compra || ventaAnterior !== venta) {
                            cambiosDetectados = true; // Se detectaron cambios
                        }
                    }

                    // Guardar los precios actuales
                    preciosAnteriores[key] = { compra, venta };

                    const row = document.createElement("tr");

                    // Formatear los valores de compra y venta
                    const formattedCompra = removeTrailingZeros(compra);
                    const formattedVenta = removeTrailingZeros(venta);

                    // Si la divisa es USD o EUR, aplicamos la clase 'divisa-destacada'
                    if (key === "USD" || key === "EUR") {
                        row.classList.add('divisa-destacada');
                        row.innerHTML = `
                            <td class="icono">
                                <span class="nombre">${key}</span>
                                <img src="${icono_circular}" alt="${key} icon">
                            </td>
                            <td class="espacio"></td>
                            <td class="compra">${formattedCompra}</td>
                            <td class="venta">${formattedVenta}</td>
                        `;
                        highlightedList.appendChild(row);
                    } else {
                        row.classList.add('divisa-normal'); // Para las demás divisas
                        row.innerHTML = `
                            <td class="icono"><img src="${icono_circular}" alt="${key} icon"></td>
                            <td class="nombre">${key}</td>
                            <td class="compra">${formattedCompra}</td>
                            <td class="venta">${formattedVenta}</td>
                        `;
                        normalList.appendChild(row);
                    }
                }
            });

            // Si se detectaron cambios, reproducir el sonido de alerta
            if (cambiosDetectados) {
                const priceAlert = new Audio('/orionapp/sounds/alert.mp3');
                priceAlert.play().catch(error => {
                    console.error("Error reproduciendo el sonido de alerta:", error);
                });
            }
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

// Llamar a la función para cargar las divisas destacadas cuando se cargue la página
loadHighlightedCurrencies();
