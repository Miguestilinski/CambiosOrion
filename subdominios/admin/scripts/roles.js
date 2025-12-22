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

    // Data Models
    // Configuración de cajas físicas
    const boxes = [
        { id: 1, name: 'Caja 1', type: 'single', currentUserId: 101 }, // Single user
        { id: 2, name: 'Caja 2', type: 'single', currentUserId: null }, // Vacía
        { id: 3, name: 'Caja 3', type: 'single', currentUserId: null },
        { id: 99, name: 'Tesorería', type: 'multi', users: [102, 103] } // Multi user
    ];

    // Usuarios del sistema
    const users = [
        { id: 101, name: 'Juan Pérez', role: 'Cajero' },
        { id: 102, name: 'Maria Soto', role: 'Tesorero' },
        { id: 103, name: 'Carlos Diaz', role: 'Tesorero' },
        { id: 104, name: 'Ana Lopez', role: 'Cajero' }, // Sin asignar
        { id: 105, name: 'Pedro Ruiz', role: 'Administrativo' }
    ];

    // Matriz de permisos
    const permissions = [
        { userId: 101, access: true, authorize: false, reports: false, rates: false },
        { userId: 102, access: true, authorize: true, reports: true, rates: true },
        { userId: 103, access: true, authorize: true, reports: false, rates: false },
        { userId: 104, access: true, authorize: false, reports: false, rates: false },
        { userId: 105, access: true, authorize: false, reports: true, rates: false }
    ];

    // --- INIT ---
    getSession();
    setupModalListeners();

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
                headerBadge.textContent = "PORTAL ADMIN";
                headerBadge.className = "hidden md:inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-indigo-600 text-white border border-indigo-500/30 tracking-wider uppercase shadow-lg shadow-indigo-500/20";
            }

            loadSidebar();
            renderBoxes();
            renderPermissions();

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
                    
                    const active = sidebarContainer.querySelector('a[href="roles"]');
                    if(active) active.classList.add('bg-indigo-50', 'text-indigo-700', 'font-bold');
                }
            });
    }

    // --- BOX ASSIGNMENT RENDER ---
    function renderBoxes() {
        boxesGrid.innerHTML = '';
        
        boxes.forEach(box => {
            const card = document.createElement('div');
            // Estilo diferente para Tesorería vs Cajas Normales
            const isMulti = box.type === 'multi';
            const isActive = isMulti ? box.users.length > 0 : box.currentUserId !== null;
            
            card.className = `box-card bg-white border rounded-2xl p-5 shadow-sm relative ${isActive ? 'border-indigo-200' : 'border-slate-200'}`;
            
            let contentHtml = '';
            
            if (isMulti) {
                // Render Tesorería (Lista)
                const userList = box.users.map(uid => {
                    const u = users.find(user => user.id === uid);
                    return u ? `<li class="text-sm text-slate-600 mb-1 flex items-center justify-between">
                                    <span>${u.name}</span>
                                    <button onclick="window.unassignUser(${box.id}, ${uid})" class="text-red-400 hover:text-red-600 ml-2">×</button>
                                </li>` : '';
                }).join('');

                contentHtml = `
                    <div class="flex justify-between items-start mb-3">
                        <div class="bg-purple-100 text-purple-600 p-2 rounded-lg">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        </div>
                        <button onclick="window.openAssignModal(${box.id}, '${box.name}')" class="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded font-bold hover:bg-indigo-100 transition">+ Añadir</button>
                    </div>
                    <h3 class="font-bold text-slate-800 text-lg mb-2">${box.name}</h3>
                    <ul class="pl-1 max-h-24 overflow-y-auto">${userList || '<span class="text-xs text-slate-400 italic">Sin asignaciones</span>'}</ul>
                `;
            } else {
                // Render Caja Normal (Único)
                const user = users.find(u => u.id === box.currentUserId);
                
                contentHtml = `
                    <div class="flex justify-between items-start mb-4">
                        <div class="${user ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'} p-2 rounded-lg">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                        </div>
                        ${user ? `<button onclick="window.unassignUser(${box.id}, ${user.id})" class="text-xs text-red-400 hover:text-red-600 font-medium">Liberar</button>` : ''}
                    </div>
                    <h3 class="font-bold text-slate-800 text-lg mb-1">${box.name}</h3>
                    <p class="text-sm ${user ? 'text-indigo-600 font-medium' : 'text-slate-400 italic'}">
                        ${user ? user.name : 'Disponible'}
                    </p>
                    ${!user ? `<button onclick="window.openAssignModal(${box.id}, '${box.name}')" class="mt-4 w-full py-2 border border-dashed border-slate-300 text-slate-500 rounded-lg text-sm hover:border-indigo-300 hover:text-indigo-600 transition">Asignar Usuario</button>` : ''}
                `;
            }

            card.innerHTML = contentHtml;
            boxesGrid.appendChild(card);
        });
    }

    // --- PERMISSIONS RENDER ---
    function renderPermissions() {
        permissionsTable.innerHTML = '';
        users.forEach(u => {
            const perms = permissions.find(p => p.userId === u.id) || { access: false, authorize: false, reports: false, rates: false };
            
            const row = document.createElement('tr');
            row.className = "bg-white border-b hover:bg-slate-50 transition";
            
            row.innerHTML = `
                <td class="px-6 py-4 font-medium text-slate-900">${u.name} <span class="text-xs text-slate-400 ml-1">(${u.role})</span></td>
                <td class="px-6 py-4 text-center">${renderToggle(u.id, 'access', perms.access)}</td>
                <td class="px-6 py-4 text-center">${renderToggle(u.id, 'authorize', perms.authorize)}</td>
                <td class="px-6 py-4 text-center">${renderToggle(u.id, 'reports', perms.reports)}</td>
                <td class="px-6 py-4 text-center">${renderToggle(u.id, 'rates', perms.rates)}</td>
            `;
            permissionsTable.appendChild(row);
        });
    }

    function renderToggle(uid, key, value) {
        return `
            <label class="inline-flex items-center cursor-pointer">
                <input type="checkbox" class="sr-only peer" ${value ? 'checked' : ''} onchange="window.togglePermission(${uid}, '${key}')">
                <div class="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
        `;
    }

    // --- MODAL & ASSIGNMENT LOGIC ---
    window.openAssignModal = (boxId, boxName) => {
        modalBoxName.textContent = boxName;
        targetBoxIdInput.value = boxId;
        
        // Llenar select con usuarios no asignados (simplificado para demo)
        // En prod: filtrar usuarios que ya tienen caja (si la regla es estricta)
        modalUserSelect.innerHTML = '<option value="">Seleccione...</option>';
        users.forEach(u => {
            const opt = document.createElement('option');
            opt.value = u.id;
            opt.textContent = u.name;
            modalUserSelect.appendChild(opt);
        });

        modalAssign.classList.remove('hidden');
    };

    function setupModalListeners() {
        modalCancel.addEventListener('click', () => modalAssign.classList.add('hidden'));
        
        modalConfirm.addEventListener('click', () => {
            const boxId = parseInt(targetBoxIdInput.value);
            const userId = parseInt(modalUserSelect.value);
            
            if(!userId) return;

            const box = boxes.find(b => b.id === boxId);
            if (box) {
                if (box.type === 'single') {
                    // Reemplazo simple
                    box.currentUserId = userId;
                } else {
                    // Tesorería: Agregar sin duplicar
                    if (!box.users.includes(userId)) {
                        box.users.push(userId);
                    }
                }
                renderBoxes();
                modalAssign.classList.add('hidden');
                // Aquí fetch save...
            }
        });
    }

    window.unassignUser = (boxId, userId) => {
        const box = boxes.find(b => b.id === boxId);
        if (box) {
            if (box.type === 'single') {
                box.currentUserId = null;
            } else {
                box.users = box.users.filter(id => id !== userId);
            }
            renderBoxes();
        }
    };

    window.togglePermission = (userId, key) => {
        const perm = permissions.find(p => p.userId === userId);
        if (perm) {
            perm[key] = !perm[key];
            console.log(`User ${userId} ${key} changed to ${perm[key]}`);
            // Aquí fetch update permission...
        }
    };
});