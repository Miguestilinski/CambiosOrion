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
    const nuevoClienteBtn = document.getElementById('nuevo-cliente');

    // Redirigir al hacer clic en "Nuevo Cliente"
    if (nuevoClienteBtn) {
        nuevoClienteBtn.addEventListener('click', () => {
            window.location.href = 'https://tesoreria.cambiosorion.cl/nuevo-cliente';
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
            .then(res => {
                // Verifica si la respuesta es OK, si no, también loguea el status
                if (!res.ok) {
                    console.error("Error en la respuesta del servidor:", res.status, res.statusText);
                }
                return res.text(); // Pide la respuesta como texto en lugar de JSON
            })
            .then(text => {
                // 1. ¡Aquí mostramos la respuesta cruda en la consola!
                console.log("Respuesta cruda del servidor:", text);

                // 2. Intentamos parsear el texto manualmente
                try {
                    // Si el texto está vacío, trátalo como un array vacío
                    if (text.trim() === "") {
                        console.warn("La respuesta del servidor está vacía.");
                        renderizarTabla([]); // Renderiza una tabla vacía
                        return;
                    }
                    
                    const data = JSON.parse(text); // Parseamos el texto
                    renderizarTabla(data); // Si tiene éxito, renderiza
                
                } catch (jsonError) {
                    // Si falla el parseo, el error de sintaxis de JSON se mostrará aquí
                    console.error("Error al parsear JSON:", jsonError);
                    tablaClientes.innerHTML = '<tr><td colspan="8" class="px-4 py-2 text-center text-red-500">Error al procesar la respuesta del servidor. Revise la consola.</td></tr>';
                }
            })
            .catch(err => console.error('Error de red al obtener los datos:', err)); // Esto captura errores de red
    }

    function formatearFecha(timestamp) {
        // Si la fecha es nula o inválida, devuelve un string vacío
        if (!timestamp) return ''; 
        
        const fecha = new Date(timestamp);

        // Comprobar si la fecha es válida
        if (isNaN(fecha.getTime())) {
            return timestamp; // Devuelve el original si no se pudo convertir
        }
        
        const hh = String(fecha.getHours()).padStart(2, '0');
        const min = String(fecha.getMinutes()).padStart(2, '0');
        const dd = String(fecha.getDate()).padStart(2, '0');
        const mm = String(fecha.getMonth() + 1).padStart(2, '0'); // getMonth() es 0-indexado, por eso +1
        const yyyy = fecha.getFullYear();
        
        return `${hh}:${min} ${dd}/${mm}/${yyyy}`;
    }

    function formatearRut(rut) {
        // Si el RUT es nulo, vacío o "null", devuelve un string vacío
        if (!rut || rut === 'null') return '';

        // 1. Dividir por el guion que AHORA VIENE de la BD
        const parts = rut.split('-');
        
        // 2. Si no tiene el formato "cuerpo-dv", devolverlo tal cual.
        if (parts.length !== 2) return rut;

        const cuerpo = parts[0];
        const dv = parts[1];

        // 3. Si el cuerpo no es un número, devolver tal cual
        if (isNaN(cuerpo)) return rut;

        // 4. Formatear el cuerpo con los puntos
        const cuerpoFormateado = new Intl.NumberFormat('es-CL').format(cuerpo);

        // 5. Devolver el RUT formateado
        return `${cuerpoFormateado}-${dv}`;
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
            const btnToggleActivo = document.createElement('button');
            const esActivo = cliente.activo == 1; // 'activo' es el nuevo campo de la BD

            btnToggleActivo.textContent = esActivo ? 'Deshabilitar' : 'Habilitar';
            btnToggleActivo.className = `font-medium rounded-lg text-sm px-3 py-1 text-white ${esActivo ? 'bg-red-700 hover:bg-red-800' : 'bg-green-700 hover:bg-green-800'}`;
            
            // 2. Añadir evento click para el toggle
            btnToggleActivo.addEventListener('click', () => {
                // Llama a la nueva función (que crearemos abajo)
                toggleEstadoCliente(cliente.id, !esActivo); 
            });

            const fechaFormateada = formatearFecha(cliente.fecha_ingreso);

            tr.innerHTML = `
                <td class="px-4 py-2">${fechaFormateada}</td>
                <td class="px-4 py-2">${cliente.tipo}</td>
                <td class="px-4 py-2">${cliente.razon_social}</td>
                <td class="px-4 py-2">${formatearRut(cliente.rut)}</td>
                <td class="px-4 py-2">${cliente.direccion}</td>
                <td class="px-4 py-2">${cliente.fono}</td>
                <td class="px-4 py-2">${cliente.estado_documentacion || 'No Documentado'}</td>
                <td class="px-4 py-2 mostrar-btn-cell"></td>
                <td class="px-4 py-2 deshabilitar-btn-cell"></td>
            `;

            tr.querySelector('.mostrar-btn-cell').appendChild(btnMostrar);
            tr.querySelector('.deshabilitar-btn-cell').appendChild(btnToggleActivo);

            tablaClientes.appendChild(tr);
        });
    }

    function toggleEstadoCliente(clienteId, nuevoEstadoBooleano) {
        // nuevoEstadoBooleano es (true = Habilitar, false = Deshabilitar)
        const nuevoValorFetch = nuevoEstadoBooleano ? 1 : 0;

        fetch(`https://cambiosorion.cl/data/clientes.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: clienteId,
                activo: nuevoValorFetch
            })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                obtenerClientes(); // Recarga la tabla para reflejar el cambio
            } else {
                console.error('Error al actualizar el cliente:', data.error);
                alert('Error al actualizar el cliente.');
            }
        })
        .catch(err => {
            console.error('Error de red al actualizar:', err);
            alert('Error de red al actualizar el cliente.');
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
