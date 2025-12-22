document.addEventListener('DOMContentLoaded', () => {
    // Referencias DOM
    const headerName = document.getElementById('header-user-name');
    const headerEmail = document.getElementById('dropdown-user-email');
    const headerBadge = document.getElementById('header-badge');
    const sidebarContainer = document.getElementById('sidebar-container');
    
    const tableBody = document.getElementById('payroll-table-body');
    const kpiTotal = document.getElementById('total-payroll');
    const kpiEmployees = document.getElementById('total-employees');
    
    const filterMonth = document.getElementById('filter-month');
    const filterYear = document.getElementById('filter-year');
    
    // Modal
    const modal = document.getElementById('modal-payroll');
    const modalClose = document.getElementById('modal-close');
    const modalCancel = document.getElementById('modal-cancel');
    const btnActionGenerate = document.getElementById('modal-save'); // Reusamos este botón
    // Creamos botón extra para Pagar dinámicamente o lo insertamos en HTML, 
    // pero por simplicidad vamos a manejar un segundo botón via JS.
    
    const modalName = document.getElementById('modal-employee-name');
    const modalBase = document.getElementById('modal-base-display');
    const modalTotal = document.getElementById('modal-total-display');
    
    const inputId = document.getElementById('modal-id');
    const inputBonuses = document.getElementById('modal-bonuses');
    const inputDiscounts = document.getElementById('modal-discounts');
    const modalActionsContainer = document.querySelector('#modal-payroll .flex.justify-end'); // Contenedor botones footer modal

    let currentUserId = null;
    let employeesData = [];

    // --- INIT ---
    initDateSelectors();
    getSession();

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
            const role = (data.rol || '').toLowerCase();
            
            if (!['socio', 'admin', 'gerente', 'rrhh'].includes(role)) {
                window.location.href = 'index';
                return;
            }

            if(headerName) headerName.textContent = data.nombre;
            if(headerEmail) headerEmail.textContent = data.correo;
            if(headerBadge) headerBadge.textContent = "FINANZAS ADMIN";

            loadSidebar();
            fetchEmployees(); // Cargar tabla

        } catch (e) { console.error(e); }
    }

    function loadSidebar() {
        fetch('sidebar.html').then(r => r.text()).then(html => {
            if(sidebarContainer) {
                sidebarContainer.innerHTML = html;
                sidebarContainer.querySelectorAll('.admin-only').forEach(el => el.classList.remove('hidden'));
                const link = sidebarContainer.querySelector('a[href="remuneraciones"]');
                if(link) link.classList.add('bg-indigo-50', 'text-indigo-700', 'font-bold');
            }
        });
    }

    // --- DATOS ---
    async function fetchEmployees() {
        if (!currentUserId) return;
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center py-4">Cargando...</td></tr>';
        
        const url = `https://cambiosorion.cl/data/remuneraciones.php?current_user_id=${currentUserId}&month=${filterMonth.value}&year=${filterYear.value}`;
        
        try {
            const res = await fetch(url);
            const json = await res.json();
            
            if (!json.success) {
                tableBody.innerHTML = `<tr><td colspan="7" class="text-center text-red-500">${json.message}</td></tr>`;
                return;
            }

            employeesData = json.data;
            renderTable(employeesData);
            updateKPIs(employeesData);

        } catch (e) {
            console.error(e);
            tableBody.innerHTML = `<tr><td colspan="7" class="text-center text-red-500">Error de conexión</td></tr>`;
        }
    }

    function renderTable(data) {
        tableBody.innerHTML = '';
        if (data.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="7" class="text-center text-slate-400 py-6">No hay colaboradores activos.</td></tr>';
            return;
        }

        data.forEach(emp => {
            const isGenerated = emp.status_code === 'generada';
            const isPaid = emp.status_code === 'pagada';
            
            let badge = '<span class="px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200">Sin Proc.</span>';
            let actionBtn = `<button onclick="window.openModal(${emp.id})" class="text-indigo-600 font-medium hover:underline">Generar</button>`;
            
            // Lógica de visualización del monto
            // Si ya se generó liquidación, mostramos ese monto guardado. Si no, mostramos base.
            let displayMonto = emp.base;
            if (isGenerated || isPaid) {
                displayMonto = emp.monto_guardado;
            }

            if (isGenerated) {
                badge = '<span class="px-2 py-0.5 rounded text-xs font-bold bg-yellow-100 text-yellow-800 border border-yellow-200">Emitida</span>';
                actionBtn = `<button onclick="window.openModal(${emp.id})" class="text-emerald-600 font-bold hover:underline flex items-center justify-end w-full gap-1">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                                PAGAR
                             </button>`;
            } else if (isPaid) {
                badge = '<span class="px-2 py-0.5 rounded text-xs font-bold bg-green-100 text-green-800 border border-green-200">Pagada</span>';
                actionBtn = `<button onclick="window.openModal(${emp.id})" class="text-slate-400 hover:text-slate-600 font-medium">Ver Detalle</button>`;
            }

            const tr = document.createElement('tr');
            tr.className = "bg-white border-b hover:bg-slate-50";
            tr.innerHTML = `
                <td class="px-6 py-4">
                    <div class="font-bold text-slate-800">${emp.name}</div>
                    <div class="text-xs text-slate-500">${emp.role}</div>
                </td>
                <td class="px-6 py-4 text-slate-600 font-mono text-xs text-center">${formatMoney(emp.base)}</td>
                <td class="px-6 py-4 text-center text-slate-300">-</td> 
                <td class="px-6 py-4 text-center text-slate-300">-</td>
                <td class="px-6 py-4 font-bold text-slate-900">${formatMoney(displayMonto)}</td>
                <td class="px-6 py-4 text-center">${badge}</td>
                <td class="px-6 py-4 text-right">${actionBtn}</td>
            `;
            tableBody.appendChild(tr);
        });
    }

    // --- MODAL ---
    window.openModal = (id) => {
        const emp = employeesData.find(e => e.id === id);
        if(!emp) return;

        inputId.value = emp.id;
        modalName.textContent = emp.name;
        modalBase.textContent = formatMoney(emp.base);
        modalTotal.dataset.base = emp.base;

        // Reset inputs
        inputBonuses.value = 0;
        inputDiscounts.value = 0;
        
        // Si ya está generada/pagada, intentamos reconstruir el cálculo 
        // (Nota: como la BD no guarda bonos, mostramos la diferencia como "Otros")
        if (emp.status_code === 'generada' || emp.status_code === 'pagada') {
            const diff = emp.monto_guardado - emp.base;
            if(diff > 0) inputBonuses.value = diff;
            if(diff < 0) inputDiscounts.value = Math.abs(diff);
        }
        
        calculateTotal();

        // Configurar botones según estado
        setupModalButtons(emp);

        modal.classList.remove('hidden');
    };

    function setupModalButtons(emp) {
        // Limpiar botones dinámicos anteriores (excepto cancelar)
        const oldBtns = modalActionsContainer.querySelectorAll('.dynamic-btn');
        oldBtns.forEach(b => b.remove());
        
        // Ocultar botón original "Guardar" para usar los dinámicos
        modalCancel.nextElementSibling.style.display = 'none'; 

        // Botón 1: Generar / Actualizar Liquidación
        if (emp.status_code !== 'pagada') {
            const btnGen = document.createElement('button');
            btnGen.className = "dynamic-btn px-5 py-2.5 bg-white border border-indigo-600 text-indigo-600 font-bold rounded-lg hover:bg-indigo-50 transition mr-2";
            btnGen.textContent = emp.status_code === 'generada' ? "Actualizar Liquidación" : "Generar Liquidación";
            btnGen.onclick = () => submitPayroll('generar');
            modalActionsContainer.appendChild(btnGen);
        }

        // Botón 2: Pagar (Solo si ya está generada o si queremos flujo directo, 
        // pero siguiendo tu lógica: primero generamos, luego pagamos).
        if (emp.status_code !== 'pagada') {
            const btnPay = document.createElement('button');
            btnPay.className = "dynamic-btn px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition shadow-lg";
            btnPay.textContent = "Confirmar Pago (Remunerar)";
            // Si no está generada, podríamos bloquear el pago, pero permitiremos que el backend lo maneje (crea liq al vuelo)
            btnPay.onclick = () => {
                if(confirm("¿Estás seguro de realizar el pago? Esto registrará la remuneración.")) {
                    submitPayroll('pagar');
                }
            };
            modalActionsContainer.appendChild(btnPay);
        } else {
            // Si ya está pagada, solo texto informativo
            const msg = document.createElement('span');
            msg.className = "dynamic-btn text-green-600 font-bold px-4 self-center";
            msg.textContent = "✓ Remuneración Completada";
            modalActionsContainer.appendChild(msg);
        }
    }

    function calculateTotal() {
        const base = parseFloat(modalTotal.dataset.base) || 0;
        const b = parseFloat(inputBonuses.value) || 0;
        const d = parseFloat(inputDiscounts.value) || 0;
        modalTotal.textContent = formatMoney(base + b - d);
    }
    
    [inputBonuses, inputDiscounts].forEach(i => i.addEventListener('input', calculateTotal));

    async function submitPayroll(accion) {
        const id = parseInt(inputId.value);
        const emp = employeesData.find(e => e.id === id);
        
        const base = parseFloat(modalTotal.dataset.base) || 0;
        const b = parseFloat(inputBonuses.value) || 0;
        const d = parseFloat(inputDiscounts.value) || 0;
        const finalAmount = base + b - d;

        const payload = {
            current_user_id: currentUserId,
            integrante_id: id,
            periodo: `${filterYear.value}-${filterMonth.value.toString().padStart(2, '0')}`,
            monto: finalAmount,
            accion: accion // 'generar' o 'pagar'
        };

        try {
            const res = await fetch("https://cambiosorion.cl/data/remuneraciones.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            const json = await res.json();

            if (json.success) {
                modal.classList.add('hidden');
                fetchEmployees(); // Recargar para ver cambio de estado
            } else {
                alert("Error: " + json.message);
            }
        } catch (e) {
            console.error(e);
            alert("Error de red");
        }
    }

    function updateKPIs(data) {
        const total = data.reduce((acc, curr) => {
            return acc + (curr.status_code === 'pagada' || curr.status_code === 'generada' ? curr.monto_guardado : curr.base);
        }, 0);
        kpiTotal.textContent = formatMoney(total);
        kpiEmployees.textContent = data.length;
    }

    function initDateSelectors() {
        const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        filterMonth.innerHTML = '';
        months.forEach((m, i) => {
            const opt = new Option(m, i + 1);
            if(i === new Date().getMonth()) opt.selected = true;
            filterMonth.appendChild(opt);
        });
        
        filterYear.innerHTML = '';
        const y = new Date().getFullYear();
        for(let i=y; i>=2024; i--) filterYear.appendChild(new Option(i,i));
        
        filterMonth.addEventListener('change', fetchEmployees);
        filterYear.addEventListener('change', fetchEmployees);
    }
    
    function formatMoney(n) { return '$ ' + Math.round(n).toLocaleString('es-CL'); }
    
    modalClose.addEventListener('click', () => modal.classList.add('hidden'));
    modalCancel.addEventListener('click', () => modal.classList.add('hidden'));
});