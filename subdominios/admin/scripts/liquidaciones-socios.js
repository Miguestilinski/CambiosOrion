document.addEventListener('DOMContentLoaded', () => {
    const anioSelect = document.getElementById('anio');
    const mesSelect = document.getElementById('mes');
    const tbody = document.getElementById('liquidaciones-body');

    const meses = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    // Rellenar años desde 2020 hasta el actual
    const anioActual = new Date().getFullYear();
    for (let año = anioActual; año >= 2020; año--) {
        const option = document.createElement('option');
        option.value = año;
        option.textContent = año;
        anioSelect.appendChild(option);
    }

    // Rellenar meses (solo si el año está seleccionado)
    anioSelect.addEventListener('change', () => {
        mesSelect.innerHTML = '<option value="">Seleccionar mes</option>';
        if (anioSelect.value) {
            mesSelect.disabled = false;
            meses.forEach((mes, index) => {
                const option = document.createElement('option');
                option.value = index + 1;
                option.textContent = mes;
                mesSelect.appendChild(option);
            });
        } else {
            mesSelect.disabled = true;
        }
        tbody.innerHTML = '';
    });

    // Mostrar liquidaciones al seleccionar mes
    mesSelect.addEventListener('change', () => {
        tbody.innerHTML = '';
        if (anioSelect.value && mesSelect.value) {
            const liquidaciones = obtenerLiquidaciones(anioSelect.value, mesSelect.value);
            liquidaciones.forEach(({ socio, documento }) => {
                const fila = document.createElement('tr');
                fila.className = "border-b bg-white border-gray-700 text-gray-700";

                fila.innerHTML = `
                    <td class="px-4 py-2">${socio}</td>
                    <td class="px-4 py-2">${meses[mesSelect.value - 1]} ${anioSelect.value}</td>
                    <td class="px-4 py-2">
                        <button class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-3 py-1">
                            Mostrar
                        </button>
                    </td>
                `;

                fila.querySelector('button').addEventListener('click', () => {
                    window.open(documento, '_blank');
                });

                tbody.appendChild(fila);
            });
        }
    });

    // Simulación de datos (esto se puede reemplazar con fetch de backend)
    function obtenerLiquidaciones(anio, mes) {
        // Aquí se puede usar una API real
        return [
            { socio: "Martín Rodríguez", documento: `/docs/${anio}/${mes}/martin.pdf` },
            { socio: "Camila Torres", documento: `/docs/${anio}/${mes}/camila.pdf` },
            { socio: "Diego Fuentes", documento: `/docs/${anio}/${mes}/diego.pdf` }
        ];
    }
});
