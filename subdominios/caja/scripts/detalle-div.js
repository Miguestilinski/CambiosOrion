import { initCajaHeader } from './header.js';

document.addEventListener('DOMContentLoaded', async () => {
    
    // 1. Inicializar Header (contexto 'inventario' para marcar sidebar)
    const sessionData = await initCajaHeader('inventario');

    // 2. Obtener parámetros URL
    const params = new URLSearchParams(window.location.search);
    const divisaId = params.get('id');
    
    // Prioridad: parámetro URL > sesión > error
    const cajaId = params.get('caja_id') || (sessionData ? sessionData.caja_id : null);

    if (!divisaId) {
        mostrarModalError({ titulo: "Error", mensaje: "Identificador de divisa no válido." });
        return;
    }

    if (!cajaId) {
        mostrarModalError({ titulo: "Aviso", mensaje: "No se detectó una caja activa para filtrar movimientos." });
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

    if (refs.btnVolver) refs.btnVolver.addEventListener('click', () => window.location.href = 'inventario.html');

    // 4. Cargar Datos desde el Backend existente (Reutilizamos detalle-div.php en modo GET)
    cargarDetalleDivisa();

    function cargarDetalleDivisa() {
        const url = `https://cambiosorion.cl/data/detalle-div.php?id=${divisaId}&caja_id=${cajaId}`;

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

                // Estado
                const activa = (d.estado === 'Habilitada' || d.estado == 1);
                refs.badgeEstado.textContent = activa ? 'Activa' : 'Inactiva';
                refs.badgeEstado.className = `text-xs font-bold uppercase px-3 py-1 rounded-full border ${activa ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`;

                // Historial
                if (refs.infoCajaActual) {
                    refs.infoCajaActual.textContent = data.caja_filtrada_nombre ? `Caja: ${data.caja_filtrada_nombre}` : `Caja ID: ${cajaId}`;
                }
                
                renderizarMovimientos(data.operaciones || []);
            })
            .catch(err => {
                console.error(err);
                mostrarModalError({ titulo: "Error de carga", mensaje: "No se pudo cargar la información de la divisa." });
            });
    }

    function renderizarMovimientos(lista) {
        refs.tablaMovimientos.innerHTML = '';
        refs.totalMovimientos.textContent = `${lista.length} registros recientes`;

        if (lista.length === 0) {
            refs.tablaMovimientos.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-gray-400 italic">No hay movimientos registrados en esta caja.</td></tr>`;
            return;
        }

        lista.forEach(op => {
            const esCompra = op.tipo_transaccion === 'Compra';
            const tipoClass = esCompra 
                ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
                : 'bg-blue-100 text-blue-700 border-blue-200';
            
            const tr = document.createElement('tr');
            tr.className = "hover:bg-gray-50 border-b border-gray-100 transition last:border-0";
            
            // Formateo de fecha y hora
            const [fecha, hora] = (op.fecha || ' ').split(' ');

            tr.innerHTML = `
                <td class="px-5 py-3">
                    <div class="font-bold text-gray-700 text-xs">${fecha}</div>
                    <div class="text-[10px] text-gray-400 font-mono flex items-center gap-1">
                        ${hora} <span class="bg-gray-200 px-1 rounded text-gray-600">#${op.id}</span>
                    </div>
                </td>
                <td class="px-5 py-3 text-xs text-gray-600">
                    <div class="font-medium">${limpiarTexto(op.nombre_cliente || 'Cliente General')}</div>
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

    // Helpers
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