import { initCajaHeader } from './header.js';

document.addEventListener('DOMContentLoaded', async () => {
    
    // 1. Inicializar sistema (Header, Sidebar, Sesión)
    await initCajaHeader('transacciones');

    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    const dom = {
        loader: document.getElementById('loading-skeleton'),
        content: document.getElementById('detalle-contenido'),
        modal: document.getElementById('modal-error'),
        
        titulo: document.getElementById('trx-titulo'),
        estado: document.getElementById('trx-estado'),
        fecha: document.getElementById('trx-fecha'),
        totalClp: document.getElementById('trx-total-clp'),
        
        cliente: document.getElementById('trx-cliente'),
        clienteId: document.getElementById('trx-cliente-id'),
        tipoDoc: document.getElementById('trx-tipo-doc'),
        numDoc: document.getElementById('trx-num-doc'),
        caja: document.getElementById('trx-caja'),
        vendedor: document.getElementById('trx-vendedor'),
        metodo: document.getElementById('trx-metodo'),
        obs: document.getElementById('trx-obs'),
        
        tipo: document.getElementById('trx-tipo'),
        divisa: document.getElementById('trx-divisa'),
        monto: document.getElementById('trx-monto'),
        tasa: document.getElementById('trx-tasa'),
        totalFinal: document.getElementById('trx-total-final'),
        
        btnVolver: document.getElementById('btn-volver'),
        btnImprimir: document.getElementById('btn-imprimir')
    };

    if (!id) {
        mostrarError("ID Inválido", "No se proporcionó un identificador de transacción.");
        return;
    }

    // Configurar botones
    dom.btnVolver.onclick = () => window.location.href = 'transacciones.html';
    dom.btnImprimir.onclick = () => window.print();

    // Fetch Datos
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
                mostrarError("Error al cargar", "No se pudo obtener la información de la transacción. " + err.message);
            });
    }

    function renderizarDetalle(t) {
        // Ocultar loader, mostrar contenido
        dom.loader.classList.add('hidden');
        dom.content.classList.remove('hidden');
        dom.content.classList.add('fade-in');

        // Encabezado
        dom.titulo.textContent = `Transacción #${t.id}`;
        dom.fecha.textContent = formatearFechaCompleta(t.fecha);
        dom.totalClp.textContent = formatCurrency(t.total);

        // Estado (Estilos)
        const estado = String(t.estado).toLowerCase();
        let estadoClass = "bg-gray-100 text-gray-600 border-gray-200";
        if (estado === 'vigente') estadoClass = "bg-green-100 text-green-700 border-green-200";
        if (estado === 'anulado') estadoClass = "bg-red-100 text-red-700 border-red-200";
        
        dom.estado.textContent = t.estado;
        dom.estado.className = `px-3 py-1 rounded-full text-xs font-bold uppercase border ${estadoClass}`;

        // Info General
        dom.cliente.textContent = t.nombre_cliente || 'Cliente General';
        dom.clienteId.textContent = t.cliente_id ? `ID: ${t.cliente_id}` : 'Sin ID registrado';
        dom.tipoDoc.textContent = t.tipo_documento || '-';
        dom.numDoc.textContent = t.numero_documento || 'N/A';
        dom.caja.textContent = `Caja #${t.caja || '?'}`;
        dom.vendedor.textContent = `Vendedor ID: ${t.vendedor || '?'}`; // Si el backend devuelve nombre, mejor
        dom.metodo.textContent = t.metodo_pago;
        
        if (t.observaciones) {
            dom.obs.textContent = t.observaciones;
            dom.obs.classList.remove('italic', 'text-slate-400');
        }

        // Info Financiera
        const esCompra = String(t.tipo_transaccion).toLowerCase() === 'compra';
        dom.tipo.textContent = t.tipo_transaccion;
        dom.tipo.className = `text-lg font-bold px-4 py-1 rounded-full border uppercase ${esCompra ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-blue-100 text-blue-700 border-blue-200'}`;

        dom.divisa.textContent = t.divisa_id; // Ej: USD
        dom.monto.textContent = formatNumber(t.monto);
        dom.tasa.textContent = formatNumber(t.tasa_cambio);
        dom.totalFinal.textContent = formatCurrency(t.total);
    }

    // --- Helpers ---
    function formatNumber(num) {
        if (!num) return '0.00';
        return parseFloat(num).toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function formatCurrency(num) {
        if (!num) return '$0';
        return '$' + parseInt(num).toLocaleString('es-CL');
    }

    function formatearFechaCompleta(fechaStr) {
        if (!fechaStr) return '';
        const d = new Date(fechaStr);
        if (isNaN(d.getTime())) return fechaStr; // Fallback si no es parseable
        return d.toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' }) + 
               ' - ' + d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
    }

    function mostrarError(titulo, mensaje) {
        const titleEl = document.getElementById('modal-error-titulo');
        const msgEl = document.getElementById('modal-error-mensaje');
        const btn = document.getElementById('modal-error-confirmar');
        
        if (titleEl) titleEl.textContent = titulo;
        if (msgEl) msgEl.textContent = mensaje;
        
        if (dom.modal) dom.modal.classList.remove('hidden');
        
        if (btn) btn.onclick = () => window.location.href = 'transacciones.html';
    }
});