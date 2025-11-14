document.addEventListener('DOMContentLoaded', () => {
    const mostrarRegistros = document.getElementById('mostrar-registros');
    const buscarInput = document.getElementById('buscar');
    const nombreInput = document.getElementById('nombre');
    const paisInput = document.getElementById('pais');
    const codigoInput = document.getElementById('codigo');
    const simboloInput = document.getElementById('simbolo');
    const tipoInput = document.getElementById('tipo');
    const fraccionableInput = document.getElementById('fraccionable');
    const tablaDivisas = document.querySelector('table tbody');
    const nuevaDivisaBtn = document.getElementById('nueva-divisa');
    const borrarFiltrosBtn = document.getElementById('borrar-filtros');

    const conteoResultados = document.getElementById('conteo-resultados');
    const paginacionContainer = document.getElementById('paginacion-container');
    let paginaActual = 1;

    function capitalizar(str) {
        if (!str || typeof str !== 'string') return str;
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    if (nuevaDivisaBtn) {
        nuevaDivisaBtn.addEventListener('click', () => {
            window.location.href = 'https://tesoreria.cambiosorion.cl/nueva-div';
        });
    }

    function obtenerDivisas() {
        const params = new URLSearchParams();
        params.set('nombre', nombreInput.value);
        params.set('pais', paisInput.value);
        params.set('codigo', codigoInput.value);
        params.set('simbolo', simboloInput.value);
        params.set('tipo_divisa', tipoInput.value);
        params.set('fraccionable', fraccionableInput.value);
        params.set('mostrar_registros', mostrarRegistros.value);
        params.set('buscar', buscarInput.value);
        params.set('pagina', paginaActual);

        fetch(`https://cambiosorion.cl/data/divisas-int.php?${params.toString()}`)
            .then(res => {
                if (!res.ok) console.error("Error en respuesta:", res.status);
                return res.text(); // Leer como texto
            })
            .then(text => {
                console.log("Respuesta cruda:", text);
                try {
                    const data = JSON.parse(text); // Parsear manualmente
                    
                    if (data.divisas) {
                        mostrarResultados(data.divisas);
                        // Renderizar conteo y paginación
                        const porPagina = parseInt(mostrarRegistros.value, 10);
                        renderizarConteo(data.divisas.length, data.totalFiltrado, porPagina, paginaActual);
                        renderizarPaginacion(data.totalFiltrado, porPagina, paginaActual);
                    } else {
                        throw new Error("Formato de datos incorrecto");
                    }
                } catch (e) {
                    console.error("Error al parsear JSON:", e, text);
                    tablaDivisas.innerHTML = '<tr><td colspan="9" class="text-center text-red-500 py-4">Error al procesar datos.</td></tr>';
                    conteoResultados.textContent = 'Error.';
                    paginacionContainer.innerHTML = '';
                }
            })
            .catch(error => {
                console.error('Error al obtener las divisas:', error)
                tablaDivisas.innerHTML = '<tr><td colspan="9" class="text-center text-red-500 py-4">Error de red.</td></tr>';
            });
    }

    function mostrarResultados(divisas) {
        tablaDivisas.innerHTML = '';

        if (!divisas || divisas.length === 0) {
            tablaDivisas.innerHTML = '<tr><td colspan="9" class="text-center text-gray-700 py-4 bg-white">No se encontraron divisas con esos filtros.</td></tr>';
            return;
        }

        divisas.forEach(divisa => {
            const tr = document.createElement('tr');
            tr.classList.add('border-b', 'bg-white', 'border-gray-700', 'text-gray-700');

            // Crear botón Mostrar (como en clientes.js)
            const btnMostrar = document.createElement('button');
            btnMostrar.textContent = 'Mostrar';
            btnMostrar.className = 'text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-sm px-3 py-1';
            btnMostrar.addEventListener('click', () => {
                window.location.href = `detalle-div?id=${divisa.id}`;
            });

            tr.innerHTML = `
                <td class="px-4 py-2">
                    ${divisa.icono ? `<img src="${divisa.icono}" alt="Icono" class="w-6 h-6 rounded-full border border-gray-400" />` : ''}
                </td>
                <td class="px-4 py-2">${divisa.nombre}</td>
                <td class="px-4 py-2">${divisa.pais}</td>
                <td class="px-4 py-2">${divisa.codigo}</td>
                <td class="px-4 py-2">${divisa.simbolo}</td>
                <td class="px-4 py-2">${capitalizar(divisa.tipo_divisa ?? '-')}</td>
                <td class="px-4 py-2">${divisa.fraccionable}</td>
                <td class="px-4 py-2">${divisa.estado}</td>
                <td class="px-4 py-2 mostrar-btn-cell"></td>
            `;

            tr.querySelector('.mostrar-btn-cell').appendChild(btnMostrar);
            tablaDivisas.appendChild(tr);
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

        if (pagina > 1) paginacionContainer.appendChild(crearBotonPaginacion('Anterior', pagina - 1));

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
        if (pagina < totalPaginas) paginacionContainer.appendChild(crearBotonPaginacion('Siguiente', pagina + 1));
    }

    function crearBotonPaginacion(texto, pagina, esActual = false) {
        const boton = document.createElement('button');
        boton.textContent = texto;
        boton.className = `px-3 py-1 mx-1 rounded-lg focus:outline-none ${
            esActual ? 'bg-blue-700 text-white' : 'bg-white text-gray-700 hover:bg-gray-200'
        }`;
        boton.addEventListener('click', (e) => {
            e.preventDefault();
            paginaActual = pagina;
            obtenerDivisas();
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
        nombreInput, paisInput, codigoInput, simboloInput,
        tipoInput, fraccionableInput, mostrarRegistros, buscarInput
    ];

    todosLosFiltros.forEach(el => {
        const evento = (el.tagName === 'SELECT') ? 'change' : 'input';
        el.addEventListener(evento, () => {
            paginaActual = 1; // Resetear a página 1
            obtenerDivisas();
        });
    });

    if (borrarFiltrosBtn) {
        borrarFiltrosBtn.addEventListener('click', () => {
            nombreInput.value = '';
            paisInput.value = '';
            codigoInput.value = '';
            simboloInput.value = '';
            tipoInput.value = '';
            fraccionableInput.value = '';
            buscarInput.value = '';
            mostrarRegistros.value = '25';
            paginaActual = 1; // Resetear
            obtenerDivisas();
        });
    }

    obtenerDivisas();
});
