// /var/www/html/pizarras/scripts/mercados.js
import { initPizarrasHeader } from './header.js';

document.addEventListener('DOMContentLoaded', async() => {
    await initPizarrasHeader('mercados');
    
    // Iniciar carga inmediata
    fetchMarketData();
    
    // Actualizar cada 4 segundos (Polling rápido en lugar de SSE)
    // Esto NO bloquea conexiones y deja libre a stream_divisas.php
    setInterval(fetchMarketData, 4000); 

    console.log("Orion Markets: Modo Polling (Compatibilidad)");
});

async function fetchMarketData() {
    try {
        // Leemos el JSON que genera Python. Agregamos ?t=timestamp para evitar caché
        const response = await fetch('data/mercados.json?t=' + new Date().getTime());
        
        if (!response.ok) return; // Silencioso si falla
        
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
            // Pequeño efecto visual para indicar vida
            timeBadge.style.opacity = 0.5;
            setTimeout(() => timeBadge.style.opacity = 1, 200);
        }

    } catch (error) {
        console.warn("Esperando datos...", error);
    }
}

function renderBCITable(elementId, items) {
    const tbody = document.getElementById(elementId);
    if (!tbody || !items) return;

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