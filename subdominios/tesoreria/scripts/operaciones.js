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
            // En modo oscuro, eliminamos el bg-white. Por defecto es transparente.
            tr.className = 'transition-all border-b border-white/5 last:border-0 text-slate-300';

            const tipo = String(op.tipo_transaccion).toLowerCase();
            
            // CSS se encarga de los colores !important
            if (tipo === 'compra') {
                tr.classList.add('compra');
            } else if (tipo === 'venta') {
                tr.classList.add('venta');
            } 

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

    function initDatePickers() {
        const config = {
            locale: "es",
            dateFormat: "Y-m-d", // Formato que se envía a la BD
            altInput: true,      // Crea el input visual
            altFormat: "d/m/Y",  // Formato que ve el usuario
            allowInput: true,
            disableMobile: "true",
            // IMPORTANTE: Esto hace que el filtro busque apenas seleccionas la fecha
            onChange: function(selectedDates, dateStr, instance) {
                resetAndFetch();
            }
        };
        flatpickr(".flatpickr", config);
    }

    initDatePickers();

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

    // 1. Obtener datos de clientes y divisas
    let datosFiltros = { clientes: [], divisas: [] };
    
    fetch('https://cambiosorion.cl/data/operaciones.php?get_filter_data=1')
        .then(res => res.json())
        .then(data => {
            datosFiltros = data;
            inicializarAutocompletes();
        })
        .catch(err => console.error("Error cargando filtros:", err));

    // 2. Función constructora del dropdown
    function setupAutocomplete(inputId, getData, filterFn, renderFn) {
        const input = document.getElementById(inputId);
        if (!input) return;

        // Crear contenedor del dropdown
        const dropdown = document.createElement('div');
        dropdown.className = 'absolute z-50 left-0 w-full mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-xl max-h-60 overflow-y-auto hidden';
        input.parentNode.appendChild(dropdown);

        const showResults = () => {
            const query = input.value.toLowerCase().trim();
            const sourceData = getData();
            
            // Si el input está vacío, mostrar todo. Si no, filtrar.
            const results = query === '' 
                ? sourceData 
                : sourceData.filter(item => filterFn(item, query));

            dropdown.innerHTML = '';

            if (results.length === 0) {
                dropdown.innerHTML = '<div class="px-3 py-2 text-xs text-slate-500 italic">No hay resultados</div>';
            } else {
                results.forEach(item => {
                    const div = document.createElement('div');
                    div.className = 'px-3 py-2 hover:bg-slate-700 cursor-pointer text-xs text-slate-300 flex items-center gap-2 border-b border-white/5 last:border-0 transition-colors';
                    div.innerHTML = renderFn(item); // HTML personalizado (con icono, etc)
                    
                    div.addEventListener('click', (e) => {
                        e.stopPropagation(); // Evitar cerrar inmediatamente
                        // Al hacer clic, llenamos el input con el valor principal
                        input.value = item.valorInput; 
                        dropdown.classList.add('hidden');
                        resetAndFetch(); // Ejecutar búsqueda principal
                    });
                    dropdown.appendChild(div);
                });
            }
            dropdown.classList.remove('hidden');
        };

        // Eventos
        input.addEventListener('focus', showResults);
        input.addEventListener('input', showResults);
        
        // Cerrar al hacer clic fuera
        document.addEventListener('click', (e) => {
            if (!input.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.classList.add('hidden');
            }
        });
    }

    function inicializarAutocompletes() {
        // A. Configurar Cliente
        setupAutocomplete(
            'cliente',
            () => datosFiltros.clientes.map(c => ({ ...c, valorInput: c.razon_social })), // Datos
            (item, query) => item.razon_social.toLowerCase().includes(query), // Filtro
            (item) => `<span class="font-medium">${item.razon_social}</span>` // Render HTML
        );

        // B. Configurar Divisa
        setupAutocomplete(
            'divisa',
            () => datosFiltros.divisas.map(d => ({ ...d, valorInput: d.codigo })), // Usamos código para el input final
            (item, query) => {
                // Buscar por Nombre O por Código
                return item.nombre.toLowerCase().includes(query) || item.codigo.toLowerCase().includes(query);
            },
            (item) => {
                // Render con Icono + Nombre + Código
                // Asumo que 'item.icono' es una URL. Si no tienes iconos, quita la etiqueta <img>.
                const iconHtml = item.icono 
                    ? `<img src="${item.icono}" class="w-4 h-4 rounded-full object-cover">` 
                    : `<span class="w-4 h-4 rounded-full bg-slate-600 flex items-center justify-center text-[8px]">${item.codigo.substring(0,2)}</span>`;
                
                return `
                    ${iconHtml}
                    <div class="flex flex-col">
                        <span class="font-bold text-white leading-none">${item.nombre}</span>
                        <span class="text-[10px] text-slate-500 font-mono">${item.codigo}</span>
                    </div>
                `;
            }
        );
    }

    obtenerOperaciones(); // Llamada original
});