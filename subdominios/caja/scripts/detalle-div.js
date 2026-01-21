import { 
    initCajaHeader // Usamos el header de caja
} from './header.js';

document.addEventListener('DOMContentLoaded', async () => {
    
    // 1. Obtener parámetros y definir Origen
    const params = new URLSearchParams(window.location.search);
    const divisaId = params.get('id');
    const origin = params.get('origin') || 'inventario'; // Por defecto: inventario

    // Configuración dinámica según origen
    let sidebarActive = 'inventario';
    let backUrl = 'inventario.html';
    let backText = 'Volver al Inventario';

    if (origin === 'divisas') {
        sidebarActive = 'divisas';
        backUrl = 'divisas.html';
        backText = 'Volver a Divisas';
    }

    // 2. Inicializar Header con el contexto correcto
    const sessionData = await initCajaHeader(sidebarActive);

    // Prioridad Caja ID: URL > Session > Null
    const cajaId = params.get('caja_id') || (sessionData ? sessionData.caja_id : null);

    if (!divisaId) {
        alert("Error: ID de divisa no especificado");
        window.history.back();
        return;
    }

    // 3. Referencias DOM
    const refs = {
        tituloNombre: document.getElementById('titulo-nombre'),
        tituloCodigo: document.getElementById('titulo-codigo'),
        iconoImg: document.getElementById('icono-img'),
        infoPais: document.getElementById('info-pais'),
        infoSimbolo: document.getElementById('info-simbolo'),
        infoFraccionable: document.getElementById('info-fraccionable'),
        infoDenominacion: document.getElementById('info-denominacion'),
        badgeEstado: document.getElementById('badge-estado'),
        tablaMovimientos: document.getElementById('tabla-movimientos'),
        totalMovimientos: document.getElementById('total-movimientos'),
        infoCajaActual: document.getElementById('info-caja-actual'),
        btnVolver: document.getElementById('volver-lista')
    };

    // 4. Configurar Botón Volver
    if (refs.btnVolver) {
        // Mantenemos el icono SVG, actualizamos solo el texto
        const iconSvg = `<div class="bg-white group-hover:bg-cyan-50 p-1.5 rounded-lg mr-2 transition border border-gray-300 group-hover:border-cyan-200 shadow-sm">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                        </div>`;
        refs.btnVolver.innerHTML = `${iconSvg} ${backText}`;
        refs.btnVolver.onclick = () => window.location.href = backUrl;
    }

    // 5. Cargar Datos (Solo lectura)
    cargarDetalleCaja();

    function cargarDetalleCaja() {
        if (!cajaId) {
            // Si viene de divisas pero no tiene caja asignada, mostramos aviso pero cargamos info básica si es posible
            console.warn("No hay caja activa para mostrar historial.");
        }

        const url = `https://cambiosorion.cl/data/detalle-div-caja.php?id=${divisaId}&caja_id=${cajaId || 0}`;

        fetch(url)
            .then(res => res.json())
            .then(data => {
                if (data.error) throw new Error(data.error);

                const d = data.divisa;
                
                // Llenar Ficha
                refs.tituloNombre.textContent = d.nombre;
                refs.tituloCodigo.textContent = d.codigo;
                refs.infoPais.textContent = d.pais || '-';
                refs.infoSimbolo.textContent = d.simbolo || '-';
                refs.infoFraccionable.textContent = (d.fraccionable == 1) ? 'Sí' : 'No';
                refs.infoDenominacion.textContent = d.denominacion || 'N/A';
                
                if (d.icono) refs.iconoImg.src = d.icono;
                else refs.iconoImg.src = 'https://cambiosorion.cl/orionapp/icons/default.png';

                const activa = (d.estado === 'Habilitada' || d.estado == 1);
                refs.badgeEstado.textContent = activa ? 'Activa' : 'Inactiva';
                refs.badgeEstado.className = `text-xs font-bold uppercase px-3 py-1 rounded-full border ${activa ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`;

                // Info Caja
                if (data.caja_info && refs.infoCajaActual) {
                    refs.infoCajaActual.textContent = data.caja_info.nombre;
                } else if (!cajaId) {
                    refs.infoCajaActual.textContent = "Vista General (Sin Caja)";
                    refs.infoCajaActual.className = "text-[10px] font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded";
                }

                renderizarMovimientos(data.operaciones || []);
            })
            .catch(err => {
                console.error(err);
                mostrarModalError({ titulo: "Error", mensaje: "No se pudo cargar la información." });
            });
    }

    function renderizarMovimientos(lista) {
        refs.tablaMovimientos.innerHTML = '';
        refs.totalMovimientos.textContent = `${lista.length} registros recientes`;

        if (lista.length === 0) {
            refs.tablaMovimientos.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-gray-400 italic">No hay movimientos registrados en esta caja para esta divisa.</td></tr>`;
            return;
        }

        lista.forEach(op => {
            const esCompra = String(op.tipo_transaccion).toLowerCase() === 'compra';
            const tipoClass = esCompra 
                ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
                : 'bg-blue-100 text-blue-700 border-blue-200';
            
            const tr = document.createElement('tr');
            tr.className = "hover:bg-gray-50 border-b border-gray-100 transition last:border-0";
            
            tr.style.cursor = "pointer";
            tr.onclick = () => window.location.href = `detalle-op?id=${op.id}`;

            tr.innerHTML = `
                <td class="px-5 py-3">
                    <div class="font-bold text-gray-700 text-xs">${op.fecha}</div>
                    <div class="text-[10px] text-gray-400 font-mono">#${op.id}</div>
                </td>
                <td class="px-5 py-3 text-xs text-gray-600">
                    <div class="font-medium">${limpiarTexto(op.nombre_cliente)}</div>
                </td>
                <td class="px-5 py-3 text-center">
                    <span class="text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${tipoClass}">${op.tipo_transaccion}</span>
                </td>
                <td class="px-5 py-3 text-right font-mono text-gray-800 text-xs font-medium">
                    ${formatearNumero(op.monto)}
                </td>
                <td class="px-5 py-3 text-right font-mono text-gray-500 text-[10px]">
                    ${formatearNumero(op.tasa_cambio)}
                </td>
                <td class="px-5 py-3 text-right font-mono text-cyan-700 text-xs font-bold">
                    $${formatearNumero(op.total)}
                </td>
            `;
            refs.tablaMovimientos.appendChild(tr);
        });
    }

    function formatearNumero(num) {
        if (num === null || num === undefined) return '0.00';
        return parseFloat(num).toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function limpiarTexto(t) {
        if(!t) return '';
        return t.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    function mostrarModalError({ titulo, mensaje }) {
        const modal = document.getElementById("modal-error");
        if(modal) {
            document.getElementById("modal-error-titulo").textContent = titulo;
            document.getElementById("modal-error-mensaje").textContent = mensaje;
            const btn = document.getElementById("modal-error-confirmar");
            
            modal.classList.remove("hidden");
            btn.onclick = () => modal.classList.add("hidden");
        } else {
            alert(`${titulo}: ${mensaje}`);
        }
    }
});