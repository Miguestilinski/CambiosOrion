import { 
    initSystem, 
    limpiarTexto, 
    formatearNumero, 
    formatearFechaHora, 
    mostrarModalError 
} from './index.js';

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Inicializar sistema
    await initSystem('arqueo'); // Para iluminar el sidebar correcto

    // Referencias DOM
    const lblIdArqueo = document.getElementById('id-arqueo');
    const lblFecha = document.getElementById('fecha-arqueo');
    const lblCaja = document.getElementById('nombre-caja');
    const lblUsuario = document.getElementById('nombre-usuario');
    const lblObs = document.getElementById('observacion-arqueo');
    
    const tablaDetalle = document.getElementById('tabla-detalle');
    
    const btnPrev = document.getElementById('btn-dia-anterior');
    const btnNext = document.getElementById('btn-dia-siguiente');
    const btnVolver = document.getElementById('volver-historial');

    // Obtener ID de la URL
    const params = new URLSearchParams(window.location.search);
    let arqueoId = params.get('id');

    if (!arqueoId) {
        mostrarModalError({ titulo: "Error", mensaje: "ID de arqueo no especificado." });
        return;
    }

    if (btnVolver) {
        btnVolver.addEventListener('click', () => {
            window.location.href = 'https://tesoreria.cambiosorion.cl/historial-inv';
        });
    }

    // --- CARGAR DATOS ---
    function cargarDetalle(id) {
        // UI Loading
        tablaDetalle.innerHTML = `<tr><td colspan="5" class="text-center py-10"><div class="animate-spin h-8 w-8 border-4 border-amber-500 rounded-full border-t-transparent mx-auto"></div></td></tr>`;
        
        fetch(`https://cambiosorion.cl/data/detalle-arqueo.php?id=${id}`)
            .then(res => res.json())
            .then(data => {
                if(data.error) throw new Error(data.error);

                // 1. Llenar Cabecera
                const master = data.master;
                lblIdArqueo.textContent = `#${id}`;
                lblFecha.textContent = formatearFechaHora(master.fecha);
                lblCaja.textContent = master.nombre_caja || "Desconocida";
                lblUsuario.textContent = master.nombre_usuario || "Desconocido";
                lblObs.textContent = master.observacion || "Sin observaciones.";

                // 2. Llenar Detalles
                renderizarTabla(data.detalles || []);

                // 3. Configurar Navegación
                configurarNavegacion(data.navegacion);
            })
            .catch(err => {
                console.error(err);
                mostrarModalError({ titulo: "Error", mensaje: "No se pudo cargar el detalle del arqueo." });
                tablaDetalle.innerHTML = `<tr><td colspan="5" class="text-center text-red-400 py-4">Error al cargar datos.</td></tr>`;
            });
    }

    function renderizarTabla(detalles) {
        tablaDetalle.innerHTML = '';

        if (detalles.length === 0) {
            tablaDetalle.innerHTML = `<tr><td colspan="5" class="text-center text-slate-500 py-10 italic">Sin registros de divisas en este arqueo.</td></tr>`;
            return;
        }

        detalles.forEach(d => {
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-white/5 transition-all border-b border-white/5 last:border-0 text-slate-300';

            // Usar nombres correctos de la BD: total_sistema, total_arqueo
            const sist = parseFloat(d.total_sistema) || 0;
            const fis = parseFloat(d.total_arqueo) || 0;
            const dif = fis - sist; // Calculado al vuelo para precisión visual

            // Estilos Diferencia
            let difHtml = `<span class="text-slate-500 font-mono">-</span>`;
            if (dif > 0.001) {
                difHtml = `<span class="text-green-400 font-bold font-mono">+${formatearNumero(dif)}</span>`;
            } else if (dif < -0.001) {
                difHtml = `<span class="text-red-400 font-bold font-mono">${formatearNumero(dif)}</span>`;
            }

            // Desglose (Tooltip o expandible simple)
            let desgloseHtml = '';
            try {
                if(d.denominaciones) { // Ahora viene como 'denominaciones' en la BD
                    const json = JSON.parse(d.denominaciones);
                    // Solo mostramos icono si hay desglose real
                    if(Object.keys(json).length > 0) {
                        desgloseHtml = `<div class="group relative inline-block">
                            <svg class="w-4 h-4 text-amber-500 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            <div class="hidden group-hover:block absolute right-0 z-50 w-48 p-2 mt-1 text-xs text-white bg-slate-800 rounded-lg shadow-xl border border-slate-700">
                                <div class="font-bold border-b border-slate-600 pb-1 mb-1 text-amber-400">Desglose</div>
                                ${Object.entries(json).map(([k, v]) => `<div class="flex justify-between"><span>${k}:</span><span>${v}</span></div>`).join('')}
                            </div>
                        </div>`;
                    }
                }
            } catch(e) {}

            const iconoDivisa = d.icono || 'https://cambiosorion.cl/orionapp/icons/default.png';

            tr.innerHTML = `
                <td class="px-6 py-4 flex items-center gap-3">
                    <img src="${iconoDivisa}" class="w-6 h-6 rounded-full border border-slate-600 object-contain bg-slate-800 p-0.5" onerror="this.src='https://cambiosorion.cl/orionapp/icons/default.png'">
                    <span class="font-bold text-white text-sm">${limpiarTexto(d.nombre_divisa)}</span>
                </td>
                <td class="px-6 py-4 text-right font-mono text-slate-400 text-sm bg-slate-800/10">${formatearNumero(sist)}</td>
                <td class="px-6 py-4 text-right font-mono text-white font-bold text-sm bg-slate-800/30 border-l border-r border-slate-800/50">${formatearNumero(fis)}</td>
                <td class="px-6 py-4 text-right text-sm">${difHtml}</td>
                <td class="px-6 py-4 text-center">${desgloseHtml}</td>
            `;
            tablaDetalle.appendChild(tr);
        });
    }

    function configurarNavegacion(nav) {
        if (!nav) return;

        if (nav.prev_id) {
            btnPrev.disabled = false;
            btnPrev.onclick = () => {
                const newId = nav.prev_id;
                // Actualizar URL sin recargar
                window.history.pushState({id: newId}, '', `?id=${newId}`);
                cargarDetalle(newId);
            };
        } else {
            btnPrev.disabled = true;
            btnPrev.onclick = null;
        }

        if (nav.next_id) {
            btnNext.disabled = false;
            btnNext.onclick = () => {
                const newId = nav.next_id;
                window.history.pushState({id: newId}, '', `?id=${newId}`);
                cargarDetalle(newId);
            };
        } else {
            btnNext.disabled = true;
            btnNext.onclick = null;
        }
    }

    // Inicializar
    cargarDetalle(arqueoId);
});