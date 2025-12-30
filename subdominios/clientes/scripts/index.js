document.addEventListener('DOMContentLoaded', async () => {
    await loadSidebar('index');
    
    const user = await checkSession();
    if (!user) return;

    // --- CORRECCIÓN DE TEXTO ---
    // Aplicamos el fixEncoding al nombre que viene del servidor
    const nombreCompleto = fixEncoding(user.nombre);
    const primerNombre = nombreCompleto.split(' ')[0];

    // Referencias Dashboard
    const welcomeName = document.getElementById('welcome-name');
    const welcomeRole = document.getElementById('welcome-role');
    const userNameDashboard = document.getElementById('user-name-dashboard'); // Si existe en index
    const roleType = document.getElementById('role-type');

    if (welcomeName) welcomeName.textContent = primerNombre;
    if (welcomeRole) welcomeRole.textContent = user.tipo_cliente === 'empresa' ? 'Empresa Verificada' : 'Usuario Verificado';
    
    // Header (Refuerzo por si header.js no lo ha cargado aún)
    const headerName = document.getElementById('header-user-name');
    const dropdownEmail = document.getElementById('dropdown-user-email');
    if (headerName) headerName.textContent = primerNombre;
    if (dropdownEmail) dropdownEmail.textContent = user.correo;
});

// Función Helper para arreglar caracteres (Ñ -> MuÃ±oz)
function fixEncoding(str) {
    if (!str) return "";
    try { return decodeURIComponent(escape(str)); } catch (e) { return str; }
}

async function loadSidebar(activePageId) {
    const container = document.getElementById('sidebar-container');
    if (!container) return;
    try {
        const response = await fetch('sidebar.html');
        container.innerHTML = await response.text();
        const activeLink = container.querySelector(`a[data-page="${activePageId}"]`);
        if (activeLink) {
            activeLink.classList.remove('text-gray-600');
            activeLink.classList.add('bg-blue-50', 'text-blue-700', 'font-bold');
            const icon = activeLink.querySelector('svg');
            if(icon) icon.classList.add('text-blue-700');
        }
    } catch (e) { console.error("Error sidebar", e); }
}

async function checkSession() {
    try {
        const res = await fetch("https://cambiosorion.cl/data/session_status_clientes.php", { credentials: "include" });
        const data = await res.json();
        if (!data.isAuthenticated) { window.location.href = 'https://cambiosorion.cl/login'; return null; }
        return data;
    } catch (e) { return null; }
}