let preciosAnteriores = {};
let eventSource;
let offlineTimer = null;

document.addEventListener('DOMContentLoaded', () => {
    initSSE();
});

function initSSE() {
    if (eventSource) eventSource.close();
    eventSource = new EventSource('https://cambiosorion.cl/data/stream_divisas.php');

    eventSource.onopen = () => {
        handleConnectionSuccess();
    };
    
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

    const divisasFiltradas = ["USD", "EUR", "BRL", "ARS", "PEN", "MXN", "ORO 100"];

    divisasFiltradas.forEach((key) => {
        const divisa = data.find(d => d.nombre === key);
        if (divisa) {
            const { icono_circular, compra, venta } = divisa;
            const compraFmt = parseFloat(compra).toString();
            const ventaFmt = parseFloat(venta).toString();

            // Lógica para detectar números largos (ej: ORO 100 -> 1900000)
            const isLongPrice = (compraFmt.length > 5 || ventaFmt.length > 5);

            // Detectar cambios
            let flashClass = "";
            if (preciosAnteriores[key]) {
                if (preciosAnteriores[key].compra !== compra || preciosAnteriores[key].venta !== venta) {
                    cambios = true;
                    flashClass = "animate-pulse bg-white/20";
                }
            }
            preciosAnteriores[key] = { compra, venta };

            if (key === "USD" || key === "EUR") {
                // === HERO (Gigantes) ===
                const card = document.createElement("div");
                card.className = `flex-1 grid grid-cols-12 items-center bg-white/5 rounded-2xl border border-white/10 shadow-lg px-2 ${flashClass}`; 
                
                // Reducimos tamaños de fuente para evitar choques
                // Si es largo, usamos 4vh, si es normal 5.5vh (antes era 7vh)
                const priceSize = isLongPrice ? 'text-[4vh]' : 'text-[5.5vh]';

                card.innerHTML = `
                    <div class="col-span-3 flex items-center justify-start gap-3 pl-4">
                        <img src="${icono_circular}" class="h-[7vh] w-[7vh] rounded-full shadow-lg object-contain">
                        <span class="text-[4.5vh] font-black tracking-tighter">${key}</span>
                    </div>
                    <div class="col-span-4 flex justify-center items-center">
                        <span class="${priceSize} font-black text-white tracking-widest font-mono text-shadow-glow bg-black/20 px-4 py-1 rounded-lg w-full text-center">
                            ${compraFmt}
                        </span>
                    </div>
                    <div class="col-span-1"></div> <div class="col-span-4 flex justify-center items-center">
                        <span class="${priceSize} font-black text-white tracking-widest font-mono text-shadow-glow bg-black/20 px-4 py-1 rounded-lg w-full text-center">
                            ${ventaFmt}
                        </span>
                    </div>
                `;
                heroList.appendChild(card);
            } else {
                // === LISTA NORMAL (Destacadas) ===
                const row = document.createElement("tr");
                row.className = `border-b border-white/5 ${flashClass}`;
                
                // Ajuste de fuente para lista normal si es muy largo
                const listPriceSize = isLongPrice ? 'text-[3vh]' : 'text-[4vh]';

                row.innerHTML = `
                    <td class="w-[30%] py-1 pl-6">
                        <div class="flex items-center gap-4">
                            <img src="${icono_circular}" class="h-[4.5vh] w-[4.5vh] rounded-full">
                            <span class="text-[3vh] font-bold text-slate-200">${key}</span>
                        </div>
                    </td>
                    <td class="w-[35%] text-center">
                        <span class="${listPriceSize} font-bold font-mono tracking-wide text-shadow-glow bg-black/10 rounded-lg px-2">
                            ${compraFmt}
                        </span>
                    </td>
                    <td class="w-[35%] text-center">
                        <span class="${listPriceSize} font-bold font-mono tracking-wide text-shadow-glow px-2">
                            ${ventaFmt}
                        </span>
                    </td>
                `;
                normalList.appendChild(row);
            }
        }
    });

    if (cambios) {
        document.getElementById('priceAlert').play().catch(e => console.log(e));
    }
}