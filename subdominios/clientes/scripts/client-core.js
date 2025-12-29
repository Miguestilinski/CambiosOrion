// client-core.js - Lógica compartida para todo el portal

document.addEventListener('DOMContentLoaded', () => {
    initPortal();
});

async function initPortal() {
    // 1. Validar Sesión
    const userData = await checkSession();
    if (!userData) return; // Si no hay sesión, checkSession redirige

    // 2. Cargar Sidebar
    await loadSidebar();

    // 3. Poblar Datos de UI (Header, etc)
    populateUserData(userData);
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
        return data;
    } catch (error) {
        console.error("Error sesión:", error);
        return null;
    }
}

async function loadSidebar() {
    const sidebarContainer = document.getElementById('sidebar-container');
    if (!sidebarContainer) return;

    try {
        const response = await fetch('sidebar.html');
        const html = await response.text();
        sidebarContainer.innerHTML = html;
        
        // Resaltar la página actual
        const currentPage = document.body.getAttribute('data-page'); // Leemos esto del body
        if (currentPage) {
            const activeLink = sidebarContainer.querySelector(`a[data-page="${currentPage}"]`);
            if (activeLink) {
                activeLink.classList.remove('text-gray-400');
                activeLink.classList.add('bg-blue-500/20', 'text-blue-300', 'font-bold');
                const icon = activeLink.querySelector('svg');
                if(icon) icon.classList.add('text-blue-300');
            }
        }
    } catch (err) {
        console.error("Error cargando sidebar:", err);
    }
}

function populateUserData(data) {
    // Header
    const headerName = document.getElementById('header-user-name');
    const headerEmail = document.getElementById('dropdown-user-email');
    
    // Decodificación segura de caracteres (Fix para "MuÃ±oz")
    // A veces PHP envía UTF8 pero el navegador lo interpreta mal si no hay cabeceras.
    // Esta función ayuda a forzar la decodificación si viene "sucio".
    const safeName = decodeString(data.nombre);

    if(headerName) headerName.textContent = safeName.split(' ')[0]; // Solo primer nombre
    if(headerEmail) headerEmail.textContent = data.correo;

    // Elementos específicos de Dashboard o Perfil si existen
    const welcomeName = document.getElementById('welcome-name');
    const welcomeRole = document.getElementById('welcome-role');
    const userNameFull = document.getElementById('user-name-dashboard');
    const emailInput = document.getElementById('email');
    const roleType = document.getElementById('role-type');
    const rutInput = document.getElementById('rut');

    if(welcomeName) welcomeName.textContent = safeName.split(' ')[0];
    if(welcomeRole) welcomeRole.textContent = data.tipo_cliente === 'empresa' ? 'Empresa Verificada' : 'Usuario Verificado';
    
    if(userNameFull) userNameFull.textContent = safeName;
    if(emailInput) emailInput.value = data.correo;
    if(roleType) roleType.textContent = data.tipo_cliente === 'empresa' ? 'Cuenta Empresa' : 'Cuenta Personal';
    if(rutInput) {
        rutInput.textContent = data.rut;
        document.getElementById('rut-group')?.classList.remove('hidden');
    }
}

// Helper para arreglar caracteres rotos si PHP falla
function decodeString(str) {
    try {
        return decodeURIComponent(escape(str));
    } catch (e) {
        return str;
    }
}

// Lógica de Menú Móvil y Dropdown (Header)
const profileBtn = document.getElementById('profile-menu-button');
const dropdown = document.getElementById('dropdownInformation');
const navBtn = document.getElementById('nav-menu-button');
const mobileMenu = document.getElementById('nav-mobile-menu');

if(profileBtn && dropdown) {
    profileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('hidden');
    });
    document.addEventListener('click', () => dropdown.classList.add('hidden'));
}
if(navBtn && mobileMenu) {
    navBtn.addEventListener('click', () => mobileMenu.classList.toggle('hidden'));
}