// /orionapp/public/scripts/generador_stories.js

const TARGET_CURRENCIES = ['USD', 'EUR', 'BRL', 'ARS', 'PEN']; 

document.addEventListener("DOMContentLoaded", () => {
    generateQR();
    connectStream();
});

function generateQR() {
    const container = document.getElementById("qrcode");
    if(container) {
        container.innerHTML = "";
        new QRCode(container, {
            text: "https://cambiosorion.cl/linktree",
            width: 110,
            height: 110,
            colorDark : "#000000",
            colorLight : "#ffffff",
            correctLevel : QRCode.CorrectLevel.H
        });
    }
}

function connectStream() {
    const eventSource = new EventSource('https://cambiosorion.cl/api/stream/stream_divisas.php');
    eventSource.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            renderStory(data);
            updateDate();
        } catch (e) { console.error("Error parsing stream", e); }
    };
}

function renderStory(currencies) {
    const container = document.getElementById('currency-grid');
    if (!container) return;

    let html = '';

    currencies.forEach(divisa => {
        if (TARGET_CURRENCIES.includes(divisa.nombre)) {
            const compraFmt = parseFloat(divisa.compra).toLocaleString('es-CL', { maximumFractionDigits: divisa.compra < 100 ? 2 : 0 });
            const ventaFmt = parseFloat(divisa.venta).toLocaleString('es-CL', { maximumFractionDigits: divisa.venta < 100 ? 2 : 0 });
            const iconUrl = divisa.icono_circular; 

            html += `
            <div class="glass-card rounded-[2.5rem] p-6 flex items-center justify-between shadow-2xl relative overflow-hidden group">
                <div class="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <div class="flex items-center gap-6 z-10">
                    <img src="${iconUrl}" class="w-24 h-24 rounded-full border-[5px] border-white/20 bg-white object-cover shadow-lg" crossorigin="anonymous" alt="${divisa.nombre}">
                    <div class="flex flex-col">
                        <span class="text-2xl text-blue-200 font-bold uppercase tracking-wider mb-0.5">Divisa</span>
                        <h2 class="text-5xl font-black text-white tracking-tight drop-shadow-md">${divisa.nombre}</h2>
                    </div>
                </div>
                
                <div class="flex gap-12 text-right z-10">
                    <div class="flex flex-col items-end">
                        <span class="text-xl text-white/70 uppercase font-bold mb-1 tracking-widest">Compra</span>
                        <span class="text-5xl font-bold text-white tracking-tighter">$${compraFmt}</span>
                    </div>
                    <div class="flex flex-col items-end">
                        <span class="text-xl text-green-400 uppercase font-bold mb-1 tracking-widest">Venta</span>
                        <span class="text-6xl font-black text-green-400 drop-shadow-lg tracking-tighter">$${ventaFmt}</span>
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
    const finalDate = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
    
    const dateEl = document.getElementById('fecha-story');
    if(dateEl) dateEl.innerText = finalDate;
}

function downloadStory() {
    const btn = document.getElementById('btn-download');
    const originalText = btn.innerHTML;
    
    btn.innerHTML = `Generando (Espere)...`;
    btn.disabled = true;

    const originalCanvas = document.getElementById('story-canvas');

    // Crear Sandbox
    const sandbox = document.createElement('div');
    sandbox.style.position = 'fixed';
    sandbox.style.top = '0';
    sandbox.style.left = '-10000px';
    sandbox.style.width = '1080px';
    sandbox.style.height = '1920px';
    sandbox.style.zIndex = '-1';
    
    // Clonar
    const clonedCanvas = originalCanvas.cloneNode(true);
    clonedCanvas.style.transform = 'none';
    clonedCanvas.style.margin = '0';
    clonedCanvas.removeAttribute('id');
    
    sandbox.appendChild(clonedCanvas);
    document.body.appendChild(sandbox);

    // Aumentamos el tiempo de espera a 1 segundo para asegurar que la imagen de fondo cargue en el clon
    setTimeout(() => {
        html2canvas(clonedCanvas, {
            scale: 1, 
            useCORS: true, // VITAL
            allowTaint: true,
            backgroundColor: null,
            logging: false,
            width: 1080,
            height: 1920,
            windowWidth: 1080,
            windowHeight: 1920
        }).then(canvas => {
            const fileName = `Orion_Story_${new Date().toISOString().slice(0,10)}.png`;
            const link = document.createElement('a');
            link.download = fileName;
            link.href = canvas.toDataURL('image/png', 1.0);
            link.click();
            
            document.body.removeChild(sandbox);
            btn.innerHTML = originalText;
            btn.disabled = false;
        }).catch(err => {
            console.error("Error:", err);
            document.body.removeChild(sandbox);
            btn.innerHTML = 'Error';
            btn.disabled = false;
        });
    }, 1000); // Espera 1 segundo
}