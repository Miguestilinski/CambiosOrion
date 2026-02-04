// Simulación de sesión (Para pruebas)
const currentUser = {
    name: "Benjamin Socio",
    role: "admin" // Cambiar a 'worker' para ver la vista limitada
};

// Datos Mock (Simulando lo que vendría del reloj control)
// El reloj marca "check_in" y "check_out" en formato HH:mm:ss
const attendanceDB = [
    { date: "2026-02-02", userId: 1, user: "Juan Pérez", checkIn: "08:55:00", checkOut: "17:05:00" },
    { date: "2026-02-02", userId: 2, user: "Maria Jara", checkIn: "09:10:00", checkOut: "17:00:00" }, // Tolerancia OK
    { date: "2026-02-02", userId: 3, user: "Diego Soto", checkIn: "09:25:00", checkOut: "17:10:00" }, // Atraso
    { date: "2026-02-03", userId: 1, user: "Juan Pérez", checkIn: "08:58:00", checkOut: "17:00:00" },
    { date: "2026-02-03", userId: 3, user: "Diego Soto", checkIn: "09:00:00", checkOut: "16:30:00" }, // Salida anticipada
];

// Configuración Global
const WORK_START_TIME = "09:00:00";
const TOLERANCE_MINUTES = 15;

document.addEventListener('DOMContentLoaded', () => {
    initHeader();
    populateSelectors();
    
    // Si no es admin, ocultar el filtro de empleados
    if (currentUser.role !== 'admin') {
        const adminFilter = document.getElementById('admin-filter-container');
        if (adminFilter) adminFilter.style.display = 'none';
    } else {
        populateEmployeeFilter();
    }

    // Event Listeners
    document.getElementById('filter-month').addEventListener('change', renderView);
    document.getElementById('filter-year').addEventListener('change', renderView);
    document.getElementById('filter-employee').addEventListener('change', renderView);

    // Render inicial
    renderView();
});

function initHeader() {
    document.getElementById('user-name-display').textContent = currentUser.name;
    document.getElementById('user-role-display').textContent = currentUser.role === 'admin' ? 'Administrador' : 'Colaborador';
}

function populateSelectors() {
    const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    const mSelect = document.getElementById('filter-month');
    const ySelect = document.getElementById('filter-year');
    const today = new Date();

    months.forEach((m, i) => mSelect.add(new Option(m, i + 1))); // 1-based index for logic ease
    for (let y = 2024; y <= 2026; y++) ySelect.add(new Option(y, y));

    mSelect.value = today.getMonth() + 1;
    ySelect.value = today.getFullYear();
}

function populateEmployeeFilter() {
    const select = document.getElementById('filter-employee');
    const users = [...new Set(attendanceDB.map(r => r.user))];
    users.forEach(u => select.add(new Option(u, u)));
}

function renderView() {
    const selectedMonth = parseInt(document.getElementById('filter-month').value);
    const selectedYear = parseInt(document.getElementById('filter-year').value);
    const selectedUser = document.getElementById('filter-employee').value;

    // Filtrar Datos
    const filtered = attendanceDB.filter(record => {
        const [year, month] = record.date.split('-').map(Number);
        const matchDate = year === selectedYear && month === selectedMonth;
        
        let matchUser = true;
        if (currentUser.role === 'admin') {
            if (selectedUser === 'me') matchUser = record.user === currentUser.name; // Asumiendo nombre coincide
            else if (selectedUser !== 'all') matchUser = record.user === selectedUser;
        } else {
            // Si es trabajador, solo ve sus datos
            matchUser = record.user === currentUser.name; // Simulación
        }

        return matchDate && matchUser;
    });

    renderTable(filtered);
    updateKPIs(filtered);
}

function renderTable(data) {
    const tbody = document.getElementById('attendance-table-body');
    tbody.innerHTML = '';

    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-slate-400">No hay registros para este periodo.</td></tr>`;
        return;
    }

    data.forEach(record => {
        const status = calculateStatus(record.checkIn);
        const hours = calculateWorkedHours(record.checkIn, record.checkOut);
        
        const tr = document.createElement('tr');
        tr.className = "hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0";
        tr.innerHTML = `
            <td class="px-6 py-4 font-mono text-slate-500">${record.date}</td>
            <td class="px-6 py-4 font-bold text-slate-700">${record.user}</td>
            <td class="px-6 py-4 text-center">
                <span class="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs font-mono font-bold">${record.checkIn.slice(0,5)}</span>
            </td>
            <td class="px-6 py-4 text-center">
                <span class="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs font-mono font-bold">${record.checkOut.slice(0,5)}</span>
            </td>
            <td class="px-6 py-4 text-center text-xs font-bold text-slate-500">${hours} hrs</td>
            <td class="px-6 py-4 text-right">
                ${getStatusBadge(status)}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Lógica de Negocio Simple
function calculateStatus(checkInTime) {
    // Convertir a minutos para comparar
    const [h, m] = checkInTime.split(':').map(Number);
    const checkInMinutes = h * 60 + m;
    
    const [startH, startM] = WORK_START_TIME.split(':').map(Number);
    const startMinutes = startH * 60 + startM;

    if (checkInMinutes > (startMinutes + TOLERANCE_MINUTES)) return 'late';
    return 'ontime';
}

function getStatusBadge(status) {
    if (status === 'late') {
        return `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-red-50 text-red-600 border border-red-100">
            <span class="w-1.5 h-1.5 rounded-full bg-red-500"></span> Atraso
        </span>`;
    }
    return `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-600 border border-emerald-100">
        <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Puntual
    </span>`;
}

function calculateWorkedHours(start, end) {
    const d1 = new Date(`2000-01-01T${start}`);
    const d2 = new Date(`2000-01-01T${end}`);
    const diff = (d2 - d1) / 1000 / 60 / 60; // Horas
    return diff.toFixed(1);
}

function updateKPIs(data) {
    const totalDays = data.length;
    if (totalDays === 0) {
        document.getElementById('kpi-attendance').textContent = '0%';
        document.getElementById('kpi-late').textContent = '0';
        document.getElementById('kpi-hours').textContent = '0h';
        return;
    }

    const lates = data.filter(d => calculateStatus(d.checkIn) === 'late').length;
    const totalHours = data.reduce((acc, curr) => acc + parseFloat(calculateWorkedHours(curr.checkIn, curr.checkOut)), 0);

    // Asistencia efectiva (Simple: días sin atraso / días totales)
    const effectiveness = ((totalDays - lates) / totalDays) * 100;

    document.getElementById('kpi-attendance').textContent = `${Math.round(effectiveness)}%`;
    document.getElementById('kpi-late').textContent = lates;
    document.getElementById('kpi-hours').textContent = `${Math.floor(totalHours)}h`;
}