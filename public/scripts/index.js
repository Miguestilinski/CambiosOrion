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
    handleSessionStatus();
}

document.addEventListener('DOMContentLoaded', () => {
    initializePage();

    const isAuthenticated = localStorage.getItem('userAuthenticated') === 'true';
    console.log('Estado de la sesión:', isAuthenticated);
    toggleSessionActions(isAuthenticated);

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

function toggleSessionActions(isAuthenticated) {
    const userActions = document.getElementById('user-actions');
    const guestActions = document.getElementById('guest-actions');

    if (isAuthenticated) {
        console.log("Usuario autenticado, mostrando acciones");
        // Muestra las acciones del usuario autenticado
        userActions.style.display = 'block';
        guestActions.style.display = 'none';
    } else {
        console.log("Usuario no autenticado");
        // Muestra las acciones del invitado
        guestActions.style.display = 'block';
        userActions.style.display = 'none';
    }
}

document.getElementById('logout-button')?.addEventListener('click', () => {
    localStorage.setItem('userAuthenticated', 'false');
    toggleSessionActions(false);
});

function showUserActions() {
    const userActions = document.getElementById('user-actions');
    const guestActions = document.getElementById('guest-actions');

    // Muestra las acciones del usuario autenticado y oculta las del invitado
    if (userActions) {
        userActions.style.display = 'block'; // Muestra las acciones del usuario
        userActions.classList.remove('hidden'); // Elimina la clase 'hidden' si está presente
    }

    if (guestActions) {
        guestActions.style.display = 'none'; // Oculta las acciones del invitado
    }
}

function showGuestActions() {
    const userActions = document.getElementById('user-actions');
    const guestActions = document.getElementById('guest-actions');

    // Muestra las acciones del invitado y oculta las del usuario autenticado
    if (userActions) {
        userActions.style.display = 'none'; // Oculta las acciones del usuario autenticado
    }

    if (guestActions) {
        guestActions.style.display = 'block'; // Muestra las acciones del invitado
        guestActions.classList.remove('hidden'); // Elimina la clase 'hidden' si está presente
    }
}

// Verifica el estado de la sesión (si está autenticado o no)
function handleSessionStatus() {
    const sessionStatus = localStorage.getItem('userAuthenticated') === 'true'; // O el valor que determines
    console.log("Estado de la sesión:", sessionStatus);

    const userActions = document.getElementById('user-actions');
    const guestActions = document.getElementById('guest-actions');

    if (sessionStatus) {
        // Si el usuario está autenticado, mostrar las acciones de usuario
        userActions.style.display = 'block';
        guestActions.style.display = 'none';
    } else {
        // Si no está autenticado, mostrar acciones para invitados
        userActions.style.display = 'none';
        guestActions.style.display = 'block';
    }
}

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

function loadCurrencies() {
    const proxyUrl = 'https://corsproxy.io/?';
    const targetUrl = 'https://cambiosorion.cl/data/obtener_divisas.php';

    fetch(proxyUrl + targetUrl)
        .then(response => response.json())
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

// Función para establecer currency1
function setCurrency1(currency) {
    document.getElementById("currency1-text").textContent = currency;

    // Si el usuario selecciona una divisa diferente a CLP, currency2 se convierte en CLP automáticamente
    if (currency !== "CLP") {
        document.getElementById("currency2-text").textContent = "CLP";
    }

    exchangeRates[currency] = exchangeRates[currency] || { compra: 0, venta: 0 };
    convertFromAmount1();
    updateCurrencyIcon(); // Actualizar el ícono al seleccionar
}

// Función para establecer currency2
function setCurrency2(currency) {
    document.getElementById("currency2-text").textContent = currency;

    // Si el usuario selecciona una divisa diferente a CLP, currency1 se convierte en CLP automáticamente
    if (currency !== "CLP") {
        document.getElementById("currency1-text").textContent = "CLP";
    }

    exchangeRates[currency] = exchangeRates[currency] || { compra: 0, venta: 0 };
    convertFromAmount2();
    updateCurrencyIcon(); // Actualizar el ícono al seleccionar
}

// Modificar los inputs para formatear y validar el contenido
document.addEventListener('DOMContentLoaded', () => {
    const amountInputs = [document.getElementById("amount1"), document.getElementById("amount2")];

    amountInputs.forEach(input => {
        if (input) {
            // Restringir la entrada a solo números y formato con separador de miles
            input.addEventListener('input', (event) => {
                const rawValue = event.target.value.replace(/\./g, ''); // Quitar puntos existentes
                const numericValue = rawValue.replace(/\D/g, ''); // Quitar caracteres no numéricos

                if (numericValue.length > 9) {
                    event.target.value = formatWithThousandsSeparator(numericValue.slice(0, 9));
                } else {
                    event.target.value = formatWithThousandsSeparator(numericValue);
                }
            });

            // Evitar caracteres no permitidos
            input.addEventListener('keydown', (event) => {
                const allowedKeys = ["Backspace", "ArrowLeft", "ArrowRight", "Delete", "Tab"];
                const isNumber = /^[0-9]$/.test(event.key);

                if (!isNumber && !allowedKeys.includes(event.key)) {
                    event.preventDefault();
                }
            });

            // Actualizar el valor al salir del campo
            input.addEventListener('blur', () => {
                const rawValue = input.value.replace(/\./g, '');
                const numericValue = rawValue.replace(/\D/g, '');
                input.value = formatWithThousandsSeparator(numericValue);
            });
        }
    });
});

// Formatear números con separador de miles
function formatWithThousandsSeparator(value) {
    return value.replace(/\B(?=(\d{3})+(?!\d))/g, '.'); // Inserta puntos como separadores de miles
}

// Mantener las conversiones funcionales
function convertFromAmount1() {
    const amount1 = parseFloat(document.getElementById("amount1").value.replace(/\./g, ''));
    const currency1 = document.getElementById("currency1-text").textContent;
    const currency2 = document.getElementById("currency2-text").textContent;

    if (amount1 && exchangeRates[currency1] && exchangeRates[currency2]) {
        let result;

        if (currency1 === "CLP") {
            result = amount1 / exchangeRates[currency2].venta;
        } else {
            result = amount1 * exchangeRates[currency1].compra;
        }

        document.getElementById("amount2").value = formatWithThousandsSeparator(result.toFixed(0));
    }
}

function convertFromAmount2() {
    const amount2 = parseFloat(document.getElementById("amount2").value.replace(/\./g, ''));
    const currency1 = document.getElementById("currency1-text").textContent;
    const currency2 = document.getElementById("currency2-text").textContent;

    if (amount2 && exchangeRates[currency1] && exchangeRates[currency2]) {
        let result;

        if (currency2 === "CLP") {
            result = amount2 * exchangeRates[currency1].venta;
        } else {
            result = amount2 / exchangeRates[currency2].compra;
        }

        document.getElementById("amount1").value = formatWithThousandsSeparator(result.toFixed(0));
    }
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

function toggleEditMode() {
    isEditMode = !isEditMode;

    document.querySelectorAll(".edit-column").forEach(col => {
        if (isEditMode) {
            col.classList.remove("hidden");
            col.style.display = "table-cell"; // Asegúrate de que se muestre como una celda de tabla
        } else {
            col.classList.add("hidden");
            col.style.display = "none"; // Asegúrate de que se oculte
        }
    });
}
window.toggleEditMode = toggleEditMode;

document.querySelectorAll(".edit-column").forEach(col => {
    if (isEditMode) {
        col.classList.remove("hidden");
        col.style.display = "table-cell"; // Asegúrate que se muestre
    } else {
        col.classList.add("hidden");
        col.style.display = "none"; // Asegúrate que se oculte
    }
});

function deleteCurrency(currency) {
    displayedCurrencies = displayedCurrencies.filter(curr => curr !== currency);
    isEditMode = false;
    document.querySelectorAll(".edit-column").forEach(col => {
        col.classList.add("hidden");
        col.style.display = "none"; // Asegúrate que se oculte
    });
    updateAddCurrencyDropdown();  // Actualiza el dropdown
    fillCurrencyTable();  // Refresca la tabla
}
window.deleteCurrency = deleteCurrency;

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
    // Lógica para cerrar sesión
    console.log('Cerrar sesión');
    // Redirigir al usuario o eliminar datos de sesión
}