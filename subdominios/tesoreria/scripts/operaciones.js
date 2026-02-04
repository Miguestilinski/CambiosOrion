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

    let sortColumn = null;
    let sortDirection = 'none'; // 'asc', 'desc', 'none'

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

    const obtenerParametrosFiltros = () => {
        return new URLSearchParams({
            fecha_inicio: filtros.fechaInicio.value,
            fecha_fin: filtros.fechaFin.value,
            emitidas: filtros.emitidas.checked ? '1' : '0',
            no_emitidas: filtros.noEmitidas.checked ? '1' : '0',
            numero: filtros.numero.value,
            cliente: filtros.cliente.value,
            tipo_doc: filtros.tipoDoc.value,
            n_doc: filtros.nDoc.value,
            tipo_transaccion: filtros.tipoTransaccion.value,
            divisa: filtros.divisa.value,
            estado: filtros.estado.value
        });
    };

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

        if (sortColumn && sortDirection !== 'none') {
            params.set('order_by', sortColumn);
            params.set('order_dir', sortDirection);
        }

        tablaOperaciones.innerHTML = `<tr><td colspan="12" class="text-center py-10"><div class="animate-spin h-8 w-8 border-4 border-amber-500 rounded-full border-t-transparent mx-auto"></div></td></tr>`;

        fetch(`https://tesoreria.cambiosorion.cl/api/operaciones.php?${params.toString()}`)
            .then(response => {
                // Si la respuesta no es OK, leemos el texto para ver el error de PHP
                if (!response.ok) {
                    return response.text().then(text => { throw new Error(text) });
                }
                return response.text(); // Leemos como texto primero
            })
            .then(text => {
                try {
                const data = JSON.parse(text);
                const lista = data.operaciones || [];
                const total = parseInt(data.totalFiltrado) || 0;
                renderizarTabla(lista);
                renderizarPaginacion(total, parseInt(filtros.mostrar.value), paginaActual);
                renderizarTotales(data.totales);
                } catch (e) {
                    // ¡AQUÍ ESTÁ EL TRUCO!
                    console.error("EL PHP DEVOLVIÓ ESTO (NO ES JSON):", text);
                    throw new Error("El servidor devolvió un error de formato. Revisa la consola.");
                }
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

        const filtroDivisa = filtros.divisa.value.trim().toLowerCase();

        operaciones.forEach(op => {
            const tr = document.createElement('tr');
            
            // ESTILO BASE IDÉNTICO AL DE CAJAS:
            // hover:brightness-95 para oscurecer ligeramente el color de fondo (sea blanco o pastel)
            tr.className = 'hover:brightness-95 transition-all text-gray-800 font-medium border-b border-gray-200 last:border-0';

            // --- LÓGICA DE COLORES DE FONDO ---
            // Mantenemos tus clases CSS (.compra, .venta, .anulado) que definimos antes
            // porque ya contienen los colores pastel exactos (#c3e8f1, #dbf599, etc.)
            const estado = String(op.estado || '').toLowerCase();
            const tipo = String(op.tipo_transaccion || '').toLowerCase();

            if (estado === 'anulado' || estado === 'anulada') {
                tr.classList.add('anulado'); 
            } else {
                if (tipo === 'compra') tr.classList.add('compra');
                else if (tipo === 'venta') tr.classList.add('venta');
                else tr.style.backgroundColor = '#ffffff'; // Blanco por defecto si no es compra/venta
            }

            // Procesamiento de múltiples divisas (Lógica de Tesorería)
            const divisasRaw = (op.divisas_data || '').split('|');
            const montos = (op.montos_por_divisa || '').split('|');
            const tasas = (op.tasas_cambio || '').split('|');
            const subtotales = (op.subtotales_por_divisa || '').split('|');

            let divHTML = '', montoHTML = '', tasaHTML = '', subtotalHTML = '';

            divisasRaw.forEach((dStr, index) => {
                const [nombre, codigo] = dStr.split(':');
                const monto = montos[index] || 0;
                const tasa = tasas[index] || 0;
                const subtotal = subtotales[index] || 0;

                // Lógica de atenuado para Modo Claro
                let opacityClass = '';
                if (filtroDivisa) {
                    const match = nombre.toLowerCase().includes(filtroDivisa) || (codigo && codigo.toLowerCase().includes(filtroDivisa));
                    if (!match) opacityClass = 'opacity-25 blur-[0.5px]'; 
                    else opacityClass = 'font-bold text-gray-900'; // Destacado muy oscuro
                }

                divHTML += `<div class="${opacityClass} transition-all">${nombre}</div>`;
                montoHTML += `<div class="${opacityClass} transition-all">${formatearNumero(monto)}</div>`;
                tasaHTML += `<div class="${opacityClass} transition-all">${formatearNumero(tasa)}</div>`;
                subtotalHTML += `<div class="${opacityClass} transition-all">${formatearNumero(subtotal)}</div>`;
            });

            // Botón Ver Detalle (Estilo Cajas: Hover Amber)
            const btnVer = document.createElement('button');
            btnVer.innerHTML = `
                <svg class="w-5 h-5 text-gray-600 hover:text-amber-700 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                </svg>
            `;
            // Clases exactas del botón de Cajas
            btnVer.className = 'flex items-center justify-center p-1.5 bg-white/50 rounded-full hover:bg-white shadow-sm border border-transparent hover:border-amber-300 transition-all mx-auto';
            btnVer.onclick = (e) => { e.stopPropagation(); window.location.href = `detalle-op?id=${op.id}`; };

            // Renderizado de Celdas (Tipografía adaptada a Gray/Slate oscuro)
            tr.innerHTML = `
                <td class="px-4 py-3 whitespace-nowrap text-xs text-gray-600">${formatearFechaHora(op.fecha)}</td>
                <td class="px-4 py-3 font-mono text-xs font-bold text-gray-600 opacity-90">${op.id}</td>
                <td class="px-4 py-3 font-semibold text-xs text-gray-800 truncate max-w-[140px]" title="${limpiarTexto(op.nombre_cliente)}">${limpiarTexto(op.nombre_cliente)}</td>
                <td class="px-4 py-3 text-xs uppercase font-bold text-gray-500 tracking-wide">${limpiarTexto(op.tipo_documento)}</td>
                <td class="px-4 py-3 font-mono text-xs text-gray-500">${limpiarTexto(op.numero_documento)}</td>
                <td class="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-gray-700">${limpiarTexto(op.tipo_transaccion)}</td>
                <td class="px-4 py-3 text-xs font-black text-slate-700">${divHTML}</td>
                <td class="px-4 py-3 text-right font-mono text-xs text-gray-800 font-medium">${montoHTML}</td>
                <td class="px-4 py-3 text-right font-mono text-xs text-gray-600">${tasaHTML}</td>
                <td class="px-4 py-3 text-right font-mono text-sm text-gray-900 font-bold">${subtotalHTML}</td>
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
        // Colores sólidos y legibles para las etiquetas de estado
        if(est === 'vigente') return 'bg-green-100 text-green-800 border border-green-200';
        if(est === 'anulado') return 'bg-red-100 text-red-800 border border-red-200';
        if(est === 'pagado') return 'bg-blue-100 text-blue-800 border border-blue-200';
        return 'bg-slate-100 text-slate-600 border border-slate-200';
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
    
    fetch('https://tesoreria.cambiosorion.cl/api/operaciones.php?get_filter_data=1')
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

    const btnExportar = document.getElementById('btnExportar');

    if (btnExportar) {
        btnExportar.addEventListener('click', () => {
            // 1. Obtenemos los filtros actuales
            const params = obtenerParametrosFiltros();
            
            // 2. Agregamos la bandera de exportación
            params.append('export', 'excel');

            // 3. Redireccionamos a la API
            // Esto disparará la descarga automática del archivo .xlsx
            window.location.href = `https://tesoreria.cambiosorion.cl/api/operaciones.php?${params.toString()}`;
        });
    }

    function renderizarTotales(totales) {
        const tfoot = document.getElementById('tabla-totales');
        if (!tfoot) return;

        // Ocultar si no hay datos relevantes
        if (!totales || (parseFloat(totales.total) === 0 && !totales.es_multidivisa)) {
            tfoot.classList.add('hidden');
            return;
        }
        tfoot.classList.remove('hidden');
        
        // Configurar etiqueta y valor de Monto según si es Multidivisa o Filtro
        let labelMonto = '';
        let classMonto = '';

        if (totales.es_multidivisa) {
            labelMonto = '<span class="text-slate-500 text-[10px] tracking-widest">MULTIDIVISA</span>';
            classMonto = 'text-center italic';
        } else {
            // Si hay filtro, mostramos ej: EUR 500,00
            // Intentamos obtener el código del filtro si el PHP no lo devolvió explícito, o usamos el input
            const divisaCode = totales.divisa_filtro || filtros.divisa.value.substring(0,3).toUpperCase();
            labelMonto = `<span class="mr-1 text-slate-500 text-[10px]">${divisaCode}</span> ${formatearNumero(totales.monto)}`;
            classMonto = 'text-right font-mono text-amber-400 text-xs';
        }
        
        tfoot.innerHTML = `
            <tr>
                <td colspan="7" class="px-4 py-4 text-right text-slate-400 text-[10px]">TOTALES GENERALES:</td>
                <td class="px-4 py-4 ${classMonto}">
                    ${labelMonto}
                </td>
                <td></td>
                <td class="px-4 py-4 text-right font-mono text-sm text-emerald-400 border-t border-emerald-500/30 bg-emerald-900/5 shadow-[inset_0_0_20px_rgba(16,185,129,0.1)]">
                    <span class="mr-1 text-emerald-600 text-[10px]">$</span>${formatearNumero(totales.total)}
                </td>
                <td colspan="2"></td>
            </tr>
        `;
    }

    // --- LÓGICA DE ORDENAMIENTO ---
    document.querySelectorAll('.sortable').forEach(th => {
        th.addEventListener('click', () => {
            const column = th.dataset.sort;

            // Ciclo: none -> asc -> desc -> none
            if (sortColumn === column) {
                if (sortDirection === 'none') sortDirection = 'asc';
                else if (sortDirection === 'asc') sortDirection = 'desc';
                else { sortDirection = 'none'; sortColumn = null; }
            } else {
                sortColumn = column;
                sortDirection = 'asc';
            }

            actualizarIconosOrden();
            obtenerOperaciones();
        });
    });

    function actualizarIconosOrden() {
        document.querySelectorAll('.sortable').forEach(th => {
            const iconContainer = th.querySelector('.sort-icon');
            const column = th.dataset.sort;
            
            // Icono por defecto (flechas arriba/abajo tenues)
            let iconSVG = `<svg class="w-3 h-3 opacity-20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3l-5 5h10l-5-5zm0 18l5-5h-10l5 5z"/></svg>`;

            if (sortColumn === column && sortDirection !== 'none') {
                if (sortDirection === 'asc') {
                    // Flecha Arriba (Activa)
                    iconSVG = `<svg class="w-3 h-3 text-amber-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3l-8 8h16l-8-8z"/></svg>`;
                } else {
                    // Flecha Abajo (Activa)
                    iconSVG = `<svg class="w-3 h-3 text-amber-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21l8-8H4l8 8z"/></svg>`;
                }
            }
            iconContainer.innerHTML = iconSVG;
        });
        // Inicializar iconos por defecto al cargar
        if(sortDirection === 'none') {
             document.querySelectorAll('.sort-icon').forEach(span => {
                 span.innerHTML = `<svg class="w-3 h-3 opacity-20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3l-5 5h10l-5-5zm0 18l5-5h-10l5 5z"/></svg>`;
             });
        }
    }
    actualizarIconosOrden(); // Ejecutar al inicio

    obtenerOperaciones(); // Llamada original
});