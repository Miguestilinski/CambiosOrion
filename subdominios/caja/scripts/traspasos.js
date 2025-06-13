document.addEventListener('DOMContentLoaded', () => {
    const nuevoTraspasoBtn = document.getElementById('nuevo-tp');
    const tabla = document.getElementById('tabla-transacciones');

    const filtros = {
        numero: document.getElementById("numero"),
        fecha: document.getElementById("fecha"),
        transaccion: document.getElementById("transaccion"),
        origen: document.getElementById("origen"),
        destino: document.getElementById("destino"),
        divisa: document.getElementById("divisa"),
        monto: document.getElementById("monto"),
        estado: document.getElementById("estado"),
        mostrar: document.getElementById("mostrar-registros"),
        buscar: document.getElementById("buscar")
    };

    if (nuevoTraspasoBtn) {
        nuevoTraspasoBtn.addEventListener('click', () => {
            window.location.href = 'https://caja.cambiosorion.cl/nuevo-tp';
        });
    }

    function obtenerTraspasos() {
        const params = new URLSearchParams();

        for (const [clave, input] of Object.entries(filtros)) {
            params.set(clave, input.value.trim());
        }

        fetch(`https://cambiosorion.cl/data/traspasos.php?${params.toString()}`)
            .then(response => response.json())
            .then(data => {
                console.log('Traspasos recibidos:', data);
                mostrarResultados(data);
            })
            .catch(error => console.error('Error al obtener traspasos:', error));
    }

    function limpiarTexto(valor) {
        return valor === null || valor === undefined ? '' : valor;
    }

    function formatearNumero(numero) {
        if (!numero) return '';
        return Number(numero).toLocaleString('es-CL');
    }

    function mostrarResultados(traspasos) {
        tabla.innerHTML = '';

        if (traspasos.length === 0) {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td colspan="9" class="text-center text-white py-4 bg-gray-800">No se encontraron traspasos</td>`;
            tabla.appendChild(tr);
            return;
        }

        traspasos.forEach(tp => {
            const tr = document.createElement('tr');
            tr.className = 'bg-white border-b border-gray-700 text-gray-700';

            const btnMostrar = document.createElement('button');
            btnMostrar.textContent = 'Mostrar';
            btnMostrar.className = 'text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-sm px-3 py-1';
            btnMostrar.addEventListener('click', () => {
                window.location.href = `detalle-tp?id=${tp.id}`;
            });

            tr.innerHTML = `
                <td class="px-4 py-2">${limpiarTexto(tp.numero)}</td>
                <td class="px-4 py-2">${limpiarTexto(tp.fecha)}</td>
                <td class="px-4 py-2">${limpiarTexto(tp.transaccion)}</td>
                <td class="px-4 py-2">${limpiarTexto(tp.origen)}</td>
                <td class="px-4 py-2">${limpiarTexto(tp.destino)}</td>
                <td class="px-4 py-2">${limpiarTexto(tp.divisa)}</td>
                <td class="px-4 py-2">${formatearNumero(tp.monto)}</td>
                <td class="px-4 py-2">${limpiarTexto(tp.estado)}</td>
                <td class="px-4 py-2 mostrar-btn-cell"></td>
            `;

            tr.querySelector('.mostrar-btn-cell').appendChild(btnMostrar);
            tabla.appendChild(tr);
        });
    }

    Object.values(filtros).forEach(input => {
        input.addEventListener('input', obtenerTraspasos);
        input.addEventListener('change', obtenerTraspasos);
    });

    obtenerTraspasos();
});