// scripts/header.js - Lógica para Sistema de Cajas (Tema Cyan)

const SystemConfig = {
    loginUrl: 'https://admin.cambiosorion.cl/login',
    sidebarFile: 'sidebar.html'
};

// currentPageId: ID opcional para marcar activo el link del sidebar
export async function initCajaHeader(currentPageId = '') {
    console.log('Iniciando Sistema Cajas...');
    
    // 1. Datos de Sesión (CORRECCIÓN: Capturamos el resultado)
    const sessionData = await getSession();

    // 2. Cargar Sidebar (si existe contenedor)
    await cargarSidebar(currentPageId);

    // 3. Inicializar Componentes
    setupUserDropdown();      // Perfil
    setupSystemSwitcher();    // Context Switcher
    setupMobileSidebar();     // Menú Hamburguesa
    
    // 4. Retornar datos (CORRECCIÓN: Devolvemos los datos a quien llamó la función)
    return sessionData;
}

// --- SIDEBAR LOADER ---
async function cargarSidebar(activePageId) {
    const container = document.getElementById('sidebar-container');
    if (!container) return;

    try {
        const response = await fetch(SystemConfig.sidebarFile);
        if (response.ok) {
            const html = await response.text();
            container.innerHTML = html;
            activarLinkSidebar(activePageId);
        }
    } catch (e) {
        console.error("Error cargando sidebar:", e);
    }
}

function activarLinkSidebar(pagina) {
    setTimeout(() => {
        const links = document.querySelectorAll('aside a');
        links.forEach(link => {
            // Estilo base (Slate)
            link.className = 'flex items-center px-4 py-2.5 text-slate-400 hover:bg-white/5 hover:text-cyan-400 rounded-lg transition-colors group mb-1 border border-transparent';
            
            // Estilo activo (Cyan)
            if (pagina && link.href.includes(pagina)) {
                link.className = 'flex items-center px-4 py-2.5 bg-cyan-600 text-white rounded-lg shadow-lg shadow-cyan-500/20 group mb-1 border border-cyan-500 font-medium';
            }
        });
    }, 50);
}

// --- CONTEXT SWITCHER ---
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

// --- MOBILE SIDEBAR ---
function setupMobileSidebar() {
    const btnMenu = document.getElementById('mobile-menu-btn');
    const sidebar = document.getElementById('sidebar-container');
    
    if (!btnMenu || !sidebar) return;

    let backdrop = document.getElementById('sidebar-backdrop');
    if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.id = 'sidebar-backdrop';
        backdrop.className = 'fixed inset-0 bg-black/60 z-40 hidden lg:hidden backdrop-blur-sm transition-opacity opacity-0';
        document.body.appendChild(backdrop);
        backdrop.addEventListener('click', closeSidebar);
    }

    btnMenu.addEventListener('click', (e) => {
        e.stopPropagation();
        const isHidden = sidebar.classList.contains('hidden');
        if (isHidden) openSidebar();
        else closeSidebar();
    });

    function openSidebar() {
        closeAllMenus();
        sidebar.classList.remove('hidden');
        sidebar.classList.add('fixed', 'inset-y-0', 'left-0', 'z-50', 'w-64', 'bg-slate-900', 'shadow-2xl', 'border-r', 'border-white/10');
        
        backdrop.classList.remove('hidden');
        setTimeout(() => backdrop.classList.remove('opacity-0'), 10);
    }

    function closeSidebar() {
        sidebar.classList.add('hidden');
        sidebar.classList.remove('fixed', 'inset-y-0', 'left-0', 'z-50', 'w-64', 'bg-slate-900', 'shadow-2xl', 'border-r', 'border-white/10');
        
        backdrop.classList.add('opacity-0');
        setTimeout(() => backdrop.classList.add('hidden'), 300);
    }
}

// --- PERFIL ---
function setupUserDropdown() {
    const btn = document.getElementById('profile-menu-button');
    const dropdown = document.getElementById('dropdownInformation');
    
    if (btn && dropdown) {
        btn.onclick = (e) => {
            e.preventDefault();
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
    const switcher = document.getElementById('system-switcher-dropdown');
    const profile = document.getElementById('dropdownInformation');
    const chevron = document.getElementById('system-switcher-chevron');

    if(switcher) { switcher.classList.add('hidden'); switcher.classList.remove('flex'); }
    if(chevron) chevron.classList.remove('rotate-180');
    if(profile) profile.classList.add('hidden');
}

// --- SESIÓN ---
async function getSession() {
    try {
        const res = await fetch("https://cambiosorion.cl/data/session_status_admin.php", { credentials: 'include' });
        const data = await res.json();
        
        if (data.isAuthenticated) {
            const userNameEl = document.getElementById('header-user-name');
            const userEmailEl = document.getElementById('dropdown-user-email');
            
            const nombreCorto = data.nombre ? data.nombre.split(' ')[0] : 'Usuario';
            
            if(userNameEl) userNameEl.textContent = nombreCorto;
            if(userEmailEl) userEmailEl.textContent = data.correo || 'usuario@orion.cl'; 
            
            const logoutBtn = document.getElementById('logout-button');
            if(logoutBtn) {
                logoutBtn.onclick = (e) => {
                    e.preventDefault();
                    fetch("https://cambiosorion.cl/data/cerrar_sesion.php")
                        .then(() => window.location.href = SystemConfig.loginUrl);
                };
            }
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