document.addEventListener('DOMContentLoaded', () => {
    // Referencias DOM
    const headerBadge = document.getElementById('header-badge');
    const headerName = document.getElementById('header-user-name');
    const headerEmail = document.getElementById('dropdown-user-email');
    const sidebarContainer = document.getElementById('sidebar-container');
    
    // Filtros y Tablas
    const yearSelector = document.getElementById('year-selector');
    const adminControls = document.getElementById('admin-controls');
    const employeeSelect = document.getElementById('employee-select');
    const tableBody = document.getElementById('liquidaciones-table-body');
    const tableTitle = document.querySelector('h3.text-lg'); // "Mis Liquidaciones" o "Liquidaciones de Equipo"

    // Estado
    let currentUserId = null;
    let currentUserRole = null;
    let selectedFilterUser = 'me'; // Por defecto ver las mías

    // --- INIT ---
    initYearSelector();
    getSession();

    function initYearSelector() {
        if (!yearSelector) return;
        const currentYear = new Date().getFullYear();
        yearSelector.innerHTML = '';
        for (let i = currentYear; i >= 2020; i--) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i;
            yearSelector.appendChild(option);
        }
        yearSelector.addEventListener('change', fetchLiquidaciones);
    }

    // --- 1. Obtener Sesión y Rol ---
    async function getSession() {
        try {
            const res = await fetch("https://cambiosorion.cl/data/session_status.php", {
                credentials: "include"
            });
            const data = await res.json();
            
            if (!data.isAuthenticated || !data.equipo_id) {
                window.location.href = 'https://admin.cambiosorion.cl/login';
                return;
            }

            currentUserId = data.equipo_id;
            currentUserRole = (data.rol || '').toLowerCase().trim();
            
            // Header Info
            if(headerName) headerName.textContent = (data.nombre || 'Usuario').split(' ')[0];
            if(headerEmail) headerEmail.textContent = data.correo;

            // Configurar vista según Rol
            configureViewByRole(currentUserRole);
            
            // Cargar datos iniciales
            fetchLiquidaciones();

        } catch (error) {
            console.error("Error sesión:", error);
        }
    }

    // --- 2. Configurar Vista (Admin vs User) ---
    function configureViewByRole(rol) {
        const superUsers = ['socio', 'admin', 'gerente', 'rrhh'];
        const isSuperUser = superUsers.includes(rol);

        // Cargar Sidebar
        fetch('sidebar.html')
            .then(res => res.text())
            .then(html => {
                if(sidebarContainer) {
                    sidebarContainer.innerHTML = html;
                    if (isSuperUser) {
                        sidebarContainer.querySelectorAll('.admin-only').forEach(el => el.classList.remove('hidden'));
                    }
                    const active = sidebarContainer.querySelector('a[href="liquidaciones"]');
                    if(active) active.classList.add('bg-indigo-50', 'text-indigo-700', 'font-bold');
                }
            });

        // Configurar Header Badge y Controles
        if (isSuperUser) {
            if(headerBadge) {
                headerBadge.textContent = "PORTAL ADMIN";
                headerBadge.className = "hidden md:inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 tracking-wider uppercase";
            }
            
            // Mostrar controles de admin
            if(adminControls) adminControls.classList.remove('hidden');
            if(tableTitle) tableTitle.textContent = "Liquidaciones del Equipo";
            
            // Cargar lista de empleados para el filtro (podrías hacer un fetch a equipo.php si existiera un endpoint lista simple)
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

    // --- 3. Cargar Lista de Empleados (Solo Admin) ---
    async function loadEmployeesList() {
        if (!employeeSelect) return;
        
        // Nota: Idealmente deberías tener un endpoint ligero solo para lista de nombres
        // Usaremos 'equipo.php' si existe, o dejaremos el select básico funcional
        try {
            // Aquí simulamos o llamamos a un endpoint real si lo tienes.
            // Por ahora, el select tiene opciones estáticas en el HTML o lo dejamos dinámico.
            // Si quieres llenarlo dinámicamente:
            /*
            const res = await fetch('https://cambiosorion.cl/data/equipo.php?mode=list');
            const users = await res.json();
            users.forEach(u => {
                const opt = new Option(u.nombre, u.id);
                employeeSelect.appendChild(opt);
            });
            */
            
            employeeSelect.addEventListener('change', (e) => {
                selectedFilterUser = e.target.value; // 'all', 'me', o un ID
                fetchLiquidaciones();
            });

        } catch (error) {
            console.error("Error cargando empleados:", error);
        }
    }

    // --- 4. Fetch Liquidaciones ---
    async function fetchLiquidaciones() {
        if (!tableBody) return;
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center py-4">Cargando...</td></tr>';

        const year = yearSelector ? yearSelector.value : new Date().getFullYear();
        
        // Construir URL con filtros
        let url = `https://cambiosorion.cl/data/liquidaciones.php?year=${year}`;
        if (selectedFilterUser) {
            url += `&user_id=${selectedFilterUser}`;
        }

        try {
            const res = await fetch(url, { credentials: 'include' });
            const result = await res.json();

            if (!result.success) {
                tableBody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-red-500">${result.message || 'Error'}</td></tr>`;
                return;
            }

            renderTable(result.data);

        } catch (error) {
            console.error("Error fetch:", error);
            tableBody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-red-500">Error de conexión</td></tr>`;
        }
    }

    // --- 5. Render Tabla ---
    function renderTable(data) {
        tableBody.innerHTML = '';

        if (data.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="5" class="text-center py-8 text-slate-400">No hay liquidaciones encontradas para este periodo.</td></tr>`;
            return;
        }

        data.forEach(item => {
            // Estilos de estado
            let badgeClass = 'bg-gray-100 text-gray-800';
            if (item.estado === 'Firmado' || item.estado === 'Pagado') badgeClass = 'bg-green-100 text-green-800 border-green-200';
            if (item.estado === 'Pendiente') badgeClass = 'bg-yellow-100 text-yellow-800 border-yellow-200';

            const row = document.createElement('tr');
            row.className = "bg-white border-b hover:bg-slate-50 transition";
            
            // Determinar si mostrar nombre del colaborador (solo si es admin viendo a todos)
            const showName = (currentUserRole !== 'administrativo' && currentUserRole !== 'cajero' && selectedFilterUser === 'all');
            const colNameHtml = showName ? `<div class="text-xs text-slate-400">${item.colaborador}</div>` : '';

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