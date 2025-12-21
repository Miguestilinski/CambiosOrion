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

    let currentUserId = null;
    let currentUserRole = null;
    let selectedUserId = 'me'; // 'me' o un ID específico

    // 1. Inicialización
    initYearSelector();
    getSession();

    function initYearSelector() {
        const currentYear = new Date().getFullYear();
        for (let i = currentYear; i >= 2020; i--) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i;
            yearSelector.appendChild(option);
        }
        yearSelector.addEventListener('change', () => fetchLiquidaciones());
    }

    // 2. Obtener Sesión y Rol
    async function getSession() {
        try {
            const res = await fetch("https://cambiosorion.cl/data/session_status.php", {
                credentials: "include"
            });
            if (!res.ok) throw new Error("Error sesión");
            
            const data = await res.json();
            
            if (!data.isAuthenticated || !data.equipo_id) {
                window.location.href = 'https://admin.cambiosorion.cl/login';
                return;
            }

            currentUserId = data.equipo_id;
            currentUserRole = (data.rol || '').toLowerCase().trim();
            const nombre = data.nombre || 'Usuario';

            // UI Básica
            if (headerName) headerName.textContent = nombre.split(' ')[0];
            if (headerEmail) headerEmail.textContent = data.correo;

            configureViewByRole(currentUserRole);
            fetchLiquidaciones(); // Cargar datos iniciales

        } catch (error) {
            console.error(error);
            window.location.href = 'https://admin.cambiosorion.cl/login';
        }
    }

    // 3. Configuración según Rol
    function configureViewByRole(rol) {
        const superUsers = ['socio', 'admin', 'gerente']; 
        const isSuperUser = superUsers.includes(rol);

        // Sidebar
        fetch('sidebar.html')
            .then(res => res.text())
            .then(html => {
                if(sidebarContainer) {
                    sidebarContainer.innerHTML = html;
                    const adminItems = sidebarContainer.querySelectorAll('.admin-only');
                    if (isSuperUser) adminItems.forEach(item => item.classList.remove('hidden'));
                    else adminItems.forEach(item => item.remove());
                    
                    // Activar link actual
                    const active = sidebarContainer.querySelector('a[href="liquidaciones"]');
                    if(active) active.classList.add('bg-indigo-50', 'text-indigo-700', 'font-bold');
                }
            });

        // Badge Header
        if (headerBadge) {
            if(isSuperUser) {
                headerBadge.textContent = "PORTAL SOCIOS";
                headerBadge.className = "hidden md:inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 tracking-wider uppercase";
                
                // Mostrar controles Admin
                adminControls.classList.remove('hidden');
                loadEmployeesList(); // Cargar lista para el select
            } else {
                headerBadge.textContent = "PORTAL COLABORADOR";
                headerBadge.className = "hidden md:inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 tracking-wider uppercase";
                
                // Ocultar controles Admin
                adminControls.remove();
            }
        }
    }

    // 4. Cargar lista de empleados (Solo Admin)
    async function loadEmployeesList() {
        // Aquí deberías llamar a tu API real: /data/get_employees.php
        // Simulación:
        const mockEmployees = [
            { id: 101, nombre: "Juan Pérez" },
            { id: 102, nombre: "María González" },
            { id: 103, nombre: "Carlos Ruiz" }
        ];

        mockEmployees.forEach(emp => {
            const option = document.createElement('option');
            option.value = emp.id;
            option.textContent = emp.nombre;
            employeeSelect.appendChild(option);
        });

        employeeSelect.addEventListener('change', (e) => {
            selectedUserId = e.target.value;
            fetchLiquidaciones(); // Recargar tabla con el nuevo usuario
        });
    }

    // 5. Cargar Liquidaciones (Tabla)
    async function fetchLiquidaciones() {
        const year = yearSelector.value;
        const targetUser = selectedUserId === 'me' ? currentUserId : selectedUserId;

        tableBody.innerHTML = `<tr><td colspan="5" class="text-center py-8"><div class="animate-spin h-8 w-8 border-4 border-indigo-500 rounded-full border-t-transparent mx-auto"></div></td></tr>`;

        // SIMULACIÓN DE DATOS (Reemplazar con fetch real)
        // const res = await fetch(`https://cambiosorion.cl/data/liquidaciones.php?user_id=${targetUser}&year=${year}`);
        // const data = await res.json();
        
        // Mock data para que veas el diseño funcionando
        setTimeout(() => {
            const mockData = [
                { mes: "Enero", fecha: "2025-01-30", estado: "Firmado", url: "#" },
                { mes: "Febrero", fecha: "2025-02-28", estado: "Pendiente", url: "#" }
            ];
            
            renderTable(mockData, year);
        }, 500);
    }

    function renderTable(data, year) {
        if (!data || data.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="px-6 py-12 text-center text-slate-400">
                        <div class="flex flex-col items-center justify-center">
                            <svg class="w-12 h-12 mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                            <p class="font-medium">No hay liquidaciones disponibles para el año ${year}</p>
                        </div>
                    </td>
                </tr>`;
            return;
        }

        tableBody.innerHTML = '';
        data.forEach(item => {
            const estadoClass = item.estado === 'Firmado' 
                ? 'bg-green-100 text-green-800 border-green-200' 
                : 'bg-yellow-100 text-yellow-800 border-yellow-200';

            const row = `
                <tr class="bg-white border-b hover:bg-slate-50 transition">
                    <td class="px-6 py-4 font-medium text-slate-900">${item.mes}</td>
                    <td class="px-6 py-4">${year}</td>
                    <td class="px-6 py-4 text-slate-500">${item.fecha}</td>
                    <td class="px-6 py-4 text-center">
                        <span class="px-2.5 py-0.5 rounded-full text-xs font-bold border ${estadoClass}">
                            ${item.estado}
                        </span>
                    </td>
                    <td class="px-6 py-4 text-right">
                        <a href="${item.url}" target="_blank" class="text-indigo-600 hover:text-indigo-900 font-medium hover:underline flex items-center justify-end">
                            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                            Descargar
                        </a>
                    </td>
                </tr>
            `;
            tableBody.insertAdjacentHTML('beforeend', row);
        });
    }
});