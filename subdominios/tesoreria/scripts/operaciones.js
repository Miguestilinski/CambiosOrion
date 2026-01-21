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

    // --- FETCH DATOS ---
    function obtenerOperaciones() {
        const params = new URLSearchParams();
        params.set('page', paginaActual);
        
        // Mapeo de filtros...
        if(filtros.mostrar) params.set('limit', filtros.mostrar.value);
        if(filtros.fechaInicio && filtros.fechaInicio.value) params.set('fecha_inicio', filtros.fechaInicio.value);
        if(filtros.fechaFin && filtros.fechaFin.value) params.set('fecha_fin', filtros.fechaFin.value);
        
        // Checkboxes
        if(filtros.emitidas && filtros.emitidas.checked) params.set('emitidas', 1);
        if(filtros.noEmitidas && filtros.noEmitidas.checked) params.set('no_emitidas', 1);

        // Text inputs
        if(filtros.numero && filtros.numero.value) params.set('id', filtros.numero.value);
        if(filtros.cliente && filtros.cliente.value) params.set('cliente', filtros.cliente.value);
        if(filtros.nDoc && filtros.nDoc.value) params.set('n_doc', filtros.nDoc.value);

        // Selects
        if(filtros.tipoDoc && filtros.tipoDoc.value) params.set('tipo_documento', filtros.tipoDoc.value);
        if(filtros.tipoTransaccion && filtros.tipoTransaccion.value) params.set('tipo_transaccion', filtros.tipoTransaccion.value);
        if(filtros.divisa && filtros.divisa.value) params.set('divisa_id', filtros.divisa.value);
        if(filtros.estado && filtros.estado.value) params.set('estado', filtros.estado.value);

        tablaOperaciones.innerHTML = `
            <tr class="animate-pulse">
                <td colspan="9" class="px-6 py-8 text-center text-slate-500">
                    <div class="flex justify-center items-center gap-2">
                        <svg class="w-5 h-5 animate-spin text-amber-500" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Cargando operaciones...
                    </div>
                </td>
            </tr>`;

        fetch(`https://cambiosorion.cl/data/operaciones.php?${params.toString()}`)
            .then(res => res.json())
            .then(data => {
                const lista = data.data || [];
                renderTabla(lista);
                renderPaginacion(data.page || 1, data.totalPages || 1);
                if(conteoResultados) conteoResultados.textContent = `Mostrando ${lista.length} de ${data.total || 0} registros`;
            })
            .catch(err => {
                console.error(err);
                tablaOperaciones.innerHTML = `<tr><td colspan="9" class="px-6 py-4 text-center text-red-400">Error al cargar datos.</td></tr>`;
            });
    }

    // --- RENDER TABLA ---
    function renderTabla(datos) {
        tablaOperaciones.innerHTML = '';
        
        if (datos.length === 0) {
            tablaOperaciones.innerHTML = `<tr><td colspan="9" class="px-6 py-8 text-center text-slate-500 italic">No se encontraron operaciones.</td></tr>`;
            return;
        }

        datos.forEach(op => {
            const tr = document.createElement('tr');
            
            // Lógica de colores según tipo
            const tipo = (op.tipo_transaccion || '').toLowerCase();
            let rowClass = "border-b border-slate-700 transition group "; 

            if (tipo === 'venta') {
                // El color de fondo se aplica via CSS (.venta)
                // Aquí aseguramos estructura base
                rowClass += "venta"; 
            } else if (tipo === 'compra') {
                // El color de fondo se aplica via CSS (.compra)
                rowClass += "compra";
            } else {
                // Por defecto (si no es compra ni venta)
                rowClass += "bg-slate-900 hover:bg-slate-800 text-slate-300";
            }
            
            tr.className = rowClass;

            // Formato Cliente
            const clienteHtml = op.cliente ? 
                `<div class="font-bold">${limpiarTexto(op.cliente)}</div>` : 
                `<div class="italic opacity-70">Cliente General</div>`;

            // Formato Documento
            const docHtml = op.tipo_documento && op.numero_documento ? 
                `<span class="px-2 py-0.5 rounded bg-black/10 border border-black/20 text-[10px] font-bold uppercase">${op.tipo_documento} ${op.numero_documento}</span>` : 
                `<span class="text-[10px] opacity-50">Sin Doc</span>`;

            tr.innerHTML = `
                <td class="px-6 py-4">
                    ${formatearFechaHora(op.fecha)}
                </td>
                <td class="px-6 py-4 text-xs font-mono font-bold opacity-70">
                    #${op.id}
                </td>
                <td class="px-6 py-4 text-sm">
                    ${clienteHtml}
                </td>
                <td class="px-6 py-4 text-center">
                    <span class="text-xs font-bold uppercase tracking-wider">${op.tipo_transaccion}</span>
                </td>
                <td class="px-6 py-4 text-center">
                    <div class="flex items-center justify-center gap-2">
                        <span class="font-bold">${op.divisa}</span>
                    </div>
                </td>
                <td class="px-6 py-4 text-right font-mono font-bold text-sm">
                    ${formatearNumero(op.cantidad)}
                </td>
                <td class="px-6 py-4 text-right font-mono text-xs opacity-80">
                    ${formatearNumero(op.tasa_cambio)}
                </td>
                <td class="px-6 py-4 text-right font-mono font-bold text-sm">
                    $${formatearNumero(op.total_pesos)}
                </td>
                <td class="px-6 py-4 text-center">
                    ${docHtml}
                </td>
            `;
            
            // Click en fila para ver detalle
            tr.addEventListener('click', (e) => {
                // Evitar si se hace click en un botón específico dentro de la fila (si hubiera)
                window.location.href = `detalle-op?id=${op.id}`;
            });
            tr.style.cursor = "pointer";

            tablaOperaciones.appendChild(tr);
        });
    }

    // --- PAGINACIÓN ---
    function renderPaginacion(pagina, totalPaginas) {
        if(!paginationControls) return;
        paginationControls.innerHTML = '';
        if (totalPaginas <= 1) return;

        const crearBtn = (txt, disabled, fn) => {
            const btn = document.createElement('button');
            btn.innerHTML = txt;
            btn.className = `px-3 py-1 text-xs font-medium rounded-md border transition ${disabled ? 'bg-slate-800 text-slate-600 border-slate-700 cursor-not-allowed' : 'bg-slate-800 text-slate-300 border-slate-600 hover:bg-slate-700 hover:text-white hover:border-amber-500'}`;
            btn.disabled = disabled;
            btn.onclick = fn;
            return btn;
        };

        paginationControls.appendChild(crearBtn('<', pagina === 1, () => cambioPagina(pagina - 1)));
        const span = document.createElement('span');
        span.className = "text-xs font-bold text-slate-400 px-2";
        span.textContent = `${pagina} / ${totalPaginas}`;
        paginationControls.appendChild(span);
        paginationControls.appendChild(crearBtn('>', pagina === totalPaginas, () => cambioPagina(pagina + 1)));
    }

    function cambioPagina(nuevaPagina) {
        paginaActual = nuevaPagina;
        obtenerOperaciones();
    }

    // --- EVENTOS ---
    const resetAndFetch = () => { paginaActual = 1; obtenerOperaciones(); };

    if(borrarFiltrosBtn) {
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
    }

    Object.values(filtros).forEach(input => {
        if(input && input !== filtros.emitidas && input !== filtros.noEmitidas) {
            input.addEventListener('input', resetAndFetch);
            input.addEventListener('change', resetAndFetch);
        }
    });
    
    // Checkboxes triggers
    if(filtros.emitidas) filtros.emitidas.addEventListener('change', resetAndFetch);
    if(filtros.noEmitidas) filtros.noEmitidas.addEventListener('change', resetAndFetch);

    obtenerOperaciones();
});