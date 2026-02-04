import { 
    initSystem, 
    limpiarTexto, 
    formatearNumero, 
    mostrarModalError,
    mostrarModalExitoso
} from './index.js';

document.addEventListener('DOMContentLoaded', async () => {
    
    // 1. Detección Inteligente del Contexto para el Sidebar
    const params = new URLSearchParams(window.location.search);
    const divisaId = params.get('id');
    const cajaId = params.get('caja_id');

    // Si hay cajaId, venimos de Inventarios, si no, es gestión de Divisas
    const paginaOrigen = cajaId ? 'inventarios' : 'divisas';
    await initSystem(paginaOrigen);

    // 2. Referencias Inputs Ficha
    const inputs = {
        nombre: document.getElementById('nombre'),
        codigo: document.getElementById('codigo'),
        simbolo: document.getElementById('simbolo'),
        pais: document.getElementById('pais'),
        estado: document.getElementById('estado'),
        iconoUrl: document.getElementById('icono-url'),
        fraccionable: document.getElementById('fraccionable'),
        denominacion: document.getElementById('denominacion')
    };
    const seccionDenominacion = document.getElementById('seccion-denominacion');
    
    // Icono & Modal
    const imgPreview = document.getElementById('icono-preview');
    const textoPreview = document.getElementById('icono-texto');
    const btnCambiarIcono = document.getElementById('btn-cambiar-icono');
    const modalIconos = document.getElementById('modal-iconos');
    const cerrarModalIconos = document.getElementById('cerrar-modal-iconos');
    const gridIconos = document.getElementById('grid-iconos');
    const buscarIconoInput = document.getElementById('buscar-icono');

    // Botones Principales
    const btnGuardar = document.getElementById('guardar-cambios');
    const btnVolver = document.getElementById('volver-lista');
    
    // Historial
    const tablaMovimientos = document.getElementById('tabla-movimientos');
    const totalMovimientos = document.getElementById('total-movimientos');
    const badgeFiltroCaja = document.getElementById('badge-filtro-caja');
    const infoFiltroCaja = document.getElementById('info-filtro-caja');

    let iconosCache = []; // Para no recargar

    if (!divisaId) {
        mostrarModalError({ titulo: "Error", mensaje: "ID no especificado" });
        return;
    }

    if (btnVolver) btnVolver.addEventListener('click', () => window.history.back());

    // --- LOGICA FRACCIONABLE (CORREGIDO: Protección contra nulos) ---
    if (inputs.fraccionable) {
        inputs.fraccionable.addEventListener('change', () => {
            if(inputs.fraccionable.checked) {
                seccionDenominacion.classList.remove('hidden');
            } else {
                seccionDenominacion.classList.add('hidden');
            }
        });
    }

    // --- LOGICA MODAL ICONOS ---
    if (btnCambiarIcono) {
        btnCambiarIcono.addEventListener('click', async () => {
            modalIconos.classList.remove('hidden');
            if (iconosCache.length === 0) {
                await cargarIconosDisponibles();
            }
            renderizarIconos(iconosCache);
        });
    }

    if (cerrarModalIconos) {
        cerrarModalIconos.addEventListener('click', () => modalIconos.classList.add('hidden'));
    }

    async function cargarIconosDisponibles() {
        try {
            // Reutilizamos el endpoint de nueva-div que ya devuelve la lista
            const res = await fetch("https://cambiosorion.cl/data/nueva-div.php");
            const data = await res.json();
            if (Array.isArray(data)) {
                iconosCache = data;
            }
        } catch (e) { console.error("Error cargando iconos", e); }
    }

    function renderizarIconos(lista) {
        gridIconos.innerHTML = '';
        lista.forEach(icon => {
            const img = document.createElement('img');
            img.src = icon.url;
            img.title = icon.codigo;
            img.className = "w-10 h-10 rounded-full border border-slate-600 hover:border-amber-500 cursor-pointer transition transform hover:scale-110 object-cover bg-slate-800 p-0.5";
            
            img.addEventListener('click', () => {
                inputs.iconoUrl.value = icon.url;
                imgPreview.src = icon.url;
                imgPreview.classList.remove('hidden');
                textoPreview.classList.add('hidden');
                modalIconos.classList.add('hidden');
            });
            gridIconos.appendChild(img);
        });
    }

    if (buscarIconoInput) {
        buscarIconoInput.addEventListener('input', (e) => {
            const q = e.target.value.toLowerCase();
            const filtrados = iconosCache.filter(i => i.codigo.toLowerCase().includes(q));
            renderizarIconos(filtrados);
        });
    }

    // --- MODO LECTURA (Desde Inventario) ---
    if (cajaId) {
        Object.values(inputs).forEach(inp => {
            if(inp) {
                inp.disabled = true;
                if(inp.type !== 'checkbox') inp.classList.add('opacity-50', 'cursor-not-allowed');
            }
        });
        if(btnGuardar) btnGuardar.classList.add('hidden');
        if(btnCambiarIcono) btnCambiarIcono.classList.add('hidden');
        if(badgeFiltroCaja) badgeFiltroCaja.classList.remove('hidden');
    }

    // --- CARGAR DATOS ---
    function cargarDatos() {
        let url = `https://tesoreria.cambiosorion.cl/api/detalle-div.php?id=${divisaId}`;
        if (cajaId) url += `&caja_id=${cajaId}`;

        fetch(url)
            .then(res => res.json())
            .then(data => {
                if (data.error) throw new Error(data.error);

                const d = data.divisa;
                
                // Llenar Campos
                inputs.nombre.value = d.nombre;
                inputs.codigo.value = d.codigo;
                inputs.simbolo.value = d.simbolo;
                inputs.pais.value = d.pais || '';
                
                inputs.estado.value = (d.estado === 'Habilitada' || d.estado == 1) ? "1" : "0";
                
                // Fraccionable
                const esFracc = (d.fraccionable == 1);
                if (inputs.fraccionable) inputs.fraccionable.checked = esFracc;
                if (esFracc && seccionDenominacion) seccionDenominacion.classList.remove('hidden');
                inputs.denominacion.value = d.denominacion || '';

                // Icono
                inputs.iconoUrl.value = d.icono || '';
                if (d.icono) {
                    imgPreview.src = d.icono;
                    imgPreview.classList.remove('hidden');
                    textoPreview.classList.add('hidden');
                }

                // Historial
                const operaciones = data.operaciones || [];
                renderizarHistorial(operaciones, data.caja_filtrada_nombre);
            })
            .catch(err => {
                mostrarModalError({ titulo: "Error", mensaje: err.message });
            });
    }

    function renderizarHistorial(lista, nombreCaja) {
        tablaMovimientos.innerHTML = '';
        totalMovimientos.textContent = `${lista.length} registros`;

        if (cajaId && infoFiltroCaja) {
            infoFiltroCaja.classList.remove('hidden');
            // CORREGIDO: Usamos nombreCaja si existe, sino el ID
            infoFiltroCaja.textContent = nombreCaja ? `Caja: ${nombreCaja}` : `Caja ID: ${cajaId}`;
        }

        if (lista.length === 0) {
            tablaMovimientos.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-slate-500 italic">No hay movimientos registrados${cajaId ? ' en esta caja' : ''}.</td></tr>`;
            return;
        }

        lista.forEach(op => {
            const esCompra = op.tipo_transaccion === 'Compra';
            const tipoClass = esCompra ? 'text-emerald-400' : 'text-blue-400';
            
            const tr = document.createElement('tr');
            tr.className = "hover:bg-slate-800 border-b border-slate-800 transition cursor-pointer";
            tr.onclick = () => window.location.href = `detalle-op?id=${op.id}`; 

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

    // --- GUARDAR CAMBIOS ---
    if (btnGuardar) {
        btnGuardar.addEventListener('click', () => {
            const payload = {
                id: divisaId,
                nombre: inputs.nombre.value,
                codigo: inputs.codigo.value,
                simbolo: inputs.simbolo.value,
                pais: inputs.pais.value,
                estado: inputs.estado.value,
                fraccionable: inputs.fraccionable && inputs.fraccionable.checked ? 1 : 0,
                denominacion: inputs.denominacion.value,
                url_icono: inputs.iconoUrl.value
            };

            fetch('https://tesoreria.cambiosorion.cl/api/detalle-div.php', {
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