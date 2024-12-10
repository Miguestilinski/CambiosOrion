document.addEventListener('DOMContentLoaded', () => {
    checkSession();
    setupEventListeners();
    initializePage();
    setActiveLink('#nav-menu');
    setActiveLink('#session-menu');
});

// Comprueba si el usuario tiene una sesión activa
function checkSession() {
    const sessionActive = localStorage.getItem('sessionActive');
    const guestActions = document.getElementById('guest-actions');
    const userActions = document.getElementById('user-actions');

    if (sessionActive) {
        // Ocultar guest-actions y mostrar user-actions
        if (guestActions) guestActions.classList.add('hidden');
        if (userActions) userActions.classList.remove('hidden');
        
        // Completar información del usuario en el DOM si es necesario
        const userNameElement = document.getElementById('user-name');
        const userEmailElement = document.getElementById('user-email');
        if (userNameElement && userEmailElement) {
            userNameElement.textContent = 'Usuario';
            userEmailElement.textContent = 'correo@ejemplo.com';
        }
    } else {
        // Mostrar guest-actions y ocultar user-actions
        if (guestActions) guestActions.classList.remove('hidden');
        if (userActions) userActions.classList.add('hidden');
    }
}

// Configurar eventos de clic para la sesión
function setupEventListeners() {
    const loginButton = document.getElementById('login-button');
    const logoutButton = document.getElementById('logout-button');

    if (loginButton) {
        loginButton.addEventListener('click', login);
    }

    if (logoutButton) {
        logoutButton.addEventListener('click', logout);
    }

    // Eventos para el menú móvil
    const navMenuButton = document.getElementById('nav-menu-button');
    const sessionMenuButton = document.getElementById('session-menu-button');
    const navMobileMenu = document.getElementById('nav-mobile-menu');
    const sessionMobileMenu = document.getElementById('session-mobile-menu');

    if (navMenuButton && sessionMenuButton && navMobileMenu && sessionMobileMenu) {
        navMenuButton.addEventListener('click', () => {
            toggleMenu(navMobileMenu);
            if (sessionMobileMenu && sessionMobileMenu.style.display === 'block') {
                closeMenu(sessionMobileMenu);
            }
        });

        sessionMenuButton.addEventListener('click', () => {
            toggleMenu(sessionMobileMenu);
            if (navMobileMenu && navMobileMenu.style.display === 'block') {
                closeMenu(navMobileMenu);
            }
        });
    }
}

// Alternar la visibilidad de los menús
function toggleMenu(menu) {
    if (menu) {
        menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
    }
}

// Cerrar un menú específico
function closeMenu(menu) {
    if (menu) {
        menu.style.display = 'none';
    }
}

// Marcar los enlaces activos
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

// Simulación de inicio de sesión
function login() {
    localStorage.setItem('sessionActive', 'true');
    checkSession();
    window.location.reload();
}

// Cerrar sesión
function logout() {
    localStorage.removeItem('sessionActive');
    checkSession();
    window.location.href = '/';
}

// Función principal para configurar la inicialización de la página
function initializePage() {
    setActiveLink('#nav-menu');
    setActiveLink('#session-menu');
}
