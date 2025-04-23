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
            renderCalendario();
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

    function renderCalendario() {
        calendarioVacacionesDiv.innerHTML = '';

        const aprobadas = solicitudes.filter(s => s.estado === 'aprobado');

        if (aprobadas.length === 0) {
            calendarioVacacionesDiv.innerHTML = `<p class="text-sm">No hay vacaciones aprobadas para mostrar en el calendario.</p>`;
            return;
        }

        const fechas = [];

        aprobadas.forEach(s => {
            let fecha = new Date(s.desde);
            const hasta = new Date(s.hasta);

            while (fecha <= hasta) {
                fechas.push({
                    dia: fecha.toISOString().split('T')[0],
                    nombre: s.nombre
                });
                fecha.setDate(fecha.getDate() + 1);
            }
        });

        fechas.sort((a, b) => new Date(a.dia) - new Date(b.dia));

        const calendarioHTML = fechas.map(f => `
            <p class="text-sm">${f.dia} — ${f.nombre}</p>
        `).join('');

        calendarioVacacionesDiv.innerHTML = calendarioHTML;
    }

    renderSolicitudesPendientes();
    renderHistorico();
    renderCalendario();
});
