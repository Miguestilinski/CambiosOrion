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

// --- SIDEBAR LOADER ---
async function cargarSidebar(activePageId) {
    const container = document.getElementById('sidebar-container');
    
    // Si no hay contenedor explícito, no hacemos nada
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

// --- MENU MÓVIL (LÓGICA IDÉNTICA A TESORERÍA/INDEX.JS) ---
function setupMobileSidebar() {
    const btnMenu = document.getElementById('mobile-menu-btn');
    const sidebar = document.getElementById('sidebar-container');
    
    // También controlamos el menú interno específico de Pizarras si existe
    const internalMenu = document.getElementById('mobile-internal-menu');
    
    if (!btnMenu || !sidebar) return;

    // Crear Backdrop (Fondo oscuro) si no existe
    let backdrop = document.getElementById('sidebar-backdrop');
    if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.id = 'sidebar-backdrop';
        backdrop.className = 'fixed inset-0 bg-black/60 z-40 hidden lg:hidden backdrop-blur-sm transition-opacity opacity-0';
        document.body.appendChild(backdrop);
        
        // Click en fondo cierra menú
        backdrop.addEventListener('click', closeSidebar);
    }

    // Toggle Botón
    btnMenu.addEventListener('click', (e) => {
        e.stopPropagation();
        const isHidden = sidebar.classList.contains('hidden');
        if (isHidden) openSidebar();
        else closeSidebar();
    });

    function openSidebar() {
        // 1. Mostrar Sidebar en modo Móvil (Fixed, Z-Index alto, Estilo Cajón)
        sidebar.classList.remove('hidden');
        // Estas clases son las que hacen la magia de "slide-in" y posición fija
        sidebar.classList.add('fixed', 'inset-y-0', 'left-0', 'z-50', 'w-64', 'bg-slate-900', 'shadow-2xl', 'border-r', 'border-white/10', 'slide-in-animation');
        
        // 2. Mostrar Backdrop
        backdrop.classList.remove('hidden');
        setTimeout(() => backdrop.classList.remove('opacity-0'), 10);

        // 3. Mostrar menú interno si es necesario (opcional, dependiendo de si quieres ambos)
        if (internalMenu) internalMenu.classList.remove('hidden');
    }

    function closeSidebar() {
        // 1. Ocultar y limpiar clases móviles (volvemos al estado hidden lg:block)
        sidebar.classList.add('hidden');
        sidebar.classList.remove('fixed', 'inset-y-0', 'left-0', 'z-50', 'w-64', 'bg-slate-900', 'shadow-2xl', 'border-r', 'border-white/10', 'slide-in-animation');
        
        // 2. Ocultar Backdrop
        backdrop.classList.add('opacity-0');
        setTimeout(() => backdrop.classList.add('hidden'), 300);

        // 3. Ocultar menú interno
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