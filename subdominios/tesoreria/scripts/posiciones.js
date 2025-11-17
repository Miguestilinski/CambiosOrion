document.addEventListener("DOMContentLoaded", () => {
    const tablaPosiciones = document.querySelector("#posiciones table tbody");
    const mostrarRegistros = document.getElementById("mostrar-registros");
    const buscarInput = document.getElementById("buscar");
    
    // Filtros
    const divisaInput = document.getElementById("divisa-input");
    const divisaList = document.getElementById("divisa-list");
    const montoInput = document.getElementById("monto");
    const precioInput = document.getElementById("precio-promedio");
    const borrarFiltrosBtn = document.getElementById("borrar-filtros");

    const conteoResultados = document.getElementById("conteo-resultados");
    const paginacionContainer = document.getElementById("paginacion-container");
    let paginaActual = 1;
    
    let divisas = []; // Almacén local de divisas

    // --- 1. Cargar Divisas (CAMBIO: Ahora llama a posiciones.php) ---
    function cargarDivisas() {
        fetch("https://cambiosorion.cl/data/posiciones.php?action=divisas") 
            .then(res => res.json())
            .then(data => {
                if (data.divisas && Array.isArray(data.divisas)) {
                    divisas = data.divisas;
                }
            })
            .catch(error => console.error("Error al cargar lista de divisas:", error));
    }

    // --- 2. Lógica del Dropdown ---
    function mostrarOpciones(filtro) {
        const filtroMinusculas = filtro.toLowerCase().trim();
        divisaList.innerHTML = "";

        if (filtroMinusculas.length === 0) {
            divisaList.classList.add("hidden");
            return;
        }

        const filtradas = divisas.filter(d => d.nombre && d.nombre.toLowerCase().includes(filtroMinusculas));
        
        if (filtradas.length === 0) {
            divisaList.classList.add("hidden");
            return;
        }

        filtradas.slice(0, 4).forEach(d => {
            const li = document.createElement("li");
            li.textContent = d.nombre;
            li.className = "px-2 py-1 hover:bg-blue-600 hover:text-white cursor-pointer";

            li.addEventListener("click", () => {
                divisaInput.value = d.nombre;
                divisaList.classList.add("hidden");
                paginaActual = 1;
                obtenerPosiciones(); // Recargar con el filtro
            });
            divisaList.appendChild(li);
        });
        divisaList.classList.remove("hidden");
    }

    divisaInput.addEventListener("input", () => {
        mostrarOpciones(divisaInput.value);
        if (divisaInput.value.trim() === '') {
             paginaActual = 1;
             obtenerPosiciones();
        }
    });

    document.addEventListener("click", (e) => {
        if (!divisaInput.contains(e.target) && !divisaList.contains(e.target)) {
            divisaList.classList.add("hidden");
        }
    });

    // --- 3. Función Principal Fetch ---
    function obtenerPosiciones() {
        const params = new URLSearchParams();
        
        if (divisaInput.value.trim() !== '') {
            params.set('divisa', divisaInput.value.trim());
        }
        
        params.set('monto', montoInput.value);
        params.set('precio', precioInput.value);
        params.set('buscar', buscarInput.value);
        params.set('mostrar_registros', mostrarRegistros.value);
        params.set('pagina', paginaActual);

        fetch(`https://cambiosorion.cl/data/posiciones.php?${params.toString()}`)
            .then(res => res.text())
            .then(text => {
                console.log("Respuesta cruda posiciones:", text);
                try {
                    const data = JSON.parse(text);
                    
                    if (data.posiciones) {
                        renderizarTabla(data.posiciones);
                        const porPagina = parseInt(mostrarRegistros.value, 10);
                        renderizarConteo(data.posiciones.length, data.totalFiltrado, porPagina, paginaActual);
                        renderizarPaginacion(data.totalFiltrado, porPagina, paginaActual);
                    } else {
                         throw new Error(data.error || "Formato incorrecto");
                    }
                } catch (e) {
                    console.error("Error JSON:", e);
                    tablaPosiciones.innerHTML = '<tr><td colspan="5" class="text-center text-red-500 py-4">Error al procesar datos.</td></tr>';
                }
            })
            .catch(err => console.error("Error fetch:", err));
    }

    function renderizarTabla(posiciones) {
        tablaPosiciones.innerHTML = "";
        if (!posiciones || posiciones.length === 0) {
             tablaPosiciones.innerHTML = '<tr><td colspan="5" class="text-center text-gray-700 py-4 bg-white">No se encontraron registros.</td></tr>';
             return;
        }

        posiciones.forEach(item => {
            const tr = document.createElement("tr");
            tr.className = "border-b bg-white border-gray-700 text-gray-700";
            tr.innerHTML = `
                <td class="px-4 py-2">
                    ${item.icono ? `<img src="${item.icono}" class="w-6 h-6 rounded-full border border-gray-400" />` : ''}
                </td>
                <td class="px-4 py-2">${item.divisa}</td>
                <td class="px-4 py-2">${Number(item.cantidad).toLocaleString("es-CL")}</td>
                <td class="px-4 py-2">$ ${Number(item.pmp).toLocaleString("es-CL", { minimumFractionDigits: 0, maximumFractionDigits: 4 })}</td>
                <td class="px-4 py-2">$ ${Number(item.total).toLocaleString("es-CL")}</td>
            `;
            tablaPosiciones.appendChild(tr);
        });
    }

    // --- Funciones de Paginación ---
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
        
        for (let i = 1; i <= totalPaginas; i++) {
             if (i === 1 || i === totalPaginas || (i >= pagina - 2 && i <= pagina + 2)) {
                paginacionContainer.appendChild(crearBotonPaginacion(i, i, i === pagina));
             }
        }

        if (pagina < totalPaginas) paginacionContainer.appendChild(crearBotonPaginacion('Siguiente', pagina + 1));
    }

    function crearBotonPaginacion(texto, pagina, esActual = false) {
        const boton = document.createElement('button');
        boton.textContent = texto;
        boton.className = `px-3 py-1 mx-1 rounded-lg focus:outline-none ${esActual ? 'bg-blue-700 text-white' : 'bg-white text-gray-700 hover:bg-gray-200'}`;
        boton.addEventListener('click', (e) => {
            e.preventDefault();
            paginaActual = pagina;
            obtenerPosiciones();
        });
        return boton;
    }

    // Listeners
    const filtros = [montoInput, precioInput, buscarInput, mostrarRegistros];
    filtros.forEach(el => {
        el.addEventListener('input', () => {
            paginaActual = 1;
            obtenerPosiciones();
        });
    });

    if (borrarFiltrosBtn) {
        borrarFiltrosBtn.addEventListener('click', () => {
            montoInput.value = '';
            precioInput.value = '';
            buscarInput.value = '';
            divisaInput.value = '';
            paginaActual = 1;
            obtenerPosiciones();
        });
    }

    cargarDivisas(); // Ahora llama a posiciones.php
    obtenerPosiciones();
});