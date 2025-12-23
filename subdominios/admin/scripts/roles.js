document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const headerBadge = document.getElementById('header-badge');
    const headerName = document.getElementById('header-user-name');
    const headerEmail = document.getElementById('dropdown-user-email');
    const sidebarContainer = document.getElementById('sidebar-container');
    
    const boxesGrid = document.getElementById('boxes-grid');
    const permissionsTable = document.getElementById('permissions-table-body');
    
    // Modal
    const modalAssign = document.getElementById('modal-assign');
    const modalBoxName = document.getElementById('modal-box-name');
    const modalUserSelect = document.getElementById('user-select');
    const modalCancel = document.getElementById('modal-cancel');
    const modalConfirm = document.getElementById('modal-confirm');
    const targetBoxIdInput = document.getElementById('target-box-id');

    let currentUserId = null;
    let boxesData = [];
    let usersData = [];

    init();

    function init() {
        getSession();
        setupEventListeners();
    }

    // --- UTILS: FORMATO NOMBRE ---
    function formatName(fullName) {
        if (!fullName) return '';
        const parts = fullName.trim().split(/\s+/);
        // Si tiene al menos 3 partes (Juan Esteban Perez), toma 1ro y 3ro
        if (parts.length >= 3) return `${parts[0]} ${parts[2]}`;
        // Si tiene 2, las toma ambas
        if (parts.length === 2) return `${parts[0]} ${parts[1]}`;
        return parts[0];
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
            
            if (!['socio', 'admin', 'gerente'].includes(role)) {
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
            fetchData(); 

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
                    const active = sidebarContainer.querySelector('a[href="roles"]');
                    if(active) active.classList.add('bg-indigo-50', 'text-indigo-700', 'font-bold');
                }
            });
    }

    async function fetchData() {
        boxesGrid.innerHTML = '<div class="col-span-full text-center py-10 text-slate-500">Cargando configuración...</div>';
        try {
            const res = await fetch(`https://cambiosorion.cl/data/roles.php?current_user_id=${currentUserId}`);
            const json = await res.json();
            if (json.success) {
                boxesData = json.boxes;
                usersData = json.users;
                renderBoxes();
                renderPermissions();
            } else {
                alert("Error: " + json.message);
            }
        } catch (e) {
            console.error(e);
            alert("Error de conexión");
        }
    }

    // --- RENDER CAJAS ---
    function renderBoxes() {
        boxesGrid.innerHTML = '';
        
        boxesData.forEach(box => {
            const isMulti = box.type === 'multi'; 
            const isActive = isMulti ? box.users.length > 0 : box.currentUserId !== null;
            const isGhost = box.id === 0;

            let borderClass = isActive ? 'border-indigo-300 ring-1 ring-indigo-50' : 'border-slate-200';
            let bgClass = 'bg-white';
            
            if (isGhost) {
                bgClass = 'bg-slate-50'; 
                borderClass = isActive ? 'border-slate-400' : 'border-slate-300 border-dashed';
            }

            const card = document.createElement('div');
            card.className = `box-card ${bgClass} border rounded-2xl p-5 shadow-sm relative transition hover:shadow-md ${borderClass}`;
            
            let contentHtml = '';
            
            if (isMulti) {
                // TESORERÍA (99)
                const userList = box.users.map(uid => {
                    const u = usersData.find(user => user.id === uid);
                    return u ? `
                        <li class="text-sm text-slate-700 mb-2 flex items-center justify-between bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                            <span class="font-medium flex items-center gap-2 truncate">
                                <span class="w-2 h-2 rounded-full bg-purple-500 shrink-0"></span> ${formatName(u.name)}
                            </span>
                            <button onclick="window.unassignUser(${uid})" class="text-slate-400 hover:text-red-500 transition px-1 font-bold">×</button>
                        </li>` : '';
                }).join('');

                contentHtml = `
                    <div class="flex justify-between items-start mb-3">
                        <div class="bg-purple-100 text-purple-700 p-2.5 rounded-xl">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        </div>
                        <button onclick="window.openAssignModal(${box.id}, '${box.name}')" class="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-indigo-700 transition shadow-sm flex items-center gap-1">
                           + Asignar
                        </button>
                    </div>
                    <h3 class="font-bold text-slate-800 text-lg mb-1">${box.name}</h3>
                    <p class="text-xs text-slate-400 mb-3">Zona de Tesorería</p>
                    <ul class="max-h-40 overflow-y-auto pr-1 custom-scrollbar">${userList || '<span class="text-xs text-slate-400 italic">Sin personal</span>'}</ul>
                `;
            } else {
                // CAJAS NORMALES + CAJA 0
                const user = usersData.find(u => u.id === box.currentUserId);
                
                contentHtml = `
                    <div class="flex justify-between items-start mb-4">
                        <div class="${user ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'} p-2.5 rounded-xl transition-colors">
                            ${isGhost 
                                ? '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>'
                                : '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>'
                            }
                        </div>
                        ${user ? `<button onclick="window.unassignUser(${user.id})" class="text-xs text-red-500 bg-red-50 border border-red-100 px-2 py-1 rounded hover:bg-red-100 transition">Liberar</button>` : ''}
                    </div>
                    <h3 class="font-bold text-slate-800 text-lg mb-1">${box.name}</h3>
                    <div class="mt-2">
                        ${user 
                            ? `<div class="text-sm font-bold text-indigo-700 bg-indigo-50 px-3 py-2 rounded-lg border border-indigo-100 truncate text-center" title="${user.name}">${formatName(user.name)}</div>` 
                            : `<button onclick="window.openAssignModal(${box.id}, '${box.name}')" class="w-full py-2 border-2 border-dashed border-slate-300 text-slate-400 rounded-lg text-sm hover:border-indigo-400 hover:text-indigo-600 transition font-medium">Asignar</button>`
                        }
                    </div>
                `;
            }

            card.innerHTML = contentHtml;
            boxesGrid.appendChild(card);
        });
    }

    // --- RENDER PERMISOS ---
    function renderPermissions() {
        permissionsTable.innerHTML = '';
        
        // FILTRO SOCIOS: No mostrar Socios en la tabla
        const filteredUsers = usersData.filter(u => u.role.toLowerCase() !== 'socio');

        filteredUsers.forEach(u => {
            const p = u.permissions;
            const row = document.createElement('tr');
            row.className = "bg-white border-b hover:bg-slate-50 transition";
            
            let roleBadgeClass = 'bg-slate-100 text-slate-600';
            if(u.role.toLowerCase() === 'tesorero') roleBadgeClass = 'bg-indigo-100 text-indigo-700';
            if(u.role.toLowerCase() === 'rrhh') roleBadgeClass = 'bg-pink-100 text-pink-700';

            row.innerHTML = `
                <td class="px-6 py-4">
                    <div class="font-bold text-slate-800">${formatName(u.name)}</div>
                    <span class="inline-flex mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${roleBadgeClass}">${u.role}</span>
                </td>
                <td class="px-6 py-4 text-center">${createToggle(u.id, 'acceso_rrhh', p.acceso_rrhh)}</td>
                <td class="px-6 py-4 text-center">${createToggle(u.id, 'autorizar_traslados', p.autorizar_traslados)}</td>
                <td class="px-6 py-4 text-center">${createToggle(u.id, 'manejo_caja', p.manejo_caja)}</td>
                <td class="px-6 py-4 text-center">${createToggle(u.id, 'ver_finanzas_global', p.ver_finanzas_global)}</td>
                <td class="px-6 py-4 text-center">${createToggle(u.id, 'editar_tasas', p.editar_tasas)}</td>
            `;
            permissionsTable.appendChild(row);
        });
    }

    function createToggle(uid, key, isActive) {
        return `
            <label class="inline-flex items-center cursor-pointer relative">
                <input type="checkbox" class="sr-only peer" ${isActive ? 'checked' : ''} onchange="window.updatePermission(${uid}, '${key}', this.checked)">
                <div class="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
        `;
    }

    // --- MODAL ASIGNAR ---
    window.openAssignModal = (boxId, boxName) => {
        modalBoxName.textContent = boxName;
        targetBoxIdInput.value = boxId;
        
        modalUserSelect.innerHTML = '<option value="">Seleccione...</option>';
        
        const sortedUsers = [...usersData].sort((a,b) => formatName(a.name).localeCompare(formatName(b.name)));

        sortedUsers.forEach(u => {
            const r = u.role.toLowerCase();
            
            // 1. FILTRO SOCIOS: Jamás aparecen en el dropdown
            if (r.includes('socio')) return;

            // 2. FILTRO CAJA 0: Solo Tesoreros/RRHH/Oficiales
            if (boxId === 0) {
                if (!r.includes('tesorero') && !r.includes('rrhh') && !r.includes('gerente') && !r.includes('oficial')) {
                    return; 
                }
            }

            // 3. ETIQUETA DE UBICACIÓN ACTUAL
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

    function setupEventListeners() {
        modalCancel.addEventListener('click', () => modalAssign.classList.add('hidden'));
        
        modalConfirm.addEventListener('click', async () => {
            const boxId = targetBoxIdInput.value;
            const userId = modalUserSelect.value;
            if(!userId) return alert("Seleccione un usuario");

            try {
                const res = await fetch("https://cambiosorion.cl/data/roles.php", {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify({
                        action: 'assign_box',
                        current_user_id: currentUserId,
                        box_id: boxId,
                        user_id: userId
                    })
                });
                const json = await res.json();
                if(json.success) {
                    modalAssign.classList.add('hidden');
                    fetchData(); 
                } else {
                    alert("Error: " + json.message);
                }
            } catch (e) { console.error(e); }
        });
    }

    // --- ACCIONES ---
    window.unassignUser = async (userId) => {
        if(!confirm("¿Liberar puesto de este usuario?")) return;
        try {
            const res = await fetch("https://cambiosorion.cl/data/roles.php", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    action: 'unassign_box',
                    current_user_id: currentUserId,
                    user_id: userId
                })
            });
            const json = await res.json();
            if(json.success) fetchData();
        } catch (e) { console.error(e); }
    };

    window.updatePermission = async (userId, key, value) => {
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
                alert("Error: " + json.message);
                fetchData(); 
            }
        } catch (e) { console.error(e); fetchData(); }
    };
});