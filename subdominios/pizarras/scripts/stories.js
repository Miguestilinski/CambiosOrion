import { initPizarrasHeader } from './header.js';

const TARGET_CURRENCIES = ['USD', 'EUR', 'BRL', 'ARS', 'PEN', 'ORO 100']; 

document.addEventListener("DOMContentLoaded", async() => {
    await initPizarrasHeader('stories');
    generateQR();
    connectStream();
    updateDate();
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

    // 1. FILTRAR: Hacemos el filtro un poco más permisivo para depurar
    // Aceptamos 1 (number), "1" (string) o true (boolean)
    const activeCurrencies = currencies.filter(d => {
        const s = d.stories;
        return s == 1 || s === '1' || s === true;
    });

    console.log("Divisas activas para Stories:", activeCurrencies.length);

    // 2. ORDENAR
    activeCurrencies.sort((a, b) => {
        const orderA = a.orden_stories ? parseInt(a.orden_stories) : 999;
        const orderB = b.orden_stories ? parseInt(b.orden_stories) : 999;
        return orderA - orderB;
    });

    if (activeCurrencies.length === 0) {
        // Muestra esto si el filtro borró todo
        container.innerHTML = '<div class="text-center text-4xl text-slate-500 font-bold">Sin divisas configuradas<br><span class="text-lg font-normal">Revisa la columna "stories" en la BD</span></div>';
        container.className = "relative z-10 flex-grow px-16 py-10 flex flex-col justify-center gap-8";
        return;
    }

    // 3. ADAPTAR CONTENEDOR
    // --- LÓGICA DE MODO COMPACTO ---
    // Si hay más de 5 divisas, activamos el modo compacto para que quepan bien
    const isCompact = activeCurrencies.length > 5;

    if (isCompact) {
        // Menos padding vertical (py-2) y menos espacio entre tarjetas (gap-4)
        container.className = "relative z-10 flex-grow px-16 py-2 flex flex-col justify-center gap-4";
    } else {
        container.className = "relative z-10 flex-grow px-16 py-10 flex flex-col justify-center gap-8";
    }

    let html = '';

    activeCurrencies.forEach(divisa => {
        // Aseguramos que los números sean válidos
        const rawCompra = parseFloat(divisa.compra);
        const rawVenta = parseFloat(divisa.venta);
        
        const compra = isNaN(rawCompra) ? '---' : rawCompra.toLocaleString('es-CL', {minimumFractionDigits: 0, maximumFractionDigits: 3});
        const venta = isNaN(rawVenta) ? '---' : rawVenta.toLocaleString('es-CL', {minimumFractionDigits: 0, maximumFractionDigits: 3});
        
        // --- ICONOS ---
        let iconUrl = divisa.icono_circular;
        if (divisa.nombre === 'ORO 100') iconUrl = 'https://cambiosorion.cl/orionapp/icons/ORO100.svg';
        else if (divisa.nombre === 'PLATA OZ') iconUrl = 'https://cambiosorion.cl/orionapp/icons/Plata.svg';

        // --- ESTILOS DINÁMICOS (Compacto vs Normal) ---
        // Definimos las clases base dependiendo del modo
        const cardPadding = isCompact ? 'p-4' : 'p-6';
        const iconSize = isCompact ? 'w-20 h-20' : 'w-24 h-24'; // Iconos más pequeños
        const labelSize = isCompact ? 'text-lg' : 'text-xl';
        
        // Tamaños de fuente por defecto
        let nameSizeClass = isCompact ? 'text-4xl' : 'text-5xl';
        let priceSizeClass = isCompact ? 'text-4xl' : 'text-5xl';
        let gapClass = isCompact ? 'gap-8' : 'gap-12';

        // Ajuste especial para ORO y PLATA (siempre un poco más chicos que el resto)
        if (divisa.nombre === 'ORO 100' || divisa.nombre === 'PLATA OZ') {
            nameSizeClass = isCompact ? 'text-3xl' : 'text-4xl';
            priceSizeClass = isCompact ? 'text-3xl' : 'text-4xl';
            gapClass = 'gap-6';
        }
        
        // HTML String intacto para no romper html2canvas
        html += `
        <div class="glass-card rounded-[2.5rem] ${cardPadding} flex items-center justify-between shadow-2xl relative overflow-hidden group">
            <div class="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <div class="flex items-center gap-5 z-10">
                <img src="${iconUrl}" class="${iconSize} rounded-full border-[4px] border-white/20 bg-white object-cover shadow-lg" crossorigin="anonymous" alt="${divisa.nombre}">
                <div class="flex flex-col gap-0 justify-center"> 
                    <h2 class="${nameSizeClass} font-black text-white leading-none mt-1 story-name">${divisa.nombre}</h2>
                </div>
            </div>
            
            <div class="flex ${gapClass} text-right z-10 items-center">
                <div class="flex flex-col items-end gap-0">
                    <span class="${labelSize} text-white/70 uppercase font-bold tracking-widest mb-1 story-label">Compra</span>
                    <span class="${priceSizeClass} font-bold text-white leading-none story-price">$${compra}</span>
                </div>
                <div class="flex flex-col items-end gap-0">
                    <span class="${labelSize} text-white/70 uppercase font-bold tracking-widest mb-1 story-label">Venta</span>
                    <span class="${priceSizeClass} font-bold text-white leading-none story-price">$${venta}</span>
                </div>
            </div>
        </div>
        `;
    });

    container.innerHTML = html;
}

function updateDate() {
    const now = new Date();
    const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    const dateStr = now.toLocaleDateString('es-CL', options);
    const finalDate = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
    
    const dateEl = document.getElementById('fecha-story');
    if(dateEl) dateEl.innerText = finalDate;
}

// Convertidor robusto a Base64
async function convertImageToBase64(url) {
    try {
        const cacheBuster = `?t=${new Date().getTime()}`;
        const response = await fetch(url + cacheBuster, { cache: 'no-store', mode: 'cors' });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (e) {
        console.warn("No se pudo pre-cargar imagen:", url, e);
        return null;
    }
}

// Nueva función para convertir SVG a PNG (Rasterización)
function convertSvgToPng(url) {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            // Usamos un tamaño fijo suficiente para que se vea nítido
            canvas.width = 200; 
            canvas.height = 200;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, 200, 200);
            try {
                const pngData = canvas.toDataURL('image/png');
                resolve(pngData);
            } catch (e) {
                console.warn("No se pudo convertir a PNG, devolviendo null", e);
                resolve(null);
            }
        };
        img.onerror = () => {
            console.error("Error cargando imagen para conversión PNG");
            resolve(null);
        };
        // Cache buster para evitar problemas de CORS
        img.src = url + '?t=' + new Date().getTime();
    });
}

async function downloadStory() {
    const btn = document.getElementById('btn-download');
    const originalText = btn.innerHTML;
    
    btn.innerHTML = `Generando...`;
    btn.disabled = true;

    // 1. PRE-CARGA FONDO (BASE64)
    const bgImgElement = document.getElementById('background-img');
    const bgPromise = bgImgElement ? convertImageToBase64(bgImgElement.src) : Promise.resolve(null);

    /// 2. PRE-CARGA ICONOS ESPECIALES (SVG -> PNG)
    const oroUrl = 'https://cambiosorion.cl/orionapp/icons/ORO100.svg';
    const plataUrl = 'https://cambiosorion.cl/orionapp/icons/Plata.svg';

    const oroPromise = convertSvgToPng(oroUrl); 
    const plataPromise = convertSvgToPng(plataUrl);

    // Esperamos ambas (ahora base64Oro será un PNG real, no un SVG)
    const [base64Bg, base64Oro, base64Plata] = await Promise.all([bgPromise, oroPromise, plataPromise]);

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

                    // 1. INYECTAR ORO 100 (AHORA ES UN PNG)
                    if (base64Oro) {
                        // Buscamos cualquier imagen que tenga 'ORO' en su src
                        doc.querySelectorAll('img[src*="ORO"]').forEach(img => {
                            img.src = base64Oro;
                            img.style.display = 'block';
                        });
                    }

                    // INYECTAR PLATA OZ (NUEVO)
                    if (base64Plata) {
                        doc.querySelectorAll('img[src*="Plata"]').forEach(img => {
                            img.src = base64Plata;
                            img.style.display = 'block';
                        });
                    }

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

window.downloadStory = downloadStory;