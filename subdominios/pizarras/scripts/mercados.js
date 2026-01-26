// /var/www/html/pizarras/scripts/mercados.js
import { initPizarrasHeader } from './header.js';

document.addEventListener('DOMContentLoaded', async() => {
    await initPizarrasHeader('mercados');
    
    // Iniciar el polling
    fetchMarketData();
    setInterval(fetchMarketData, 60000); 

    console.log("Orion Markets: Modo BCI Activo");
});

async function fetchMarketData() {
    try {
        const response = await fetch('data/mercados.json?t=' + new Date().getTime());
        
        if (!response.ok) throw new Error(`HTTP ${response.status} - No se encontró el archivo JSON`);
        
        const data = await response.json();
        
        // Renderizar BCI
        if (data.bci) {
            // Filtrar por tipo para ponerlos en tablas separadas
            const currencies = data.bci.filter(i => i.type === 'currency' || i.type === 'indicator');
            const commodities = data.bci.filter(i => i.type === 'commodity');

            renderBCITable('table-bci-currencies', currencies);
            renderBCITable('table-bci-commodities', commodities);
        }
        
        // Mantenemos lógica vieja oculta pero funcional si quisieras reactivarla
        // renderTable('table-capitaria', data.capitaria);
        // renderTable('table-investing', data.investing);
        
        const timeBadge = document.getElementById('last-update-display');
        if(timeBadge) timeBadge.innerText = `Actualizado: ${data.last_update}`;

    } catch (error) {
        console.error("Error al obtener datos de mercado:", error);
        const badge = document.getElementById('last-update-display');
        if(badge) badge.innerText = "Error de conexión";
    }
}

function renderBCITable(elementId, items) {
    const tbody = document.getElementById(elementId);
    if (!tbody || !items) return;

    let html = '';
    
    items.forEach(item => {
        let icon = '';
        let colorClass = 'text-white';
        let changeSign = '';

        if (item.status === 'up') {
            colorClass = 'text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded';
            changeSign = '+';
            icon = '▲';
        } else if (item.status === 'down') {
            colorClass = 'text-red-400 bg-red-400/10 px-2 py-1 rounded';
            changeSign = '';
            icon = '▼';
        } else {
            colorClass = 'text-slate-400';
            icon = '-';
        }

        // Formateo inteligente
        let priceFmt;
        if (item.symbol === 'UF') {
            // UF sin decimales, con punto mil
            priceFmt = '$ ' + Math.round(item.price).toLocaleString('es-CL');
        } else if (item.symbol.includes('Cobre') || item.symbol.includes('Petróleo')) {
             // Commodities en USD con 2 decimales
             priceFmt = 'US$ ' + item.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        } else {
             // Dólar/Euro en CLP
             priceFmt = '$ ' + item.price.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }

        html += `
        <tr class="hover:bg-white/5 transition">
            <td class="py-4 pl-2 font-bold text-slate-200">
                ${item.symbol}
            </td>
            <td class="py-4 text-right font-mono text-white text-lg">
                ${priceFmt}
            </td>
            <td class="py-4 text-right pr-2">
                <span class="text-xs font-bold ${colorClass}">
                    ${changeSign}${item.change.toFixed(2)}% ${icon}
                </span>
            </td>
        </tr>
        `;
    });

    tbody.innerHTML = html;
}