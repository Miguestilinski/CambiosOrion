import { 
    initSystem, 
    limpiarTexto, 
    formatearNumero, 
    formatearFechaHora, 
    mostrarModalError 
} from './index.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Inicializar sistema
    initSystem('egresos-util');

    // Referencias DOM
    const tablaEgresos = document.getElementById('tabla-egresos');
    const conteoResultados = document.getElementById('conteo-resultados');
    const paginationControls = document.getElementById('pagination-controls');
    
    const nuevoEgresoBtn = document.getElementById('nuevo-egreso-util');
    const borrarFiltrosBtn = document.getElementById('borrar-filtros');
    const exportarBtn = document.getElementById('exportar');

    let paginaActual = 1;

    // Filtros
    const filtros = {
        numero: document.getElementById('numero'),
        fecha: document.getElementById('fecha'),
        tipo: document.getElementById('tipo-egreso'),
        caja: document.getElementById('caja'),
        divisa: document.getElementById('divisa'),
        estado: document.getElementById('estado'),
        buscar: document.getElementById('buscar'),
        mostrar: document.getElementById('mostrar-registros')
    };

    if (nuevoEgresoBtn) {
        nuevoEgresoBtn.addEventListener('click', () => {
            // Asumiendo que reutilizas el form de egresos con un flag o una url distinta
            window.location.href = 'https://tesoreria.cambiosorion.cl/nuevo-egr-util';
        });
    }

    // --- FETCH DATOS ---
    function obtenerEgresos() {
        const params = new URLSearchParams();

        // Mapeo exacto para egresos-util.php
        params.set('page', paginaActual);
        params.set('mostrar', filtros.mostrar ? filtros.mostrar.value : 25);
        
        if (filtros.buscar.value) params.set('buscar', filtros.buscar.value.trim());
        if (filtros.numero.value) params.set('numero', filtros.numero.value.trim());
        if (filtros.fecha.value) params.set('fecha', filtros.fecha.value);
        if (filtros.tipo.value) params.set('tipo_egreso', filtros.tipo.value); // PHP usa 'tipo_egreso'
        if (filtros.caja.value) params.set('caja', filtros.caja.value);
        if (filtros.divisa.value) params.set('divisa', filtros.divisa.value.trim());
        if (filtros.estado.value) params.set('estado', filtros.estado.value);

        // Spinner Ámbar
        tablaEgresos.innerHTML = `<tr><td colspan="9" class="text-center py-10"><div class="animate-spin h-8 w-8 border-4 border-amber-500 rounded-full border-t-transparent mx-auto"></div></td></tr>`;

        fetch(`https://cambiosorion.cl/data/egresos-util.php?${params.toString()}`)
            .then(res => res.json())
            .then(data => {
                // Manejo de respuesta flexible
                let lista = [];
                let total = 0;

                if (data.data) {
                    lista = data.data;
                    total = parseInt(data.total) || lista.length;
                } else if (Array.isArray(data)) {
                    lista = data;
                    total = data.length;
                }

                renderizarTabla(lista);
                renderizarPaginacion(total, parseInt(filtros.mostrar.value), paginaActual);
            })
            .catch(error => {
                console.error('Error:', error);
                tablaEgresos.innerHTML = `<tr><td colspan="9" class="text-center text-red-400 py-4">Error de conexión.</td></tr>`;
            });
    }

    // --- RENDERIZADO ---
    function renderizarTabla(egresos) {
        tablaEgresos.innerHTML = '';

        if (egresos.length === 0) {
            tablaEgresos.innerHTML = `<tr><td colspan="9" class="text-center text-slate-500 py-10 italic">No se encontraron registros.</td></tr>`;
            return;
        }

        egresos.forEach(row => {
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-white/5 transition-all border-b border-white/5 last:border-0 text-slate-300';

            // Estados
            let estadoClass = "bg-slate-800 text-slate-400 border border-slate-700";
            const est = String(row.estado).toLowerCase();
            if(est === 'vigente') estadoClass = "bg-green-900/40 text-green-300 border border-green-500/30";
            if(est === 'anulado') estadoClass = "bg-red-900/40 text-red-300 border border-red-500/30";

            // Tipo (Colores distintivos)
            let tipoClass = "text-slate-400";
            const tipo = String(row.tipo_egreso || '').toLowerCase();
            if (tipo === 'utilidad') tipoClass = "text-amber-400 font-bold";
            if (tipo === 'gasto') tipoClass = "text-rose-400 font-bold";
            if (tipo === 'retiro') tipoClass = "text-blue-400 font-bold";

            // Botón Acción
            const btnVer = document.createElement('button');
            btnVer.innerHTML = `<svg class="w-5 h-5 text-slate-400 hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>`;
            btnVer.className = 'flex items-center justify-center p-1.5 bg-white/5 rounded-full hover:bg-amber-600 shadow-sm border border-transparent transition-all mx-auto';
            btnVer.onclick = (e) => {
                e.stopPropagation();
                window.location.href = `detalle-egr-util?id=${row.id}`;
            };

            // Concepto
            let concepto = row.item_utilidad || row.cliente || 'Sin concepto';

            tr.innerHTML = `
                <td class="px-4 py-3 whitespace-nowrap text-xs">${formatearFechaHora(row.fecha)}</td>
                <td class="px-4 py-3 font-mono text-xs font-bold text-slate-500">${limpiarTexto(row.id)}</td>
                <td class="px-4 py-3 text-xs uppercase font-bold text-slate-400 tracking-wide">${limpiarTexto(row.caja)}</td>
                <td class="px-4 py-3 font-semibold text-sm text-white truncate max-w-[180px]" title="${limpiarTexto(concepto)}">${limpiarTexto(concepto)}</td>
                <td class="px-4 py-3 text-xs uppercase tracking-wide ${tipoClass}">${limpiarTexto(row.tipo_egreso)}</td>
                <td class="px-4 py-3 text-center font-bold text-slate-200 text-xs">${limpiarTexto(row.divisa)}</td>
                <td class="px-4 py-3 text-right font-bold font-mono text-white text-sm">${formatearNumero(row.monto)}</td>
                <td class="px-4 py-3 text-center">
                    <span class="px-2 py-0.5 rounded text-[10px] uppercase font-bold ${estadoClass}">${limpiarTexto(row.estado)}</span>
                </td>
                <td class="px-4 py-3 text-center cell-action"></td>
            `;

            tr.querySelector('.cell-action').appendChild(btnVer);
            tablaEgresos.appendChild(tr);
        });
    }

    // --- PAGINACIÓN ---
    function renderizarPaginacion(totalRegistros, porPagina, pagina) {
        conteoResultados.textContent = `Total: ${totalRegistros}`;
        paginationControls.innerHTML = '';

        const totalPaginas = Math.ceil(totalRegistros / porPagina);
        if (totalPaginas <= 1) return;

        const crearBtn = (txt, disabled, fn) => {
            const b = document.createElement('button');
            b.textContent = txt;
            b.className = `px-3 py-1 bg-slate-800 border border-slate-600 rounded hover:bg-slate-700 text-white text-xs transition ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`;
            b.disabled = disabled;
            b.onclick = fn;
            return b;
        };

        paginationControls.appendChild(crearBtn('Anterior', pagina === 1, () => cambioPagina(pagina - 1)));
        const span = document.createElement('span');
        span.className = "text-xs font-bold text-slate-400 px-2";
        span.textContent = `${pagina} / ${totalPaginas}`;
        paginationControls.appendChild(span);
        paginationControls.appendChild(crearBtn('Siguiente', pagina === totalPaginas, () => cambioPagina(pagina + 1)));
    }

    function cambioPagina(nuevaPagina) {
        paginaActual = nuevaPagina;
        obtenerEgresos();
    }

    // --- EVENTOS ---
    const resetAndFetch = () => { paginaActual = 1; obtenerEgresos(); };

    borrarFiltrosBtn.addEventListener('click', () => {
        Object.values(filtros).forEach(input => {
            if(!input) return;
            input.value = '';
            if(input._flatpickr) input._flatpickr.clear();
        });
        if(filtros.mostrar) filtros.mostrar.value = '25';
        resetAndFetch();
    });

    if (exportarBtn) {
        exportarBtn.addEventListener('click', () => {
            alert("Exportar pendiente de implementación backend.");
        });
    }

    Object.values(filtros).forEach(input => {
        if(input) {
            input.addEventListener('input', resetAndFetch);
            input.addEventListener('change', resetAndFetch);
        }
    });

    obtenerEgresos();
});