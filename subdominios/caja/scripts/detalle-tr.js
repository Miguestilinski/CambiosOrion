import { initCajaHeader } from './header.js';

document.addEventListener('DOMContentLoaded', async () => {
    
    await initCajaHeader('transacciones');

    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    const dom = {
        loader: document.getElementById('loading-skeleton'),
        content: document.getElementById('detalle-contenido'),
        modal: document.getElementById('modal-error'),
        
        // Header
        titulo: document.getElementById('trx-titulo'),
        estado: document.getElementById('trx-estado'),
        fecha: document.getElementById('trx-fecha'),
        hora: document.getElementById('trx-hora'),
        
        // Operativa
        caja: document.getElementById('trx-caja'),
        vendedor: document.getElementById('trx-vendedor'),
        tipoDoc: document.getElementById('trx-tipo-doc'),
        numDoc: document.getElementById('trx-num-doc'),
        metodo: document.getElementById('trx-metodo'),
        
        // Cliente
        cliente: document.getElementById('trx-cliente'),
        clienteId: document.getElementById('trx-cliente-id'),
        obs: document.getElementById('trx-obs'),
        
        // Ticket Financiero
        tipoBadge: document.getElementById('trx-tipo-badge'),
        nombreDivisa: document.getElementById('trx-nombre-divisa'),
        codigoDivisa: document.getElementById('trx-codigo-divisa'),
        iconoDivisa: document.getElementById('trx-icono-divisa'),
        
        montoDivisa: document.getElementById('trx-monto-divisa'),
        tasaCambio: document.getElementById('trx-tasa-cambio'),
        totalClp: document.getElementById('trx-total-clp'),
        
        btnVolver: document.getElementById('btn-volver'),
        btnImprimir: document.getElementById('btn-imprimir')
    };

    if (!id) {
        mostrarError("ID Inválido", "No se proporcionó un ID.");
        return;
    }

    if (dom.btnVolver) dom.btnVolver.onclick = () => window.location.href = 'transacciones.html';
    if (dom.btnImprimir) dom.btnImprimir.onclick = () => window.print();

    cargarTransaccion(id);

    function cargarTransaccion(trxId) {
        fetch(`https://cambiosorion.cl/data/detalle-tr.php?id=${trxId}`)
            .then(res => res.json())
            .then(data => {
                if (data.error) throw new Error(data.error);
                renderizarDetalle(data);
            })
            .catch(err => {
                console.error(err);
                mostrarError("Error", "No se pudo cargar la transacción.");
            });
    }

    function renderizarDetalle(t) {
        if(dom.loader) dom.loader.classList.add('hidden');
        if(dom.content) {
            dom.content.classList.remove('hidden');
            dom.content.classList.add('fade-in');
        }

        // 1. Header
        if(dom.titulo) dom.titulo.textContent = `Transacción #${t.id}`;
        
        const dateObj = new Date(t.fecha.replace(/-/g, '/'));
        if(dom.fecha) dom.fecha.textContent = dateObj.toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        if(dom.hora) dom.hora.textContent = dateObj.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });

        // Estado
        const estado = String(t.estado).toLowerCase();
        let estadoClass = "bg-gray-100 text-gray-600 border-gray-200";
        if (estado === 'vigente') estadoClass = "bg-green-100 text-green-700 border-green-200";
        if (estado === 'anulado') estadoClass = "bg-red-100 text-red-700 border-red-200";
        
        if(dom.estado) {
            dom.estado.textContent = t.estado;
            dom.estado.className = `px-3 py-1 rounded-full text-xs font-bold uppercase border ${estadoClass}`;
        }

        // 2. Operativa
        if(dom.caja) dom.caja.textContent = t.nombre_caja || `Caja ${t.caja}`;
        if(dom.vendedor) dom.vendedor.textContent = t.nombre_vendedor;
        if(dom.tipoDoc) dom.tipoDoc.textContent = t.tipo_documento;
        if(dom.numDoc) dom.numDoc.textContent = t.numero_documento;
        if(dom.metodo) dom.metodo.textContent = t.metodo_pago;

        // 3. Cliente
        if(dom.cliente) dom.cliente.textContent = t.nombre_cliente;
        if(dom.clienteId) dom.clienteId.textContent = t.cliente_id ? t.cliente_id : 'S/I';
        if(dom.obs && t.observaciones) {
            dom.obs.textContent = t.observaciones;
            dom.obs.classList.remove('italic', 'text-slate-400');
        }

        // 4. Ticket Financiero
        const esCompra = String(t.tipo_transaccion).toLowerCase() === 'compra';
        // Badge simple
        if(dom.tipoBadge) {
            dom.tipoBadge.textContent = t.tipo_transaccion;
            // Compra: Verde / Venta: Azul (estandar Orion)
            const bgClass = esCompra ? 'bg-emerald-500 border-emerald-400' : 'bg-blue-500 border-blue-400';
            dom.tipoBadge.className = `${bgClass} text-white px-3 py-1 rounded text-[10px] font-bold uppercase tracking-widest border`;
        }

        if(dom.nombreDivisa) dom.nombreDivisa.textContent = t.nombre_divisa || 'Divisa';
        if(dom.codigoDivisa) dom.codigoDivisa.textContent = t.divisa_id;
        if(dom.iconoDivisa) dom.iconoDivisa.src = t.icono_divisa;

        // Símbolo Divisa (ej: US$)
        const symbol = t.simbolo_divisa || '$';

        if(dom.montoDivisa) dom.montoDivisa.textContent = `${symbol} ${formatSmart(t.monto)}`;
        if(dom.tasaCambio) dom.tasaCambio.textContent = `$ ${formatSmart(t.tasa_cambio)}`;
        
        if(dom.totalClp) dom.totalClp.textContent = "$" + formatSmart(t.total);
    }

    // Formateador sin decimales .00
    function formatSmart(num) {
        const n = parseFloat(num);
        if (isNaN(n)) return "0";
        return n.toLocaleString('es-CL', {
            minimumFractionDigits: 0, 
            maximumFractionDigits: 2 
        });
    }

    function mostrarError(titulo, mensaje) {
        if(dom.loader) dom.loader.classList.add('hidden');
        const modal = document.getElementById('modal-error');
        if(modal) {
            document.getElementById('modal-error-titulo').textContent = titulo;
            document.getElementById('modal-error-mensaje').textContent = mensaje;
            modal.classList.remove('hidden');
            document.getElementById('modal-error-confirmar').onclick = () => window.location.href = 'transacciones.html';
        } else {
            alert(mensaje);
        }
    }
});