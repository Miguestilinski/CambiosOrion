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
        
        // Cliente
        cliente: document.getElementById('trx-cliente'),
        clienteId: document.getElementById('trx-cliente-id'),
        
        // Doc & Caja
        tipoDoc: document.getElementById('trx-tipo-doc'),
        numDoc: document.getElementById('trx-num-doc'),
        caja: document.getElementById('trx-caja'),
        vendedor: document.getElementById('trx-vendedor'),
        metodo: document.getElementById('trx-metodo'),
        obs: document.getElementById('trx-obs'),
        
        // Financiero (La parte importante)
        tipoBadge: document.getElementById('trx-tipo-badge'),
        iconoDivisa: document.getElementById('trx-icono-divisa'),
        nombreDivisa: document.getElementById('trx-nombre-divisa'),
        codigoDivisa: document.getElementById('trx-codigo-divisa'),
        
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

        // 1. Datos Header
        if(dom.titulo) dom.titulo.textContent = `Transacción #${t.id}`;
        
        // Formateo Fecha y Hora separados
        const dateObj = new Date(t.fecha.replace(/-/g, '/')); // Fix compatibilidad Safari
        if(dom.fecha) dom.fecha.textContent = dateObj.toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        if(dom.hora) dom.hora.textContent = dateObj.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });

        // Estado
        const estado = String(t.estado).toLowerCase();
        let estadoClass = "bg-gray-100 text-gray-600 border-gray-200";
        if (estado === 'vigente') estadoClass = "bg-green-100 text-green-700 border-green-300 shadow-green-100";
        if (estado === 'anulado') estadoClass = "bg-red-100 text-red-700 border-red-300 shadow-red-100";
        
        if(dom.estado) {
            dom.estado.textContent = t.estado;
            dom.estado.className = `px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border shadow-sm ${estadoClass}`;
        }

        // 2. Cliente y Caja
        if(dom.cliente) dom.cliente.textContent = t.nombre_cliente;
        if(dom.clienteId) dom.clienteId.textContent = t.cliente_id ? t.cliente_id : 'S/I';
        
        if(dom.tipoDoc) dom.tipoDoc.textContent = t.tipo_documento;
        if(dom.numDoc) dom.numDoc.textContent = t.numero_documento;
        
        if(dom.caja) dom.caja.textContent = t.nombre_caja || `Caja ${t.caja}`;
        if(dom.vendedor) dom.vendedor.textContent = t.nombre_vendedor || 'Sistema'; // Aquí va el nombre real
        if(dom.metodo) dom.metodo.textContent = t.metodo_pago;
        if(dom.obs) dom.obs.textContent = t.observaciones;

        // 3. Ficha Financiera (Colores Dinámicos)
        const esCompra = String(t.tipo_transaccion).toLowerCase() === 'compra';
        const colorTema = esCompra ? 'emerald' : 'cyan'; // Verde para Compra, Cyan para Venta
        
        // Badge Tipo
        if(dom.tipoBadge) {
            dom.tipoBadge.textContent = t.tipo_transaccion;
            dom.tipoBadge.className = `px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest bg-${colorTema}-100 text-${colorTema}-700 border border-${colorTema}-200`;
        }

        // Divisa
        if(dom.iconoDivisa) dom.iconoDivisa.src = t.icono_divisa;
        if(dom.nombreDivisa) dom.nombreDivisa.textContent = t.nombre_divisa || 'Divisa Desconocida';
        if(dom.codigoDivisa) dom.codigoDivisa.textContent = t.divisa_id;

        // Montos (Formateo Inteligente)
        // Usamos el símbolo de la divisa extranjera si existe
        const simboloExt = t.simbolo_divisa || '$';
        
        if(dom.montoDivisa) {
            dom.montoDivisa.innerHTML = `<span class="text-lg text-slate-400 mr-1">${simboloExt}</span> ${formatSmart(t.monto)}`;
        }
        
        if(dom.tasaCambio) {
            dom.tasaCambio.textContent = formatSmart(t.tasa_cambio);
        }
        
        if(dom.totalClp) {
            dom.totalClp.textContent = "$" + formatSmart(t.total);
            dom.totalClp.className = `text-3xl font-black tracking-tight text-${colorTema}-700`;
        }
    }

    // --- Helper: Formateo Inteligente (Sin decimales .00 innecesarios) ---
    function formatSmart(num) {
        const n = parseFloat(num);
        if (isNaN(n)) return "0";
        
        // Si el número es entero (ej: 5000.00), lo muestra como 5.000
        // Si tiene decimales (ej: 177.50), lo muestra como 177,5
        return n.toLocaleString('es-CL', {
            minimumFractionDigits: 0, 
            maximumFractionDigits: 2 
        });
    }

    function mostrarError(titulo, mensaje) {
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