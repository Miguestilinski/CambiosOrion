import { 
    initSystem, 
    limpiarTexto, 
    formatearNumero, 
    formatearFechaHora, 
    mostrarModalError, 
    mostrarModalExitoso 
} from './index.js';

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Inicializar sistema (Sidebar, Sesión, Header)
    // Usamos 'ingresos' para marcar activo el link en sidebar
    await initSystem('ingresos');

    // Referencias DOM
    const lblId = document.getElementById('id-ingreso');
    const badgeEstado = document.getElementById('badge-estado');
    const lblMonto = document.getElementById('monto-ingreso');
    const lblDivisa = document.getElementById('divisa-ingreso');
    const lblFecha = document.getElementById('fecha-ingreso');
    
    const lblCliente = document.getElementById('cliente-ingreso');
    const lblTipo = document.getElementById('tipo-ingreso');
    
    const lblCaja = document.getElementById('caja-destino');
    const lblUsuario = document.getElementById('usuario-responsable');
    
    // Contenedor Cuentas
    const infoCuentas = document.getElementById('info-cuentas');
    const lblCuentaOrigen = document.getElementById('cuenta-origen');
    const lblCuentaDestino = document.getElementById('cuenta-destino');

    const lblObs = document.getElementById('observaciones');

    // Botones
    const btnAnular = document.getElementById('anular-ingreso');
    const btnImprimir = document.getElementById('imprimir');
    const btnVolver = document.getElementById('volver-lista');

    // Modal Confirmar Anulación
    const modalConfirmar = document.getElementById('modal-confirmar');
    const btnCancelarAnular = document.getElementById('cancelar-anular');
    const btnConfirmarAnular = document.getElementById('confirmar-anular');

    const params = new URLSearchParams(window.location.search);
    const ingresoId = params.get('id');

    if (!ingresoId) {
        mostrarModalError({ titulo: "Error", mensaje: "ID de ingreso no especificado." });
        return;
    }

    if (btnVolver) {
        btnVolver.addEventListener('click', () => {
            window.history.back(); 
        });
    }

    // --- CARGAR DATOS ---
    function cargarIngreso() {
        fetch(`https://cambiosorion.cl/data/detalle-ing.php?id=${ingresoId}`)
            .then(res => res.json())
            .then(data => {
                if (data.error) throw new Error(data.error);

                const ingreso = data.ingreso;

                // Header Info
                lblId.textContent = `#${ingreso.id}`;
                lblMonto.textContent = formatearNumero(ingreso.monto);
                lblDivisa.textContent = ingreso.nombre_divisa || ingreso.divisa_id;
                
                // Fecha
                lblFecha.innerHTML = formatearFechaHora(ingreso.fecha);

                // Estado
                const estado = String(ingreso.estado).toLowerCase();
                badgeEstado.textContent = ingreso.estado;
                
                if(estado === 'vigente') {
                    // Estilo Verde para Ingreso Vigente
                    badgeEstado.className = "px-3 py-1 rounded-full text-xs font-bold uppercase bg-emerald-900/40 text-emerald-300 border border-emerald-500/30";
                    if(btnAnular) btnAnular.classList.remove('hidden');
                } else if(estado === 'anulado') {
                    badgeEstado.className = "px-3 py-1 rounded-full text-xs font-bold uppercase bg-red-900/40 text-red-300 border border-red-500/30";
                    if(btnAnular) btnAnular.classList.add('hidden');
                } else {
                    badgeEstado.className = "px-3 py-1 rounded-full text-xs font-bold uppercase bg-slate-800 text-slate-400 border border-slate-700";
                }

                // Detalles Principales
                lblCliente.textContent = limpiarTexto(ingreso.nombre_cliente || "Cliente General");
                lblTipo.textContent = ingreso.tipo_ingreso || "Ingreso General";

                lblCaja.textContent = ingreso.nombre_caja || "Caja Desconocida";
                lblUsuario.textContent = ingreso.nombre_cajero || "Desconocido";
                
                // Lógica Cuentas vs Efectivo
                if (ingreso.tipo_ingreso === 'Cuenta') {
                    infoCuentas.classList.remove('hidden');
                    lblCuentaOrigen.textContent = `Origen: ${ingreso.nombre_cuenta_origen || 'N/A'}`;
                    lblCuentaDestino.textContent = `Destino: ${ingreso.nombre_cuenta_destino || 'N/A'}`;
                } else {
                    infoCuentas.classList.add('hidden');
                }

                lblObs.textContent = ingreso.detalle || "Sin observaciones.";

            })
            .catch(err => {
                console.error(err);
                mostrarModalError({ titulo: "Error", mensaje: "No se pudo cargar la información del ingreso." });
            });
    }

    // --- ANULAR ---
    if (btnAnular) {
        btnAnular.addEventListener('click', () => modalConfirmar.classList.remove('hidden'));
        
        btnCancelarAnular.addEventListener('click', () => modalConfirmar.classList.add('hidden'));
        
        btnConfirmarAnular.addEventListener('click', () => {
            fetch(`https://cambiosorion.cl/data/detalle-ing.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'anular', id: ingresoId })
            })
            .then(res => res.json())
            .then(data => {
                modalConfirmar.classList.add('hidden');
                if (data.success) {
                    mostrarModalExitoso({ titulo: "Anulado", mensaje: "El ingreso ha sido anulado correctamente." });
                    cargarIngreso(); // Recargar para ver cambios
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

    cargarIngreso();
});