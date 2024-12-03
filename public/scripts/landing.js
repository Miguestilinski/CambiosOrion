let exchangeRates = {};
let iconsLoaded = {};
let isEditMode = false;
let activeDropdown = null;
let displayedCurrencies = ["CLP", "USD", "EUR", "ARS"];

function initializePage() {
    loadCurrencies();
    fillCurrencyTable();
    setActiveLink('#nav-menu');
    setActiveLink('#session-menu');
}

document.addEventListener('DOMContentLoaded', () => {
    initializePage();

    const isAuthenticated = localStorage.getItem('userAuthenticated') === 'true';
    console.log('Estado de la sesión:', isAuthenticated);
    toggleSessionActions(isAuthenticated); // Se asegura de que las acciones se muestren correctamente

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

document.addEventListener('DOMContentLoaded', () => {
    const isAuthenticated = localStorage.getItem('userAuthenticated') === 'true';
    console.log('Estado de la sesión:', isAuthenticated);
    toggleSessionActions(isAuthenticated);
});

function toggleSessionActions(isAuthenticated) {
    const userActions = document.getElementById('user-actions');
    const guestActions = document.getElementById('guest-actions');
    const profileMenuButton = document.getElementById('profile-menu-button');
    const profileMenu = document.getElementById('profile-menu');

    if (isAuthenticated) {
        console.log("Usuario autenticado, mostrando acciones");
        // Mostrar las acciones para usuarios autenticados
        userActions.style.display = 'flex'; // Asegúrate de usar 'flex' para contenedores flexibles
        guestActions.style.display = 'none';

        // Asegurarse de que el botón de perfil sea visible
        if (profileMenuButton) {
            profileMenuButton.classList.remove('hidden');

            // Agregar evento para alternar el menú del perfil
            profileMenuButton.addEventListener('click', () => {
                if (profileMenu) {
                    profileMenu.classList.toggle('hidden');
                }
            });
        }
    } else {
        console.log("Usuario no autenticado, mostrando acciones de invitados");
        // Mostrar las acciones para invitados
        guestActions.style.display = 'flex';
        userActions.style.display = 'none';

        // Asegurarse de que el botón de perfil esté oculto
        if (profileMenuButton) {
            profileMenuButton.classList.add('hidden');
        }

        // Asegurarse de ocultar el menú del perfil
        if (profileMenu) {
            profileMenu.classList.add('hidden');
        }
    }

    // Guarda el estado de autenticación en localStorage
    localStorage.setItem('userAuthenticated', isAuthenticated ? 'true' : 'false');
}

// Cerrar sesión
document.getElementById('logout-button')?.addEventListener('click', () => {
    localStorage.setItem('userAuthenticated', 'false');
    toggleSessionActions(false);
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

document.addEventListener('DOMContentLoaded', () => {
    const isLoggedIn = checkSession(); // Implementa esta función para determinar si hay sesión activa
    const guestActions = document.getElementById('guest-actions');
    const userActions = document.getElementById('user-actions');
    const profileMenuButton = document.getElementById('profile-menu-button');
    const profileMenu = document.getElementById('profile-menu');

    if (isLoggedIn) {
        // Mostrar menú de usuario
        guestActions.classList.add('hidden');
        userActions.classList.remove('hidden');

        // Lógica para desplegar el menú
        profileMenuButton.addEventListener('click', () => {
            profileMenu.classList.toggle('hidden');
        });

        // Cerrar menú al hacer clic fuera
        document.addEventListener('click', (event) => {
            if (!userActions.contains(event.target)) {
                profileMenu.classList.add('hidden');
            }
        });

        // Rellenar datos de usuario
        document.getElementById('user-name').textContent = 'Nombre Usuario'; // Cambia con los datos reales
        document.getElementById('user-email').textContent = 'usuario@ejemplo.com';
    } else {
        // Mostrar botones de invitado
        guestActions.classList.remove('hidden');
        userActions.classList.add('hidden');
    }

    // Lógica para cerrar sesión
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            logout(); // Implementa la función para cerrar sesión
        });
    }
});

function checkSession() {
    // Implementa la lógica para verificar si el usuario tiene sesión activa
    // Retorna true si está autenticado, false si no
    return false; // Placeholder
}

function logout() {
    toggleSessionActions(false); // Cambiar el estado de la sesión a false
    console.log('Cerrar sesión');
    // Redirigir al usuario o eliminar datos de sesión
}

function loadCurrencies() {
    const proxyUrl = 'https://corsproxy.io/?';
    const targetUrl = 'https://cambiosorion.cl/data/obtener_divisas.php';

    fetch(proxyUrl + targetUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.text(); // Cambiado a text()
        })
        
        .then(data => {

            // Si los datos están en 'contents', intenta parsearlos
            const responseData = data.contents ? JSON.parse(data.contents) : data;

            // Asegurarse de que responseData es un array antes de usar forEach
            if (!Array.isArray(responseData)) {
                console.error("Formato de datos inesperado:", responseData);
                return;
            }

            const dropdown1 = document.getElementById("dropdown1");
            const dropdown2 = document.getElementById("dropdown2");

            if (dropdown1) dropdown1.innerHTML = '';
            if (dropdown2) dropdown2.innerHTML = '';

            responseData.forEach(divisa => {
                const circularIcon = divisa.icono_circular;
                exchangeRates[divisa.nombre] = {
                    compra: parseFloat(divisa.compra),
                    venta: parseFloat(divisa.venta),
                    icono: circularIcon
                };

                preloadIcon(circularIcon);

                const option1 = document.createElement("div");
                option1.innerHTML = `<img src="${circularIcon}" alt="${divisa.nombre}" class="w-6 h-6 mr-2"> ${divisa.nombre}`;
                option1.className = "p-2 hover:bg-gray-100 cursor-pointer";
                option1.onclick = function () {
                    setCurrency1(divisa.nombre);
                    toggleDropdown('dropdown1', event);
                };
                dropdown1.appendChild(option1);

                const option2 = document.createElement("div");
                option2.innerHTML = `<img src="${circularIcon}" alt="${divisa.nombre}" class="w-5 h-5 mr-2"> ${divisa.nombre}`;
                option2.className = "p-2 hover:bg-gray-100 cursor-pointer";
                option2.onclick = function () {
                    setCurrency2(divisa.nombre);
                    toggleDropdown('dropdown2', event);
                };
                dropdown2.appendChild(option2);
            });

            updateAddCurrencyDropdown();
            fillCurrencyTable();
        })
        .catch(error => console.error('Error al cargar las divisas:', error));
}

window.addEventListener('resize', function () {
    const mobileButtons = document.querySelector('.md\\:hidden');
});

function preloadIcon(iconUrl) {
    if (!iconsLoaded[iconUrl]) {
        const img = new Image();
        img.onload = () => {
            iconsLoaded[iconUrl] = true;
        };
        img.onerror = () => {
            iconsLoaded[iconUrl] = false;
            console.error(`No se pudo cargar el ícono: ${iconUrl}`);
        };
        img.src = iconUrl; // Carga la imagen en el navegador
    }
}

// Formatear números con separador de miles
function formatWithThousandsSeparator(value) {
    return value.replace(/\B(?=(\d{3})+(?!\d))/g, '.'); // Inserta puntos como separadores de miles
}


// Función para actualizar el ícono de divisa seleccionado
function updateCurrencyIcon() {
    const currency1 = document.getElementById("currency1-text").textContent;
    const currency2 = document.getElementById("currency2-text").textContent;

    document.getElementById("icon-currency1").src = exchangeRates[currency1].icono;
    document.getElementById("icon-currency2").src = exchangeRates[currency2].icono;
}   

function fillCurrencyTable() {
    const tableBody = document.getElementById("currency-table-body");
    if (!tableBody) {
        console.error("Error: 'currency-table-body' no se encuentra en el DOM.");
        return; // Evita continuar si el elemento no existe
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
        }
    });
}

function updateAddCurrencyDropdown() {
    const dropdown = document.getElementById("add-currency-dropdown");
    dropdown.innerHTML = '';  // Limpiar el dropdown actual

    // Agregar divisas que no están en displayedCurrencies
    Object.keys(exchangeRates).forEach(currency => {
        // Solo mostrar divisas que no están en displayedCurrencies
        if (!displayedCurrencies.includes(currency)) {
            const option = document.createElement("div");
            option.innerHTML = `<img src="${exchangeRates[currency].icono}" alt="${currency}" class="w-6 h-6 mr-2"> ${currency}`;
            option.className = "p-2 hover:bg-gray-100 cursor-pointer";
            option.onclick = function () {
                if (isEditMode) {
                    isEditMode = false;
                    document.querySelectorAll(".edit-column").forEach(col => {
                        col.classList.add("hidden");
                        col.style.display = "none"; // Ocultar columnas de edición
                    });
                }
                displayedCurrencies.push(currency);
                toggleDropdown('add-currency-dropdown', event);  // Pasa el evento aquí
                fillCurrencyTable();  // Actualiza la tabla con la nueva divisa
                updateAddCurrencyDropdown();  // Actualiza el dropdown
            };
            dropdown.appendChild(option);
        }
    });
}

function toggleDropdown(dropdownId, event) {
    event.stopPropagation();
    const dropdown = document.getElementById(dropdownId);

    if (activeDropdown && activeDropdown !== dropdown) {
        activeDropdown.classList.add("hidden");
    }

    // Alternar la visibilidad del dropdown actual
    if (dropdown.classList.contains("hidden")) {
        dropdown.classList.remove("hidden");
        activeDropdown = dropdown;
    } else {
        dropdown.classList.add("hidden");
        activeDropdown = null;
    }
}

window.toggleDropdown = toggleDropdown;

document.addEventListener("click", function (event) {
    // Verifica si el clic está fuera del dropdown activo y del elemento de activación
    if (
        activeDropdown &&
        !activeDropdown.contains(event.target) &&
        !event.target.closest("[data-dropdown-id]")
    ) {
        console.log("Clic fuera del dropdown");
        activeDropdown.classList.add("hidden");
        activeDropdown = null;
    }
     // Cerrar el menú si el clic es fuera de un botón o menú
     if (!navMenuButton.contains(event.target) && !navMobileMenu.contains(event.target)) {
        navMobileMenu.style.display = 'none';
    }
    if (!sessionMenuButton.contains(event.target) && !sessionMobileMenu.contains(event.target)) {
        sessionMobileMenu.style.display = 'none';
    }
});
