import { initAdminHeader } from './header.js';

document.addEventListener('DOMContentLoaded', async () => {
    const sessionData = await initAdminHeader('vacaciones');
    if (!sessionData.isAuthenticated) return;

    let currentDate = new Date();
    // Feriados base (puedes traerlos de tu API)
    const holidays = ['2025-01-01', '2025-09-18', '2025-09-19', '2025-12-25', '2026-01-01'];
    
    // Simulación de datos de todos los trabajadores (Socio View)
    let vacationData = [
        { id: 101, user: "Juan Pérez", start: "2026-02-02", end: "2026-02-06", days: 5 },
        { id: 102, user: "Maria Jara", start: "2026-02-16", end: "2026-02-20", days: 5 },
        { id: 103, user: "Diego Soto", start: "2026-02-10", end: "2026-02-12", days: 3 }
    ];

    const monthNames = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

    function init() {
        populateSelectors();
        setupEventListeners();
        populateUserFilter();
        renderAll();
    }

    function renderAll() {
        const month = currentDate.getMonth();
        const year = currentDate.getFullYear();
        
        document.getElementById('current-month-year').textContent = `${monthNames[month]} ${year}`;
        document.getElementById('select-month').value = month;
        document.getElementById('select-year').value = year;

        const filtered = applyFilters();
        renderTable(filtered);
        renderCalendar(filtered);
    }

    function applyFilters() {
        const selectedUser = document.getElementById('filter-user').value;
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();

        return vacationData.filter(v => {
            const dateV = new Date(v.start);
            const matchUser = selectedUser === 'all' || v.user === selectedUser;
            const matchMonth = dateV.getMonth() === currentMonth && dateV.getFullYear() === currentYear;
            return matchUser && matchMonth;
        });
    }

    function renderTable(data) {
        const container = document.getElementById('table-container');
        if (data.length === 0) {
            container.innerHTML = `<div class="p-10 bg-white rounded-2xl border border-dashed border-slate-200 text-center text-slate-400 text-sm">No hay registros para este mes.</div>`;
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
                            <tr class="hover:bg-slate-50/50 transition-colors">
                                <td class="px-6 py-4 font-bold text-slate-700">${v.user}</td>
                                <td class="px-6 py-4 text-center text-slate-500 font-mono text-xs">${v.start} <span class="text-indigo-300">→</span> ${v.end}</td>
                                <td class="px-6 py-4 text-right"><span class="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full font-bold text-xs">${v.days}</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>`;
    }

    function renderCalendar(data) {
        const container = document.getElementById('calendar-days');
        container.innerHTML = '';

        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const offset = firstDay === 0 ? 6 : firstDay - 1;

        for (let i = 0; i < offset; i++) container.appendChild(document.createElement('div'));

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateStr = date.toISOString().split('T')[0];
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            const isHoliday = holidays.includes(dateStr);

            const dayEl = document.createElement('div');
            dayEl.className = `relative aspect-square rounded-2xl flex flex-col p-2 border transition-all duration-300`;
            
            if (isWeekend || isHoliday) {
                dayEl.classList.add('bg-slate-50', 'border-transparent', 'opacity-40');
                dayEl.innerHTML = `<span class="text-xs font-bold text-slate-400">${day}</span>`;
            } else {
                dayEl.classList.add('bg-white', 'border-slate-100');
                dayEl.innerHTML = `<span class="text-xs font-bold text-slate-700">${day}</span>`;
                
                const active = data.filter(v => dateStr >= v.start && dateStr <= v.end);
                if (active.length > 0) {
                    const list = document.createElement('div');
                    list.className = "mt-1 flex flex-col gap-1 overflow-y-auto";
                    active.forEach(u => {
                        list.innerHTML += `<div class="text-[7px] md:text-[9px] bg-indigo-600 text-white px-1.5 py-0.5 rounded-md truncate font-bold shadow-sm shadow-indigo-200">
                            ${u.user.split(' ')[0]}
                        </div>`;
                    });
                    dayEl.appendChild(list);
                    dayEl.classList.add('ring-2', 'ring-indigo-500/10', 'bg-indigo-50/20', 'border-indigo-100');
                }
            }
            container.appendChild(dayEl);
        }
    }

    function populateSelectors() {
        const mSel = document.getElementById('select-month');
        const ySel = document.getElementById('select-year');
        monthNames.forEach((m, i) => mSel.add(new Option(m.charAt(0).toUpperCase() + m.slice(1), i)));
        for(let y = 2024; y <= 2027; y++) ySel.add(new Option(y, y));
    }

    function populateUserFilter() {
        const names = [...new Set(vacationData.map(v => v.user))];
        const filter = document.getElementById('filter-user');
        names.forEach(n => filter.add(new Option(n, n)));
    }

    function setupEventListeners() {
        document.getElementById('prev-month').onclick = () => { currentDate.setMonth(currentDate.getMonth() - 1); renderAll(); };
        document.getElementById('next-month').onclick = () => { currentDate.setMonth(currentDate.getMonth() + 1); renderAll(); };
        document.getElementById('select-month').onchange = (e) => { currentDate.setMonth(e.target.value); renderAll(); };
        document.getElementById('select-year').onchange = (e) => { currentDate.setFullYear(e.target.value); renderAll(); };
        document.getElementById('filter-user').onchange = () => renderAll();
        document.getElementById('btn-today').onclick = () => { currentDate = new Date(); renderAll(); };
    }

    init();
});