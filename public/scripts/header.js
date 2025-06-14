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

    // --- NUEVO: Manejo botón y dropdown de notificaciones ---
    const notificationsButton = document.getElementById('notifications-button');
    const notificationsDropdown = document.getElementById('notifications-dropdown');

    if (notificationsButton && notificationsDropdown) {
        notificationsButton.addEventListener('click', (e) => {
            e.stopPropagation(); // para que no cierre inmediatamente con el document click
            const isHidden = notificationsDropdown.classList.contains('hidden');
            // Cerrar dropdown de perfil si está abierto
            const dropdownInformation = document.getElementById('dropdownInformation');
            if (dropdownInformation) dropdownInformation.classList.add('hidden');

            if (isHidden) {
                notificationsDropdown.classList.remove('hidden');
            } else {
                notificationsDropdown.classList.add('hidden');
            }
        });

        // Cerrar dropdown de notificaciones si clic fuera
        document.addEventListener('click', (event) => {
            if (
                !notificationsDropdown.contains(event.target) &&
                event.target !== notificationsButton
            ) {
                notificationsDropdown.classList.add('hidden');
            }
        });
    }
}

// Función para comprobar el estado de sesión con AJAX
function checkSession() {
    fetch('https://cambiosorion.cl/data/session_status.php', {
            method: 'GET',
            credentials: 'include' // Asegura que las cookies de sesión sean enviadas
        })
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
    console.log('User UI');
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
        console.log('User UI: Administrativo');
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
        console.log('Datos admin cambiados');
        userNameMobile.textContent = data.nombre;
        userEmailMobile.textContent = data.correo;
    }

    const notifications = [];

    console.log('Evaluando notificaciones con tipo:', data.tipo, 'y traspasos:', data.traspasos_pendientes);

    const traspasos = parseInt(data.traspasos_pendientes);
    if (
        data.tipo &&
        data.tipo.trim().toLowerCase() === 'administrativo' &&
        !isNaN(traspasos) &&
        traspasos > 0
    ) {
        notifications.push({
            text: `Traspasos pendientes (${traspasos})`,
            url: 'https://caja.cambiosorion.cl/traspasos'
        });
    }

    updateNotificationsUI(notifications);
}

// --- NUEVO: Mostrar notificaciones de traspasos en botón y dropdown ---
function updateNotificationsUI(notifications = []) {
    const notificationsBadge = document.getElementById('notifications-badge');
    const notificationsList = document.getElementById('notifications-list');

    console.log('🔔 updateNotificationsUI() - Recibidas:', notifications);
    
    if (!notifications.length) {
        if (notificationsBadge) notificationsBadge.classList.add('hidden');
        if (notificationsList) notificationsList.innerHTML = '<li class="px-4 py-2">No hay notificaciones</li>';
    } else {
        if (notificationsBadge) {
            notificationsBadge.textContent = notifications.length;
            console.log('✅ Mostrando badge:', notifications.length);
            notificationsBadge.classList.remove('hidden');
        } else {
            console.warn('⚠️ notificationsBadge no encontrado');
        }
        if (notificationsList) {
            notificationsList.innerHTML = '';
            notifications.forEach(n => {
                const li = document.createElement('li');
                li.className = 'px-4 py-2 hover:bg-gray-100 cursor-pointer';
                li.textContent = n.text;
                if (n.url) {
                    li.addEventListener('click', () => {
                        window.location.href = n.url;
                    });
                }
                notificationsList.appendChild(li);
            });
        } else {
            console.warn('⚠️ notificationsList no encontrado');
        }
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
    
    fetch('https://cambiosorion.cl/data/cerrar_sesion.php', {
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
