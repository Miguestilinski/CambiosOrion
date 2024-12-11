document.addEventListener('DOMContentLoaded', function() {
    checkSession();
    setupEventListeners();
    initializePage();
});  

const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.target.id) {
            console.log(`Cambio detectado en ${mutation.target.id}:`, mutation);
        }
    });
});

observer.observe(document.body, {
    attributes: true,
    attributeFilter: ['class', 'style'], // Limitar los atributos observados
    subtree: true,
});

// Comprueba si el usuario tiene una sesión activa
function checkSession() {
    const isLoggedIn = localStorage.getItem('sessionActive');
    console.log('Sesión activa:', isLoggedIn);
  
    if (isLoggedIn) {
      console.log("Sesión activa, mostrando vista de usuario.");
      toggleUI(true);
    } else {
      console.log("Sesión no activa, mostrando vista de invitado.");
      toggleUI(false);
    }
}
  
// Alternar UI en función del estado de la sesión
function toggleUI(isLoggedIn) {
    const guestActions = document.getElementById('guest-actions');
    const userActions = document.getElementById('user-actions');

    if (!guestActions || !userActions) {
        console.error('No se encontraron guestActions o userActions en el DOM');
        return;
    }

    if (isLoggedIn) {
        guestActions.classList.add('hidden');
        userActions.classList.remove('hidden');
    } else {
        guestActions.classList.remove('hidden');
        userActions.classList.add('hidden');
    }
}
  
// Configurar eventos de clic para la sesión
function setupEventListeners() {
    const logoutButton = document.getElementById('logout-button');

    if (logoutButton) {
        logoutButton.addEventListener('click', logout);
    }

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

// Función de logout para cerrar sesión
function logout() {
    console.log("Cerrando sesión...");
    localStorage.removeItem('sessionActive');
    checkSession(); // Actualiza la interfaz después de cerrar sesión
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