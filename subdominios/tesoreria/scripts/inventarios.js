document.addEventListener("DOMContentLoaded", () => {
    // --- 1. Obtener todos los elementos ---
    const mostrarRegistros = document.getElementById("mostrar-registros");
    const buscarInput = document.getElementById("buscar");
    const cajaInput = document.getElementById("caja");
    const tablaInventarios = document.querySelector("table tbody");
    const exportarBtn = document.getElementById("exportar");
    
    // Filtros
    const divisaInput = document.getElementById("divisa-input");
    const divisaList = document.getElementById("divisa-list");
    const divisaHidden = document.getElementById("divisa");
    const cantidadInput = document.getElementById("cantidad");
    const pmpInput = document.getElementById("pmp");
    const borrarFiltrosBtn = document.getElementById("borrar-filtros");

    // Paginación (de clientes.js)
    const conteoResultados = document.getElementById('conteo-resultados');
    const paginacionContainer = document.getElementById('paginacion-container');
    let paginaActual = 1;

    let divisas = [];

    if (exportarBtn) {
        exportarBtn.addEventListener("click", () => {
            // Actualizar para que el export también use los filtros
            const params = new URLSearchParams();
            if (cajaInput.value !== "") params.set("caja", cajaInput.value);
            if (divisaHidden.value) params.set("divisa", divisaHidden.value);
            if (buscarInput.value) params.set("buscar", buscarInput.value);
            if (cantidadInput.value) params.set("cantidad", cantidadInput.value);
            if (pmpInput.value) params.set("pmp", pmpInput.value);

            window.location.href = `https://cambiosorion.cl/data/exportar_inventarios_excel.php?${params.toString()}`;
        });
    }

    const verHistorialBtn = document.getElementById("ver-historial");
    if (verHistorialBtn) {
        verHistorialBtn.addEventListener("click", () => {
            // Asumimos que la nueva página se llamará 'historial-inventarios'
            window.location.href = 'https://tesoreria.cambiosorion.cl/historial-inventarios';
        });
    }

    // Función para cargar divisas desde API
    function cargarDivisas() {
        fetch(`https://cambiosorion.cl/data/inventarios.php?action=divisas&caja=${cajaInput.value}`)
            .then(res => res.text())
            .then(text => {
                try {
                    const data = JSON.parse(text);
                    if (Array.isArray(data)) {
                        divisas = data;
                        mostrarOpciones("");
                    } else {
                        console.warn("Respuesta no válida:", data);
                    }
                } catch (e) {
                    console.error("Respuesta no es JSON válido:", text);
                }
            })
            .catch(error => console.error("Error al cargar divisas:", error));
    }

    // Mostrar opciones filtradas en el dropdown
    function mostrarOpciones(filtro) {
        const filtroMinusculas = filtro.toLowerCase().trim();

        // Si no hay texto, ocultar y salir
        if (filtroMinusculas.length === 0) {
            divisaList.classList.add("hidden");
            divisaList.innerHTML = "";
            return;
        }

        const filtradas = divisas
            .filter(d => d.nombre && d.nombre.toLowerCase().includes(filtroMinusculas));

        divisaList.innerHTML = "";

        if (filtradas.length === 0) {
            divisaList.classList.add("hidden");
            return;
        }

        // Mostrar máximo 4 opciones
        filtradas.slice(0, 4).forEach(d => {
            const li = document.createElement("li");
            li.textContent = d.nombre;
            li.dataset.id = d.id;
            li.className = "px-2 py-1 hover:bg-blue-600 hover:text-white cursor-pointer";

            li.addEventListener("click", () => {
                divisaInput.value = d.nombre;
                divisaHidden.value = d.id;
                divisaList.classList.add("hidden");
                paginaActual = 1;
                obtenerInventarios()
            });

            divisaList.appendChild(li);
        });

        divisaList.classList.remove("hidden");
    }

    // Eventos input para filtrar opciones
    divisaInput.addEventListener("input", () => {
        mostrarOpciones(divisaInput.value);
        if (divisaInput.value.trim() === '') {
             divisaHidden.value = "";
             paginaActual = 1;
             obtenerInventarios();
        }
    });

    // Cerrar dropdown si clic afuera
    document.addEventListener("click", (e) => {
        if (!divisaInput.contains(e.target) && !divisaList.contains(e.target)) {
            divisaList.classList.add("hidden");
        }
    });

    function cargarCajas() {
        fetch("https://cambiosorion.cl/data/inventarios.php?action=cajas")
            .then(res => res.json())
            .then(cajas => {
                const cajaSelect = document.getElementById("caja");
                cajaSelect.innerHTML = "";

                cajas.forEach(caja => {
                    const option = document.createElement("option");
                    option.value = caja.id;
                    option.textContent = caja.nombre;
                    cajaSelect.appendChild(option);
                });

                const tesoreria = cajas.find(c => c.nombre.toLowerCase() === "tesoreria");
                if (tesoreria) {
                    cajaSelect.value = tesoreria.id;
                }

                // Cargar divisas e inventarios para la caja seleccionada (Tesorería o la que sea)
                cargarDivisas();
                obtenerInventarios();
            })
            .catch(error => console.error("Error al cargar cajas:", error));
    }

    function obtenerInventarios() {
        const params = new URLSearchParams();
        if (cajaInput.value !== "") params.set("caja", cajaInput.value);
        if (divisaHidden.value) params.set("divisa", divisaHidden.value);
        if (cantidadInput.value) params.set("cantidad", cantidadInput.value);
        if (pmpInput.value) params.set("pmp", pmpInput.value);
        if (buscarInput.value) params.set("buscar", buscarInput.value);
        if (mostrarRegistros.value) params.set("limite", mostrarRegistros.value);
        params.set("pagina", paginaActual); // Enviar página

        fetch(`https://cambiosorion.cl/data/inventarios.php?${params.toString()}`)
            .then(res => res.text())
            .then(text => {
                console.log("Respuesta cruda inventarios:", text);
                try {
                    const data = JSON.parse(text); // Esperar { inventarios: [], totalFiltrado: N }

                    if (data.inventarios) {
                        renderizarTabla(data.inventarios);
                        // Renderizar conteo y paginación
                        const porPagina = parseInt(mostrarRegistros.value, 10);
                        renderizarConteo(data.inventarios.length, data.totalFiltrado, porPagina, paginaActual);
                        renderizarPaginacion(data.totalFiltrado, porPagina, paginaActual);
                    } else {
                         throw new Error(data.error || "Formato de datos incorrecto");
                    }
                } catch(e) {
                    console.error("Error parseando JSON inventarios:", e, text);
                    tablaInventarios.innerHTML = '<tr><td colspan="6" class="text-center text-red-500 py-4">Error al procesar datos.</td></tr>';
                    conteoResultados.textContent = 'Error.';
                    paginacionContainer.innerHTML = '';
                }
            })
            .catch(error => console.error("Error al cargar inventarios:", error));
    }

    function renderizarTabla(inventarios) {
        tablaInventarios.innerHTML = "";
        
        if (!inventarios || inventarios.length === 0) {
            tablaInventarios.innerHTML = '<tr><td colspan="6" class="text-center text-gray-700 py-4 bg-white">No se encontraron registros.</td></tr>';
            return;
        }

        inventarios.forEach(inv => {
            const tr = document.createElement("tr");
            tr.classList.add("border-b", "bg-white", "border-gray-700", "text-gray-700");

            const btnMostrar = document.createElement("button");
            btnMostrar.textContent = "Mostrar";
            btnMostrar.className = "text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-sm px-3 py-1";
            btnMostrar.addEventListener("click", () => {
                // Asumiendo que el detalle usa el ID de inventario
                window.location.href = `detalle-inv?id=${inv.id}`;
            });

            tr.innerHTML = `
                <td class="px-4 py-2">${inv.nombre_caja}</td>
                <td class="px-4 py-2">
                    ${inv.icono ? `<img src="${inv.icono}" alt="Icono" class="w-6 h-6 rounded-full border border-gray-400" />` : ''}
                </td>
                <td class="px-4 py-2">${inv.divisa}</td>
                <td class="px-4 py-2">${Number(inv.cantidad).toLocaleString("es-CL")}</td>
                <td class="px-4 py-2">${inv.pmp ? Number(inv.pmp).toLocaleString("es-CL") : 'N/A'}</td>
                <td class="px-4 py-2 mostrar-btn-cell"></td>
            `;

            tr.querySelector('.mostrar-btn-cell').appendChild(btnMostrar);
            tablaInventarios.appendChild(tr);
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
            obtenerInventarios();
        });
        return boton;
    }

    function crearSpanPaginacion(texto) {
        const span = document.createElement('span');
        span.textContent = texto;
        span.className = 'px-3 py-1 mx-1 text-white select-none';
        return span;
    }

    // Cuando cambie la caja, recargar inventarios (y quizás divisas)
    cajaInput.addEventListener("change", () => { // 'change' es mejor para <select>
        paginaActual = 1;
        divisaInput.value = ""; // Limpiar filtro de divisa
        divisaHidden.value = "";
        cargarDivisas();
        obtenerInventarios();
    });

    const filtrosSimples = [cantidadInput, pmpInput, buscarInput, mostrarRegistros];
    
    filtrosSimples.forEach(el => {
        const evento = (el.tagName === 'SELECT') ? 'change' : 'input';
        el.addEventListener(evento, () => {
            paginaActual = 1;
            obtenerInventarios();
        });
    });

    // Borrar filtros
    if (borrarFiltrosBtn) {
        borrarFiltrosBtn.addEventListener('click', () => {
            // No reseteamos la caja, la dejamos en la seleccionada
            divisaInput.value = '';
            divisaHidden.value = '';
            cantidadInput.value = '';
            pmpInput.value = '';
            buscarInput.value = '';
            mostrarRegistros.value = '25';
            paginaActual = 1;
            obtenerInventarios();
        });
    }
    
    cargarCajas();
});