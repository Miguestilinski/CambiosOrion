// /orionapp/public/scripts/generador_stories.js

// Configuración: Monedas a mostrar
const TARGET_CURRENCIES = ['USD', 'EUR', 'BRL', 'ARS', 'PEN']; 

// Conectar al Stream
const eventSource = new EventSource('https://cambiosorion.cl/api/stream/stream_divisas.php');

eventSource.onmessage = (event) => {
    try {
        const data = JSON.parse(event.data);
        renderStory(data);
        updateDate();
    } catch (e) { console.error("Error parsing stream", e); }
};

function renderStory(currencies) {
    const container = document.getElementById('currency-grid');
    let html = '';

    currencies.forEach(divisa => {
        if (TARGET_CURRENCIES.includes(divisa.nombre)) {
            const compraFmt = parseFloat(divisa.compra).toLocaleString('es-CL', { maximumFractionDigits: divisa.compra < 100 ? 2 : 0 });
            const ventaFmt = parseFloat(divisa.venta).toLocaleString('es-CL', { maximumFractionDigits: divisa.venta < 100 ? 2 : 0 });
            
            const iconUrl = divisa.icono_circular; 

            // Estructura de tarjeta limpia sin emojis
            html += `
            <div class="glass-card rounded-[2.5rem] p-7 flex items-center justify-between shadow-2xl relative overflow-hidden group">
                <div class="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <div class="flex items-center gap-8 z-10">
                    <img src="${iconUrl}" class="w-28 h-28 rounded-full border-[6px] border-white/20 bg-white object-cover shadow-lg" crossorigin="anonymous" alt="${divisa.nombre}">
                    <div class="flex flex-col">
                        <span class="text-3xl text-blue-200 font-bold uppercase tracking-wider mb-1">Divisa</span>
                        <h2 class="text-6xl font-black text-white tracking-tight drop-shadow-md">${divisa.nombre}</h2>
                    </div>
                </div>
                
                <div class="flex gap-16 text-right z-10">
                    <div class="flex flex-col items-end">
                        <span class="text-2xl text-white/70 uppercase font-bold mb-2 tracking-widest">Compra</span>
                        <span class="text-6xl font-bold text-white tracking-tighter">$${compraFmt}</span>
                    </div>
                    <div class="flex flex-col items-end">
                        <span class="text-2xl text-green-400 uppercase font-bold mb-2 tracking-widest">Venta</span>
                        <span class="text-7xl font-black text-green-400 drop-shadow-lg tracking-tighter">$${ventaFmt}</span>
                    </div>
                </div>
            </div>
            `;
        }
    });
    if (html) container.innerHTML = html;
}

function updateDate() {
    const now = new Date();
    const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' };
    const dateStr = now.toLocaleDateString('es-CL', options);
    // Capitalizar
    const finalDate = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
    document.getElementById('fecha-story').innerText = finalDate;
}

function downloadStory() {
    const btn = document.getElementById('btn-download');
    const originalText = btn.innerHTML;
    
    // Feedback visual
    btn.innerHTML = `
        <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Generando...
    `;
    btn.disabled = true;

    const elementToCapture = document.getElementById('story-canvas');

    // Timeout para asegurar carga de imágenes
    setTimeout(() => {
        html2canvas(elementToCapture, {
            scale: 2, // Alta calidad
            useCORS: true, 
            allowTaint: true,
            backgroundColor: null,
            scrollY: -window.scrollY, // FIX: Evita que el scroll corte la imagen
            onclone: (clonedDoc) => {
                const clonedContainer = clonedDoc.getElementById('preview-container');
                // IMPORTANTE: Resetear la escala en el clon para captura 1:1
                clonedContainer.style.transform = 'none';
                clonedContainer.style.margin = '0';
                clonedContainer.style.width = '1080px';
                clonedContainer.style.height = '1920px';
            }
        }).then(canvas => {
            const fileName = `Orion_Story_${new Date().toISOString().slice(0,10)}.png`;
            const link = document.createElement('a');
            link.download = fileName;
            link.href = canvas.toDataURL('image/png', 1.0);
            link.click();
            
            btn.innerHTML = originalText;
            btn.disabled = false;
        }).catch(err => {
            console.error("Error:", err);
            btn.innerHTML = 'Error al generar';
            btn.disabled = false;
        });
    }, 800);
}