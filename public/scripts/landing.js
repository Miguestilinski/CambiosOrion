let exchangeRates = {};
let displayedCurrencies = ["USD", "EUR", "ARS", "BRL", "PEN", "COP",
    "UYU", "BOB", "CAD", "GBP", "JPY", "GNY",
    "SEK", "AUD", "MXN", "NZD", "CHF", "DKK"];

function initializePage() {
    loadCurrencies();
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

function loadCurrencies() {
    const targetUrl = 'https://cambiosorion.cl/data/obtener_divisas.php';

    fetch(targetUrl)
        .then(response => response.json())
        .then(data => {
            if (Array.isArray(data)) {
                data.forEach(currency => {
                    if (currency.codigo && currency.compra && currency.venta) {
                        exchangeRates[currency.codigo] = {
                            compra: parseFloat(currency.compra),
                            venta: parseFloat(currency.venta),
                            icono: currency.icono || 'default-icon.png'
                        };
                    } else {
                        console.warn(`Divisa con formato inesperado: ${JSON.stringify(currency)}`);
                    }
                });
                fillCurrencyTable();
            } else {
                console.error("Datos recibidos no son un array:", data);
            }
        })
        .catch(error => console.error('Error al cargar las divisas:', error));
}

function fillCurrencyTable() {
    const tableBody = document.getElementById("currency-table-body");
    if (!tableBody) {
        console.error("Error: 'currency-table-body' no se encuentra en el DOM.");
        return;
    }

    tableBody.innerHTML = '';
    displayedCurrencies.forEach((currency, index) => {
        if (exchangeRates[currency]) {
            const row = document.createElement("tr");
            row.classList.add("currency-row");
            const currencyIcon = exchangeRates[currency].icono;
            const currencyName = currency;
            row.innerHTML = `
                <td class="px-4 py-2 flex items-center justify-start space-x-2 sm:w-auto w-full">
                    <img src="${currencyIcon}" alt="${currencyName}" class="w-6 h-6 mr-2"> ${currencyName}
                </td>
                <td class="px-4 py-2">${Math.round(exchangeRates[currency].compra)} CLP</td>
                <td class="px-4 py-2">${Math.round(exchangeRates[currency].venta)} CLP</td>
            `;
            if (index === 0) {
                row.classList.add("first-row");
            }
            tableBody.appendChild(row);
        } else {
            console.log(`No se encontraron datos para la divisa: ${currency}`);
        }
    });
}
