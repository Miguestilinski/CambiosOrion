// index.js - Lógica común para Sistema de Tesorería

export const SystemConfig = {
    apiBase: 'https://cambiosorion.cl/data',
    loginUrl: 'https://admin.cambiosorion.cl/login',
    sidebarFile: 'sidebar.html'
};

export async function initSystem(currentPageId) {
    await getSession();
    await cargarSidebar(currentPageId);
    initDatePickers();
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
            // Reset styles base
            link.className = 'flex items-center px-4 py-2.5 text-gray-600 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors group mb-1 border border-transparent';
            
            const icon = link.querySelector('svg');
            if(icon) { 
                icon.classList.remove('text-blue-600'); 
                icon.classList.add('text-gray-400', 'group-hover:text-blue-500'); 
            }

            if (link.dataset.page === pagina) {
                link.classList.remove('text-gray-600', 'border-transparent');
                link.classList.add('bg-blue-50', 'text-blue-700', 'border-l-4', 'border-blue-600', 'shadow-sm', 'font-bold');
                if(icon) { 
                    icon.classList.remove('text-gray-400', 'group-hover:text-blue-500'); 
                    icon.classList.add('text-blue-600'); 
                }
            }
        });
    }, 100);
}

// --- SESIÓN ---
export async function getSession() {
    try {
        const res = await fetch(`${SystemConfig.apiBase}/session_status_admin.php`, { credentials: "include" });
        if (!res.ok) throw new Error("Error sesión");
        const data = await res.json();
        
        if (!data.isAuthenticated) {
            window.location.href = SystemConfig.loginUrl;
            return null;
        }

        const headerName = document.getElementById('header-user-name');
        const headerEmail = document.getElementById('dropdown-user-email');
        
        if (headerName) headerName.textContent = data.nombre ? data.nombre.split(' ')[0] : 'Admin';
        if (headerEmail) headerEmail.textContent = data.correo;

        return data;

    } catch (error) {
        console.error("Error sesión:", error);
        return null;
    }
}

// --- UTILIDADES ---
export function initDatePickers() {
    if (typeof flatpickr !== 'undefined') {
        flatpickr(".flatpickr", {
            locale: "es",
            dateFormat: "Y-m-d",
            altInput: true,
            altFormat: "d/m/Y",
            allowInput: true,
            disableMobile: "true"
        });
    }
}

export function limpiarTexto(valor) { return valor === null || valor === undefined ? '' : valor; }

export function formatearNumero(numero) {
    if (numero === null || numero === undefined || numero === '') return '';
    return Number(numero).toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export function formatearFechaHora(fechaString) {
    if (!fechaString) return '';
    try {
        const [datePart, timePart] = fechaString.split(' ');
        const [y, m, d] = datePart.split('-');
        const [h, min] = timePart.split(':');
        return `<div class="flex flex-col"><span class="font-mono font-bold text-gray-600">${h}:${min}</span><span class="text-gray-400 text-[10px]">${d}/${m}/${y}</span></div>`;
    } catch (e) {
        return fechaString;
    }
}

// --- MODALES ---
export function mostrarModalError({ titulo, mensaje }) {
    const modal = document.getElementById("modal-error");
    if(!modal) { alert(mensaje); return; }
    
    document.getElementById("modal-error-titulo").textContent = titulo;
    document.getElementById("modal-error-mensaje").textContent = mensaje;
    modal.classList.remove("hidden");
    
    const btnOk = document.getElementById("modal-error-confirmar");
    if(btnOk) btnOk.onclick = () => modal.classList.add("hidden");
}

export function mostrarModalExitoso({ titulo = "Éxito", mensaje = "Operación realizada" } = {}) {
    const modal = document.getElementById("modal-exitoso");
    if(!modal) return;
    
    const h2 = modal.querySelector('h2');
    const p = modal.querySelector('p');
    if(h2) h2.textContent = titulo;
    if(p) p.textContent = mensaje;

    modal.classList.remove("hidden");
    
    const btnVolver = document.getElementById("volver");
    if(btnVolver) btnVolver.onclick = () => {
        modal.classList.add("hidden");
        // Opcional: reload o callback
    };
}