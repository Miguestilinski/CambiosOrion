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

    // Redirigir al hacer clic en "Nueva Divisa"
    if (nuevaDivisaBtn) {
        nuevaDivisaBtn.addEventListener('click', () => {
            window.location.href = 'https://tesoreria.cambiosorion.cl/nueva-divisa';
        });
    }

    // Función para obtener las divisas con filtros
    function obtenerDivisas() {
        const params = new URLSearchParams();
        params.set('nombre', nombreInput.value);
        params.set('pais', paisInput.value);
        params.set('codigo', codigoInput.value);
        params.set('simbolo', simboloInput.value);
        params.set('tipo', tipoInput.value);
        params.set('fraccionable', fraccionableInput.value);
        params.set('mostrar_registros', mostrarRegistros.value);
        params.set('buscar', buscarInput.value);

        fetch(`https://cambiosorion.cl/data/divisas-int.php?${params.toString()}`)
            .then(response => response.json())
            .then(text => {
                console.log('Respuesta cruda:', text);
                const divisas = JSON.parse(text); // Aquí puedes ver si el JSON realmente está vacío o roto
                mostrarResultados(divisas);
            })
            .catch(error => console.error('Error al obtener las divisas:', error));
    }

    // Mostrar resultados en la tabla
    function mostrarResultados(divisas) {
        tablaDivisas.innerHTML = '';

        divisas.forEach(divisa => {
            const tr = document.createElement('tr');
            tr.classList.add('border-b', 'bg-white', 'border-gray-700', 'text-gray-700');
            tr.innerHTML = `
                <td class="px-4 py-2">${divisa.nombre}</td>
                <td class="px-4 py-2">${divisa.pais}</td>
                <td class="px-4 py-2">${divisa.codigo}</td>
                <td class="px-4 py-2">${divisa.simbolo}</td>
                <td class="px-4 py-2">${divisa.tipo}</td>
                <td class="px-4 py-2">${divisa.fraccionable === "1" ? "Si" : "No"}</td>
                <td class="px-4 py-2">
                    <button class="text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-sm px-3 py-1">
                        Mostrar
                    </button>
                </td>
            `;
            tablaDivisas.appendChild(tr);
        });
    }

    // Eventos para actualizar la tabla
    [
        nombreInput,
        paisInput,
        codigoInput,
        simboloInput,
        tipoInput,
        fraccionableInput,
        mostrarRegistros,
        buscarInput
    ].forEach(el => el.addEventListener('input', obtenerDivisas));

    // Cargar divisas al inicio
    obtenerDivisas();
});
