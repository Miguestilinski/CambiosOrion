document.addEventListener('DOMContentLoaded', () => {
    const solicitudesPendientesDiv = document.getElementById('solicitudes-pendientes');
    const calendarioVacacionesDiv = document.getElementById('calendario-vacaciones');
    const vacacionesHistoricasDiv = document.getElementById('vacaciones-historicas');

    const solicitudes = [
        { id: 1, nombre: 'María López', desde: '2025-05-15', hasta: '2025-05-20', estado: 'pendiente' },
        { id: 2, nombre: 'Carlos Díaz', desde: '2025-05-18', hasta: '2025-05-22', estado: 'aprobado' },
        { id: 3, nombre: 'Elena Ruiz', desde: '2025-05-10', hasta: '2025-05-12', estado: 'aprobado' }
    ];

    function renderSolicitudesPendientes() {
        solicitudesPendientesDiv.innerHTML = '';

        const pendientes = solicitudes.filter(s => s.estado === 'pendiente');

        if (pendientes.length === 0) {
            solicitudesPendientesDiv.innerHTML = `<p class="text-white">No hay solicitudes pendientes.</p>`;
            return;
        }

        pendientes.forEach(s => {
            const contenedor = document.createElement('div');
            contenedor.className = 'p-4 rounded-lg bg-white text-gray-800 border border-gray-300';

            contenedor.innerHTML = `
                <div>
                    <h2 class="font-medium text-lg">${s.nombre}</h2>
                    <p class="text-sm">Desde: ${s.desde} &nbsp;&nbsp; Hasta: ${s.hasta}</p>
                    <p class="text-sm mb-2">Días solicitados: ${getDias(s.desde, s.hasta)}</p>
                    <div class="space-x-2">
                        <button class="btn-aprobar bg-green-600 text-white px-3 py-1 rounded" data-id="${s.id}">Aprobar</button>
                        <button class="btn-rechazar bg-red-600 text-white px-3 py-1 rounded" data-id="${s.id}">Rechazar</button>
                    </div>
                </div>
            `;
            solicitudesPendientesDiv.appendChild(contenedor);
        });

        document.querySelectorAll('.btn-aprobar').forEach(btn => {
            btn.addEventListener('click', e => cambiarEstado(parseInt(e.target.dataset.id), 'aprobado'));
        });

        document.querySelectorAll('.btn-rechazar').forEach(btn => {
            btn.addEventListener('click', e => cambiarEstado(parseInt(e.target.dataset.id), 'rechazado'));
        });
    }

    function getDias(desde, hasta) {
        const f1 = new Date(desde);
        const f2 = new Date(hasta);
        const diff = Math.floor((f2 - f1) / (1000 * 60 * 60 * 24)) + 1;
        return diff;
    }

    function cambiarEstado(id, nuevoEstado) {
        const solicitud = solicitudes.find(s => s.id === id);
        if (solicitud && solicitud.estado === 'pendiente') {
            solicitud.estado = nuevoEstado;
            renderSolicitudesPendientes();
            renderHistorico();
            renderCalendarioMensual();
        }
    }

    function renderHistorico() {
        vacacionesHistoricasDiv.innerHTML = '';

        const historicas = solicitudes.filter(s => s.estado !== 'pendiente');

        if (historicas.length === 0) {
            vacacionesHistoricasDiv.innerHTML = `<p class="text-white">No hay registros históricos.</p>`;
            return;
        }

        historicas.forEach(s => {
            const contenedor = document.createElement('div');
            contenedor.className = 'p-4 rounded-lg bg-white text-gray-800 border border-gray-300';

            contenedor.innerHTML = `
                <div>
                    <h2 class="font-medium text-lg">${s.nombre}</h2>
                    <p class="text-sm">Desde: ${s.desde} - Hasta: ${s.hasta}</p>
                    <p class="text-sm">Estado: <span class="${s.estado === 'aprobado' ? 'text-green-600' : 'text-red-600'}">${s.estado}</span></p>
                </div>
            `;
            vacacionesHistoricasDiv.appendChild(contenedor);
        });
    }

    let currentMonth = new Date();

    function renderCalendarioMensual() {
        const grid = document.getElementById('calendar-grid');
        const title = document.getElementById('calendar-title');

        while (grid.firstChild) {
            grid.removeChild(grid.firstChild);
        }    

        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();

        const primerDia = new Date(year, month, 1);
        const ultimoDia = new Date(year, month + 1, 0);
        let offset = primerDia.getDay(); // 0 = domingo, 1 = lunes, ...
        offset = offset === 0 ? 6 : offset - 1; // convierte domingo (0) a 6 y ajusta el resto
        for (let i = 0; i < offset; i++) {
            grid.appendChild(document.createElement('div'));
        }


        title.textContent = currentMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

        // Encabezado de días
        ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].forEach(dia => {
            const cell = document.createElement('div');
            cell.className = 'bg-gray-200 p-2 font-bold';
            cell.textContent = dia;
            grid.appendChild(cell);
        });

        // Celdas vacías antes del 1 del mes
        for (let i = 0; i < offset; i++) {
            grid.appendChild(document.createElement('div'));
        }        

        const aprobadas = solicitudes.filter(s => s.estado === 'aprobado');
        const fechasConVacaciones = {};     

        aprobadas.forEach(s => {
            let fecha = new Date(s.desde);
            const hasta = new Date(s.hasta);

            while (fecha <= hasta) {
                const diaSemana = fecha.getDay();
                // Solo de lunes (1) a viernes (5)
                if (diaSemana >= 1 && diaSemana <= 5) {
                    const key = fecha.toISOString().split('T')[0];
                    if (!fechasConVacaciones[key]) fechasConVacaciones[key] = [];
                    fechasConVacaciones[key].push(s.nombre);
                }
                fecha.setDate(fecha.getDate() + 1);
            }   
        });

        // Celdas de días del mes
        for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
            const fechaActual = new Date(year, month, dia);
            const key = fechaActual.toISOString().split('T')[0];

            const cell = document.createElement('div');
            cell.className = 'p-2 h-20 border bg-white text-gray-800 relative';

            const diaText = document.createElement('div');
            diaText.className = 'font-semibold';
            diaText.textContent = dia;

            cell.appendChild(diaText);

            if (fechasConVacaciones[key]) {
                cell.classList.add('bg-red-200'); // fondo del día con vacaciones
                fechasConVacaciones[key].forEach(nombre => {
                    const etiqueta = document.createElement('div');
                    etiqueta.className = 'text-xs mt-1 text-red-800 font-medium';
                    etiqueta.textContent = nombre;
                    cell.appendChild(etiqueta);
                });
            }            

            grid.appendChild(cell);
        }
    }

    // Botones de navegación
    document.getElementById('prev-month').addEventListener('click', () => {
        currentMonth.setMonth(currentMonth.getMonth() - 1);
        renderCalendarioMensual();
    });
    document.getElementById('next-month').addEventListener('click', () => {
        currentMonth.setMonth(currentMonth.getMonth() + 1);
        renderCalendarioMensual();
    });

    renderSolicitudesPendientes();
    renderHistorico();
    renderCalendarioMensual();

});
