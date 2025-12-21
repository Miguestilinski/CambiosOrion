document.addEventListener('DOMContentLoaded', () => {
    // Referencias DOM
    const headerBadge = document.getElementById('header-badge');
    const headerName = document.getElementById('header-user-name');
    const headerEmail = document.getElementById('dropdown-user-email');
    const sidebarContainer = document.getElementById('sidebar-container');
    
    // Calendar DOM
    const calendarDays = document.getElementById('calendar-days');
    const monthYearText = document.getElementById('current-month-year');
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    
    // Stats & Request DOM
    const daysAvailableEl = document.getElementById('days-available');
    const daysEarnedEl = document.getElementById('days-earned');
    const daysTakenEl = document.getElementById('days-taken');
    const selectedCountEl = document.getElementById('selected-count');
    const selectedDatesText = document.getElementById('selected-dates-text');
    const requestBtn = document.getElementById('btn-request-vacation');
    const myRequestsList = document.getElementById('my-requests-list');

    // Admin DOM
    const adminPanel = document.getElementById('admin-vacations-panel');
    const pendingContainer = document.getElementById('pending-requests-container');

    // State
    let currentDate = new Date(); // Mes visualizado
    let selectedDates = new Set(); // Fechas seleccionadas (Set para unicidad)
    let holidays = ['2025-01-01', '2025-04-18', '2025-04-19', '2025-05-01', '2025-05-21', '2025-06-20', '2025-07-16', '2025-08-15', '2025-09-18', '2025-09-19', '2025-10-31', '2025-11-01', '2025-12-08', '2025-12-25']; // Mock Feriados CL
    let myVacations = [
        { date: '2025-02-10', status: 'approved' },
        { date: '2025-02-11', status: 'approved' },
        { date: '2025-02-12', status: 'approved' },
        { date: '2025-03-20', status: 'pending' }
    ]; // Mock Mis Vacaciones

    let pendingRequests = [
        { id: 101, name: "Maria Gonzalez", dates: ["2025-06-10", "2025-06-11"], total: 2 },
        { id: 102, name: "Juan Perez", dates: ["2025-07-01", "2025-07-02", "2025-07-03"], total: 3 }
    ]; // Mock Admin Requests

    // --- INITIALIZATION ---
    getSession();
    
    prevMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });
    nextMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });

    requestBtn.addEventListener('click', () => {
        document.getElementById('modal-success').classList.remove('hidden');
        selectedDates.clear();
        updateSelectionUI();
        renderCalendar();
    });

    // --- LOGIC ---
    async function getSession() {
        try {
            const res = await fetch("https://cambiosorion.cl/data/session_status.php", { credentials: "include" });
            if (!res.ok) throw new Error("Error sesión");
            const data = await res.json();
            
            if (!data.isAuthenticated) {
                window.location.href = 'https://admin.cambiosorion.cl/login';
                return;
            }

            if(headerName) headerName.textContent = (data.nombre || 'Usuario').split(' ')[0];
            if(headerEmail) headerEmail.textContent = data.correo;

            const role = (data.rol || '').toLowerCase().trim();
            configureSidebar(role);
            loadPersonalStats();
            renderCalendar();
            renderMyRequestsList();

            const superUsers = ['socio', 'admin', 'gerente'];
            if (superUsers.includes(role)) {
                setupAdminView();
            } else {
                if(headerBadge) {
                    headerBadge.textContent = "PORTAL COLABORADOR";
                    headerBadge.className = "hidden md:inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 tracking-wider uppercase";
                }
            }

        } catch (error) {
            console.error(error);
        }
    }

    function configureSidebar(rol) {
        const superUsers = ['socio', 'admin', 'gerente']; 
        const isSuperUser = superUsers.includes(rol);

        fetch('sidebar.html')
            .then(res => res.text())
            .then(html => {
                if(sidebarContainer) {
                    sidebarContainer.innerHTML = html;
                    const adminItems = sidebarContainer.querySelectorAll('.admin-only');
                    if (isSuperUser) adminItems.forEach(item => item.classList.remove('hidden'));
                    else adminItems.forEach(item => item.remove());
                    
                    const active = sidebarContainer.querySelector('a[href="vacaciones"]');
                    if(active) active.classList.add('bg-indigo-50', 'text-indigo-700', 'font-bold');
                }
            });
    }

    // --- CALENDAR LOGIC ---
    function renderCalendar() {
        calendarDays.innerHTML = '';
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        
        // Texto Mes Año
        const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
        monthYearText.textContent = `${monthNames[month]} ${year}`;

        // Cálculos días
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDay = (firstDay.getDay() + 6) % 7; // Ajustar para que Lunes sea 0

        // Días vacíos previos
        for (let i = 0; i < startingDay; i++) {
            const empty = document.createElement('div');
            calendarDays.appendChild(empty);
        }

        // Días del mes
        for (let i = 1; i <= daysInMonth; i++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            const dateObj = new Date(year, month, i);
            const dayOfWeek = dateObj.getDay(); // 0 = Domingo, 6 = Sábado

            const dayEl = document.createElement('div');
            dayEl.textContent = i;
            dayEl.className = 'calendar-day';
            dayEl.dataset.date = dateStr;

            // 1. Verificar Fin de Semana
            if (dayOfWeek === 0 || dayOfWeek === 6) {
                dayEl.classList.add('disabled');
            } 
            // 2. Verificar Feriados
            else if (holidays.includes(dateStr)) {
                dayEl.classList.add('holiday', 'disabled');
                addTooltip(dayEl, "Feriado");
            } 
            // 3. Verificar Vacaciones Ya Tomadas
            else {
                const existing = myVacations.find(v => v.date === dateStr);
                if (existing) {
                    dayEl.classList.add(existing.status); // 'approved' or 'pending'
                    dayEl.classList.add('disabled'); // No se puede volver a seleccionar
                    addTooltip(dayEl, existing.status === 'approved' ? 'Aprobado' : 'Pendiente');
                } else {
                    // Día seleccionable
                    dayEl.addEventListener('click', () => toggleDateSelection(dateStr, dayEl));
                    if (selectedDates.has(dateStr)) {
                        dayEl.classList.add('selected');
                    }
                }
            }

            calendarDays.appendChild(dayEl);
        }
    }

    function addTooltip(el, text) {
        const span = document.createElement('span');
        span.className = 'day-tooltip';
        span.textContent = text;
        el.appendChild(span);
    }

    function toggleDateSelection(dateStr, element) {
        if (selectedDates.has(dateStr)) {
            selectedDates.delete(dateStr);
            element.classList.remove('selected');
        } else {
            selectedDates.add(dateStr);
            element.classList.add('selected');
        }
        updateSelectionUI();
    }

    function updateSelectionUI() {
        const count = selectedDates.size;
        selectedCountEl.textContent = count;
        
        if (count > 0) {
            requestBtn.disabled = false;
            requestBtn.classList.remove('bg-slate-100', 'text-slate-400', 'cursor-not-allowed');
            requestBtn.classList.add('bg-blue-600', 'text-white', 'hover:bg-blue-700', 'cursor-pointer');
            
            // Ordenar y mostrar fechas
            const sorted = Array.from(selectedDates).sort();
            selectedDatesText.textContent = `${sorted[0]} ... ${sorted[sorted.length-1]}`;
        } else {
            requestBtn.disabled = true;
            requestBtn.classList.add('bg-slate-100', 'text-slate-400', 'cursor-not-allowed');
            requestBtn.classList.remove('bg-blue-600', 'text-white', 'hover:bg-blue-700', 'cursor-pointer');
            selectedDatesText.textContent = "Ninguna";
        }
    }

    // --- PERSONAL DATA ---
    function loadPersonalStats() {
        // Mock data
        daysAvailableEl.textContent = "12";
        daysEarnedEl.textContent = "15";
        daysTakenEl.textContent = "3";
    }

    function renderMyRequestsList() {
        // Agrupar 'myVacations' por bloques continuos es complejo,
        // aquí solo listamos las fechas simples para el demo
        myRequestsList.innerHTML = '';
        // Mock de bloques
        const requests = [
            { dates: "10 Feb - 12 Feb 2025", days: 3, status: "approved" },
            { dates: "20 Mar 2025", days: 1, status: "pending" }
        ];

        requests.forEach(req => {
            const color = req.status === 'approved' ? 'text-green-600 bg-green-50 border-green-100' : 'text-yellow-600 bg-yellow-50 border-yellow-100';
            const label = req.status === 'approved' ? 'Aprobado' : 'Pendiente';
            
            const div = document.createElement('div');
            div.className = `p-3 rounded-lg border ${color} flex justify-between items-center text-sm`;
            div.innerHTML = `
                <div>
                    <span class="font-bold block">${req.dates}</span>
                    <span class="opacity-75 text-xs">${req.days} días hábiles</span>
                </div>
                <span class="font-bold text-xs uppercase tracking-wide px-2 py-1 rounded-full bg-white/50">${label}</span>
            `;
            myRequestsList.appendChild(div);
        });
    }

    // --- ADMIN LOGIC ---
    function setupAdminView() {
        if(adminPanel) adminPanel.classList.remove('hidden');
        if(headerBadge) {
            headerBadge.textContent = "PORTAL SOCIOS";
            headerBadge.className = "hidden md:inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 tracking-wider uppercase";
        }
        renderPendingRequests();
    }

    function renderPendingRequests() {
        pendingContainer.innerHTML = '';
        if (pendingRequests.length === 0) {
            pendingContainer.innerHTML = `<div class="text-center text-slate-400 py-4">No hay solicitudes pendientes.</div>`;
            return;
        }

        pendingRequests.forEach(req => {
            const el = document.createElement('div');
            el.className = "bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 transition hover:shadow-md";
            el.innerHTML = `
                <div class="flex items-center gap-3 w-full sm:w-auto">
                    <div class="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-lg">👤</div>
                    <div>
                        <h4 class="font-bold text-slate-800">${req.name}</h4>
                        <p class="text-sm text-slate-500">Solicita <strong class="text-indigo-600">${req.total} días</strong></p>
                        <p class="text-xs text-slate-400">${req.dates.join(', ')}</p>
                    </div>
                </div>
                <div class="flex gap-2 w-full sm:w-auto justify-end">
                    <button onclick="window.handleRequest(${req.id}, 'reject')" class="px-4 py-2 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition">Rechazar</button>
                    <button onclick="window.handleRequest(${req.id}, 'approve')" class="px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition shadow-lg shadow-indigo-500/30">Aprobar</button>
                </div>
            `;
            pendingContainer.appendChild(el);
        });
    }

    window.handleRequest = (id, action) => {
        // Simular llamada API
        pendingRequests = pendingRequests.filter(r => r.id !== id);
        renderPendingRequests();
        alert(`Solicitud ${action === 'approve' ? 'aprobada' : 'rechazada'} correctamente.`);
    };
});