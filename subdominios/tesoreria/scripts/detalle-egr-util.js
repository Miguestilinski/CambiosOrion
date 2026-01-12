import { 
    initSystem, 
    limpiarTexto, 
    formatearNumero, 
    formatearFechaHora, 
    mostrarModalError, 
    mostrarModalExitoso 
} from './index.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Inicializar sistema (Sidebar, Sesión, Header)
    // El ID 'egresos-util' debe coincidir con el data-page en sidebar.html si quieres que se ilumine
    await initSystem('egresos-util');

    // Referencias DOM (Mapeadas al HTML nuevo)
    const lblId = document.getElementById('id-egreso');
    const badgeEstado = document.getElementById('badge-estado');
    const lblMonto = document.getElementById('monto-egreso');
    const lblDivisa = document.getElementById('divisa-egreso');
    const lblFecha = document.getElementById('fecha-egreso');
    
    // Campos específicos de utilidad
    const lblConcepto = document.getElementById('concepto-egreso'); // Mapea a item_utilidad
    const lblTipo = document.getElementById('tipo-egreso');
    
    const lblCaja = document.getElementById('caja-origen');
    const lblUsuario = document.getElementById('usuario-responsable');
    const lblCuenta = document.getElementById('cuenta-destino');
    const lblObs = document.getElementById('observaciones');

    // Botones
    const btnAnular = document.getElementById('anular-egreso');
    const btnImprimir = document.getElementById('imprimir');
    const btnVolver = document.getElementById('volver-lista');

    // Modal Confirmar Anulación (Estándar)
    const modalConfirmar = document.getElementById('modal-confirmar');
    const btnCancelarAnular = document.getElementById('cancelar-anular');
    const btnConfirmarAnular = document.getElementById('confirmar-anular');

    const params = new URLSearchParams(window.location.search);
    const egresoId = params.get('id');

    if (!egresoId) {
        mostrarModalError({ titulo: "Error", mensaje: "ID de retiro no especificado." });
        return;
    }

    if (btnVolver) {
        btnVolver.addEventListener('click', () => {
            window.history.back(); 
        });
    }

    // --- CARGAR DATOS ---
    function cargarEgreso() {
        // Usamos el mismo endpoint PHP que ya tenías
        fetch(`https://cambiosorion.cl/data/detalle-egr-util.php?id=${egresoId}`)
            .then(res => res.json())
            .then(data => {
                if (data.error) throw new Error(data.error);

                const egreso = data.egreso;

                // Header Info
                lblId.textContent = `#${egreso.id}`;
                lblMonto.textContent = formatearNumero(egreso.monto);
                lblDivisa.textContent = egreso.nombre_divisa || egreso.divisa_id;
                
                // Fecha
                lblFecha.innerHTML = formatearFechaHora(egreso.fecha);

                // Estado
                const estado = String(egreso.estado).toLowerCase();
                badgeEstado.textContent = egreso.estado;
                
                if(estado === 'vigente') {
                    // Verde/Amarillento para vigente normal en utilidades
                    badgeEstado.className = "px-3 py-1 rounded-full text-xs font-bold uppercase bg-green-900/40 text-green-300 border border-green-500/30";
                    if(btnAnular) btnAnular.classList.remove('hidden');
                } else if(estado === 'anulado') {
                    badgeEstado.className = "px-3 py-1 rounded-full text-xs font-bold uppercase bg-red-900/40 text-red-300 border border-red-500/30";
                    if(btnAnular) btnAnular.classList.add('hidden');
                } else {
                    badgeEstado.className = "px-3 py-1 rounded-full text-xs font-bold uppercase bg-slate-800 text-slate-400 border border-slate-700";
                }

                // Detalles Específicos
                // En utilidad, el concepto es el 'item_utilidad'
                lblConcepto.textContent = limpiarTexto(egreso.item_utilidad || "Sin concepto");
                lblTipo.textContent = egreso.tipo_egreso || "Retiro General";

                lblCaja.textContent = egreso.nombre_caja || "Caja Desconocida";
                lblUsuario.textContent = egreso.nombre_cajero || "Desconocido";
                
                // Cuenta Destino (Lógica para ver si es cuenta o efectivo)
                if (egreso.nombre_cuenta_destino) {
                    lblCuenta.textContent = `${egreso.nombre_cuenta_destino} (${egreso.moneda_cuenta || ''})`;
                    lblCuenta.classList.add('text-amber-400');
                } else {
                    lblCuenta.textContent = "N/A (Retiro en Efectivo)";
                    lblCuenta.classList.remove('text-amber-400');
                }

                lblObs.textContent = egreso.detalle || "Sin observaciones.";

            })
            .catch(err => {
                console.error(err);
                mostrarModalError({ titulo: "Error", mensaje: "No se pudo cargar la información del retiro." });
            });
    }

    // --- ANULAR ---
    if (btnAnular) {
        btnAnular.addEventListener('click', () => modalConfirmar.classList.remove('hidden'));
        
        btnCancelarAnular.addEventListener('click', () => modalConfirmar.classList.add('hidden'));
        
        btnConfirmarAnular.addEventListener('click', () => {
            fetch(`https://cambiosorion.cl/data/detalle-egr-util.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'anular', id: egresoId })
            })
            .then(res => res.json())
            .then(data => {
                modalConfirmar.classList.add('hidden');
                if (data.success) {
                    mostrarModalExitoso({ titulo: "Anulado", mensaje: "El retiro ha sido anulado y el dinero devuelto." });
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