document.addEventListener('DOMContentLoaded', () => {
    // --- 1. Obtener elementos ---
    const mostrarRegistros = document.getElementById('mostrar-registros');
    const buscarInput = document.getElementById('buscar');
    const fechaInicioInput = document.getElementById('fecha-inicio');
    const fechaFinInput = document.getElementById('fecha-fin');
    const cajaSelect = document.getElementById('caja');
    const borrarFiltrosBtn = document.getElementById('borrar-filtros');
    const tablaHistorial = document.getElementById('tabla-historial');
    const volverBtn = document.getElementById('volver-inventarios');

    const conteoResultados = document.getElementById('conteo-resultados');
    const paginacionContainer = document.getElementById('paginacion-container');
    let paginaActual = 1;

    if (volverBtn) {
        volverBtn.addEventListener('click', () => {
            window.location.href = 'https://tesoreria.cambiosorion.cl/inventarios';
        });
    }

    // --- 2. Cargar Cajas (para el filtro) ---
    function cargarCajas() {
        fetch("https://cambiosorion.cl/data/historial-inv.php?action=cajas")
            .then(res => res.json())
            .then(cajas => {
                cajaSelect.innerHTML = '<option value="">Todas</option>'; // Opción por defecto
                cajas.forEach(caja => {
                    const option = document.createElement("option");
                    option.value = caja.id;
                    option.textContent = caja.nombre;
                    cajaSelect.appendChild(option);
                });
                // Carga inicial de datos después de cargar cajas
                obtenerHistorial();
            })
            .catch(error => console.error("Error al cargar cajas:", error));
    }

    // --- 3. Función principal de Fetch ---
    function obtenerHistorial() {
        const params = new URLSearchParams();
        params.set('fecha_inicio', fechaInicioInput.value);
        params.set('fecha_fin', fechaFinInput.value);
        params.set('caja', cajaSelect.value);
        params.set('buscar', buscarInput.value);
        params.set('mostrar_registros', mostrarRegistros.value);
        params.set('pagina', paginaActual);

        fetch(`https://cambiosorion.cl/data/historial-inv.php?${params.toString()}`)
            .then(res => res.text())
            .then(text => {
                console.log("Respuesta cruda:", text);
                try {
                    const data = JSON.parse(text); 
                    
                    if (data.historial) {
                        renderizarTabla(data.historial);
                        const porPagina = parseInt(mostrarRegistros.value, 10);
                        renderizarConteo(data.historial.length, data.totalFiltrado, porPagina, paginaActual);
                        renderizarPaginacion(data.totalFiltrado, porPagina, paginaActual);
                    } else {
                        throw new Error(data.error || "Formato de datos incorrecto");
                    }
                } catch (e) {
                    console.error("Error al parsear JSON:", e, text);
                    tablaHistorial.innerHTML = '<tr><td colspan="6" class="text-center text-red-500 py-4">Error al procesar datos.</td></tr>';
                }
            })
            .catch(error => console.error('Error al obtener historial:', error));
    }

    // --- 4. Función de Renderizado de Tabla ---
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

    function renderizarTabla(historial) {
        tablaHistorial.innerHTML = '';
        if (!historial || historial.length === 0) {
            tablaHistorial.innerHTML = '<tr><td colspan="6" class="text-center text-gray-700 py-4 bg-white">No se encontraron arqueos.</td></tr>';
            return;
        }

        historial.forEach(item => {
            const tr = document.createElement('tr');
            tr.classList.add('border-b', 'bg-white', 'border-gray-700', 'text-gray-700');

            const btnMostrar = document.createElement('button');
            btnMostrar.textContent = 'Mostrar';
            btnMostrar.className = 'text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-sm px-3 py-1';
            btnMostrar.addEventListener('click', () => {
                window.location.href = `detalle-arqueo?id=${item.id}`;
            });

            // Lógica de Diferencia
            const dif = parseFloat(item.total_diferencia);
            let estadoHTML;
            if (dif === 0 || isNaN(dif)) {
                estadoHTML = `<span class="text-green-600 font-medium">Cuadrado</span>`;
            } else {
                estadoHTML = `<span class="text-red-600 font-bold">Con Diferencia</span>`;
            }

            tr.innerHTML = `
                <td class="px-4 py-2">${formatearFecha(item.fecha)}</td>
                <td class="px-4 py-2">${item.nombre_caja || 'N/A'}</td>
                <td class="px-4 py-2">${item.nombre_usuario || 'N/A'}</td>
                <td class="px-4 py-2">${item.observacion || ''}</td>
                <td class="px-4 py-2">${estadoHTML}</td>
                <td class="px-4 py-2 mostrar-btn-cell"></td>
            `;

            tr.querySelector('.mostrar-btn-cell').appendChild(btnMostrar);
            tablaHistorial.appendChild(tr);
        });
    }

    // --- 5. Funciones de Paginación (Copiadas de clientes.js) ---
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
            obtenerHistorial();
        });
        return boton;
    }
    function crearSpanPaginacion(texto) {
        const span = document.createElement('span');
        span.textContent = texto;
        span.className = 'px-3 py-1 mx-1 text-white select-none';
        return span;
    }

    // --- 6. Listeners para Filtros ---
    const todosLosFiltros = [
        fechaInicioInput, fechaFinInput, cajaSelect, 
        mostrarRegistros, buscarInput
    ];

    todosLosFiltros.forEach(el => {
        const evento = (el.tagName === 'SELECT') ? 'change' : 'input';
        el.addEventListener(evento, () => {
            paginaActual = 1;
            obtenerHistorial();
        });
    });

    if (borrarFiltrosBtn) {
        borrarFiltrosBtn.addEventListener('click', () => {
            fechaInicioInput.value = '';
            fechaFinInput.value = '';
            cajaSelect.value = '';
            buscarInput.value = '';
            mostrarRegistros.value = '25';
            paginaActual = 1;
            obtenerHistorial();
        });
    }

    // --- 7. Carga inicial ---
    cargarCajas();
});