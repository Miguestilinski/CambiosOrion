document.addEventListener('DOMContentLoaded', () => {
    // Referencias
    const headerName = document.getElementById('header-user-name');
    const headerBadge = document.getElementById('header-badge');
    const sidebarContainer = document.getElementById('sidebar-container');
    const boxesGrid = document.getElementById('boxes-grid');
    const permissionsTable = document.getElementById('permissions-table-body');
    const readOnlyBadge = document.getElementById('read-only-badge');

    // Modales
    const modalAssign = document.getElementById('modal-assign');
    const modalBoxName = document.getElementById('modal-box-name');
    const modalUserSelect = document.getElementById('user-select');
    const modalCancel = document.getElementById('modal-cancel');
    const modalConfirm = document.getElementById('modal-confirm');
    const targetBoxIdInput = document.getElementById('target-box-id');

    const modalUnassign = document.getElementById('modal-unassign');
    const modalUnassignCancel = document.getElementById('modal-unassign-cancel');
    const modalUnassignConfirm = document.getElementById('modal-unassign-confirm');
    const targetUnassignUserIdInput = document.getElementById('target-unassign-user-id');

    const modalNotif = document.getElementById('modal-notification');
    const modalIcon = document.getElementById('modal-icon-container');
    const modalTitle = document.getElementById('modal-title');
    const modalMsg = document.getElementById('modal-message');
    const modalBtn = document.getElementById('modal-btn');

    let currentUserId = null;
    let isSocio = false; // Flag de permisos
    let boxesData = [];
    let usersData = [];

    init();

    function init() {
        getSession();
        setupEventListeners();
    }

    // --- ALERTAS ---
    function showAlert(title, message, isError = false, callback = null) {
        const iconSuccess = `<svg class="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`;
        const iconError = `<svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>`;

        modalIcon.innerHTML = isError ? iconError : iconSuccess;
        modalIcon.className = isError ? "w-16 h-16 bg-red-100 rounded-full flex justify-center items-center mx-auto mb-4" : "w-16 h-16 bg-green-100 rounded-full flex justify-center items-center mx-auto mb-4";
        modalTitle.textContent = title;
        modalMsg.textContent = message;
        
        modalBtn.className = isError ? "w-full px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold" : "w-full px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold";

        modalBtn.onclick = () => {
            modalNotif.classList.add('hidden');
            if(callback) callback();
        };
        modalNotif.classList.remove('hidden');
    }

    function formatName(fullName) {
        if (!fullName) return '';
        const parts = fullName.trim().split(/\s+/);
        if (parts.length >= 3) return `${parts[0]} ${parts[2]}`;
        if (parts.length === 2) return `${parts[0]} ${parts[1]}`;
        return parts[0];
    }

    async function getSession() {
        try {
            const res = await fetch("https://cambiosorion.cl/data/session_status.php", { credentials: "include" });
            const data = await res.json();
            
            if (!data.isAuthenticated) return window.location.href = 'https://admin.cambiosorion.cl/login';

            currentUserId = data.equipo_id;
            const role = (data.rol || '').toLowerCase().trim();
            if (!['socio', 'admin', 'gerente'].includes(role)) {
                showAlert("Acceso Denegado", "No autorizado.", true, () => window.location.href = 'index');
                return;
            }

            headerName.textContent = formatName(data.nombre);
            loadSidebar();
            fetchData(); 

        } catch (error) { console.error(error); }
    }

    function loadSidebar() {
        fetch('sidebar.html').then(r => r.text()).then(html => {
            if(sidebarContainer) {
                sidebarContainer.innerHTML = html;
                sidebarContainer.querySelectorAll('.admin-only').forEach(el => el.classList.remove('hidden'));
                const active = sidebarContainer.querySelector('a[href="roles"]');
                if(active) active.classList.add('bg-indigo-50', 'text-indigo-700', 'font-bold');
            }
        });
    }

    async function fetchData() {
        boxesGrid.innerHTML = '<div class="col-span-full text-center py-10 text-slate-500">Cargando...</div>';
        try {
            const res = await fetch(`https://cambiosorion.cl/data/roles.php?current_user_id=${currentUserId}`);
            const json = await res.json();
            if (json.success) {
                boxesData = json.boxes;
                usersData = json.users;
                isSocio = json.is_socio; // Backend me dice si soy socio
                
                // Mostrar badge de solo lectura si no es socio
                if (!isSocio) {
                    readOnlyBadge.classList.remove('hidden');
                }

                renderBoxes();
                renderPermissions();
            } else {
                showAlert("Error", json.message, true);
            }
        } catch (e) {
            console.error(e);
            showAlert("Error", "Error de conexión.", true);
        }
    }

    // --- RENDER PERMISOS ---
    function renderPermissions() {
        permissionsTable.innerHTML = '';
        const filteredUsers = usersData.filter(u => u.role.toLowerCase() !== 'socio');

        filteredUsers.forEach(u => {
            const p = u.permissions;
            const row = document.createElement('tr');
            row.className = "bg-white border-b hover:bg-slate-50 transition";
            
            let roleBadgeClass = 'bg-slate-100 text-slate-600';
            if(u.role.toLowerCase() === 'tesorero') roleBadgeClass = 'bg-indigo-100 text-indigo-700';
            if(u.role.toLowerCase() === 'rrhh') roleBadgeClass = 'bg-pink-100 text-pink-700';

            // Deshabilitar si NO soy socio
            const isDisabled = !isSocio;

            row.innerHTML = `
                <td class="px-6 py-4">
                    <div class="font-bold text-slate-800">${formatName(u.name)}</div>
                    <span class="inline-flex mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${roleBadgeClass}">${u.role}</span>
                </td>
                <td class="px-6 py-4 text-center">${createToggle(u.id, 'acceso_rrhh', p.acceso_rrhh, isDisabled)}</td>
                <td class="px-6 py-4 text-center">${createToggle(u.id, 'autorizar_traslados', p.autorizar_traslados, isDisabled)}</td>
                <td class="px-6 py-4 text-center">${createToggle(u.id, 'manejo_caja', p.manejo_caja, isDisabled)}</td>
                <td class="px-6 py-4 text-center">${createToggle(u.id, 'editar_pizarras', p.editar_pizarras, isDisabled)}</td>
                <td class="px-6 py-4 text-center">${createToggle(u.id, 'editar_perfil_propio', p.editar_perfil_propio, isDisabled)}</td>
            `;
            permissionsTable.appendChild(row);
        });
    }

    function createToggle(uid, key, isActive, disabled) {
        const disabledAttr = disabled ? 'disabled' : '';
        const cursorClass = disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer';
        
        return `
            <label class="inline-flex items-center ${cursorClass} relative">
                <input type="checkbox" class="sr-only peer" 
                    ${isActive ? 'checked' : ''} 
                    ${disabledAttr} 
                    onchange="window.updatePermission(${uid}, '${key}', this.checked)">
                <div class="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
        `;
    }

    // --- ACCIONES ---
    window.updatePermission = async (userId, key, value) => {
        // Doble chequeo frontend
        if(!isSocio) {
            showAlert("No Permitido", "Solo los Socios pueden editar permisos.", true);
            fetchData(); // Revertir visualmente
            return;
        }

        try {
            const res = await fetch("https://cambiosorion.cl/data/roles.php", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    action: 'update_permission',
                    current_user_id: currentUserId,
                    user_id: userId,
                    permission_key: key,
                    value: value
                })
            });
            const json = await res.json();
            if(!json.success) {
                showAlert("Error", json.message, true);
                fetchData(); 
            }
        } catch (e) { console.error(e); fetchData(); }
    };

    // --- RENDER CAJAS (Sin cambios lógicos, solo visual) ---
    function renderBoxes() {
        boxesGrid.innerHTML = '';
        boxesData.forEach(box => {
            const isMulti = box.type === 'multi'; 
            const isActive = isMulti ? box.users.length > 0 : box.currentUserId !== null;
            const isGhost = box.id === 0;
            let borderClass = isActive ? 'border-indigo-300 ring-1 ring-indigo-50' : 'border-slate-200';
            let bgClass = isGhost ? 'bg-slate-50' : 'bg-white';
            if (isGhost) borderClass = isActive ? 'border-slate-400' : 'border-slate-300 border-dashed';

            const card = document.createElement('div');
            card.className = `box-card ${bgClass} border rounded-2xl p-5 shadow-sm relative transition hover:shadow-md ${borderClass}`;
            
            let contentHtml = '';
            if (isMulti) {
                const userList = box.users.map(uid => {
                    const u = usersData.find(user => user.id === uid);
                    return u ? `<li class="text-sm text-slate-700 mb-2 flex items-center justify-between bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200"><span class="font-medium flex items-center gap-2 truncate"><span class="w-2 h-2 rounded-full bg-purple-500 shrink-0"></span> ${formatName(u.name)}</span><button onclick="window.unassignUser(${uid})" class="text-slate-400 hover:text-red-500 transition px-1 font-bold">×</button></li>` : '';
                }).join('');
                contentHtml = `<div class="flex justify-between items-start mb-3"><div class="bg-purple-100 text-purple-700 p-2.5 rounded-xl"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div><button onclick="window.openAssignModal(${box.id}, '${box.name}')" class="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-indigo-700 transition shadow-sm flex items-center gap-1">+ Asignar</button></div><h3 class="font-bold text-slate-800 text-lg mb-1">${box.name}</h3><p class="text-xs text-slate-400 mb-3">Zona de Tesorería</p><ul class="max-h-40 overflow-y-auto pr-1 custom-scrollbar">${userList || '<span class="text-xs text-slate-400 italic">Sin personal</span>'}</ul>`;
            } else {
                const user = usersData.find(u => u.id === box.currentUserId);
                contentHtml = `<div class="flex justify-between items-start mb-4"><div class="${user ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'} p-2.5 rounded-xl transition-colors">${isGhost ? '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>' : '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>'}</div>${user ? `<button onclick="window.unassignUser(${user.id})" class="text-xs text-red-500 bg-red-50 border border-red-100 px-2 py-1 rounded hover:bg-red-100 transition">Liberar</button>` : ''}</div><h3 class="font-bold text-slate-800 text-lg mb-1">${box.name}</h3><div class="mt-2">${user ? `<div class="text-sm font-bold text-indigo-700 bg-indigo-50 px-3 py-2 rounded-lg border border-indigo-100 truncate text-center" title="${user.name}">${formatName(user.name)}</div>` : `<button onclick="window.openAssignModal(${box.id}, '${box.name}')" class="w-full py-2 border-2 border-dashed border-slate-300 text-slate-400 rounded-lg text-sm hover:border-indigo-400 hover:text-indigo-600 transition font-medium">Asignar</button>`}</div>`;
            }
            card.innerHTML = contentHtml;
            boxesGrid.appendChild(card);
        });
    }

    // --- MODALES (Asignación sin cambios) ---
    window.openAssignModal = (boxId, boxName) => {
        modalBoxName.textContent = boxName;
        targetBoxIdInput.value = boxId;
        modalUserSelect.innerHTML = '<option value="">Seleccione...</option>';
        const sortedUsers = [...usersData].sort((a,b) => formatName(a.name).localeCompare(formatName(b.name)));
        sortedUsers.forEach(u => {
            const r = u.role.toLowerCase();
            if (r.includes('socio')) return;
            if (boxId === 0) {
                if (!r.includes('tesorero') && !r.includes('rrhh') && !r.includes('gerente') && !r.includes('oficial')) return;
            } else if (boxId >= 1) {
                if (!u.permissions.manejo_caja) return;
            }
            let statusLabel = '(Disponible)';
            if (u.caja_id === 99) statusLabel = '(En Tesorería)';
            else if (u.caja_id === 0) statusLabel = '(En Caja 0)';
            else if (u.caja_id !== null) statusLabel = `(En Caja ${u.caja_id})`;
            const opt = document.createElement('option');
            opt.value = u.id;
            opt.textContent = `${formatName(u.name)} ${statusLabel}`;
            modalUserSelect.appendChild(opt);
        });
        modalAssign.classList.remove('hidden');
    };

    window.unassignUser = (userId) => {
        targetUnassignUserIdInput.value = userId;
        modalUnassign.classList.remove('hidden');
    };

    function setupEventListeners() {
        modalCancel.addEventListener('click', () => modalAssign.classList.add('hidden'));
        modalConfirm.addEventListener('click', async () => {
            const boxId = targetBoxIdInput.value;
            const userId = modalUserSelect.value;
            if(!userId) {
                showAlert("Atención", "Seleccione usuario.", true);
                return;
            }
            try {
                const res = await fetch("https://cambiosorion.cl/data/roles.php", {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify({ action: 'assign_box', current_user_id: currentUserId, box_id: boxId, user_id: userId })
                });
                const json = await res.json();
                if(json.success) { modalAssign.classList.add('hidden'); fetchData(); } 
                else showAlert("Error", json.message, true);
            } catch (e) { console.error(e); }
        });

        modalUnassignCancel.addEventListener('click', () => modalUnassign.classList.add('hidden'));
        modalUnassignConfirm.addEventListener('click', async () => {
            const userId = targetUnassignUserIdInput.value;
            if(!userId) return;
            modalUnassignConfirm.textContent = 'Procesando...';
            try {
                const res = await fetch("https://cambiosorion.cl/data/roles.php", {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify({ action: 'unassign_box', current_user_id: currentUserId, user_id: userId })
                });
                const json = await res.json();
                if(json.success) { modalUnassign.classList.add('hidden'); fetchData(); } 
                else showAlert("Error", json.message, true);
            } catch (e) { console.error(e); }
            finally { 
                modalUnassignConfirm.textContent = 'Liberar'; 
                modalUnassignConfirm.disabled = false; 
            }
        });
    }
});