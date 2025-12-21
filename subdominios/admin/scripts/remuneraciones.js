document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const headerBadge = document.getElementById('header-badge');
    const headerName = document.getElementById('header-user-name');
    const headerEmail = document.getElementById('dropdown-user-email');
    const sidebarContainer = document.getElementById('sidebar-container');
    
    const tableBody = document.getElementById('payroll-table-body');
    const kpiTotal = document.getElementById('total-payroll');
    const kpiEmployees = document.getElementById('total-employees');
    const filterMonth = document.getElementById('filter-month');
    
    // Modal Elements
    const modal = document.getElementById('modal-payroll');
    const modalClose = document.getElementById('modal-close');
    const modalCancel = document.getElementById('modal-cancel');
    const modalSave = document.getElementById('modal-save');
    
    const modalName = document.getElementById('modal-employee-name');
    const modalBase = document.getElementById('modal-base-display');
    const modalTotal = document.getElementById('modal-total-display');
    const inputId = document.getElementById('modal-id');
    const inputBonuses = document.getElementById('modal-bonuses');
    const inputDiscounts = document.getElementById('modal-discounts');

    // State (Mock Data)
    let employees = [
        { id: 1, name: "Juan Pérez", role: "Cajero", base: 600000, bonuses: 50000, discounts: 0, status: "pending" },
        { id: 2, name: "Maria Soto", role: "Tesorero", base: 850000, bonuses: 0, discounts: 20000, status: "paid" },
        { id: 3, name: "Carlos Diaz", role: "Tesorero", base: 850000, bonuses: 100000, discounts: 0, status: "pending" },
        { id: 4, name: "Ana Lopez", role: "Administrativo", base: 700000, bonuses: 0, discounts: 0, status: "pending" }
    ];

    // --- INIT ---
    getSession();
    initMonthSelector();
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

            const role = (data.rol || '').toLowerCase().trim();
            const superUsers = ['socio', 'admin', 'gerente'];
            
            if (!superUsers.includes(role)) {
                alert("Acceso restringido a Finanzas");
                window.location.href = 'index';
                return;
            }

            if(headerName) headerName.textContent = (data.nombre || 'Usuario').split(' ')[0];
            if(headerEmail) headerEmail.textContent = data.correo;
            if(headerBadge) {
                headerBadge.textContent = "PORTAL SOCIOS";
                headerBadge.className = "hidden md:inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 tracking-wider uppercase";
            }

            loadSidebar();
            renderTable();
            updateKPIs();

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
                    
                    const active = sidebarContainer.querySelector('a[href="remuneraciones"]');
                    if(active) active.classList.add('bg-indigo-50', 'text-indigo-700', 'font-bold');
                }
            });
    }

    // --- LOGIC ---
    function renderTable() {
        tableBody.innerHTML = '';
        
        employees.forEach(emp => {
            const total = emp.base + emp.bonuses - emp.discounts;
            const tr = document.createElement('tr');
            tr.className = "bg-white border-b hover:bg-slate-50 transition";
            
            const statusBadge = emp.status === 'paid'
                ? '<span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200">Pagado</span>'
                : '<span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800 border border-yellow-200">Pendiente</span>';

            tr.innerHTML = `
                <td class="px-6 py-4">
                    <div class="font-bold text-slate-800">${emp.name}</div>
                    <div class="text-xs text-slate-500">${emp.role}</div>
                </td>
                <td class="px-6 py-4 text-slate-600">${formatMoney(emp.base)}</td>
                <td class="px-6 py-4 text-green-600 font-medium">+ ${formatMoney(emp.bonuses)}</td>
                <td class="px-6 py-4 text-red-600 font-medium">- ${formatMoney(emp.discounts)}</td>
                <td class="px-6 py-4 font-extrabold text-slate-900">${formatMoney(total)}</td>
                <td class="px-6 py-4 text-center">${statusBadge}</td>
                <td class="px-6 py-4 text-right">
                    <button onclick="window.editPayroll(${emp.id})" class="text-indigo-600 hover:text-indigo-900 font-medium hover:underline">
                        ${emp.status === 'paid' ? 'Ver Detalle' : 'Procesar'}
                    </button>
                </td>
            `;
            tableBody.appendChild(tr);
        });
    }

    function updateKPIs() {
        const total = employees.reduce((sum, emp) => sum + (emp.base + emp.bonuses - emp.discounts), 0);
        kpiTotal.textContent = formatMoney(total);
        kpiEmployees.textContent = employees.length;
    }

    // --- MODAL LOGIC ---
    window.editPayroll = (id) => {
        const emp = employees.find(e => e.id === id);
        if(!emp) return;

        inputId.value = emp.id;
        modalName.textContent = `${emp.name} - ${emp.role}`;
        modalBase.textContent = formatMoney(emp.base);
        inputBonuses.value = emp.bonuses;
        inputDiscounts.value = emp.discounts;
        
        calculateModalTotal(emp.base);
        
        modal.classList.remove('hidden');
    };

    function calculateModalTotal(base) {
        const b = parseInt(inputBonuses.value) || 0;
        const d = parseInt(inputDiscounts.value) || 0;
        modalTotal.textContent = formatMoney(base + b - d);
    }

    function setupEventListeners() {
        modalClose.addEventListener('click', () => modal.classList.add('hidden'));
        modalCancel.addEventListener('click', () => modal.classList.add('hidden'));
        
        // Auto-calc in modal
        [inputBonuses, inputDiscounts].forEach(input => {
            input.addEventListener('input', () => {
                const id = parseInt(inputId.value);
                const emp = employees.find(e => e.id === id);
                if(emp) calculateModalTotal(emp.base);
            });
        });

        modalSave.addEventListener('click', () => {
            const id = parseInt(inputId.value);
            const emp = employees.find(e => e.id === id);
            if(emp) {
                emp.bonuses = parseInt(inputBonuses.value) || 0;
                emp.discounts = parseInt(inputDiscounts.value) || 0;
                // Si guardas, asumes que procesaste algo (opcional cambiar estado)
                // emp.status = 'paid'; 
                renderTable();
                updateKPIs();
                modal.classList.add('hidden');
            }
        });
    }

    // --- UTILS ---
    function initMonthSelector() {
        const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        months.forEach((m, i) => {
            const opt = new Option(m, i + 1);
            if(i === new Date().getMonth()) opt.selected = true;
            filterMonth.appendChild(opt);
        });
    }

    function formatMoney(amount) {
        return '$ ' + amount.toLocaleString('es-CL');
    }
});