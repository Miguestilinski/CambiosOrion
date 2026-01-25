// scripts/header.js - Sistema Pizarras (Tema Verde)

const SystemConfig = {
    loginUrl: 'https://admin.cambiosorion.cl/login',
    sidebarFile: 'sidebar.html' // Archivo a cargar
};

/**
 * Función principal de inicialización.
 * @param {string} activePageId - ID de la página actual para marcar en el sidebar (ej: 'tasas')
 */
export async function initPizarrasHeader(activePageId = '') {
    console.log('Iniciando Sistema Pizarras...');
    
    // 1. Datos de Sesión
    const sessionData = await getSession();

    // 2. Cargar Sidebar (Si existe el contenedor #sidebar-container en el HTML)
    await cargarSidebar(activePageId);

    // 3. Inicializar Componentes
    setupUserDropdown();      // Perfil
    setupSystemSwitcher();    // Context Switcher
    setupMobileSidebar();     // Menú Hamburguesa
    
    // Devolvemos datos por si el script local los necesita
    return sessionData;
}

// --- SIDEBAR LOADER ---
async function cargarSidebar(activePageId) {
    const container = document.getElementById('sidebar-container');
    
    // Si no hay contenedor explícito, intentamos crearlo o inyectar header simple
    // Para Pizarras, asumimos que si hay sidebar-container, queremos el sidebar.
    if (!container) return;

    try {
        const response = await fetch(SystemConfig.sidebarFile);
        if (response.ok) {
            const html = await response.text();
            container.innerHTML = html;
            
            // Actualizar datos de usuario en el sidebar recién cargado
            updateSidebarUserInfo();
            
            // Marcar link activo
            activarLinkSidebar(activePageId);
        }
    } catch (e) {
        console.error("Error cargando sidebar:", e);
    }
}

function activarLinkSidebar(pagina) {
    if (!pagina) return;
    
    // Pequeño timeout para asegurar que el DOM se actualizó
    setTimeout(() => {
        const links = document.querySelectorAll('aside a[data-page]');
        links.forEach(link => {
            const iconBox = link.querySelector('div'); // El cajita del icono
            
            if (link.dataset.page === pagina) {
                // ESTILO ACTIVO (Tema Emerald)
                link.classList.add('bg-emerald-500/10', 'text-emerald-400', 'font-bold');
                link.classList.remove('text-slate-300');
                
                if (iconBox) {
                    iconBox.classList.remove('bg-slate-800', 'text-slate-400');
                    iconBox.classList.add('bg-emerald-500', 'text-white', 'shadow-emerald-500/50');
                }
            } else {
                // ESTILO INACTIVO
                link.classList.remove('bg-emerald-500/10', 'text-emerald-400', 'font-bold');
                link.classList.add('text-slate-300');
                
                if (iconBox) {
                    iconBox.classList.add('bg-slate-800', 'text-slate-400');
                    iconBox.classList.remove('bg-emerald-500', 'text-white', 'shadow-emerald-500/50');
                }
            }
        });
    }, 50);
}

function setupMobileSidebar() {
    // Botón hamburguesa (debe estar en el HTML principal si se usa layout mobile)
    const btn = document.getElementById('mobile-menu-btn'); 
    const sidebar = document.querySelector('aside');
    const overlay = document.getElementById('sidebar-overlay'); // Fondo oscuro opcional

    if (btn && sidebar) {
        btn.onclick = () => {
            sidebar.classList.toggle('-translate-x-full'); // Tailwind class para ocultar
        };
    }
}

// --- UTILS USUARIO ---
let globalSessionData = null;

async function getSession() {
    try {
        const res = await fetch("https://cambiosorion.cl/data/session_status_admin.php", { credentials: 'include' });
        const data = await res.json();
        
        if (data.isAuthenticated) {
            globalSessionData = data;
            updateHeaderUserInfo(data);
            updateSidebarUserInfo(); // Intentar actualizar si el sidebar ya existe
            return data;
        } else {
            window.location.href = SystemConfig.loginUrl;
            return { isAuthenticated: false };
        }
    } catch (error) {
        console.error("Error de sesión", error);
        return { isAuthenticated: false };
    }
}

function updateHeaderUserInfo(data) {
    // Actualiza elementos del Header superior (si existen)
    const userNameEl = document.getElementById('header-user-name');
    const userEmailEl = document.getElementById('dropdown-user-email');
    const nombreCorto = data.nombre ? data.nombre.split(' ')[0] : 'Usuario';
    
    if(userNameEl) userNameEl.textContent = nombreCorto;
    if(userEmailEl) userEmailEl.textContent = data.correo || 'usuario@orion.cl'; 
}

function updateSidebarUserInfo() {
    if (!globalSessionData) return;
    
    // Actualiza elementos del Sidebar (Footer del sidebar)
    const sbName = document.getElementById('sidebar-user-name');
    const sbAvatar = document.getElementById('sidebar-user-avatar');
    const sbLogout = document.getElementById('sidebar-logout');

    const nombre = globalSessionData.nombre || 'Usuario';
    const inicial = nombre.charAt(0).toUpperCase();

    if (sbName) sbName.textContent = nombre;
    if (sbAvatar) sbAvatar.textContent = inicial;
    
    if (sbLogout) {
        sbLogout.onclick = (e) => {
            e.preventDefault();
            fetch("https://cambiosorion.cl/data/cerrar_sesion.php")
                .then(() => window.location.href = SystemConfig.loginUrl);
        };
    }
}

// --- CONTEXT SWITCHER (Selector de Sistemas) ---
function setupSystemSwitcher() {
    const btn = document.getElementById('system-switcher-btn');
    const dropdown = document.getElementById('system-switcher-dropdown');
    const chevron = document.getElementById('system-switcher-chevron');
                
    if (btn && dropdown) {
        btn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const isHidden = dropdown.classList.contains('hidden');
            closeAllMenus();
                                                                   
            if (isHidden) {
                dropdown.classList.remove('hidden');
                dropdown.classList.add('flex');
                if (chevron) chevron.classList.add('rotate-180');
            }
        };

        document.addEventListener('click', (e) => {
            if (!btn.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.classList.add('hidden');
                dropdown.classList.remove('flex');
                if (chevron) chevron.classList.remove('rotate-180');
            }
        });
    }
}

// --- USER DROPDOWN (Perfil) ---
function setupUserDropdown() {
    const btn = document.getElementById('user-menu-btn');
    const dropdown = document.getElementById('user-dropdown');
    
    if (btn && dropdown) {
        btn.onclick = (e) => {
            e.stopPropagation();
            const isHidden = dropdown.classList.contains('hidden');
            closeAllMenus();
            if (isHidden) dropdown.classList.remove('hidden');
        };

        document.addEventListener('click', (e) => {
            if (!btn.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.classList.add('hidden');
            }
        });
    }
}

function closeAllMenus() {
    const dropdowns = document.querySelectorAll('#system-switcher-dropdown, #user-dropdown');
    dropdowns.forEach(d => {
        d.classList.add('hidden');
        d.classList.remove('flex');
    });

    const chevrons = document.querySelectorAll('#system-switcher-chevron');
    chevrons.forEach(c => c.classList.remove('rotate-180'));
}
