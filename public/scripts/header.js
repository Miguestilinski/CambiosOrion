document.addEventListener('DOMContentLoaded', () => {
    checkSession();
    setupEventListeners();
    initializePage();
    setActiveLink('#nav-menu');
    setActiveLink('#session-menu');
});

// Comprueba si el usuario tiene una sesión activa
function checkSession() {
    fetch('https://cambiosorion.cl/data/iniciar_sesion.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkSession: true })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            localStorage.setItem('sessionActive', 'true');
            toggleUI(true, data.user, data.email);
        } else {
            localStorage.removeItem('sessionActive');
            toggleUI(false);
        }
    })
    .catch(error => console.error("Error verificando la sesión", error));
}

function toggleUI(isLoggedIn, user = '', email = '') {
    const guestActions = document.getElementById('guest-actions');
    const userActions = document.getElementById('user-actions');
    
    if (isLoggedIn) {
        guestActions?.classList.add('hidden');
        userActions?.classList.remove('hidden');
        document.getElementById('user-name').textContent = user;
        document.getElementById('user-email').textContent = email;
    } else {
        userActions?.classList.add('hidden');
        guestActions?.classList.remove('hidden');
    }
}

// Configurar eventos de clic para la sesión
function setupEventListeners() {
    const loginButton = document.getElementById('login-button');
    const logoutButton = document.getElementById('logout-button');

    if (loginButton) loginButton.addEventListener('click', login);
    if (logoutButton) logoutButton.addEventListener('click', logout);

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
    const rut = document.getElementById('input-rut').value;
    const email = document.getElementById('input-email').value;
    const password = document.getElementById('input-password').value;
    const tipoUsuario = document.querySelector('input[name="tipoUsuario"]:checked').value;

    fetch('/iniciar_sesion.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rut, email, password, tipoUsuario })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log('Inicio de sesión exitoso');
            localStorage.setItem('sessionActive', 'true');
            checkSession();
            window.location.reload();
        } else {
            alert(data.message);
        }
    })
    .catch(error => console.error('Error al enviar datos de inicio de sesión:', error));
}

// Cerrar sesión
function logout() {
    localStorage.removeItem('sessionActive');
    checkSession();
    window.location.reload();
}

// Función principal para configurar la inicialización de la página
function initializePage() {
    setActiveLink('#nav-menu');
    setActiveLink('#session-menu');
}
