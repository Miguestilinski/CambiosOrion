document.addEventListener('DOMContentLoaded', () => {
    const anticiposList = document.getElementById('anticipos-list');
    const filtroaño = document.getElementById('filtro-año');
    const filtroMes = document.getElementById('filtro-mes');

    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                   'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    
    const hoy = new Date();
    const añoActual = hoy.getFullYear();
    const mesActual = hoy.getMonth();

    // Simular data de anticipos
    const anticipos = [
        { id: 1, nombre: "Pedro Pérez", monto: 120000, año: 2025, mes: 3, estado: "pendiente" },
        { id: 2, nombre: "Ana Gómez", monto: 90000, año: 2025, mes: 4, estado: "aprobado" },
        { id: 3, nombre: "Luis Soto", monto: 50000, año: 2025, mes: 4, estado: "pendiente" }
    ];

    function poblarFiltros() {
        for (let a = añoActual - 1; a <= añoActual + 1; a++) {
            const option = new Option(a, a);
            filtroaño.add(option);
        }
        filtroaño.value = añoActual;

        meses.forEach((mes, i) => {
            const option = new Option(mes, i);
            filtroMes.add(option);
        });
        filtroMes.value = mesActual;
    }

    function renderAnticipos() {
        anticiposList.innerHTML = '';
        const año = parseInt(filtroaño.value);
        const mes = parseInt(filtroMes.value);

        const filtrados = anticipos.filter(a => a.año === año && a.mes === mes);

        if (filtrados.length === 0) {
            anticiposList.innerHTML = `<p class="text-white">No hay solicitudes para este mes.</p>`;
            return;
        }

        filtrados.forEach(a => {
            const contenedor = document.createElement('div');
            contenedor.className = 'p-4 rounded-lg bg-white text-gray-800 border border-gray-300';

            const puedeModificar = (a.año === añoActual && a.mes === mesActual);

            contenedor.innerHTML = `
                <div class="flex justify-between items-center">
                    <div>
                        <h2 class="font-medium text-lg">${a.nombre}</h2>
                        <p class="text-sm">Monto: $${a.monto.toLocaleString()}</p>
                        <p class="text-sm">Estado: 
                            <span class="${a.estado === 'aprobado' ? 'text-green-600' : a.estado === 'rechazado' ? 'text-red-600' : 'text-yellow-600'}">${a.estado}</span>
                        </p>
                    </div>
                    ${puedeModificar && a.estado === 'pendiente' ? `
                        <div class="space-x-2">
                            <button class="aprobar bg-green-600 text-white px-3 py-1 rounded" data-id="${a.id}">Aprobar</button>
                            <button class="rechazar bg-red-600 text-white px-3 py-1 rounded" data-id="${a.id}">Rechazar</button>
                        </div>` : ''
                    }
                </div>
            `;

            anticiposList.appendChild(contenedor);
        });

        document.querySelectorAll('.aprobar').forEach(btn => {
            btn.addEventListener('click', e => cambiarEstado(parseInt(e.target.dataset.id), 'aprobado'));
        });

        document.querySelectorAll('.rechazar').forEach(btn => {
            btn.addEventListener('click', e => cambiarEstado(parseInt(e.target.dataset.id), 'rechazado'));
        });
    }

    function cambiarEstado(id, nuevoEstado) {
        const anticipo = anticipos.find(a => a.id === id);
        if (anticipo && anticipo.estado === 'pendiente') {
            anticipo.estado = nuevoEstado;
            renderAnticipos();
        }
    }

    filtroaño.addEventListener('change', renderAnticipos);
    filtroMes.addEventListener('change', renderAnticipos);

    poblarFiltros();
    renderAnticipos();
});
