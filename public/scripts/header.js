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

function setupEventListeners() {
    console.log("Configurando event listeners...");
    const loginButton = document.getElementById('login-button');
    const logoutButton = document.getElementById('logout-button');

    if (loginButton) loginButton.addEventListener('click', () => console.log('Botón de inicio de sesión presionado'));
    if (logoutButton) logoutButton.addEventListener('click', () => console.log('Botón de cierre de sesión presionado'));
}

// Función principal para configurar la inicialización de la página
function initializePage() {
    console.log("Inicializando la configuración de navegación de la página.");
    setActiveLink('#nav-menu');
    setActiveLink('#session-menu');
}
