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
    // 1. Datos de Sesión
    const sessionData = await getSession();

    // 2. Cargar Sidebar (Si existe el contenedor #sidebar-container en el HTML)
    await cargarSidebar(activePageId);

    // 3. Inicializar Componentes
    setupUserDropdown();      // Perfil
    setupSystemSwitcher();    // Context Switcher
    setupMobileSidebar();     // Menú Hamburguesa (Lógica Tesorería)
    
    // Devolvemos datos por si el script local los necesita
    return sessionData;
}

// --- SIDEBAR LOADER (CORREGIDO CACHÉ) ---
async function cargarSidebar(activePageId) {
    const container = document.getElementById('sidebar-container');
    
    if (!container) return;

    try {
        // TRUCO ANTI-CACHÉ: Agregamos ?v=fecha_actual
        // Esto obliga al navegador a descargar el archivo nuevo siempre.
        const antiCache = new Date().getTime(); 
        const response = await fetch(`${SystemConfig.sidebarFile}?v=${antiCache}`);
        
        if (response.ok) {
            const html = await response.text();
            container.innerHTML = html;
            
            updateSidebarUserInfo();
            activarLinkSidebar(activePageId);
        } else {
            console.error(`Error HTTP ${response.status} al cargar sidebar`);
        }
    } catch (e) {
        console.error("Error crítico cargando sidebar:", e);
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

// --- MENU MÓVIL (CORREGIDO GEOMETRÍA) ---
function setupMobileSidebar() {
    const btnMenu = document.getElementById('mobile-menu-btn');
    const sidebar = document.getElementById('sidebar-container');
    const internalMenu = document.getElementById('mobile-internal-menu');
    
    if (!btnMenu || !sidebar) return;

    // Crear Backdrop
    let backdrop = document.getElementById('sidebar-backdrop');
    if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.id = 'sidebar-backdrop';
        backdrop.className = 'fixed inset-0 bg-black/60 z-[140] hidden lg:hidden backdrop-blur-sm transition-opacity opacity-0';
        document.body.appendChild(backdrop);
        backdrop.addEventListener('click', closeSidebar);
    }

    // Toggle
    btnMenu.addEventListener('click', (e) => {
        e.stopPropagation();
        const isHidden = sidebar.classList.contains('hidden');
        if (isHidden) openSidebar();
        else closeSidebar();
    });

    function openSidebar() {
        sidebar.classList.remove('hidden');
        // IMPORTANTE: Quitamos 'h-full' para que no se estire más allá de la pantalla al bajarlo
        sidebar.classList.remove('h-full'); 
        
        // Usamos top-16 (debajo del header) y bottom-0 (hasta el final)
        sidebar.classList.add('fixed', 'top-16', 'bottom-0', 'left-0', 'z-[150]', 'w-64', 'bg-slate-900', 'shadow-2xl', 'border-r', 'border-white/10', 'slide-in-animation');
        
        backdrop.classList.remove('hidden');
        setTimeout(() => backdrop.classList.remove('opacity-0'), 10);

        if (internalMenu) internalMenu.classList.remove('hidden');
    }

    function closeSidebar() {
        sidebar.classList.add('hidden');
        // Restauramos h-full por si se usa en otras vistas
        sidebar.classList.add('h-full');
        
        // Limpiamos las clases de posición
        sidebar.classList.remove('fixed', 'top-16', 'bottom-0', 'left-0', 'z-[150]', 'w-64', 'bg-slate-900', 'shadow-2xl', 'border-r', 'border-white/10', 'slide-in-animation');
        
        backdrop.classList.add('opacity-0');
        setTimeout(() => backdrop.classList.add('hidden'), 300);

        if (internalMenu) internalMenu.classList.add('hidden');
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
    const btn = document.getElementById('user-menu-btn'); // Busca ID genérico
    const btnProfile = document.getElementById('profile-menu-button'); // Busca ID específico del HTML proporcionado
    
    // Usamos el que encuentre
    const triggerBtn = btn || btnProfile;
    const dropdown = document.getElementById('dropdownInformation'); // ID específico del HTML proporcionado
    
    if (triggerBtn && dropdown) {
        triggerBtn.onclick = (e) => {
            e.stopPropagation();
            const isHidden = dropdown.classList.contains('hidden');
            closeAllMenus();
            if (isHidden) dropdown.classList.remove('hidden');
        };

        document.addEventListener('click', (e) => {
            if (!triggerBtn.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.classList.add('hidden');
            }
        });
    }
}

function closeAllMenus() {
    const dropdowns = document.querySelectorAll('#system-switcher-dropdown, #dropdownInformation, #user-dropdown');
    dropdowns.forEach(d => {
        d.classList.add('hidden');
        d.classList.remove('flex');
    });

    const chevrons = document.querySelectorAll('#system-switcher-chevron');
    chevrons.forEach(c => c.classList.remove('rotate-180'));
}