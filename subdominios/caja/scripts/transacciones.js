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

    if (nuevaTransaccionBtn) {
        nuevaTransaccionBtn.addEventListener('click', () => {
            window.location.href = 'https://caja.cambiosorion.cl/nueva-tr';
        });
    }

    function obtenerTransacciones() {
        const params = new URLSearchParams();

        for (const [clave, input] of Object.entries(filtros)) {
            if (input && input.type === "checkbox") {
                if (input.checked) params.set(clave, '1');
            } else if (input) {
                params.set(clave, input.value.trim());
            }
        }

        fetch(`https://cambiosorion.cl/data/transacciones.php?${params.toString()}`)
            .then(response => response.json())
            .then(data => {
                mostrarResultados(data);
            })
            .catch(error => console.error('Error al obtener transacciones:', error));
    }

    function limpiarTexto(valor) {
        return valor === null || valor === undefined ? '' : valor;
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

        if (!transacciones || transacciones.length === 0) {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td colspan="13" class="text-center py-10 text-gray-500 bg-white italic">No se encontraron transacciones con los filtros actuales.</td>`;
            tablaTransacciones.appendChild(tr);
            return;
        }

        transacciones.forEach(trx => {
            const tr = document.createElement('tr');
            tr.className = 'hover:brightness-95 transition-all text-gray-800 font-medium border-b border-gray-100 last:border-0';

            // Colores de fondo solicitados (MANTENIDOS)
            if (trx.tipo_transaccion === 'Compra') {
                tr.style.backgroundColor = '#c3e8f1'; // celeste pastel
            } else if (trx.tipo_transaccion === 'Venta') {
                tr.style.backgroundColor = '#dbf599'; // verde pastel
            } else {
                tr.style.backgroundColor = '#ffffff';
            }

            // Botón VER DETALLE (Restaurado)
            const btnMostrar = document.createElement('button');
            btnMostrar.innerHTML = `
                <svg class="w-5 h-5 text-gray-500 hover:text-cyan-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                </svg>
            `;
            btnMostrar.className = 'p-2 rounded-full hover:bg-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-500';
            btnMostrar.title = "Ver detalle";
            btnMostrar.addEventListener('click', (e) => {
                e.stopPropagation();
                window.location.href = `detalle-tr?id=${trx.id}`;
            });

            // Badge de estado
            let estadoClass = "bg-gray-100 text-gray-600 border-gray-200";
            if(String(trx.estado).toLowerCase() === 'vigente') estadoClass = "bg-green-100 text-green-700 border-green-200";
            if(String(trx.estado).toLowerCase() === 'anulado') estadoClass = "bg-red-100 text-red-700 border-red-200";

            const estadoHtml = `<span class="px-2.5 py-0.5 rounded-full text-xs font-bold border ${estadoClass}">${limpiarTexto(trx.estado)}</span>`;

            tr.innerHTML = `
                <td class="px-4 py-3 whitespace-nowrap text-xs">${limpiarTexto(trx.fecha)}</td>
                <td class="px-4 py-3 font-mono text-xs font-bold text-gray-600">${limpiarTexto(trx.id)}</td>
                <td class="px-4 py-3 font-semibold truncate max-w-[140px]" title="${limpiarTexto(trx.cliente)}">${limpiarTexto(trx.cliente)}</td>
                <td class="px-4 py-3 text-xs uppercase font-bold text-gray-500 tracking-wide">${limpiarTexto(trx.tipo_doc)}</td>
                <td class="px-4 py-3 font-mono text-sm">${limpiarTexto(trx.n_doc)}</td>
                <td class="px-4 py-3 text-xs text-gray-500 max-w-[100px] truncate" title="${limpiarTexto(trx.n_nota)}">${limpiarTexto(trx.n_nota)}</td>
                <td class="px-4 py-3 text-center font-bold uppercase text-xs tracking-wider">${limpiarTexto(trx.tipo_transaccion)}</td>
                <td class="px-4 py-3 text-center font-black text-slate-700">${limpiarTexto(trx.divisa)}</td>
                <td class="px-4 py-3 text-right font-mono text-sm">${formatearNumero(trx.monto)}</td>
                <td class="px-4 py-3 text-right font-mono text-xs text-gray-600">${formatearNumero(trx.tasa_cambio)}</td>
                <td class="px-4 py-3 text-right font-bold font-mono text-slate-800">${formatearNumero(trx.total)}</td>
                <td class="px-4 py-3 text-center">${estadoHtml}</td>
                <td class="px-4 py-3 text-center mostrar-btn-cell"></td>
            `;

            tr.querySelector('.mostrar-btn-cell').appendChild(btnMostrar);
            tablaTransacciones.appendChild(tr);
        });
    }

    if (borrarFiltrosBtn) {
        borrarFiltrosBtn.addEventListener('click', () => {
            Object.values(filtros).forEach(input => {
                if (input && input.type === 'checkbox') {
                    input.checked = false;
                } else if (input) {
                    input.value = '';
                }
            });
            if(filtros.mostrar) filtros.mostrar.value = '25';
            obtenerTransacciones();
        });
    }

    Object.values(filtros).forEach(input => {
        if(input) {
            input.addEventListener('input', obtenerTransacciones);
            input.addEventListener('change', obtenerTransacciones);
        }
    });

    obtenerTransacciones();
});