import { 
    initSystem, 
    limpiarTexto, 
    formatearNumero, 
    formatearFechaHora, 
    mostrarModalError 
} from './index.js';

document.addEventListener('DOMContentLoaded', () => {
    initSystem('operaciones');

    const tablaOperaciones = document.getElementById('tabla-operaciones');
    const conteoResultados = document.getElementById('conteo-resultados');
    const paginationControls = document.getElementById('pagination-controls');
    
    const nuevaOpBtn = document.getElementById('nueva-op');
    const borrarFiltrosBtn = document.getElementById('borrar-filtros');

    let paginaActual = 1;

    const filtros = {
        fechaInicio: document.getElementById("fecha-inicio"),
        fechaFin: document.getElementById("fecha-fin"),
        emitidas: document.getElementById("emitidas"),
        noEmitidas: document.getElementById("no-emitidas"),
        numero: document.getElementById("numero"),
        cliente: document.getElementById("cliente"),
        tipoDoc: document.getElementById("tipo-doc"),
        nDoc: document.getElementById("n-doc"),
        tipoTransaccion: document.getElementById("tipo-transaccion"),
        divisa: document.getElementById("divisa"),
        estado: document.getElementById("estado"),
        mostrar: document.getElementById("mostrar-registros")
    };

    if (nuevaOpBtn) {
        nuevaOpBtn.addEventListener('click', () => {
            window.location.href = 'https://tesoreria.cambiosorion.cl/nueva-op';
        });
    }

    if (filtros.emitidas && filtros.noEmitidas) {
        filtros.emitidas.addEventListener('change', () => {
            if (filtros.emitidas.checked) filtros.noEmitidas.checked = false;
            resetAndFetch();
        });
        filtros.noEmitidas.addEventListener('change', () => {
            if (filtros.noEmitidas.checked) filtros.emitidas.checked = false;
            resetAndFetch();
        });
    }

    function obtenerOperaciones() {
        const params = new URLSearchParams();

        if (filtros.fechaInicio.value) params.set('fecha_inicio', filtros.fechaInicio.value);
        if (filtros.fechaFin.value) params.set('fecha_fin', filtros.fechaFin.value);
        if (filtros.emitidas.checked) params.set('emitidas', '1');
        if (filtros.noEmitidas.checked) params.set('no_emitidas', '1');
        if (filtros.numero.value) params.set('numero', filtros.numero.value.trim());
        if (filtros.cliente.value) params.set('cliente', filtros.cliente.value.trim());
        if (filtros.tipoDoc.value) params.set('tipo_doc', filtros.tipoDoc.value);
        if (filtros.nDoc.value) params.set('n_doc', filtros.nDoc.value.trim());
        if (filtros.tipoTransaccion.value) params.set('tipo_transaccion', filtros.tipoTransaccion.value);
        if (filtros.divisa.value) params.set('divisa', filtros.divisa.value.trim());
        if (filtros.estado.value) params.set('estado', filtros.estado.value);
        if (filtros.mostrar.value) params.set('mostrar_registros', filtros.mostrar.value);
        params.set('pagina', paginaActual);

        tablaOperaciones.innerHTML = `<tr><td colspan="12" class="text-center py-10"><div class="animate-spin h-8 w-8 border-4 border-amber-500 rounded-full border-t-transparent mx-auto"></div></td></tr>`;

        fetch(`https://cambiosorion.cl/data/operaciones.php?${params.toString()}`)
            .then(res => res.json())
            .then(data => {
                const lista = data.operaciones || [];
                const total = parseInt(data.totalFiltrado) || 0;
                renderizarTabla(lista);
                renderizarPaginacion(total, parseInt(filtros.mostrar.value), paginaActual);
            })
            .catch(error => {
                console.error('Error:', error);
                tablaOperaciones.innerHTML = `<tr><td colspan="12" class="text-center text-red-400 py-4">Error de conexión.</td></tr>`;
            });
    }

    function renderizarTabla(operaciones) {
        tablaOperaciones.innerHTML = '';

        if (operaciones.length === 0) {
            tablaOperaciones.innerHTML = `<tr><td colspan="12" class="text-center text-slate-500 py-10 italic">No se encontraron operaciones.</td></tr>`;
            return;
        }

        operaciones.forEach(op => {
            const tr = document.createElement('tr');
            
            // Normalizamos el tipo a minúsculas
            const tipo = (op.tipo_transaccion || '').toLowerCase();
            
            // Base común
            let rowClasses = "border-b border-slate-700 transition cursor-pointer ";

            // Lógica de asignación de clase
            if (tipo === 'venta') {
                rowClasses += "venta"; // Usa el CSS #dbf599
            } else if (tipo === 'compra') {
                rowClasses += "compra"; // Usa el CSS #c3e8f1
            } else {
                // Si NO es compra ni venta, usa el estilo oscuro por defecto
                rowClasses += "bg-slate-900 hover:bg-slate-800 text-slate-300";
            }
            
            tr.className = rowClasses;

            if (op.estado === 'Anulado') tr.classList.add('opacity-50', 'line-through');

            const divHTML = (op.divisas || '').split(', ').map(d => `<div>${d}</div>`).join('');
            const montoHTML = (op.montos_por_divisa || '').split('|').map(m => `<div>${formatearNumero(m)}</div>`).join('');
            const tasaHTML = (op.tasas_cambio || '').split('|').map(t => `<div>${formatearNumero(t)}</div>`).join('');

            const btnVer = document.createElement('button');
            btnVer.innerHTML = `<svg class="w-5 h-5 text-slate-400 hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>`;
            btnVer.className = 'flex items-center justify-center p-1.5 bg-white/5 rounded-full hover:bg-amber-600 shadow-sm border border-transparent transition-all mx-auto';
            btnVer.onclick = (e) => {
                e.stopPropagation();
                window.location.href = `detalle-op?id=${op.id}`;
            };

            tr.innerHTML = `
                <td class="px-4 py-3 whitespace-nowrap text-xs">${formatearFechaHora(op.fecha)}</td>
                <td class="px-4 py-3 font-mono text-xs font-bold text-slate-400 opacity-80">${op.id}</td>
                <td class="px-4 py-3 font-semibold text-xs text-white truncate max-w-[140px]" title="${limpiarTexto(op.nombre_cliente)}">${limpiarTexto(op.nombre_cliente)}</td>
                <td class="px-4 py-3 text-xs uppercase font-bold text-slate-500 tracking-wide">${limpiarTexto(op.tipo_documento)}</td>
                <td class="px-4 py-3 font-mono text-xs text-slate-400">${limpiarTexto(op.numero_documento)}</td>
                <td class="px-4 py-3 text-center text-xs font-extrabold uppercase tracking-wider text-slate-300">${limpiarTexto(op.tipo_transaccion)}</td>
                <td class="px-4 py-3 text-xs font-bold text-amber-400">${divHTML}</td>
                <td class="px-4 py-3 text-right font-mono text-xs text-white">${montoHTML}</td>
                <td class="px-4 py-3 text-right font-mono text-xs text-slate-500">${tasaHTML}</td>
                <td class="px-4 py-3 text-right font-bold font-mono text-sm text-emerald-400">${formatearNumero(op.total)}</td>
                <td class="px-4 py-3 text-center">
                    <span class="px-2 py-0.5 rounded text-[10px] uppercase font-bold ${getEstadoClass(op.estado)}">${op.estado}</span>
                </td>
                <td class="px-4 py-3 text-center cell-action"></td>
            `;
            
            tr.querySelector('.cell-action').appendChild(btnVer);
            tablaOperaciones.appendChild(tr);
        });
    }

    function getEstadoClass(estado) {
        const est = String(estado).toLowerCase();
        if(est === 'vigente') return 'bg-green-900/40 text-green-300 border border-green-500/30';
        if(est === 'anulado') return 'bg-red-900/40 text-red-300 border border-red-500/30';
        if(est === 'pagado') return 'bg-blue-900/40 text-blue-300 border border-blue-500/30';
        return 'bg-slate-700 text-slate-400';
    }

    function renderizarPaginacion(totalRegistros, porPagina, pagina) {
        conteoResultados.textContent = `Total: ${totalRegistros}`;
        paginationControls.innerHTML = '';

        const totalPaginas = Math.ceil(totalRegistros / porPagina);
        if (totalPaginas <= 1) return;

        const btnPrev = crearBotonPag('Anterior', pagina > 1, () => cambioPagina(pagina - 1));
        paginationControls.appendChild(btnPrev);

        const span = document.createElement('span');
        span.className = "text-xs font-bold text-slate-400 px-2";
        span.textContent = `${pagina} / ${totalPaginas}`;
        paginationControls.appendChild(span);

        const btnNext = crearBotonPag('Siguiente', pagina < totalPaginas, () => cambioPagina(pagina + 1));
        paginationControls.appendChild(btnNext);
    }

    function crearBotonPag(texto, habilitado, onClick) {
        const btn = document.createElement('button');
        btn.textContent = texto;
        btn.className = `px-3 py-1 bg-slate-800 border border-slate-600 rounded hover:bg-slate-700 text-white text-xs transition ${!habilitado ? 'opacity-50 cursor-not-allowed' : ''}`;
        btn.disabled = !habilitado;
        btn.onclick = onClick;
        return btn;
    }

    function cambioPagina(nuevaPagina) {
        paginaActual = nuevaPagina;
        obtenerOperaciones();
    }

    const resetAndFetch = () => { paginaActual = 1; obtenerOperaciones(); };

    borrarFiltrosBtn.addEventListener('click', () => {
        Object.values(filtros).forEach(input => {
            if(!input) return;
            if(input.type === 'checkbox') input.checked = false;
            else {
                input.value = '';
                if(input._flatpickr) input._flatpickr.clear();
            }
        });
        if(filtros.mostrar) filtros.mostrar.value = '25';
        resetAndFetch();
    });

    Object.values(filtros).forEach(input => {
        if(input && input !== filtros.emitidas && input !== filtros.noEmitidas) {
            input.addEventListener('input', resetAndFetch); 
            input.addEventListener('change', resetAndFetch);
        }
    });

    obtenerOperaciones();
});