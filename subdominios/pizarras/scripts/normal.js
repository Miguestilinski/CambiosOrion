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

    // 1. FILTRAR Y ORDENAR
    // Quitamos CLP y ordenamos por la columna 'orden' (ascendente)
    // Si 'orden' es null o 0, lo mandamos al final (999)
    const divisas = data
    .filter(d => d.nombre !== 'CLP')
    .sort((a, b) => {
        const orderA = (a.orden && a.orden > 0) ? parseInt(a.orden) : 999;
        const orderB = (b.orden && b.orden > 0) ? parseInt(b.orden) : 999;
        return orderA - orderB;
    });

    divisas.forEach((divisa) => {
        const { nombre, icono_circular, compra, venta } = divisa;
        const key = nombre;
            
        // FORMATEO CON PUNTOS Y COMAS (es-CL)
        // maximumFractionDigits: 10 asegura que no se corten decimales importantes (ej: 0,00005)
        const compraFmt = parseFloat(compra).toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 10 });
        const ventaFmt = parseFloat(venta).toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 10 });

        const isLong = (compraFmt.length > 5 || ventaFmt.length > 5);
        
        // --- AJUSTE DE TAMAÑO PARA PRECIOS ---
        const fontSizeClass = isLong ? 'text-[1.8vh]' : 'text-[2.2vh]';

        // --- AJUSTE DE TAMAÑO PARA NOMBRES LARGOS (NUEVO) ---
        // Si el nombre tiene más de 3 letras (ej: PLATA OZ), reducimos la fuente
        const nameSize = key.length > 3 ? 'text-[1.5vh]' : 'text-[1.8vh]';

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
            <td class="text-left align-middle font-semibold tracking-wide text-shadow ${nameSize}">
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
    
    });

    if (cambios) {
        document.getElementById('priceAlert').play().catch(e => console.log(e));
    }
}