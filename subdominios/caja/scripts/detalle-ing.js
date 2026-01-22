import { initCajaHeader } from './header.js';

document.addEventListener('DOMContentLoaded', async () => {
    
    // 1. Init
    await initCajaHeader('ingresos');

    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    const dom = {
        loader: document.getElementById('loading-skeleton'),
        content: document.getElementById('detalle-contenido'),
        
        // Campos
        id: document.getElementById('ing-id'),
        estado: document.getElementById('ing-estado'),
        fecha: document.getElementById('ing-fecha'),
        caja: document.getElementById('ing-caja'),
        usuario: document.getElementById('ing-usuario'),
        tipo: document.getElementById('ing-tipo'),
        cliente: document.getElementById('ing-cliente'),
        clienteRut: document.getElementById('ing-cliente-rut'),
        obs: document.getElementById('ing-obs'),
        
        // Financiero
        monto: document.getElementById('ing-monto'),
        nombreDivisa: document.getElementById('ing-nombre-divisa'),
        codigoDivisa: document.getElementById('ing-codigo-divisa'),
        iconoDivisa: document.getElementById('ing-icono-divisa'),
        
        // Botones y Modales
        btnVolver: document.getElementById('btn-volver'),
        btnImprimir: document.getElementById('btn-imprimir'),
        btnAnular: document.getElementById('btn-anular'),
        modalConfirmar: document.getElementById('modal-confirmar'),
        btnCancelarModal: document.getElementById('btn-cancelar-modal'),
        btnConfirmarModal: document.getElementById('btn-confirmar-modal'),
        modalExito: document.getElementById('modal-exito')
    };

    if (!id) {
        alert("ID no proporcionado");
        return;
    }

    // Navegación
    dom.btnVolver.onclick = () => window.location.href = 'ingresos.html';
    dom.btnImprimir.onclick = () => window.print();

    // Cargar Datos
    cargarDetalle();

    function cargarDetalle() {
        fetch(`https://cambiosorion.cl/data/detalle-ing-caja.php?id=${id}`)
            .then(res => res.json())
            .then(data => {
                if (data.error) throw new Error(data.error);
                renderizar(data);
            })
            .catch(err => {
                console.error(err);
                alert("Error al cargar: " + err.message);
            });
    }

    function renderizar(d) {
        dom.loader.classList.add('hidden');
        dom.content.classList.remove('hidden');
        dom.content.classList.add('fade-in');

        // Header
        dom.id.textContent = d.id;
        dom.fecha.textContent = d.fecha_formateada; // Viene del PHP ya lindo
        
        // Estado
        const estado = String(d.estado).toLowerCase();
        let estadoClass = "bg-gray-100 text-gray-600 border-gray-200";
        if (estado === 'vigente') {
            estadoClass = "bg-emerald-100 text-emerald-700 border-emerald-200";
            dom.btnAnular.classList.remove('hidden'); // Solo anular si es vigente
        } else if (estado === 'anulado') {
            estadoClass = "bg-red-100 text-red-700 border-red-200 line-through decoration-red-500";
            dom.btnAnular.classList.add('hidden');
        }
        dom.estado.textContent = d.estado;
        dom.estado.className = `px-3 py-1 rounded-full text-xs font-bold uppercase border ${estadoClass}`;

        // Info
        dom.caja.textContent = d.caja_nombre || `Caja #${d.caja_id}`;
        dom.usuario.textContent = d.usuario_nombre || 'Sistema';
        dom.tipo.textContent = d.tipo_ingreso;
        dom.cliente.textContent = d.cliente_nombre || 'No registrado';
        dom.clienteRut.textContent = d.cliente_rut || '';
        
        if (d.observaciones) {
            dom.obs.textContent = d.observaciones;
            dom.obs.classList.remove('italic', 'text-slate-400');
        }

        // Financiero
        const svgFallback = 'https://cambiosorion.cl/orionapp/icons/default.png'; // O tu SVG encoded
        dom.iconoDivisa.src = d.icono || svgFallback;
        dom.iconoDivisa.onerror = () => dom.iconoDivisa.src = svgFallback;
        
        dom.nombreDivisa.textContent = d.divisa_nombre;
        dom.codigoDivisa.textContent = d.divisa_codigo;
        
        // Formato Monto
        const montoVal = parseFloat(d.monto);
        dom.monto.textContent = montoVal.toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    }

    // --- LÓGICA ANULAR ---
    dom.btnAnular.onclick = () => dom.modalConfirmar.classList.remove('hidden');
    dom.btnCancelarModal.onclick = () => dom.modalConfirmar.classList.add('hidden');
    
    dom.btnConfirmarModal.onclick = async () => {
        dom.btnConfirmarModal.disabled = true;
        dom.btnConfirmarModal.textContent = "Procesando...";

        try {
            const res = await fetch('https://cambiosorion.cl/data/detalle-ing-caja.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'anular', id: id })
            });
            const result = await res.json();

            if (result.success) {
                dom.modalConfirmar.classList.add('hidden');
                dom.modalExito.classList.remove('hidden');
            } else {
                throw new Error(result.error || "Error al anular");
            }
        } catch (err) {
            alert(err.message);
            dom.btnConfirmarModal.disabled = false;
            dom.btnConfirmarModal.textContent = "Sí, Anular";
        }
    };
});