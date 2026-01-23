import { initCajaHeader } from './header.js';

document.addEventListener('DOMContentLoaded', async() => {
    // 1. Capturar datos de sesión del Header
    const sessionData = await initCajaHeader('ingresos');
    
    // 2. Configurar variables globales
    let currentCajaId = null;
    
    // Asignar ID de caja si viene en la sesión
    if (sessionData && sessionData.caja_id) {
        currentCajaId = sessionData.caja_id;
        console.log("Caja ID detectada:", currentCajaId);
    } else {
        console.warn("No se detectó caja abierta en la sesión.");
    }

    initDatePickers();

    // Referencias del DOM
    const nuevoIngresoBtn = document.getElementById('nuevo-ingreso');
    const tablaIngresos = document.getElementById('tabla-ingresos');
    const borrarFiltrosBtn = document.getElementById('borrar-filtros');
    const contadorRegistros = document.getElementById('contador-registros');
    
    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');
    const pageIndicator = document.getElementById('page-indicator');
    
    let paginaActual = 1;

    const filtros = {
        fechaInicio: document.getElementById("fecha-inicio"),
        fechaFin: document.getElementById("fecha-fin"),
        id: document.getElementById("id-ingreso"),
        cliente: document.getElementById("cliente"),
        tipoIngreso: document.getElementById("tipo-ingreso"),
        observacion: document.getElementById("observacion"),
        divisa: document.getElementById("divisa"),
        estado: document.getElementById("estado"),
        mostrar: document.getElementById("mostrar-registros")
    };

    if (nuevoIngresoBtn) {
        nuevoIngresoBtn.addEventListener('click', () => {
            window.location.href = 'https://caja.cambiosorion.cl/nuevo-ing';
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
        // Verificar si existe flatpickr antes de llamar
        if (typeof flatpickr !== 'undefined') {
            flatpickr(".flatpickr", config);
        }
    }

    function obtenerIngresos() {
        // Usar el ID de caja capturado al inicio
        const cajaIdParam = currentCajaId ? currentCajaId : 0; 
        
        const params = new URLSearchParams();
        params.set('caja_id', cajaIdParam);

        for (const [clave, input] of Object.entries(filtros)) {
            if (input && input.value) {
                params.set(clave, input.value.trim());
            }
        }
        params.set('pagina', paginaActual);

        if(tablaIngresos) {
            tablaIngresos.innerHTML = `<tr><td colspan="9" class="text-center py-10"><div class="animate-spin h-8 w-8 border-4 border-cyan-500 rounded-full border-t-transparent mx-auto"></div></td></tr>`;
        }

        fetch(`https://cambiosorion.cl/data/ing-caja.php?${params.toString()}`)
            .then(response => response.json())
            .then(data => {
                if (Array.isArray(data)) {
                    mostrarResultados(data);
                    actualizarPaginacion(data.length);
                } else if (data && data.ingresos) {
                     // Por si la API devuelve { ingresos: [...], total: ... }
                    mostrarResultados(data.ingresos);
                    actualizarPaginacion(data.ingresos.length);
                } else {
                    console.error("Respuesta inválida:", data);
                    if(tablaIngresos) tablaIngresos.innerHTML = `<tr><td colspan="9" class="text-center py-4 text-red-500">Error en formato de datos.</td></tr>`;
                }
            })
            .catch(error => {
                console.error('Error fetch:', error);
                if(tablaIngresos) tablaIngresos.innerHTML = `<tr><td colspan="9" class="text-center py-4 text-red-500">Error de conexión.</td></tr>`;
            });
    }

    function actualizarPaginacion(cantidadResultados) {
        if (pageIndicator) pageIndicator.textContent = `Página ${paginaActual}`;
        if (contadorRegistros) contadorRegistros.textContent = `${cantidadResultados} registros visibles`;

        const limite = parseInt(filtros.mostrar.value) || 25;
        if (btnPrev) btnPrev.disabled = (paginaActual <= 1);
        // Deshabilitar siguiente si trajimos menos registros que el límite (llegamos al final)
        if (btnNext) btnNext.disabled = (cantidadResultados < limite);
    }

    if (btnPrev) btnPrev.addEventListener('click', () => { if (paginaActual > 1) { paginaActual--; obtenerIngresos(); } });
    if (btnNext) btnNext.addEventListener('click', () => { paginaActual++; obtenerIngresos(); });

    function limpiarTexto(valor) { return valor === null || valor === undefined ? '' : valor; }

    function formatearNumero(numero) {
        if (numero === null || numero === undefined || numero === '') return '';
        return Number(numero).toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    }

    function formatearFechaHora(fechaString) {
        if (!fechaString) return '';
        try {
            const [datePart, timePart] = fechaString.split(' ');
            const [y, m, d] = datePart.split('-');
            const [h, min] = timePart.split(':');
            return `<div class="flex flex-col"><span class="font-mono font-bold text-gray-600">${h}:${min}</span><span class="text-gray-400 text-[10px]">${d}/${m}/${y}</span></div>`;
        } catch (e) {
            return fechaString;
        }
    }

    function mostrarResultados(registros) {
        if(!tablaIngresos) return;
        tablaIngresos.innerHTML = '';

        if (!registros || registros.length === 0) {
            tablaIngresos.innerHTML = `<tr><td colspan="9" class="text-center py-10 text-gray-500 italic">No se encontraron ingresos.</td></tr>`;
            return;
        }

        registros.forEach(row => {
            const tr = document.createElement('tr');
            tr.className = 'hover:brightness-95 transition-all text-gray-800 font-medium border-b border-gray-100 last:border-0 bg-white';

            let estadoClass = "bg-gray-100 text-gray-600";
            if(String(row.estado) === 'Vigente') estadoClass = "bg-green-100 text-green-700 border border-green-200";
            if(String(row.estado) === 'Anulado') estadoClass = "bg-red-100 text-red-700 border border-red-200";
            if(String(row.estado) === 'Pagado') estadoClass = "bg-blue-100 text-blue-700 border border-blue-200";

            const btnMostrar = document.createElement('button');
            btnMostrar.innerHTML = `<svg class="w-5 h-5 text-gray-600 hover:text-cyan-700 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>`;
            btnMostrar.className = 'flex items-center justify-center p-1.5 bg-white/50 rounded-full hover:bg-white shadow-sm border border-transparent hover:border-cyan-300 mx-auto';
            btnMostrar.addEventListener('click', (e) => {
                e.stopPropagation();
                window.location.href = `detalle-ing?id=${row.id}`;
            });

            tr.innerHTML = `
                <td class="px-4 py-3 whitespace-nowrap text-xs">${formatearFechaHora(row.fecha)}</td>
                <td class="px-4 py-3 font-mono text-xs font-bold text-gray-600">${limpiarTexto(row.id)}</td>
                <td class="px-4 py-3 font-bold text-gray-700 text-sm truncate max-w-[150px]" title="${row.cliente_nombre}">
                    ${row.cliente_nombre ? limpiarTexto(row.cliente_nombre) : ''} 
                </td>
                <td class="px-4 py-3 text-xs uppercase font-bold text-gray-500 tracking-wide">${limpiarTexto(row.tipo_ingreso)}</td>
                <td class="px-4 py-3 text-xs text-gray-500 max-w-[150px] truncate" title="${limpiarTexto(row.observaciones)}">${limpiarTexto(row.observaciones)}</td>
                <td class="px-4 py-3 text-center">
                    <div class="flex items-center justify-center gap-2">
                        ${row.divisa_icono ? `<img src="${row.divisa_icono}" class="w-4 h-4 rounded-full">` : ''}
                        <span class="font-bold text-slate-700 text-xs">${limpiarTexto(row.divisa_nombre || row.divisa_id)}</span>
                    </div>
                </td>
                <td class="px-4 py-3 text-right font-bold font-mono text-slate-800 text-sm">${formatearNumero(row.monto)}</td>
                <td class="px-4 py-3 text-center">
                    <span class="px-2 py-0.5 rounded text-[10px] uppercase font-bold ${estadoClass}">${limpiarTexto(row.estado)}</span>
                </td>
                <td class="px-4 py-3 text-center mostrar-btn-cell"></td>
            `;

            tr.querySelector('.mostrar-btn-cell').appendChild(btnMostrar);
            tablaIngresos.appendChild(tr);
        });
    }

    if (borrarFiltrosBtn) {
        borrarFiltrosBtn.addEventListener('click', () => {
            Object.values(filtros).forEach(input => {
                if(!input) return;
                input.value = '';
                if(input._flatpickr) input._flatpickr.clear();
            });
            if(filtros.mostrar) filtros.mostrar.value = '25';
            paginaActual = 1;
            obtenerIngresos();
        });
    }

    Object.values(filtros).forEach(input => {
        if(input) {
            const resetAndFetch = () => { paginaActual = 1; obtenerIngresos(); };
            input.addEventListener('input', resetAndFetch);
            input.addEventListener('change', resetAndFetch);
        }
    });

    // --- IMPORTANTE: LLAMADA INICIAL ---
    // Esta línea faltaba en tu código original
    obtenerIngresos();
});