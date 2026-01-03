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

    // Solo estas 7 divisas, en este orden
    const divisasFiltradas = ["USD", "EUR", "BRL", "ARS", "PEN", "MXN", "ORO 100"];

    divisasFiltradas.forEach((key) => {
        const divisa = data.find(d => d.nombre === key);
        if (divisa) {
            const { icono_circular, compra, venta } = divisa;
            const compraFmt = parseFloat(compra).toString();
            const ventaFmt = parseFloat(venta).toString();

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
                // === HERO (Gigantes Flexibles) ===
                const card = document.createElement("div");
                // Usamos h-full para que se expanda en su mitad del contenedor
                // flex-1 asegura que ambas tarjetas (USD/EUR) ocupen el mismo espacio
                card.className = `flex-1 grid grid-cols-12 items-center bg-white/5 rounded-2xl border border-white/10 shadow-lg px-4 ${flashClass}`; 
                
                card.innerHTML = `
                    <div class="col-span-4 flex items-center gap-4 lg:gap-6">
                        <img src="${icono_circular}" class="h-[8vh] w-[8vh] lg:h-[10vh] lg:w-[10vh] rounded-full shadow-lg object-contain">
                        <span class="text-[5vh] lg:text-[6vh] font-black tracking-tighter">${key}</span>
                    </div>
                    <div class="col-span-4 text-center">
                        <span class="text-[6vh] lg:text-[7vh] font-black text-white tracking-widest font-mono text-shadow-glow">${compraFmt}</span>
                    </div>
                    <div class="col-span-4 text-center">
                        <span class="text-[6vh] lg:text-[7vh] font-black text-white tracking-widest font-mono text-shadow-glow">${ventaFmt}</span>
                    </div>
                `;
                heroList.appendChild(card);
            } else {
                // === LISTA (Grandes) ===
                const row = document.createElement("tr");
                row.className = `border-b border-white/5 ${flashClass}`;
                
                row.innerHTML = `
                    <td class="w-[33%] py-1 pl-6">
                        <div class="flex items-center gap-4">
                            <img src="${icono_circular}" class="h-[5vh] w-[5vh] rounded-full">
                            <span class="text-[3.5vh] font-bold text-slate-200">${key}</span>
                        </div>
                    </td>
                    <td class="w-[33%] text-center text-[4.5vh] font-bold font-mono tracking-wide text-shadow-glow bg-black/10 rounded-lg">
                        ${compraFmt}
                    </td>
                    <td class="w-[33%] text-center text-[4.5vh] font-bold font-mono tracking-wide text-shadow-glow">
                        ${ventaFmt}
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