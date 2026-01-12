import { 
    initSystem, 
    limpiarTexto, 
    formatearNumero, 
    mostrarModalError 
} from './index.js';

let usuarioSesion = null;

document.addEventListener('DOMContentLoaded', async () => {
    // --- 1. DEFINIR VARIABLES Y FILTROS PRIMERO ---
    
    // Referencias DOM
    const tablaInventario = document.getElementById('tabla-inventario');
    const conteoResultados = document.getElementById('conteo-resultados');
    const paginationControls = document.getElementById('pagination-controls');
    const borrarFiltrosBtn = document.getElementById('borrar-filtros');
    const exportarBtn = document.getElementById('exportar');
    const selectCaja = document.getElementById('caja');

    let paginaActual = 1;

    // Objeto Filtros (Definido antes de usarse)
    const filtros = {
        caja: selectCaja,
        divisaInput: document.getElementById('divisa-input'),
        buscar: document.getElementById('buscar'),
        mostrar: document.getElementById('mostrar-registros')
    };

    // --- 2. FUNCIONES DE LÓGICA ---

    function cargarDivisas() {
        fetch('https://cambiosorion.cl/data/divisas_api.php')
            .then(res => res.json())
            .then(data => {
                const dataList = document.getElementById('divisa-list');
                if (dataList && Array.isArray(data)) {
                    dataList.innerHTML = '';
                    data.forEach(divisa => {
                        const option = document.createElement('option');
                        option.value = divisa.nombre;
                        dataList.appendChild(option);
                    });
                }
            })
            .catch(err => console.error("Error loading currencies:", err));
    }

    function obtenerInventarios() {
        const params = new URLSearchParams();
        const limit = parseInt(filtros.mostrar.value) || 25;
        const offset = (paginaActual - 1) * limit;

        if (filtros.caja.value) params.set('caja', filtros.caja.value);
        if (filtros.divisaInput.value) params.set('divisa', filtros.divisaInput.value.trim());
        if (filtros.buscar.value) params.set('buscar', filtros.buscar.value.trim());
        
        // Paginación para PHP
        params.set('limit', limit);
        params.set('offset', offset); 

        // Spinner
        if (tablaInventario) {
            tablaInventario.innerHTML = `<tr><td colspan="7" class="text-center py-10"><div class="animate-spin h-8 w-8 border-4 border-amber-500 rounded-full border-t-transparent mx-auto"></div></td></tr>`;
        }

        fetch(`https://cambiosorion.cl/data/inventarios.php?${params.toString()}`, { credentials: "include" })
            .then(res => res.json())
            .then(data => {
                let lista = [];
                let totalRegistros = 0;

                if (Array.isArray(data)) {
                    lista = data;
                    totalRegistros = data.length; 
                } else if (data.data || data.inventarios) {
                    lista = data.data || data.inventarios || [];
                    totalRegistros = parseInt(data.total || data.totalFiltrado) || lista.length;
                    
                    if (lista.length === limit && totalRegistros === limit) {
                        totalRegistros = 9999;
                    }
                }

                renderizarTabla(lista);
                renderizarPaginacion(totalRegistros, limit, paginaActual);
            })
            .catch(error => {
                console.error('Error:', error);
                if (tablaInventario) tablaInventario.innerHTML = `<tr><td colspan="7" class="text-center text-red-400 py-4">Error de conexión.</td></tr>`;
            });
    }

    function renderizarTabla(inventarios) {
        if (!tablaInventario) return;
        tablaInventario.innerHTML = '';

        if (!inventarios || inventarios.length === 0) {
            tablaInventario.innerHTML = `<tr><td colspan="7" class="text-center text-slate-500 py-10 italic">No hay registros en el inventario.</td></tr>`;
            return;
        }

        inventarios.forEach(inv => {
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-white/5 transition-all border-b border-white/5 last:border-0 text-slate-300';

            const cantidad = parseFloat(inv.cantidad) || 0;
            const pmp = parseFloat(inv.pmp) || 0;
            const totalCLP = cantidad * pmp;
            const icono = inv.icono || 'https://cambiosorion.cl/orionapp/icons/default.png';
            
            let estadoHtml = '';
            if (cantidad > 0.001) {
                estadoHtml = `<span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-green-900/40 text-green-300 border border-green-500/30">Disponible</span>`;
            } else if (cantidad < -0.001) {
                estadoHtml = `<span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-900/40 text-red-300 border border-red-500/30">Negativo</span>`;
            } else {
                estadoHtml = `<span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-slate-500 border border-slate-700">Sin Stock</span>`;
            }

            const nombreCaja = inv.nombre_caja || (filtros.caja.options[filtros.caja.selectedIndex]?.text || 'Desconocida');

            tr.innerHTML = `
                <td class="px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wide">${limpiarTexto(nombreCaja)}</td>
                <td class="px-4 py-3 flex items-center gap-3">
                    <img src="${icono}" class="w-7 h-7 rounded-full border border-slate-600 object-contain bg-slate-800 p-0.5" onerror="this.src='https://cambiosorion.cl/orionapp/icons/default.png'">
                    <span class="font-bold text-white text-sm">${limpiarTexto(inv.divisa)}</span>
                </td>
                <td class="px-4 py-3 text-right font-mono text-sm ${cantidad < 0 ? 'text-red-400 font-bold' : 'text-slate-200'}">
                    ${formatearNumero(cantidad)}
                </td>
                <td class="px-4 py-3 text-right font-mono text-xs text-slate-500">
                    $${formatearNumero(pmp)}
                </td>
                <td class="px-4 py-3 text-right font-bold font-mono text-amber-400 text-sm">
                    $${formatearNumero(totalCLP)}
                </td>
                <td class="px-4 py-3 text-center">${estadoHtml}</td>
                <td class="px-4 py-3 text-center">
                    <button class="flex items-center justify-center p-1.5 bg-white/5 rounded-full hover:bg-amber-600 shadow-sm border border-transparent transition-all mx-auto text-slate-400 hover:text-white" 
                            onclick="window.location.href='detalle-div?id=${inv.divisa_id}'" 
                            title="Ver">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
                    </button>
                </td>
            `;
            tablaInventario.appendChild(tr);
        });
    }

    function renderizarPaginacion(totalRegistros, porPagina, pagina) {
        if (!conteoResultados || !paginationControls) return;
        conteoResultados.textContent = `Total: ${totalRegistros}`;
        paginationControls.innerHTML = '';

        const totalPaginas = Math.ceil(totalRegistros / porPagina);
        const hayMasPaginas = (totalRegistros >= porPagina); 

        const crearBtn = (txt, disabled, fn) => {
            const b = document.createElement('button');
            b.textContent = txt;
            b.className = `px-3 py-1 bg-slate-800 border border-slate-600 rounded hover:bg-slate-700 text-white text-xs ${disabled?'opacity-50 cursor-not-allowed':''}`;
            b.disabled = disabled;
            b.onclick = fn;
            return b;
        };

        paginationControls.appendChild(crearBtn('Anterior', pagina === 1, () => cambioPagina(pagina - 1)));
        const span = document.createElement('span');
        span.className = "text-xs font-bold text-slate-400 px-2";
        span.textContent = (totalRegistros === 9999) ? `Página ${pagina}` : `${pagina} / ${totalPaginas}`;
        paginationControls.appendChild(span);
        const btnNext = crearBotonPag('Siguiente', !hayMasPaginas && (pagina >= totalPaginas), () => cambioPagina(pagina + 1));
        paginationControls.appendChild(btnNext);
    }

    function crearBotonPag(texto, disabled, onClick) {
        const btn = document.createElement('button');
        btn.textContent = texto;
        btn.className = `px-3 py-1 bg-slate-800 border border-slate-600 rounded hover:bg-slate-700 text-white text-xs transition ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`;
        btn.disabled = disabled;
        btn.onclick = onClick;
        return btn;
    }

    function cambioPagina(nuevaPagina) {
        paginaActual = nuevaPagina;
        obtenerInventarios();
    }

    // --- 3. EVENTOS (Listeners) ---
    
    const resetAndFetch = () => { paginaActual = 1; obtenerInventarios(); };

    if (borrarFiltrosBtn) {
        borrarFiltrosBtn.addEventListener('click', () => {
            if(filtros.divisaInput) filtros.divisaInput.value = '';
            if(filtros.buscar) filtros.buscar.value = '';
            if(filtros.mostrar) filtros.mostrar.value = '25';
            resetAndFetch();
        });
    }

    if (exportarBtn) {
        exportarBtn.addEventListener("click", () => {
            const params = new URLSearchParams();
            if (filtros.caja.value) params.set("caja", filtros.caja.value);
            if (filtros.divisaInput.value) params.set("divisa", filtros.divisaInput.value);
            if (filtros.buscar.value) params.set("buscar", filtros.buscar.value);
            
            window.open(`https://cambiosorion.cl/data/exportar_inventario.php?${params.toString()}`, '_blank');
        });
    }

    Object.values(filtros).forEach(input => {
        if(input) {
            if (input === filtros.caja) {
                input.addEventListener('change', () => {
                    if(filtros.divisaInput) filtros.divisaInput.value = '';
                    resetAndFetch();
                });
            } else {
                input.addEventListener('input', resetAndFetch);
                input.addEventListener('change', resetAndFetch);
            }
        }
    });

    // --- 4. INICIALIZACIÓN (AL FINAL) ---
    // Ahora `filtros` ya está definido cuando esto se ejecute
    const sessionData = await initSystem('inventarios');
    
    if (sessionData) {
        usuarioSesion = sessionData;
        
        if (selectCaja) {
            if (!usuarioSesion.caja_id) {
                if(!selectCaja.value) selectCaja.value = '99';
            } else if (usuarioSesion.caja_id != 99) {
                selectCaja.value = usuarioSesion.caja_id;
            }
        }

        cargarDivisas();
        obtenerInventarios();
    }
});