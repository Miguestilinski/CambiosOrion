// /var/www/html/pizarras/scripts/mercados.js
import { initPizarrasHeader } from './header.js';

document.addEventListener('DOMContentLoaded', async() => {
    await initPizarrasHeader('mercados');
    
    // Iniciamos el bucle de "Alta Frecuencia"
    startHighFrequencyPolling();

    console.log("Orion Markets: High Frequency Mode (2s) ⚡");
});

// Bucle Recursivo Inteligente
async function startHighFrequencyPolling() {
    await fetchMarketData();
    
    // En tu función startHighFrequencyPolling()
    setTimeout(startHighFrequencyPolling, 4000);
}

async function fetchMarketData() {
    try {
        // Agregamos timestamp para romper caché del navegador obligatoriamente
        const response = await fetch('data/mercados.json?t=' + new Date().getTime());
        
        if (!response.ok) return; 
        
        const data = await response.json();
        
        if (data.bci) {
            const currencies = data.bci.filter(i => i.type === 'currency');
            const commodities = data.bci.filter(i => i.type === 'commodity');

            renderBCITable('table-bci-currencies', currencies);
            renderBCITable('table-bci-commodities', commodities);
        }
        
        const timeBadge = document.getElementById('last-update-display');
        if(timeBadge) {
            timeBadge.innerText = `Actualizado: ${data.last_update}`;
            // Efecto visual sutil de pulso verde
            timeBadge.classList.add('text-emerald-400');
            setTimeout(() => timeBadge.classList.remove('text-emerald-400'), 500);
        }

    } catch (error) {
        // Silencioso para no ensuciar la consola en producción
    }
}

function renderBCITable(elementId, items) {
    const tbody = document.getElementById(elementId);
    if (!tbody || !items) return;

    // Nota: Re-renderizar toda la tabla cada 2 seg es rápido, 
    // pero si quisieras optimizar más, podrías actualizar solo las celdas. 
    // Por ahora, esto funciona excelente.
    let html = '';
    
    items.forEach(item => {
        let icon = item.status === 'up' ? '▲' : (item.status === 'down' ? '▼' : '-');
        let colorClass = item.status === 'up' ? 'text-emerald-400 bg-emerald-400/10' : (item.status === 'down' ? 'text-red-400 bg-red-400/10' : 'text-slate-400');
        let changeSign = item.status === 'up' ? '+' : '';

        let priceFmt;
        if (item.type === 'commodity') {
             priceFmt = 'US$ ' + item.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        } else {
             let decimals = item.price < 10 ? 4 : 2;
             priceFmt = '$ ' + item.price.toLocaleString('es-CL', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
        }

        html += `
        <tr class="hover:bg-white/5 transition border-b border-white/5 last:border-0 group">
            <td class="py-3 pl-2 font-bold text-slate-200 text-sm whitespace-nowrap">${item.symbol}</td>
            <td class="py-3 text-right font-mono text-white text-base tracking-wide group-hover:scale-105 transition-transform origin-right">${priceFmt}</td>
            <td class="py-3 text-right pr-2">
                <span class="text-[10px] font-bold px-1.5 py-0.5 rounded ${colorClass}">
                    ${changeSign}${item.change.toFixed(2)}% ${icon}
                </span>
            </td>
        </tr>`;
    });

    tbody.innerHTML = html;
}