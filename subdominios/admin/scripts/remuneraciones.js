import { initAdminHeader } from './header.js';

document.addEventListener('DOMContentLoaded', async () => {
    // --- REFERENCIAS DOM LOCALES ---
    const tableBody = document.getElementById('payroll-table-body');
    const kpiTotal = document.getElementById('total-payroll');
    const kpiEmployees = document.getElementById('total-employees');
    
    const filterMonth = document.getElementById('filter-month');
    const filterYear = document.getElementById('filter-year');
    
    // Botón Masivo
    const btnProcessAll = document.getElementById('btn-process-all');
    if(btnProcessAll) {
        btnProcessAll.innerHTML = `
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
            Pagar Pendientes
        `;
    }

    // --- 1. INICIALIZACIÓN GLOBAL ---
    // Carga sesión, sidebar, header y marca 'remuneraciones' como activo
    const sessionData = await initAdminHeader('remuneraciones');

    if (!sessionData.isAuthenticated) return;

    // --- 2. SEGURIDAD Y CONFIGURACIÓN ---
    let currentUserId = sessionData.equipo_id;
    const role = (sessionData.rol || '').toLowerCase().trim();
    
    // Lista de roles permitidos para ver Remuneraciones
    const allowedRoles = ['socio', 'admin', 'gerente', 'rrhh'];

    if (!allowedRoles.includes(role)) {
        window.location.href = 'index'; // Redirigir si no tiene permiso
        return;
    }

    let employeesData = [];

    // --- 3. INICIAR LÓGICA DE PÁGINA ---
    initDateSelectors();
    fetchEmployees();

    // Modal Refs
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
            const isPaid = emp.is_paid;
            
            let badge, actionBtn, displayMonto;

            if (isPaid) {
                displayMonto = emp.monto_pagado;
                badge = '<span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200">Pagado</span>';
                actionBtn = `<button onclick="window.openModal(${emp.id})" class="text-slate-400 hover:text-slate-600 font-medium text-xs">Ver / Editar</button>`;
            } else {
                displayMonto = emp.base;
                badge = '<span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200">Pendiente</span>';
                actionBtn = `<button onclick="window.openModal(${emp.id})" class="text-white bg-indigo-600 hover:bg-indigo-700 font-medium rounded text-xs px-3 py-1.5 transition shadow-sm">Pagar Ahora</button>`;
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

    // --- MODAL (Pago Individual) ---
    window.openModal = (id) => {
        const emp = employeesData.find(e => e.id === id);
        if(!emp) return;

        inputId.value = emp.id;
        modalName.textContent = emp.name;
        modalBase.textContent = formatMoney(emp.base);
        modalTotal.dataset.base = emp.base;

        // Reset
        inputBonuses.value = 0;
        inputDiscounts.value = 0;
        
        // Si ya está pagado, intentamos calcular diferencias visuales
        if (emp.is_paid) {
            const diff = emp.monto_pagado - emp.base;
            if(diff > 0) inputBonuses.value = diff;
            if(diff < 0) inputDiscounts.value = Math.abs(diff);
            modalSave.textContent = "Actualizar Pago";
        } else {
            modalSave.textContent = "Confirmar Pago";
        }
        
        calculateTotal();
        modal.classList.remove('hidden');
    };

    function calculateTotal() {
        const base = parseFloat(modalTotal.dataset.base) || 0;
        const b = parseFloat(inputBonuses.value) || 0;
        const d = parseFloat(inputDiscounts.value) || 0;
        modalTotal.textContent = formatMoney(base + b - d);
    }
    
    [inputBonuses, inputDiscounts].forEach(i => i.addEventListener('input', calculateTotal));

    // ACCIÓN: Pagar Individual (Guardar desde Modal)
    modalSave.addEventListener('click', async () => {
        const id = parseInt(inputId.value);
        const base = parseFloat(modalTotal.dataset.base) || 0;
        const b = parseFloat(inputBonuses.value) || 0;
        const d = parseFloat(inputDiscounts.value) || 0;
        const finalAmount = base + b - d;

        const payload = {
            current_user_id: currentUserId,
            accion: 'pagar_uno',
            integrante_id: id,
            periodo: `${filterYear.value}-${filterMonth.value.toString().padStart(2, '0')}`,
            monto: finalAmount
        };

        modalSave.disabled = true;
        modalSave.textContent = "Procesando...";

        try {
            const res = await fetch("https://cambiosorion.cl/data/remuneraciones.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            const json = await res.json();

            if (json.success) {
                modal.classList.add('hidden');
                fetchEmployees(); // Recargar tabla
            } else {
                alert("Error: " + json.message);
            }
        } catch (e) {
            console.error(e);
            alert("Error de conexión");
        } finally {
            modalSave.disabled = false;
        }
    });

    // ACCIÓN: Pagar Todos (Masivo)
    if(btnProcessAll) {
        btnProcessAll.addEventListener('click', async () => {
            if(!confirm(`¿Estás seguro de pagar a TODOS los pendientes del mes ${filterMonth.options[filterMonth.selectedIndex].text}?`)) {
                return;
            }

            const payload = {
                current_user_id: currentUserId,
                accion: 'pagar_todos',
                periodo: `${filterYear.value}-${filterMonth.value.toString().padStart(2, '0')}`
            };

            btnProcessAll.disabled = true;
            btnProcessAll.textContent = "Procesando...";

            try {
                const res = await fetch("https://cambiosorion.cl/data/remuneraciones.php", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
                const json = await res.json();

                if (json.success) {
                    alert(json.message);
                    fetchEmployees(); // Refrescar tabla
                } else {
                    alert("Error: " + json.message);
                }
            } catch (e) {
                console.error(e);
                alert("Error de conexión");
            } finally {
                btnProcessAll.disabled = false;
                btnProcessAll.innerHTML = `
                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                    Pagar Pendientes
                `;
            }
        });
    }

    function updateKPIs(data) {
        const total = data.reduce((acc, curr) => {
            return acc + (curr.is_paid ? curr.monto_pagado : curr.base);
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