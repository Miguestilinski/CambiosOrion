let preciosAnteriores = {};
let eventSource;

document.addEventListener('DOMContentLoaded', () => {
    initSSE();
});

function initSSE() {
    eventSource = new EventSource('https://cambiosorion.cl/data/stream_divisas.php');

    eventSource.onopen = () => console.log('🟢 SSE Conectado');

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
    const highlightedList = document.getElementById("highlighted-currencies");
    const normalList = document.getElementById("normal-currencies");
    
    if (!highlightedList || !normalList) return;
  
    highlightedList.innerHTML = '';
    normalList.innerHTML = '';
  
    let cambiosDetectados = false;
  
    // Filtro estricto de divisas a mostrar
    const divisasFiltradas = ["USD", "EUR", "BRL", "ARS", "PEN", "MXN", "ORO 100"]; // Puedes añadir CLP o lo que necesites
  
    divisasFiltradas.forEach((key) => {
        const divisa = data.find(d => d.nombre === key);
  
        if (divisa && divisa.compra && divisa.venta) {
            const { icono_circular, compra, venta } = divisa;
    
            // Detección de cambios
            let flashClass = "";
            if (preciosAnteriores[key] && (preciosAnteriores[key].compra !== compra || preciosAnteriores[key].venta !== venta)) {
                cambiosDetectados = true;
                flashClass = "animate-pulse bg-white/20";
            }
            preciosAnteriores[key] = { compra, venta };
    
            const formattedCompra = removeTrailingZeros(compra);
            const formattedVenta = removeTrailingZeros(venta);
    
            // LOGICA DE RENDERIZADO DIFERENCIADO
            if (key === "USD" || key === "EUR") {
                // === DESTACADAS (Tarjetas Grandes) ===
                const card = document.createElement("div");
                card.className = `grid grid-cols-12 gap-4 items-center bg-white/10 rounded-2xl p-6 border border-white/20 shadow-lg transform transition-all duration-300 hover:scale-[1.02] ${flashClass}`;
                
                card.innerHTML = `
                    <div class="col-span-4 flex items-center gap-6">
                        <img src="${icono_circular}" alt="${key}" class="w-20 h-20 object-contain drop-shadow-xl">
                        <span class="text-5xl font-black text-white tracking-tighter">${key}</span>
                    </div>
                    <div class="col-span-4 text-center bg-black/20 rounded-xl py-3 border border-white/5">
                        <span class="text-6xl font-extrabold text-white tracking-widest font-mono text-shadow-glow">
                            ${formattedCompra}
                        </span>
                    </div>
                    <div class="col-span-4 text-center py-3">
                        <span class="text-6xl font-extrabold text-white tracking-widest font-mono text-shadow-glow">
                            ${formattedVenta}
                        </span>
                    </div>
                `;
                highlightedList.appendChild(card);

            } else {
                // === NORMALES (Filas Compactas) ===
                const row = document.createElement("tr");
                row.className = `group transition-colors duration-300 hover:bg-white/5 ${flashClass}`;
                
                row.innerHTML = `
                    <td class="py-3 pl-4 text-left w-1/3">
                        <div class="flex items-center gap-4">
                            <img src="${icono_circular}" alt="${key}" class="w-12 h-12 object-contain opacity-90 group-hover:opacity-100 transition">
                            <span class="text-2xl font-bold text-slate-200">${key}</span>
                        </div>
                    </td>
                    <td class="py-3 text-center w-1/3">
                        <span class="text-4xl font-bold text-slate-100 tracking-wider font-mono bg-black/10 px-4 py-1 rounded-lg">
                            ${formattedCompra}
                        </span>
                    </td>
                    <td class="py-3 text-center w-1/3">
                        <span class="text-4xl font-bold text-slate-100 tracking-wider font-mono px-4 py-1">
                            ${formattedVenta}
                        </span>
                    </td>
                `;
                normalList.appendChild(row);
            }
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
    if (audio) audio.play().catch(e => console.log("Audio prevent:", e));
}

function showOfflinePopup() {
    const popup = document.getElementById('offline-popup');
    if(popup) popup.classList.remove('hidden');
}

function hideOfflinePopup() {
    const popup = document.getElementById('offline-popup');
    if(popup) popup.classList.add('hidden');
}