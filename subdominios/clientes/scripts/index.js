document.addEventListener('DOMContentLoaded', async () => {
    // 1. Cargar Sidebar y marcar 'index' como activo
    await loadSidebar('index');

    // 2. Validar Sesión y Obtener Datos
    const user = await checkSession();
    if (!user) return; // checkSession redirige si falla

    // 3. Lógica específica del Dashboard (Saludo y Roles)
    const welcomeName = document.getElementById('welcome-name');
    const welcomeRole = document.getElementById('welcome-role');
    const userNameDashboard = document.getElementById('user-name-dashboard');
    const roleType = document.getElementById('role-type');

    // Procesar nombre (Primer nombre para saludos)
    const primerNombre = user.nombre.split(' ')[0];

    // Actualizar Banner de Bienvenida
    if (welcomeName) welcomeName.textContent = primerNombre;
    if (welcomeRole) welcomeRole.textContent = user.tipo_cliente === 'empresa' ? 'Empresa Verificada' : 'Usuario Verificado';
    
    // Actualizar Panel de Datos (si existe en el DOM)
    if (userNameDashboard) userNameDashboard.textContent = user.nombre; 
    if (roleType) roleType.textContent = user.tipo_cliente === 'empresa' ? 'Cuenta Empresa' : 'Cuenta Personal';

    // 4. Actualizar Header (Nombre y Correo)
    // Esto asegura que el nombre aparezca arriba a la derecha
    const headerName = document.getElementById('header-user-name');
    const dropdownEmail = document.getElementById('dropdown-user-email');

    if (headerName) headerName.textContent = primerNombre;
    if (dropdownEmail) dropdownEmail.textContent = user.correo;
});

// --- Funciones de Soporte ---

async function loadSidebar(activePageId) {
    const container = document.getElementById('sidebar-container');
    if (!container) return;
    try {
        const response = await fetch('sidebar.html');
        if (!response.ok) throw new Error('No se pudo cargar sidebar.html');
        container.innerHTML = await response.text();
        
        // Marcar activo (Estilo para Sidebar Blanco)
        const activeLink = container.querySelector(`a[data-page="${activePageId}"]`);
        if (activeLink) {
            activeLink.classList.remove('text-gray-600');
            activeLink.classList.add('bg-blue-50', 'text-blue-700', 'font-bold');
            const icon = activeLink.querySelector('svg');
            if(icon) icon.classList.add('text-blue-700');
        }
    } catch (e) { console.error("Error cargando sidebar", e); }
}

async function checkSession() {
    try {
        const res = await fetch("https://cambiosorion.cl/data/session_status_clientes.php", { credentials: "include" });
        const data = await res.json();
        if (!data.isAuthenticated) {
            window.location.href = 'https://cambiosorion.cl/login';
            return null;
        }
        return data;
    } catch (e) {
        console.error("Error sesión", e);
        return null;
    }
}