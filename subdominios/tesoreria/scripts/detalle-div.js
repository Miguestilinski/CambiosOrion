import { 
    initSystem, 
    limpiarTexto, 
    formatearNumero, 
    formatearFechaHora, 
    mostrarModalError,
    mostrarModalExitoso
} from './index.js';

document.addEventListener('DOMContentLoaded', async () => {
    await initSystem('divisas');

    // Params URL
    const params = new URLSearchParams(window.location.search);
    const divisaId = params.get('id');
    const cajaId = params.get('caja_id');

    // Referencias Inputs
    const inputs = {
        nombre: document.getElementById('nombre'),
        codigo: document.getElementById('codigo'),
        simbolo: document.getElementById('simbolo'),
        estado: document.getElementById('estado'),
        iconoUrl: document.getElementById('icono-url')
    };

    // Referencias Selector Iconos
    const btnSelector = document.getElementById('btn-selector-icono');
    const dropdownIconos = document.getElementById('dropdown-iconos');
    const gridIconos = document.getElementById('grid-iconos');
    const buscadorIcono = document.getElementById('buscar-icono');
    const imgPreview = document.getElementById('icono-preview');
    const textoPreview = document.getElementById('icono-texto');

    // Referencias Info
    const lblTotalOps = document.getElementById('total-ops');
    const tablaOps = document.getElementById('tabla-operaciones');
    const inputFiltroOps = document.getElementById('filtrar-ops');

    // Botones
    const btnGuardar = document.getElementById('guardar-cambios');
    const btnEliminar = document.getElementById('eliminar-divisa');
    const btnVolver = document.getElementById('volver-lista');

    // Modal Confirmar
    const modalConfirmar = document.getElementById('modal-confirmar');
    const btnCancelarConfirmar = document.getElementById('cancelar-confirmar');
    const btnAceptarConfirmar = document.getElementById('aceptar-confirmar');

    let operacionesData = [];
    let iconosCargados = [];

    if (!divisaId) {
        mostrarModalError({ titulo: "Error", mensaje: "ID de divisa no especificado." });
        return;
    }

    if (btnVolver) {
        btnVolver.addEventListener('click', () => {
            window.location.href = 'https://tesoreria.cambiosorion.cl/divisas-int'; // Ajusta la URL de lista
        });
    }

    // --- MODO LECTURA (Si viene de inventario) ---
    // Si queremos proteger la edición cuando vienes a ver movimientos:
    if (cajaId) {
        // Opcional: Deshabilitar inputs principales para enfocar en la tabla
        // Object.values(inputs).forEach(inp => inp.disabled = true);
        // document.getElementById('guardar-cambios').classList.add('hidden');
    }

    // --- CARGAR DATOS ---
    function cargarDivisa() {
        fetch(`https://cambiosorion.cl/data/detalle-div.php?id=${divisaId}`)
            .then(res => res.json())
            .then(data => {
                if (data.error) throw new Error(data.error);

                const div = data.divisa;
                
                inputs.nombre.value = limpiarTexto(div.nombre);
                inputs.codigo.value = limpiarTexto(div.codigo);
                inputs.simbolo.value = limpiarTexto(div.simbolo);
                inputs.estado.value = div.estado == 1 ? "1" : "0";
                
                // Icono
                const urlIcono = div.icono || 'https://cambiosorion.cl/orionapp/icons/default.png';
                inputs.iconoUrl.value = div.icono || '';
                imgPreview.src = urlIcono;
                textoPreview.textContent = div.pais || 'Seleccionar...';

                // Operaciones
                operacionesData = data.operaciones || [];
                lblTotalOps.textContent = operacionesData.length;
                renderizarOperaciones(operacionesData);

                // Mostrar badge si hay filtro
                if (data.filtro_caja_aplicado) {
                    if(badgeFiltroCaja) {
                        badgeFiltroCaja.classList.remove('hidden');
                        badgeFiltroCaja.textContent = `Filtro: Caja ID ${cajaId}`; // O nombre si lo trae la API
                    }
                }
            })
            .catch(err => {
                console.error(err);
                mostrarModalError({ titulo: "Error", mensaje: "No se pudo cargar la divisa." });
            });
    }

    // --- MANEJO DE ICONOS ---
    // Cargar lista de banderas al abrir dropdown
    btnSelector.addEventListener('click', async () => {
        dropdownIconos.classList.toggle('hidden');
        if (!dropdownIconos.classList.contains('hidden') && iconosCargados.length === 0) {
            try {
                const res = await fetch('https://cambiosorion.cl/data/detalle-div.php?get_icons=1');
                const data = await res.json();
                iconosCargados = data; // Array de { code, url, name }
                renderizarIconos(iconosCargados);
            } catch (e) {
                console.error("Error cargando iconos", e);
            }
        }
    });

    // Cerrar dropdown al clickear fuera
    document.addEventListener('click', (e) => {
        if (!btnSelector.contains(e.target) && !dropdownIconos.contains(e.target)) {
            dropdownIconos.classList.add('hidden');
        }
    });

    // Filtrar iconos
    buscadorIcono.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const filtrados = iconosCargados.filter(ic => ic.name.toLowerCase().includes(term));
        renderizarIconos(filtrados);
    });

    function renderizarIconos(lista) {
        gridIconos.innerHTML = '';
        lista.forEach(ic => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = "p-1 rounded hover:bg-slate-700 flex justify-center items-center transition";
            btn.title = ic.name;
            btn.innerHTML = `<img src="${ic.url}" class="w-6 h-6 object-contain">`;
            
            btn.onclick = () => {
                inputs.iconoUrl.value = ic.url;
                imgPreview.src = ic.url;
                textoPreview.textContent = ic.name; // Usamos el nombre del archivo como país aprox
                dropdownIconos.classList.add('hidden');
            };
            gridIconos.appendChild(btn);
        });
    }

    // --- GUARDAR ---
    if (btnGuardar) {
        btnGuardar.addEventListener('click', () => {
            const payload = {
                id: divisaId,
                nombre: inputs.nombre.value,
                codigo: inputs.codigo.value,
                simbolo: inputs.simbolo.value,
                estado: inputs.estado.value,
                icono: inputs.iconoUrl.value,
                // El país lo extraemos del input hidden o lo dejamos vacío si no es relevante
                pais: textoPreview.textContent 
            };

            fetch("https://cambiosorion.cl/data/detalle-div.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    mostrarModalExitoso({ titulo: "Guardado", mensaje: "Divisa actualizada correctamente." });
                } else {
                    throw new Error(data.error || "Error al guardar.");
                }
            })
            .catch(err => {
                mostrarModalError({ titulo: "Error", mensaje: err.message });
            });
        });
    }

    // --- ELIMINAR ---
    if (btnEliminar) {
        btnEliminar.addEventListener('click', () => modalConfirmar.classList.remove('hidden'));
        
        btnCancelarConfirmar.addEventListener('click', () => modalConfirmar.classList.add('hidden'));
        
        btnAceptarConfirmar.addEventListener('click', () => {
            fetch(`https://cambiosorion.cl/data/detalle-div.php?id=${divisaId}`, {
                method: 'DELETE'
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    window.location.href = 'https://tesoreria.cambiosorion.cl/divisas-int';
                } else {
                    throw new Error(data.error || "Error al eliminar.");
                }
            })
            .catch(err => {
                modalConfirmar.classList.add('hidden');
                mostrarModalError({ titulo: "Error", mensaje: err.message });
            });
        });
    }

    // --- RENDERIZAR OPERACIONES ---
    function renderizarOperaciones(lista) {
        tablaOps.innerHTML = '';

        if(lista.length === 0) {
            tablaOps.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-slate-500 text-xs italic">Sin movimientos registrados en este contexto.</td></tr>`;
            return;
        }

        lista.forEach(op => {
            // Lógica colores Compra/Venta
            const esCompra = op.tipo_transaccion === 'Compra';
            const colorTipo = esCompra ? 'text-emerald-400 bg-emerald-900/20' : 'text-blue-400 bg-blue-900/20';

            const tr = document.createElement('tr');
            tr.className = 'hover:bg-white/5 transition-all border-b border-white/5 last:border-0 text-slate-300';
            tr.onclick = () => window.location.href = `detalle-op?id=${op.id}`;

            // Estilos Tipo
            let tipoClass = "text-slate-400";
            if (op.tipo_transaccion === 'Compra') tipoClass = "text-emerald-400 font-bold";
            if (op.tipo_transaccion === 'Venta') tipoClass = "text-amber-400 font-bold";

            tr.innerHTML = `
                <td class="px-4 py-2">
                    <div class="text-white font-bold text-xs">${op.fecha.split(' ')[0]}</div>
                    <div class="text-[10px] text-slate-500">#${op.id}</div>
                </td>
                <td class="px-4 py-2 text-xs text-slate-300 truncate max-w-[120px]" title="${op.nombre_cliente}">
                    ${op.nombre_cliente || 'General'}
                </td>
                <td class="px-4 py-2 text-center">
                    <span class="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${colorTipo}">${op.tipo_transaccion}</span>
                </td>
                <td class="px-4 py-2 text-right font-mono text-white text-xs font-bold">
                    ${formatearNumero(op.monto)}
                </td>
                <td class="px-4 py-2 text-right font-mono text-slate-500 text-[10px]">
                    ${formatearNumero(op.tasa_cambio)}
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

    cargarDivisa();
});