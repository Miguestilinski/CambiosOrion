document.addEventListener('DOMContentLoaded', () => {
    const mostrarRegistros = document.getElementById('mostrar-registros');
    const buscarInput = document.getElementById('buscar');
    const idInput = document.getElementById('id');
    const nombreInput = document.getElementById('nombre');
    const divisaInput = document.getElementById('divisa');
    const porCobrarSelect = document.getElementById('por-cobrar');
    const porPagarSelect = document.getElementById('por-pagar');
    const activaSelect = document.getElementById('activa');
    const borrarFiltrosBtn = document.getElementById('borrar-filtros');
    const tablaCuentas = document.querySelector('table tbody');
    const nuevaCuentaBtn = document.getElementById('nueva-cta');
    const divisaSugerencias = document.getElementById('divisa-sugerencias');
    let divisaSeleccionada = null;

    const conteoResultados = document.getElementById('conteo-resultados');
    const paginacionContainer = document.getElementById('paginacion-container');
    let paginaActual = 1;

    // Redirigir al hacer clic en "Nueva Cuenta"
    if (nuevaCuentaBtn) {
        nuevaCuentaBtn.addEventListener('click', () => {
            window.location.href = 'https://tesoreria.cambiosorion.cl/nueva-cta';
        });
    }

    function limpiarTexto(valor) {
        return valor === null || valor === undefined ? '' : valor;
    }

    // Función para obtener las cuentas con los filtros aplicados
    function obtenerCuentas() {
        const params = new URLSearchParams();
        params.set('id', idInput.value);
        if (nombreInput.value.trim() !== '') {
            params.set('nombre', nombreInput.value);
        }
        if (divisaSeleccionada) {
            params.set('divisa_id', divisaSeleccionada.id);
        }
        params.set('por_cobrar', porCobrarSelect.value);
        params.set('por_pagar', porPagarSelect.value);
        params.set('activa', activaSelect.value);
        params.set('mostrar_registros', mostrarRegistros.value);
        params.set('buscar', buscarInput.value);
        params.set('pagina', paginaActual);

        fetch(`https://cambiosorion.cl/data/cuentas.php?${params.toString()}`)
            .then(res => {
                if (!res.ok) console.error("Error en respuesta:", res.status, res.statusText);
                return res.text(); 
            })
            .then(text => {
                console.log("Respuesta cruda:", text);
                try {
                    const data = JSON.parse(text); // data = { cuentas: [...], totalFiltrado: N }

                    // Renderizar tabla
                    mostrarResultados(data.cuentas); // Usar data.cuentas

                    // Renderizar conteo y paginación
                    const porPagina = parseInt(mostrarRegistros.value, 10);
                    renderizarConteo(data.cuentas.length, data.totalFiltrado, porPagina, paginaActual);
                    renderizarPaginacion(data.totalFiltrado, porPagina, paginaActual);

                } catch (jsonError) {
                    console.error("Error al parsear JSON:", jsonError, text);
                    tablaCuentas.innerHTML = '<tr><td colspan="10" class="text-center text-red-500 py-4">Error al procesar datos. Revise consola.</td></tr>';
                    if (conteoResultados) conteoResultados.textContent = 'Error.';
                    if (paginacionContainer) paginacionContainer.innerHTML = '';
                }
            })
            // --- FIN CAMBIO ---
            .catch(error => { // Captura errores de red
                 console.error('Error al obtener las cuentas:', error);
                 tablaCuentas.innerHTML = '<tr><td colspan="10" class="text-center text-red-500 py-4">Error de red.</td></tr>';
                 if (conteoResultados) conteoResultados.textContent = 'Error de red.';
                 if (paginacionContainer) paginacionContainer.innerHTML = '';
            });
    }

    // Función para mostrar los resultados en la tabla
    function mostrarResultados(cuentas) {
        tablaCuentas.innerHTML = '';

        cuentas.forEach(cuenta => {
            const tr = document.createElement('tr');
            tr.classList.add('border-b', 'bg-white', 'border-gray-700', 'text-gray-700');

            const btnMostrar = document.createElement('button');
            btnMostrar.textContent = 'Mostrar';
            btnMostrar.className = 'text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-sm px-3 py-1';
            
            btnMostrar.addEventListener('click', () => {
                window.location.href = `detalle-cta?id=${cuenta.id}`;
            });

            tr.innerHTML = `
                <td class="px-4 py-2 text-center">${cuenta.id}</td>
                <td class="px-4 py-2">${limpiarTexto(cuenta.nombre)}</td>
                <td class="px-4 py-2">${limpiarTexto(cuenta.divisa)}</td>
                <td class="px-4 py-2 text-right">${cuenta.me_deben}</td>
                <td class="px-4 py-2 text-right">${cuenta.debo}</td>
                <td class="px-4 py-2 text-center">${limpiarTexto(cuenta.por_cobrar_texto)}</td>
                <td class="px-4 py-2 text-center">${limpiarTexto(cuenta.por_pagar_texto)}</td>
                <td class="px-4 py-2">${limpiarTexto(cuenta.activa_texto)}</td>
                <td class="px-4 py-2 mostrar-btn-cell"></td>
                <td class="px-4 py-2">
                    <button class="text-white bg-red-700 hover:bg-blue-800 font-medium rounded-lg text-sm px-3 py-1">
                        Desactivar
                    </button>
                </td>
            `;

            tr.querySelector('.mostrar-btn-cell').appendChild(btnMostrar);
            
            tablaCuentas.appendChild(tr);
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
            obtenerCuentas();      
        });
        return boton;
    }

    function crearSpanPaginacion(texto) {
        const span = document.createElement('span');
        span.textContent = texto;
        span.className = 'px-3 py-1 mx-1 text-white select-none';
        return span;
    }

    // Buscar divisa
    divisaInput.addEventListener("input", async (e) => {
        const query = e.target.value.trim();
        if (query.length < 1) {
            divisaSugerencias.classList.add("hidden");
            divisaSeleccionada = null;
            obtenerCuentas();
            return;
        }
    
        const res = await fetch(
        `https://cambiosorion.cl/data/cuentas.php?buscar_divisa=${encodeURIComponent(query)}`
        );
    
        // Verificar si la respuesta es exitosa
        if (!res.ok) {
            console.error('Error al buscar divisa', res.statusText);
            return;
        }

        const text = await res.text();
    
        try {
            // Si el texto está vacío, no intentar parsear
            if (text.trim() === "") {
                console.warn("Respuesta de divisas vacía.");
                divisaSugerencias.classList.add("hidden");
                return;
            }

            const divisas = JSON.parse(text);
            divisaSugerencias.innerHTML = "";
            
            divisas.forEach((divisa) => {
                const li = document.createElement("li");
                li.textContent = divisa.nombre;
                li.classList.add("px-2", "py-1", "hover:bg-gray-200", "cursor-pointer");
                li.addEventListener("click", () => {
                    divisaInput.value = divisa.nombre;
                    divisaSeleccionada = divisa;
                    console.log(`ID de divisas_interna seleccionado: ${divisa.id}`);
                    console.log(`Valor asignado a divisa_id: ${divisa.id}`);
                    divisaSugerencias.classList.add("hidden");
                    
                    obtenerCuentas(); 
                });      
                divisaSugerencias.appendChild(li);
            });
            divisaSugerencias.classList.remove("hidden");
        } catch (error) {
            console.error("Error al procesar la respuesta de las divisas (no es JSON):", error);
            console.error("Respuesta del servidor:", text);
        }
    });
  
    // Cerrar dropdown al clickear fuera
    document.addEventListener("click", (e) => {
        if (!divisaInput.contains(e.target) && !divisaSugerencias.contains(e.target)) {
            divisaSugerencias.classList.add("hidden");
        }
    });

    // Buscar cuando el valor de búsqueda cambie
    [
        buscarInput, mostrarRegistros, idInput, nombreInput, 
        divisaInput, porCobrarSelect, porPagarSelect, activaSelect
    ].forEach(el => {
        const eventType = (el.tagName === 'SELECT' || el.id === 'divisa') ? 'change' : 'input';
        el.addEventListener(eventType, () => {
            paginaActual = 1; // Resetear
            obtenerCuentas();
        });
    });

    // Borrar filtros
    borrarFiltrosBtn.addEventListener('click', () => {
        // ... (todos los .value = '') ...
        divisaSeleccionada = null;
        // ... (resto de .value = '') ...
        buscarInput.value = '';

        paginaActual = 1; // Resetear
        
        obtenerCuentas();
    });

    // Cargar cuentas inicialmente
    obtenerCuentas();
});
