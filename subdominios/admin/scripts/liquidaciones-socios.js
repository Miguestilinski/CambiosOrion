document.addEventListener('DOMContentLoaded', () => {
    const añoSelect = document.getElementById('año');
    const mesSelect = document.getElementById('mes');
    const tbody = document.getElementById('liquidaciones-body');

    const meses = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    // Rellenar años desde 2020 hasta el actual
    const añoActual = new Date().getFullYear();
    for (let año = añoActual; año >= 2020; año--) {
        const option = document.createElement('option');
        option.value = año;
        option.textContent = año;
        añoSelect.appendChild(option);
    }

    // Rellenar meses (solo si el año está seleccionado)
    añoSelect.addEventListener('change', () => {
        mesSelect.innerHTML = '<option value="">Seleccionar mes</option>';
        if (añoSelect.value) {
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
        if (añoSelect.value && mesSelect.value) {
            const liquidaciones = obtenerLiquidaciones(añoSelect.value, mesSelect.value);
            liquidaciones.forEach(({ miembro, documento }) => {
                const fila = document.createElement('tr');
                fila.className = "border-b bg-white border-gray-700 text-gray-700";

                fila.innerHTML = `
                    <td class="px-4 py-2">${miembro}</td>
                    <td class="px-4 py-2">${meses[mesSelect.value - 1]} ${añoSelect.value}</td>
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
    function obtenerLiquidaciones(año, mes) {
        // Aquí se puede usar una API real
        return [
            { socio: "Martín Rodríguez", documento: `/docs/${año}/${mes}/martin.pdf` },
            { socio: "Camila Torres", documento: `/docs/${año}/${mes}/camila.pdf` },
            { socio: "Diego Fuentes", documento: `/docs/${año}/${mes}/diego.pdf` }
        ];
    }
});
