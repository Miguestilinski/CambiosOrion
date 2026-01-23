import { initCajaHeader } from './header.js';

document.addEventListener('DOMContentLoaded', async() => {
    // 1. Capturar datos de sesión e inicializar Header
    const sessionData = await initCajaHeader('egresos');

    // 2. Configurar variables globales
    let currentCajaId = null;
    
    // Asignar ID de caja si viene en la sesión
    if (sessionData && sessionData.caja_id) {
        currentCajaId = sessionData.caja_id;
        console.log("Caja ID detectada para Egresos:", currentCajaId);
    } else {
        console.warn("No se detectó caja abierta en la sesión.");
    }

    initDatePickers();

    // Referencias del DOM
    const nuevoEgresoBtn = document.getElementById('nuevo-egreso');
    const tablaEgresos = document.getElementById('tabla-egresos');
    const borrarFiltrosBtn = document.getElementById('borrar-filtros');
    const contadorRegistros = document.getElementById('contador-registros');
    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');
    const pageIndicator = document.getElementById('page-indicator');
    
    let paginaActual = 1;

    const filtros = {
        fechaInicio: document.getElementById("fecha-inicio"),
        fechaFin: document.getElementById("fecha-fin"),
        id: document.getElementById("id-egreso"),
        categoria: document.getElementById("categoria"),
        observacion: document.getElementById("observacion"),
        tipoEgreso: document.getElementById("tipo-egreso"),
        divisa: document.getElementById("divisa"),
        estado: document.getElementById("estado"),
        mostrar: document.getElementById("mostrar-registros")
    };

    if (nuevoEgresoBtn) {
        nuevoEgresoBtn.addEventListener('click', () => {
            window.location.href = 'https://caja.cambiosorion.cl/nuevo-egr';
        });
    }

    function initDatePickers() {
        const config = {
            locale: "es",
            dateFormat: "Y-m-d",
            altInput: true,
            altFormat: "d/m/Y",
            allowInput: true,
            disableMobile: "true"
        };
        if (typeof flatpickr !== 'undefined') {
            flatpickr(".flatpickr", config);
        }
    }

    // --- CARGA DE DATOS ---

    function obtenerEgresos() {
        const cajaIdParam = currentCajaId ? currentCajaId : 0;
        const params = new URLSearchParams();
        params.set('caja_id', cajaIdParam);

        for (const [clave, input] of Object.entries(filtros)) { 
            if (input && input.value) params.set(clave, input.value.trim()); 
        }
        params.set('pagina', paginaActual);

        if(tablaEgresos) {
            tablaEgresos.innerHTML = `<tr><td colspan="9" class="text-center py-10"><div class="animate-spin h-8 w-8 border-4 border-cyan-500 rounded-full border-t-transparent mx-auto"></div></td></tr>`;
        }

        fetch(`https://cambiosorion.cl/data/egr-caja.php?${params.toString()}`)
            .then(response => response.json())
            .then(data => {
                if (Array.isArray(data)) {
                    mostrarResultados(data);
                    actualizarPaginacion(data.length);
                } else if (data && data.egresos) {
                    mostrarResultados(data.egresos);
                    actualizarPaginacion(data.egresos.length);
                } else {
                    console.error("Respuesta inválida:", data);
                    if(tablaEgresos) tablaEgresos.innerHTML = `<tr><td colspan="9" class="text-center py-4 text-red-500">Error en formato de datos.</td></tr>`;
                }
            })
            .catch(error => { 
                console.error('Error fetch:', error); 
                if(tablaEgresos) tablaEgresos.innerHTML = `<tr><td colspan="9" class="text-center py-4 text-red-500">Error de conexión.</td></tr>`; 
            });
    }

    function actualizarPaginacion(cantidadResultados) {
        if (pageIndicator) pageIndicator.textContent = `Página ${paginaActual}`;
        if (contadorRegistros) contadorRegistros.textContent = `${cantidadResultados} registros visibles`;
        const limite = parseInt(filtros.mostrar.value) || 25;
        
        if (btnPrev) btnPrev.disabled = (paginaActual <= 1);
        if (btnNext) btnNext.disabled = (cantidadResultados < limite);
    }

    // Event Listeners Paginación
    if (btnPrev) btnPrev.addEventListener('click', () => { if (paginaActual > 1) { paginaActual--; obtenerEgresos(); } });
    if (btnNext) btnNext.addEventListener('click', () => { paginaActual++; obtenerEgresos(); });

    // Helpers de Formato
    function formatearFechaHora(fechaString) {
        if (!fechaString) return '';
        try {
            const [datePart, timePart] = fechaString.split(' ');
            const [y, m, d] = datePart.split('-');
            const [h, min] = timePart.split(':');
            return `<div class="flex flex-col"><span class="font-mono font-bold text-gray-600">${h}:${min}</span><span class="text-gray-400 text-[10px]">${d}/${m}/${y}</span></div>`;
        } catch (e) { return fechaString; }
    }

    function mostrarResultados(data) {
        tablaEgresos.innerHTML = "";
        
        if (!data || data.length === 0) {
            tablaEgresos.innerHTML = `<tr><td colspan="8" class="text-center py-8 text-gray-500 italic">No se encontraron egresos.</td></tr>`;
            return;
        }

        data.forEach(row => {
            const tr = document.createElement("tr");
            tr.className = "hover:brightness-95 transition-all text-gray-800 font-medium border-b border-gray-100 last:border-0 bg-white";

            // Estilos de Estado (Rojo por defecto para egresos vigentes)
            let estadoClass = "bg-gray-100 text-gray-600";
            if (String(row.estado).toLowerCase() === 'vigente') estadoClass = "bg-rose-50 text-rose-700 border border-rose-100";
            if (String(row.estado).toLowerCase() === 'anulado') estadoClass = "bg-slate-100 text-slate-500 line-through decoration-slate-400";

            const btnMostrar = document.createElement('button');
            btnMostrar.innerHTML = `<svg class="w-5 h-5 text-gray-400 hover:text-rose-600 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>`;
            btnMostrar.onclick = () => window.location.href = `detalle-egr-caja.html?id=${row.id}`; 

            tr.innerHTML = `
                <td class="px-4 py-3 font-mono text-xs text-gray-500 text-center">#${row.id}</td>
                <td class="px-4 py-3 text-xs text-gray-600">${row.fecha_formateada}</td>
                <td class="px-4 py-3 font-bold text-gray-700 text-sm truncate max-w-[150px]" title="${row.cliente_nombre}">
                    ${row.cliente_nombre || '-'}
                </td>
                <td class="px-4 py-3 text-center">
                    <span class="px-2 py-1 rounded text-[10px] uppercase font-bold bg-amber-50 text-amber-700 border border-amber-100">
                        ${limpiarTexto(row.tipo_egreso)}
                    </span>
                </td>
                <td class="px-4 py-3 text-center">
                    <div class="flex items-center justify-center gap-2">
                        ${row.divisa_icono ? `<img src="${row.divisa_icono}" class="w-4 h-4 rounded-full">` : ''}
                        <span class="font-bold text-slate-700 text-xs">${limpiarTexto(row.divisa_nombre || row.divisa_id)}</span>
                    </div>
                </td>
                <td class="px-4 py-3 text-right font-bold font-mono text-slate-800 text-sm">
                    ${formatearNumero(row.monto)}
                </td>
                <td class="px-4 py-3 text-center">
                    <span class="px-2 py-0.5 rounded text-[10px] uppercase font-bold ${estadoClass}">${limpiarTexto(row.estado)}</span>
                </td>
                <td class="px-4 py-3 text-center mostrar-btn-cell"></td>
            `;

            tr.querySelector('.mostrar-btn-cell').appendChild(btnMostrar);
            tablaEgresos.appendChild(tr);
        });
    }

    if (borrarFiltrosBtn) {
        borrarFiltrosBtn.addEventListener('click', () => {
            Object.values(filtros).forEach(input => { 
                if(input) { 
                    input.value = ''; 
                    if(input._flatpickr) input._flatpickr.clear(); 
                } 
            });
            if(filtros.mostrar) filtros.mostrar.value = '25';
            paginaActual = 1;
            obtenerEgresos();
        });
    }

    Object.values(filtros).forEach(input => {
        if(input) { 
            const reset = () => { paginaActual = 1; obtenerEgresos(); }; 
            input.addEventListener('input', reset); 
            input.addEventListener('change', reset); 
        }
    });

    // LLAMADA INICIAL IMPORTANTE
    obtenerEgresos();
});