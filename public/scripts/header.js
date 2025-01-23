let guestActions, userActions;

document.addEventListener('DOMContentLoaded', function() {
    checkSession();
    setupEventListeners();
    initializePage();
});  
  
// Configurar eventos de clic para la sesión
function setupEventListeners() {
    const logoutButtonMobile = document.getElementById('logout-button-mobile');
    const logoutButtonMenu = document.getElementById('logout-button');

    if (logoutButtonMobile) {
        logoutButtonMobile.addEventListener('click', logout);
    }

    if (logoutButtonMenu) {
        logoutButtonMenu.addEventListener('click', logout);
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

    // Añadir el cierre de los menús móviles si se hace clic fuera de ellos
    document.addEventListener('click', function (event) {
        const isClickInsideNavMenu = navMobileMenu && navMobileMenu.contains(event.target);
        const isClickInsideSessionMenu = sessionMobileMenu && sessionMobileMenu.contains(event.target);
        const isClickInsideMenuButton = navMenuButton && navMenuButton.contains(event.target) || sessionMenuButton && sessionMenuButton.contains(event.target);

        // Si el clic no está dentro de los menús ni de los botones de menú, cerramos los menús
        if (!isClickInsideNavMenu && !isClickInsideSessionMenu && !isClickInsideMenuButton) {
            closeMenu(navMobileMenu);
            closeMenu(sessionMobileMenu);
        }
    });

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
    fetch('https://cambiosorion.cl/data/session_status.php')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Session Status Data:', data);
            if (data.isAuthenticated) {
                showUserUI(data);
            } else {
                showGuestUI();
            }
        })
        .catch(error => console.error('Error al verificar la sesión:', error));
}

// Mostrar la interfaz de usuario para usuarios autenticados
function showUserUI(data) {
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
    const menuCliente = document.getElementById('menu-cliente');
    const menuAdmin = document.getElementById('menu-admin');
    if (dropdownInformation) {
        dropdownInformation.querySelector('div:first-child').innerHTML = `
            <div>${data.nombre}</div>
            <div class="mail font-medium truncate">${data.correo}</div>
            <div class="text-sm text-gray-500">${data.tipo}</div>
        `;
    }

    if (userActionsMobile) {
        userActionsMobile.querySelector('div:first-child').innerHTML = `
            <div>${data.nombre}</div>
            <div class="mail font-medium truncate">${data.correo}</div>
            <div class="text-sm text-gray-500">${data.tipo}</div>
        `;
    }

    if (data.tipo === 'administrativo') {
        // Mostrar el menú administrativo
        menuCliente.style.display = 'none';
        menuAdmin.style.display = 'block';
    } else if (data.tipo === 'cliente'){
        // Mostrar el menú cliente
        menuCliente.style.display = 'block';
        menuAdmin.style.display = 'none';
    }

    // Actualiza la información en la versión móvil
    const userNameMobile = document.querySelector('#user-actions-mobile #user-name');
    const userEmailMobile = document.querySelector('#user-actions-mobile #user-email');
    if (userNameMobile && userEmailMobile) {
        userNameMobile.textContent = data.nombre;
        userEmailMobile.textContent = data.correo;
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
    console.log('Intentando cerrar sesión...');
    
    fetch('/data/cerrar_sesion.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        console.log('Respuesta recibida:', response);
        if (!response.ok) {
            throw new Error('Error en la solicitud');
        }
        return response.json();
    })
    .then(data => {
        console.log('Datos devueltos desde el servidor:', data);

        if (data.message === 'Sesión cerrada') {
            console.log('Redirigiendo a index...');
            window.location.href = 'https://cambiosorion.cl/login';
        } else {
            console.error('No se pudo cerrar la sesión correctamente');
        }
    })
    .catch(error => {
        console.error('Error al enviar la solicitud:', error);
    });
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