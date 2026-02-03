import { initAdminHeader } from './header.js';

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Inicialización de Header
    const sessionData = await initAdminHeader('vacaciones');
    if (!sessionData.isAuthenticated) return;

    // 2. Estado Global
    let currentDate = new Date();
    const holidays = ['2026-01-01', '2026-04-03', '2026-05-01', '2026-09-18', '2026-09-19', '2026-12-25'];
    
    // Mock de datos (Aquí conectarás tu endpoint de Orion)
    const vacationData = [
        { user: "Juan Pérez", start: "2026-02-02", end: "2026-02-06", days: 5 },
        { user: "Maria Jara", start: "2026-02-16", end: "2026-02-20", days: 5 },
        { user: "Diego Soto", start: "2026-02-10", end: "2026-02-12", days: 3 }
    ];

    const monthNames = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

    // 3. Funciones Principales
    function renderAll() {
        const month = currentDate.getMonth();
        const year = currentDate.getFullYear();
        
        // Actualizar UI de filtros y títulos
        const titleEl = document.getElementById('current-month-year');
        if(titleEl) titleEl.textContent = `${monthNames[month]} ${year}`;
        
        document.getElementById('select-month').value = month;
        document.getElementById('select-year').value = year;

        const filtered = applyFilters();
        renderTable(filtered);
        renderCalendar(filtered);
    }

    function applyFilters() {
        const userFilter = document.getElementById('filter-user').value;
        const m = currentDate.getMonth();
        const y = currentDate.getFullYear();

        return vacationData.filter(v => {
            const d = new Date(v.start);
            const matchUser = userFilter === 'all' || v.user === userFilter;
            const matchMonth = d.getMonth() === m && d.getFullYear() === y;
            return matchUser && matchMonth;
        });
    }

    function renderTable(data) {
        const container = document.getElementById('table-container');
        if (!data.length) {
            container.innerHTML = `<div class="p-8 bg-white rounded-2xl border border-slate-100 text-center text-slate-400 text-sm">No hay registros para este periodo.</div>`;
            return;
        }

        container.innerHTML = `
            <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <table class="w-full text-left text-sm">
                    <thead class="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase">
                        <tr>
                            <th class="px-6 py-4">Colaborador</th>
                            <th class="px-6 py-4 text-center">Periodo</th>
                            <th class="px-6 py-4 text-right">Días</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-50">
                        ${data.map(v => `
                            <tr class="hover:bg-slate-50 transition-colors">
                                <td class="px-6 py-4 font-bold text-slate-700">${v.user}</td>
                                <td class="px-6 py-4 text-center text-slate-500 font-mono text-xs">${v.start} → ${v.end}</td>
                                <td class="px-6 py-4 text-right"><span class="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full font-bold text-xs">${v.days}</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>`;
    }

    function renderCalendar(data) {
        const container = document.getElementById('calendar-days');
        if(!container) return;
        container.innerHTML = '';

        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const offset = firstDay === 0 ? 6 : firstDay - 1;

        // Celdas vacías iniciales
        for (let i = 0; i < offset; i++) {
            const empty = document.createElement('div');
            empty.className = "calendar-day bg-slate-50/30 border-transparent";
            container.appendChild(empty);
        }

        for (let d = 1; d <= daysInMonth; d++) {
            const date = new Date(year, month, d);
            const dateStr = date.toISOString().split('T')[0];
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            const isHoliday = holidays.includes(dateStr);

            const dayEl = document.createElement('div');
            dayEl.className = `calendar-day border-slate-100 shadow-sm`;
            
            if (isWeekend || isHoliday) {
                dayEl.classList.add('bg-slate-50', 'opacity-50');
                dayEl.innerHTML = `<span class="text-xs font-bold text-slate-400">${d}</span>`;
            } else {
                dayEl.innerHTML = `<span class="text-xs font-bold text-slate-700 mb-2">${d}</span>`;
                
                // Buscar quién está fuera este día
                const users = data.filter(v => dateStr >= v.start && dateStr <= v.end);
                if (users.length > 0) {
                    const list = document.createElement('div');
                    list.className = "flex flex-col gap-1 overflow-y-auto pr-1";
                    users.forEach(u => {
                        list.innerHTML += `<div class="text-[9px] bg-indigo-600 text-white px-2 py-1 rounded-lg font-bold truncate shadow-sm">
                            ${u.user.split(' ')[0]}
                        </div>`;
                    });
                    dayEl.appendChild(list);
                    dayEl.classList.add('bg-indigo-50/30', 'border-indigo-100', 'ring-1', 'ring-indigo-100');
                }
            }
            container.appendChild(dayEl);
        }
    }

    // 4. Eventos y Selectores
    function setup() {
        const mSel = document.getElementById('select-month');
        const ySel = document.getElementById('select-year');
        const uSel = document.getElementById('filter-user');

        monthNames.forEach((m, i) => mSel.add(new Option(m.charAt(0).toUpperCase() + m.slice(1), i)));
        for(let y = 2025; y <= 2027; y++) ySel.add(new Option(y, y));
        
        // Poblar filtro de usuarios único
        const users = [...new Set(vacationData.map(v => v.user))];
        users.forEach(u => uSel.add(new Option(u, u)));

        // Listeners
        document.getElementById('prev-month').onclick = () => { currentDate.setMonth(currentDate.getMonth() - 1); renderAll(); };
        document.getElementById('next-month').onclick = () => { currentDate.setMonth(currentDate.getMonth() + 1); renderAll(); };
        mSel.onchange = (e) => { currentDate.setMonth(e.target.value); renderAll(); };
        ySel.onchange = (e) => { currentDate.setFullYear(e.target.value); renderAll(); };
        uSel.onchange = () => renderAll();
        document.getElementById('btn-today').onclick = () => { currentDate = new Date(); renderAll(); };

        renderAll();
    }

    setup();
});