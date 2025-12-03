let exchangeRates = {};
// Lista completa de monedas
let displayedCurrencies = [
    "USD", "EUR", "ARS", "BRL", "PEN", "COP",
    "UYU", "BOB", "CAD", "GBP", "JPY", "CNY",
    "SEK", "AUD", "MXN", "NZD", "CHF", "DKK",
    "NOK", "ORO 100"
];

function initializePage() {
    initializeSSE();
    setActiveLink('#nav-menu');
    setActiveLink('#session-menu');
    showSkeletonLoader();
}

document.addEventListener('DOMContentLoaded', () => {
    initializePage();
    // Lógica de menús móviles...
});

function showSkeletonLoader() {
    const tableBody = document.getElementById("currency-table-body");
    if (!tableBody) return;

    // Skeleton loader con estilo Dark
    const skeletonRows = Array.from({ length: 8 }).map(() => `
        <tr class="animate-pulse border-b border-white/5">
            <td class="px-6 py-4">
                <div class="flex items-center space-x-3">
                    <div class="rounded-full bg-white/10 h-8 w-8"></div>
                    <div class="h-4 bg-white/10 rounded w-24"></div>
                </div>
            </td>
            <td class="px-6 py-4 text-center">
                <div class="h-4 bg-white/10 rounded w-16 mx-auto"></div>
            </td>
            <td class="px-6 py-4 text-center">
                <div class="h-4 bg-white/10 rounded w-16 mx-auto"></div>
            </td>
        </tr>
    `).join('');

    tableBody.innerHTML = skeletonRows;
}

function removeSkeletonLoader() {
    const tableBody = document.getElementById("currency-table-body");
    if (!tableBody) return;
    tableBody.innerHTML = '';
    fillCurrencyTable();
}

function toggleMenu(menuToOpen, menuToClose) {
    if (menuToClose) closeMenu(menuToClose);
    menuToOpen.classList.toggle('hidden');
}

function closeMenu(menu) {
    if (!menu.classList.contains('hidden')) menu.classList.add('hidden');
}

function setActiveLink(menuId) {
    // Implementación original conservada
}

function removeTrailingZeros(value) {
    if (value === null || value === undefined) return '';
    return parseFloat(value).toString();
}

// NUEVO: Formateador de miles
function formatMoney(value) {
    if(!value) return '-';
    return parseFloat(value).toLocaleString('es-CL');
}

let eventSource;
let retryTimeout;

function initializeSSE() {
    eventSource = new EventSource('https://cambiosorion.cl/api/stream/stream_divisas.php');

    eventSource.onopen = () => {
        console.log('Conexión SSE establecida.');
        clearTimeout(retryTimeout);
    };

    eventSource.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);

            if (data.length && data[0].fecha_actualizacion) {
                updateLastUpdatedTimestamp(data[0].fecha_actualizacion);
            }

            if (Array.isArray(data)) {
                exchangeRates = {};
                data.forEach(currency => {
                    if (currency.nombre) {
                        exchangeRates[currency.nombre] = {
                            compra: removeTrailingZeros(currency.compra),
                            venta: removeTrailingZeros(currency.venta),
                            icono: currency.icono_circular || currency.icono_cuadrado,
                        };
                    }
                });
                removeSkeletonLoader();
            }
        } catch (error) {
            console.error('Error SSE:', error);
        }
    };

    eventSource.onerror = (error) => {
        eventSource.close();
        retryTimeout = setTimeout(() => initializeSSE(), 5000);
    };
}

// === AQUÍ ESTÁ EL CAMBIO CLAVE ===
function fillCurrencyTable() {
    const tableBody = document.getElementById("currency-table-body");
    if (!tableBody) return;

    tableBody.innerHTML = '';
    
    displayedCurrencies.forEach((currency) => {
        if (exchangeRates[currency]) {
            const row = document.createElement("tr");
            
            // Estilos de fila oscura con hover suave
            row.className = "hover:bg-white/10 transition duration-200 group border-b border-white/5 last:border-0";
            
            const currencyIcon = exchangeRates[currency].icono;
            const compraFmt = formatMoney(exchangeRates[currency].compra);
            const ventaFmt = formatMoney(exchangeRates[currency].venta);

            // Inyección de HTML con clases 'text-white' y 'text-lg'
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <img src="${currencyIcon}" alt="${currency}" class="w-8 h-8 mr-3 rounded-full shadow-md object-cover ring-2 ring-white/10 group-hover:scale-110 transition-transform"> 
                        <span class="font-bold text-white tracking-wide text-lg">${currency}</span>
                    </div>
                </td>
                <td class="px-6 py-4 text-center whitespace-nowrap">
                    <div class="text-white font-semibold text-lg">${compraFmt} <span class="text-xs text-blue-300 ml-1">CLP</span></div>
                </td>
                <td class="px-6 py-4 text-center whitespace-nowrap">
                    <div class="text-white font-semibold text-lg">${ventaFmt} <span class="text-xs text-blue-300 ml-1">CLP</span></div>
                </td>
            `;
            tableBody.appendChild(row);
        }
    });
}

function updateLastUpdatedTimestamp(fecha) {
    const el = document.getElementById("last-updated");
    if (el) {
        const dateObj = new Date(fecha);
        const pad = (n) => n.toString().padStart(2, '0');
        const dateStr = `${pad(dateObj.getHours())}:${pad(dateObj.getMinutes())} ${pad(dateObj.getDate())}/${pad(dateObj.getMonth()+1)}/${dateObj.getFullYear()}`;
        
        el.innerHTML = `
            <svg class="w-3 h-3 mr-1 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            Actualizado: ${dateStr}
        `;
    }
}