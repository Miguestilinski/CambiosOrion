document.addEventListener('DOMContentLoaded', () => {
    const mostrarRegistros = document.getElementById('mostrar-registros');
    const buscarInput = document.getElementById('buscar');
    const fechaInicio = document.getElementById('fecha-inicio');
    const fechaFin = document.getElementById('fecha-fin');
    const tipoCliente = document.getElementById('tipo-cliente');
    const nombreRSocial = document.getElementById('nombre-r-social');
    const rut = document.getElementById('rut');
    const direccion = document.getElementById('direccion');
    const fono = document.getElementById('fono');
    const habilitados = document.getElementById('habilitados');
    const borrarFiltrosBtn = document.getElementById('borrar-filtros');
    const tablaClientes = document.querySelector('#clientes table tbody');
    const nuevaFichaBtn = document.getElementById('nueva-ficha');

    // Redirigir al hacer clic en "Nueva Ficha Cliente"
    if (nuevaFichaBtn) {
        nuevaFichaBtn.addEventListener('click', () => {
            window.location.href = nuevaFichaBtn.getAttribute('href');
        });
    }

    // Función para obtener los clientes con filtros
    function obtenerClientes() {
        const params = new URLSearchParams();
        params.set('fecha_inicio', fechaInicio.value);
        params.set('fecha_fin', fechaFin.value);
        params.set('tipo_cliente', tipoCliente.value);
        params.set('nombre_r_social', nombreRSocial.value);
        params.set('rut', rut.value);
        params.set('direccion', direccion.value);
        params.set('fono', fono.value);
        params.set('habilitados', habilitados.value);
        params.set('mostrar_registros', mostrarRegistros.value);
        params.set('buscar', buscarInput.value);

        fetch(`https://cambiosorion.cl/data/clientes.php?${params.toString()}`)
            .then(res => res.json())
            .then(data => {
                renderizarTabla(data);
            })
            .catch(err => console.error('Error al obtener los datos:', err));
    }

    function renderizarTabla(clientes) {
        tablaClientes.innerHTML = '';
        clientes.forEach(cliente => {

            const tr = document.createElement('tr');
            tr.classList.add('bg-white', 'border-b', 'border-gray-700', 'text-gray-700');
    
            // Crear botón Mostrar
            const btnMostrar = document.createElement('button');
            btnMostrar.textContent = 'Mostrar';
            btnMostrar.className = 'text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-sm px-3 py-1';
            btnMostrar.addEventListener('click', () => {
                window.location.href = `detalle-cl?id=${cliente.id}`; // Ajusta URL según corresponda
            });
    
            // Crear botón Deshabilitar (opcionalmente puedes también hacer funcionalidad aquí)
            const btnDeshabilitar = document.createElement('button');
            btnDeshabilitar.textContent = 'Deshabilitar';
            btnDeshabilitar.className = 'text-white bg-red-700 hover:bg-blue-800 font-medium rounded-lg text-sm px-3 py-1';

            tr.innerHTML = `
                <td class="px-4 py-2">${cliente.fecha_ingreso}</td>
                <td class="px-4 py-2">${cliente.tipo}</td>
                <td class="px-4 py-2">${cliente.razon_social}</td>
                <td class="px-4 py-2">${cliente.rut}</td>
                <td class="px-4 py-2">${cliente.direccion}</td>
                <td class="px-4 py-2">${cliente.fono}</td>
                <td class="px-4 py-2 mostrar-btn-cell"></td>
                <td class="px-4 py-2 deshabilitar-btn-cell"></td>
            `;

            tr.querySelector('.mostrar-btn-cell').appendChild(btnMostrar);
            tr.querySelector('.deshabilitar-btn-cell').appendChild(btnDeshabilitar);

            tablaClientes.appendChild(tr);
        });
    }

    // Listeners para filtros
    [
        fechaInicio, fechaFin, tipoCliente, nombreRSocial,
        rut, direccion, fono, habilitados, mostrarRegistros, buscarInput
    ].forEach(el => el.addEventListener('input', obtenerClientes));

    borrarFiltrosBtn.addEventListener('click', () => {
        fechaInicio.value = '';
        fechaFin.value = '';
        tipoCliente.value = '';
        nombreRSocial.value = '';
        rut.value = '';
        direccion.value = '';
        fono.value = '';
        habilitados.value = '';
        buscarInput.value = '';
        obtenerClientes();
    });

    // Cargar al inicio
    obtenerClientes();
});
