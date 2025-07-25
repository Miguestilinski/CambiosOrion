document.addEventListener('DOMContentLoaded', () => {
    const mostrarRegistros = document.getElementById('mostrar-registros');
    const buscarInput = document.getElementById('buscar');
    const nombreInput = document.getElementById('nombre');
    const rutInput = document.getElementById('rut');
    const fechaIngresoInput = document.getElementById('fecha_ingreso');
    const rolInput = document.getElementById('rol');
    const contratoInput = document.getElementById('contrato');
    const sueldoInput = document.getElementById('sueldo');
    const habilitadosInput = document.getElementById('habilitados');
    const tablaEquipo = document.querySelector('table tbody');
    const nuevoIntegranteBtn = document.getElementById('nuevo-int');

    if (nuevoIntegranteBtn) {
        nuevoIntegranteBtn.addEventListener('click', () => {
            window.location.href = 'https://admin.cambiosorion.cl/nuevo-int';
        });
    }

    function obtenerEquipo() {
        const params = new URLSearchParams();
        params.set('nombre', nombreInput.value);
        params.set('rut', rutInput.value);
        params.set('fecha_ingreso', fechaIngresoInput.value);
        params.set('rol', rolInput.value);
        params.set('contrato', contratoInput.value);
        params.set('sueldo', sueldoInput.value);
        params.set('habilitados', habilitadosInput.value);
        params.set('buscar', buscarInput.value);
        params.set('mostrar', mostrarRegistros.value);

        fetch(`https://cambiosorion.cl/data/equipo.php?${params.toString()}`)
            .then(response => response.json())
            .then(data => {
                mostrarResultados(data);
            })
            .catch(error => console.error('Error:', error));
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Los meses empiezan desde 0
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    }
    
    function formatSueldo(sueldo) {
        return '$' + Number(sueldo).toLocaleString('es-CL');
    }    

    function mostrarResultados(lista) {
        tablaEquipo.innerHTML = '';
        lista.forEach(item => {
            const tr = document.createElement('tr');
            tr.classList.add('border-b', 'bg-white', 'border-gray-700', 'text-gray-700');
            tr.innerHTML = `
                <td class="px-4 py-2">${item.nombre}</td>
                <td class="px-4 py-2">${item.rut}</td>
                <td class="px-4 py-2">${formatDate(item.fecha_ingreso)}</td>
                <td class="px-4 py-2">${item.rol}</td>
                <td class="px-4 py-2">${item.tipo_contrato}</td>
                <td class="px-4 py-2">${formatSueldo(item.sueldo_liquido)}</td>
                <td class="px-4 py-2">
                    <button class="text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-sm px-3 py-1">
                        Mostrar
                    </button>
                </td>
            `;
            tablaEquipo.appendChild(tr);
        });
    }

    // Listeners para actualizar en tiempo real
    [
        mostrarRegistros,
        buscarInput,
        nombreInput,
        rutInput,
        fechaIngresoInput,
        rolInput,
        contratoInput,
        sueldoInput,
        habilitadosInput
    ].forEach(element => {
        element.addEventListener('input', obtenerEquipo);
    });

    // Llamada inicial
    obtenerEquipo();
});
