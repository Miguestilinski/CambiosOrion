document.addEventListener('DOMContentLoaded', () => {
    const nuevaTransaccionBtn = document.getElementById('nueva-tr');
    const tablaTransacciones = document.getElementById('tabla-transacciones');
    const borrarFiltrosBtn = document.getElementById('borrar-filtros');

    const filtros = {
        fechaInicio: document.getElementById("fecha-inicio"),
        fechaFin: document.getElementById("fecha-fin"),
        emitidas: document.getElementById("emitidas"),
        noEmitidas: document.getElementById("no-emitidas"),
        numero: document.getElementById("numero"),
        cliente: document.getElementById("cliente"),
        tipoDoc: document.getElementById("tipo-doc"),
        nDoc: document.getElementById("n-doc"),
        nNota: document.getElementById("n-nota"),
        tipoTransaccion: document.getElementById("tipo-transaccion"),
        divisa: document.getElementById("divisa"),
        estado: document.getElementById("estado"),
        mostrar: document.getElementById("mostrar-registros"),
        buscar: document.getElementById("buscar")
    };

    // Redirigir al hacer clic en "Nueva Transacción"
    if (nuevaTransaccionBtn) {
        nuevaTransaccionBtn.addEventListener('click', () => {
            window.location.href = 'https://caja.cambiosorion.cl/nueva-tr';
        });
    }

    function obtenerTransacciones() {
        const params = new URLSearchParams();

        for (const [clave, input] of Object.entries(filtros)) {
            if (input.type === "checkbox") {
                if (input.checked) params.set(clave, '1');
            } else {
                params.set(clave, input.value.trim());
            }
        }

        console.log('Parámetros enviados:', params.toString());

        fetch(`https://cambiosorion.cl/data/transacciones.php?${params.toString()}`)
            .then(response => response.json())
            .then(data => {
                console.log('Datos recibidos:', data);
                mostrarResultados(data);
            })
            .catch(error => console.error('Error al obtener transacciones:', error));
    }

    function formatearNumero(numero) {
        if (numero === null || numero === undefined || numero === '') return '';
        const opciones = { minimumFractionDigits: 0, maximumFractionDigits: 3 };
        return Number(numero)
            .toLocaleString('es-CL', opciones)
            .replace(/\u00A0/g, '');
    }

    function mostrarResultados(transacciones) {
        tablaTransacciones.innerHTML = '';

        if (transacciones.length === 0) {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td colspan="14" class="text-center text-white py-4 bg-gray-800">No se encontraron transacciones</td>`;
            tablaTransacciones.appendChild(tr);
            return;
        }

        transacciones.forEach(trx => {
            const tr = document.createElement('tr');
            tr.className = 'border-b bg-white border-gray-700 text-gray-700';

            // Color según tipo
            if (trx.tipo_transaccion === 'Ingreso') {
                tr.style.backgroundColor = '#c3e8f1'; // celeste
            } else if (trx.tipo_transaccion === 'Egreso') {
                tr.style.backgroundColor = '#dbf599'; // verde claro
            }

            const btnMostrar = document.createElement('button');
            btnMostrar.textContent = 'Mostrar';
            btnMostrar.className = 'text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-sm px-3 py-1';
            btnMostrar.addEventListener('click', () => {
                window.location.href = `detalle-tr?id=${trx.id}`;
            });

            tr.innerHTML = `
                <td class="px-4 py-2">${trx.fecha}</td>
                <td class="px-4 py-2">${trx.numero}</td>
                <td class="px-4 py-2">${trx.cliente}</td>
                <td class="px-4 py-2">${trx.tipo_doc}</td>
                <td class="px-4 py-2">${trx.n_doc}</td>
                <td class="px-4 py-2">${trx.n_nota}</td>
                <td class="px-4 py-2">${trx.tipo_transaccion}</td>
                <td class="px-4 py-2">${trx.divisa}</td>
                <td class="px-4 py-2">${formatearNumero(trx.monto)}</td>
                <td class="px-4 py-2">${formatearNumero(trx.tasa_cambio)}</td>
                <td class="px-4 py-2">${formatearNumero(trx.total)}</td>
                <td class="px-4 py-2">${trx.estado}</td>
                <td class="px-4 py-2 mostrar-btn-cell"></td>
            `;

            tr.querySelector('.mostrar-btn-cell').appendChild(btnMostrar);
            tablaTransacciones.appendChild(tr);
        });
    }

    // Borrar filtros
    if (borrarFiltrosBtn) {
        borrarFiltrosBtn.addEventListener('click', () => {
            Object.values(filtros).forEach(input => {
                if (input.type === 'checkbox') {
                    input.checked = false;
                } else {
                    input.value = '';
                }
            });
            filtros.mostrar.value = '25';
            obtenerTransacciones();
        });
    }

    // Listeners para filtros
    Object.values(filtros).forEach(input => {
        input.addEventListener('input', obtenerTransacciones);
        input.addEventListener('change', obtenerTransacciones);
    });

    // Cargar datos al iniciar
    obtenerTransacciones();
});