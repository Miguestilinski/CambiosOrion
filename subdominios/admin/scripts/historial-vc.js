import { initAdminHeader } from './header.js';

document.addEventListener('DOMContentLoaded', async () => {
    // 1. REFERENCIAS DOM
    const historyContent = document.getElementById('history-content');
    const filterUser = document.getElementById('filter-user');
    const filterMonth = document.getElementById('filter-month');
    const btnViewList = document.getElementById('view-list');
    const btnViewCalendar = document.getElementById('view-calendar');

    // 2. ESTADO
    let currentView = 'list'; // 'list' o 'calendar'
    let allVacations = [
        { id: 1, name: "Maria Gonzalez", start: "2025-06-10", end: "2025-06-11", status: "approved", days: 2 },
        { id: 2, name: "Juan Perez", start: "2025-07-01", end: "2025-07-03", status: "approved", days: 3 },
        { id: 3, name: "Maria Gonzalez", start: "2025-02-10", end: "2025-02-12", status: "approved", days: 3 },
        { id: 4, name: "Diego Jara", start: "2025-02-15", end: "2025-02-20", status: "pending", days: 5 }
    ];

    const sessionData = await initAdminHeader('vacaciones');
    if (!sessionData.isAuthenticated) return;

    // 3. INICIALIZACIÓN
    populateUserFilter();
    render();

    // 4. EVENTOS
    filterUser.addEventListener('change', render);
    filterMonth.addEventListener('change', render);

    btnViewList.addEventListener('click', () => {
        currentView = 'list';
        updateViewButtons();
        render();
    });

    btnViewCalendar.addEventListener('click', () => {
        currentView = 'calendar';
        updateViewButtons();
        render();
    });

    // 5. FUNCIONES DE RENDERIZADO
    function render() {
        const filtered = applyFilters();
        historyContent.innerHTML = '';

        if (currentView === 'list') {
            renderTableView(filtered);
        } else {
            renderCalendarView(filtered);
        }
    }

    function applyFilters() {
        return allVacations.filter(v => {
            const matchUser = filterUser.value === 'all' || v.name === filterUser.value;
            const matchMonth = !filterMonth.value || v.start.startsWith(filterMonth.value);
            return matchUser && matchMonth;
        });
    }

    function renderTableView(data) {
        if (data.length === 0) {
            historyContent.innerHTML = `<div class="text-center py-10 text-slate-400">No se encontraron registros.</div>`;
            return;
        }

        const table = document.createElement('div');
        table.className = "bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm";
        table.innerHTML = `
            <table class="w-full text-left text-sm">
                <thead class="bg-slate-50 border-b border-gray-100 text-slate-500 uppercase text-[10px] font-bold">
                    <tr>
                        <th class="px-6 py-4">Colaborador</th>
                        <th class="px-6 py-4">Periodo</th>
                        <th class="px-6 py-4 text-center">Días</th>
                        <th class="px-6 py-4 text-right">Estado</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-50" id="table-body"></tbody>
            </table>
        `;

        const tbody = table.querySelector('#table-body');
        data.forEach(item => {
            const statusClass = item.status === 'approved' ? 'text-green-600 bg-green-50' : 'text-amber-600 bg-amber-50';
            const row = document.createElement('tr');
            row.className = "hover:bg-slate-50/50 transition";
            row.innerHTML = `
                <td class="px-6 py-4 font-bold text-slate-700">${item.name}</td>
                <td class="px-6 py-4 text-slate-500">${item.start} al ${item.end}</td>
                <td class="px-6 py-4 text-center font-medium">${item.days}</td>
                <td class="px-6 py-4 text-right">
                    <span class="px-2 py-1 rounded-full text-[10px] font-bold uppercase ${statusClass}">${item.status === 'approved' ? 'Aprobado' : 'Pendiente'}</span>
                </td>
            `;
            tbody.appendChild(row);
        });
        historyContent.appendChild(table);
    }

    function renderCalendarView(data) {
        // Aquí podrías integrar FullCalendar.js o reutilizar tu lógica de celdas.
        // Por simplicidad para el socio, mostraremos un "Heatmap" o lista resumida por mes.
        historyContent.innerHTML = `
            <div class="bg-indigo-900 text-white p-8 rounded-2xl text-center">
                <p class="opacity-70 mb-2 uppercase text-xs font-bold tracking-widest">Vista de Calendario Global</p>
                <h3 class="text-xl font-medium">Esta vista permite ver solapamientos entre equipos.</h3>
                <div class="mt-6 grid grid-cols-7 gap-2 max-w-md mx-auto" id="mini-calendar-placeholder">
                    </div>
            </div>
        `;
    }

    function updateViewButtons() {
        if (currentView === 'list') {
            btnViewList.classList.add('bg-white', 'shadow-sm', 'text-indigo-600');
            btnViewCalendar.classList.remove('bg-white', 'shadow-sm', 'text-indigo-600');
        } else {
            btnViewCalendar.classList.add('bg-white', 'shadow-sm', 'text-indigo-600');
            btnViewList.classList.remove('bg-white', 'shadow-sm', 'text-indigo-600');
        }
    }

    function populateUserFilter() {
        const names = [...new Set(allVacations.map(v => v.name))];
        names.forEach(name => {
            const opt = document.createElement('option');
            opt.value = name;
            opt.textContent = name;
            filterUser.appendChild(opt);
        });
    }
});