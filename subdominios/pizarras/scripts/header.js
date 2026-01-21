// scripts/header.js - Lógica para Sistema de Pizarras (Tema Verde)

const SystemConfig = {
    loginUrl: 'https://admin.cambiosorion.cl/login'
};

export async function initPizarrasHeader() {
    console.log('Iniciando Header Pizarras...');
    
    // 1. Datos de Sesión
    await getSession();

    // 2. Inicializar Componentes
    setupUserDropdown();      // Perfil (Derecha)
    setupSystemSwitcher();    // Context Switcher (Centro/Logo)
    setupMobileInternalMenu();// Menú Hamburguesa (Navegación Interna)
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
            
            // Cerrar otros menús si están abiertos
            closeAllMenus();

            if (isHidden) {
                dropdown.classList.remove('hidden');
                dropdown.classList.add('flex');
                if (chevron) chevron.classList.add('rotate-180');
            }
        };

        // Cerrar al hacer click fuera
        document.addEventListener('click', (e) => {
            if (!btn.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.classList.add('hidden');
                dropdown.classList.remove('flex');
                if (chevron) chevron.classList.remove('rotate-180');
            }
        });
    }
}

// --- MENÚ MÓVIL INTERNO (Hamburguesa) ---
function setupMobileInternalMenu() {
    const btn = document.getElementById('mobile-menu-btn');
    const menu = document.getElementById('mobile-internal-menu');

    if (btn && menu) {
        btn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const isHidden = menu.classList.contains('hidden');
            
            // Cerrar otros menús
            closeAllMenus();

            if (isHidden) {
                menu.classList.remove('hidden');
                // Icono activo (opcional)
                btn.classList.add('text-white', 'bg-white/10');
            } else {
                menu.classList.add('hidden');
                btn.classList.remove('text-white', 'bg-white/10');
            }
        };

        // Cerrar al click fuera
        document.addEventListener('click', (e) => {
            if (!btn.contains(e.target) && !menu.contains(e.target)) {
                menu.classList.add('hidden');
                btn.classList.remove('text-white', 'bg-white/10');
            }
        });
    }
}

// --- MENÚ DE PERFIL ---
function setupUserDropdown() {
    const btn = document.getElementById('profile-menu-button');
    const dropdown = document.getElementById('dropdownInformation');
    
    if (btn && dropdown) {
        btn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const isHidden = dropdown.classList.contains('hidden');
            closeAllMenus(); // Cierra switcher y nav móvil

            if (isHidden) {
                dropdown.classList.remove('hidden');
            }
        };

        document.addEventListener('click', (e) => {
            if (!btn.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.classList.add('hidden');
            }
        });
    }
}

// --- UTILIDAD: Cerrar todo ---
function closeAllMenus() {
    const switcher = document.getElementById('system-switcher-dropdown');
    const profile = document.getElementById('dropdownInformation');
    const mobileNav = document.getElementById('mobile-internal-menu');
    const chevron = document.getElementById('system-switcher-chevron');

    if(switcher) { switcher.classList.add('hidden'); switcher.classList.remove('flex'); }
    if(chevron) chevron.classList.remove('rotate-180');
    if(profile) profile.classList.add('hidden');
    if(mobileNav) mobileNav.classList.add('hidden');
}

// --- SESIÓN ---
async function getSession() {
    try {
        const res = await fetch("https://cambiosorion.cl/data/session_status_admin.php", { credentials: 'include' });
        const data = await res.json();
        
        if (data.isAuthenticated) {
            const userNameEl = document.getElementById('header-user-name');
            const userEmailEl = document.getElementById('dropdown-user-email');
            
            // Nombre corto
            const nombreCorto = data.nombre ? data.nombre.split(' ')[0] : 'Usuario';
            
            if(userNameEl) userNameEl.textContent = nombreCorto;
            if(userEmailEl) userEmailEl.textContent = data.correo || 'usuario@orion.cl'; 
            
            // Logout
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