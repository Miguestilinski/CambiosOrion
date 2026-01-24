// Configuración: Las monedas prioritarias que quieres mostrar
const TARGET_CURRENCIES = ['USD', 'EUR', 'BRL', 'ARS', 'PEN']; 

// Conexión al flujo de datos real
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
            // Formateo de miles y lógica de decimales
            const compraFmt = parseFloat(divisa.compra).toLocaleString('es-CL', { maximumFractionDigits: divisa.compra < 100 ? 2 : 0 });
            const ventaFmt = parseFloat(divisa.venta).toLocaleString('es-CL', { maximumFractionDigits: divisa.venta < 100 ? 2 : 0 });
            
            // Ruta del ícono (asumiendo ruta relativa desde el HTML)
            const iconUrl = divisa.icono_circular; 

            html += `
            <div class="glass-card rounded-[2.5rem] p-7 flex items-center justify-between shadow-xl">
                <div class="flex items-center gap-7">
                    <img src="${iconUrl}" class="w-24 h-24 rounded-full border-4 border-white/20 bg-white object-cover" crossorigin="anonymous" alt="${divisa.nombre}">
                    <div>
                        <h2 class="text-5xl font-black text-white tracking-tight">${divisa.nombre}</h2>
                    </div>
                </div>
                <div class="flex gap-12 text-right">
                    <div class="flex flex-col">
                        <span class="text-2xl text-white/70 uppercase font-bold mb-2">Compra</span>
                        <span class="text-5xl font-bold text-white tracking-tight">$${compraFmt}</span>
                    </div>
                    <div class="flex flex-col">
                        <span class="text-2xl text-green-400 uppercase font-bold mb-2">Venta</span>
                        <span class="text-6xl font-black text-green-400 drop-shadow-lg tracking-tight">$${ventaFmt}</span>
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
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateStr = now.toLocaleDateString('es-CL', options);
    // Capitalizar primera letra de cada palabra para que se vea elegante
    const finalDate = dateStr.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    document.getElementById('fecha-story').innerText = finalDate;
}

function downloadStory() {
    const btn = document.getElementById('btn-download');
    const originalText = btn.innerHTML;
    btn.innerHTML = '⚡ Generando imagen...';
    btn.disabled = true;

    const elementToCapture = document.getElementById('story-canvas');

    // Pequeña pausa para asegurar renderizado de fuentes e imágenes
    setTimeout(() => {
        html2canvas(elementToCapture, {
            scale: 2, // Doble resolución para nitidez máxima (Retina)
            useCORS: true, // Vital para cargar el fondo y banderas externas
            allowTaint: true,
            backgroundColor: null, 
            // EL TRUCO CLAVE: Clonamos y quitamos la escala de la vista previa
            onclone: (clonedDoc) => {
                const clonedContainer = clonedDoc.getElementById('preview-container');
                // Reseteamos la transformación en el clon para capturar al 100% de tamaño real
                clonedContainer.style.transform = 'none';
                clonedContainer.style.margin = '0';
            }
        }).then(canvas => {
            // Crear nombre de archivo con fecha (Ej: Orion_Story_2023-10-27.png)
            const fileName = `Orion_Story_${new Date().toISOString().slice(0,10)}.png`;
            
            const link = document.createElement('a');
            link.download = fileName;
            link.href = canvas.toDataURL('image/png', 1.0); // Calidad máxima
            link.click();
            
            btn.innerHTML = originalText;
            btn.disabled = false;
        }).catch(err => {
            console.error("Error generando imagen:", err);
            btn.innerHTML = '❌ Error (Revisar Consola)';
            btn.disabled = false;
        });
    }, 500); // Espera 500ms
}