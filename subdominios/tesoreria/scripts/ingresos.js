import { 
    initSystem, 
    limpiarTexto, 
    formatearNumero, 
    formatearFechaHora, 
    mostrarModalError 
} from './index.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Init System
    initSystem('ingresos');

    // Referencias DOM (Validación de null)
    const tablaIngresos = document.getElementById('tabla-ingresos');
    const conteoResultados = document.getElementById('conteo-resultados');
    const paginationControls = document.getElementById('pagination-controls');
    
    const nuevoIngresoBtn = document.getElementById('nuevo-ingreso');
    const borrarFiltrosBtn = document.getElementById('borrar-filtros');
    const exportarBtn = document.getElementById('exportar');

    // Si no existe la tabla, detenemos para evitar errores
    if (!tablaIngresos) {
        console.error("Error crítico: No se encontró el elemento 'tabla-ingresos' en el HTML.");
        return;
    }

    let paginaActual = 1;

    // Filtros
    const filtros = {
        fechaInicio: document.getElementById("fecha-inicio"),
        fechaFin: document.getElementById("fecha-fin"),
        cliente: document.getElementById("cliente"),
        caja: document.getElementById("caja"),
        mostrar: document.getElementById("mostrar-registros")
    };

    // Inicializar Datepickers
    if (typeof flatpickr !== 'undefined') {
        flatpickr(filtros.fechaInicio, { dateFormat: "Y-m-d", locale: "es" });
        flatpickr(filtros.fechaFin, { dateFormat: "Y-m-d", locale: "es" });
    }

    // Navegación Nuevo
    if (nuevoIngresoBtn) {
        nuevoIngresoBtn.addEventListener('click', () => {
            window.location.href = 'https://tesoreria.cambiosorion.cl/nuevo-ing';
        });
    }

    // --- FETCH DATOS ---
    function obtenerIngresos() {
        const params = new URLSearchParams();
        params.set('page', paginaActual);
        
        if (filtros.mostrar) params.set('limit', filtros.mostrar.value);
        if (filtros.fechaInicio && filtros.fechaInicio.value) params.set('fecha_inicio', filtros.fechaInicio.value);
        if (filtros.fechaFin && filtros.fechaFin.value) params.set('fecha_fin', filtros.fechaFin.value);
        if (filtros.cliente && filtros.cliente.value) params.set('buscar', filtros.cliente.value);
        if (filtros.caja && filtros.caja.value) params.set('caja', filtros.caja.value);

        // Spinner
        tablaIngresos.innerHTML = `
            <tr class="animate-pulse">
                <td colspan="7" class="px-6 py-8 text-center text-slate-500">
                    <div class="flex justify-center items-center gap-2">
                        <svg class="w-5 h-5 animate-spin text-green-500" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Cargando ingresos...
                    </div>
                </td>
            </tr>`;

        fetch(`https://cambiosorion.cl/data/ingresos.php?${params.toString()}`)
            .then(res => res.json())
            .then(data => {
                const lista = data.data || [];
                renderTabla(lista);
                renderPaginacion(data.page || 1, data.totalPages || 1);
                if (conteoResultados) conteoResultados.textContent = `Mostrando ${lista.length} de ${data.total || 0} registros`;
            })
            .catch(err => {
                console.error(err);
                tablaIngresos.innerHTML = `<tr><td colspan="7" class="px-6 py-4 text-center text-red-400">Error al cargar datos.</td></tr>`;
            });
    }

    // --- RENDER TABLA ---
    function renderTabla(datos) {
        tablaIngresos.innerHTML = '';
        if (datos.length === 0) {
            tablaIngresos.innerHTML = `<tr><td colspan="7" class="px-6 py-8 text-center text-slate-500 italic">No se encontraron ingresos.</td></tr>`;
            return;
        }

        datos.forEach(item => {
            const tr = document.createElement('tr');
            tr.className = "bg-slate-900 border-b border-slate-800 hover:bg-slate-800 transition group";

            const origenHtml = item.cliente ? 
                `<span class="font-bold text-white">${limpiarTexto(item.cliente)}</span>` : 
                (item.cuenta_nombre ? 
                    `<span class="text-slate-300">Cuenta: ${limpiarTexto(item.cuenta_nombre)}</span>` : 
                    `<span class="text-slate-500 italic">Sin Origen</span>`);

            tr.innerHTML = `
                <td class="px-6 py-4">
                    ${formatearFechaHora(item.fecha)}
                    <div class="text-[10px] text-slate-600 font-mono mt-0.5">#${item.id}</div>
                </td>
                <td class="px-6 py-4 text-sm">
                    ${origenHtml}
                </td>
                <td class="px-6 py-4 text-center text-xs text-slate-400">
                    ${item.caja || '---'}
                </td>
                <td class="px-6 py-4 text-center">
                    <span class="px-2 py-1 rounded text-[10px] uppercase font-bold bg-slate-800 border border-slate-700 text-slate-400">
                        ${item.tipo_ingreso}
                    </span>
                </td>
                <td class="px-6 py-4 text-right">
                    <div class="font-mono font-bold text-green-400 text-sm">
                        ${formatearNumero(item.monto)} <span class="text-xs text-slate-500">${item.divisa}</span>
                    </div>
                </td>
                <td class="px-6 py-4 text-center">
                    <span class="px-2 py-1 rounded-full text-[10px] font-bold uppercase bg-green-900/30 text-green-400 border border-green-500/30">
                        ${item.estado || 'Vigente'}
                    </span>
                </td>
                <td class="px-6 py-4 text-center">
                    <button class="text-slate-500 hover:text-white transition" onclick="alert('Detalle no disponible aún')">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                    </button>
                </td>
            `;
            tablaIngresos.appendChild(tr);
        });
    }

    // --- PAGINACIÓN ---
    function renderPaginacion(pagina, totalPaginas) {
        paginationControls.innerHTML = '';
        if (totalPaginas <= 1) return;

        const crearBtn = (txt, disabled, fn) => {
            const b = document.createElement('button');
            b.innerHTML = txt;
            b.className = `px-3 py-1 text-xs font-medium rounded-md border transition ${disabled ? 'bg-slate-800 text-slate-600 border-slate-700 cursor-not-allowed' : 'bg-slate-800 text-slate-300 border-slate-600 hover:bg-slate-700 hover:text-white hover:border-green-500'}`;
            b.disabled = disabled;
            b.onclick = fn;
            return b;
        };

        paginationControls.appendChild(crearBtn('<', pagina === 1, () => { paginaActual--; obtenerIngresos(); }));
        const span = document.createElement('span');
        span.className = "text-xs font-bold text-slate-400 px-2";
        span.textContent = `${pagina} / ${totalPaginas}`;
        paginationControls.appendChild(span);
        paginationControls.appendChild(crearBtn('>', pagina === totalPaginas, () => { paginaActual++; obtenerIngresos(); }));
    }

    // --- EVENTOS ---
    const resetAndFetch = () => { paginaActual = 1; obtenerIngresos(); };

    if (borrarFiltrosBtn) {
        borrarFiltrosBtn.addEventListener('click', () => {
            Object.values(filtros).forEach(input => {
                if (input) {
                    input.value = '';
                    if (input._flatpickr) input._flatpickr.clear();
                }
            });
            if (filtros.mostrar) filtros.mostrar.value = '25';
            resetAndFetch();
        });
    }

    Object.values(filtros).forEach(input => {
        if (input) {
            input.addEventListener('input', resetAndFetch);
            input.addEventListener('change', resetAndFetch);
        }
    });

    obtenerIngresos();
});