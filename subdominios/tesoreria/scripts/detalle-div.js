import { 
    initSystem, 
    limpiarTexto, 
    formatearNumero, 
    mostrarModalError,
    mostrarModalExitoso
} from './index.js';

document.addEventListener('DOMContentLoaded', async () => {
    await initSystem('divisas');

    // 1. Parametros URL
    const params = new URLSearchParams(window.location.search);
    const divisaId = params.get('id');
    const cajaId = params.get('caja_id'); // Parámetro opcional para el contexto

    // 2. Referencias Formulario
    const inputs = {
        nombre: document.getElementById('nombre'),
        codigo: document.getElementById('codigo'),
        simbolo: document.getElementById('simbolo'),
        estado: document.getElementById('estado'),
        iconoUrl: document.getElementById('icono-url')
    };
    const imgPreview = document.getElementById('icono-preview');
    const textoPreview = document.getElementById('icono-texto');
    const btnGuardar = document.getElementById('guardar-cambios');
    const btnVolver = document.getElementById('volver-lista');
    
    // Referencias Historial
    const tablaMovimientos = document.getElementById('tabla-movimientos');
    const totalMovimientos = document.getElementById('total-movimientos');
    const badgeFiltroCaja = document.getElementById('badge-filtro-caja');
    const infoFiltroCaja = document.getElementById('info-filtro-caja');

    if (!divisaId) {
        mostrarModalError({ titulo: "Error", mensaje: "ID no especificado" });
        return;
    }

    if (btnVolver) btnVolver.addEventListener('click', () => window.history.back());

    // --- MODO LECTURA (Si venimos de inventario) ---
    if (cajaId) {
        // Bloquear inputs para que sea solo una ficha informativa
        Object.values(inputs).forEach(inp => {
            inp.disabled = true;
            inp.classList.add('opacity-50', 'cursor-not-allowed');
        });
        // Ocultar botón guardar
        if(btnGuardar) btnGuardar.classList.add('hidden');
        // Mostrar badge visual
        if(badgeFiltroCaja) badgeFiltroCaja.classList.remove('hidden');
    }

    // --- CARGAR DATOS ---
    function cargarDatos() {
        let url = `https://cambiosorion.cl/data/detalle-div.php?id=${divisaId}`;
        if (cajaId) url += `&caja_id=${cajaId}`;

        fetch(url)
            .then(res => res.json())
            .then(data => {
                if (data.error) throw new Error(data.error);

                const d = data.divisa;
                
                // Llenar Formulario
                inputs.nombre.value = d.nombre;
                inputs.codigo.value = d.codigo;
                inputs.simbolo.value = d.simbolo;
                inputs.estado.value = (d.estado === 'Habilitada' || d.estado == 1) ? "1" : "0";
                inputs.iconoUrl.value = d.icono || '';

                if (d.icono) {
                    imgPreview.src = d.icono;
                    imgPreview.classList.remove('hidden');
                    textoPreview.classList.add('hidden');
                }

                // Llenar Historial
                const operaciones = data.operaciones || [];
                renderizarHistorial(operaciones, data.caja_filtrada_nombre); // Asumimos que el backend podría mandar el nombre de la caja, si no, usamos el ID
            })
            .catch(err => {
                console.error(err);
                mostrarModalError({ titulo: "Error", mensaje: "No se pudo cargar la información." });
            });
    }

    function renderizarHistorial(lista, nombreCaja) {
        tablaMovimientos.innerHTML = '';
        totalMovimientos.textContent = `${lista.length} registros`;

        if (cajaId && infoFiltroCaja) {
            infoFiltroCaja.classList.remove('hidden');
            infoFiltroCaja.textContent = nombreCaja ? `Caja: ${nombreCaja}` : `Caja ID: ${cajaId}`;
        }

        if (lista.length === 0) {
            tablaMovimientos.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-slate-500 italic">No hay movimientos registrados${cajaId ? ' en esta caja' : ''}.</td></tr>`;
            return;
        }

        lista.forEach(op => {
            const esCompra = op.tipo_transaccion === 'Compra';
            // Colores sutiles para diferenciar
            const tipoClass = esCompra ? 'text-emerald-400' : 'text-blue-400';
            
            const tr = document.createElement('tr');
            tr.className = "hover:bg-slate-800 border-b border-slate-800 transition cursor-pointer";
            tr.onclick = () => window.location.href = `detalle-op?id=${op.id}`; // Click lleva al detalle de operacion

            tr.innerHTML = `
                <td class="px-4 py-3">
                    <div class="text-white font-bold text-xs">${op.fecha}</div>
                    <div class="text-[10px] text-slate-500 font-mono">#${op.id}</div>
                </td>
                <td class="px-4 py-3 text-xs text-slate-300">
                    ${limpiarTexto(op.nombre_cliente || 'Cliente General')}
                </td>
                <td class="px-4 py-3 text-center">
                    <span class="text-[10px] font-bold uppercase ${tipoClass}">${op.tipo_transaccion}</span>
                </td>
                <td class="px-4 py-3 text-right font-mono text-white text-xs">
                    ${formatearNumero(op.monto)}
                </td>
                <td class="px-4 py-3 text-right font-mono text-slate-500 text-[10px]">
                    ${formatearNumero(op.tasa_cambio)}
                </td>
                <td class="px-4 py-3 text-right font-mono text-amber-500 text-xs font-bold">
                    $${formatearNumero(op.total)}
                </td>
            `;
            tablaMovimientos.appendChild(tr);
        });
    }

    // Guardar Cambios (Solo funcionará si no estamos en modo caja_id)
    if (btnGuardar) {
        btnGuardar.addEventListener('click', () => {
            const payload = {
                id: divisaId,
                nombre: inputs.nombre.value,
                simbolo: inputs.simbolo.value,
                estado: inputs.estado.value,
                url_icono: inputs.iconoUrl.value
            };

            fetch('https://cambiosorion.cl/data/detalle-div.php', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(payload)
            })
            .then(res => res.json())
            .then(data => {
                if(data.success) {
                    mostrarModalExitoso({ titulo: "Guardado", mensaje: "Datos actualizados." });
                } else {
                    throw new Error(data.error || "Error al guardar");
                }
            })
            .catch(err => mostrarModalError({ titulo: "Error", mensaje: err.message }));
        });
    }

    cargarDatos();
});