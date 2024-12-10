document.addEventListener('DOMContentLoaded', () => {
    console.log("Página cargada, iniciando verificación de sesión...");
    checkSession();
    setupEventListeners();
    initializePage();
});

// Comprueba si el usuario tiene una sesión activa
function checkSession() {
    console.log("Enviando solicitud para verificar la sesión...");

    fetch('https://cambiosorion.cl/data/iniciar_sesion.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verificar: true }) // Señal mínima para verificar la sesión
    })
    .then(response => response.json())
    .then(data => {
        console.log("Datos devueltos por el servidor:", data);

        if (data.success) {
            localStorage.setItem('sessionActive', 'true');
            toggleUI(true, data.user?.name, data.user?.email);
        } else {
            localStorage.removeItem('sessionActive');
            toggleUI(false);
        }
    })
    .catch(error => console.error("Error al verificar la sesión", error));
}

// Función para alternar la visibilidad de la interfaz según el estado de la sesión
function toggleUI(isLoggedIn, user = '', email = '') {
    const guestActions = document.getElementById('guest-actions');
    const userActions = document.getElementById('user-actions');

    if (isLoggedIn) {
        guestActions?.classList.add('hidden');
        userActions?.classList.remove('hidden');
        document.getElementById('user-name').textContent = user || '';
        document.getElementById('user-email').textContent = email || '';
    } else {
        userActions?.classList.add('hidden');
        guestActions?.classList.remove('hidden');
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

// Función principal para configurar la inicialización de la página
function initializePage() {
    setActiveLink('#nav-menu');
    setActiveLink('#session-menu');
}