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
    
    const rut = localStorage.getItem('rut') || '';
    const email = localStorage.getItem('email') || '';
    const tipoUsuario = localStorage.getItem('tipoUsuario') || '';

    console.log("Datos de sesión para verificar:", { rut, email, tipoUsuario });

    fetch('https://cambiosorion.cl/data/iniciar_sesion.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rut, email, tipoUsuario })
    })
    .then(response => response.json())
    .then(data => {
        console.log("Datos devueltos por el servidor:", data);

        if (data.success) {
            localStorage.setItem('sessionActive', 'true');
            toggleUI(true, data.user.name, data.user.email);
        } else {
            localStorage.removeItem('sessionActive');
            toggleUI(false);
        }
    })
    .catch(error => console.error("Error al verificar la sesión", error));
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
    const logoutButton = document.getElementById('logout-button');
    
    if (logoutButton) {
        logoutButton.addEventListener('click', logout);
    }
}

// Cerrar sesión
function logout() {
    console.log("Cerrando sesión...");
    localStorage.clear();
    location.reload();
}

// Función principal para configurar la inicialización de la página
function initializePage() {
    console.log("Inicializando la configuración de navegación de la página.");
    setActiveLink('#nav-menu');
    setActiveLink('#session-menu');
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
