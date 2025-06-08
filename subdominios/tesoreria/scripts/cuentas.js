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
    const nuevaCuentaBtn = document.getElementById('nueva-cuenta');
    const divisaSugerencias = document.getElementById('divisa-sugerencias');

    // Redirigir al hacer clic en "Nueva Cuenta"
    if (nuevaCuentaBtn) {
        nuevaCuentaBtn.addEventListener('click', () => {
            window.location.href = 'https://tesoreria.cambiosorion.cl/nueva-cuenta';
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
        params.set('divisa', divisaInput.value);
        params.set('por_cobrar', porCobrarSelect.value);
        params.set('por_pagar', porPagarSelect.value);
        params.set('activa', activaSelect.value);
        params.set('mostrar_registros', mostrarRegistros.value);
        params.set('buscar', buscarInput.value);

        fetch(`https://cambiosorion.cl/data/cuentas.php?${params.toString()}`)
            .then(response => response.json())
            .then(cuentas => {
                mostrarResultados(cuentas);
            })
            .catch(error => console.error('Error al obtener las cuentas:', error));
    }

    // Función para mostrar los resultados en la tabla
    function mostrarResultados(cuentas) {
        tablaCuentas.innerHTML = '';

        cuentas.forEach(cuenta => {
            const tr = document.createElement('tr');
            tr.classList.add('border-b', 'bg-white', 'border-gray-700', 'text-gray-700');
            tr.innerHTML = `
                <td class="px-4 py-2">${cuenta.id}</td>
                <td class="px-4 py-2">${limpiarTexto(cuenta.nombre)}</td>
                <td class="px-4 py-2">${limpiarTexto(cuenta.divisa)}</td>
                <td class="px-4 py-2 text-right">${cuenta.me_deben}</td>
                <td class="px-4 py-2 text-right">${cuenta.debo}</td>
                <td class="px-4 py-2 text-right">${limpiarTexto(cuenta.por_cobrar_texto)}</td>
                <td class="px-4 py-2 text-center">${limpiarTexto(cuenta.por_pagar_texto)}</td>
                <td class="px-4 py-2 text-center">${limpiarTexto(cuenta.activa_texto)}</td>
                <td class="px-4 py-2">
                    <button class="text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-sm px-3 py-1">
                        Mostrar
                    </button>
                </td>
                <td class="px-4 py-2">
                    <button class="text-white bg-red-700 hover:bg-blue-800 font-medium rounded-lg text-sm px-3 py-1">
                        Desactivar
                    </button>
                </td>
            `;
            tablaCuentas.appendChild(tr);
        });
    }

    // Buscar divisa
    divisaInput.addEventListener("input", async (e) => {
        const query = e.target.value.trim();
        if (query.length < 1) {
        divisaSugerencias.classList.add("hidden");
        return;
        }
    
        const res = await fetch(
        `https://cambiosorion.cl/data/nueva-cuenta.php?buscar_divisa=${encodeURIComponent(query)}`
        );
    
        // Verificar si la respuesta es exitosa
        if (!res.ok) {
        console.error('Error al buscar divisa', res.statusText);
        alert("Hubo un problema con la conexión al servidor. Intenta nuevamente.");
        return;
        }
    
        try {
        const divisas = await res.json();
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
            });      
            divisaSugerencias.appendChild(li);
        });
        divisaSugerencias.classList.remove("hidden");
        } catch (error) {
        console.error("Error al procesar la respuesta de las divisas", error);
        const text = await res.text();
        console.error("Respuesta del servidor:", text);
        alert("Error al procesar la respuesta del servidor. Intenta nuevamente.");
        }
    });
  
    // Cerrar dropdown al clickear fuera
    document.addEventListener("click", (e) => {
        if (!divisaInput.contains(e.target) && !divisaSugerencias.contains(e.target)) {
            divisaSugerencias.classList.add("hidden");
        }
    });

    // Buscar cuando el valor de búsqueda cambie
    buscarInput.addEventListener('input', obtenerCuentas);
    mostrarRegistros.addEventListener('change', obtenerCuentas);
    idInput.addEventListener('input', obtenerCuentas);
    nombreInput.addEventListener('input', obtenerCuentas);
    divisaInput.addEventListener('change', obtenerCuentas);
    porCobrarSelect.addEventListener('change', obtenerCuentas);
    porPagarSelect.addEventListener('change', obtenerCuentas);
    activaSelect.addEventListener('change', obtenerCuentas);

    // Borrar filtros
    borrarFiltrosBtn.addEventListener('click', () => {
        idInput.value = '';
        nombreInput.value = '';
        divisaInput.value = '';
        porCobrarSelect.value = '';
        porPagarSelect.value = '';
        activaSelect.value = '';
        buscarInput.value = '';
        obtenerCuentas();
    });

    // Cargar cuentas inicialmente
    obtenerCuentas();
});
