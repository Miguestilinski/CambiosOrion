document.addEventListener('DOMContentLoaded', async () => {
    // 1. Cargar Sidebar y marcar 'operaciones' como activo
    await loadSidebar('operaciones');

    // 2. Validar Sesión
    const user = await checkSession();
    if (!user) return;

    // 3. Lógica de la página Operaciones
    // Aquí conectarías con tu endpoint real, ej: fetch(`get_operaciones.php?id=${user.cliente_id}`)
    console.log("Cargando historial para el cliente:", user.nombre);
    
    // Ejemplo: Si quisieras mostrar un mensaje si no hay datos
    const tableBody = document.getElementById('operaciones-body');
    if(tableBody && tableBody.children.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="px-6 py-4 text-center text-sm text-gray-500">
                    No se encontraron operaciones recientes.
                </td>
            </tr>
        `;
    }
});

// --- Funciones Compartidas (Independientes) ---

async function loadSidebar(activePageId) {
    const container = document.getElementById('sidebar-container');
    if (!container) return;
    try {
        // Asegúrate de que sidebar.html esté en la raíz o ajusta la ruta "../sidebar.html"
        const response = await fetch('sidebar.html'); 
        if (!response.ok) throw new Error('No se encontró sidebar.html');
        
        container.innerHTML = await response.text();
        
        // Marcar activo (Estilo Azul y Negrita para Sidebar Blanco)
        const activeLink = container.querySelector(`a[data-page="${activePageId}"]`);
        if (activeLink) {
            activeLink.classList.remove('text-gray-600');
            activeLink.classList.add('bg-blue-50', 'text-blue-700', 'font-bold');
            // Colorear el icono también
            const icon = activeLink.querySelector('svg');
            if(icon) icon.classList.add('text-blue-700');
        }
    } catch (e) { 
        console.error("Error cargando sidebar:", e); 
    }
}

async function checkSession() {
    try {
        const res = await fetch("https://cambiosorion.cl/data/session_status_clientes.php", { 
            credentials: "include" 
        });
        const data = await res.json();
        
        if (!data.isAuthenticated) {
            window.location.href = 'https://cambiosorion.cl/login';
            return null;
        }
        
        // Actualizar Header (Nombre usuario)
        const headerName = document.getElementById('header-user-name');
        const dropdownEmail = document.getElementById('dropdown-user-email');
        
        if(headerName && data.nombre) headerName.textContent = data.nombre.split(' ')[0];
        if(dropdownEmail && data.correo) dropdownEmail.textContent = data.correo;

        return data;
    } catch (e) {
        console.error("Error validando sesión:", e);
        return null;
    }
}