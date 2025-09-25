document.addEventListener('DOMContentLoaded', () => {
    const mostrarRegistros = document.getElementById('mostrar-registros');
    const buscarInput = document.getElementById('buscar');

    // Inputs de filtro según tu HTML de egresos
    const numeroInput = document.getElementById('numero');
    const fechaInput = document.getElementById('fecha');
    const tipoEgresoInput = document.getElementById('tipo-egreso');
    const clienteInput = document.getElementById('cliente');
    const cajaInput = document.getElementById('caja');
    const cuentaInput = document.getElementById('cuenta');
    const divisaInput = document.getElementById('divisa');
    const estadoInput = document.getElementById('estado');

    const tablaEgresos = document.querySelector('#egresos table tbody');
    const nuevoEgresoBtn = document.getElementById('nuevo-egreso');

    if (nuevoEgresoBtn) {
        nuevoEgresoBtn.addEventListener('click', () => {
            window.location.href = '.https://tesoreria.cambiosorion.cl/nuevo-egr';
        });
    }

    function obtenerEgresos() {
        const params = new URLSearchParams();
        params.set('numero', numeroInput.value);
        params.set('fecha', fechaInput.value);
        params.set('tipo_egreso', tipoEgresoInput.value);
        params.set('cliente', clienteInput.value);
        params.set('caja', cajaInput.value);
        params.set('cuenta', cuentaInput.value);
        params.set('divisa', divisaInput.value);
        params.set('estado', estadoInput.value);
        params.set('buscar', buscarInput.value);
        params.set('mostrar', mostrarRegistros.value);

        fetch(`https://cambiosorion.cl/data/egresos.php?${params.toString()}`)
            .then(response => response.json())
            .then(data => {
                mostrarResultados(data);
            })
            .catch(error => console.error('Error:', error));
    }

    // Formateo fecha (AAAA-MM-DD a DD-MM-AAAA con hora)
    function formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
    }

    // Formateo monto en pesos chilenos con separadores de miles
    function formatMonto(monto) {
        return '$' + Number(monto).toLocaleString('es-CL');
    }

    function mostrarResultados(lista) {
        tablaEgresos.innerHTML = '';
        lista.forEach(item => {
            const tr = document.createElement('tr');
            tr.classList.add('border-b', 'bg-white', 'border-gray-700', 'text-gray-700');
            tr.innerHTML = `
                <td class="px-4 py-2">${item.id}</td>
                <td class="px-4 py-2">${formatDate(item.fecha)}</td>
                <td class="px-4 py-2">${item.tipo_egreso}</td>
                <td class="px-4 py-2">${item.cliente}</td>
                <td class="px-4 py-2">${item.caja}</td>
                <td class="px-4 py-2">${item.cuenta ?? ''}</td>
                <td class="px-4 py-2">${item.divisa}</td>
                <td class="px-4 py-2">${formatMonto(item.monto)}</td>
                <td class="px-4 py-2">${item.estado}</td>
                <td class="px-4 py-2">
                    <button class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-3 py-1">
                        Mostrar
                    </button>
                </td>
            `;
            tablaEgresos.appendChild(tr);
        });
    }

    // Listeners para recargar datos al cambiar filtros o buscar
    [
        mostrarRegistros,
        buscarInput,
        numeroInput,
        fechaInput,
        tipoEgresoInput,
        clienteInput,
        cajaInput,
        cuentaInput,
        divisaInput,
        estadoInput
    ].forEach(element => {
        element.addEventListener('input', obtenerEgresos);
    });

    // Carga inicial
    obtenerEgresos();
});