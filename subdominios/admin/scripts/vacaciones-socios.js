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
                    <p class="text-sm">Desde: ${formatearFecha(s.desde)} &nbsp;&nbsp; Hasta: ${formatearFecha(s.hasta)}</p>
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
                    <p class="text-sm">Desde: ${formatearFecha(s.desde)} - Hasta: ${formatearFecha(s.hasta)}</p>
                    <p class="text-sm">Estado: <span class="${s.estado === 'aprobado' ? 'text-green-600' : 'text-red-600'}">${s.estado}</span></p>
                </div>
            `;
            vacacionesHistoricasDiv.appendChild(contenedor);
        });
    }

    function formatearFecha(fecha) {
        const f = new Date(fecha);
        const dia = String(f.getDate()).padStart(2, '0');
        const mes = String(f.getMonth() + 1).padStart(2, '0');
        const anio = f.getFullYear();
        return `${dia}/${mes}/${anio}`;
    }

    let currentMonth = new Date();

    function renderCalendarioMensual() {
        const grid = document.getElementById('calendar-grid');
        const title = document.getElementById('calendar-title');
        
        // Limpiar la cuadrícula antes de renderizar de nuevo
        while (grid.firstChild) {
            grid.removeChild(grid.firstChild);
        }
        
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        
        const primerDia = new Date(year, month, 1);
        const ultimoDia = new Date(year, month + 1, 0);
        
        // Obtener el día de la semana del primer día del mes
        let offset = primerDia.getDay(); // 0 = domingo, 1 = lunes, ...
        
        // Ajustar el desplazamiento para que la semana empiece el lunes
        offset = offset === 0 ? 6 : offset - 1; // Si es domingo (0), lo convertimos a 6 (último día de la semana)
        
        // Mostrar el título del mes
        title.textContent = currentMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
        
        // Encabezado de días (siempre empieza con Lunes)
        const diasDeLaSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
        diasDeLaSemana.forEach(dia => {
            const cell = document.createElement('div');
            cell.className = 'bg-gray-200 p-2 font-bold';
            cell.textContent = dia;
            grid.appendChild(cell);
        });
        
        // Añadir celdas vacías antes del primer día del mes
        for (let i = 0; i < offset; i++) {
            grid.appendChild(document.createElement('div'));
        }
    
        // Celdas de días del mes (guardar referencia a cada celda por fecha)
        const celdasPorFecha = {};
        
        for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
            const fechaActual = new Date(year, month, dia);
            const key = fechaActual.toISOString().split('T')[0];
        
            const cell = document.createElement('div');
            cell.className = 'p-2 h-20 border bg-white text-gray-800 relative';
        
            const diaText = document.createElement('div');
            diaText.className = 'font-semibold';
            diaText.textContent = fechaActual.getDate();
        
            cell.appendChild(diaText);
            grid.appendChild(cell);
        
            celdasPorFecha[key] = cell; // guardar referencia a esta celda
        }

        // Pintar vacaciones encima del calendario
        solicitudes.forEach(s => {
            if (s.estado !== 'aprobado') return;

            const start = new Date(s.desde);
            const end = new Date(s.hasta);

            const rect = document.createElement('div');
            rect.className = 'evento-vacacion';

            let startCell, endCell;

            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                const key = d.toISOString().split('T')[0];
                if (!startCell && celdasPorFecha[key]) startCell = celdasPorFecha[key];
                endCell = celdasPorFecha[key] || endCell;
            }

            if (startCell && endCell) {
                const startRect = startCell.getBoundingClientRect();
                const endRect = endCell.getBoundingClientRect();
                const gridRect = grid.getBoundingClientRect();

                rect.style.left = (startRect.left - gridRect.left) + 'px';
                rect.style.top = (startRect.top - gridRect.top + startCell.offsetHeight - 20) + 'px'; // debajo del número del día
                rect.style.width = (endRect.right - startRect.left) + 'px';
            }

            document.getElementById('calendar-wrapper').appendChild(rect);
        });

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
