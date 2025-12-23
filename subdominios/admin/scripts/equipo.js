document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const headerBadge = document.getElementById('header-badge');
    const headerName = document.getElementById('header-user-name');
    const headerEmail = document.getElementById('dropdown-user-email');
    const sidebarContainer = document.getElementById('sidebar-container');
    const tableBody = document.getElementById('team-table-body');
    const searchInput = document.getElementById('search-input');
    const roleFilter = document.getElementById('filter-role');
    const addMemberBtn = document.getElementById('btn-add-member');

    let currentUserId = null;
    let currentUserRole = ''; // Para validar permisos en UI

    init();

    function init() {
        getSession();
        setupEventListeners();
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

    // --- SESIÓN ---
    async function getSession() {
        try {
            const res = await fetch("https://cambiosorion.cl/data/session_status.php", { credentials: "include" });
            const data = await res.json();
            
            if (!data.isAuthenticated) {
                window.location.href = 'https://admin.cambiosorion.cl/login';
                return;
            }

            currentUserId = data.equipo_id;
            const role = (data.rol || '').toLowerCase().trim();
            
            if (!['socio', 'admin', 'gerente', 'rrhh'].includes(role)) {
                alert("Acceso restringido");
                window.location.href = 'index';
                return;
            }

            if(headerName) headerName.textContent = formatName(data.nombre);
            if(headerEmail) headerEmail.textContent = data.correo;
            if(headerBadge) {
                headerBadge.textContent = "PORTAL ADMIN";
                headerBadge.className = "hidden md:inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-indigo-600 text-white border border-indigo-500/30 tracking-wider uppercase shadow-lg shadow-indigo-500/20";
            }

            loadSidebar();
            fetchEmployees();

        } catch (error) {
            console.error(error);
        }
    }

    function loadSidebar() {
        fetch('sidebar.html').then(r => r.text()).then(html => {
            if(sidebarContainer) {
                sidebarContainer.innerHTML = html;
                sidebarContainer.querySelectorAll('.admin-only').forEach(el => el.classList.remove('hidden'));
                const active = sidebarContainer.querySelector('a[href="equipo"]');
                if(active) active.classList.add('bg-indigo-50', 'text-indigo-700', 'font-bold');
            }
        });
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
                actionHtml = `<button onclick="window.location.href='detalle_int?id=${u.id}'" class="text-indigo-600 hover:text-indigo-900 font-medium hover:underline flex items-center justify-end w-full">
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
        addMemberBtn.addEventListener('click', () => window.location.href = 'detalle_int?id=new');
    }
});