document.addEventListener("DOMContentLoaded", () => {
    const tablaPosiciones = document.querySelector("#posiciones table tbody");
    const mostrarRegistros = document.getElementById("mostrar-registros");
    const buscarInput = document.getElementById("buscar");
    
    // Filtros
    const divisaSelect = document.getElementById("divisa"); // Si es un select
    // Si tu HTML tiene un input text para divisa, cambia esto a: const divisaInput = document.getElementById("divisa");
    const montoInput = document.getElementById("monto");
    const precioInput = document.getElementById("precio-promedio");
    const borrarFiltrosBtn = document.getElementById("borrar-filtros");

    const conteoResultados = document.getElementById("conteo-resultados");
    const paginacionContainer = document.getElementById("paginacion-container");
    let paginaActual = 1;

    // 1. Cargar Divisas para el Select (Opcional, si usas select)
    function cargarDivisas() {
        // Puedes reutilizar el endpoint de inventarios o crear uno simple
        // Por ahora, dejaremos el select vacío o estático si no hay endpoint específico.
    }

    // 2. Función Principal
    function obtenerPosiciones() {
        const params = new URLSearchParams();
        // Asumiendo que el id del filtro divisa es un input text, si es select usa .value
        // params.set('divisa', divisaInput.value); 
        
        params.set('monto', montoInput.value);
        params.set('precio', precioInput.value);
        params.set('buscar', buscarInput.value);
        params.set('mostrar_registros', mostrarRegistros.value);
        params.set('pagina', paginaActual);

        fetch(`https://cambiosorion.cl/data/posiciones.php?${params.toString()}`)
            .then(res => res.text()) // Leer como texto primero
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

    // --- Funciones de Paginación (Standard) ---
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
        
        // Lógica simplificada de botones (1, 2, 3...)
        for (let i = 1; i <= totalPaginas; i++) {
             // Mostrar solo si está cerca de la página actual (opcional)
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
            // divisaSelect.value = ''; 
            paginaActual = 1;
            obtenerPosiciones();
        });
    }

    obtenerPosiciones();
});