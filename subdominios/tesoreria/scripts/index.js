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
    setupUserDropdown(); // Menú de perfil (Usuario)
    setupMobileSidebar(); // Menú móvil (Hamburguesa)
    setupSystemSwitcher();
    
    // 4. Retornamos datos
    return sessionData;
}

// --- SIDEBAR & HEADER ---
export function cargarSidebar(activePageId) {
    return fetch(`${SystemConfig.sidebarFile}?v=${new Date().getTime()}`)
        .then(response => response.text())
        .then(html => {
            const container = document.getElementById('sidebar-container');
            if (container) {
                container.innerHTML = html;
                activarLinkSidebar(activePageId);
                updateSidebarUserInfo();
            }
        });
}

export function activarLinkSidebar(pagina) {
    setTimeout(() => {
        const links = document.querySelectorAll('aside a');
        links.forEach(link => {
            // Estilo base (Gris)
            link.className = 'flex items-center px-4 py-2.5 text-slate-400 hover:bg-white/5 hover:text-amber-400 rounded-lg transition-colors group mb-1 border border-transparent';
            
            // --- CORRECCIÓN AQUÍ ---
            // Obtenemos la ruta limpia sin parámetros query (?id=...) y sin slash final
            const linkPath = link.href.split('?')[0].replace(/\/$/, '');
            const attrHref = link.getAttribute('href'); // El valor exacto en el HTML
            const dataPage = link.getAttribute('data-page');

            // Verificamos si termina con "/pagina" O si es exactamente igual al atributo (para rutas relativas)
            // Esto evita que 'operaciones' active 'operaciones-uaf'
            const esActivo = linkPath.endsWith('/' + pagina) || attrHref === pagina;

            if (esActivo) {
                link.className = 'flex items-center px-4 py-2.5 bg-amber-600 text-white rounded-lg shadow-lg shadow-amber-500/20 group mb-1 border border-amber-500 font-medium';
            }
        });
    }, 50);
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
            
            if (isHidden) {
                // Abrir
                dropdown.classList.remove('hidden');
                dropdown.classList.add('flex'); // Usar flex para la dirección columna
                if (chevron) chevron.classList.add('rotate-180');
                
                // Cerrar otros menús si estuvieran abiertos (ej. perfil)
                const profileMenu = document.getElementById('dropdownInformation');
                if (profileMenu && !profileMenu.classList.contains('hidden')) {
                    profileMenu.classList.add('hidden');
                }
            } else {
                // Cerrar
                dropdown.classList.add('hidden');
                dropdown.classList.remove('flex');
                if (chevron) chevron.classList.remove('rotate-180');
            }
        };

        // Cerrar al hacer click fuera
        document.addEventListener('click', (e) => {
            if (!btn.contains(e.target) && !dropdown.contains(e.target)) {
                if (!dropdown.classList.contains('hidden')) {
                    dropdown.classList.add('hidden');
                    dropdown.classList.remove('flex');
                    if (chevron) chevron.classList.remove('rotate-180');
                }
            }
        });
    }
}

// --- MENU MÓVIL (SIDEBAR) ---
function setupMobileSidebar() {
    const btnMenu = document.getElementById('mobile-menu-btn');
    const sidebar = document.getElementById('sidebar-container');
    
    if (!btnMenu || !sidebar) return;

    // Crear Backdrop (Fondo oscuro) con Z-Index ajustado
    let backdrop = document.getElementById('sidebar-backdrop');
    if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.id = 'sidebar-backdrop';
        // z-[140] para estar debajo del sidebar (z-150) pero encima del header (z-100)
        backdrop.className = 'fixed inset-0 bg-black/60 z-[140] hidden lg:hidden backdrop-blur-sm transition-opacity opacity-0';
        document.body.appendChild(backdrop);
        
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
        sidebar.classList.remove('hidden');
        
        // IMPORTANTE: Quitamos h-full temporalmente para evitar problemas de layout móvil
        sidebar.classList.remove('h-full');

        // Posicionamiento exacto: top-16 (debajo del header), bottom-0 (hasta el final), z-150 (encima de todo)
        sidebar.classList.add('fixed', 'top-16', 'bottom-0', 'left-0', 'z-[150]', 'w-64', 'bg-slate-900', 'shadow-2xl', 'border-r', 'border-white/10', 'slide-in-animation');
        
        backdrop.classList.remove('hidden');
        setTimeout(() => backdrop.classList.remove('opacity-0'), 10);
    }

    function closeSidebar() {
        sidebar.classList.add('hidden');
        
        // Restauramos h-full para el modo escritorio (si se redimensiona la ventana)
        sidebar.classList.add('h-full');

        // Limpiamos las clases móviles
        sidebar.classList.remove('fixed', 'top-16', 'bottom-0', 'left-0', 'z-[150]', 'w-64', 'bg-slate-900', 'shadow-2xl', 'border-r', 'border-white/10', 'slide-in-animation');
        
        backdrop.classList.add('opacity-0');
        setTimeout(() => backdrop.classList.add('hidden'), 300);
    }
}

// --- MENU DE PERFIL (USUARIO) ---
function setupUserDropdown() {
    const btn = document.getElementById('profile-menu-button');
    const dropdown = document.getElementById('dropdownInformation');
    
    if (btn && dropdown) {
        console.log("Sistema: Menú de perfil inicializado correctamente.");
        
        btn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropdown.classList.toggle('hidden');
            console.log("Click en perfil -> Toggle menú");
        };

        // Cerrar al hacer click fuera
        document.addEventListener('click', (e) => {
            if (!btn.contains(e.target) && !dropdown.contains(e.target)) {
                if (!dropdown.classList.contains('hidden')) {
                    dropdown.classList.add('hidden');
                }
            }
        });
    } else {
        console.error("Error: No se encontró el botón 'profile-menu-button' o el menú 'dropdownInformation'. Revisa los IDs en el HTML.");
    }
}

// --- SESIÓN ---
let globalSessionData = null; // Almacenar datos para uso global si es necesario

async function getSession() {
    try {
        const res = await fetch("https://cambiosorion.cl/data/session_status_admin.php", { credentials: 'include' });
        const data = await res.json();
        
        if (data.isAuthenticated) {
            // Actualizar Header
            const userNameEl = document.getElementById('header-user-name');
            const userEmailEl = document.getElementById('dropdown-user-email');
            
            // Nombre corto (Ej: Jacob)
            const nombreCorto = data.nombre ? data.nombre.split(' ')[0] : 'Usuario';
            
            if(userNameEl) userNameEl.textContent = nombreCorto;
            
            // CORRECCIÓN: Usar data.correo en lugar de data.email
            if(userEmailEl) userEmailEl.textContent = data.correo || 'usuario@orion.cl'; 
            
            // Logout logic
            const logoutBtn = document.getElementById('logout-button');
            if(logoutBtn) {
                logoutBtn.onclick = (e) => {
                    e.preventDefault();
                    fetch("https://cambiosorion.cl/data/cerrar_sesion.php") // Asegúrate que esta ruta sea la correcta para logout
                        .then(() => window.location.href = SystemConfig.loginUrl);
                };
            }
            updateSidebarUserInfo();

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

function updateSidebarUserInfo() {
    if (!globalSessionData) return;
    
    // Elementos del footer del sidebar (sidebar-tesoreria.html)
    // Nota: Tesorería no tiene un footer de usuario explícito en el HTML proporcionado,
    // pero si decides agregarlo, esta función lo manejaría.
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

function crearModalDinamico(tipo, titulo, mensaje) {
    // Definir colores e iconos SVG según el tipo
    const config = tipo === 'error' 
        ? { bgIcon: 'bg-red-900/50', textIcon: 'text-red-500', btn: 'bg-red-600 hover:bg-red-700', iconPath: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' }
        : { bgIcon: 'bg-green-900/50', textIcon: 'text-green-500', btn: 'bg-green-600 hover:bg-green-700', iconPath: 'M5 13l4 4L19 7' };

    const modalHTML = `
        <div id="modal-dinamico" class="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[200] fade-in">
            <div class="bg-slate-800 rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4 border border-white/10 transform transition-all scale-100">
                <div class="flex flex-col items-center text-center">
                    <div class="${config.bgIcon} p-3 rounded-full mb-3">
                        <svg class="w-8 h-8 ${config.textIcon}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${config.iconPath}"></path></svg>
                    </div>
                    <h2 class="text-lg font-bold text-white mb-2">${titulo}</h2>
                    <p class="text-sm text-slate-400 mb-6">${mensaje}</p>
                    <div class="flex justify-end gap-2 w-full">
                        <button id="btn-cerrar-modal" class="w-full ${config.btn} text-white py-2 rounded-lg font-bold text-sm transition shadow-lg">Aceptar</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Si ya existe uno, lo borramos
    const existente = document.getElementById('modal-dinamico');
    if (existente) existente.remove();

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    document.getElementById('btn-cerrar-modal').onclick = () => {
        document.getElementById('modal-dinamico').remove();
    };
}

export function mostrarModalError({ titulo, mensaje }) {
    // Intenta usar el modal existente en el HTML (operaciones.html), si falla, crea uno dinámico.
    const modal = document.getElementById("modal-error");
    
    if (modal) {
        const t = document.getElementById("modal-error-titulo");
        const m = document.getElementById("modal-error-mensaje");
        const btn = document.getElementById("modal-error-confirmar");
        
        if (t) t.textContent = titulo;
        if (m) m.textContent = mensaje;
        
        modal.classList.remove("hidden");
        modal.classList.add("flex"); // Asegurar display flex para centrado
        
        // Z-Index alto para asegurar que tape todo
        modal.classList.add("z-[200]");

        if (btn) {
            // Clonar para limpiar eventos anteriores
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            newBtn.onclick = () => {
                modal.classList.add("hidden");
                modal.classList.remove("flex");
            };
        }
    } else {
        // Fallback elegante: Crear modal con Tailwind al vuelo
        crearModalDinamico('error', titulo, mensaje);
    }
}

export function mostrarModalExitoso({ titulo = "Éxito", mensaje = "Operación realizada" } = {}) {
    crearModalDinamico('success', titulo, mensaje);
}