document.addEventListener('DOMContentLoaded', () => {
    const mostrarRegistros = document.getElementById('mostrar-registros');
    const buscarInput = document.getElementById('buscar');
    const idInput = document.getElementById('id');
    const nombreInput = document.getElementById('nombre');
    const divisaSelect = document.getElementById('divisa');
    const porCobrarSelect = document.getElementById('por-cobrar');
    const porPagarSelect = document.getElementById('por-pagar');
    const activaSelect = document.getElementById('activa');
    const borrarFiltrosBtn = document.getElementById('borrar-filtros');
    const tablaCuentas = document.querySelector('table tbody');
    const nuevaCuentaBtn = document.getElementById('nueva-cuenta');

    // Redirigir al hacer clic en "Nueva Cuenta"
    if (nuevaCuentaBtn) {
        nuevaCuentaBtn.addEventListener('click', () => {
            window.location.href = 'https://tesoreria.cambiosorion.cl/nueva-cuenta';
        });
    }

    // Función para obtener las cuentas con los filtros aplicados
    function obtenerCuentas() {
        const params = new URLSearchParams();
        params.set('id', idInput.value);
        params.set('nombre_cliente', nombreInput.value);
        params.set('divisa', divisaSelect.value);
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
                <td class="px-4 py-2">${cuenta.nombre_cliente}</td>
                <td class="px-4 py-2">${cuenta.divisa}</td>
                <td class="px-4 py-2">${cuenta.me_deben}</td>
                <td class="px-4 py-2">${cuenta.debo}</td>
                <td class="px-4 py-2">${cuenta.por_cobrar}</td>
                <td class="px-4 py-2">${cuenta.por_pagar}</td>
                <td class="px-4 py-2">${cuenta.activa_texto}</td>
                <td class="px-4 py-2">
                    <button class="text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-sm px-3 py-1">
                        Mostrar
                    </button>
                </td>
                <td class="px-4 py-2">
                    <button class="text-white bg-black hover:bg-blue-800 font-medium rounded-lg text-sm px-3 py-1">
                        Editar
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

    // Buscar cuando el valor de búsqueda cambie
    buscarInput.addEventListener('input', obtenerCuentas);
    mostrarRegistros.addEventListener('change', obtenerCuentas);
    idInput.addEventListener('input', obtenerCuentas);
    nombreInput.addEventListener('input', obtenerCuentas);
    divisaSelect.addEventListener('change', obtenerCuentas);
    porCobrarSelect.addEventListener('change', obtenerCuentas);
    porPagarSelect.addEventListener('change', obtenerCuentas);
    activaSelect.addEventListener('change', obtenerCuentas);

    // Borrar filtros
    borrarFiltrosBtn.addEventListener('click', () => {
        idInput.value = '';
        nombreInput.value = '';
        divisaSelect.value = '';
        porCobrarSelect.value = '';
        porPagarSelect.value = '';
        activaSelect.value = '';
        buscarInput.value = '';
        obtenerCuentas();
    });

    // Cargar cuentas inicialmente
    obtenerCuentas();
});
