// /var/www/html/pizarras/scripts/mercados.js
import { initPizarrasHeader } from './header.js';

document.addEventListener('DOMContentLoaded', async() => {
    await initPizarrasHeader('mercados');
    
    fetchMarketData();
    // Actualizamos cada 60s
    setInterval(fetchMarketData, 60000); 

    console.log("Orion Markets: Lista Extendida Activa");
});

async function fetchMarketData() {
    try {
        const response = await fetch('data/mercados.json?t=' + new Date().getTime());
        if (!response.ok) throw new Error("Error JSON");
        
        const data = await response.json();
        
        if (data.bci) {
            // Separar
            const currencies = data.bci.filter(i => i.type === 'currency');
            const commodities = data.bci.filter(i => i.type === 'commodity');

            renderBCITable('table-bci-currencies', currencies);
            renderBCITable('table-bci-commodities', commodities);
        }
        
        const timeBadge = document.getElementById('last-update-display');
        if(timeBadge) timeBadge.innerText = `Actualizado: ${data.last_update}`;

    } catch (error) {
        console.error(error);
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

        // Formateo Inteligente
        let priceFmt;
        
        if (item.type === 'commodity') {
             // Commodities en USD
             priceFmt = 'US$ ' + item.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        } else {
             // Divisas en CLP
             // Si el valor es muy pequeño (ej: COP, JPY), mostramos más decimales
             let decimals = item.price < 10 ? 4 : 2;
             priceFmt = '$ ' + item.price.toLocaleString('es-CL', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
        }

        html += `
        <tr class="hover:bg-white/5 transition border-b border-white/5 last:border-0">
            <td class="py-3 pl-2 font-bold text-slate-200 text-sm whitespace-nowrap">${item.symbol}</td>
            <td class="py-3 text-right font-mono text-white text-base tracking-wide">${priceFmt}</td>
            <td class="py-3 text-right pr-2">
                <span class="text-[10px] font-bold px-1.5 py-0.5 rounded ${colorClass}">
                    ${changeSign}${item.change.toFixed(2)}% ${icon}
                </span>
            </td>
        </tr>`;
    });

    tbody.innerHTML = html;
}