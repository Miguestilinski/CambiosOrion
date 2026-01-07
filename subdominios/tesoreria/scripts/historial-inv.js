import { 
    initSystem, 
    limpiarTexto, 
    formatearFechaHora,
    mostrarModalError 
} from './index.js';

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Inicializar sistema
    await initSystem('arqueo'); // Usamos 'arqueo' para que se ilumine esa sección en sidebar

    // --- Referencias ---
    const tablaHistorial = document.getElementById('tabla-historial');
    const conteoResultados = document.getElementById('conteo-resultados');
    const paginationControls = document.getElementById('pagination-controls');
    
    const borrarFiltrosBtn = document.getElementById('borrar-filtros');
    const volverBtn = document.getElementById('volver-cuadratura');
    const selectCaja = document.getElementById('caja');

    let paginaActual = 1;

    // Filtros
    const filtros = {
        fechaInicio: document.getElementById("fecha-inicio"),
        fechaFin: document.getElementById("fecha-fin"),
        caja: selectCaja,
        buscar: document.getElementById("buscar"),
        mostrar: document.getElementById("mostrar-registros")
    };

    if (volverBtn) {
        volverBtn.addEventListener('click', () => {
            window.location.href = 'https://tesoreria.cambiosorion.cl/arqueo';
        });
    }

    // --- CARGAR CAJAS ---
    async function cargarCajas() {
        try {
            const res = await fetch("https://cambiosorion.cl/data/historial-inv.php?action=cajas");
            const cajas = await res.json();
            
            if (Array.isArray(cajas)) {
                selectCaja.innerHTML = '<option value="">Todas</option>';
                cajas.forEach(c => {
                    const opt = document.createElement('option');
                    opt.value = c.id;
                    opt.textContent = c.nombre;
                    selectCaja.appendChild(opt);
                });
            }
        } catch (e) {
            console.error("Error cargando cajas", e);
        }
    }

    // --- FETCH DATOS ---
    function obtenerHistorial() {
        const params = new URLSearchParams();

        if (filtros.fechaInicio.value) params.set('fecha_inicio', filtros.fechaInicio.value);
        if (filtros.fechaFin.value) params.set('fecha_fin', filtros.fechaFin.value);
        if (filtros.caja.value) params.set('caja_id', filtros.caja.value);
        if (filtros.buscar.value) params.set('buscar', filtros.buscar.value.trim());
        
        const limit = parseInt(filtros.mostrar.value) || 25;
        const offset = (paginaActual - 1) * limit;
        params.set('limit', limit);
        params.set('offset', offset);

        // Spinner
        if(tablaHistorial) {
            tablaHistorial.innerHTML = `<tr><td colspan="7" class="text-center py-10"><div class="animate-spin h-8 w-8 border-4 border-amber-500 rounded-full border-t-transparent mx-auto"></div></td></tr>`;
        }

        fetch(`https://cambiosorion.cl/data/historial-inv.php?${params.toString()}`)
            .then(res => res.json())
            .then(data => {
                const lista = data.data || []; // Ajustar según lo que devuelva tu PHP (usualmente data o historial)
                const total = parseInt(data.total) || lista.length;

                renderizarTabla(lista);
                renderizarPaginacion(total, limit, paginaActual);
            })
            .catch(error => {
                console.error('Error:', error);
                if(tablaHistorial) tablaHistorial.innerHTML = `<tr><td colspan="7" class="text-center text-red-400 py-4">Error de conexión.</td></tr>`;
            });
    }

    // --- RENDERIZADO ---
    function renderizarTabla(lista) {
        if(!tablaHistorial) return;
        tablaHistorial.innerHTML = '';

        if (lista.length === 0) {
            tablaHistorial.innerHTML = `<tr><td colspan="7" class="text-center text-slate-500 py-10 italic">No se encontraron arqueos.</td></tr>`;
            return;
        }

        lista.forEach(row => {
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-white/5 transition-all border-b border-white/5 last:border-0 text-slate-300';

            // Cálculo visual de diferencia total (si viene en el query, sino 0)
            const diff = parseFloat(row.total_diferencia) || 0;
            let diffHtml = '';
            if (Math.abs(diff) < 1) {
                diffHtml = `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900/40 text-green-400 border border-green-500/30">
                                <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> 
                                Cuadrado
                            </span>`;
            } else {
                diffHtml = `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-900/40 text-red-400 border border-red-500/30">
                                ${diff > 0 ? '+' : ''}${diff.toLocaleString('es-CL')}
                            </span>`;
            }

            // Botón Acción
            const btnVer = document.createElement('button');
            btnVer.innerHTML = `<svg class="w-5 h-5 text-slate-400 hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>`;
            btnVer.className = 'flex items-center justify-center p-1.5 bg-white/5 rounded-full hover:bg-amber-600 shadow-sm border border-transparent transition-all mx-auto';
            btnVer.onclick = (e) => {
                e.stopPropagation();
                // Redirigir a detalle de arqueo
                window.location.href = `detalle-arqueo?id=${row.id}`; 
            };

            tr.innerHTML = `
                <td class="px-4 py-3 whitespace-nowrap text-xs">${formatearFechaHora(row.fecha)}</td>
                <td class="px-4 py-3 font-mono text-xs font-bold text-slate-500">${limpiarTexto(row.id)}</td>
                <td class="px-4 py-3 text-sm text-white font-semibold">${limpiarTexto(row.nombre_caja)}</td>
                <td class="px-4 py-3 text-xs text-slate-400">${limpiarTexto(row.nombre_usuario)}</td>
                <td class="px-4 py-3 text-xs text-slate-500 italic max-w-[200px] truncate">${limpiarTexto(row.observacion)}</td>
                <td class="px-4 py-3 text-center">${diffHtml}</td>
                <td class="px-4 py-3 text-center cell-action"></td>
            `;

            tr.querySelector('.cell-action').appendChild(btnVer);
            tablaHistorial.appendChild(tr);
        });
    }

    // --- PAGINACIÓN ---
    function renderizarPaginacion(totalRegistros, porPagina, pagina) {
        if(!conteoResultados || !paginationControls) return;
        conteoResultados.textContent = `Total: ${totalRegistros}`;
        paginationControls.innerHTML = '';

        const totalPaginas = Math.ceil(totalRegistros / porPagina);
        if (totalPaginas <= 1) return;

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
        span.textContent = `${pagina} / ${totalPaginas}`;
        paginationControls.appendChild(span);
        paginationControls.appendChild(crearBtn('Siguiente', pagina === totalPaginas, () => cambioPagina(pagina + 1)));
    }

    function cambioPagina(nuevaPagina) {
        paginaActual = nuevaPagina;
        obtenerHistorial();
    }

    // --- EVENTOS ---
    const resetAndFetch = () => { paginaActual = 1; obtenerHistorial(); };

    if(borrarFiltrosBtn) {
        borrarFiltrosBtn.addEventListener('click', () => {
            filtros.fechaInicio.value = '';
            filtros.fechaFin.value = '';
            filtros.caja.value = '';
            filtros.buscar.value = '';
            filtros.mostrar.value = '25';
            resetAndFetch();
        });
    }

    Object.values(filtros).forEach(input => {
        if(input) {
            input.addEventListener('input', resetAndFetch);
            input.addEventListener('change', resetAndFetch);
        }
    });

    // Carga inicial
    await cargarCajas();
    obtenerHistorial();
});