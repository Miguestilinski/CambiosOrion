let exchangeRates = {};
let displayedCurrencies = [
    "USD", "EUR", "ARS", "BRL", "PEN", "COP",
    "UYU", "BOB", "CAD", "GBP", "JPY", "GNY",
    "SEK", "AUD", "MXN", "NZD", "CHF", "DKK", "ORO 100"
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

function initializeSSE() {
    const eventSource = new EventSource('https://cambiosorion.cl/api/divisas/stream/stream_divisas.php');

    eventSource.onopen = () => {
        console.log('Conexión SSE establecida correctamente.');
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
    };
}

function fillCurrencyTable() {
    const tableBody = document.getElementById("currency-table-body");
    if (!tableBody) {
        console.error("Error: 'currency-table-body' no se encuentra en el DOM.");
        return;
    }

    tableBody.innerHTML = '';
    displayedCurrencies.forEach((currency) => {
        if (exchangeRates[currency]) {
            const row = document.createElement("tr");
            row.classList.add("currency-row");
            const currencyIcon = exchangeRates[currency].icono;
            const currencyName = currency;
            row.innerHTML = `
                <td class="px-4 py-2 flex items-center justify-start space-x-2 sm:w-auto w-full">
                    <img src="${currencyIcon}" alt="${currencyName}" class="w-6 h-6 mr-2"> ${currencyName}
                </td>
                <td class="px-4 py-2">${exchangeRates[currency].compra} CLP</td>
                <td class="px-4 py-2">${exchangeRates[currency].venta} CLP</td>
            `;
            tableBody.appendChild(row);
        } else {
            console.log(`No se encontraron datos para la divisa: ${currency}`);
        }
    });
}

function updateLastUpdatedTimestamp(fecha) {
    const lastUpdatedElement = document.getElementById("last-updated");
    if (lastUpdatedElement) {
        const dateObject = new Date(fecha);
        const formattedDate = dateObject.toLocaleString('es-CL', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        lastUpdatedElement.textContent = `Última actualización: ${formattedDate}`;
    }
}

