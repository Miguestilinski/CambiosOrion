import { 
    initSystem, 
    limpiarTexto, 
    formatearNumero, 
    formatearFechaHora, 
    mostrarModalError 
} from './index.js';

document.addEventListener('DOMContentLoaded', async () => {
    await initSystem('arqueo'); 

    // Referencias
    const lblIdArqueo = document.getElementById('id-arqueo');
    const lblFecha = document.getElementById('fecha-arqueo');
    const lblCaja = document.getElementById('nombre-caja');
    const lblUsuario = document.getElementById('nombre-usuario');
    const lblObs = document.getElementById('observacion-arqueo');
    const tablaDetalle = document.getElementById('tabla-detalle');
    const btnPrev = document.getElementById('btn-dia-anterior');
    const btnNext = document.getElementById('btn-dia-siguiente');
    const btnVolver = document.getElementById('volver-historial');

    // Referencias Modal Desglose
    const modalDesglose = document.getElementById('modal-desglose');
    const contenidoDesglose = document.getElementById('contenido-desglose');
    const tituloDesglose = document.getElementById('desglose-titulo-divisa');
    const totalDesglose = document.getElementById('desglose-total');
    const btnCerrarDesglose = document.getElementById('cerrar-desglose');
    const btnCerrarModal = document.getElementById('btn-cerrar-modal');

    // Cerrar modal
    const cerrarModal = () => modalDesglose.classList.add('hidden');
    if(btnCerrarDesglose) btnCerrarDesglose.onclick = cerrarModal;
    if(btnCerrarModal) btnCerrarModal.onclick = cerrarModal;
    // Cerrar con Escape
    document.addEventListener('keydown', (e) => { if(e.key === 'Escape') cerrarModal(); });

    // Obtener ID
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

    // --- LÓGICA PRINCIPAL ---

    function cargarDetalle(id) {
        tablaDetalle.innerHTML = `<tr><td colspan="5" class="text-center py-10"><div class="animate-spin h-8 w-8 border-4 border-amber-500 rounded-full border-t-transparent mx-auto"></div></td></tr>`;
        
        fetch(`https://cambiosorion.cl/data/detalle-arqueo.php?id=${id}`)
            .then(res => res.json())
            .then(data => {
                if(data.error) throw new Error(data.error);

                // Header
                const master = data.master;
                lblIdArqueo.textContent = `#${id}`;
                lblFecha.innerHTML = formatearFechaHora(master.fecha);
                lblCaja.textContent = master.nombre_caja || "Desconocida";
                lblUsuario.textContent = master.nombre_usuario || "Desconocido";
                lblObs.textContent = master.observacion || "Sin observaciones.";

                // Tabla
                renderizarTabla(data.detalles || []);

                // Navegación
                configurarNavegacion(data.navegacion);
            })
            .catch(err => {
                console.error(err);
                mostrarModalError({ titulo: "Error", mensaje: "No se pudo cargar el detalle." });
                tablaDetalle.innerHTML = `<tr><td colspan="5" class="text-center text-red-400 py-4">Error al cargar datos.</td></tr>`;
            });
    }

    function renderizarTabla(detalles) {
        tablaDetalle.innerHTML = '';

        if (detalles.length === 0) {
            tablaDetalle.innerHTML = `<tr><td colspan="5" class="text-center text-slate-500 py-10 italic">Sin registros.</td></tr>`;
            return;
        }

        detalles.forEach(d => {
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-white/5 transition-all border-b border-white/5 last:border-0 text-slate-300';

            const sist = parseFloat(d.total_sistema) || 0;
            const fis = parseFloat(d.total_arqueo) || 0;
            const dif = fis - sist;

            // Estilos Diferencia
            let difHtml = `<span class="text-slate-500 font-mono">-</span>`;
            if (dif > 0.001) {
                difHtml = `<span class="text-green-400 font-bold font-mono">+${formatearNumero(dif)}</span>`;
            } else if (dif < -0.001) {
                difHtml = `<span class="text-red-400 font-bold font-mono">${formatearNumero(dif)}</span>`;
            }

            // Validar si hay desglose para mostrar botón
            let tieneDesglose = false;
            let desgloseData = {};
            try {
                if (d.denominaciones) {
                    desgloseData = JSON.parse(d.denominaciones);
                    if (Object.keys(desgloseData).length > 0) tieneDesglose = true;
                }
            } catch(e) {}

            const iconoDivisa = d.icono || 'https://cambiosorion.cl/orionapp/icons/default.png';

            // Construcción segura del HTML
            tr.innerHTML = `
                <td class="px-6 py-4 flex items-center gap-3">
                    <img src="${iconoDivisa}" class="w-6 h-6 rounded-full border border-slate-600 object-contain bg-slate-800 p-0.5" onerror="this.src='https://cambiosorion.cl/orionapp/icons/default.png'">
                    <span class="font-bold text-white text-sm">${limpiarTexto(d.nombre_divisa)}</span>
                </td>
                <td class="px-6 py-4 text-right font-mono text-slate-400 text-sm bg-slate-800/10">${formatearNumero(sist)}</td>
                <td class="px-6 py-4 text-right font-mono text-white font-bold text-sm bg-slate-800/30 border-l border-r border-slate-800/50">${formatearNumero(fis)}</td>
                <td class="px-6 py-4 text-right text-sm">${difHtml}</td>
                <td class="px-6 py-4 text-center action-cell"></td>
            `;

            // Insertar botón de forma segura (sin strings rotos)
            if (tieneDesglose) {
                const btnVer = document.createElement('button');
                btnVer.className = "text-xs font-bold text-amber-500 hover:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 rounded border border-amber-500/30 transition flex items-center mx-auto gap-1";
                btnVer.innerHTML = `<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg> Ver`;
                
                btnVer.onclick = () => abrirModalDesglose(d.nombre_divisa, desgloseData, fis);
                
                tr.querySelector('.action-cell').appendChild(btnVer);
            } else {
                tr.querySelector('.action-cell').innerHTML = `<span class="text-slate-600 text-xs">-</span>`;
            }

            tablaDetalle.appendChild(tr);
        });
    }

    // --- MODAL DESGLOSE ---
    function abrirModalDesglose(nombreDivisa, datos, totalFisico) {
        tituloDesglose.textContent = `Detalle: ${nombreDivisa}`;
        totalDesglose.textContent = formatearNumero(totalFisico);
        contenidoDesglose.innerHTML = '';

        Object.entries(datos).forEach(([denominacion, cantidad]) => {
            const row = document.createElement('div');
            row.className = "flex justify-between items-center p-2 bg-slate-800 rounded border border-slate-700/50";
            
            // Intentar calcular subtotal si la denominación es numérica
            const valorUnitario = parseFloat(denominacion.replace(/[^0-9.]/g, '')) || 0;
            const subtotal = valorUnitario * cantidad;
            const textoSubtotal = subtotal > 0 ? `<span class="text-xs text-slate-500 font-mono">(${formatearNumero(subtotal)})</span>` : '';

            row.innerHTML = `
                <div class="flex items-center gap-2">
                    <span class="text-slate-300 font-medium text-sm bg-slate-700 px-2 py-0.5 rounded">${denominacion}</span>
                </div>
                <div class="flex items-center gap-2">
                    ${textoSubtotal}
                    <span class="text-white font-bold font-mono">x ${cantidad}</span>
                </div>
            `;
            contenidoDesglose.appendChild(row);
        });

        modalDesglose.classList.remove('hidden');
    }

    // --- NAVEGACIÓN ---
    function configurarNavegacion(nav) {
        if (!nav) return;

        if (nav.prev_id) {
            btnPrev.disabled = false;
            btnPrev.onclick = () => {
                window.history.pushState({id: nav.prev_id}, '', `?id=${nav.prev_id}`);
                cargarDetalle(nav.prev_id);
            };
        } else {
            btnPrev.disabled = true;
            btnPrev.onclick = null;
        }

        if (nav.next_id) {
            btnNext.disabled = false;
            btnNext.onclick = () => {
                window.history.pushState({id: nav.next_id}, '', `?id=${nav.next_id}`);
                cargarDetalle(nav.next_id);
            };
        } else {
            btnNext.disabled = true;
            btnNext.onclick = null;
        }
    }

    // Inicializar
    cargarDetalle(arqueoId);
});