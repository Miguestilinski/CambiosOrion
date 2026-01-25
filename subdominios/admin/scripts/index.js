import { initAdminHeader } from './header.js';

document.addEventListener('DOMContentLoaded', async () => {
    
    // 1. Inicializar Header Global
    // Esto carga sesión, sidebar, roles, badge, logout, menú móvil, etc.
    const sessionData = await initAdminHeader('dashboard');

    // 2. Lógica específica del Dashboard (Cuerpo de la página)
    if (sessionData.isAuthenticated) {
        updateDashboardWelcome(sessionData);
    }
});

function updateDashboardWelcome(data) {
    const welcomeName = document.getElementById('welcome-name');
    const welcomeRole = document.getElementById('welcome-role');

    if (welcomeName || welcomeRole) {
        const primerNombre = (data.nombre || 'Usuario').split(' ')[0];
        const rolFormat = capitalize(data.rol || '');

        if (welcomeName) welcomeName.textContent = primerNombre;
        if (welcomeRole) welcomeRole.textContent = rolFormat;
    }
}

function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}