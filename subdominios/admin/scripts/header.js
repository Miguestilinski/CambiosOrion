// scripts/header.js - Sistema RRHH/Admin (Tema Indigo)

const SystemConfig = {
    loginUrl: 'https://admin.cambiosorion.cl/login',
    sidebarFile: 'sidebar.html', // Archivo a cargar dinámicamente
    apiSession: 'https://cambiosorion.cl/data/session_status_admin.php',
    apiLogout: 'https://cambiosorion.cl/data/cerrar_sesion.php'
};

/**
 * Función principal de inicialización.
 * @param {string} activePageId - ID de la sección actual para marcar en el sidebar (data-section)
 */
export async function initAdminHeader(activePageId = '') {
    // 1. Obtener sesión
    const sessionData = await getSession();

    if (!sessionData.isAuthenticated) {
        return sessionData; // El getSession ya redirige, pero por seguridad retornamos.
    }

    // 2. Cargar Sidebar y aplicar lógica de roles
    await loadSidebar(activePageId, sessionData);

    // 3. Configurar UI del Header (Badge, Textos)
    updateHeaderUI(sessionData);

    // 4. Inicializar Componentes UI
    setupUserDropdown();      // Menú perfil (arriba derecha)
    setupSystemSwitcher();    // Selector de sistemas (móvil)
    setupMobileSidebar();     // Menú hamburguesa (Sidebar lateral)
    
    return sessionData;
}

// --- GESTIÓN DE SESIÓN Y ROLES ---
async function getSession() {
    try {
        const res = await fetch(SystemConfig.apiSession, { credentials: 'include' });
        const data = await res.json();
        
        if (data.isAuthenticated) {
            updateHeaderUserInfo(data);
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

// --- LOGICA UI HEADER (Migrada de index.js) ---
function updateHeaderUI(userData) {
    const rol = (userData.rol || '').toLowerCase().trim();
    const nombre = userData.nombre || 'Usuario';
    const primerNombre = nombre.split(' ')[0];

    // Referencias
    const headerName = document.getElementById('header-user-name');
    const headerEmail = document.getElementById('dropdown-user-email');
    const headerBadge = document.getElementById('header-badge');
    const logoutBtn = document.getElementById('logout-button');

    // Llenar datos básicos
    if (headerName) headerName.textContent = primerNombre;
    if (headerEmail) headerEmail.textContent = userData.correo;

    // Configurar Badge y Roles (SuperUsuario)
    const superUsers = ['socio', 'admin', 'gerente', 'administrador', 'jefe de operaciones'];
    const isSuperUser = superUsers.includes(rol);

    if (headerBadge) {
        // Estilos base compartidos
        const baseClasses = "hidden md:inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold text-white border tracking-wider uppercase shadow-lg transition-all";
        
        if (isSuperUser) {
            headerBadge.textContent = "PORTAL ADMIN";
            headerBadge.className = `${baseClasses} bg-indigo-600 border-indigo-500/30 shadow-indigo-500/20`;
        } else {
            headerBadge.textContent = "PORTAL ORION";
            headerBadge.className = `${baseClasses} bg-slate-600 border-slate-500/30 shadow-slate-500/20`;
        }
    }

    // Configurar Logout
    if (logoutBtn) {
        logoutBtn.onclick = (e) => {
            e.preventDefault();
            fetch(SystemConfig.apiLogout).then(() => window.location.href = SystemConfig.loginUrl);
        };
    }
}

// --- LOGICA UI HEADER ---
function updateHeaderUserInfo(data) {
    // Actualizar nombre en el header
    const userNameEl = document.getElementById('header-user-name');
    const userEmailEl = document.getElementById('dropdown-user-email');
    const headerBadge = document.getElementById('header-badge');

    const nombreCorto = data.nombre ? data.nombre.split(' ')[0] : 'Usuario';
    const rol = data.rol || 'Usuario'; // Asumimos que la API devuelve 'rol'

    if(userNameEl) userNameEl.textContent = nombreCorto;
    if(userEmailEl) userEmailEl.textContent = data.correo || data.email || 'usuario@orion.cl';
    if(headerBadge) headerBadge.textContent = rol;

    // Configurar botón logout del header
    const logoutBtn = document.getElementById('logout-button');
    if(logoutBtn) {
        logoutBtn.onclick = (e) => {
            e.preventDefault();
            fetch(SystemConfig.apiLogout).then(() => window.location.href = SystemConfig.loginUrl);
        };
    }
}

// --- SIDEBAR LOADER & PERMISSIONS ---
async function loadSidebar(activePageId, userData) {
    const container = document.getElementById('sidebar-container');
    if (!container) return;

    try {
        const response = await fetch(SystemConfig.sidebarFile);
        if (response.ok) {
            const html = await response.text();
            container.innerHTML = html;
            
            // 1. Marcar link activo
            activarLinkSidebar(activePageId);

            // 2. Aplicar Permisos (Mostrar opciones ocultas si es admin)
            // Asumimos que el rol de administrador es '1', 'Admin' o 'Administrador'
            const esAdmin = (userData.rol === 'Administrador' || userData.rol === 'Gerencia' || userData.rol === 'Jefe de Operaciones'); 
            
            if (esAdmin) {
                const adminItems = container.querySelectorAll('.admin-only');
                adminItems.forEach(item => {
                    item.classList.remove('hidden');
                    // Si tenía w-full hidden, aseguramos que se vea bien ahora
                    item.classList.add('flex'); // O block, dependiendo del diseño
                });
            }

            // 3. Datos del usuario en el sidebar (footer del sidebar)
            const sbAvatar = document.getElementById('sidebar-user-avatar');
            const sbName = document.getElementById('sidebar-user-name');
            const sbRole = document.getElementById('sidebar-user-role');
            
            if (sbName) sbName.textContent = userData.nombre || 'Usuario';
            if (sbRole) sbRole.textContent = userData.rol || 'Staff';
            if (sbAvatar) sbAvatar.textContent = (userData.nombre || 'U').charAt(0).toUpperCase();

            // Logout del sidebar
            const sbLogout = document.getElementById('sidebar-logout');
            if (sbLogout) {
                sbLogout.onclick = (e) => {
                    e.preventDefault();
                    fetch(SystemConfig.apiLogout).then(() => window.location.href = SystemConfig.loginUrl);
                };
            }
        }
    } catch (e) {
        console.error("Error cargando sidebar:", e);
    }
}

function activarLinkSidebar(section) {
    if (!section) return;
    setTimeout(() => {
        const links = document.querySelectorAll('aside a[data-section]');
        links.forEach(link => {
            // Reset estilos base
            link.className = 'menu-item flex items-center px-4 py-3 text-slate-600 rounded-xl hover:bg-slate-50 hover:text-indigo-600 transition group w-full';
            
            const icon = link.querySelector('svg');
            // CORRECCIÓN AQUÍ: Usar setAttribute para SVG
            if (icon) {
                icon.setAttribute('class', "w-6 h-6 mr-3 text-slate-400 group-hover:text-indigo-500 group-hover:scale-110 transition-transform");
            }

            // Estilo Activo (Indigo)
            if (link.dataset.section === section) {
                link.className = 'menu-item flex items-center px-4 py-3 bg-indigo-50 text-indigo-700 rounded-xl font-bold transition group w-full shadow-sm border border-indigo-100';
                
                // CORRECCIÓN AQUÍ: Usar setAttribute para SVG
                if (icon) {
                    icon.setAttribute('class', "w-6 h-6 mr-3 text-indigo-600 scale-110 transition-transform");
                }
            }
        });
    }, 50);
}

// --- MENÚ MÓVIL (SIDEBAR DRAWER) ---
function setupMobileSidebar() {
    const btnMenu = document.getElementById('mobile-menu-btn');
    const sidebar = document.querySelector('aside'); // Buscamos el elemento <aside> inyectado
    
    // Crear Backdrop si no existe
    let backdrop = document.getElementById('sidebar-backdrop');
    if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.id = 'sidebar-backdrop';
        backdrop.className = 'fixed inset-0 bg-slate-900/60 z-30 hidden lg:hidden backdrop-blur-sm transition-opacity opacity-0';
        document.body.appendChild(backdrop);
        backdrop.addEventListener('click', closeSidebar);
    }

    if (btnMenu) {
        btnMenu.onclick = (e) => {
            e.stopPropagation();
            // Re-seleccionar sidebar por si se cargó asíncronamente después de iniciar la función
            const dynamicSidebar = document.querySelector('aside');
            if(dynamicSidebar) {
                const isHidden = dynamicSidebar.classList.contains('-translate-x-full');
                if (isHidden) openSidebar(dynamicSidebar);
                else closeSidebar();
            }
        };
    }

    function openSidebar(el) {
        el.classList.remove('-translate-x-full');
        backdrop.classList.remove('hidden');
        // Pequeño delay para la transición de opacidad
        setTimeout(() => backdrop.classList.remove('opacity-0'), 10);
    }
}

function closeSidebar() {
    const sidebar = document.querySelector('aside');
    const backdrop = document.getElementById('sidebar-backdrop');
    
    if (sidebar) sidebar.classList.add('-translate-x-full');
    
    if (backdrop) {
        backdrop.classList.add('opacity-0');
        setTimeout(() => backdrop.classList.add('hidden'), 300);
    }
}

// --- CONTEXT SWITCHER (MÓVIL) ---
function setupSystemSwitcher() {
    const btn = document.getElementById('system-switcher-btn');
    const dropdown = document.getElementById('system-switcher-dropdown');
    const chevron = document.getElementById('system-switcher-chevron');
    
    if (btn && dropdown) {
        btn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const isHidden = dropdown.classList.contains('hidden');
            closeAllMenus(); // Cerrar otros menús primero
            
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

// --- USER DROPDOWN ---
function setupUserDropdown() {
    const btn = document.getElementById('profile-menu-button');
    const dropdown = document.getElementById('dropdownInformation');
    
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
    const els = document.querySelectorAll('#system-switcher-dropdown, #dropdownInformation');
    els.forEach(e => {
        e.classList.add('hidden');
        e.classList.remove('flex');
    });
    
    const chev = document.getElementById('system-switcher-chevron');
    if(chev) chev.classList.remove('rotate-180');
}