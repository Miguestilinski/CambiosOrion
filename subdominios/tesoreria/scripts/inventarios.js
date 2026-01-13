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

    // Objeto Filtros
    const filtros = {
        caja: selectCaja,
        divisaInput: document.getElementById('divisa-input'),
        buscar: document.getElementById('buscar'),
        mostrar: document.getElementById('mostrar-registros')
    };

    // --- 2. FUNCIONES DE LÓGICA ---

    function cargarDivisas() {
        // (Tu lógica de carga de divisas existente o usar endpoint nuevo si prefieres)
        // Por ahora lo dejamos simple o asumimos que ya funciona
    }

    function obtenerInventario() {
        const params = new URLSearchParams();
        params.set('page', paginaActual);
        
        if (filtros.caja.value) params.set('caja', filtros.caja.value);
        if (filtros.divisaInput.value) params.set('divisa', filtros.divisaInput.value);
        if (filtros.buscar.value) params.set('buscar', filtros.buscar.value);
        if (filtros.mostrar.value) params.set('limit', filtros.mostrar.value);

        tablaInventario.innerHTML = `
            <tr class="animate-pulse">
                <td colspan="6" class="px-6 py-8 text-center text-slate-500">
                    <div class="flex justify-center items-center gap-2">
                        <svg class="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                        Calculando saldos...
                    </div>
                </td>
            </tr>`;

        fetch(`https://cambiosorion.cl/data/inventarios.php?${params.toString()}`)
            .then(res => {
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                return res.json();
            })
            .then(json => {
                if (json.error) throw new Error(json.error);
                
                // VALIDACIÓN: Asegurar que data sea un array
                const lista = Array.isArray(json.data) ? json.data : [];
                
                renderTabla(lista);
                renderPaginacion(json.page || 1, json.totalPages || 1);
                
                if(conteoResultados) conteoResultados.textContent = `Mostrando ${lista.length} de ${json.total || 0} registros`;
            })
            .catch(err => {
                console.error("Error fetch:", err);
                tablaInventario.innerHTML = `<tr><td colspan="6" class="px-6 py-4 text-center text-red-400">Error: ${err.message}</td></tr>`;
            });
    }

    // --- RENDERIZADO DE TABLA (AQUÍ ESTÁ EL CAMBIO) ---
    function renderTabla(datos) {
        tablaInventario.innerHTML = '';
        
        // Validación extra por seguridad
        if (!datos || datos.length === 0) {
            tablaInventario.innerHTML = `<tr><td colspan="6" class="px-6 py-8 text-center text-slate-500 italic">No hay existencias registradas con estos filtros.</td></tr>`;
            return;
        }

        // 1. CAPTURAR EL CONTEXTO (ID DE CAJA ACTUAL)
        const cajaActualId = selectCaja.value || '99';

        datos.forEach(item => {
            const tr = document.createElement('tr');
            tr.className = "bg-slate-900 border-b border-slate-800 hover:bg-slate-800 transition group";

            // Icono Divisa
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
                <td class="px-6 py-4 text-right font-mono text-white font-bold text-sm">${formatearNumero(item.cantidad)}</td>
                <td class="px-6 py-4 text-right font-mono text-slate-400 text-xs">$${formatearNumero(item.pmp)}</td>
                <td class="px-6 py-4 text-right font-mono text-amber-500 font-bold text-sm">$${formatearNumero(item.total_clp)}</td>
                <td class="px-6 py-4 text-center">
                    <span class="px-2 py-1 rounded text-[10px] font-bold uppercase bg-slate-800 border border-slate-700 text-slate-400">
                        ${item.caja_nombre || 'Caja'}
                    </span>
                </td>
                <td class="px-6 py-4 text-center">
                    <button class="text-slate-400 hover:text-amber-400 transition p-2 rounded-full hover:bg-white/5"
                            onclick="window.location.href='detalle-div?id=${item.divisa_id}&caja_id=${cajaActualId}'"
                            title="Ver Kardex / Historial en esta Caja">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
                    </button>
                </td>
            `;
            tablaInventario.appendChild(tr);
        });
    }

    function renderPaginacion(pagina, totalPaginas) {
        paginationControls.innerHTML = '';
        if (totalPaginas <= 1) return;

        const crearBtn = (texto, disabled, fn) => {
            const b = document.createElement('button');
            b.innerHTML = texto;
            b.className = `px-3 py-1 text-xs font-medium rounded-md border transition ${disabled ? 'bg-slate-800 text-slate-600 border-slate-700 cursor-not-allowed' : 'bg-slate-800 text-slate-300 border-slate-600 hover:bg-slate-700 hover:text-white hover:border-amber-500'}`;
            b.disabled = disabled;
            b.onclick = fn;
            return b;
        };

        paginationControls.appendChild(crearBtn('<', pagina === 1, () => cambioPagina(pagina - 1)));
        
        const span = document.createElement('span');
        span.className = "text-xs font-bold text-slate-400 px-2";
        span.textContent = `${pagina} / ${totalPaginas}`;
        paginationControls.appendChild(span);
        
        paginationControls.appendChild(crearBtn('>', pagina === totalPaginas, () => cambioPagina(pagina + 1)));
    }

    function cambioPagina(nuevaPagina) {
        paginaActual = nuevaPagina;
        obtenerInventario();
    }

    // --- EVENTOS ---
    const resetAndFetch = () => { paginaActual = 1; obtenerInventario(); };

    borrarFiltrosBtn.addEventListener('click', () => {
        filtros.divisaInput.value = '';
        filtros.buscar.value = '';
        filtros.mostrar.value = '25';
        // Resetear caja al default (99 Tesoreria) o mantener la del usuario
        if (usuarioSesion && usuarioSesion.caja_id && usuarioSesion.caja_id != 99) {
            filtros.caja.value = usuarioSesion.caja_id;
        } else {
            filtros.caja.value = '99'; 
        }
        resetAndFetch();
    });

    if (exportarBtn) {
        exportarBtn.addEventListener('click', () => {
            const params = new URLSearchParams();
            if (filtros.caja.value) params.set("caja", filtros.caja.value);
            if (filtros.divisaInput.value) params.set("divisa", filtros.divisaInput.value);
            if (filtros.buscar.value) params.set("buscar", filtros.buscar.value);
            
            window.open(`https://cambiosorion.cl/data/exportar_inventario.php?${params.toString()}`, '_blank');
        });
    }

    Object.values(filtros).forEach(input => {
        if(input) {
            input.addEventListener(input === filtros.caja ? 'change' : 'input', resetAndFetch);
        }
    });

    // --- 4. INICIALIZACIÓN ---
    const sessionData = await initSystem('inventarios');
    
    if (sessionData) {
        usuarioSesion = sessionData;
        if (selectCaja) {
            // Cargar cajas disponibles (si no están hardcoded en HTML)
            try {
                const res = await fetch('https://cambiosorion.cl/data/nueva-op.php?buscar_cajas=1');
                const cajas = await res.json();
                selectCaja.innerHTML = ''; // Limpiar
                cajas.forEach(c => {
                    const opt = document.createElement('option');
                    opt.value = c.id; 
                    opt.textContent = c.nombre;
                    selectCaja.appendChild(opt);
                });

                // Seleccionar caja del usuario por defecto
                if (usuarioSesion.caja_id && usuarioSesion.caja_id != 0) {
                    selectCaja.value = usuarioSesion.caja_id;
                } else {
                    selectCaja.value = '99'; // Default Tesorería
                }
            } catch(e) { console.error("Error cargando cajas", e); }
        }
        obtenerInventario();
    }
});