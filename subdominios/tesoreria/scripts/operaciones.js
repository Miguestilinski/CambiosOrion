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
    const borrarFiltrosBtn = document.getElementById('borrar-filtros');
    const mostrarRegistros = document.getElementById('mostrar-registros');
    const buscarInput = document.getElementById('buscar');
    const tablaOperaciones = document.getElementById('tabla-operaciones');
    const conteoResultados = document.getElementById('conteo-resultados');
    const paginacionContainer = document.getElementById('paginacion-container');

    let paginaActual = 1;

   // Redirigir al hacer clic en "Nueva Operacion"
    if (nuevaOperacionBtn) {
        nuevaOperacionBtn.addEventListener('click', () => {
            window.location.href = 'https://tesoreria.cambiosorion.cl/nueva-op';
        });
    }

    // Función para obtener las operaciones con los filtros aplicados
    function obtenerOperaciones() {
        const params = new URLSearchParams();

        params.set('fecha_inicio', fechaInicioInput.value);
        params.set('fecha_fin', fechaFinInput.value);
        if (emitidasCheckbox.checked) params.set('emitidas', '1');
        if (noEmitidasCheckbox.checked) params.set('no_emitidas', '1');
        
        params.set('numero', numeroInput.value);
        params.set('cliente', clienteInput.value);
        params.set('tipo_doc', tipoDocSelect.value);
        params.set('n_doc', nDocInput.value);
        params.set('n_nota', nNotaInput.value);
        params.set('tipo_transaccion', tipoTransaccionSelect.value);
        params.set('divisa', divisaInput.value);
        params.set('estado', estadoSelect.value);

        params.set('buscar', buscarInput.value);
        params.set('mostrar_registros', mostrarRegistros.value);
        params.set('pagina', paginaActual); // Enviar página actual

        console.log('Parámetros enviados:', params.toString());

        fetch(`https://cambiosorion.cl/data/operaciones.php?${params.toString()}`)
            .then(res => res.text()) // Pedir como texto primero
            .then(text => {
                console.log("Respuesta cruda del servidor:", text);
                try {
                    const data = JSON.parse(text); // 'data' ahora es {operaciones: [], totalFiltrado: N}

                    // Renderizar la tabla con los datos de esta página
                    renderizarTabla(data.operaciones);
                    
                    // Renderizar el conteo
                    const porPagina = parseInt(mostrarRegistros.value, 10);
                    renderizarConteo(data.operaciones.length, data.totalFiltrado, porPagina, paginaActual);
                    
                    // Renderizar los botones de paginación
                    renderizarPaginacion(data.totalFiltrado, porPagina, paginaActual);

                } catch (jsonError) {
                    console.error("Error al parsear JSON:", jsonError, text);
                    tablaOperaciones.innerHTML = `<tr><td colspan="13" class="text-center text-red-500 py-4 bg-white">Error al cargar datos. Revise la consola.</td></tr>`;
                    conteoResultados.textContent = 'Error al cargar.';
                    paginacionContainer.innerHTML = '';
                }
            })
            .catch(error => {
                console.error('Error de red al obtener operaciones:', error)
                tablaOperaciones.innerHTML = `<tr><td colspan="13" class="text-center text-red-500 py-4 bg-white">Error de red. No se pudo conectar.</td></tr>`;
                conteoResultados.textContent = 'Error de red.';
                paginacionContainer.innerHTML = '';
            });
    }

    function formatearFecha(timestamp) {
        if (!timestamp) return ''; 
        const fecha = new Date(timestamp);
        if (isNaN(fecha.getTime())) return timestamp;
        
        const hh = String(fecha.getHours()).padStart(2, '0');
        const min = String(fecha.getMinutes()).padStart(2, '0');
        const dd = String(fecha.getDate()).padStart(2, '0');
        const mm = String(fecha.getMonth() + 1).padStart(2, '0');
        const yyyy = fecha.getFullYear();
        
        return `${hh}:${min} ${dd}/${mm}/${yyyy}`;
    }

    function formatearNumero(numero) {
        if (numero === null || numero === undefined || numero === '') return '';

        const num = parseFloat(numero);
        if (isNaN(num)) return '';

        // Redondear a máximo 3 decimales, sin ceros innecesarios
        const redondeado = Math.round(num * 1000) / 1000;

        return redondeado
            .toLocaleString('es-CL', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 3
            })
            .replace(/\u00A0/g, '');
    }

    function limpiarTexto(valor) {
        return valor === null || valor === undefined ? '' : valor;
    }

    // Función para mostrar los resultados en la tabla
    function renderizarTabla(operaciones) {
        tablaOperaciones.innerHTML = '';

        if (!operaciones || operaciones.length === 0) {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td colspan="13" class="text-center text-gray-700 py-4 bg-white">No se encontraron operaciones</td>`;
            tablaOperaciones.appendChild(tr);
            return;
        }

        operaciones.forEach(operacion => {
            const tr = document.createElement('tr');
            tr.classList.add('border-b', 'bg-white', 'border-gray-700', 'text-gray-700');

            // Colores según tipo de transacción
            if (operacion.estado === 'Anulado') {
                tr.style.backgroundColor = '#f9b8a3'; // rojo
            } else if (operacion.tipo_transaccion === 'Compra') {
                tr.style.backgroundColor = '#c3e8f1'; // celeste
            } else if (operacion.tipo_transaccion === 'Venta') {
                tr.style.backgroundColor = '#dbf599'; // verde claro
            }

            // Crear botón Mostrar
            const btnMostrar = document.createElement('button');
            btnMostrar.textContent = 'Mostrar';
            btnMostrar.className = 'text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-sm px-3 py-1';
            btnMostrar.addEventListener('click', () => {
                window.location.href = `detalle-op?id=${operacion.id}`;
            });
    
            // Crear botón Editar
            const btnEditar = document.createElement('button');
            btnEditar.textContent = 'Editar';
            btnEditar.className = 'text-white bg-black hover:bg-blue-800 font-medium rounded-lg text-sm px-3 py-1';
    
            // Crear botón Desactivar
            const btnDesactivar = document.createElement('button');
            btnDesactivar.textContent = 'Desactivar';
            btnDesactivar.className = 'text-white bg-red-700 hover:bg-blue-800 font-medium rounded-lg text-sm px-3 py-1';
            
            // Procesar divisas y tasas como listas tabuladas
            const divisas = operacion.divisas ? operacion.divisas.split(', ') : [];
            const tasas = operacion.tasas_cambio ? operacion.tasas_cambio.split('|') : [];
            const montos = operacion.montos_por_divisa ? operacion.montos_por_divisa.split('|') : [];

            let divisaHTML = divisas.map(d => `<div>${limpiarTexto(d)}</div>`).join('');
            let montoHTML = montos.map(m => `<div>${formatearNumero(m)}</div>`).join('');
            let tasaHTML = tasas.map(t => `<div>${formatearNumero(t)}</div>`).join('');

            tr.innerHTML = `
                <td class="px-4 py-2">${formatearFecha(operacion.fecha)}</td>
                <td class="px-4 py-2">${limpiarTexto(operacion.id)}</td>
                <td class="px-4 py-2">${limpiarTexto(operacion.nombre_cliente)}</td>
                <td class="px-4 py-2">${limpiarTexto(operacion.tipo_documento)}</td>
                <td class="px-4 py-2">${limpiarTexto(operacion.numero_documento)}</td>
                <td class="px-4 py-2">${limpiarTexto(operacion.numero_nota)}</td>
                <td class="px-4 py-2">${limpiarTexto(operacion.tipo_transaccion)}</td>
                <td class="px-4 py-2">${divisaHTML}</td>
                <td class="px-4 py-2">${montoHTML}</td>
                <td class="px-4 py-2">${tasaHTML}</td>
                <td class="px-4 py-2">${formatearNumero(operacion.total)}</td>
                <td class="px-4 py-2">${limpiarTexto(operacion.estado)}</td>
                <td class="px-4 py-2 mostrar-btn-cell"></td>
            `;
    
            tr.querySelector('.mostrar-btn-cell').appendChild(btnMostrar);
    
            tablaOperaciones.appendChild(tr);
        });
    }

    function renderizarConteo(mostrados, total, porPagina, pagina) {
        if (!conteoResultados) return;
        if (total === 0) {
            conteoResultados.textContent = 'No se encontraron resultados.';
            return;
        }
        const inicio = ((pagina - 1) * porPagina) + 1;
        const fin = inicio + mostrados - 1;
        conteoResultados.textContent = `Mostrando ${inicio}-${fin} de ${total} resultados`;
    }

    function renderizarPaginacion(total, porPagina, pagina) {
        if (!paginacionContainer) return;
        paginacionContainer.innerHTML = '';
        const totalPaginas = Math.ceil(total / porPagina);

        if (totalPaginas <= 1) return;

        if (pagina > 1) {
            paginacionContainer.appendChild(crearBotonPaginacion('Anterior', pagina - 1));
        }

        const maxBotones = 5;
        let inicio = Math.max(1, pagina - Math.floor(maxBotones / 2));
        let fin = Math.min(totalPaginas, inicio + maxBotones - 1);
        inicio = Math.max(1, fin - maxBotones + 1);

        if (inicio > 1) {
            paginacionContainer.appendChild(crearBotonPaginacion(1, 1));
            if (inicio > 2) paginacionContainer.appendChild(crearSpanPaginacion('...'));
        }

        for (let i = inicio; i <= fin; i++) {
            paginacionContainer.appendChild(crearBotonPaginacion(i, i, i === pagina));
        }

        if (fin < totalPaginas) {
            if (fin < totalPaginas - 1) paginacionContainer.appendChild(crearSpanPaginacion('...'));
            paginacionContainer.appendChild(crearBotonPaginacion(totalPaginas, totalPaginas));
        }

        if (pagina < totalPaginas) {
            paginacionContainer.appendChild(crearBotonPaginacion('Siguiente', pagina + 1));
        }
    }

    function crearBotonPaginacion(texto, pagina, esActual = false) {
        const boton = document.createElement('button');
        boton.textContent = texto;
        boton.className = `px-3 py-1 mx-1 rounded-lg focus:outline-none ${
            esActual 
            ? 'bg-blue-700 text-white' 
            : 'bg-white text-gray-700 hover:bg-gray-200'
        }`;
        boton.addEventListener('click', (e) => {
            e.preventDefault();
            paginaActual = pagina;
            obtenerOperaciones();
        });
        return boton;
    }

    function crearSpanPaginacion(texto) {
        const span = document.createElement('span');
        span.textContent = texto;
        span.className = 'px-3 py-1 mx-1 text-white select-none';
        return span;
    }

    const todosLosFiltros = [
        fechaInicioInput, fechaFinInput, emitidasCheckbox, noEmitidasCheckbox,
        numeroInput, clienteInput, tipoDocSelect, nDocInput, nNotaInput,
        tipoTransaccionSelect, divisaInput, estadoSelect,
        mostrarRegistros, buscarInput
    ];

    todosLosFiltros.forEach(element => {
        // 'input' para texto/número, 'change' para select/checkbox/date
        const evento = (element.type === 'checkbox' || element.tagName === 'SELECT' || element.type === 'date') ? 'change' : 'input';
        
        element.addEventListener(evento, () => {
            paginaActual = 1; // Resetear a página 1 en cualquier filtro
            obtenerOperaciones();
        });
    });

    borrarFiltrosBtn.addEventListener('click', () => {
        fechaInicioInput.value = '';
        fechaFinInput.value = '';
        emitidasCheckbox.checked = false;
        noEmitidasCheckbox.checked = false;
        numeroInput.value = '';
        clienteInput.value = '';
        tipoDocSelect.value = '';
        nDocInput.value = '';
        nNotaInput.value = '';
        tipoTransaccionSelect.value = '';
        divisaInput.value = '';
        estadoSelect.value = '';
        
        mostrarRegistros.value = '25';
        buscarInput.value = '';
        
        paginaActual = 1;
        obtenerOperaciones();
    });

    // Carga inicial
    obtenerOperaciones();
});