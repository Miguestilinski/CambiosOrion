import { initAdminHeader } from './header.js';

// --- CONFIGURACIÓN Y ESTADO ---
const WORK_START_TIME = "09:00:00";
const TOLERANCE_MINUTES = 15;

// Roles con permisos de "Ver Todo" (Sincronizado con header.js)
const SUPER_USERS = ['socio', 'admin', 'gerente', 'administrador', 'jefe de operaciones'];

// Datos Mock (Simulación de DB)
const attendanceDB = [
    { date: "2026-02-02", userId: 1, user: "Juan Pérez", checkIn: "08:55:00", checkOut: "17:05:00" },
    { date: "2026-02-02", userId: 2, user: "Maria Jara", checkIn: "09:10:00", checkOut: "17:00:00" },
    { date: "2026-02-02", userId: 3, user: "Diego Soto", checkIn: "09:25:00", checkOut: "17:10:00" },
    { date: "2026-02-03", userId: 1, user: "Juan Pérez", checkIn: "08:58:00", checkOut: "17:00:00" },
    { date: "2026-02-03", userId: 3, user: "Diego Soto", checkIn: "09:00:00", checkOut: "16:30:00" },
];

let sessionUser = null; // Almacenará la data real del usuario

document.addEventListener('DOMContentLoaded', async () => {
    // 1. INICIALIZAR HEADER Y OBTENER SESIÓN
    const sessionData = await initAdminHeader('horario');
    
    // Si no está autenticado, initAdminHeader suele redirigir, pero por seguridad:
    if (!sessionData.isAuthenticated) return;

    sessionUser = sessionData;

    // 2. INICIALIZACIÓN DE VISTAS
    initUI();
    
    // 3. LISTENERS
    document.getElementById('filter-month').addEventListener('change', renderView);
    document.getElementById('filter-year').addEventListener('change', renderView);
    document.getElementById('filter-employee').addEventListener('change', renderView);

    // 4. RENDER INICIAL
    renderView();
});

function initUI() {
    // Llenar selectores de tiempo
    const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    const mSelect = document.getElementById('filter-month');
    const ySelect = document.getElementById('filter-year');
    const today = new Date();

    months.forEach((m, i) => mSelect.add(new Option(m, i + 1)));
    for (let y = 2024; y <= 2026; y++) ySelect.add(new Option(y, y));

    mSelect.value = today.getMonth() + 1;
    ySelect.value = today.getFullYear();

    // Lógica de Permisos (Admin vs Trabajador)
    const userRole = (sessionUser.rol || '').toLowerCase().trim();
    const isSuperUser = SUPER_USERS.includes(userRole);
    const adminFilter = document.getElementById('admin-filter-container');

    if (isSuperUser) {
        // Es Admin/Socio: Puede ver filtro de empleados
        if (adminFilter) adminFilter.style.display = 'block';
        populateEmployeeFilter();
    } else {
        // Es Trabajador: Ocultar filtro, forzaremos la vista a "su" usuario internamente
        if (adminFilter) adminFilter.style.display = 'none';
    }

    // Actualizar nombre en el header interno (si existe elemento extra)
    const displayRole = document.getElementById('user-role-display');
    if(displayRole) displayRole.textContent = isSuperUser ? 'Administración' : 'Colaborador';
}

function populateEmployeeFilter() {
    const select = document.getElementById('filter-employee');
    // En un sistema real, esto vendría de una API de usuarios
    const users = [...new Set(attendanceDB.map(r => r.user))];
    users.forEach(u => select.add(new Option(u, u)));
}

function renderView() {
    const selectedMonth = parseInt(document.getElementById('filter-month').value);
    const selectedYear = parseInt(document.getElementById('filter-year').value);
    
    // Lógica de filtrado por usuario según ROL
    const userRole = (sessionUser.rol || '').toLowerCase().trim();
    const isSuperUser = SUPER_USERS.includes(userRole);
    
    // Si es super usuario, tomamos el valor del select. Si no, forzamos el nombre de la sesión.
    // NOTA: Para que esto funcione con el Mock, el nombre en sessionUser.nombre debe coincidir con el Mock DB.
    let targetUser = isSuperUser ? document.getElementById('filter-employee').value : sessionUser.nombre;

    // Filtrar Datos
    const filtered = attendanceDB.filter(record => {
        const [year, month] = record.date.split('-').map(Number);
        const matchDate = year === selectedYear && month === selectedMonth;
        
        let matchUser = true;
        
        if (isSuperUser) {
            if (targetUser === 'me') {
                matchUser = record.user === sessionUser.nombre;
            } else if (targetUser !== 'all') {
                matchUser = record.user === targetUser;
            }
        } else {
            // Trabajador normal solo ve sus propios registros
            matchUser = record.user === sessionUser.nombre; 
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
        const formattedDate = formatDateDDMMYYYY(record.date); // Usamos la nueva función
        
        const tr = document.createElement('tr');
        tr.className = "hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0";
        tr.innerHTML = `
            <td class="px-6 py-4 font-mono text-slate-500 font-medium">${formattedDate}</td>
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

// --- UTILIDADES ---

// Convierte '2026-02-02' a '02/02/2026'
function formatDateDDMMYYYY(isoDateString) {
    if (!isoDateString) return '--';
    const [year, month, day] = isoDateString.split('-');
    return `${day}/${month}/${year}`;
}

function calculateStatus(checkInTime) {
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
    const diff = (d2 - d1) / 1000 / 60 / 60; 
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
    
    // Cálculo de asistencia efectiva simple
    const effectiveness = ((totalDays - lates) / totalDays) * 100;

    document.getElementById('kpi-attendance').textContent = `${Math.round(effectiveness)}%`;
    document.getElementById('kpi-late').textContent = lates;
    document.getElementById('kpi-hours').textContent = `${Math.floor(totalHours)}h`;
}