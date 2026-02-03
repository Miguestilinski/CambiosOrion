document.addEventListener('DOMContentLoaded', () => {
    // Configuración de Flatpickr (Español)
    const fpConfig = {
        locale: "es",
        dateFormat: "Y-m-d",
        onChange: () => renderAll()
    };

    const startPicker = flatpickr("#fecha-inicio", fpConfig);
    const endPicker = flatpickr("#fecha-fin", fpConfig);

    // Mock de datos (Aquí conectarás con tu DB de Orion)
    const vacationData = [
        { id: 1, user: "Juan Pérez", start: "2026-02-10", end: "2026-02-15", days: 6 },
        { id: 2, user: "Maria Jara", start: "2026-02-01", end: "2026-02-05", days: 5 },
        { id: 3, user: "Diego Soto", start: "2026-02-20", end: "2026-02-28", days: 9 }
    ];

    function renderAll() {
        const filtered = applyFilters();
        renderTable(filtered);
        renderCalendar(filtered);
    }

    function applyFilters() {
        const user = document.getElementById('filter-user').value;
        const start = document.getElementById('fecha-inicio').value;
        const end = document.getElementById('fecha-fin').value;

        return vacationData.filter(v => {
            const matchUser = user === 'all' || v.user === user;
            // Lógica simple de solapamiento de fechas
            const matchDate = (!start || v.end >= start) && (!end || v.start <= end);
            return matchUser && matchDate;
        });
    }

    function renderTable(data) {
        const container = document.getElementById('table-container');
        if (data.length === 0) {
            container.innerHTML = `<div class="p-10 text-center text-slate-400 text-sm">No hay registros para este filtro.</div>`;
            return;
        }

        let html = `
            <table class="w-full text-left text-sm">
                <thead class="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase">
                    <tr>
                        <th class="px-6 py-4">Colaborador</th>
                        <th class="px-6 py-4 text-center">Desde - Hasta</th>
                        <th class="px-6 py-4 text-right">Días Corridos</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-50">
                    ${data.map(v => `
                        <tr class="hover:bg-slate-50/50 transition-colors">
                            <td class="px-6 py-4 font-bold text-slate-700">${v.user}</td>
                            <td class="px-6 py-4 text-center text-slate-500 font-mono text-xs">${v.start} <span class="text-indigo-300 mx-2">→</span> ${v.end}</td>
                            <td class="px-6 py-4 text-right"><span class="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full font-bold text-xs">${v.days}</span></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>`;
        container.innerHTML = html;
    }

    function renderCalendar(data) {
        const container = document.getElementById('calendar-container');
        container.innerHTML = '';
        
        // Obtenemos el mes actual para el calendario visual (puedes dinamizarlo)
        const now = new Date();
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

        for (let i = 1; i <= daysInMonth; i++) {
            const dateStr = `2026-02-${String(i).padStart(2, '0')}`;
            const activeVacations = data.filter(v => dateStr >= v.start && dateStr <= v.end);
            
            const dayCard = document.createElement('div');
            dayCard.className = `min-h-[80px] p-2 bg-white flex flex-col gap-1 border-slate-50`;
            
            dayCard.innerHTML = `
                <span class="text-[10px] font-bold text-slate-300">${i}</span>
                <div class="flex flex-col gap-1">
                    ${activeVacations.map(v => `
                        <div class="text-[9px] bg-indigo-500 text-white p-1 rounded-sm leading-none truncate" title="${v.user}">
                            ${v.user.split(' ')[0]}
                        </div>
                    `).join('')}
                </div>
            `;
            container.appendChild(dayCard);
        }
    }

    // Inicializar
    renderAll();
});