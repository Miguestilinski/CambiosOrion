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

    function renderTabla(datos) {
        tablaInventario.innerHTML = '';
        
        if (datos.length === 0) {
            tablaInventario.innerHTML = `<tr><td colspan="6" class="px-6 py-8 text-center text-slate-500 italic">No hay existencias registradas.</td></tr>`;
            return;
        }

        const cajaActualId = selectCaja.value; // Capturamos la caja que se está viendo

        datos.forEach(item => {
            const tr = document.createElement('tr');
            tr.className = "bg-slate-900 border-b border-slate-800 hover:bg-slate-800 transition group";

            // Icono
            let iconoHtml = `<div class="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500 text-xs font-bold">${item.divisa_codigo ? item.divisa_codigo.substring(0,2) : '??'}</div>`;
            if(item.divisa_icono) {
                iconoHtml = `<img src="${item.divisa_icono}" class="w-8 h-8 rounded-full border border-slate-600 object-cover bg-slate-800">`;
            }

            tr.innerHTML = `
                <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                        ${iconoHtml}
                        <div>
                            <div class="font-bold text-white text-sm">${item.divisa_nombre}</div>
                            <div class="text-xs text-slate-500 font-mono">${item.divisa_codigo}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 text-right font-mono text-white font-bold">${formatearNumero(item.cantidad)}</td>
                <td class="px-6 py-4 text-right font-mono text-slate-400 text-xs">$${formatearNumero(item.pmp)}</td>
                <td class="px-6 py-4 text-right font-mono text-amber-500 font-bold">$${formatearNumero(item.total_clp)}</td>
                <td class="px-6 py-4 text-center">
                    <span class="px-2 py-1 rounded text-[10px] font-bold uppercase bg-slate-800 border border-slate-700 text-slate-400">
                        ${item.caja_nombre || 'Caja'}
                    </span>
                </td>
                <td class="px-6 py-4 text-center">
                    <button class="text-slate-400 hover:text-amber-400 transition p-2 rounded-full hover:bg-white/5"
                            onclick="window.location.href='detalle-div?id=${item.divisa_id}&caja_id=${cajaActualId}'"
                            title="Ver Movimientos / Kardex">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
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