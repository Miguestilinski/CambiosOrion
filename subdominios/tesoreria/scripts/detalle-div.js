import { 
    initSystem, 
    limpiarTexto, 
    formatearNumero, 
    mostrarModalError,
    mostrarModalExitoso
} from './index.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Inicializar sistema. Usamos 'divisas' para iluminar el menú, 
    // pero si vienes de inventarios, el usuario entenderá el contexto por el botón 'Volver'.
    await initSystem('divisas');

    // 1. Obtener parámetros URL
    const params = new URLSearchParams(window.location.search);
    const divisaId = params.get('id');
    const cajaId = params.get('caja_id');

    // 2. Referencias Inputs Ficha
    const inputs = {
        nombre: document.getElementById('nombre'),
        codigo: document.getElementById('codigo'),
        simbolo: document.getElementById('simbolo'),
        estado: document.getElementById('estado'),
        iconoUrl: document.getElementById('icono-url')
    };
    const idDisplay = document.getElementById('id-display');
    
    // Icono
    const imgPreview = document.getElementById('icono-preview');
    const textoPreview = document.getElementById('icono-texto');

    // Historial
    const tablaOps = document.getElementById('tabla-operaciones');
    const inputFiltroOps = document.getElementById('filtrar-ops');
    const badgeFiltroCaja = document.getElementById('badge-filtro-caja');

    // Botones
    const btnVolver = document.getElementById('volver-lista');
    const btnGuardar = document.getElementById('guardar-cambios');

    let operacionesData = []; // Para filtro local en JS

    // Validación Básica
    if (!divisaId) {
        mostrarModalError({ titulo: "Error", mensaje: "ID no especificado" });
        return;
    }

    // Botón Volver
    if(btnVolver) {
        btnVolver.addEventListener('click', () => window.history.back());
    }

    // --- CARGAR DATOS ---
    function cargarDatos() {
        // Construir URL con filtro de caja si existe
        let url = `https://cambiosorion.cl/data/detalle-div.php?id=${divisaId}`;
        if(cajaId) url += `&caja_id=${cajaId}`;

        fetch(url)
            .then(res => res.json())
            .then(data => {
                if (data.error) throw new Error(data.error);

                // A. Llenar Ficha Maestra
                const d = data.divisa;
                idDisplay.textContent = d.id;
                inputs.nombre.value = d.nombre;
                inputs.codigo.value = d.codigo;
                inputs.simbolo.value = d.simbolo;
                
                // Manejo de estado (puede venir como 'Habilitada' texto o 1 entero)
                const estadoVal = (d.estado === 'Habilitada' || d.estado == 1) ? "1" : "0";
                inputs.estado.value = estadoVal;
                
                if (d.icono) {
                    imgPreview.src = d.icono;
                    imgPreview.classList.remove('hidden');
                    textoPreview.classList.add('hidden');
                    inputs.iconoUrl.value = d.icono;
                }

                // B. Llenar Historial
                operacionesData = data.operaciones || [];
                renderizarOperaciones(operacionesData);

                // C. Feedback Visual de Filtro
                if (data.filtro_caja_aplicado) {
                    if(badgeFiltroCaja) {
                        badgeFiltroCaja.classList.remove('hidden');
                        // Opcional: Podrías deshabilitar edición si estás en modo auditoría
                        // btnGuardar.classList.add('hidden'); 
                    }
                }
            })
            .catch(err => {
                console.error(err);
                mostrarModalError({ titulo: "Error", mensaje: "No se pudo cargar la información de la divisa." });
            });
    }

    function renderizarOperaciones(lista) {
        tablaOps.innerHTML = '';
        if(lista.length === 0) {
            tablaOps.innerHTML = `<tr><td colspan="7" class="p-8 text-center text-slate-500 text-sm italic border-b border-slate-800">Sin movimientos registrados en este contexto.</td></tr>`;
            return;
        }

        lista.forEach(op => {
            // Estilos
            const esCompra = op.tipo_transaccion === 'Compra';
            const colorTipo = esCompra ? 'text-emerald-400 bg-emerald-900/20 border-emerald-500/20' : 'text-blue-400 bg-blue-900/20 border-blue-500/20';
            
            const tr = document.createElement('tr');
            tr.className = "hover:bg-slate-700/30 transition cursor-pointer border-b border-slate-800 group";
            tr.onclick = () => window.location.href = `detalle-op?id=${op.id}`; // Navegación cruzada al detalle de la operación

            tr.innerHTML = `
                <td class="px-4 py-3">
                    <div class="text-white font-bold text-xs mb-0.5">${op.fecha.split(' ')[0]}</div>
                    <div class="text-[10px] text-slate-500 font-mono group-hover:text-amber-500 transition">#${op.id}</div>
                </td>
                <td class="px-4 py-3 text-xs text-slate-400">
                    ${op.nombre_caja || 'Desconocida'}
                </td>
                <td class="px-4 py-3 text-xs text-slate-300 truncate max-w-[120px]" title="${op.nombre_cliente}">
                    ${limpiarTexto(op.nombre_cliente || 'Cliente General')}
                </td>
                <td class="px-4 py-3 text-center">
                    <span class="px-2 py-0.5 rounded border text-[10px] font-bold uppercase ${colorTipo}">${op.tipo_transaccion}</span>
                </td>
                <td class="px-4 py-3 text-right font-mono text-white text-xs font-bold">
                    ${formatearNumero(op.monto)}
                </td>
                <td class="px-4 py-3 text-right font-mono text-slate-500 text-[10px]">
                    ${formatearNumero(op.tasa_cambio)}
                </td>
                <td class="px-4 py-3 text-right font-mono text-amber-500/80 text-xs font-bold">
                    $${formatearNumero(op.total)}
                </td>
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
                (op.nombre_cliente && op.nombre_cliente.toLowerCase().includes(term)) ||
                (op.tipo_transaccion && op.tipo_transaccion.toLowerCase().includes(term))
            );
            renderizarOperaciones(filtrados);
        });
    }

    // --- GUARDAR CAMBIOS ---
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
                    mostrarModalExitoso({ titulo: "Guardado", mensaje: "Datos de la divisa actualizados." });
                } else {
                    throw new Error(data.error || "Error al guardar");
                }
            })
            .catch(err => mostrarModalError({ titulo: "Error", mensaje: err.message }));
        });
    }

    cargarDatos();
});