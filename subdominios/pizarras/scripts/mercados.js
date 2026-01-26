// /var/www/html/pizarras/scripts/mercados.js
import { initPizarrasHeader } from './header.js';

document.addEventListener('DOMContentLoaded', async() => {
    await initPizarrasHeader('mercados');
    
    fetchMarketData();
    setInterval(fetchMarketData, 60000); 

    console.log("Orion Markets: Conectado");
});

async function fetchMarketData() {
    try {
        const response = await fetch('data/mercados.json?t=' + new Date().getTime());
        if (!response.ok) throw new Error("Error JSON");
        
        const data = await response.json();
        
        if (data.bci) {
            // Separa Monedas de Commodities
            const currencies = data.bci.filter(i => i.type === 'currency' || i.type === 'indicator');
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

        // Formateo de Precios
        let priceFmt;
        
        // 1. UF: Sin decimales
        if (item.symbol === 'UF') {
            priceFmt = '$ ' + Math.round(item.price).toLocaleString('es-CL');
        } 
        // 2. ORO y PLATA: En Dólares (US$)
        else if (item.symbol.includes('Oro') || item.symbol.includes('Plata') || item.symbol.includes('Gold') || item.symbol.includes('Silver')) {
             priceFmt = 'US$ ' + item.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        } 
        // 3. MONEDAS (USD/EUR): En Pesos ($)
        else {
             priceFmt = '$ ' + item.price.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }

        html += `
        <tr class="hover:bg-white/5 transition border-b border-white/5 last:border-0">
            <td class="py-4 pl-2 font-bold text-slate-200">${item.symbol}</td>
            <td class="py-4 text-right font-mono text-white text-lg">${priceFmt}</td>
            <td class="py-4 text-right pr-2">
                <span class="text-xs font-bold px-2 py-1 rounded ${colorClass}">
                    ${changeSign}${item.change.toFixed(2)}% ${icon}
                </span>
            </td>
        </tr>`;
    });

    tbody.innerHTML = html;
}