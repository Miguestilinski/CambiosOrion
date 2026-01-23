import { initCajaHeader } from './header.js';

document.addEventListener('DOMContentLoaded', async() => {
    // 1. Capturar datos de sesión del Header
    const sessionData = await initCajaHeader('ingresos');
    
    let currentCajaId = null;
    
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

    // --- FUNCIONES CORE ---

    function obtenerIngresos() {
        if (!currentCajaId) return;

        const params = new URLSearchParams();
        params.append('caja_id', currentCajaId);
        params.append('pagina', paginaActual);

        Object.entries(filtros).forEach(([key, element]) => {
            if (element && element.value) {
                params.append(key, element.value);
            }
        });

        tablaIngresos.innerHTML = `<tr><td colspan="8" class="text-center py-10"><div class="animate-spin h-8 w-8 border-4 border-cyan-500 rounded-full border-t-transparent mx-auto"></div></td></tr>`;

        fetch(`https://cambiosorion.cl/data/ing-caja.php?${params.toString()}`)
            .then(res => {
                if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
                return res.json();
            })
            .then(data => {
                if (data.error) throw new Error(data.error);
                mostrarResultados(data);
                actualizarPaginacion(data.length);
            })
            .catch(err => {
                console.error("Error fetch:", err);
                tablaIngresos.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-red-500">Error al cargar datos: ${err.message}</td></tr>`;
            });
    }

    function mostrarResultados(data) {
        tablaIngresos.innerHTML = "";
        
        if (!data || data.length === 0) {
            tablaIngresos.innerHTML = `<tr><td colspan="8" class="text-center py-8 text-gray-500 italic">No se encontraron ingresos.</td></tr>`;
            return;
        }

        data.forEach(row => {
            const tr = document.createElement("tr");
            tr.className = "hover:brightness-95 transition-all text-gray-800 font-medium border-b border-gray-100 last:border-0 bg-white";

            let estadoClass = "bg-gray-100 text-gray-600";
            if (String(row.estado).toLowerCase() === 'vigente') estadoClass = "bg-green-100 text-green-700 border border-green-200";
            if (String(row.estado).toLowerCase() === 'anulado') estadoClass = "bg-red-100 text-red-700 border border-red-200";

            const btnMostrar = document.createElement('button');
            btnMostrar.innerHTML = `<svg class="w-5 h-5 text-gray-400 hover:text-cyan-600 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>`;
            btnMostrar.onclick = () => window.location.href = `detalle-ing-caja.html?id=${row.id}`; 

            tr.innerHTML = `
                <td class="px-4 py-3 font-mono text-xs text-gray-500 text-center">#${row.id}</td>
                <td class="px-4 py-3 text-xs text-gray-600">${row.fecha_formateada || row.fecha}</td>
                <td class="px-4 py-3 font-bold text-gray-700 text-sm truncate max-w-[150px]" title="${row.cliente_nombre}">
                    ${row.cliente_nombre ? limpiarTexto(row.cliente_nombre) : ''} 
                </td>
                <td class="px-4 py-3 text-center">
                    <span class="px-2 py-1 rounded text-[10px] uppercase font-bold bg-blue-50 text-blue-700 border border-blue-100">
                        ${limpiarTexto(row.tipo_ingreso)}
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
            tablaIngresos.appendChild(tr);
        });
    }

    function actualizarPaginacion(cantidad) {
        if (contadorRegistros) contadorRegistros.textContent = `${cantidad} registros`;
        const limite = parseInt(filtros.mostrar.value) || 25;
        if (btnPrev) btnPrev.disabled = (paginaActual <= 1);
        if (btnNext) btnNext.disabled = (cantidad < limite);
        if (pageIndicator) pageIndicator.textContent = `Página ${paginaActual}`;
    }

    // --- UTILS ---
    function limpiarTexto(t) { return t ? String(t).replace(/</g, "&lt;").replace(/>/g, "&gt;") : '-'; }
    function formatearNumero(n) { return parseFloat(n).toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 2 }); }

    function initDatePickers() {
        if (window.flatpickr) {
            flatpickr("#fecha-inicio", { locale: "es", dateFormat: "Y-m-d", defaultDate: new Date(new Date().setDate(new Date().getDate() - 30)) });
            flatpickr("#fecha-fin", { locale: "es", dateFormat: "Y-m-d", defaultDate: "today" });
        }
    }

    // --- EVENT LISTENERS ---
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

    if (btnPrev) btnPrev.addEventListener('click', () => { if (paginaActual > 1) { paginaActual--; obtenerIngresos(); } });
    if (btnNext) btnNext.addEventListener('click', () => { paginaActual++; obtenerIngresos(); });

    // Carga inicial
    obtenerIngresos();
});