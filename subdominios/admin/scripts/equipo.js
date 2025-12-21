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

    // State
    let users = [
        { id: 1, name: "Juan Pérez", rut: "12.345.678-9", email: "jperez@cambiosorion.cl", role: "Cajero", date: "2023-03-15", status: true },
        { id: 2, name: "Maria Soto", rut: "9.876.543-2", email: "msoto@cambiosorion.cl", role: "Tesorero", date: "2022-01-10", status: true },
        { id: 3, name: "Carlos Diaz", rut: "15.555.444-K", email: "cdiaz@cambiosorion.cl", role: "Administrativo", date: "2024-05-20", status: false }
    ];

    // --- INIT ---
    getSession();
    setupEventListeners();

    // --- SESSION ---
    async function getSession() {
        try {
            const res = await fetch("https://cambiosorion.cl/data/session_status.php", { credentials: "include" });
            if (!res.ok) throw new Error("Error sesión");
            const data = await res.json();
            
            if (!data.isAuthenticated) {
                window.location.href = 'https://admin.cambiosorion.cl/login';
                return;
            }

            // Security Check
            const role = (data.rol || '').toLowerCase().trim();
            const superUsers = ['socio', 'admin', 'gerente'];
            
            if (!superUsers.includes(role)) {
                alert("Acceso restringido");
                window.location.href = 'index';
                return;
            }

            // UI
            if(headerName) headerName.textContent = (data.nombre || 'Usuario').split(' ')[0];
            if(headerEmail) headerEmail.textContent = data.correo;
            
            if(headerBadge) {
                headerBadge.textContent = "PORTAL SOCIOS";
                headerBadge.className = "hidden md:inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 tracking-wider uppercase";
            }

            loadSidebar();
            renderTable();

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
                    const adminItems = sidebarContainer.querySelectorAll('.admin-only');
                    adminItems.forEach(item => item.classList.remove('hidden'));
                    
                    const active = sidebarContainer.querySelector('a[href="equipo"]');
                    if(active) active.classList.add('bg-indigo-50', 'text-indigo-700', 'font-bold');
                }
            });
    }

    // --- RENDER ---
    function renderTable() {
        tableBody.innerHTML = '';
        const search = searchInput.value.toLowerCase();
        const role = roleFilter.value.toLowerCase();

        const filtered = users.filter(u => {
            const matchSearch = u.name.toLowerCase().includes(search) || u.rut.includes(search);
            const matchRole = role === 'all' || u.role.toLowerCase() === role;
            return matchSearch && matchRole;
        });

        if(filtered.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="5" class="text-center py-8 text-slate-400">No se encontraron resultados.</td></tr>`;
            return;
        }

        filtered.forEach(u => {
            const tr = document.createElement('tr');
            tr.className = "bg-white border-b hover:bg-slate-50 transition";
            
            const statusBadge = u.status 
                ? '<span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800">Activo</span>'
                : '<span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-500">Inactivo</span>';

            tr.innerHTML = `
                <td class="px-6 py-4">
                    <div class="flex items-center">
                        <div class="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs mr-3">
                            ${getInitials(u.name)}
                        </div>
                        <div>
                            <div class="font-bold text-slate-800">${u.name}</div>
                            <div class="text-xs text-slate-500">${u.email}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 text-slate-600">${u.role}</td>
                <td class="px-6 py-4 text-slate-500">${formatDate(u.date)}</td>
                <td class="px-6 py-4">${statusBadge}</td>
                <td class="px-6 py-4 text-right">
                    <button onclick="window.editMember(${u.id})" class="text-indigo-600 hover:text-indigo-900 font-medium hover:underline">Editar</button>
                </td>
            `;
            tableBody.appendChild(tr);
        });
    }

    // --- MODAL LOGIC ---
    function openModal(mode, userData = null) {
        modal.classList.remove('hidden');
        if (mode === 'create') {
            modalTitle.textContent = "Nuevo Integrante";
            modalSave.textContent = "Guardar Integrante";
            memberForm.reset();
            document.getElementById('m-active').checked = true;
        } else {
            modalTitle.textContent = "Editar Integrante";
            modalSave.textContent = "Actualizar Datos";
            
            // Populate form
            document.getElementById('member-id').value = userData.id;
            document.getElementById('m-name').value = userData.name;
            document.getElementById('m-rut').value = userData.rut;
            document.getElementById('m-email').value = userData.email;
            document.getElementById('m-role').value = userData.role;
            document.getElementById('m-date').value = userData.date;
            document.getElementById('m-active').checked = userData.status;
            // Fake salary population
            document.getElementById('m-salary').value = 650000;
        }
    }

    function closeModal() {
        modal.classList.add('hidden');
    }

    function setupEventListeners() {
        searchInput.addEventListener('input', renderTable);
        roleFilter.addEventListener('change', renderTable);
        
        addMemberBtn.addEventListener('click', () => openModal('create'));
        modalClose.addEventListener('click', closeModal);
        modalCancel.addEventListener('click', closeModal);
        
        modalSave.addEventListener('click', (e) => {
            e.preventDefault();
            // Aquí iría la lógica fetch POST/PUT
            alert("Datos guardados (Simulación)");
            closeModal();
            renderTable();
        });

        // Global function for onclick in table
        window.editMember = (id) => {
            const user = users.find(u => u.id === id);
            if(user) openModal('edit', user);
        };
    }

    // --- UTILS ---
    function getInitials(name) {
        return name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();
    }

    function formatDate(dateStr) {
        return new Date(dateStr).toLocaleDateString('es-CL');
    }
});