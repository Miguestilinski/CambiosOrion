document.addEventListener('DOMContentLoaded', () => {
    console.log("Página cargada, iniciando verificación de sesión...");
    checkSession();
    setupEventListeners();
    initializePage();
    setActiveLink('#nav-menu');
    setActiveLink('#session-menu');
});

// Comprueba si el usuario tiene una sesión activa
function checkSession() {
    console.log("Enviando solicitud para verificar la sesión...");
    fetch('https://cambiosorion.cl/data/iniciar_sesion.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkSession: true })
    })
    .then(response => {
        console.log("Respuesta recibida del servidor.");
        return response.json();
    })
    .then(data => {
        console.log("Datos de la sesión devueltos por el servidor:", data);

        if (data.success) {
            console.log("Sesión activa para el usuario:", data.user);
            localStorage.setItem('sessionActive', 'true');
            toggleUI(true, data.user, data.email);
        } else {
            console.log("No se encontró una sesión activa.");
            localStorage.removeItem('sessionActive');
            toggleUI(false);
        }
    })
    .catch(error => console.error("Error verificando la sesión", error));
}

function toggleUI(isLoggedIn, user = '', email = '') {
    console.log("Ejecutando toggleUI con parámetros:", isLoggedIn, user, email);
    const guestActions = document.getElementById('guest-actions');
    const userActions = document.getElementById('user-actions');
    
    if (isLoggedIn) {
        console.log("Configurando la UI para el estado de sesión activa.");
        guestActions?.classList.add('hidden');
        userActions?.classList.remove('hidden');
        document.getElementById('user-name').textContent = user;
        document.getElementById('user-email').textContent = email;
    } else {
        console.log("Configurando la UI para el estado de sesión inactiva.");
        userActions?.classList.add('hidden');
        guestActions?.classList.remove('hidden');
    }
}

// Configurar eventos de clic para la sesión
function setupEventListeners() {
    console.log("Configurando los listeners de eventos...");
    const loginButton = document.getElementById('login-button');
    const logoutButton = document.getElementById('logout-button');

    if (loginButton) {
        console.log("Configurando evento para el botón de inicio de sesión...");
        loginButton.addEventListener('click', login);
    }

    if (logoutButton) {
        console.log("Configurando evento para el botón de cierre de sesión...");
        logoutButton.addEventListener('click', logout);
    }

    const navMenuButton = document.getElementById('nav-menu-button');
    const sessionMenuButton = document.getElementById('session-menu-button');
    const navMobileMenu = document.getElementById('nav-mobile-menu');
    const sessionMobileMenu = document.getElementById('session-mobile-menu');

    if (navMenuButton && sessionMenuButton && navMobileMenu && sessionMobileMenu) {
        console.log("Configurando eventos para el menú móvil...");
        navMenuButton.addEventListener('click', () => {
            console.log("Menú de navegación móvil abierto/cerrado...");
            toggleMenu(navMobileMenu);
            if (sessionMobileMenu && sessionMobileMenu.style.display === 'block') {
                closeMenu(sessionMobileMenu);
            }
        });

        sessionMenuButton.addEventListener('click', () => {
            console.log("Menú de sesión móvil abierto/cerrado...");
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
        console.log(`Menú ${menu.style.display}`);
    }
}


// Cerrar un menú específico
function closeMenu(menu) {
    if (menu) {
        menu.style.display = 'none';
        console.log("Menú cerrado.");
    }
}

function setActiveLink(menuId) {
    console.log(`Configurando enlace activo para el menú: ${menuId}`);
    const links = document.querySelectorAll(`${menuId} a`);
    const currentPath = window.location.pathname;
    links.forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('selected');
            console.log(`Enlace seleccionado: ${link.getAttribute('href')}`);
        } else {
            link.classList.remove('selected');
        }
    });
}

// Cerrar sesión
function logout() {
    console.log("Cerrando sesión...");
    localStorage.removeItem('sessionActive');
    checkSession();
    window.location.reload();
}

// Función principal para configurar la inicialización de la página
function initializePage() {
    console.log("Inicializando la configuración de navegación de la página.");
    setActiveLink('#nav-menu');
    setActiveLink('#session-menu');
}
