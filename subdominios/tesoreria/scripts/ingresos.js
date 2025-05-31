document.addEventListener('DOMContentLoaded', () => {
    const mostrarRegistros = document.getElementById('mostrar-registros');
    const buscarInput = document.getElementById('buscar');

    // Inputs de filtro según tu HTML
    const numeroInput = document.getElementById('numero');
    const fechaInput = document.getElementById('fecha');
    const tipoIngresoInput = document.getElementById('tipo-ingreso');
    const clienteInput = document.getElementById('cliente');
    const cajaInput = document.getElementById('caja');
    const cuentaInput = document.getElementById('cuenta');
    const divisaInput = document.getElementById('divisa');
    const estadoInput = document.getElementById('estado');

    const tablaIngresos = document.querySelector('#ingresos table tbody');
    const nuevoIngresoBtn = document.getElementById('nuevo-ingreso');

    if (nuevoIngresoBtn) {
        nuevoIngresoBtn.addEventListener('click', () => {
            window.location.href = 'https://tesoreria.cambiosorion.cl/nuevo-ingreso';
        });
    }

    function obtenerIngresos() {
        const params = new URLSearchParams();
        params.set('numero', numeroInput.value);
        params.set('fecha', fechaInput.value);
        params.set('tipo_ingreso', tipoIngresoInput.value);
        params.set('cliente', clienteInput.value);
        params.set('caja', cajaInput.value);
        params.set('cuenta', cuentaInput.value);
        params.set('divisa', divisaInput.value);
        params.set('estado', estadoInput.value);
        params.set('buscar', buscarInput.value);
        params.set('mostrar', mostrarRegistros.value);

        fetch(`https://cambiosorion.cl/data/ingresos.php?${params.toString()}`)
            .then(response => response.json())
            .then(data => {
                mostrarResultados(data);
            })
            .catch(error => console.error('Error:', error));
    }

    // Función para formatear fechas (AAAA-MM-DD a DD-MM-AAAA)
    function formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    }

    // Función para formatear montos en formato local
    function formatMonto(monto) {
        return '$' + Number(monto).toLocaleString('es-CL');
    }

    function mostrarResultados(lista) {
        tablaIngresos.innerHTML = '';
        lista.forEach(item => {
            const tr = document.createElement('tr');
            tr.classList.add('border-b', 'bg-white', 'border-gray-700', 'text-gray-700');
            tr.innerHTML = `
                <td class="px-4 py-2">${item.numero}</td>
                <td class="px-4 py-2">${formatDate(item.fecha_creacion)}</td>
                <td class="px-4 py-2">${item.tipo_ingreso}</td>
                <td class="px-4 py-2">${item.cliente}</td>
                <td class="px-4 py-2">${item.caja}</td>
                <td class="px-4 py-2">${item.cuenta}</td>
                <td class="px-4 py-2">${item.divisa}</td>
                <td class="px-4 py-2">${formatMonto(item.monto)}</td>
                <td class="px-4 py-2">${item.estado}</td>
                <td class="px-4 py-2">
                    <button class="text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-sm px-3 py-1">
                        Mostrar
                    </button>
                </td>
            `;
            tablaIngresos.appendChild(tr);
        });
    }

    // Añadir listeners para actualizar datos al cambiar filtros o búsqueda
    [
        mostrarRegistros,
        buscarInput,
        numeroInput,
        fechaInput,
        tipoIngresoInput,
        clienteInput,
        cajaInput,
        cuentaInput,
        divisaInput,
        estadoInput
    ].forEach(element => {
        element.addEventListener('input', obtenerIngresos);
    });

    // Carga inicial
    obtenerIngresos();
});