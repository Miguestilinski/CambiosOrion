import { initAdminHeader } from './header.js';

document.addEventListener('DOMContentLoaded', async () => {
    // --- REFERENCIAS DOM LOCALES ---
    const tableBody = document.getElementById('team-table-body');
    const searchInput = document.getElementById('search-input');
    const roleFilter = document.getElementById('filter-role');
    const addMemberBtn = document.getElementById('btn-add-member');

    // Modal Notifications
    const modalNotif = document.getElementById('modal-notification');
    const modalIcon = document.getElementById('modal-icon-container');
    const modalTitle = document.getElementById('modal-title');
    const modalMsg = document.getElementById('modal-message');
    const modalBtn = document.getElementById('modal-btn');

    // --- 1. INICIALIZACIÓN GLOBAL ---
    // Carga sesión, sidebar, header y marca 'equipo' como activo
    const sessionData = await initAdminHeader('equipo');

    if (!sessionData.isAuthenticated) return;

    // --- 2. SEGURIDAD Y CONFIGURACIÓN ---
    let currentUserId = sessionData.equipo_id;
    let currentUserRole = (sessionData.rol || '').toLowerCase().trim();

    // Validar permisos de acceso a esta página
    const allowedRoles = ['socio', 'admin', 'gerente', 'rrhh'];
    
    if (!allowedRoles.includes(currentUserRole)) {
        showAlert("Acceso Restringido", "No tienes permisos para ver el equipo.", true);
        setTimeout(() => window.location.href = 'index', 2000);
        return;
    }

    // --- 3. INICIAR LÓGICA ---
    setupEventListeners();
    fetchEmployees();

    function showAlert(title, message, isError = false) {
        const iconSuccess = `<svg class="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`;
        const iconError = `<svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>`;

        modalIcon.innerHTML = isError ? iconError : iconSuccess;
        modalIcon.className = isError 
            ? "w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"
            : "w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4";

        modalTitle.textContent = title;
        modalMsg.textContent = message;
        
        modalBtn.className = isError 
            ? "w-full px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold transition shadow-lg shadow-red-500/30"
            : "w-full px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold transition shadow-lg shadow-indigo-500/30";

        modalBtn.onclick = () => modalNotif.classList.add('hidden');
        modalNotif.classList.remove('hidden');
    }

    // --- UTILS ---
    function formatName(fullName) {
        if (!fullName) return '';
        const parts = fullName.trim().split(/\s+/);
        if (parts.length >= 3) return `${parts[0]} ${parts[2]}`;
        if (parts.length === 2) return `${parts[0]} ${parts[1]}`;
        return parts[0];
    }

    function formatDate(dateStr) {
        if(!dateStr) return '-';
        const parts = dateStr.split('-');
        if(parts.length < 3) return dateStr;
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }

    function getInitials(name) {
        if(!name) return '??';
        return name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();
    }

    // --- DATA ---
    async function fetchEmployees() {
        const search = searchInput.value;
        const role = roleFilter.value;
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center py-8">Cargando...</td></tr>';

        try {
            const url = `https://cambiosorion.cl/data/equipo.php?current_user_id=${currentUserId}&search=${encodeURIComponent(search)}&role=${role}`;
            const res = await fetch(url);
            const json = await res.json();

            if(json.success) {
                currentUserRole = (json.current_role || '').toLowerCase(); // Guardamos rol del usuario logueado
                renderTable(json.data);
            } else {
                tableBody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-red-500">${json.message}</td></tr>`;
            }
        } catch (e) {
            console.error(e);
            tableBody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-red-500">Error de conexión</td></tr>`;
        }
    }

    function renderTable(data) {
        tableBody.innerHTML = '';
        if(data.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="5" class="text-center py-8 text-slate-400">No se encontraron resultados.</td></tr>`;
            return;
        }

        data.forEach(u => {
            const tr = document.createElement('tr');
            tr.className = "bg-white border-b hover:bg-slate-50 transition";
            
            // Lógica de visualización del botón
            const isTargetSocio = u.rol.toLowerCase().includes('socio');
            const amISocio = currentUserRole.includes('socio');
            
            let actionHtml = '';
            // Si el objetivo es Socio y yo NO soy Socio -> No mostrar botón
            if (isTargetSocio && !amISocio) {
                actionHtml = `<span class="text-xs text-slate-300 italic">Privado</span>`;
            } else {
                actionHtml = `<button onclick="window.location.href='detalle-int?id=${u.id}'" class="text-indigo-600 hover:text-indigo-900 font-medium hover:underline flex items-center justify-end w-full">
                                Ver / Editar <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                              </button>`;
            }

            tr.innerHTML = `
                <td class="px-6 py-4">
                    <div class="flex items-center">
                        <div class="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs mr-3">
                            ${getInitials(u.nombre)}
                        </div>
                        <div>
                            <div class="font-bold text-slate-800">${formatName(u.nombre)}</div>
                            <div class="text-xs text-slate-500">${u.email}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 text-slate-600 text-sm">${u.rol}</td>
                <td class="px-6 py-4 text-slate-500 text-sm">${formatDate(u.fecha_ingreso)}</td>
                <td class="px-6 py-4"><span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800">Activo</span></td>
                <td class="px-6 py-4 text-right">${actionHtml}</td>
            `;
            tableBody.appendChild(tr);
        });
    }

    function setupEventListeners() {
        searchInput.addEventListener('input', fetchEmployees);
        roleFilter.addEventListener('change', fetchEmployees);
        // El botón "Nuevo Integrante" lleva a la nueva página en modo creación (id=0 o sin id)
        addMemberBtn.addEventListener('click', () => window.location.href = 'detalle-int?id=new');
    }
});