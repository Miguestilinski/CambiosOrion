let exchangeRates = {};
let displayedCurrencies = [
    "USD", "EUR", "ARS", "BRL", "PEN", "COP",
    "UYU", "BOB", "CAD", "GBP", "JPY", "GNY",
    "SEK", "AUD", "MXN", "NZD", "CHF", "DKK"
];

function initializePage() {
    initializeSSE();
    setActiveLink('#nav-menu');
    setActiveLink('#session-menu');
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

    eventSource.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
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
                    }
                });

                fillCurrencyTable();
            } else {
                console.error('Formato inesperado en datos SSE:', data);
            }
        } catch (error) {
            console.error('Error al procesar los datos SSE:', error);
        }
    };

    eventSource.onerror = (error) => {
        console.error('Error con la conexión SSE:', error);
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
