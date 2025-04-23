document.addEventListener('DOMContentLoaded', () => {
    const anticiposActualesDiv = document.getElementById('anticipos-actuales');
    const anticiposHistoricosDiv = document.getElementById('anticipos-historicos');
    const filtroAño = document.getElementById('filtro-año');
    const filtroMes = document.getElementById('filtro-mes');

    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                   'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    const hoy = new Date();
    const añoActual = hoy.getFullYear();
    const mesActual = hoy.getMonth();

    const anticipos = [
        { id: 1, nombre: "Pedro Pérez", monto: 120000, sueldo: 500000, año: 2025, mes: 3, estado: "pendiente" },
        { id: 2, nombre: "Ana Gómez", monto: 90000, sueldo: 450000, año: 2025, mes: 4, estado: "aprobado" },
        { id: 3, nombre: "Luis Soto", monto: 50000, sueldo: 480000, año: 2025, mes: 4, estado: "pendiente" }
    ];    

    function poblarFiltros() {
        for (let a = añoActual - 1; a <= añoActual + 1; a++) {
            const option = new Option(a, a);
            filtroAño.add(option);
        }
        filtroAño.value = añoActual;

        meses.forEach((mes, i) => {
            const option = new Option(mes, i);
            filtroMes.add(option);
        });
        filtroMes.value = mesActual;
    }

    function renderAnticiposActuales() {
        anticiposActualesDiv.innerHTML = '';
        const filtrados = anticipos.filter(a => a.año === añoActual && a.mes === mesActual);

        if (filtrados.length === 0) {
            anticiposActualesDiv.innerHTML = `<p class="text-white">No hay solicitudes este mes.</p>`;
            return;
        }

        filtrados.forEach(a => {
            const contenedor = document.createElement('div');
            contenedor.className = 'p-4 rounded-lg bg-white text-gray-800 border border-gray-300';

            contenedor.innerHTML = `
                <div class="flex justify-between items-center">
                    <div>
                        <h2 class="font-medium text-lg">${a.nombre}</h2>
                        <p class="text-sm">Sueldo: $${a.sueldo.toLocaleString('es-CL')}</p>
                        <label class="block text-sm mt-1">Monto solicitado:
                            <input type="number" class="monto-input mt-0.5 px-2 py-1 border rounded w-full text-sm"
                                data-id="${a.id}" value="${a.monto}">
                        </label>
                        <p class="text-sm mt-1">Restante: $${(a.sueldo - getTotalAprobado(a.nombre, a.año, a.mes)).toLocaleString('es-CL')}</p>
                        <p class="text-sm">Estado: 
                            <span class="${a.estado === 'aprobado' ? 'text-green-600' : a.estado === 'rechazado' ? 'text-red-600' : 'text-yellow-600'}">${a.estado}</span>
                        </p>
                    </div>
                    ${a.estado === 'pendiente' ? `
                        <div class="space-x-2">
                            <button class="aprobar bg-green-600 text-white px-3 py-1 rounded" data-id="${a.id}">Aprobar</button>
                            <button class="rechazar bg-red-600 text-white px-3 py-1 rounded" data-id="${a.id}">Rechazar</button>
                        </div>` : ''
                    }
                </div>
            `;

            anticiposActualesDiv.appendChild(contenedor);
        });

        document.querySelectorAll('.aprobar').forEach(btn => {
            btn.addEventListener('click', e => cambiarEstado(parseInt(e.target.dataset.id), 'aprobado'));
        });

        document.querySelectorAll('.rechazar').forEach(btn => {
            btn.addEventListener('click', e => cambiarEstado(parseInt(e.target.dataset.id), 'rechazado'));
        });
    }

    function getTotalAprobado(nombre, año, mes) {
        return anticipos
            .filter(a => a.nombre === nombre && a.año === año && a.mes === mes && a.estado === 'aprobado')
            .reduce((acc, cur) => acc + cur.monto, 0);
    }    

    function renderAnticiposHistoricos() {
        anticiposHistoricosDiv.innerHTML = '';
        const año = parseInt(filtroAño.value);
        const mes = parseInt(filtroMes.value);

        const filtrados = anticipos.filter(a => a.año === año && a.mes === mes);

        if (filtrados.length === 0) {
            anticiposHistoricosDiv.innerHTML = `<p class="text-white">No hay registros históricos para este mes.</p>`;
            return;
        }

        filtrados.forEach(a => {
            const contenedor = document.createElement('div');
            contenedor.className = 'p-4 rounded-lg bg-white text-gray-800 border border-gray-300';

            contenedor.innerHTML = `
                <div class="flex justify-between items-center">
                    <div>
                        <h2 class="font-medium text-lg">${a.nombre}</h2>
                        <p class="text-sm">Monto: $${a.monto.toLocaleString('es-CL')}</p>
                        <p class="text-sm">Estado: 
                            <span class="${a.estado === 'aprobado' ? 'text-green-600' : a.estado === 'rechazado' ? 'text-red-600' : 'text-yellow-600'}">${a.estado}</span>
                        </p>
                    </div>
                </div>
            `;
            anticiposHistoricosDiv.appendChild(contenedor);
        });
    }

    document.querySelectorAll('.monto-input').forEach(input => {
        input.addEventListener('change', e => {
            const id = parseInt(e.target.dataset.id);
            const nuevoMonto = parseInt(e.target.value);
            const anticipo = anticipos.find(a => a.id === id);
            if (anticipo && anticipo.estado === 'pendiente' && !isNaN(nuevoMonto)) {
                anticipo.monto = nuevoMonto;
                renderAnticiposActuales(); // volver a renderizar para actualizar restante
            }
        });
    });    

    function cambiarEstado(id, nuevoEstado) {
        const anticipo = anticipos.find(a => a.id === id);
        if (anticipo && anticipo.estado === 'pendiente') {
            anticipo.estado = nuevoEstado;
            renderAnticiposActuales();
            renderAnticiposHistoricos(); // En caso de que se esté viendo el mes actual en la parte histórica
        }
    }

    filtroAño.addEventListener('change', renderAnticiposHistoricos);
    filtroMes.addEventListener('change', renderAnticiposHistoricos);

    poblarFiltros();
    renderAnticiposActuales();
    renderAnticiposHistoricos();
});
