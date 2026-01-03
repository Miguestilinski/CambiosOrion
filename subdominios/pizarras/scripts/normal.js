let preciosAnteriores = {};
let eventSource;
let offlineTimer = null;

document.addEventListener('DOMContentLoaded', () => {
    initSSE();
});

function initSSE() {
    if (eventSource) eventSource.close();
    eventSource = new EventSource('https://cambiosorion.cl/data/stream_divisas.php');

    eventSource.onopen = () => handleConnectionSuccess();
    
    eventSource.onmessage = (event) => {
        handleConnectionSuccess();
        try {
            const responseData = JSON.parse(event.data);
            processData(responseData);
        } catch (error) {
            console.error('Error datos:', error);
        }
    };

    eventSource.onerror = () => {
        handleConnectionError();
        if (eventSource.readyState === EventSource.CLOSED) {
            setTimeout(initSSE, 5000);
        }
    };
}

function handleConnectionSuccess() {
    if (offlineTimer) { clearTimeout(offlineTimer); offlineTimer = null; }
    document.getElementById('offline-popup').classList.add('hidden');
}

function handleConnectionError() {
    if (!offlineTimer) {
        offlineTimer = setTimeout(() => {
            document.getElementById('offline-popup').classList.remove('hidden');
        }, 5000);
    }
}

function processData(data) {
    const list = document.getElementById("currency-list");
    if (!list) return;
    
    list.innerHTML = ''; 
    let cambios = false;

    const divisasOrdenadas = [
        "USD", "EUR", "ARS", "BRL", "PEN", "COP",
        "UYU", "BOB", "CAD", "GBP", "JPY", "CNY",
        "SEK", "AUD", "MXN", "NZD", "CHF", "DKK",
        "NOK", "ORO 100"
    ];

    divisasOrdenadas.forEach((key) => {
        const divisa = data.find(d => d.nombre === key);
        if (divisa) {
            const { icono_circular, compra, venta } = divisa;
            const compraFmt = parseFloat(compra).toString();
            const ventaFmt = parseFloat(venta).toString();

            // Detectar números largos (más de 5 caracteres)
            const isLong = (compraFmt.length > 5 || ventaFmt.length > 5);
            
            // Fuentes reducidas: 1.8vh para millones, 2.5vh para normales
            const fontSizeClass = isLong ? 'text-[1.8vh]' : 'text-[2.5vh]';

            // Detectar cambios
            let flashClass = "";
            if (preciosAnteriores[key]) {
                if (preciosAnteriores[key].compra !== compra || preciosAnteriores[key].venta !== venta) {
                    cambios = true;
                    flashClass = "bg-white/20 transition-colors duration-1000";
                }
            }
            preciosAnteriores[key] = { compra, venta };

            const row = document.createElement("tr");
            row.className = `h-row hover:bg-white/5 ${flashClass}`; 
            
            row.innerHTML = `
                <td class="pl-4 py-0 align-middle">
                    <img src="${icono_circular}" class="h-[2.5vh] w-[2.5vh] object-contain rounded-full shadow-sm">
                </td>
                <td class="text-left align-middle font-semibold tracking-wide text-shadow text-[1.8vh]">
                    ${key}
                </td>
                <td class="text-center align-middle ${fontSizeClass} font-bold bg-black/10 tracking-widest text-shadow font-mono text-white">
                    ${compraFmt}
                </td>
                <td class="text-center align-middle ${fontSizeClass} font-bold tracking-widest text-shadow font-mono text-white">
                    ${ventaFmt}
                </td>
            `;
            list.appendChild(row);
        }
    });

    if (cambios) {
        document.getElementById('priceAlert').play().catch(e => console.log(e));
    }
}