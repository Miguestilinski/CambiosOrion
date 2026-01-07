import { 
    initSystem, 
    limpiarTexto, 
    formatearNumero, 
    formatearFechaHora, 
    mostrarModalError 
} from './index.js';

let usuarioSesion = null;

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Inicializar sistema
    const sessionData = await initSystem('traspasos');
    if (sessionData) {
        usuarioSesion = sessionData;
        obtenerTraspasos();
    }

    // Referencias DOM
    const tablaTraspasos = document.getElementById('tabla-traspasos');
    const conteoResultados = document.getElementById('conteo-resultados');
    const paginationControls = document.getElementById('pagination-controls');
    
    const nuevoTpBtn = document.getElementById('nuevo-tp');
    const borrarFiltrosBtn = document.getElementById('borrar-filtros');

    let paginaActual = 1;

    // Filtros
    const filtros = {
        numero: document.getElementById('numero'),
        fecha: document.getElementById('fecha'),
        origen: document.getElementById('origen'),
        destino: document.getElementById('destino'),
        divisa: document.getElementById('divisa'),
        estado: document.getElementById('estado'),
        mostrar: document.getElementById('mostrar-registros')
    };

    if (nuevoTpBtn) {
        nuevoTpBtn.addEventListener('click', () => {
            window.location.href = 'https://tesoreria.cambiosorion.cl/nuevo-tp';
        });
    }

    // --- FETCH DATOS ---
    function obtenerTraspasos() {
        const params = new URLSearchParams();

        if (filtros.numero.value) params.set('numero', filtros.numero.value.trim());
        if (filtros.fecha.value) params.set('fecha', filtros.fecha.value);
        if (filtros.origen.value) params.set('origen', filtros.origen.value.trim());
        if (filtros.destino.value) params.set('destino', filtros.destino.value.trim());
        if (filtros.divisa.value) params.set('divisa', filtros.divisa.value.trim());
        if (filtros.estado.value) params.set('estado', filtros.estado.value);
        
        // El PHP de traspasos recibe 'caja_id' para filtrar permisos, si es 99 (Tesorero) ve todo
        if (usuarioSesion) params.set('caja_id', usuarioSesion.caja_id);

        // Spinner Ámbar
        tablaTraspasos.innerHTML = `<tr><td colspan="9" class="text-center py-10"><div class="animate-spin h-8 w-8 border-4 border-amber-500 rounded-full border-t-transparent mx-auto"></div></td></tr>`;

        fetch(`https://cambiosorion.cl/data/traspasos.php?${params.toString()}`)
            .then(res => res.json())
            .then(response => {
                // traspasos.php devuelve { exito: true, data: [...] }
                const lista = response.data || [];
                // La paginación en este endpoint parece ser frontend o limitada, asumiremos lista completa por ahora
                // Si el PHP implementa paginación real, ajustaríamos aquí.
                
                renderizarTabla(lista);
                conteoResultados.textContent = `Total: ${lista.length} registros`;
                paginationControls.innerHTML = ''; // Limpiar paginación si no la trae el backend
            })
            .catch(error => {
                console.error('Error:', error);
                tablaTraspasos.innerHTML = `<tr><td colspan="9" class="text-center text-red-400 py-4">Error de conexión.</td></tr>`;
            });
    }

    // --- RENDERIZADO ---
    function renderizarTabla(traspasos) {
        tablaTraspasos.innerHTML = '';

        if (traspasos.length === 0) {
            tablaTraspasos.innerHTML = `<tr><td colspan="9" class="text-center text-slate-500 py-10 italic">No se encontraron traspasos.</td></tr>`;
            return;
        }

        traspasos.forEach(row => {
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-white/5 transition-all border-b border-white/5 last:border-0 text-slate-300';

            // Estados
            let estadoClass = "bg-slate-800 text-slate-400 border border-slate-700";
            const est = String(row.estado).toLowerCase();
            if(est === 'completado') estadoClass = "bg-green-900/40 text-green-300 border border-green-500/30";
            if(est === 'pendiente') estadoClass = "bg-amber-900/40 text-amber-300 border border-amber-500/30";
            if(est === 'anulado' || est === 'rechazado') estadoClass = "bg-red-900/40 text-red-300 border border-red-500/30";

            // Botón Acción
            const btnVer = document.createElement('button');
            btnVer.innerHTML = `<svg class="w-5 h-5 text-slate-400 hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>`;
            btnVer.className = 'flex items-center justify-center p-1.5 bg-white/5 rounded-full hover:bg-amber-600 shadow-sm border border-transparent transition-all mx-auto';
            btnVer.onclick = (e) => {
                e.stopPropagation();
                // Si tienes detalle, redirigir. Si no, quizas solo un alert o modal simple.
                // window.location.href = `detalle-traspaso?id=${row.id}`; 
                alert(`Detalle Traspaso #${row.id} pendiente de implementación.`);
            };

            tr.innerHTML = `
                <td class="px-4 py-3 whitespace-nowrap text-xs">${formatearFechaHora(row.fecha)}</td>
                <td class="px-4 py-3 font-mono text-xs font-bold text-slate-500">${limpiarTexto(row.id)}</td>
                <td class="px-4 py-3 font-semibold text-sm text-slate-300 truncate max-w-[150px]">${limpiarTexto(row.origen)}</td>
                <td class="px-4 py-3 text-center">
                    <svg class="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                </td>
                <td class="px-4 py-3 font-semibold text-sm text-white truncate max-w-[150px]">${limpiarTexto(row.destino)}</td>
                <td class="px-4 py-3 text-center font-bold text-amber-400 text-xs">${limpiarTexto(row.divisa)}</td>
                <td class="px-4 py-3 text-right font-bold font-mono text-white text-sm">${formatearNumero(row.monto)}</td>
                <td class="px-4 py-3 text-center">
                    <span class="px-2 py-0.5 rounded text-[10px] uppercase font-bold ${estadoClass}">${limpiarTexto(row.estado)}</span>
                </td>
                <td class="px-4 py-3 text-center cell-action"></td>
            `;

            tr.querySelector('.cell-action').appendChild(btnVer);
            tablaTraspasos.appendChild(tr);
        });
    }

    // --- EVENTOS ---
    const resetAndFetch = () => { obtenerTraspasos(); };

    borrarFiltrosBtn.addEventListener('click', () => {
        Object.values(filtros).forEach(input => {
            if(!input) return;
            input.value = '';
            if(input._flatpickr) input._flatpickr.clear();
        });
        resetAndFetch();
    });

    Object.values(filtros).forEach(input => {
        if(input) {
            input.addEventListener('input', resetAndFetch);
            input.addEventListener('change', resetAndFetch);
        }
    });
});