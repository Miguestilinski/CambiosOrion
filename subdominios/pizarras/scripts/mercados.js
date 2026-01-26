// /var/www/html/pizarras/scripts/mercados.js
import { initPizarrasHeader } from './header.js';

document.addEventListener('DOMContentLoaded', async() => {
    await initPizarrasHeader('mercados');
    
    // Iniciar el polling de datos
    fetchMarketData();
    // Actualizar cada 10 segundos
    setInterval(fetchMarketData, 10000); 

    console.log("Orion Markets: Modo Tabla Activo");
});

async function fetchMarketData() {
    try {
        // Asegúrate de que la ruta al json sea correcta y accesible
        const response = await fetch('/pizarras/data/mercados.json?t=' + new Date().getTime());
        if (!response.ok) throw new Error("No se pudo leer mercados.json");
        
        const data = await response.json();
        
        renderTable('table-capitaria', data.capitaria);
        renderTable('table-investing', data.investing);
        
        const timeBadge = document.getElementById('last-update-display');
        if(timeBadge) timeBadge.innerText = `Actualizado: ${data.last_update}`;

    } catch (error) {
        console.error("Error fetching market data:", error);
    }
}

function renderTable(elementId, items) {
    const tbody = document.getElementById(elementId);
    if (!tbody || !items) return;

    let html = '';
    
    items.forEach(item => {
        // Iconos SVG según estado
        let icon = '';
        let colorClass = 'text-white';
        let changeSign = '';

        if (item.status === 'up') {
            colorClass = 'trend-up';
            changeSign = '+';
            icon = `<svg class="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>`;
        } else if (item.status === 'down') {
            colorClass = 'trend-down';
            icon = `<svg class="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"></path></svg>`;
        } else {
            colorClass = 'trend-neutral';
            icon = `<svg class="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14"></path></svg>`;
        }

        // Formateo de precio (Detectar si es miles o decimal pequeño)
        let priceFmt = item.price.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        if (item.symbol.includes("USD") || item.symbol.includes("EUR")) {
             // Formato moneda chilena si aplica
             // priceFmt = `$ ${priceFmt}`; 
        }

        html += `
        <tr class="hover:bg-white/5 transition border-b border-white/5 last:border-0">
            <td class="py-4 pl-2 font-bold text-white flex items-center gap-2">
                ${item.symbol}
            </td>
            <td class="py-4 text-right font-mono text-slate-200">
                ${priceFmt}
            </td>
            <td class="py-4 text-right pr-2 font-bold ${colorClass}">
                <div class="flex items-center justify-end gap-1">
                    ${changeSign}${item.change.toFixed(2)}
                    ${icon}
                </div>
            </td>
        </tr>
        `;
    });

    tbody.innerHTML = html;
}