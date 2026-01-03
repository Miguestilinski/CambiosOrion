let preciosAnteriores = {};
let eventSource;

document.addEventListener('DOMContentLoaded', () => {
    initSSE();
});

function initSSE() {
    eventSource = new EventSource('https://cambiosorion.cl/data/stream_divisas.php');

    eventSource.onopen = () => console.log('🟢 Conectado al servidor SSE');
    
    eventSource.onmessage = (event) => {
        try {
            const responseData = JSON.parse(event.data);
            processData(responseData);
            hideOfflinePopup();
        } catch (error) {
            console.error('Error procesando datos:', error);
        }
    };

    eventSource.onerror = (error) => {
        console.error('🔴 Error SSE:', error);
        showOfflinePopup();
        if (eventSource.readyState === EventSource.CLOSED) {
            setTimeout(initSSE, 5000);
        }
    };
}

function processData(data) {
    const currencyList = document.getElementById("currency-list");
    if (!currencyList) return;
    
    currencyList.innerHTML = ''; 
    let cambiosDetectados = false;

    // Lista ordenada de prioridades para la pantalla
    const divisasOrdenadas = [
        "USD", "EUR", "ARS", "BRL", "PEN", "COP",
        "UYU", "BOB", "CAD", "GBP", "JPY", "CNY",
        "SEK", "AUD", "MXN", "CHF" 
        // He quitado algunas (NZD, DKK, ORO) para asegurar espacio si la pantalla es pequeña, 
        // agrégalas de nuevo al array si las necesitas estrictamente.
    ];

    divisasOrdenadas.forEach((key) => {
        const divisa = data.find(d => d.nombre === key);

        if (divisa && divisa.compra && divisa.venta) {
            const { icono_circular, compra, venta } = divisa;

            // Detección de cambios para animación/sonido
            let highlightClass = "";
            if (preciosAnteriores[key]) {
                if (preciosAnteriores[key].compra !== compra || preciosAnteriores[key].venta !== venta) {
                    cambiosDetectados = true;
                    highlightClass = "animate-pulse bg-white/10"; // Flash visual
                }
            }
            preciosAnteriores[key] = { compra, venta };

            const formattedCompra = removeTrailingZeros(compra);
            const formattedVenta = removeTrailingZeros(venta);
            const row = document.createElement("tr");
            
            // Clases Tailwind para la fila
            row.className = `group transition-colors duration-500 hover:bg-white/5 ${highlightClass}`;

            // Estructura de columnas con tipografía GRANDE
            row.innerHTML = `
                <td class="py-2 px-2 text-center">
                    <div class="relative flex justify-center">
                         <img src="${icono_circular}" alt="${key}" 
                              class="w-10 h-10 md:w-12 md:h-12 object-contain drop-shadow-md transform group-hover:scale-110 transition-transform">
                    </div>
                </td>
                <td class="py-2 px-4 text-left">
                    <span class="text-xl md:text-2xl font-bold text-slate-200 tracking-wide">${key}</span>
                </td>
                <td class="py-2 px-2 text-center bg-black/10">
                    <span class="text-3xl md:text-4xl font-extrabold text-white tracking-widest drop-shadow-md font-mono text-shadow-blue">
                        ${formattedCompra}
                    </span>
                </td>
                <td class="py-2 px-2 text-center">
                    <span class="text-3xl md:text-4xl font-extrabold text-white tracking-widest drop-shadow-md font-mono text-shadow-blue">
                        ${formattedVenta}
                    </span>
                </td>
            `;

            currencyList.appendChild(row);
        }
    });

    if (cambiosDetectados) {
        playAlertSound();
    }
}

function removeTrailingZeros(value) {
    if (value == null) return '';
    return parseFloat(value).toString();
}

function playAlertSound() {
    const audio = document.getElementById('priceAlert');
    if (audio) {
        audio.play().catch(e => console.log("Audio play prevented:", e));
    }
}

function showOfflinePopup() {
    const popup = document.getElementById('offline-popup');
    if (popup) popup.classList.remove('hidden');
}

function hideOfflinePopup() {
    const popup = document.getElementById('offline-popup');
    if (popup) popup.classList.add('hidden');
}