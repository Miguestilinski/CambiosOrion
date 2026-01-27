import { 
    initSystem, 
    formatearNumero, 
    limpiarTexto
} from './index.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Inicializar sistema (Sidebar, Auth, Theme)
    initSystem('posiciones');

    // 2. Referencias al DOM
    const tablaPosiciones = document.getElementById('tabla-posiciones');
    const conteoResultados = document.getElementById('conteo-resultados');
    const paginationControls = document.getElementById('pagination-controls');
    const borrarFiltrosBtn = document.getElementById('borrar-filtros');

    // Filtros
    const filtros = {
        divisa: document.getElementById("divisa"),
        monto: document.getElementById("monto"),
        precio: document.getElementById("precio-promedio"),
        mostrar: document.getElementById("mostrar-registros"),
        buscar: document.getElementById("buscar") // Opcional
    };

    let paginaActual = 1;

    // 3. Cargar Datos para Autocomplete (Divisas)
    let datosDivisas = [];
    
    // Usamos el endpoint existente en posiciones.php que devuelve { divisas: [...] }
    fetch('https://cambiosorion.cl/data/posiciones.php?action=divisas')
        .then(res => res.json())
        .then(data => {
            if(data.divisas) {
                datosDivisas = data.divisas;
                inicializarAutocompleteDivisas();
            }
        })
        .catch(err => console.error("Error cargando divisas:", err));

    // 4. Lógica Autocomplete (Idéntica a Operaciones)
    function setupAutocomplete(inputId, getData, filterFn, renderFn) {
        const input = document.getElementById(inputId);
        if (!input) return;

        const dropdown = document.createElement('div');
        dropdown.className = 'absolute z-50 left-0 w-full mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-xl max-h-60 overflow-y-auto hidden';
        input.parentNode.appendChild(dropdown);

        const showResults = () => {
            const query = input.value.toLowerCase().trim();
            const sourceData = getData();
            const results = query === '' ? sourceData : sourceData.filter(item => filterFn(item, query));

            dropdown.innerHTML = '';
            if (results.length === 0) {
                dropdown.innerHTML = '<div class="px-3 py-2 text-xs text-slate-500 italic">No hay resultados</div>';
            } else {
                results.forEach(item => {
                    const div = document.createElement('div');
                    div.className = 'px-3 py-2 hover:bg-slate-700 cursor-pointer text-xs text-slate-300 flex items-center gap-2 border-b border-white/5 last:border-0 transition-colors';
                    div.innerHTML = renderFn(item);
                    div.addEventListener('click', (e) => {
                        e.stopPropagation();
                        // Al clickear, enviamos el NOMBRE al input (compatible con tu PHP actual)
                        // Ojo: Si quieres búsqueda exacta, el PHP debe soportarlo. 
                        input.value = item.nombre; 
                        dropdown.classList.add('hidden');
                        resetAndFetch();
                    });
                    dropdown.appendChild(div);
                });
            }
            dropdown.classList.remove('hidden');
        };

        input.addEventListener('focus', showResults);
        input.addEventListener('input', showResults);
        document.addEventListener('click', (e) => {
            if (!input.contains(e.target) && !dropdown.contains(e.target)) dropdown.classList.add('hidden');
        });
    }

    function inicializarAutocompleteDivisas() {
        setupAutocomplete(
            'divisa',
            () => datosDivisas,
            (item, query) => item.nombre.toLowerCase().includes(query) || item.codigo.toLowerCase().includes(query),
            (item) => {
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

    // 5. Función Principal: Obtener Posiciones
    function obtenerPosiciones() {
        const params = new URLSearchParams();
        
        // Mapeo de filtros para el backend
        if (filtros.divisa.value) params.set('divisa', filtros.divisa.value.trim());
        if (filtros.monto.value) params.set('monto', filtros.monto.value.trim());
        if (filtros.precio.value) params.set('precio', filtros.precio.value.trim());
        if (filtros.buscar && filtros.buscar.value) params.set('buscar', filtros.buscar.value.trim());
        
        params.set('mostrar_registros', filtros.mostrar.value);
        params.set('pagina', paginaActual);

        // Loading State
        tablaPosiciones.innerHTML = `<tr><td colspan="4" class="text-center py-10"><div class="animate-spin h-8 w-8 border-4 border-amber-500 rounded-full border-t-transparent mx-auto"></div></td></tr>`;

        fetch(`https://cambiosorion.cl/data/posiciones.php?${params.toString()}`)
            .then(res => res.json())
            .then(data => {
                if (data.posiciones) {
                    renderizarTabla(data.posiciones);
                    renderizarPaginacion(data.totalFiltrado, parseInt(filtros.mostrar.value), paginaActual);
                } else {
                    tablaPosiciones.innerHTML = `<tr><td colspan="4" class="text-center text-red-400 py-10">Error en el formato de datos</td></tr>`;
                }
            })
            .catch(err => {
                console.error("Error fetch:", err);
                tablaPosiciones.innerHTML = `<tr><td colspan="4" class="text-center text-red-400 py-10">Error de conexión</td></tr>`;
            });
    }

    // 6. Renderizar Tabla (Estilo Dark)
    function renderizarTabla(posiciones) {
        tablaPosiciones.innerHTML = "";
        
        if (posiciones.length === 0) {
            tablaPosiciones.innerHTML = '<tr><td colspan="4" class="text-center text-slate-500 py-10 italic">No se encontraron registros.</td></tr>';
            return;
        }

        posiciones.forEach(item => {
            const tr = document.createElement("tr");
            tr.className = "transition-all border-b border-white/5 last:border-0 hover:bg-white/5";
            
            // Icono
            const iconHtml = item.icono 
                ? `<img src="${item.icono}" class="w-6 h-6 rounded-full border border-slate-600 shadow-sm" />` 
                : `<div class="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-400">?</div>`;

            tr.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center gap-3">
                        ${iconHtml}
                        <span class="font-bold text-white text-sm">${item.divisa}</span>
                    </div>
                </td>
                <td class="px-6 py-4 text-right font-mono text-sm text-amber-400 font-bold">
                    ${formatearNumero(item.cantidad)}
                </td>
                <td class="px-6 py-4 text-right font-mono text-sm text-slate-300">
                    <span class="text-slate-500 mr-1">$</span>${formatearNumero(item.pmp)}
                </td>
                <td class="px-6 py-4 text-right font-mono text-sm text-emerald-400 bg-emerald-900/10 border-l border-white/5">
                    <span class="text-emerald-600 mr-1">$</span>${formatearNumero(item.total)}
                </td>
            `;
            tablaPosiciones.appendChild(tr);
        });
    }

    // 7. Paginación y Eventos
    function renderizarPaginacion(totalRegistros, porPagina, pagina) {
        if(conteoResultados) conteoResultados.textContent = `Total: ${totalRegistros}`;
        if(!paginationControls) return;
        
        paginationControls.innerHTML = '';
        const totalPaginas = Math.ceil(totalRegistros / porPagina);
        if (totalPaginas <= 1) return;

        // Botón Anterior
        const btnPrev = document.createElement('button');
        btnPrev.className = `px-3 py-1 bg-slate-800 border border-slate-600 rounded hover:bg-slate-700 text-white text-xs transition ${pagina === 1 ? 'opacity-50 cursor-not-allowed' : ''}`;
        btnPrev.textContent = 'Anterior';
        btnPrev.disabled = pagina === 1;
        btnPrev.onclick = () => { paginaActual--; obtenerPosiciones(); };
        paginationControls.appendChild(btnPrev);

        // Indicador
        const span = document.createElement('span');
        span.className = "text-xs font-bold text-slate-400 px-2";
        span.textContent = `${pagina} / ${totalPaginas}`;
        paginationControls.appendChild(span);

        // Botón Siguiente
        const btnNext = document.createElement('button');
        btnNext.className = `px-3 py-1 bg-slate-800 border border-slate-600 rounded hover:bg-slate-700 text-white text-xs transition ${pagina === totalPaginas ? 'opacity-50 cursor-not-allowed' : ''}`;
        btnNext.textContent = 'Siguiente';
        btnNext.disabled = pagina === totalPaginas;
        btnNext.onclick = () => { paginaActual++; obtenerPosiciones(); };
        paginationControls.appendChild(btnNext);
    }

    const resetAndFetch = () => { paginaActual = 1; obtenerPosiciones(); };

    // Listeners de Inputs
    Object.values(filtros).forEach(input => {
        if(input) {
            input.addEventListener('input', () => {
                // Pequeño debounce para no saturar si escriben rápido
                clearTimeout(input.timeout);
                input.timeout = setTimeout(resetAndFetch, 300);
            });
        }
    });

    if (borrarFiltrosBtn) {
        borrarFiltrosBtn.addEventListener('click', () => {
            Object.values(filtros).forEach(input => { if(input) input.value = ''; });
            if(filtros.mostrar) filtros.mostrar.value = '25';
            resetAndFetch();
        });
    }

    // Cargar inicial
    obtenerPosiciones();
});