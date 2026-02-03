import { initAdminHeader } from './header.js';

document.addEventListener('DOMContentLoaded', async () => {
    const sessionData = await initAdminHeader('vacaciones');
    
    // State global compartido con el estilo de vacaciones.js
    let currentDate = new Date();
    const holidays = ['2025-01-01', '2025-09-18', '2025-09-19', '2025-12-25']; // Ejemplo Orion
    
    // Mock de datos (Aquí vendría tu fetch real)
    const vacationData = [
        { user: "Juan Pérez", start: "2026-02-10", end: "2026-02-15" },
        { user: "Maria Jara", start: "2026-02-01", end: "2026-02-05" }
    ];

    const monthNames = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
    
    function init() {
        populateSelectors();
        setupEventListeners();
        renderAll();
    }

    function populateSelectors() {
        const monthSelect = document.getElementById('select-month');
        const yearSelect = document.getElementById('select-year');
        
        monthNames.forEach((m, i) => {
            const opt = new Option(m.charAt(0).toUpperCase() + m.slice(1), i);
            monthSelect.add(opt);
        });

        for(let y = 2024; y <= 2027; y++) {
            yearSelect.add(new Option(y, y));
        }

        monthSelect.value = currentDate.getMonth();
        yearSelect.value = currentDate.getFullYear();
    }

    function renderAll() {
        const month = currentDate.getMonth();
        const year = currentDate.getFullYear();
        
        // Actualizar Texto y Selectores
        document.getElementById('current-month-year').textContent = `${monthNames[month]} ${year}`;
        document.getElementById('select-month').value = month;
        document.getElementById('select-year').value = year;

        renderCalendar();
        renderTable();
    }

    function renderCalendar() {
        const container = document.getElementById('calendar-days');
        container.innerHTML = '';

        const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
        const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
        
        // Ajuste para que lunes sea el primer día (como en vacaciones.js)
        const offset = firstDay === 0 ? 6 : firstDay - 1;

        // Celdas vacías
        for (let i = 0; i < offset; i++) {
            container.appendChild(document.createElement('div'));
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            const dateStr = date.toISOString().split('T')[0];
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            const isHoliday = holidays.includes(dateStr);

            const dayEl = document.createElement('div');
            // Usando exactamente las mismas clases de vacaciones.html
            dayEl.className = `calendar-day relative aspect-square rounded-2xl flex flex-col p-2 border transition-all duration-300`;
            
            if (isWeekend || isHoliday) {
                dayEl.classList.add('bg-slate-50', 'border-transparent', 'opacity-40');
                dayEl.innerHTML = `<span class="text-xs font-bold text-slate-400">${day}</span>`;
            } else {
                dayEl.classList.add('bg-white', 'border-slate-100', 'hover:border-indigo-200');
                dayEl.innerHTML = `<span class="text-xs font-bold text-slate-700">${day}</span>`;
                
                // Pintar trabajadores en vacaciones
                const usersOut = vacationData.filter(v => dateStr >= v.start && dateStr <= v.end);
                if (usersOut.length > 0) {
                    const list = document.createElement('div');
                    list.className = "mt-1 flex flex-col gap-0.5 overflow-hidden";
                    usersOut.forEach(u => {
                        list.innerHTML += `<div class="text-[8px] bg-indigo-600 text-white px-1 rounded-sm truncate font-bold">${u.user.split(' ')[0]}</div>`;
                    });
                    dayEl.appendChild(list);
                    dayEl.classList.add('ring-2', 'ring-indigo-500/10', 'bg-indigo-50/30');
                }
            }
            container.appendChild(dayEl);
        }
    }

    function setupEventListeners() {
        document.getElementById('prev-month').onclick = () => {
            currentDate.setMonth(currentDate.getMonth() - 1);
            renderAll();
        };
        document.getElementById('next-month').onclick = () => {
            currentDate.setMonth(currentDate.getMonth() + 1);
            renderAll();
        };
        document.getElementById('select-month').onchange = (e) => {
            currentDate.setMonth(e.target.value);
            renderAll();
        };
        document.getElementById('select-year').onchange = (e) => {
            currentDate.setFullYear(e.target.value);
            renderAll();
        };
        document.getElementById('btn-today').onclick = () => {
            currentDate = new Date();
            renderAll();
        };
    }

    init();
});