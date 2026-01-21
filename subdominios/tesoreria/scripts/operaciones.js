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
                renderTabla(lista);
                renderizarPaginacion(total, parseInt(filtros.mostrar.value), paginaActual);
            })
            .catch(error => {
                console.error('Error:', error);
                tablaOperaciones.innerHTML = `<tr><td colspan="12" class="text-center text-red-400 py-4">Error de conexión.</td></tr>`;
            });
    }

    // --- RENDER TABLA ---
    function renderTabla(datos) {
        tablaOperaciones.innerHTML = '';
        
        if (!datos || datos.length === 0) {
            tablaOperaciones.innerHTML = `<tr><td colspan="9" class="px-6 py-8 text-center text-slate-500 italic">No se encontraron operaciones.</td></tr>`;
            return;
        }

        datos.forEach(op => {
            const tr = document.createElement('tr');
            const tipo = (op.tipo_transaccion || '').toLowerCase();
            const esFilaColor = (tipo === 'venta' || tipo === 'compra');

            // 1. Clases de la Fila (Fondo)
            let rowClass = "border-b border-slate-700 transition cursor-pointer ";
            if (tipo === 'venta') rowClass += "venta hover:brightness-95"; // CSS externo + Tailwind hover
            else if (tipo === 'compra') rowClass += "compra hover:brightness-95"; // CSS externo + Tailwind hover
            else rowClass += "bg-slate-900 hover:bg-slate-800"; // Default Dark

            tr.className = rowClass;

            // 2. Definición Dinámica de Colores de Texto (Tailwind)
            // Si hay fondo claro (compra/venta) -> Texto Oscuro. Si no -> Texto Claro.
            const txtMain = esFilaColor ? "text-slate-900" : "text-white";       // Texto Principal (Montos, Cliente)
            const txtSub  = esFilaColor ? "text-slate-600" : "text-slate-400";   // Texto Secundario (IDs, detalles)
            const txtMuted = esFilaColor ? "text-slate-500" : "text-slate-500";  // Texto muy tenue
            
            // Badge Estado/Documento
            const badgeClass = esFilaColor 
                ? "bg-white/50 border-slate-400/30 text-slate-800"  // Badge oscuro sobre fondo claro
                : "bg-black/20 border-white/10 text-slate-300";     // Badge claro sobre fondo oscuro

            // 3. Preparar HTML de Fecha (Hack para corregir colores del helper importado)
            let fechaHtml = formatearFechaHora(op.fecha);
            if (esFilaColor) {
                // Reemplazamos las clases claras del helper por oscuras al vuelo
                fechaHtml = fechaHtml
                    .replace('text-slate-300', 'text-slate-900')
                    .replace('text-slate-500', 'text-slate-600');
            }

            // 4. HTML de Cliente
            const clienteHtml = op.cliente ? 
                `<div class="font-bold ${txtMain}">${limpiarTexto(op.cliente)}</div>` : 
                `<div class="italic ${txtSub} opacity-75">Cliente General</div>`;

            // 5. HTML de Documento
            const docHtml = op.tipo_documento && op.numero_documento ? 
                `<span class="px-2 py-0.5 rounded border ${badgeClass} text-[10px] font-bold uppercase">${op.tipo_documento} ${op.numero_documento}</span>` : 
                `<span class="text-[10px] ${txtMuted} opacity-50">Sin Doc</span>`;

            tr.innerHTML = `
                <td class="px-6 py-4">
                    ${fechaHtml}
                </td>
                <td class="px-6 py-4 text-xs font-mono font-bold ${txtSub} opacity-80">
                    #${op.id}
                </td>
                <td class="px-6 py-4 text-sm">
                    ${clienteHtml}
                </td>
                <td class="px-6 py-4 text-center">
                    <span class="text-xs font-bold uppercase tracking-wider ${txtMain}">${op.tipo_transaccion}</span>
                </td>
                <td class="px-6 py-4 text-center">
                    <div class="flex items-center justify-center gap-2">
                        <span class="font-bold ${txtMain}">${op.divisa}</span>
                    </div>
                </td>
                <td class="px-6 py-4 text-right font-mono font-bold text-sm ${txtMain}">
                    ${formatearNumero(op.cantidad)}
                </td>
                <td class="px-6 py-4 text-right font-mono text-xs ${txtSub}">
                    ${formatearNumero(op.tasa_cambio)}
                </td>
                <td class="px-6 py-4 text-right font-mono font-bold text-sm ${txtMain}">
                    $${formatearNumero(op.total_pesos)}
                </td>
                <td class="px-6 py-4 text-center">
                    ${docHtml}
                </td>
            `;
            
            tr.onclick = () => window.location.href = `detalle-op?id=${op.id}`;
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