// /orionapp/public/scripts/generador_stories.js

const TARGET_CURRENCIES = ['USD', 'EUR', 'BRL', 'ARS', 'PEN', 'ORO 100']; 

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
            
            // Usamos codificación explícita para evitar errores de carga
            let iconUrl = divisa.icono_circular;
            if (divisa.nombre === 'ORO 100') {
                iconUrl = 'https://cambiosorion.cl/orionapp/icons/ORO%20100.svg';
            }

            html += `
            <div class="glass-card rounded-[2.5rem] p-6 flex items-center justify-between shadow-2xl relative overflow-hidden group">
                <div class="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <div class="flex items-center gap-6 z-10">
                    <img src="${iconUrl}" class="w-24 h-24 rounded-full border-[5px] border-white/20 bg-white object-cover shadow-lg" crossorigin="anonymous" alt="${divisa.nombre}">
                    <div class="flex flex-col gap-0 justify-center"> 
                        <h2 class="text-5xl font-black text-white leading-none mt-1 story-name">${divisa.nombre}</h2>
                    </div>
                </div>
                
                <div class="flex gap-12 text-right z-10 items-center">
                    <div class="flex flex-col items-end gap-0">
                        <span class="text-xl text-white/70 uppercase font-bold tracking-widest mb-1 story-label">Compra</span>
                        <span class="text-5xl font-bold text-white leading-none story-price">$${compraFmt}</span>
                    </div>
                    <div class="flex flex-col items-end gap-0">
                        <span class="text-xl text-white/70 uppercase font-bold tracking-widest mb-1 story-label">Venta</span>
                        <span class="text-5xl font-bold text-white leading-none story-price">$${ventaFmt}</span>
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
    const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    const dateStr = now.toLocaleDateString('es-CL', options);
    const finalDate = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
    
    const dateEl = document.getElementById('fecha-story');
    if(dateEl) dateEl.innerText = finalDate;
}

async function convertImageToBase64(url) {
    try {
        const response = await fetch(url, { cache: 'no-store', mode: 'cors' });
        if (!response.ok) throw new Error('Network response was not ok');
        const blob = await response.blob();
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
        });
    } catch (e) {
        console.error("Error convirtiendo a Base64:", url, e);
        return null;
    }
}

async function downloadStory() {
    const btn = document.getElementById('btn-download');
    const originalText = btn.innerHTML;
    
    btn.innerHTML = `Generando...`;
    btn.disabled = true;

    // 1. Cargar fondo
    const bgImgElement = document.getElementById('background-img');
    let base64Bg = null;
    if (bgImgElement) {
        base64Bg = await convertImageToBase64(bgImgElement.src);
    }

    // 2. Cargar ORO 100 (Intento doble por si el espacio falla)
    let base64Oro = await convertImageToBase64('https://cambiosorion.cl/orionapp/icons/ORO%20100.svg');
    if (!base64Oro) {
        // Intento fallback sin codificar por si el servidor es raro
        base64Oro = await convertImageToBase64('https://cambiosorion.cl/orionapp/icons/ORO 100.svg');
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

    // Copiar QR manualmente
    const originalQRCs = originalCanvas.querySelectorAll('canvas');
    const clonedQRCs = clonedCanvas.querySelectorAll('canvas');
    originalQRCs.forEach((orig, index) => {
        if (clonedQRCs[index]) {
            const destCtx = clonedQRCs[index].getContext('2d');
            destCtx.drawImage(orig, 0, 0);
        }
    });

    // Inyectar fondo
    if (base64Bg) {
        const clonedImg = clonedCanvas.querySelector('img[alt="Background"]');
        if (clonedImg) clonedImg.src = base64Bg;
    }

    // Inyectar ORO 100
    if (base64Oro) {
        const allImages = clonedCanvas.querySelectorAll('.glass-card img');
        allImages.forEach(img => {
            if (img.src.includes('ORO') || img.alt === 'ORO 100') {
                img.src = base64Oro;
            }
        });
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
                letterRendering: 1, 
                width: 1080,
                height: 1920,
                windowWidth: 1080,
                windowHeight: 1920,
                scrollY: 0,
                scrollX: 0,
                onclone: (doc) => {
                    // --- AJUSTES CON TRANSFORM (Fuerza Bruta Geométrica) ---

                    // 1. Header "Cotización Oficial"
                    const headerPillDiv = doc.querySelector('.rounded-full.bg-black\\/40');
                    if (headerPillDiv) {
                        // Quitamos transparencia y ponemos fondo solido oscuro para resaltar texto
                        headerPillDiv.style.backgroundColor = 'rgba(0,0,0,0.6)'; 
                        headerPillDiv.style.borderColor = 'rgba(255,255,255,0.4)';
                    }
                    
                    const headerPillText = doc.querySelector('.rounded-full.bg-black\\/40 p');
                    if(headerPillText) {
                        // Subimos con transform
                        headerPillText.style.transform = 'translateY(-8px)';
                        headerPillText.style.color = '#ffffff';
                        // Sombra dura para legibilidad
                        headerPillText.style.textShadow = '0px 2px 4px rgba(0,0,0,0.8)';
                    }

                    // 2. Fecha
                    const dateEl = doc.getElementById('fecha-story');
                    if(dateEl) {
                        dateEl.style.transform = 'translateY(-10px)';
                    }

                    // 3. Textos Cartas
                    doc.querySelectorAll('.story-name').forEach(el => el.style.transform = 'translateY(-8px)');
                    doc.querySelectorAll('.story-price').forEach(el => el.style.transform = 'translateY(-8px)');
                    doc.querySelectorAll('.story-label').forEach(el => el.style.transform = 'translateY(-5px)');

                    // 4. Footer "IMPORTANTE" (Texto Amarillo)
                    const labelImportante = doc.getElementById('label-importante');
                    if(labelImportante) {
                        // Subimos el texto amarillo para alinearlo con el SVG
                        labelImportante.style.display = 'inline-block'; // Necesario para transform
                        labelImportante.style.transform = 'translateY(-6px)';
                    }
                    
                    // Texto legal
                    const legalText = doc.querySelector('.glass-card.mb-8 p:last-child');
                    if(legalText) legalText.style.transform = 'translateY(-5px)';

                    // 5. Footer Dirección y Web
                    doc.querySelectorAll('.footer-text').forEach(el => {
                        el.style.display = 'inline-block';
                        el.style.transform = 'translateY(-5px)';
                    });

                    // 6. Footer "ESCANEA"
                    const scanText = doc.querySelector('#qrcode').nextElementSibling;
                    if(scanText) {
                        // Flexbox a veces bloquea transform, usamos margin negativo si hace falta o relative
                        scanText.style.position = 'relative';
                        scanText.style.top = '-5px';
                    }
                }
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