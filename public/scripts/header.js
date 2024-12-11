let guestActions, userActions;

document.addEventListener('DOMContentLoaded', function() {
    checkSession();
    setupEventListeners();
    initializePage();
});  
  
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

// Función para comprobar el estado de sesión con AJAX
function checkSession() {
    fetch('/data/session_status.php')
        .then(response => response.json())
        .then(data => {
            if (data.isAuthenticated) {
                showUserUI();
            } else {
                showGuestUI();
            }
        })
        .catch(error => console.error('Error al verificar la sesión:', error));
}

// Mostrar la interfaz de usuario para usuarios autenticados
function showUserUI() {
    const userActions = document.getElementById('user-actions');
    const guestActions = document.getElementById('guest-actions');
  
    if (userActions && guestActions) {
      userActions.style.display = 'block';
      guestActions.style.display = 'none';
    }
}

// Mostrar la interfaz de usuario para invitados
function showGuestUI() {
    const userActions = document.getElementById('user-actions');
    const guestActions = document.getElementById('guest-actions');
  
    if (userActions && guestActions) {
      userActions.style.display = 'none';
      guestActions.style.display = 'block';
    }
}
  
// Función para cerrar sesión con AJAX
function logout() {
    fetch('/data/cerrar_sesion.php', { method: 'POST' })
        .then(response => response.json())
        .then(data => {
            if (data.message === 'Sesión cerrada') {
                checkSession(); // Actualizar la UI después de cerrar sesión
            } else {
                console.error('No se pudo cerrar la sesión');
            }
        })
        .catch(error => console.error('Error:', error));
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