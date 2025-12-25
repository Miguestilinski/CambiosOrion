document.addEventListener('DOMContentLoaded', () => {
    // Referencias DOM
    const welcomeName = document.getElementById('welcome-name');
    const welcomeRole = document.getElementById('welcome-role');
    const headerBadge = document.getElementById('header-badge');
    const headerName = document.getElementById('header-user-name');
    const headerEmail = document.getElementById('dropdown-user-email');
    const sidebarContainer = document.getElementById('sidebar-container');

    // 1. Obtener Sesión y determinar Rol
    async function getSession() {
        try {
            const res = await fetch("https://cambiosorion.cl/data/session_status_admin.php", {
                credentials: "include"
            });
            if (!res.ok) throw new Error("No se pudo obtener la sesión.");
            
            const data = await res.json();
            
            if (!data.isAuthenticated || !data.equipo_id) {
                window.location.href = 'https://admin.cambiosorion.cl/login';
                return;
            }

            const rol = (data.rol || '').toLowerCase().trim();
            const nombre = data.nombre || 'Usuario';
            const primerNombre = nombre.split(' ')[0];

            // Poblar datos básicos
            if (welcomeName) welcomeName.textContent = primerNombre;
            if (welcomeRole) welcomeRole.textContent = capitalizeFirstLetter(rol);
            if (headerName) headerName.textContent = primerNombre;
            if (headerEmail) headerEmail.textContent = data.correo;

            // Configurar UI según Rol
            configureDashboardByRole(rol);

        } catch (error) {
            console.error("Error obteniendo la sesión:", error);
            window.location.href = 'https://admin.cambiosorion.cl/login';
        }
    }

    // 2. Configuración Visual y Sidebar según Rol
    function configureDashboardByRole(rol) {
        const superUsers = ['socio', 'admin', 'gerente']; 
        const isSuperUser = superUsers.includes(rol);

        // Cargar Sidebar Único
        fetch('sidebar.html')
            .then(response => response.text())
            .then(html => {
                if(sidebarContainer) {
                    sidebarContainer.innerHTML = html;
                    
                    const adminItems = sidebarContainer.querySelectorAll('.admin-only');
                    
                    if (isSuperUser) {
                        adminItems.forEach(item => item.classList.remove('hidden'));
                    } else {
                        adminItems.forEach(item => item.remove());
                    }
                    
                    // Marcar activo el link "Inicio"
                    const activeLink = sidebarContainer.querySelector('a[href="index"]');
                    if(activeLink) {
                        activeLink.classList.add('bg-indigo-50', 'text-indigo-700', 'font-bold');
                        activeLink.classList.remove('text-slate-600');
                    }
                }
            })
            .catch(err => console.error("Error cargando sidebar:", err));

        // Ajustes visuales Dashboard
        if (isSuperUser) {
            // Estilos ADMIN
            if(headerBadge) {
                headerBadge.textContent = "PORTAL ADMIN";
                headerBadge.className = "hidden md:inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-indigo-600 text-white border border-indigo-500/30 tracking-wider uppercase shadow-lg shadow-indigo-500/20";
            }
            // Mostrar sección exclusiva de Admin en el Dashboard
            const adminSections = document.querySelectorAll('.admin-only');
            adminSections.forEach(el => el.classList.remove('hidden'));

        } else {
            // Estilos NORMAL
            if(headerBadge) {
                headerBadge.textContent = "PORTAL ORION";
                headerBadge.className = "hidden md:inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-indigo-600 text-white border border-indigo-500/30 tracking-wider uppercase shadow-lg shadow-indigo-500/20";
            }
            // Asegurar que secciones admin estén ocultas
            const adminSections = document.querySelectorAll('.admin-only');
            adminSections.forEach(el => el.classList.add('hidden'));
        }
    }

    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    // Iniciar
    getSession();
});