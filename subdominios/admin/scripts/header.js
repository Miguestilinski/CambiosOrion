// scripts/header.js - Sistema RRHH/Admin

const SystemConfig = {
    loginUrl: 'https://admin.cambiosorion.cl/login',
    sidebarFile: 'sidebar.html',
    apiSession: 'https://cambiosorion.cl/data/session_status_admin.php',
    apiLogout: 'https://cambiosorion.cl/data/cerrar_sesion.php'
};

export async function initAdminHeader(activePageId = '') {
    const sessionData = await getSession();

    if (!sessionData.isAuthenticated) {
        return sessionData; 
    }

    await loadSidebar(activePageId, sessionData);
    updateHeaderUI(sessionData);

    setupUserDropdown();
    setupSystemSwitcher();
    setupMobileSidebar();

    return sessionData;
}

// --- SESIÓN ---
async function getSession() {
    try {
        const res = await fetch(SystemConfig.apiSession, { credentials: 'include' });
        const data = await res.json();
        
        if (!data.isAuthenticated || !data.equipo_id) {
            window.location.href = SystemConfig.loginUrl;
            return { isAuthenticated: false };
        }
        return { ...data, isAuthenticated: true };
    } catch (error) {
        console.error("Error sesión:", error);
        window.location.href = SystemConfig.loginUrl;
        return { isAuthenticated: false };
    }
}

// --- UI HEADER ---
function updateHeaderUI(userData) {
    const rol = (userData.rol || '').toLowerCase().trim();
    const nombre = userData.nombre || 'Usuario';
    const primerNombre = nombre.split(' ')[0];

    const headerName = document.getElementById('header-user-name');
    const headerEmail = document.getElementById('dropdown-user-email');
    const headerBadge = document.getElementById('header-badge');
    const logoutBtn = document.getElementById('logout-button');

    if (headerName) headerName.textContent = primerNombre;
    if (headerEmail) headerEmail.textContent = userData.correo;

    // LISTA DE ROLES CON ACCESO TOTAL (Aquí agregamos 'socio')
    const superUsers = ['socio', 'admin', 'gerente', 'administrador', 'jefe de operaciones'];
    const isSuperUser = superUsers.includes(rol);

    if (headerBadge) {
        const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold text-white border tracking-wider uppercase shadow-lg transition-all";
        
        if (isSuperUser) {
            headerBadge.textContent = "PORTAL ADMIN";
            headerBadge.className = `${baseClasses} bg-indigo-600 border-indigo-500/30 shadow-indigo-500/20`;
        } else {
            headerBadge.textContent = "PORTAL ORION";
            headerBadge.className = `${baseClasses} bg-slate-600 border-slate-500/30 shadow-slate-500/20`;
        }
        // Aseguramos que se vea en desktop
        headerBadge.classList.add('hidden', 'lg:inline-flex');
    }

    if (logoutBtn) {
        logoutBtn.onclick = (e) => {
            e.preventDefault();
            fetch(SystemConfig.apiLogout).then(() => window.location.href = SystemConfig.loginUrl);
        };
    }
}

// --- SIDEBAR ---
async function loadSidebar(activePageId, userData) {
    const container = document.getElementById('sidebar-container');
    if (!container) return;

    // === FIX AUTOMÁTICO PARA MÓVIL ===
    // Si el contenedor tiene 'hidden', el menú fixed no se ve. 
    // Lo cambiamos a w-0 para que exista en el DOM pero no ocupe espacio visual en móvil.
    if (container.classList.contains('hidden')) {
        container.classList.remove('hidden');
        container.classList.add('w-0', 'lg:w-64'); // Ancho 0 en móvil, normal en desktop
        // Limpiamos w-64 fijo si existe para evitar conflictos
        if(container.classList.contains('w-64')) container.classList.remove('w-64'); 
    }
    // =================================

    try {
        const response = await fetch(SystemConfig.sidebarFile);
        if (!response.ok) throw new Error("Error loading sidebar");
        
        const html = await response.text();
        container.innerHTML = html;

        // 1. Footer Usuario
        const rol = (userData.rol || '').toLowerCase().trim();
        const sbName = document.getElementById('sidebar-user-name');
        const sbRole = document.getElementById('sidebar-user-role');
        const sbAvatar = document.getElementById('sidebar-user-avatar');
        
        if (sbName) sbName.textContent = userData.nombre;
        if (sbRole) sbRole.textContent = rol.charAt(0).toUpperCase() + rol.slice(1);
        if (sbAvatar) sbAvatar.textContent = (userData.nombre || 'U').charAt(0).toUpperCase();

        // 2. LOGICA DE ROLES SIDEBAR (Unificada)
        const superUsers = ['socio', 'admin', 'gerente', 'administrador', 'jefe de operaciones'];
        const isSuperUser = superUsers.includes(rol);

        const adminSections = container.querySelectorAll('.admin-only');
        if (isSuperUser) {
            adminSections.forEach(el => {
                el.classList.remove('hidden');
                // IMPORTANTE: Usamos remove('hidden') pero aseguramos display correcto
                // Si es un <li>, suele ser block o flex. Probamos quitar hidden simplemente.
            });
        } else {
            // Si no es admin, eliminamos los elementos del DOM por seguridad
            adminSections.forEach(el => el.remove()); 
        }

        // 3. Activar Link
        activarLinkSidebar(activePageId);

        // 4. Logout Sidebar
        const sbLogout = document.getElementById('sidebar-logout');
        if (sbLogout) {
            sbLogout.onclick = (e) => {
                e.preventDefault();
                fetch(SystemConfig.apiLogout).then(() => window.location.href = SystemConfig.loginUrl);
            };
        }

    } catch (e) {
        console.error("Sidebar error:", e);
    }
}

function activarLinkSidebar(section) {
    if (!section) return;
    // Timeout para asegurar que el DOM se pintó
    setTimeout(() => {
        const links = document.querySelectorAll('aside a[data-section]');
        links.forEach(link => {
            // Reset base
            link.className = 'menu-item flex items-center px-4 py-3 text-slate-600 rounded-xl hover:bg-slate-50 hover:text-indigo-600 transition group w-full';
            const icon = link.querySelector('svg');
            if (icon) icon.setAttribute('class', "w-6 h-6 mr-3 text-slate-400 group-hover:text-indigo-500 group-hover:scale-110 transition-transform");

            // Activo
            if (link.dataset.section === section) {
                link.className = 'menu-item flex items-center px-4 py-3 bg-indigo-50 text-indigo-700 rounded-xl font-bold transition group w-full shadow-sm border border-indigo-100';
                if (icon) icon.setAttribute('class', "w-6 h-6 mr-3 text-indigo-600 scale-110 transition-transform");
            }
        });
    }, 50);
}

// --- INTERACTIVIDAD ---
function setupUserDropdown() {
    const btn = document.getElementById('profile-menu-button');
    const dropdown = document.getElementById('dropdownInformation');
    if (btn && dropdown) {
        btn.onclick = (e) => { e.stopPropagation(); toggleMenu(dropdown); };
        document.addEventListener('click', (e) => {
            if (!btn.contains(e.target) && !dropdown.contains(e.target)) dropdown.classList.add('hidden');
        });
    }
}

function setupSystemSwitcher() {
    const btn = document.getElementById('system-switcher-btn');
    const dropdown = document.getElementById('system-switcher-dropdown');
    const chevron = document.getElementById('system-switcher-chevron');
    if (btn && dropdown) {
        btn.onclick = (e) => { e.stopPropagation(); toggleMenu(dropdown, chevron); };
        document.addEventListener('click', (e) => {
            if (!btn.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.classList.add('hidden');
                dropdown.classList.remove('flex');
                if (chevron) chevron.classList.remove('rotate-180');
            }
        });
    }
}

function toggleMenu(menu, chevron = null) {
    const isHidden = menu.classList.contains('hidden');
    document.querySelectorAll('#dropdownInformation, #system-switcher-dropdown').forEach(m => {
        m.classList.add('hidden'); m.classList.remove('flex');
    });
    document.querySelectorAll('#system-switcher-chevron').forEach(c => c.classList.remove('rotate-180'));

    if (isHidden) {
        menu.classList.remove('hidden');
        if (menu.id === 'system-switcher-dropdown') menu.classList.add('flex');
        if (chevron) chevron.classList.add('rotate-180');
    }
}

// --- MENU MÓVIL (AJUSTADO) ---
function setupMobileSidebar() {
    const btnMenu = document.getElementById('mobile-menu-btn');
    const sidebar = document.getElementById('sidebar-container');
    const internalMenu = document.getElementById('mobile-internal-menu'); // Referencia al menú interno
    
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

    // Evento Toggle
    btnMenu.addEventListener('click', (e) => {
        e.stopPropagation();
        const isHidden = sidebar.classList.contains('hidden');
        if (isHidden) openSidebar();
        else closeSidebar();
    });

    function openSidebar() {
        sidebar.classList.remove('hidden');
        // CAMBIO CLAVE: Usamos 'top-16 bottom-0' en lugar de 'inset-y-0'
        // Esto hace que el sidebar nazca exactamente debajo del header (que mide h-16)
        sidebar.classList.add('fixed', 'top-16', 'bottom-0', 'left-0', 'z-[150]', 'w-64', 'bg-slate-900', 'shadow-2xl', 'border-r', 'border-white/10', 'slide-in-animation');
        
        backdrop.classList.remove('hidden');
        setTimeout(() => backdrop.classList.remove('opacity-0'), 10);

        if (internalMenu) internalMenu.classList.remove('hidden');
    }

    function closeSidebar() {
        sidebar.classList.add('hidden');
        // Limpiamos las mismas clases nuevas
        sidebar.classList.remove('fixed', 'top-16', 'bottom-0', 'left-0', 'z-[150]', 'w-64', 'bg-slate-900', 'shadow-2xl', 'border-r', 'border-white/10', 'slide-in-animation');
        
        backdrop.classList.add('opacity-0');
        setTimeout(() => backdrop.classList.add('hidden'), 300);

        if (internalMenu) internalMenu.classList.add('hidden');
    }
}
