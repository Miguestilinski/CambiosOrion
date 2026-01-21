// index.js - Lógica común para Sistema de Tesorería (Tema Ámbar)

export const SystemConfig = {
    apiBase: 'https://cambiosorion.cl/data',
    loginUrl: 'https://admin.cambiosorion.cl/login',
    sidebarFile: 'sidebar.html'
};

export async function initSystem(currentPageId) {
    // 1. Capturamos los datos de la sesión
    const sessionData = await getSession();
    
    // 2. Cargamos sidebar y herramientas visuales
    await cargarSidebar(currentPageId);
    
    // 3. Inicializamos componentes UI
    initDatePickers();
    setupUserDropdown(); // Lógica del menú de usuario
    setupMobileSidebar(); // Lógica del menú móvil (NUEVO)
    
    // 4. Retornamos datos
    return sessionData;
}

// --- SIDEBAR & HEADER ---
export function cargarSidebar(activePageId) {
    return fetch(SystemConfig.sidebarFile)
        .then(response => response.text())
        .then(html => {
            const container = document.getElementById('sidebar-container');
            if (container) {
                container.innerHTML = html;
                activarLinkSidebar(activePageId);
            }
        });
}

export function activarLinkSidebar(pagina) {
    setTimeout(() => {
        const links = document.querySelectorAll('aside a');
        links.forEach(link => {
            link.className = 'flex items-center px-4 py-2.5 text-slate-400 hover:bg-white/5 hover:text-amber-400 rounded-lg transition-colors group mb-1 border border-transparent';
            if (link.href.includes(pagina)) {
                link.className = 'flex items-center px-4 py-2.5 bg-amber-600 text-white rounded-lg shadow-lg shadow-amber-500/20 group mb-1 border border-amber-500 font-medium';
            }
        });
    }, 50);
}

// --- MENU MÓVIL (NUEVO) ---
function setupMobileSidebar() {
    const btnMenu = document.getElementById('mobile-menu-btn');
    const sidebar = document.getElementById('sidebar-container');
    
    if (!btnMenu || !sidebar) return;

    // Crear Backdrop (Fondo oscuro)
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
        // Mostrar Sidebar en modo Móvil (Fixed, Z-Index alto)
        sidebar.classList.remove('hidden');
        sidebar.classList.add('fixed', 'inset-y-0', 'left-0', 'z-50', 'w-64', 'bg-slate-900', 'shadow-2xl', 'border-r', 'border-white/10', 'slide-in-animation');
        
        // Mostrar Backdrop
        backdrop.classList.remove('hidden');
        // Pequeño delay para la transición de opacidad
        setTimeout(() => backdrop.classList.remove('opacity-0'), 10);
    }

    function closeSidebar() {
        // Ocultar y limpiar clases móviles
        sidebar.classList.add('hidden');
        sidebar.classList.remove('fixed', 'inset-y-0', 'left-0', 'z-50', 'w-64', 'bg-slate-900', 'shadow-2xl', 'border-r', 'border-white/10', 'slide-in-animation');
        
        // Ocultar Backdrop
        backdrop.classList.add('opacity-0');
        setTimeout(() => backdrop.classList.add('hidden'), 300);
    }
}

// --- USER DROPDOWN ---
function setupUserDropdown() {
    const btn = document.getElementById('profile-menu-button');
    const dropdown = document.getElementById('dropdownInformation');
    if(btn && dropdown) {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('hidden');
        });
        document.addEventListener('click', (e) => {
            if (!btn.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.classList.add('hidden');
            }
        });
    }
}

// --- SESIÓN ---
async function getSession() {
    try {
        const res = await fetch("https://cambiosorion.cl/data/session_status.php", { credentials: 'include' });
        const data = await res.json();
        
        if (data.isAuthenticated) {
            // Actualizar Header
            const userNameEl = document.getElementById('header-user-name');
            const userEmailEl = document.getElementById('dropdown-user-email');
            
            // Nombre corto (Ej: Juan P.)
            const nombreCorto = data.nombre ? data.nombre.split(' ')[0] : 'Usuario';
            
            if(userNameEl) userNameEl.textContent = nombreCorto;
            if(userEmailEl) userEmailEl.textContent = data.email || 'usuario@orion.cl';
            
            // Logout logic
            const logoutBtn = document.getElementById('logout-button');
            if(logoutBtn) {
                logoutBtn.onclick = (e) => {
                    e.preventDefault();
                    fetch("https://cambiosorion.cl/data/logout.php")
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

// --- TOOLS ---
export function initDatePickers() {
    if (typeof flatpickr !== 'undefined') {
        const inputs = document.querySelectorAll('input[type="date"], .datepicker');
        inputs.forEach(inp => flatpickr(inp, { 
            dateFormat: "Y-m-d", 
            locale: "es",
            theme: "airbnb" 
        }));
    }
}

export function limpiarTexto(texto) {
    if (!texto) return '';
    const span = document.createElement('div');
    span.innerText = texto;
    return span.innerHTML;
}

export function formatearNumero(num) {
    if (num === null || num === undefined) return '0.00';
    return parseFloat(num).toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatearFechaHora(fechaString) {
    if (!fechaString) return '';
    try {
        const [datePart, timePart] = fechaString.split(' ');
        const [y, m, d] = datePart.split('-');
        const [h, min] = timePart.split(':');
        return `<div class="flex flex-col"><span class="font-mono font-bold text-slate-300">${h}:${min}</span><span class="text-slate-500 text-[10px]">${d}/${m}/${y}</span></div>`;
    } catch (e) {
        return fechaString;
    }
}

// --- MODALES ---
export function mostrarModalError({ titulo, mensaje }) {
    const modal = document.getElementById("modal-error"); // Asegúrate de tener este HTML en tus layouts o crearlo dinámicamente
    if(!modal) { alert(mensaje); return; }
    
    const t = document.getElementById("modal-error-titulo");
    const m = document.getElementById("modal-error-mensaje");
    if(t) t.textContent = titulo;
    if(m) m.textContent = mensaje;
    
    modal.classList.remove("hidden");
    
    const btn = document.getElementById("modal-error-confirmar");
    if(btn) btn.onclick = () => modal.classList.add("hidden");
}

export function mostrarModalExitoso({ titulo = "Éxito", mensaje = "Operación realizada" } = {}) {
    // Implementación similar si tienes un modal de éxito global
    alert(`${titulo}: ${mensaje}`);
}