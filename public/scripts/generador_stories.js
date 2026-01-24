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

            // FIX: Eliminado 'leading-none' y 'drop-shadow' para evitar renderizado "raro" del texto
            html += `
            <div class="glass-card rounded-[2.5rem] p-6 flex items-center justify-between shadow-2xl relative overflow-hidden group">
                <div class="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <div class="flex items-center gap-6 z-10">
                    <img src="${iconUrl}" class="w-24 h-24 rounded-full border-[5px] border-white/20 bg-white object-cover shadow-lg" crossorigin="anonymous" alt="${divisa.nombre}">
                    <div class="flex flex-col justify-center h-full">
                        <span class="text-2xl text-blue-200 font-bold uppercase tracking-wider mb-1">Divisa</span>
                        <h2 class="text-5xl font-black text-white tracking-tight">${divisa.nombre}</h2>
                    </div>
                </div>
                
                <div class="flex gap-12 text-right z-10">
                    <div class="flex flex-col items-end justify-center">
                        <span class="text-xl text-white/70 uppercase font-bold mb-2 tracking-widest">Compra</span>
                        <span class="text-5xl font-bold text-white tracking-tighter">$${compraFmt}</span>
                    </div>
                    <div class="flex flex-col items-end justify-center">
                        <span class="text-xl text-green-400 uppercase font-bold mb-2 tracking-widest">Venta</span>
                        <span class="text-6xl font-black text-green-400 tracking-tighter">$${ventaFmt}</span>
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

async function convertImageToBase64(url) {
    try {
        const response = await fetch(url, { cache: 'no-store', mode: 'cors' });
        const blob = await response.blob();
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
        });
    } catch (e) {
        console.error("Error convirtiendo a Base64", e);
        return null;
    }
}

async function downloadStory() {
    const btn = document.getElementById('btn-download');
    const originalText = btn.innerHTML;
    
    btn.innerHTML = `Generando...`;
    btn.disabled = true;

    const bgImgElement = document.getElementById('background-img');
    let base64Bg = null;
    if (bgImgElement) {
        base64Bg = await convertImageToBase64(bgImgElement.src);
    }

    const originalCanvas = document.getElementById('story-canvas');

    const sandbox = document.createElement('div');
    sandbox.style.position = 'fixed';
    sandbox.style.top = '0';
    sandbox.style.left = '-10000px';
    sandbox.style.width = '1080px';
    sandbox.style.height = '1920px';
    sandbox.style.zIndex = '-1';
    sandbox.style.overflow = 'hidden'; 
    sandbox.style.backgroundColor = '#000000';
    
    const clonedCanvas = originalCanvas.cloneNode(true);
    clonedCanvas.style.transform = 'none';
    clonedCanvas.style.margin = '0';
    clonedCanvas.style.width = '1080px';
    clonedCanvas.style.height = '1920px';
    clonedCanvas.removeAttribute('id');

    const originalQRCs = originalCanvas.querySelectorAll('canvas');
    const clonedQRCs = clonedCanvas.querySelectorAll('canvas');
    originalQRCs.forEach((orig, index) => {
        if (clonedQRCs[index]) {
            const destCtx = clonedQRCs[index].getContext('2d');
            destCtx.drawImage(orig, 0, 0);
        }
    });

    if (base64Bg) {
        const clonedImg = clonedCanvas.querySelector('img[alt="Background"]');
        if (clonedImg) {
            clonedImg.src = base64Bg;
        }
    }

    sandbox.appendChild(clonedCanvas);
    document.body.appendChild(sandbox);

    document.fonts.ready.then(() => {
        setTimeout(() => {
            html2canvas(clonedCanvas, {
                scale: 2, 
                useCORS: true, 
                allowTaint: true,
                backgroundColor: '#000000',
                logging: false,
                letterRendering: 1, // MEJORA: Ayuda con el kerning del texto
                width: 1080,
                height: 1920,
                windowWidth: 1080,
                windowHeight: 1920,
                scrollY: 0,
                scrollX: 0
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
                if (document.body.contains(sandbox)) document.body.removeChild(sandbox);
                btn.innerHTML = 'Error';
                btn.disabled = false;
            });
        }, 1000);
    });
}