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
            console.error(error);
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
    const heroList = document.getElementById("hero-list");
    const normalList = document.getElementById("normal-list");
    if (!heroList || !normalList) return;

    heroList.innerHTML = '';
    normalList.innerHTML = '';
    let cambios = false;

    // 1. FILTRAR Y ORDENAR
    // Solo las marcadas como destacada (1, "1" o true)
    // Ordenar por 'orden_destacada'
    const destacadas = data
    .filter(d => d.destacada == 1 || d.destacada === '1' || d.destacada === true)
    .sort((a, b) => {
        const orderA = (a.orden_destacada && a.orden_destacada > 0) ? parseInt(a.orden_destacada) : 999;
        const orderB = (b.orden_destacada && b.orden_destacada > 0) ? parseInt(b.orden_destacada) : 999;
        return orderA - orderB;
    });

    destacadas.forEach((divisa, index) => {
        const { nombre, icono_circular, compra, venta } = divisa;
        const key = nombre;
        
        // FORMATEO ES-CL (Puntos miles, Comas decimales)
        const compraFmt = parseFloat(compra).toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 10 });
        const ventaFmt = parseFloat(venta).toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 10 });
        
        const isLongPrice = (compraFmt.length > 5 || ventaFmt.length > 5);

        let flashClass = "";
        if (preciosAnteriores[key]) {
            if (preciosAnteriores[key].compra !== compra || preciosAnteriores[key].venta !== venta) {
                cambios = true;
                flashClass = "animate-pulse bg-white/20";
            }
        }
        preciosAnteriores[key] = { compra, venta };

        // 2. LOGICA DE RENDERIZADO (Top 2 vs Resto)
        // Las primeras 2 divisas del orden van arriba (Hero)
        if (index < 2) {
            // === HERO CARD ===
            const card = document.createElement("div");
            card.className = `flex-1 flex items-center justify-between bg-white/5 rounded-2xl border border-white/10 shadow-lg px-4 ${flashClass}`; 
            
            const priceSize = isLongPrice ? 'text-[3.5vh]' : 'text-[4vh]';

            card.innerHTML = `
                <div class="w-[25%] flex items-center gap-3">
                    <img src="${icono_circular}" class="h-[6vh] w-[6vh] rounded-full shadow-lg object-contain">
                    <span class="text-[4vh] font-black tracking-tighter">${key}</span>
                </div>
                
                <div class="w-[37.5%] flex justify-center">
                    <span class="${priceSize} leading-none font-black text-white tracking-widest font-mono text-shadow-glow px-3 py-2 rounded-lg min-w-[90%] text-center whitespace-nowrap">
                        ${compraFmt}
                    </span>
                </div>
                
                <div class="w-[37.5%] flex justify-center">
                    <span class="${priceSize} leading-none font-black text-white tracking-widest font-mono text-shadow-glow px-3 py-2 rounded-lg min-w-[90%] text-center whitespace-nowrap">
                        ${ventaFmt}
                    </span>
                </div>
            `;
            heroList.appendChild(card);
        } else {
            // === LISTA NORMAL (Resto) ===
            const row = document.createElement("tr");
            row.className = `border-b border-white/5 ${flashClass}`;
            
            const listPriceSize = isLongPrice ? 'text-[3vh]' : 'text-[3.8vh]';

            row.innerHTML = `
                <td class="w-[30%] py-1 pl-6">
                    <div class="flex items-center gap-4">
                        <img src="${icono_circular}" class="h-[4vh] w-[4vh] rounded-full">
                        <span class="text-[2.8vh] font-bold text-slate-200">${key}</span>
                    </div>
                </td>
                <td class="w-[35%] text-center align-middle">
                    <span class="${listPriceSize} font-bold font-mono tracking-wide text-shadow-glow bg-black/10 rounded-lg px-3 py-1 whitespace-nowrap">
                        ${compraFmt}
                    </span>
                </td>
                <td class="w-[35%] text-center align-middle">
                    <span class="${listPriceSize} font-bold font-mono tracking-wide text-shadow-glow px-3 py-1 whitespace-nowrap">
                        ${ventaFmt}
                    </span>
                </td>
            `;
            normalList.appendChild(row);
        }
    });

    if (cambios) {
        document.getElementById('priceAlert').play().catch(e => console.log(e));
    }
}