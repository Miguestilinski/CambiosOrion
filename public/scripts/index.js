let exchangeRates = {};
let iconsLoaded = {};
let isEditMode = false;
let displayedCurrencies = ["CLP", "USD", "EUR", "ARS"];

document.addEventListener('DOMContentLoaded', () => {
    initializePage();
    initializeAuthentication();
    initializeMenuHandlers();
    initializeCurrencyHandlers();
});

function initializePage() {
    loadCurrencies();
    fillCurrencyTable();
    setActiveLink('#nav-menu');
    setActiveLink('#session-menu');
}

// Manejo de autenticación
function initializeAuthentication() {
    const isAuthenticated = localStorage.getItem('userAuthenticated') === 'true';
    toggleSessionActions(isAuthenticated);

    const logoutButton = document.getElementById('logout-button');
    logoutButton?.addEventListener('click', () => {
        localStorage.setItem('userAuthenticated', 'false');
        toggleSessionActions(false);
    });
}

function toggleSessionActions(isAuthenticated) {
    const userActions = document.getElementById('user-actions');
    const guestActions = document.getElementById('guest-actions');
    const profileMenuButton = document.getElementById('profile-menu-button');
    const profileMenu = document.getElementById('profile-menu');

    if (isAuthenticated) {
        userActions.style.display = 'flex';
        guestActions.style.display = 'none';
        profileMenuButton?.addEventListener('click', () => {
            profileMenu?.classList.toggle('hidden');
        });
    } else {
        guestActions.style.display = 'flex';
        userActions.style.display = 'none';
    }
}

// Manejo de menús
function initializeMenuHandlers() {
    const navMenuButton = document.getElementById('nav-menu-button');
    const sessionMenuButton = document.getElementById('session-menu-button');
    const navMobileMenu = document.getElementById('nav-mobile-menu');
    const sessionMobileMenu = document.getElementById('session-mobile-menu');

    if (navMenuButton && sessionMenuButton && navMobileMenu && sessionMobileMenu) {
        const handleMenuClick = (menu) => (event) => {
            toggleMenu(menu);
            event.stopPropagation();
        };

        navMenuButton.addEventListener('click', handleMenuClick(navMobileMenu));
        sessionMenuButton.addEventListener('click', handleMenuClick(sessionMobileMenu));

        document.addEventListener('click', () => {
            closeMenu(navMobileMenu);
            closeMenu(sessionMobileMenu);
        });
    }
}

function toggleMenu(menu) {
    menu.classList.toggle('hidden');
}

function closeMenu(menu) {
    menu.classList.add('hidden');
}

// Manejo de monedas
function initializeCurrencyHandlers() {
    const amountInputs = [document.getElementById("amount1"), document.getElementById("amount2")];
    amountInputs.forEach(input => {
        if (input) {
            input.addEventListener('input', (event) => formatInput(event.target));
            input.addEventListener('keydown', restrictInput);
            input.addEventListener('blur', () => formatInput(input));
        }
    });
}

function formatInput(input) {
    const rawValue = input.value.replace(/\./g, '').replace(/\D/g, '');
    input.value = formatWithThousandsSeparator(rawValue);
}

function restrictInput(event) {
    const allowedKeys = ["Backspace", "ArrowLeft", "ArrowRight", "Delete", "Tab"];
    if (!/^[0-9]$/.test(event.key) && !allowedKeys.includes(event.key)) {
        event.preventDefault();
    }
}

function formatWithThousandsSeparator(value) {
    return value.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// Marcar la opción activa en el menú
function setActiveLink(menuId) {
    const links = document.querySelectorAll(`${menuId} a`);
    const currentPath = window.location.pathname;
    links.forEach(link => {
        link.classList.toggle('selected', link.getAttribute('href') === currentPath);
    });
}

// Cargar divisas y manejar íconos
function loadCurrencies() {
    const proxyUrl = 'https://corsproxy.io/?';
    const targetUrl = 'https://cambiosorion.cl/data/obtener_divisas.php';

    fetch(proxyUrl + targetUrl)
        .then(response => response.json())
        .then(data => handleCurrencyData(data.contents ? JSON.parse(data.contents) : data))
        .catch(error => console.error('Error al cargar las divisas:', error));
}

function handleCurrencyData(data) {
    if (!Array.isArray(data)) {
        console.error("Formato de datos inesperado:", data);
        return;
    }

    const dropdown1 = document.getElementById("dropdown1");
    const dropdown2 = document.getElementById("dropdown2");
    [dropdown1, dropdown2].forEach(dropdown => dropdown && (dropdown.innerHTML = ''));

    data.forEach(divisa => {
        const { nombre, icono_circular, compra, venta } = divisa;
        exchangeRates[nombre] = { compra: parseFloat(compra), venta: parseFloat(venta), icono: icono_circular };
        preloadIcon(icono_circular);

        [dropdown1, dropdown2].forEach(dropdown => {
            const option = document.createElement("div");
            option.innerHTML = `<img src="${icono_circular}" alt="${nombre}" class="w-6 h-6 mr-2"> ${nombre}`;
            option.className = "p-2 hover:bg-gray-100 cursor-pointer";
            option.onclick = () => setCurrency(nombre, dropdown.id);
            dropdown.appendChild(option);
        });
    });

    fillCurrencyTable();
}

function preloadIcon(iconUrl) {
    if (!iconsLoaded[iconUrl]) {
        const img = new Image();
        img.onload = () => (iconsLoaded[iconUrl] = true);
        img.onerror = () => console.error(`No se pudo cargar el ícono: ${iconUrl}`);
        img.src = iconUrl;
    }
}
