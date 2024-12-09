let preciosAnteriores = {};

// Crear la conexión al stream SSE
const eventSource = new EventSource('/api/divisas/stream');

eventSource.onopen = () => {
    console.log('Conectado al servidor SSE');
};

eventSource.onmessage = (event) => {
    try {
        const responseData = JSON.parse(event.data);
        processData(responseData);
    } catch (error) {
        console.error('Error al procesar datos desde el servidor SSE:', error);
    }
};

eventSource.onerror = (error) => {
    console.error('Error en la conexión SSE:', error);
    // Puedes intentar reconectar en caso de error (opcional)
    if (eventSource.readyState === EventSource.CLOSED) {
        console.log('Intentando reconectar al servidor SSE...');
    }
};

// Procesar los datos de divisas y actualizar la UI
function processData(data) {
    const highlightedList = document.getElementById("highlighted-currencies");
    const normalList = document.getElementById("normal-currencies");

    // Limpiar las listas anteriores para reconstruirlas
    highlightedList.innerHTML = '';
    normalList.innerHTML = '';

    let cambiosDetectados = false;

    const divisasFiltradas = ["USD", "EUR", "BRL", "ARS", "PEN", "MXN", "ORO 100"];

    divisasFiltradas.forEach((key) => {
        const divisa = data.find(d => d.nombre === key);

        if (divisa && divisa.compra && divisa.venta && divisa.icono_circular) {
            const { icono_circular, compra, venta } = divisa;

            // Comparar con los precios anteriores
            if (preciosAnteriores[key]) {
                const { compra: compraAnterior, venta: ventaAnterior } = preciosAnteriores[key];
                if (compraAnterior !== compra || ventaAnterior !== venta) {
                    cambiosDetectados = true;
                }
            }

            // Actualizar el estado con los nuevos precios
            preciosAnteriores[key] = { compra, venta };

            const row = document.createElement("tr");
            const formattedCompra = removeTrailingZeros(compra);
            const formattedVenta = removeTrailingZeros(venta);

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
                row.classList.add('divisa-normal');
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

    // Reproducir alerta solo si se detectaron cambios significativos en los datos
    if (cambiosDetectados) {
        try {
            const priceAlert = new Audio('/orionapp/sounds/alert.mp3');
            priceAlert.play().catch(error => {
                console.error("Error al intentar reproducir el sonido de alerta:", error);
            });
        } catch (error) {
            console.error("No se pudo reproducir el sonido de alerta:", error);
        }
    }
}

function removeTrailingZeros(value) {
    if (value === null || value === undefined) return '';
    const floatValue = parseFloat(value);
    return floatValue.toString();
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

// Escuchar cambios en el estado de la conexión
window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);
updateOnlineStatus();
