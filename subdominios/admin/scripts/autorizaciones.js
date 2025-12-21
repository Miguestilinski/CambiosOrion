document.addEventListener('DOMContentLoaded', () => {
    // DOM Refs
    const headerBadge = document.getElementById('header-badge');
    const headerName = document.getElementById('header-user-name');
    const headerEmail = document.getElementById('dropdown-user-email');
    const sidebarContainer = document.getElementById('sidebar-container');
    
    const filterType = document.getElementById('filter-type');
    const filterStatus = document.getElementById('filter-status');
    const tableBody = document.getElementById('auth-table-body');
    const emptyState = document.getElementById('empty-state');
    
    // KPI Refs
    const kpiPending = document.getElementById('count-pending');
    const kpiVacations = document.getElementById('count-vacations');
    const kpiAdvances = document.getElementById('count-advances');

    // Modal Refs
    const modalConfirm = document.getElementById('modal-confirm');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    const modalIcon = document.getElementById('modal-icon');
    const btnConfirm = document.getElementById('modal-btn-confirm');
    const btnCancel = document.getElementById('modal-btn-cancel');

    // Mock Data
    let requests = [
        { id: 1, type: 'vacaciones', user: 'Juan Pérez', detail: '3 días (10-12 May)', date: '2025-05-01', status: 'pending' },
        { id: 2, type: 'anticipos', user: 'Maria Soto', detail: '$50.000', date: '2025-05-02', status: 'pending' },
        { id: 3, type: 'vacaciones', user: 'Carlos Diaz', detail: '10 días (Enero)', date: '2025-04-20', status: 'approved' },
        { id: 4, type: 'anticipos', user: 'Pedro Ruiz', detail: '$100.000', date: '2025-05-03', status: 'rejected' },
        { id: 5, type: 'permisos', user: 'Ana Lopez', detail: 'Trámite Personal (AM)', date: '2025-05-03', status: 'pending' }
    ];

    let actionTargetId = null;
    let actionType = null; // 'approve' or 'reject'

    // --- INIT ---
    getSession();
    setupFilters();
    setupModal();

    // --- SESSION & SECURITY ---
    async function getSession() {
        try {
            const res = await fetch("https://cambiosorion.cl/data/session_status.php", { credentials: "include" });
            if (!res.ok) throw new Error("Error sesión");
            const data = await res.json();
            
            // 1. Verificar Autenticación
            if (!data.isAuthenticated) {
                window.location.href = 'https://admin.cambiosorion.cl/login';
                return;
            }

            const role = (data.rol || '').toLowerCase().trim();
            const superUsers = ['socio', 'admin', 'gerente']; 

            // 2. Verificar Rol (Seguridad)
            if (!superUsers.includes(role)) {
                // Si no es admin, fuera
                alert("Acceso denegado: No tienes permisos para ver esta página.");
                window.location.href = 'index'; 
                return;
            }

            // 3. Cargar UI
            if(headerName) headerName.textContent = (data.nombre || 'Usuario').split(' ')[0];
            if(headerEmail) headerEmail.textContent = data.correo;
            
            if(headerBadge) {
                headerBadge.textContent = "PORTAL SOCIOS";
                headerBadge.className = "hidden md:inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 tracking-wider uppercase";
            }

            loadSidebar();
            updateDashboard();

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
                    // Mostrar menú admin
                    const adminItems = sidebarContainer.querySelectorAll('.admin-only');
                    adminItems.forEach(item => item.classList.remove('hidden'));
                    
                    const active = sidebarContainer.querySelector('a[href="autorizaciones"]');
                    if(active) active.classList.add('bg-indigo-50', 'text-indigo-700', 'font-bold');
                }
            });
    }

    // --- LOGIC ---
    function setupFilters() {
        filterType.addEventListener('change', updateDashboard);
        filterStatus.addEventListener('change', updateDashboard);
    }

    function updateDashboard() {
        renderKPIs();
        renderTable();
    }

    function renderKPIs() {
        // Recalcular conteos totales (sin filtros)
        kpiPending.textContent = requests.filter(r => r.status === 'pending').length;
        kpiVacations.textContent = requests.filter(r => r.type === 'vacaciones' && r.status === 'pending').length;
        kpiAdvances.textContent = requests.filter(r => r.type === 'anticipos' && r.status === 'pending').length;
    }

    function renderTable() {
        const type = filterType.value;
        const status = filterStatus.value;

        const filtered = requests.filter(r => {
            const matchType = type === 'all' || r.type === type;
            const matchStatus = status === 'all' || r.status === status;
            return matchType && matchStatus;
        });

        tableBody.innerHTML = '';

        if (filtered.length === 0) {
            tableBody.classList.add('hidden');
            emptyState.classList.remove('hidden');
            return;
        }

        tableBody.classList.remove('hidden');
        emptyState.classList.add('hidden');

        filtered.forEach(req => {
            const tr = document.createElement('tr');
            tr.className = "bg-white border-b hover:bg-slate-50 transition";
            
            // Render Acciones solo si está pendiente
            let actionsHtml = '';
            if (req.status === 'pending') {
                actionsHtml = `
                    <div class="flex justify-end gap-2">
                        <button onclick="window.confirmAction(${req.id}, 'reject')" class="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition" title="Rechazar">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                        <button onclick="window.confirmAction(${req.id}, 'approve')" class="p-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition shadow-md shadow-indigo-500/20" title="Aprobar">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                        </button>
                    </div>
                `;
            }

            tr.innerHTML = `
                <td class="px-6 py-4 font-bold text-slate-800">${req.user}</td>
                <td class="px-6 py-4 capitalize">${req.type}</td>
                <td class="px-6 py-4 text-slate-600 font-medium">${req.detail}</td>
                <td class="px-6 py-4 text-slate-500">${formatDate(req.date)}</td>
                <td class="px-6 py-4 text-center">${getStatusBadge(req.status)}</td>
                <td class="px-6 py-4 text-right">${actionsHtml}</td>
            `;
            tableBody.appendChild(tr);
        });
    }

    // --- MODAL ACTIONS ---
    window.confirmAction = (id, action) => {
        actionTargetId = id;
        actionType = action;
        
        const req = requests.find(r => r.id === id);
        if (!req) return;

        if (action === 'approve') {
            modalTitle.textContent = "Aprobar Solicitud";
            modalTitle.className = "text-xl font-bold text-indigo-900 mb-2";
            modalMessage.textContent = `¿Estás seguro de aprobar la solicitud de ${req.user}?`;
            modalIcon.className = "w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600";
            modalIcon.innerHTML = `<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`;
            btnConfirm.className = "flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition";
            btnConfirm.textContent = "Aprobar";
        } else {
            modalTitle.textContent = "Rechazar Solicitud";
            modalTitle.className = "text-xl font-bold text-red-900 mb-2";
            modalMessage.textContent = `¿Estás seguro de rechazar la solicitud de ${req.user}?`;
            modalIcon.className = "w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600";
            modalIcon.innerHTML = `<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>`;
            btnConfirm.className = "flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition";
            btnConfirm.textContent = "Rechazar";
        }

        modalConfirm.classList.remove('hidden');
    };

    function setupModal() {
        btnCancel.addEventListener('click', () => modalConfirm.classList.add('hidden'));
        
        btnConfirm.addEventListener('click', () => {
            const req = requests.find(r => r.id === actionTargetId);
            if (req) {
                req.status = actionType === 'approve' ? 'approved' : 'rejected';
                updateDashboard();
            }
            modalConfirm.classList.add('hidden');
        });
    }

    // --- UTILS ---
    function formatDate(dateStr) {
        return new Date(dateStr).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' });
    }

    function getStatusBadge(status) {
        const styles = {
            pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            approved: 'bg-green-100 text-green-800 border-green-200',
            rejected: 'bg-red-100 text-red-800 border-red-200'
        };
        const labels = {
            pending: 'Pendiente',
            approved: 'Aprobado',
            rejected: 'Rechazado'
        };
        return `<span class="px-2.5 py-0.5 rounded-full text-xs font-bold border ${styles[status] || ''}">${labels[status] || status}</span>`;
    }
});