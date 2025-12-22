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
    
    // Modal Elements
    const modal = document.getElementById('modal-member');
    const modalTitle = document.getElementById('modal-title');
    const modalClose = document.getElementById('modal-close');
    const modalCancel = document.getElementById('modal-cancel');
    const modalSave = document.getElementById('modal-save');
    const memberForm = document.getElementById('member-form');

    // Estado Local
    let currentUserId = null;
    let employeesData = [];

    // --- INIT ---
    getSession();
    setupEventListeners();

    // --- SESSION ---
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
            const superUsers = ['socio', 'admin', 'gerente', 'rrhh'];
            
            if (!superUsers.includes(role)) {
                alert("Acceso restringido");
                window.location.href = 'index';
                return;
            }

            if(headerName) headerName.textContent = (data.nombre || 'Usuario').split(' ')[0];
            if(headerEmail) headerEmail.textContent = data.correo;
            
            if(headerBadge) {
                headerBadge.textContent = "PORTAL RRHH";
                headerBadge.className = "hidden md:inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 tracking-wider uppercase";
            }

            loadSidebar();
            fetchEmployees(); // Cargar datos iniciales

        } catch (error) {
            console.error(error);
        }
    }

    function loadSidebar() {
        fetch('sidebar.html')
            .then(res => res.text())
            .then(html => {
                if(sidebarContainer) {
                    sidebarContainer.innerHTML = html;
                    sidebarContainer.querySelectorAll('.admin-only').forEach(item => item.classList.remove('hidden'));
                    const active = sidebarContainer.querySelector('a[href="equipo"]');
                    if(active) active.classList.add('bg-indigo-50', 'text-indigo-700', 'font-bold');
                }
            });
    }

    // --- FETCH DATA (GET) ---
    async function fetchEmployees() {
        const search = searchInput.value;
        const role = roleFilter.value;

        tableBody.innerHTML = '<tr><td colspan="5" class="text-center py-8">Cargando...</td></tr>';

        try {
            const url = `https://cambiosorion.cl/data/equipo.php?search=${encodeURIComponent(search)}&role=${role}`;
            const res = await fetch(url);
            const json = await res.json();

            if(json.success) {
                employeesData = json.data;
                renderTable(employeesData);
            } else {
                tableBody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-red-500">${json.message}</td></tr>`;
            }
        } catch (e) {
            console.error(e);
            tableBody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-red-500">Error de conexión</td></tr>`;
        }
    }

    // --- RENDER TABLE ---
    function renderTable(data) {
        tableBody.innerHTML = '';
        
        if(data.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="5" class="text-center py-8 text-slate-400">No se encontraron resultados.</td></tr>`;
            return;
        }

        data.forEach(u => {
            const tr = document.createElement('tr');
            tr.className = "bg-white border-b hover:bg-slate-50 transition";
            
            // Nota: Usamos siempre 'Activo' porque la BD no tiene columna estado
            const statusBadge = '<span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800">Activo</span>';

            tr.innerHTML = `
                <td class="px-6 py-4">
                    <div class="flex items-center">
                        <div class="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs mr-3">
                            ${getInitials(u.nombre)}
                        </div>
                        <div>
                            <div class="font-bold text-slate-800">${u.nombre}</div>
                            <div class="text-xs text-slate-500">${u.email}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 text-slate-600">${u.rol}</td>
                <td class="px-6 py-4 text-slate-500">${formatDate(u.fecha_ingreso)}</td>
                <td class="px-6 py-4">${statusBadge}</td>
                <td class="px-6 py-4 text-right">
                    <button onclick="window.editMember(${u.id})" class="text-indigo-600 hover:text-indigo-900 font-medium hover:underline">Editar</button>
                </td>
            `;
            tableBody.appendChild(tr);
        });
    }

    // --- MODAL & SAVE (POST) ---
    function openModal(mode, userData = null) {
        modal.classList.remove('hidden');
        if (mode === 'create') {
            modalTitle.textContent = "Nuevo Integrante";
            modalSave.textContent = "Guardar Integrante";
            memberForm.reset();
            document.getElementById('member-id').value = "0";
            // Checkbox activo por defecto (aunque no se guarde en BD)
            document.getElementById('m-active').checked = true;
        } else {
            modalTitle.textContent = "Editar Integrante";
            modalSave.textContent = "Actualizar Datos";
            
            // Populate form
            document.getElementById('member-id').value = userData.id;
            document.getElementById('m-name').value = userData.nombre;
            document.getElementById('m-rut').value = userData.rut;
            document.getElementById('m-email').value = userData.email;
            document.getElementById('m-phone').value = userData.telefono || '';
            document.getElementById('m-role').value = userData.rol;
            document.getElementById('m-contract').value = userData.tipo_contrato;
            document.getElementById('m-date').value = userData.fecha_ingreso;
            document.getElementById('m-salary').value = userData.sueldo_liquido;
            
            // Visualmente lo mostramos activo
            document.getElementById('m-active').checked = true; 
        }
    }

    async function saveMember() {
        const id = document.getElementById('member-id').value;
        
        // Mapeo de campos HTML -> BD
        const payload = {
            current_user_id: currentUserId,
            id: id,
            nombre: document.getElementById('m-name').value,
            rut: document.getElementById('m-rut').value,
            email: document.getElementById('m-email').value,
            telefono: document.getElementById('m-phone').value,
            rol: document.getElementById('m-role').value,
            tipo_contrato: document.getElementById('m-contract').value,
            fecha_ingreso: document.getElementById('m-date').value,
            sueldo_liquido: document.getElementById('m-salary').value
            // Nota: m-active se ignora porque no hay columna en BD
        };

        modalSave.disabled = true;
        modalSave.textContent = "Guardando...";

        try {
            const res = await fetch("https://cambiosorion.cl/data/equipo.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            const json = await res.json();

            if (json.success) {
                closeModal();
                fetchEmployees(); // Refrescar lista
                // Opcional: alert("Guardado correctamente");
            } else {
                alert("Error: " + json.message);
            }
        } catch (e) {
            console.error(e);
            alert("Error de conexión");
        } finally {
            modalSave.disabled = false;
        }
    }

    function closeModal() {
        modal.classList.add('hidden');
    }

    function setupEventListeners() {
        // Filtros (Debounce para búsqueda podría ser buena mejora, por ahora input directo)
        searchInput.addEventListener('input', fetchEmployees);
        roleFilter.addEventListener('change', fetchEmployees);
        
        addMemberBtn.addEventListener('click', () => openModal('create'));
        modalClose.addEventListener('click', closeModal);
        modalCancel.addEventListener('click', closeModal);
        
        modalSave.addEventListener('click', (e) => {
            e.preventDefault();
            if(memberForm.checkValidity()) {
                saveMember();
            } else {
                memberForm.reportValidity();
            }
        });

        // Global function for onclick in table
        window.editMember = (id) => {
            const user = employeesData.find(u => u.id === id);
            if(user) openModal('edit', user);
        };
    }

    // --- UTILS ---
    function getInitials(name) {
        if(!name) return '??';
        return name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();
    }

    function formatDate(dateStr) {
        if(!dateStr) return '-';
        // Ajuste zona horaria simple
        const parts = dateStr.split('-');
        if(parts.length < 3) return dateStr;
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
});