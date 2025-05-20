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
        params.set('tipo', tipoInput.value);
        params.set('fraccionable', fraccionableInput.value);
        params.set('mostrar', mostrarRegistros.value);
        params.set('buscar', buscarInput.value);

        fetch(`https://cambiosorion.cl/data/divisas-int.php?${params.toString()}`)
            .then(response => response.json())
            .then(divisas => {
                mostrarResultados(divisas);
            })
            .catch(error => console.error('Error al obtener las divisas:', error));
    }

    function mostrarResultados(divisas) {
        tablaDivisas.innerHTML = '';

        divisas.forEach(divisa => {
            const tr = document.createElement('tr');
            tr.classList.add('border-b', 'bg-white', 'border-gray-700', 'text-gray-700');

            // Crear botón Mostrar
            const btnMostrar = document.createElement('button');
            btnMostrar.textContent = 'Mostrar';
            btnMostrar.className = 'text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-sm px-3 py-1';
            btnMostrar.addEventListener('click', () => {
                window.location.href = `detalle-div?id=${divisa.id}`; // Ajusta URL según corresponda
            });

            tr.innerHTML = `
                <td class="px-4 py-2">
                    <img src="${divisa.icono}" alt="Icono" class="w-6 h-6 rounded-full border border-gray-400" />
                </td>
                <td class="px-4 py-2">${divisa.nombre}</td>
                <td class="px-4 py-2">${divisa.pais}</td>
                <td class="px-4 py-2">${divisa.codigo}</td>
                <td class="px-4 py-2">${divisa.simbolo}</td>
                <td class="px-4 py-2">${divisa.tipo_divisa ?? '-'}</td>
                <td class="px-4 py-2">${divisa.fraccionable}</td>
                <td class="px-4 py-2 mostrar-btn-cell"></td>
            `;

            tr.querySelector('.mostrar-btn-cell').appendChild(btnMostrar);

            tablaDivisas.appendChild(tr);
        });
    }

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

    obtenerDivisas();
});
