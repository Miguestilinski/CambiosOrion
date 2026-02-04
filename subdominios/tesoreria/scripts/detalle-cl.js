import { 
    initSystem, 
    limpiarTexto, 
    formatearNumero, 
    formatearFechaHora, 
    mostrarModalError,
    mostrarModalExitoso
} from './index.js';

document.addEventListener('DOMContentLoaded', async () => {
    await initSystem('clientes');

    // Referencias DOM Inputs
    const inputs = {
        razonSocial: document.getElementById('razon-social'),
        rut: document.getElementById('rut'),
        fono: document.getElementById('fono'),
        correo: document.getElementById('correo'),
        activo: document.getElementById('activo'),
        direccion: document.getElementById('direccion')
    };

    // Referencias Info
    const lblFechaIngreso = document.getElementById('fecha-ingreso');
    const badgeDoc = document.getElementById('badge-doc');
    const lblTotalOps = document.getElementById('total-ops');
    
    // Referencias Tabla
    const tablaOps = document.getElementById('tabla-operaciones');
    const inputFiltroOps = document.getElementById('filtrar-ops');

    // Botones
    const btnGuardar = document.getElementById('guardar-cambios');
    const btnVolver = document.getElementById('volver-lista');

    // Estado local
    let operacionesData = []; // Para filtrar localmente

    // Obtener ID
    const params = new URLSearchParams(window.location.search);
    const clienteId = params.get('id');

    if (!clienteId) {
        mostrarModalError({ titulo: "Error", mensaje: "ID de cliente no especificado." });
        return;
    }

    if (btnVolver) {
        btnVolver.addEventListener('click', () => {
            window.location.href = 'https://tesoreria.cambiosorion.cl/clientes';
        });
    }

    // --- CARGAR DATOS ---
    function cargarCliente() {
        fetch(`https://tesoreria.cambiosorion.cl/api/detalle-cl.php?id=${clienteId}`)
            .then(res => res.json())
            .then(data => {
                if (data.error) throw new Error(data.error);

                const cl = data.cliente;
                
                // Llenar formulario
                inputs.razonSocial.value = limpiarTexto(cl.razon_social);
                inputs.rut.value = limpiarTexto(cl.rut);
                inputs.fono.value = limpiarTexto(cl.fono);
                inputs.correo.value = limpiarTexto(cl.correo);
                inputs.direccion.value = limpiarTexto(cl.direccion);
                inputs.activo.value = cl.activo == 1 ? "1" : "0";

                // Llenar Info Lateral
                lblFechaIngreso.innerHTML = formatearFechaHora(cl.fecha_ingreso);
                
                // Badge Documentación
                const doc = cl.estado_documentacion || 'Pendiente';
                badgeDoc.textContent = doc;
                badgeDoc.className = doc === 'Completa' 
                    ? 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900/40 text-green-400 border border-green-500/30'
                    : 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-900/40 text-amber-400 border border-amber-500/30';

                // Operaciones
                operacionesData = data.operaciones || [];
                lblTotalOps.textContent = operacionesData.length;
                renderizarOperaciones(operacionesData);
            })
            .catch(err => {
                console.error(err);
                mostrarModalError({ titulo: "Error", mensaje: "No se pudo cargar la información del cliente." });
            });
    }

    // --- GUARDAR CAMBIOS ---
    if (btnGuardar) {
        btnGuardar.addEventListener('click', () => {
            const payload = {
                id: clienteId,
                razon_social: inputs.razonSocial.value,
                rut: inputs.rut.value,
                correo: inputs.correo.value,
                fono: inputs.fono.value,
                direccion: inputs.direccion.value,
                activo: inputs.activo.value === "1"
            };

            fetch("https://tesoreria.cambiosorion.cl/api/detalle-cl.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    mostrarModalExitoso({ titulo: "Guardado", mensaje: "Datos del cliente actualizados correctamente." });
                } else {
                    throw new Error(data.error || "Error al guardar.");
                }
            })
            .catch(err => {
                mostrarModalError({ titulo: "Error", mensaje: err.message });
            });
        });
    }

    // --- RENDERIZAR TABLA OPERACIONES ---
    function renderizarOperaciones(lista) {
        tablaOps.innerHTML = '';

        if (lista.length === 0) {
            tablaOps.innerHTML = `<tr><td colspan="8" class="text-center text-slate-500 py-10 italic">No hay operaciones registradas.</td></tr>`;
            return;
        }

        lista.forEach(op => {
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-white/5 transition-all border-b border-white/5 last:border-0 text-slate-300';

            // Estilos Tipo
            let tipoClass = "text-slate-400";
            if (op.tipo_transaccion === 'Compra') tipoClass = "text-emerald-400 font-bold";
            if (op.tipo_transaccion === 'Venta') tipoClass = "text-amber-400 font-bold";

            tr.innerHTML = `
                <td class="px-6 py-3 whitespace-nowrap text-xs">${formatearFechaHora(op.fecha)}</td>
                <td class="px-6 py-3 font-mono text-xs font-bold text-slate-500">#${op.id}</td>
                <td class="px-6 py-3 text-xs uppercase ${tipoClass}">${limpiarTexto(op.tipo_transaccion)}</td>
                <td class="px-6 py-3 text-center font-bold text-white text-xs">${limpiarTexto(op.divisa)}</td>
                <td class="px-6 py-3 text-right font-mono text-slate-300 text-sm">${formatearNumero(op.monto)}</td>
                <td class="px-6 py-3 text-right font-mono text-slate-500 text-xs">${formatearNumero(op.tasa_cambio)}</td>
                <td class="px-6 py-3 text-right font-bold font-mono text-white text-sm">$${formatearNumero(op.total)}</td>
                <td class="px-6 py-3 text-center text-xs uppercase text-slate-500">${limpiarTexto(op.estado)}</td>
            `;
            tablaOps.appendChild(tr);
        });
    }

    // --- FILTRO LOCAL ---
    if (inputFiltroOps) {
        inputFiltroOps.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase().trim();
            if (!term) {
                renderizarOperaciones(operacionesData);
                return;
            }

            const filtrados = operacionesData.filter(op => 
                String(op.id).includes(term) ||
                (op.divisa && op.divisa.toLowerCase().includes(term)) ||
                (op.tipo_transaccion && op.tipo_transaccion.toLowerCase().includes(term)) ||
                (op.estado && op.estado.toLowerCase().includes(term))
            );
            renderizarOperaciones(filtrados);
        });
    }

    // Inicializar
    cargarCliente();
});