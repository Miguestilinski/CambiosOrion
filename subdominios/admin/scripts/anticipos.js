import { initAdminHeader } from './header.js';

document.addEventListener('DOMContentLoaded', async() => {
    // --- DOM ELEMENTS (Solo los propios de la página) ---
    // Nota: Eliminamos headerBadge, headerName, sidebarContainer porque header.js los maneja.
    
    // Personal UI
    const availableAmountEl = document.getElementById('available-amount');
    const baseSalaryEl = document.getElementById('base-salary');
    const requestedAmountEl = document.getElementById('requested-amount');
    const requestForm = document.getElementById('request-form');
    const personalHistoryBody = document.getElementById('personal-history-body');
    const amountInput = document.getElementById('amount');
    const amountError = document.getElementById('amount-error');

    // Admin UI
    const adminSection = document.getElementById('admin-management');
    const adminTableBody = document.getElementById('admin-table-body');
    const adminFilterMonth = document.getElementById('admin-filter-month');
    const adminFilterYear = document.getElementById('admin-filter-year');

    // State
    let currentUser = null;
    let maxAmount = 0; // 30% of salary
    let currentRequests = 0; // Already requested this month

    // Mock Data (Simulación Backend)
    let mockRequests = [
        { id: 101, userId: 1, user: "Juan Pérez", fecha: "2025-05-10", monto: 50000, sueldo: 600000, estado: "pendiente" },
        { id: 102, userId: 2, user: "Maria Soto", fecha: "2025-05-11", monto: 120000, sueldo: 800000, estado: "aprobado" },
        { id: 103, userId: 3, user: "Carlos Diaz", fecha: "2025-05-12", monto: 30000, sueldo: 550000, estado: "rechazado" },
        { id: 104, userId: 99, user: "Yo Mismo", fecha: "2025-04-15", monto: 45000, sueldo: 900000, estado: "aprobado" }
    ];

    // --- 1. INICIALIZACIÓN GLOBAL ---
    const sessionData = await initAdminHeader('anticipos');

    if (!sessionData.isAuthenticated) return;

    currentUser = sessionData; // Guardamos datos para uso local

    // --- 2. INICIALIZACIÓN LOCAL ---
    initFilters();
    loadPersonalData(); // Carga la vista de empleado para todos

    // Lógica de Roles para ver panel Admin
    const rol = (sessionData.rol || '').toLowerCase().trim();
    const superUsers = ['socio', 'admin', 'gerente', 'rrhh']; // Agregué RRHH por consistencia
    
    if (superUsers.includes(rol)) {
        setupAdminView();
    }

    // --- PERSONAL DATA LOGIC ---
    function loadPersonalData() {
        // Simulación: Sueldo 900.000
        const sueldoLiquido = 900000;
        const porcentajeMaximo = 0.30; // 30%
        
        // Calcular historial personal desde mock
        // En prod: fetch('/data/mis-anticipos.php')
        const myHistory = mockRequests.filter(r => r.userId === 99 || r.user === "Yo Mismo"); 
        
        // Calcular montos del mes actual
        currentRequests = myHistory
            .filter(r => r.estado !== 'rechazado' && r.fecha.includes('2025-05')) // Filtro mes actual simulado
            .reduce((sum, r) => sum + r.monto, 0);

        maxAmount = Math.floor(sueldoLiquido * porcentajeMaximo);
        const available = maxAmount - currentRequests;

        // Render UI
        baseSalaryEl.textContent = formatMoney(sueldoLiquido);
        requestedAmountEl.textContent = formatMoney(currentRequests);
        availableAmountEl.textContent = formatMoney(available > 0 ? available : 0);

        renderPersonalHistory(myHistory);
    }

    function renderPersonalHistory(data) {
        personalHistoryBody.innerHTML = '';
        if(data.length === 0) {
            personalHistoryBody.innerHTML = `<tr><td colspan="4" class="px-6 py-4 text-center text-slate-400">No hay solicitudes recientes.</td></tr>`;
            return;
        }

        data.forEach(item => {
            const row = document.createElement('tr');
            row.className = "bg-white border-b hover:bg-slate-50 transition";
            row.innerHTML = `
                <td class="px-6 py-4 font-medium text-slate-900">${formatDate(item.fecha)}</td>
                <td class="px-6 py-4 font-bold text-slate-700">${formatMoney(item.monto)}</td>
                <td class="px-6 py-4 text-slate-500">Próx. Liquidación</td>
                <td class="px-6 py-4 text-center">${getStatusBadge(item.estado)}</td>
            `;
            personalHistoryBody.appendChild(row);
        });
    }

    requestForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const amount = parseInt(amountInput.value);
        
        if (amount > (maxAmount - currentRequests)) {
            amountError.classList.remove('hidden');
            amountInput.classList.add('border-red-500', 'focus:border-red-500', 'focus:ring-red-500');
            return;
        }

        // Simular envío
        document.getElementById('modal-success').classList.remove('hidden');
    });

    // --- ADMIN LOGIC ---
    function setupAdminView() {
        // Solo mostramos la sección del cuerpo de la página
        if(adminSection) adminSection.classList.remove('hidden');
        renderAdminTable();
    }

    function initFilters() {
        // Llenar meses
        const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        months.forEach((m, i) => {
            const opt = new Option(m, i + 1);
            if(i === 4) opt.selected = true; // Mayo default
            adminFilterMonth.appendChild(opt);
        });
        
        // Llenar años
        adminFilterYear.add(new Option('2025', '2025'));
    }

    function renderAdminTable() {
        adminTableBody.innerHTML = '';
        
        // Filtrar datos (Simulado)
        // En prod: fetch con parámetros de filtro
        mockRequests.forEach(req => {
            const row = document.createElement('tr');
            row.className = "bg-white border-b hover:bg-indigo-50/30 transition group";
            
            // Input editable solo si está pendiente
            let actionsHtml = '';
            let amountHtml = formatMoney(req.monto);

            if (req.estado === 'pendiente') {
                amountHtml = `<input type="number" class="w-24 px-2 py-1 text-sm border border-slate-300 rounded focus:ring-indigo-500 focus:border-indigo-500 admin-amount-input" data-id="${req.id}" value="${req.monto}">`;
                actionsHtml = `
                    <div class="flex justify-end gap-2">
                        <button onclick="window.updateStatus(${req.id}, 'aprobado')" class="p-1.5 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition" title="Aprobar">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                        </button>
                        <button onclick="window.updateStatus(${req.id}, 'rechazado')" class="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition" title="Rechazar">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                    </div>
                `;
            } else {
                actionsHtml = `<span class="text-xs text-slate-400 italic">Procesado</span>`;
            }

            row.innerHTML = `
                <td class="px-6 py-4 font-medium text-slate-900">${req.user}</td>
                <td class="px-6 py-4 text-slate-500">${formatDate(req.fecha)}</td>
                <td class="px-6 py-4 font-bold text-indigo-600">${amountHtml}</td>
                <td class="px-6 py-4 text-slate-500">${formatMoney(req.sueldo)}</td>
                <td class="px-6 py-4">${getStatusBadge(req.estado)}</td>
                <td class="px-6 py-4 text-right">${actionsHtml}</td>
            `;
            adminTableBody.appendChild(row);
        });

        // Listeners para cambios de monto
        document.querySelectorAll('.admin-amount-input').forEach(input => {
            input.addEventListener('change', (e) => {
                const id = parseInt(e.target.dataset.id);
                const val = parseInt(e.target.value);
                const req = mockRequests.find(r => r.id === id);
                if(req) req.monto = val;
                console.log(`Monto actualizado para ID ${id}: ${val}`);
            });
        });
    }

    // Funciones globales para botones onclick
    window.updateStatus = (id, status) => {
        const req = mockRequests.find(r => r.id === id);
        if(req) {
            req.estado = status;
            renderAdminTable(); // Re-renderizar tabla
            loadPersonalData(); // Actualizar datos personales si fui yo el afectado
        }
    };

    // --- UTILS ---
    function formatMoney(amount) {
        return '$ ' + amount.toLocaleString('es-CL');
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' });
    }

    function getStatusBadge(status) {
        const styles = {
            pendiente: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            aprobado: 'bg-green-100 text-green-800 border-green-200',
            rechazado: 'bg-red-100 text-red-800 border-red-200'
        };
        return `<span class="px-2.5 py-0.5 rounded-full text-xs font-bold border capitalize status-badge ${styles[status] || ''}">${status}</span>`;
    }
});