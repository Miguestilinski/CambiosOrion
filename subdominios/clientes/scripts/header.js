let guestActions, userActions;

document.addEventListener('DOMContentLoaded', function() {
    checkSession();
    setupEventListeners();
    initializePage();
});

// --- FUNCIÓN DE CORRECCIÓN DE CARACTERES (Ñ / Tildes) ---
function fixEncoding(str) {
    if (!str) return "";
    try {
        // Si el texto viene como "MuÃ±oz", esto lo convierte a "Muñoz"
        return decodeURIComponent(escape(str));
    } catch (e) {
        // Si ya estaba bien o falla, devuelve el original
        return str;
    }
} 
  
// Configurar eventos de clic para la sesión
function setupEventListeners() {
    const logoutButtonMobile = document.getElementById('logout-button-mobile');
    const logoutButtonMenu = document.getElementById('logout-button');

    if (logoutButtonMobile) logoutButtonMobile.addEventListener('click', logout);
    if (logoutButtonMenu) logoutButtonMenu.addEventListener('click', logout);

    const navMenuButton = document.getElementById('nav-menu-button');
    const mobileMenu = document.getElementById('nav-mobile-menu');
    
    // Toggle Menú Móvil
    if (navMenuButton && mobileMenu) {
        navMenuButton.addEventListener('click', (e) => {
            e.stopPropagation();
            mobileMenu.classList.toggle('hidden');
        });
        document.addEventListener('click', (e) => {
            if (!navMenuButton.contains(e.target) && !mobileMenu.contains(e.target)) {
                mobileMenu.classList.add('hidden');
            }
        });
    }

    // Toggle Perfil Desktop
    const profileBtn = document.getElementById('profile-menu-button');
    const dropdown = document.getElementById('dropdownInformation');
    if (profileBtn && dropdown) {
        profileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('hidden');
        });
        document.addEventListener('click', (e) => {
            if (!profileBtn.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.classList.add('hidden');
            }
        });
    }
}

// Función para comprobar el estado de sesión con AJAX
function checkSession() {
    fetch('https://cambiosorion.cl/data/session_status_clientes.php', {
            method: 'GET',
            credentials: 'include'
        })
        .then(response => response.json())
        .then(data => {
            if (data.isAuthenticated) {
                showUserUI(data);
            } else {
                showGuestUI();
            }
        })
        .catch(error => console.error('Error sesión:', error));
}

// Mostrar la interfaz de usuario para usuarios autenticados
function showUserUI(data) {
    const userActions = document.getElementById('user-actions');
    const guestActions = document.getElementById('guest-actions');
    
    if (userActions) userActions.style.display = 'block';
    if (guestActions) guestActions.style.display = 'none';

    const nombreFixed = fixEncoding(data.nombre);

    // 1. Header Desktop (Botón Redondo)
    const headerName = document.getElementById('header-user-name');
    if (headerName) headerName.textContent = nombreFixed.split(' ')[0]; // Solo primer nombre

    // 2. Dropdown (Nombre Completo)
    const dropdownInfo = document.getElementById('dropdownInformation');
    if (dropdownInfo) {
        const nameEl = dropdownInfo.querySelector('.px-4 > p.text-sm'); // Busca el párrafo del nombre
        if (nameEl) nameEl.textContent = data.correo; // Usamos correo aquí según tu diseño
        dropdownInfo.querySelector('div:first-child').innerHTML = `
            <div>${data.nombre}</div>
            <div class="mail font-medium truncate">${data.correo}</div>
            <div class="text-sm text-gray-500">${data.tipo}</div>
        `;
    }
}
  
// Mostrar la interfaz de usuario para invitados
function showGuestUI() {
    const userActions = document.getElementById('user-actions');
    const guestActions = document.getElementById('guest-actions');
    if (userActions) userActions.style.display = 'none';
    if (guestActions) guestActions.style.display = 'block';
}

function logout() {
    fetch('https://cambiosorion.cl/data/cerrar_sesion.php', { method: 'POST' })
    .then(() => window.location.href = 'https://cambiosorion.cl/login');
}

// Función principal para configurar la inicialización de la página
function initializePage() {
    setActiveLink('#nav-menu');
    setActiveLink('#session-menu');
}
