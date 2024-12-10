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
    
    // Capturar los datos de sesión desde el almacenamiento local si existen
    const rut = localStorage.getItem('rut') || '';
    const email = localStorage.getItem('email') || '';
    const tipoUsuario = localStorage.getItem('tipoUsuario') || '';
    const password = localStorage.getItem('password') || '';

    console.log("Enviando con estos datos para verificar la sesión: ", { rut, email, tipoUsuario, password });

    fetch('https://cambiosorion.cl/data/iniciar_sesion.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rut, email, tipoUsuario, password, checkSession: true })
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
}

// Función para enviar la solicitud de inicio de sesión
function login() {
    console.log("Intentando iniciar sesión...");
    
    const rut = document.getElementById('rut').value || '';
    const email = document.getElementById('email').value || '';
    const password = document.getElementById('password').value || '';
    const tipoUsuario = document.getElementById('tipoUsuario').value || '';

    console.log("Datos capturados en el formulario: ", { rut, email, password, tipoUsuario });

    if (!rut || !email || !password || !tipoUsuario) {
        console.log("Por favor, completa todos los campos.");
        alert("Por favor, completa todos los campos.");
        return;
    }

    fetch('https://cambiosorion.cl/data/iniciar_sesion.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rut, email, tipoUsuario, password, checkSession: false })
    })
    .then(response => response.json())
    .then(data => {
        console.log("Respuesta del servidor en el login:", data);

        if (data.success) {
            console.log("Inicio de sesión exitoso.");
            localStorage.setItem('sessionActive', 'true');
            localStorage.setItem('rut', rut);
            localStorage.setItem('email', email);
            localStorage.setItem('tipoUsuario', tipoUsuario);
            localStorage.setItem('password', password);

            toggleUI(true, data.user, email);
        } else {
            console.log("Error en el inicio de sesión.");
            alert(data.message || "Error en el inicio de sesión.");
        }
    })
    .catch(error => console.error("Error al enviar los datos de inicio de sesión", error));
}

// Cerrar sesión
function logout() {
    console.log("Cerrando sesión...");
    localStorage.removeItem('sessionActive');
    localStorage.removeItem('rut');
    localStorage.removeItem('email');
    localStorage.removeItem('tipoUsuario');
    localStorage.removeItem('password');
    checkSession();
    window.location.reload();
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
