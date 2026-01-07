import { 
    initSystem, 
    limpiarTexto, 
    formatearNumero, 
    mostrarModalError 
} from './index.js';

let usuarioSesion = null;

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Inicializar sistema
    const sessionData = await initSystem('inventarios');
    
    if (sessionData) {
        usuarioSesion = sessionData;
        
        // Lógica de permisos: Si es Admin/Tesorero, puede ver el select de cajas.
        // Si no, forzamos su caja asignada.
        const selectCaja = document.getElementById('caja');
        if (selectCaja) {
            if (!usuarioSesion.caja_id) {
                // Es Admin/Tesorero sin caja fija (o caja 99) -> Dejar elegir, por defecto 99
                if(!selectCaja.value) selectCaja.value = '99';
            } else if (usuarioSesion.caja_id != 99) {
                // Es Cajero -> Forzar su caja y deshabilitar select
                selectCaja.value = usuarioSesion.caja_id;
                // Opcional: selectCaja.disabled = true; 
            }
        }

        cargarDivisas();
        obtenerInventarios();
    }

    // Referencias DOM
    const tablaInventario = document.getElementById('tabla-inventario');
    const conteoResultados = document.getElementById('conteo-resultados');
    const paginationControls = document.getElementById('pagination-controls');
    const borrarFiltrosBtn = document.getElementById('borrar-filtros');
    const exportarBtn = document.getElementById('exportar');

    let paginaActual = 1;

    // Filtros
    const filtros = {
        caja: document.getElementById('caja'),
        divisaInput: document.getElementById('divisa-input'),
        buscar: document.getElementById('buscar'),
        mostrar: document.getElementById('mostrar-registros')
    };

    // --- CARGAR DATALIST DIVISAS ---
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

    // --- FETCH DATOS ---
    function obtenerInventarios() {
        const params = new URLSearchParams();
        const limit = parseInt(filtros.mostrar.value) || 25;
        const offset = (paginaActual - 1) * limit;

        // Mapeo exacto para inventarios.php
        if (filtros.caja.value) params.set('caja', filtros.caja.value); // PHP usa $_GET['caja']
        if (filtros.divisaInput.value) params.set('divisa', filtros.divisaInput.value.trim());
        if (filtros.buscar.value) params.set('buscar', filtros.buscar.value.trim());
        
        // Paginación para PHP
        params.set('limit', limit);
        params.set('offset', offset); 

        // Spinner Visual
        tablaInventario.innerHTML = `<tr><td colspan="7" class="text-center py-10"><div class="animate-spin h-8 w-8 border-4 border-amber-500 rounded-full border-t-transparent mx-auto"></div></td></tr>`;

        fetch(`https://cambiosorion.cl/data/inventarios.php?${params.toString()}`, { credentials: "include" })
            .then(res => res.json())
            .then(data => {
                // Manejo flexible de la respuesta del PHP
                let lista = [];
                let totalRegistros = 0;

                if (Array.isArray(data)) {
                    // Si el PHP devuelve solo el array (sin paginación en backend)
                    lista = data;
                    totalRegistros = data.length; 
                } else if (data.data || data.inventarios) {
                    // Si el PHP devuelve objeto con metadata
                    lista = data.data || data.inventarios || [];
                    // Si el PHP devuelve el total filtrado, úsalo. Si no, usa el largo de la lista (fallback)
                    totalRegistros = parseInt(data.total || data.totalFiltrado) || lista.length;
                    
                    // Si el total es igual al limit, probablemente hay más páginas (fallback simple)
                    if (lista.length === limit && totalRegistros === limit) {
                        totalRegistros = 9999; // Forzar paginación si no tenemos total real
                    }
                }

                renderizarTabla(lista);
                renderizarPaginacion(totalRegistros, limit, paginaActual);
            })
            .catch(error => {
                console.error('Error:', error);
                tablaInventario.innerHTML = `<tr><td colspan="7" class="text-center text-red-400 py-4">Error de conexión con inventarios.php</td></tr>`;
            });
    }

    // --- RENDERIZADO ---
    function renderizarTabla(inventarios) {
        tablaInventario.innerHTML = '';

        if (!inventarios || inventarios.length === 0) {
            tablaInventario.innerHTML = `<tr><td colspan="7" class="text-center text-slate-500 py-10 italic">No hay registros en el inventario.</td></tr>`;
            return;
        }

        inventarios.forEach(inv => {
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-white/5 transition-all border-b border-white/5 last:border-0 text-slate-300';

            // Convertir valores numéricos
            const cantidad = parseFloat(inv.cantidad) || 0;
            const pmp = parseFloat(inv.pmp) || 0;
            const totalCLP = cantidad * pmp;
            const icono = inv.icono || 'https://cambiosorion.cl/orionapp/icons/default.png';
            
            // Lógica de Estado Visual
            let estadoHtml = '';
            if (cantidad > 0.001) {
                estadoHtml = `<span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-green-900/40 text-green-300 border border-green-500/30">Disponible</span>`;
            } else if (cantidad < -0.001) {
                estadoHtml = `<span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-900/40 text-red-300 border border-red-500/30">Negativo</span>`;
            } else {
                estadoHtml = `<span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-slate-500 border border-slate-700">Sin Stock</span>`;
            }

            // Nombre de caja: viene del JOIN en PHP (c.nombre) o fallback al select
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
                            onclick="window.location.href='kardex?divisa=${inv.divisa_id || inv.divisa}&caja=${filtros.caja.value}'" 
                            title="Ver Kardex">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
                    </button>
                </td>
            `;
            tablaInventario.appendChild(tr);
        });
    }

    // --- PAGINACIÓN ---
    function renderizarPaginacion(totalRegistros, porPagina, pagina) {
        conteoResultados.textContent = `Total: ${totalRegistros}`;
        paginationControls.innerHTML = '';

        const totalPaginas = Math.ceil(totalRegistros / porPagina);
        // Si no sabemos el total exacto (PHP devuelve array simple), asumimos lógica simple
        const hayMasPaginas = (totalRegistros >= porPagina); 

        // Botón Anterior
        const btnPrev = crearBotonPag('Anterior', pagina > 1, () => cambioPagina(pagina - 1));
        paginationControls.appendChild(btnPrev);

        // Indicador
        const span = document.createElement('span');
        span.className = "text-xs font-bold text-slate-400 px-2";
        // Si totalRegistros es un número "dummy" (ej. 9999), mostramos solo la página actual
        span.textContent = (totalRegistros === 9999) ? `Página ${pagina}` : `${pagina} / ${totalPaginas}`;
        paginationControls.appendChild(span);

        // Botón Siguiente
        // Si tenemos total exacto, usamos totalPaginas. Si no, usamos detección simple.
        const habilitarSiguiente = (totalRegistros === 9999) ? true : (pagina < totalPaginas);
        const btnNext = crearBotonPag('Siguiente', habilitarSiguiente, () => cambioPagina(pagina + 1));
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
        obtenerInventarios();
    }

    // --- EVENTOS ---
    const resetAndFetch = () => { paginaActual = 1; obtenerInventarios(); };

    if (borrarFiltrosBtn) {
        borrarFiltrosBtn.addEventListener('click', () => {
            if(filtros.divisaInput) filtros.divisaInput.value = '';
            if(filtros.buscar) filtros.buscar.value = '';
            if(filtros.mostrar) filtros.mostrar.value = '25';
            // Nota: No reseteamos la caja para no perder el contexto de trabajo
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
            // Si cambia la caja, reiniciamos paginación y filtro de divisa
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
});