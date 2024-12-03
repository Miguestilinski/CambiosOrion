let exchangeRates = {};
let displayedCurrencies = ["USD", "EUR", "ARS", "BRL"];

function initializePage() {
    loadCurrencies();
    fillCurrencyTable();
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
            toggleMenu(navMobileMenu); // Cambié la llamada para solo pasar un menú
            event.stopPropagation();
        });

        sessionMenuButton.addEventListener('click', (event) => {
            toggleMenu(sessionMobileMenu); // Cambié la llamada para solo pasar un menú
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

    // Alternamos la clase 'hidden' para mostrar o esconder el menú
    if (menuToOpen.classList.contains('hidden')) {
        menuToOpen.classList.remove('hidden'); // Muestra el menú
    } else {
        menuToOpen.classList.add('hidden'); // Oculta el menú
    }
}

function closeMenu(menu) {
    if (!menu.classList.contains('hidden')) {
        menu.classList.add('hidden'); // Asegúrate de ocultar el menú si está visible
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

// Función para cargar las divisas
function loadCurrencies() {
    const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
    const targetUrl = 'https://cambiosorion.cl/data/obtener_divisas.php';
    
    fetch(proxyUrl + targetUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.text(); // Cambiado a text()
        })
        .then(data => {
            console.log("Respuesta del servidor:", data); // Revisa el contenido real de la respuesta

            try {
                // Intentamos parsear el texto completo
                const responseData = JSON.parse(data);

                // Verifica si 'contents' está presente en la respuesta
                const currencies = responseData.contents ? JSON.parse(responseData.contents) : null;

                if (!currencies) {
                    console.error("No se pudo obtener el JSON de las divisas. La respuesta no contiene 'contents'");
                    return;
                }

                // Procesa las divisas
                console.log("Divisas obtenidas:", currencies);
                exchangeRates = currencies; // Asumiendo que 'currencies' contiene las divisas
                fillCurrencyTable(); // Actualiza la tabla
            } catch (error) {
                console.error('Error al parsear el JSON:', error);
            }
        })
        .catch(error => {
            console.error('Error al cargar las divisas:', error);
        });
}

function fillCurrencyTable() {
    const tableBody = document.getElementById("currency-table-body");
    if (!tableBody) {
        console.error("Error: 'currency-table-body' no se encuentra en el DOM.");
        return; // Evita continuar si el elemento no existe
    }

    console.log("Rellenando la tabla de divisas...");
    tableBody.innerHTML = '';

    displayedCurrencies.forEach((currency, index) => {
        if (exchangeRates[currency]) {
            console.log(`Procesando la divisa: ${currency}`);
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
                <td class="px-4 py-2 edit-column ${isEditMode ? '' : 'hidden'}">
                    <button onclick="deleteCurrency('${currency}')" class="delete-btn">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="w-6 h-6 text-white">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </td>
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
