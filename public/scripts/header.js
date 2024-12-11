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

    const profileMenuButton = document.getElementById('profile-menu-button');
    if (profileMenuButton) {
        profileMenuButton.addEventListener('click', toggleHeaderDropdown);
    }
    document.addEventListener('click', function (event) {
        const dropdown = document.getElementById('dropdownInformation');

        // Cerrar si el clic está fuera del menú y del botón
        if (
            dropdown &&
            !dropdown.contains(event.target) &&
            !event.target.closest('#profile-menu-button')
        ) {
            dropdown.classList.add('hidden');
        }
    });
}

// Función para comprobar el estado de sesión con AJAX
function checkSession() {
    fetch('/data/session_status.php')
        .then(response => response.json())
        .then(data => {
            console.log('Session Status Data:', data);
            if (data.isAuthenticated) {
                showUserUI(data); // Pasa los datos del usuario a la función
            } else {
                showGuestUI();
            }
        })
        .catch(error => console.error('Error al verificar la sesión:', error));
}

// Mostrar la interfaz de usuario para usuarios autenticados
function showUserUI() {
    const userActions = document.getElementById('user-actions');
    const userActionsMobile = document.getElementById('user-actions-mobile');
    const guestActions = document.getElementById('guest-actions');
    const guestActionsMobile = document.getElementById('guest-actions-mobile');
  
    if (userActions && guestActions) {
      userActions.style.display = 'block';
      userActionsMobile.style.display = 'block';
      guestActions.style.display = 'none';
      guestActionsMobile.style.display = 'none';
    }

    // Actualiza el dropdown con los datos del usuario
    const dropdownInformation = document.getElementById('dropdownInformation');
    if (dropdownInformation) {
        dropdownInformation.querySelector('div:first-child').innerHTML = `
            <div>${data.name}</div>
            <div class="font-medium truncate">${data.email}</div>
        `;
    }
}
  
// Mostrar la interfaz de usuario para invitados
function showGuestUI() {
    const userActions = document.getElementById('user-actions');
    const userActionsMobile = document.getElementById('user-actions-mobile');
    const guestActions = document.getElementById('guest-actions');
    const guestActionsMobile = document.getElementById('guest-actions-mobile');
  
    if (userActions && guestActions) {
      userActions.style.display = 'none';
      userActionsMobile.style.display = 'none';
      guestActions.style.display = 'block';
      guestActionsMobile.style.display = 'block';
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

// Mostrar el menú desplegable en escritorio
function toggleHeaderDropdown(event) {
    event.stopPropagation(); // Prevenir propagación del evento
    const dropdown = document.getElementById('dropdownInformation');

    if (dropdown) {
        dropdown.classList.toggle('hidden');
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