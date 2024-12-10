document.addEventListener('DOMContentLoaded', () => {
    checkSession();
    setupEventListeners();
});

// Comprueba si el usuario tiene una sesión activa
function checkSession() {
    const sessionActive = localStorage.getItem('sessionActive');
    const guestActions = document.getElementById('guest-actions');
    const userActions = document.getElementById('user-actions');

    if (sessionActive) {
        // Mostrar la sección de usuario
        guestActions?.classList.add('hidden');
        userActions?.classList.remove('hidden');
        
        // Opcional: Completar información del usuario en el DOM si es necesario
        const userNameElement = document.getElementById('user-name');
        const userEmailElement = document.getElementById('user-email');
        if (userNameElement && userEmailElement) {
            userNameElement.textContent = 'Usuario'; // Aquí podrías agregar información dinámica
            userEmailElement.textContent = 'correo@ejemplo.com';
        }
    } else {
        // Mostrar la sección para invitados
        guestActions?.classList.remove('hidden');
        userActions?.classList.add('hidden');
    }
}

// Configurar eventos de clic
function setupEventListeners() {
    const loginButton = document.getElementById('login-button');
    const logoutButton = document.getElementById('logout-button');

    if (loginButton) {
        loginButton.addEventListener('click', login);
    }

    if (logoutButton) {
        logoutButton.addEventListener('click', logout);
    }
}

// Simulación de inicio de sesión
function login() {
    localStorage.setItem('sessionActive', 'true');
    checkSession();
    window.location.reload(); // Recarga la página para reflejar cambios
}

// Cerrar sesión
function logout() {
    localStorage.removeItem('sessionActive');
    checkSession();
    window.location.href = '/'; // Redirige a la página principal
}
