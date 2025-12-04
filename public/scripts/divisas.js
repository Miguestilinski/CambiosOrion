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

    // Crear 5 filas como el diseño de la tabla con animación
    const skeletonRows = Array.from({ length: 5 }).map(() => `
        <tr class="skeleton-row">
            <td class="px-4 py-2">&nbsp;</td>
            <td class="px-4 py-2">&nbsp;</td>
            <td class="px-4 py-2">&nbsp;</td>
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

let eventSource;
let retryTimeout;

function initializeSSE() {
    eventSource = new EventSource('https://cambiosorion.cl/api/stream/stream_divisas.php');

    eventSource.onopen = () => {
        console.log('Conexión SSE establecida correctamente.');
        clearTimeout(retryTimeout);
    };

    eventSource.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);

            // Capturar la fecha de última actualización
            if (data.length && data[0].fecha_actualizacion) {
                updateLastUpdatedTimestamp(data[0].fecha_actualizacion);
            }

            // Procesar datos de las divisas
            if (Array.isArray(data)) {
                exchangeRates = {};

                data.forEach(currency => {
                    if (
                        currency.nombre &&
                        currency.compra &&
                        currency.venta &&
                        (currency.icono_circular || currency.icono_cuadrado)
                    ) {
                        exchangeRates[currency.nombre] = {
                            compra: removeTrailingZeros(currency.compra),
                            venta: removeTrailingZeros(currency.venta),
                            icono: currency.icono_circular || currency.icono_cuadrado,
                        };
                    } else {
                        console.warn('Elemento inválido en los datos:', currency);
                    }
                });

                removeSkeletonLoader();
            } else {
                console.error('Formato de datos inesperado:', data);
            }
        } catch (error) {
            console.error('Error procesando los datos SSE:', error);
        }
    };

    eventSource.onerror = (error) => {
        console.error('Error con la conexión SSE:', error);
        eventSource.close(); // Cerrar la conexión si algo sale mal
        retryTimeout = setTimeout(() => {
            initializeSSE();
        }, 5000);
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

