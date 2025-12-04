let exchangeRates = {};
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

    const navMenuButton = document.getElementById('nav-menu-button');
    const sessionMenuButton = document.getElementById('session-menu-button');
    const navMobileMenu = document.getElementById('nav-mobile-menu');
    const sessionMobileMenu = document.getElementById('session-mobile-menu');

    if (navMenuButton && sessionMenuButton && navMobileMenu && sessionMobileMenu) {
        navMenuButton.addEventListener('click', (event) => {
            toggleMenu(navMobileMenu);
            event.stopPropagation();
        });

        sessionMenuButton.addEventListener('click', (event) => {
            toggleMenu(sessionMobileMenu);
            event.stopPropagation();
        });

        document.addEventListener('click', () => {
            closeMenu(navMobileMenu);
            closeMenu(sessionMobileMenu);
        });
    }
});

// Función para mostrar el Skeleton Loader
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

// Función para ocultar el Skeleton Loader y mostrar la tabla
function removeSkeletonLoader() {
    const tableBody = document.getElementById("currency-table-body");

    if (!tableBody) {
        console.error("Error: 'currency-table-body' no se encuentra en el DOM.");
        return;
    }

    // Limpiar el Skeleton Loader
    tableBody.innerHTML = '';
    fillCurrencyTable();
}

// Función para alternar visibilidad del menú
function toggleMenu(menuToOpen, menuToClose) {
    if (menuToClose) closeMenu(menuToClose);

    if (menuToOpen.classList.contains('hidden')) {
        menuToOpen.classList.remove('hidden');
    } else {
        menuToOpen.classList.add('hidden');
    }
}

function closeMenu(menu) {
    if (!menu.classList.contains('hidden')) {
        menu.classList.add('hidden');
    }
}

// Marcar la opción activa en el menú
function setActiveLink(menuId) {
    const links = document.querySelectorAll(`${menuId} a`);
    const currentPath = window.location.pathname;
    links.forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('selected');
        } else {
            link.classList.remove('selected');
        }
    });
}

function removeTrailingZeros(value) {
    if (value === null || value === undefined) return '';
    const floatValue = parseFloat(value);
    return floatValue.toString();
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
    
    displayedCurrencies.forEach((currency, index) => {
        if (exchangeRates[currency]) {
            const row = document.createElement("tr");

            const compra = exchangeRates[currency].compra;
            const venta = exchangeRates[currency].venta;
            
            const closingCompra = closingRates[currency]?.compra || 0;
            const closingVenta = closingRates[currency]?.venta || 0;
            const varCompra = calculateVariationPercentage(compra, closingCompra);
            const varVenta = calculateVariationPercentage(venta, closingVenta);

            const badgeCompra = (currency === 'CLP') ? '' : getVariationBadge(varCompra);
            const badgeVenta = (currency === 'CLP') ? '' : getVariationBadge(varVenta);

            const baseClasses = "hover:bg-white/10 transition duration-200";
            const rowClass = index === 0 ? "bg-blue-900/20" : "";
            
            row.className = `${baseClasses} ${rowClass} currency-row`;

            // CAMBIOS VISUALES AQUÍ:
            // 1. Padding reducido a px-2 en móvil (md:px-6 en escritorio).
            // 2. Icono reducido a w-5 h-5 en móvil (md:w-8 en escritorio).
            // 3. Texto divisa reducido a text-sm en móvil.
            row.innerHTML = `
                <td class="px-2 md:px-6 py-3 whitespace-nowrap">
                    <div class="flex items-center">
                        <img class="w-5 h-5 md:w-8 md:h-8 rounded-full shadow-md object-cover mr-2 md:mr-3 ring-2 ring-white/10" src="${exchangeRates[currency].icono}" alt="${currency}">
                        <div class="text-sm md:text-lg font-bold text-white tracking-wide">${currency}</div>
                    </div>
                </td>
                
                <td class="px-2 md:px-6 py-3 text-center whitespace-nowrap compra-column">
                    <div class="text-sm md:text-lg font-bold text-white">${compra ? Math.floor(compra) : '-'} <span class="text-[10px] md:text-xs text-blue-300 ml-0.5">CLP</span></div>
                </td>

                <td class="px-2 md:px-6 py-3 text-center whitespace-nowrap compra-column">
                    ${badgeCompra}
                </td>

                <td class="px-2 md:px-6 py-3 text-center whitespace-nowrap venta-column hidden">
                    <div class="text-sm md:text-lg font-bold text-white">${venta ? Math.floor(venta) : '-'} <span class="text-[10px] md:text-xs text-blue-300 ml-0.5">CLP</span></div>
                </td>

                <td class="px-2 md:px-6 py-3 text-center whitespace-nowrap venta-column hidden">
                    ${badgeVenta}
                </td>

                <td class="px-1 md:px-2 py-3 text-center whitespace-nowrap edit-column ${isEditMode ? '' : 'hidden'}">
                    ${currency !== 'CLP' ? `
                    <button onclick="deleteCurrency('${currency}')" class="text-red-400 hover:text-red-300 hover:bg-red-900/30 p-1 rounded-full transition">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                    ` : ''}
                </td>
            `;

            tableBody.appendChild(row);
        }
    });

    toggleTableColumns();
    toggleEditModeState();
}

function getVariationBadge(variation) {
    let classes = "";
    let iconSVG = "";
    let sign = "";

    const arrowUp = `<svg class="w-2 h-2 md:w-2.5 md:h-2.5 ml-0.5 md:ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 10l7-7m0 0l7 7m-7-7v18"></path></svg>`;
    const arrowDown = `<svg class="w-2 h-2 md:w-2.5 md:h-2.5 ml-0.5 md:ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg>`;
    const dash = `<svg class="w-2 h-2 md:w-2.5 md:h-2.5 ml-0.5 md:ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M20 12H4"></path></svg>`;

    if (variation > 0) {
        classes = "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30";
        iconSVG = arrowUp;
        sign = "+";
    } else if (variation < 0) {
        classes = "bg-rose-500/20 text-rose-400 border border-rose-500/30";
        iconSVG = arrowDown;
        sign = ""; 
    } else {
        classes = "bg-gray-500/20 text-gray-400 border border-gray-500/30";
        iconSVG = dash;
        sign = "";
    }

    // Reducido px-1.5 en móvil para ahorrar espacio
    return `
        <div class="inline-flex items-center justify-center px-1.5 md:px-2 py-0.5 rounded-full text-[10px] md:text-xs font-bold tracking-wide ${classes}">
            ${sign}${variation.toFixed(2)}%
            ${iconSVG}
        </div>
    `;
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

