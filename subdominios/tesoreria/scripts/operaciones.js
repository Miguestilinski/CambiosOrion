document.addEventListener('DOMContentLoaded', () => {   
    const nuevaOperacionBtn = document.getElementById('nueva-op');
    const numeroInput = document.getElementById('numero');
    const clienteInput = document.getElementById('cliente');
    const tipoDocSelect = document.getElementById('tipo-doc');
    const nDocInput = document.getElementById('n-doc');
    const fechaInicioInput = document.getElementById('fecha-inicio');
    const fechaFinInput = document.getElementById('fecha-fin');
    const emitidasCheckbox = document.getElementById('emitidas');
    const noEmitidasCheckbox = document.getElementById('no-emitidas');
    const buscarInput = document.getElementById('buscar');
    const mostrarRegistros = document.getElementById('mostrar-registros');
    const borrarFiltrosBtn = document.getElementById('borrar-filtros');
    const tablaOperaciones = document.getElementById('tabla-operaciones');

   // Redirigir al hacer clic en "Nueva Operacion"
    if (nuevaOperacionBtn) {
        nuevaOperacionBtn.addEventListener('click', () => {
            window.location.href = 'https://tesoreria.cambiosorion.cl/nueva-op';
        });
    }

    // Función para obtener las operaciones con los filtros aplicados
    function obtenerOperaciones() {
        const params = new URLSearchParams();

        params.set('numero', numeroInput.value);
        params.set('cliente', clienteInput.value);
        params.set('tipo_doc', tipoDocSelect.value);
        params.set('n_doc', nDocInput.value);
        params.set('fecha_inicio', fechaInicioInput.value);
        params.set('fecha_fin', fechaFinInput.value);
        if (emitidasCheckbox.checked) params.set('emitidas', '1');
        if (noEmitidasCheckbox.checked) params.set('no_emitidas', '1');
        params.set('buscar', buscarInput.value);
        params.set('mostrar_registros', mostrarRegistros.value);

        console.log('Parámetros enviados:', params.toString());

        fetch(`https://cambiosorion.cl/data/operaciones.php?${params.toString()}`)
            .then(response => response.json())
            .then(data => {
                console.log('Datos recibidos:', data);
                mostrarResultados(data);
            })            
            .catch(error => console.error('Error al obtener operaciones:', error));
    }

    // Función para mostrar los resultados en la tabla
    function mostrarResultados(operaciones) {
        tablaOperaciones.innerHTML = '';

        if (operaciones.length === 0) {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td colspan="13" class="text-center text-gray-700 py-4 bg-white">No se encontraron operaciones</td>`;
            tablaOperaciones.appendChild(tr);
            return;
        }

        operaciones.forEach(operacion => {
            const tr = document.createElement('tr');
            tr.classList.add('border-b', 'bg-white', 'border-gray-700', 'text-gray-700');

            // Colores según tipo de transacción
            if (operacion.tipo_transaccion === 'Compra') {
                tr.style.backgroundColor = '#c3e8f1'; // celeste
            } else if (operacion.tipo_transaccion === 'Venta') {
                tr.style.backgroundColor = '#dbf599'; // verde claro
            }

            // Crear botón Mostrar
            const btnMostrar = document.createElement('button');
            btnMostrar.textContent = 'Mostrar';
            btnMostrar.className = 'text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-sm px-3 py-1';
            btnMostrar.addEventListener('click', () => {
                window.location.href = `detalle-op.html?id=${operacion.id}`;
            });
    
            // Crear botón Editar
            const btnEditar = document.createElement('button');
            btnEditar.textContent = 'Editar';
            btnEditar.className = 'text-white bg-black hover:bg-blue-800 font-medium rounded-lg text-sm px-3 py-1';
    
            // Crear botón Desactivar
            const btnDesactivar = document.createElement('button');
            btnDesactivar.textContent = 'Desactivar';
            btnDesactivar.className = 'text-white bg-red-700 hover:bg-blue-800 font-medium rounded-lg text-sm px-3 py-1';
    
            tr.innerHTML = `
                <td class="px-4 py-2">${operacion.fecha}</td>
                <td class="px-4 py-2">${operacion.id}</td>
                <td class="px-4 py-2">${operacion.cliente_id}</td>
                <td class="px-4 py-2">${operacion.tipo_documento}</td>
                <td class="px-4 py-2">${operacion.numero_documento}</td>
                <td class="px-4 py-2">${operacion.numero_nota}</td>
                <td class="px-4 py-2">${operacion.tipo_transaccion}</td>
                <td class="px-4 py-2">${operacion.divisa}</td>
                <td class="px-4 py-2">${operacion.monto_total}</td>
                <td class="px-4 py-2">${operacion.tasa_cambio_promedio}</td>
                <td class="px-4 py-2">${operacion.total}</td>
                <td class="px-4 py-2">${operacion.estado}</td>
                <td class="px-4 py-2 mostrar-btn-cell"></td>
            `;
    
            tr.querySelector('.mostrar-btn-cell').appendChild(btnMostrar);
    
            tablaOperaciones.appendChild(tr);
        });
    }

    // Borrar filtros
    borrarFiltrosBtn.addEventListener('click', () => {
        numeroInput.value = '';
        clienteInput.value = '';
        tipoDocSelect.value = '';
        nDocInput.value = '';
        fechaInicioInput.value = '';
        fechaFinInput.value = '';
        emitidasCheckbox.checked = false;
        noEmitidasCheckbox.checked = false;
        buscarInput.value = '';
        mostrarRegistros.value = '25';
        obtenerOperaciones();
    });

    // Cargar cuentas inicialmente
    [numeroInput, clienteInput, tipoDocSelect, nDocInput, fechaInicioInput, fechaFinInput, emitidasCheckbox, noEmitidasCheckbox, buscarInput, mostrarRegistros]
        .forEach(element => {
            element.addEventListener('input', obtenerOperaciones);
            element.addEventListener('change', obtenerOperaciones);
        });

    obtenerOperaciones();
});