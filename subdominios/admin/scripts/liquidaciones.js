document.addEventListener('DOMContentLoaded', () => {
    // Referencias DOM
    const headerBadge = document.getElementById('header-badge');
    const headerName = document.getElementById('header-user-name');
    const headerEmail = document.getElementById('dropdown-user-email');
    const sidebarContainer = document.getElementById('sidebar-container');
    const yearSelector = document.getElementById('year-selector');
    const adminControls = document.getElementById('admin-controls');
    const employeeSelect = document.getElementById('employee-select');
    const tableBody = document.getElementById('liquidaciones-table-body');
    const tableTitle = document.querySelector('h3.text-lg');

    // Estado
    let currentUserId = null;
    let currentUserRole = null;
    let selectedFilterUser = 'me'; 

    // --- INIT ---
    initYearSelector();
    getSession();

    function initYearSelector() {
        if (!yearSelector) return;
        const currentYear = new Date().getFullYear();
        yearSelector.innerHTML = ''; // Limpiar opciones previas
        for (let i = currentYear; i >= 2020; i--) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i;
            yearSelector.appendChild(option);
        }
        yearSelector.addEventListener('change', () => fetchLiquidaciones());
    }

    // --- 1. Obtener Sesión (Fuente de Verdad) ---
    async function getSession() {
        try {
            // Solicitamos la sesión al archivo que sí funciona bien con cookies
            const res = await fetch("https://cambiosorion.cl/data/session_status.php", {
                credentials: "include"
            });
            const data = await res.json();
            
            // Si no hay sesión válida, redirigir
            if (!data.isAuthenticated || !data.equipo_id) {
                console.warn("Sesión no válida en session_status.php");
                window.location.href = 'https://admin.cambiosorion.cl/login';
                return;
            }

            // Datos obtenidos
            currentUserId = data.equipo_id;
            currentUserRole = (data.rol || '').toLowerCase().trim();
            
            // UI Header
            if(headerName) headerName.textContent = (data.nombre || 'Usuario').split(' ')[0];
            if(headerEmail) headerEmail.textContent = data.correo;

            // Configurar UI según Rol
            configureViewByRole(currentUserRole);
            
            // Iniciar carga de datos (Ahora que tenemos el ID)
            fetchLiquidaciones();

        } catch (error) {
            console.error("Error crítico obteniendo sesión:", error);
        }
    }

    // --- 2. Vista según Rol ---
    function configureViewByRole(rol) {
        const superUsers = ['socio', 'admin', 'gerente', 'rrhh'];
        const isSuperUser = superUsers.includes(rol);

        fetch('sidebar.html')
            .then(res => res.text())
            .then(html => {
                if(sidebarContainer) {
                    sidebarContainer.innerHTML = html;
                    if (isSuperUser) {
                        sidebarContainer.querySelectorAll('.admin-only').forEach(el => el.classList.remove('hidden'));
                    }
                    const activeLink = sidebarContainer.querySelector('a[href="liquidaciones"]');
                    if(activeLink) {
                        activeLink.classList.add('bg-indigo-50', 'text-indigo-700', 'font-bold');
                        activeLink.classList.remove('text-slate-600');
                    }
                }
            });

        if (isSuperUser) {
            if(headerBadge) {
                headerBadge.textContent = "PORTAL ADMIN";
                headerBadge.className = "hidden md:inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 tracking-wider uppercase";
            }
            if(adminControls) adminControls.classList.remove('hidden');
            if(tableTitle) tableTitle.textContent = "Liquidaciones del Equipo";
            loadEmployeesList(); 
        } else {
            if(headerBadge) {
                headerBadge.textContent = "PORTAL ORION";
                headerBadge.className = "hidden md:inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 tracking-wider uppercase";
            }
            if(adminControls) adminControls.classList.add('hidden');
            if(tableTitle) tableTitle.textContent = "Mis Liquidaciones";
        }
    }

    async function loadEmployeesList() {
        if (!employeeSelect) return;
        employeeSelect.addEventListener('change', (e) => {
            selectedFilterUser = e.target.value; 
            fetchLiquidaciones();
        });
    }

    // --- 3. Fetch Liquidaciones (API Call) ---
    async function fetchLiquidaciones() {
        // Seguridad: No llamar si no tenemos el ID del usuario
        if (!currentUserId || !tableBody) return;
        
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center py-4">Cargando...</td></tr>';

        const year = yearSelector ? yearSelector.value : new Date().getFullYear();
        
        // PARAMETROS URL: Enviamos current_user_id explícitamente
        let url = `https://cambiosorion.cl/data/liquidaciones.php?year=${year}&current_user_id=${currentUserId}`;
        
        if (selectedFilterUser) {
            url += `&user_id=${selectedFilterUser}`;
        }

        try {
            // Nota: No necesitamos credentials: 'include' aquí porque pasamos el ID en la URL
            // y PHP ya no verifica la cookie de sesión, sino el ID y la BD.
            const res = await fetch(url);
            
            // Verificar respuesta HTTP
            if (!res.ok) {
                throw new Error(`Error HTTP: ${res.status}`);
            }

            const result = await res.json();

            if (!result.success) {
                if(result.message === 'No autorizado' || result.message === 'Usuario no válido') {
                     console.warn("API rechazó el ID de usuario.");
                     window.location.href = 'https://admin.cambiosorion.cl/login';
                     return;
                }
                tableBody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-red-500">${result.message}</td></tr>`;
                return;
            }

            renderTable(result.data);

        } catch (error) {
            console.error("Error fetch liquidaciones:", error);
            tableBody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-red-500">Error de conexión con el servidor</td></tr>`;
        }
    }

    function renderTable(data) {
        tableBody.innerHTML = '';

        if (data.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="5" class="text-center py-8 text-slate-400">No hay documentos disponibles para este periodo.</td></tr>`;
            return;
        }

        data.forEach(item => {
            let badgeClass = 'bg-gray-100 text-gray-800';
            if (item.estado === 'Firmado' || item.estado === 'Pagado') badgeClass = 'bg-green-100 text-green-800 border-green-200';
            if (item.estado === 'Pendiente') badgeClass = 'bg-yellow-100 text-yellow-800 border-yellow-200';

            const showName = (currentUserRole !== 'administrativo' && currentUserRole !== 'cajero' && selectedFilterUser === 'all');
            const colNameHtml = showName ? `<div class="text-xs text-slate-400">${item.colaborador}</div>` : '';

            const row = document.createElement('tr');
            row.className = "bg-white border-b hover:bg-slate-50 transition";
            row.innerHTML = `
                <td class="px-6 py-4 font-medium text-slate-900">
                    ${item.mes}
                    ${colNameHtml}
                </td>
                <td class="px-6 py-4">${yearSelector.value}</td>
                <td class="px-6 py-4 text-slate-500 font-mono">$ ${item.monto}</td>
                <td class="px-6 py-4 text-center">
                    <span class="px-2.5 py-0.5 rounded-full text-xs font-bold border ${badgeClass}">
                        ${item.estado}
                    </span>
                </td>
                <td class="px-6 py-4 text-right">
                    <a href="${item.url}" target="_blank" class="text-indigo-600 hover:text-indigo-900 font-medium hover:underline flex items-center justify-end">
                        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                        Descargar
                    </a>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }
});