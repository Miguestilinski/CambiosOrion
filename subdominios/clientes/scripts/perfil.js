document.addEventListener('DOMContentLoaded', async () => {
    await loadSidebar('perfil');
    
    const user = await checkSession();
    if (!user) return;

    // Llenar formulario
    document.getElementById('user-name-dashboard').textContent = user.nombre;
    document.getElementById('role-type').textContent = user.tipo_cliente === 'empresa' ? 'Empresa' : 'Persona';
    document.getElementById('email').value = user.correo;
    
    const rutContainer = document.getElementById('rut-group');
    const rutInput = document.getElementById('rut');
    if (user.rut) {
        rutContainer.classList.remove('hidden');
        rutInput.textContent = user.rut;
    }

    // Listener para guardar cambios (Aquí agregarías tu fetch a update_profile.php)
    const btnSave = document.querySelector('#personal-info-form button');
    if(btnSave) {
        btnSave.addEventListener('click', (e) => {
            e.preventDefault();
            alert('Funcionalidad de actualización en desarrollo.');
        });
    }
});

// Incluir las mismas funciones loadSidebar y checkSession aquí abajo 
// (O crear un archivo utils.js pequeño e importarlo si prefieres no repetir código)
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