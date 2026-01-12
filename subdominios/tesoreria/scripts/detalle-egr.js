import { 
    initSystem, 
    limpiarTexto, 
    formatearNumero, 
    formatearFechaHora, 
    mostrarModalError, 
    mostrarModalExitoso 
} from './index.js';

document.addEventListener('DOMContentLoaded', async () => {
    await initSystem('egresos');

    // Referencias DOM
    const lblId = document.getElementById('id-egreso');
    const badgeEstado = document.getElementById('badge-estado');
    const lblMonto = document.getElementById('monto-egreso');
    const lblDivisa = document.getElementById('divisa-egreso');
    const lblFecha = document.getElementById('fecha-egreso');
    const lblConcepto = document.getElementById('concepto-egreso');
    const lblTipo = document.getElementById('tipo-egreso');
    
    const lblCaja = document.getElementById('caja-origen');
    const lblUsuario = document.getElementById('usuario-responsable');
    const lblCuenta = document.getElementById('cuenta-destino');
    const lblObs = document.getElementById('observaciones');

    const btnAnular = document.getElementById('anular-egreso');
    const btnImprimir = document.getElementById('imprimir');
    const btnVolver = document.getElementById('volver-lista');

    // Modal Confirmar Anulación
    const modalConfirmar = document.getElementById('modal-confirmar');
    const btnCancelarAnular = document.getElementById('cancelar-anular');
    const btnConfirmarAnular = document.getElementById('confirmar-anular');

    const params = new URLSearchParams(window.location.search);
    const egresoId = params.get('id');

    if (!egresoId) {
        mostrarModalError({ titulo: "Error", mensaje: "ID de egreso no especificado." });
        return;
    }

    if (btnVolver) {
        btnVolver.addEventListener('click', () => {
            window.history.back(); // Volver inteligentemente a la anterior
        });
    }

    // --- CARGAR DATOS ---
    function cargarEgreso() {
        fetch(`https://cambiosorion.cl/data/detalle-egr.php?id=${egresoId}`)
            .then(res => res.json())
            .then(data => {
                if (data.error) throw new Error(data.error);

                const egreso = data.egreso; // Asegúrate que el PHP devuelve 'egreso' en singular

                // Header Info
                lblId.textContent = `#${egreso.id}`;
                lblMonto.textContent = formatearNumero(egreso.monto);
                lblDivisa.textContent = egreso.nombre_divisa || egreso.divisa_id;
                
                // Fecha con HTML (innerHTML porque formatearFechaHora devuelve tags)
                lblFecha.innerHTML = formatearFechaHora(egreso.fecha);

                // Estado
                const estado = String(egreso.estado).toLowerCase();
                badgeEstado.textContent = egreso.estado;
                if(estado === 'vigente') {
                    badgeEstado.className = "px-3 py-1 rounded-full text-xs font-bold uppercase bg-green-900/40 text-green-300 border border-green-500/30";
                    btnAnular.classList.remove('hidden');
                } else if(estado === 'anulado') {
                    badgeEstado.className = "px-3 py-1 rounded-full text-xs font-bold uppercase bg-red-900/40 text-red-300 border border-red-500/30";
                    btnAnular.classList.add('hidden');
                } else {
                    badgeEstado.className = "px-3 py-1 rounded-full text-xs font-bold uppercase bg-slate-800 text-slate-400 border border-slate-700";
                }

                // Detalles
                // El concepto puede ser el Cliente, o la Cuenta, o un texto libre
                const concepto = egreso.nombre_cliente || egreso.nombre_cuenta_destino || "Movimiento de Caja";
                lblConcepto.textContent = limpiarTexto(concepto);
                lblTipo.textContent = egreso.tipo_egreso || "Egreso General";

                lblCaja.textContent = egreso.caja_nombre || "Caja Desconocida"; // Ajustar key según PHP
                lblUsuario.textContent = egreso.usuario_nombre || "Desconocido"; // Ajustar key según PHP
                
                // Cuenta Destino (si existe)
                lblCuenta.textContent = egreso.nombre_cuenta_destino ? egreso.nombre_cuenta_destino : "N/A (Pago Directo)";

                lblObs.textContent = egreso.observaciones || "Sin observaciones.";

            })
            .catch(err => {
                console.error(err);
                mostrarModalError({ titulo: "Error", mensaje: "No se pudo cargar el egreso." });
            });
    }

    // --- ANULAR ---
    if (btnAnular) {
        btnAnular.addEventListener('click', () => modalConfirmar.classList.remove('hidden'));
        
        btnCancelarAnular.addEventListener('click', () => modalConfirmar.classList.add('hidden'));
        
        btnConfirmarAnular.addEventListener('click', () => {
            fetch(`https://cambiosorion.cl/data/detalle-egr.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'anular', id: egresoId })
            })
            .then(res => res.json())
            .then(data => {
                modalConfirmar.classList.add('hidden');
                if (data.success) {
                    mostrarModalExitoso({ titulo: "Anulado", mensaje: "El egreso ha sido anulado." });
                    cargarEgreso(); // Recargar para ver cambios
                } else {
                    throw new Error(data.message || "Error al anular.");
                }
            })
            .catch(err => {
                modalConfirmar.classList.add('hidden');
                mostrarModalError({ titulo: "Error", mensaje: err.message });
            });
        });
    }

    // --- IMPRIMIR ---
    if (btnImprimir) {
        btnImprimir.addEventListener('click', () => {
            window.print();
        });
    }

    cargarEgreso();
});