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
            
            // LÓGICA SIMPLIFICADA PARA ORO 100
            // Usamos el nuevo nombre de archivo sin espacios
            let iconUrl = divisa.icono_circular;
            if (divisa.nombre === 'ORO 100') {
                iconUrl = 'https://cambiosorion.cl/orionapp/icons/ORO100.svg';
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
    console.log("--- 1. INICIANDO PROCESO DE DESCARGA ---"); // LOG 1

    const btn = document.getElementById('btn-download');
    const originalText = btn.innerHTML;
    
    btn.innerHTML = `Generando...`;
    btn.disabled = true;

    // === INSERTAR ESTO ===
    // PRUEBA DE DIAGNÓSTICO: Intentamos leer la imagen manualmente
    const debugUrl = 'https://cambiosorion.cl/orionapp/icons/ORO100.svg';
    console.log("Probando acceso a:", debugUrl);
    fetch(debugUrl, { mode: 'cors' })
        .then(res => {
            console.log(`[DEBUG FETCH] Status: ${res.status}`); // Debería ser 200
            console.log(`[DEBUG FETCH] Type: ${res.type}`);
            if (!res.ok) console.error("🚨 EL SERVIDOR RECHAZÓ LA IMAGEN");
        })
        .catch(err => console.error("🚨 ERROR DE RED/CORS AL PEDIR LA IMAGEN:", err));
    // =====================

    // 1. Cargar fondo
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

    // Copiar QR manualmente
    const originalQRCs = originalCanvas.querySelectorAll('canvas');
    const clonedQRCs = clonedCanvas.querySelectorAll('canvas');
    originalQRCs.forEach((orig, index) => {
        if (clonedQRCs[index]) {
            const destCtx = clonedQRCs[index].getContext('2d');
            destCtx.drawImage(orig, 0, 0);
        }
    });

    // Inyectar fondo Base64
    if (base64Bg) {
        const clonedImg = clonedCanvas.querySelector('img[alt="Background"]');
        if (clonedImg) clonedImg.src = base64Bg;
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
                    console.log("--- 2. DENTRO DEL CLON (MOMENTO DE LA FOTO) ---");

                    // BUSCAR LA IMAGEN DE ORO
                    // Buscamos cualquier img que tenga 'ORO' en su ruta
                    const oroImages = Array.from(doc.querySelectorAll('img')).filter(img => img.src.includes('ORO'));
                    
                    if (oroImages.length === 0) {
                        console.error("🚨 ERROR CRÍTICO: No se encontró ninguna etiqueta <img> con 'ORO' en el clon.");
                    } else {
                        oroImages.forEach((img, index) => {
                            console.log(`✅ IMAGEN ORO ENCONTRADA [${index}]:`);
                            console.log(`   - Src: ${img.src}`);
                            console.log(`   - Natural Size: ${img.naturalWidth}x${img.naturalHeight}`); // Si es 0x0, no cargó
                            console.log(`   - Display Size: ${img.width}x${img.height}`);
                            console.log(`   - Opacity: ${img.style.opacity}`);
                            
                            // TEST: Forzamos un borde rojo para ver si está ahí pero invisible
                            img.style.border = "5px solid red"; 
                        });
                    }

                    // --- AJUSTES FINALES DE PRECISIÓN ---

                    // 1. HEADER (Fondo Sólido corregido)
                    doc.querySelectorAll('.rounded-full.bg-black\\/40').forEach(el => {
                        // CAMBIO: Usamos rgba negro neutro para evitar el tono amarillento/grisáceo
                        el.style.backgroundColor = 'rgba(0, 0, 0, 0.6)'; 
                        el.style.border = '1px solid rgba(255,255,255,0.3)';
                    });

                    // 2. HEADER TEXT (Cotización Oficial)
                    doc.querySelectorAll('#label-cotizacion').forEach(el => {
                        el.style.display = 'block';
                        el.style.position = 'relative';
                        el.style.top = '-12px';
                        el.style.color = '#ffffff';
                        el.style.zIndex = '999';
                    });

                    // 3. LABEL IMPORTANTE
                    doc.querySelectorAll('#label-importante').forEach(el => {
                        el.style.display = 'inline-block';
                        el.style.position = 'relative';
                        el.style.top = '-10px';
                    });

                    // 4. FECHA
                    doc.querySelectorAll('#fecha-story').forEach(el => {
                        el.style.position = 'relative';
                        el.style.top = '-14px';
                    });

                    // 5. Textos de las Cartas
                    doc.querySelectorAll('.story-name').forEach(el => {
                        el.style.position = 'relative';
                        el.style.top = '-14px';
                    });
                    doc.querySelectorAll('.story-price').forEach(el => {
                        el.style.position = 'relative';
                        el.style.top = '-14px';
                    });
                    doc.querySelectorAll('.story-label').forEach(el => {
                        el.style.position = 'relative';
                        el.style.top = '-10px';
                    });
                    
                    // 6. TEXTO LEGAL
                    doc.querySelectorAll('.glass-card.mb-8 p:last-child').forEach(el => {
                        el.style.position = 'relative';
                        el.style.top = '-10px';
                    });

                    // 7. Footer Dirección y Web (SOLO TEXTOS)
                    doc.querySelectorAll('.footer-text').forEach(el => {
                        el.style.position = 'relative';
                        el.style.top = '-10px';
                    });

                    // 8. SCANNER TEXT (Ahora atacamos al ID específico, no a todo el párrafo)
                    doc.querySelectorAll('#scan-text').forEach(el => {
                        el.style.position = 'relative';
                        el.style.top = '-8px'; // Mueve solo el texto "Escanea"
                    });
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
        }, 2500);
    });
}