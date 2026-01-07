let caja_id = null;
let usuarioSesion = null;
let divisasBase = []; // Datos base (info divisa + saldo sistema)
let estadoArqueo = {}; // { id_divisa: { fisico_total: 0, desglose: { '20000': 5, '10000': 2 } } }
let divisaSeleccionadaId = null;

document.addEventListener("DOMContentLoaded", function() {
    getSession();
    cargarSidebar(); 
    
    // Filtro lista lateral
    const inputBuscar = document.getElementById('buscar-divisa');
    if(inputBuscar) {
        inputBuscar.addEventListener('input', (e) => {
            renderListaLateral(e.target.value);
        });
    }

    // Guardar parcial
    const btnParcial = document.getElementById("guardar-parcial");
    if(btnParcial) {
        btnParcial.addEventListener("click", () => {
            if(!caja_id) return;
            guardarLocalStorage();
            const original = btnParcial.innerHTML;
            btnParcial.innerHTML = `<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> Guardado!`;
            setTimeout(() => btnParcial.innerHTML = original, 1500);
        });
    }

    // Guardar final
    const btnFinal = document.getElementById("guardar-arqueo-btn");
    if(btnFinal) {
        btnFinal.addEventListener("click", guardarArqueoFinal);
    }
    
    // Botón limpiar conteo de divisa actual
    const btnLimpiar = document.getElementById("btn-limpiar-detalle");
    if(btnLimpiar) {
        btnLimpiar.addEventListener("click", () => {
            if(divisaSeleccionadaId) {
                estadoArqueo[divisaSeleccionadaId] = { fisico_total: 0, desglose: {} };
                renderDetalle(divisaSeleccionadaId);
                renderListaLateral();
                guardarLocalStorage();
            }
        });
    }
});

// --- FUNCIONES CORE ---

async function getSession() {
    try {
        const res = await fetch("https://cambiosorion.cl/data/session_status_admin.php", { credentials: "include" });
        const data = await res.json();
        
        if (!data.isAuthenticated) { window.location.href = 'https://admin.cambiosorion.cl/login'; return; }

        usuarioSesion = data;
        caja_id = usuarioSesion.caja_id;
        
        const headerName = document.getElementById('header-user-name');
        if(headerName) headerName.textContent = data.nombre ? data.nombre.split(' ')[0] : 'Usuario';

        if (!caja_id) {
            mostrarErrorSinCaja();
            return;
        }

        await cargarDatosIniciales(caja_id);

    } catch (error) {
        console.error("Error sesión", error);
    }
}

async function cargarDatosIniciales(cajaId) {
    try {
        const res = await fetch(`https://cambiosorion.cl/data/arqueo-caja.php?caja_id=${cajaId}`, { credentials: "include" });
        const data = await res.json();
        
        if(data.error) throw new Error(data.error);

        divisasBase = Array.isArray(data.divisas) ? data.divisas : [];
        
        // Inicializar estadoArqueo vacío para cada divisa
        divisasBase.forEach(d => {
            if(!estadoArqueo[d.id]) {
                estadoArqueo[d.id] = { fisico_total: 0, desglose: {} };
            }
        });

        // Intentar restaurar localStorage
        restaurarLocalStorage();

        // Renderizar UI inicial
        renderListaLateral();
        
        // Seleccionar la primera por defecto si existe
        if(divisasBase.length > 0) {
            seleccionarDivisa(divisasBase[0].id); // CORREGIDO: Ahora coincide con la función de abajo
        } else {
            const listaDivisas = document.getElementById('lista-divisas');
            if(listaDivisas) listaDivisas.innerHTML = '<p class="text-center p-4 text-gray-400">Sin divisas asignadas</p>';
        }

    } catch (error) {
        console.error(error);
        mostrarModalError({ titulo: "Error", mensaje: "No se pudieron cargar los datos." });
    }
}

// --- RENDERIZADO UI ---

function renderListaLateral(filtro = "") {
    const contenedor = document.getElementById('lista-divisas');
    if(!contenedor) return;
    contenedor.innerHTML = "";
    
    let pendientes = 0;
    let cuadradas = 0;

    divisasBase.forEach(divisa => {
        // Filtrado seguro
        const nombre = divisa.nombre ? divisa.nombre.toLowerCase() : "";
        const codigo = divisa.codigo ? divisa.codigo.toLowerCase() : "";
        const filtroSafe = filtro.toLowerCase();

        if(filtro && !nombre.includes(filtroSafe) && !codigo.includes(filtroSafe)) return;

        // Cálculos estado
        const sistema = parseFloat(divisa.total_sistema) || 0;
        const fisico = estadoArqueo[divisa.id] ? estadoArqueo[divisa.id].fisico_total : 0;
        const diferencia = fisico - sistema;
        const esCuadrada = Math.abs(diferencia) < 0.01;

        if(esCuadrada) cuadradas++; else pendientes++;

        // Elemento HTML
        const item = document.createElement('div');
        const isSelected = divisaSeleccionadaId === divisa.id;
        
        item.className = `cursor-pointer p-3 border-b border-slate-50 hover:bg-slate-50 transition flex items-center justify-between ${isSelected ? 'active-currency' : ''}`;
        item.onclick = () => seleccionarDivisa(divisa.id); // CORREGIDO

        // Icono estado (Verde check o Rojo exclamación)
        let statusIcon = esCuadrada 
            ? `<div class="w-2 h-2 rounded-full bg-green-500 shadow-sm shadow-green-200"></div>`
            : `<div class="w-2 h-2 rounded-full bg-red-500 shadow-sm shadow-red-200"></div>`;
        
        item.innerHTML = `
            <div class="flex items-center gap-3">
                <img src="${divisa.icono || 'https://cambiosorion.cl/orionapp/icons/default.png'}" class="w-8 h-8 rounded-full border border-gray-200 object-contain bg-white p-0.5">
                <div>
                    <p class="text-xs font-bold text-slate-700">${divisa.codigo}</p>
                    <p class="text-[10px] text-slate-400 truncate max-w-[100px]">${divisa.nombre}</p>
                </div>
            </div>
            <div class="flex flex-col items-end">
                ${statusIcon}
                ${!esCuadrada ? `<span class="text-[9px] font-mono text-red-400 mt-1">${diferencia > 0 ? '+' : ''}${diferencia.toLocaleString('es-CL', {maximumFractionDigits: 0})}</span>` : ''}
            </div>
        `;
        contenedor.appendChild(item);
    });

    const elPendientes = document.getElementById('contador-pendientes');
    const elCuadradas = document.getElementById('contador-cuadradas');
    if(elPendientes) elPendientes.textContent = pendientes;
    if(elCuadradas) elCuadradas.textContent = cuadradas;
}

function seleccionarDivisa(id) { // CORREGIDO: Nombre unificado
    divisaSeleccionadaId = id;
    const inputBusqueda = document.getElementById('buscar-divisa');
    renderListaLateral(inputBusqueda ? inputBusqueda.value : ""); 
    renderDetalle(id);
}

function renderDetalle(id) {
    const divisa = divisasBase.find(d => d.id == id);
    if(!divisa) return;

    // Mostrar panel
    const panelVacio = document.getElementById('panel-vacio');
    const panelDetalle = document.getElementById('panel-detalle');
    if(panelVacio) panelVacio.classList.add('hidden');
    if(panelDetalle) panelDetalle.classList.remove('hidden');

    // Header info
    const elNombre = document.getElementById('detalle-nombre');
    const elCodigo = document.getElementById('detalle-codigo');
    const elIcono = document.getElementById('detalle-icono');
    
    if(elNombre) elNombre.textContent = divisa.nombre;
    if(elCodigo) elCodigo.textContent = divisa.codigo;
    if(elIcono) elIcono.src = divisa.icono || 'https://cambiosorion.cl/orionapp/icons/default.png';

    // Cargar datos actuales
    const sistema = parseFloat(divisa.total_sistema) || 0;
    const datosEstado = estadoArqueo[id] || { fisico_total: 0, desglose: {} };
    const fisico = datosEstado.fisico_total;
    const diferencia = fisico - sistema;

    // Actualizar tarjetas superiores
    const elSistema = document.getElementById('detalle-sistema');
    const elFisico = document.getElementById('detalle-fisico');
    const elDiferencia = document.getElementById('detalle-diferencia');
    const elDiffBg = document.getElementById('indicador-diferencia-bg');

    if(elSistema) elSistema.textContent = sistema.toLocaleString('es-CL', { minimumFractionDigits: 2 });
    if(elFisico) elFisico.textContent = fisico.toLocaleString('es-CL', { minimumFractionDigits: 2 });
    
    if(elDiferencia) {
        elDiferencia.textContent = (diferencia > 0 ? "+" : "") + diferencia.toLocaleString('es-CL', { minimumFractionDigits: 2 });
        
        if(Math.abs(diferencia) < 0.01) {
            elDiferencia.className = "text-lg font-mono font-black text-green-500 relative z-10";
            if(elDiffBg) elDiffBg.className = "absolute inset-0 bg-green-50 opacity-50";
        } else {
            elDiferencia.className = "text-lg font-mono font-black text-red-500 relative z-10";
            if(elDiffBg) elDiffBg.className = "absolute inset-0 bg-red-50 opacity-50";
        }
    }

    // TABLA DENOMINACIONES
    const tbody = document.getElementById('tabla-denominaciones');
    if(!tbody) return;
    tbody.innerHTML = "";

    // Parsear denominaciones
    let denoms = [];
    if(divisa.denominacion) {
        if(divisa.denominacion.includes('[') || divisa.denominacion.includes('{')) {
            try { denoms = JSON.parse(divisa.denominacion); } catch(e) { denoms = []; }
        } else {
            denoms = divisa.denominacion.split(',').map(s => s.trim()).filter(s => s);
        }
    }

    // Caso 1: Divisa con Billetes/Monedas
    if (denoms.length > 0) {
        denoms.sort((a,b) => parseFloat(b) - parseFloat(a));

        denoms.forEach(denomVal => {
            const row = document.createElement('tr');
            row.className = "bg-white hover:bg-slate-50 border-b border-slate-50";
            
            const cantidadGuardada = datosEstado.desglose[denomVal] || "";
            const subtotal = (parseFloat(cantidadGuardada) || 0) * parseFloat(denomVal);

            row.innerHTML = `
                <td class="px-6 py-3 font-mono font-bold text-slate-600">${parseFloat(denomVal).toLocaleString('es-CL')}</td>
                <td class="px-6 py-3">
                    <input type="number" min="0" class="input-denom w-full text-center bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block p-2" 
                           placeholder="0" value="${cantidadGuardada}" data-valor="${denomVal}">
                </td>
                <td class="px-6 py-3 text-right font-mono font-bold text-slate-800 cell-subtotal">
                    ${subtotal.toLocaleString('es-CL', { minimumFractionDigits: 0 })}
                </td>
            `;
            tbody.appendChild(row);
        });

        // Listeners
        tbody.querySelectorAll('.input-denom').forEach(input => {
            input.addEventListener('input', (e) => {
                recalcularFisicoDesdeDesglose(id);
                const val = parseFloat(e.target.dataset.valor);
                const cant = parseFloat(e.target.value) || 0;
                const row = e.target.closest('tr');
                if(row) row.querySelector('.cell-subtotal').textContent = (val * cant).toLocaleString('es-CL');
            });
            input.addEventListener("keydown", (e) => {
                if (e.key === "Enter") {
                    e.preventDefault();
                    const inputs = Array.from(tbody.querySelectorAll('.input-denom'));
                    const next = inputs[inputs.indexOf(e.target) + 1];
                    if (next) next.focus();
                }
            });
        });

    } else {
        // Caso 2: Sin denominaciones (Input Total Directo)
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="px-6 py-3 text-slate-500 italic">Monto Total (Sin desglose)</td>
            <td class="px-6 py-3">
                <input type="number" step="0.01" class="input-total-directo w-full text-center bg-indigo-50 border border-indigo-300 text-indigo-900 font-bold text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2" 
                       placeholder="0.00" value="${fisico > 0 ? fisico : ''}">
            </td>
            <td class="px-6 py-3 text-right">-</td>
        `;
        tbody.appendChild(row);

        const inputTotal = row.querySelector('.input-total-directo');
        if(inputTotal) {
            inputTotal.addEventListener('input', (e) => {
                const val = parseFloat(e.target.value) || 0;
                estadoArqueo[id].fisico_total = val;
                estadoArqueo[id].desglose = {}; 
                actualizarVistaDespuesDeCalculo(id);
            });
        }
    }
}

function recalcularFisicoDesdeDesglose(id) {
    const inputs = document.querySelectorAll('#tabla-denominaciones .input-denom');
    let total = 0;
    const nuevoDesglose = {};

    inputs.forEach(input => {
        const valor = parseFloat(input.dataset.valor);
        const cantidad = parseFloat(input.value); 
        
        if (!isNaN(cantidad) && cantidad > 0) {
            total += (valor * cantidad);
            nuevoDesglose[valor] = cantidad;
        }
    });

    estadoArqueo[id].fisico_total = total;
    estadoArqueo[id].desglose = nuevoDesglose;
    
    actualizarVistaDespuesDeCalculo(id);
}

function actualizarVistaDespuesDeCalculo(id) {
    // 1. Actualizar Header Detalle
    const divisa = divisasBase.find(d => d.id == id);
    if(!divisa) return;

    const sistema = parseFloat(divisa.total_sistema) || 0;
    const fisico = estadoArqueo[id].fisico_total;
    const diferencia = fisico - sistema;

    const elFisico = document.getElementById('detalle-fisico');
    if(elFisico) elFisico.textContent = fisico.toLocaleString('es-CL', { minimumFractionDigits: 2 });
    
    const elDiferencia = document.getElementById('detalle-diferencia');
    const elDiffBg = document.getElementById('indicador-diferencia-bg');

    if(elDiferencia) {
        elDiferencia.textContent = (diferencia > 0 ? "+" : "") + diferencia.toLocaleString('es-CL', { minimumFractionDigits: 2 });
        
        if(Math.abs(diferencia) < 0.01) {
            elDiferencia.className = "text-lg font-mono font-black text-green-500 relative z-10";
            if(elDiffBg) elDiffBg.className = "absolute inset-0 bg-green-50 opacity-50";
        } else {
            elDiferencia.className = "text-lg font-mono font-black text-red-500 relative z-10";
            if(elDiffBg) elDiffBg.className = "absolute inset-0 bg-red-50 opacity-50";
        }
    }

    // 2. Actualizar lista
    const busqueda = document.getElementById('buscar-divisa');
    renderListaLateral(busqueda ? busqueda.value : "");

    // 3. Guardar
    guardarLocalStorage();
}

// --- PERSISTENCIA LOCAL ---

function guardarLocalStorage() {
    if(!caja_id) return;
    const payload = {
        fecha: new Date().toISOString().split("T")[0],
        estado: estadoArqueo
    };
    localStorage.setItem(`arqueo_v2_${caja_id}`, JSON.stringify(payload));
}

function restaurarLocalStorage() {
    if(!caja_id) return;
    const raw = localStorage.getItem(`arqueo_v2_${caja_id}`);
    if(raw) {
        try {
            const data = JSON.parse(raw);
            const hoy = new Date().toISOString().split("T")[0];
            if(data.fecha === hoy && data.estado) {
                Object.keys(data.estado).forEach(k => {
                    // Validar si la divisa sigue existiendo en el array base
                    if(divisasBase.some(d => d.id == k)) {
                        estadoArqueo[k] = data.estado[k];
                    }
                });
            } else {
                localStorage.removeItem(`arqueo_v2_${caja_id}`);
            }
        } catch(e) { console.error("Error LS", e); }
    }
}

// --- GUARDADO SERVIDOR ---

async function guardarArqueoFinal() {
    if(!caja_id) return;

    let hayDiferencias = false;
    divisasBase.forEach(d => {
        const sis = parseFloat(d.total_sistema) || 0;
        const fis = estadoArqueo[d.id] ? estadoArqueo[d.id].fisico_total : 0;
        if(Math.abs(fis - sis) > 0.01) hayDiferencias = true;
    });

    if(hayDiferencias && !confirm("Hay diferencias en el arqueo. ¿Deseas guardar de todas formas?")) {
        return;
    }

    const btn = document.getElementById("guardar-arqueo-btn");
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = "Guardando...";

    const detalles = divisasBase.map(d => {
        const est = estadoArqueo[d.id] || { fisico_total: 0, desglose: {} };
        return {
            divisa_id: d.id,
            total_sistema: d.total_sistema,
            total_arqueo: est.fisico_total,
            denominaciones_json: JSON.stringify(est.desglose)
        };
    });

    const obs = document.getElementById('observaciones-arqueo');
    const payload = {
        caja_id: caja_id,
        equipo_id: usuarioSesion.equipo_id || usuarioSesion.id,
        divisas: detalles,
        observacion: obs ? obs.value : ""
    };

    try {
        const res = await fetch("https://cambiosorion.cl/data/arqueo-caja.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const data = await res.json();

        if(data.mensaje || data.arqueo_id) {
            localStorage.removeItem(`arqueo_v2_${caja_id}`);
            mostrarModalExitoso();
        } else {
            throw new Error(data.error || "Error desconocido");
        }

    } catch(e) {
        mostrarModalError({ titulo: "Error", mensaje: e.message });
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

// --- UTILS ---
function cargarSidebar() {
    fetch('sidebar.html').then(r=>r.text()).then(h=>{
        const container = document.getElementById('sidebar-container');
        if(container) {
            container.innerHTML = h;
            activarLinkSidebar('arqueo-caja');
        }
    });
}

function activarLinkSidebar(pagina) {
    setTimeout(() => {
        const links = document.querySelectorAll('#sidebar-nav a');
        links.forEach(link => {
            link.classList.remove('bg-cyan-50', 'text-cyan-800', 'border-l-4', 'border-cyan-600', 'shadow-sm', 'font-bold');
            link.classList.add('text-gray-600', 'border-transparent');
            const icon = link.querySelector('svg');
            if(icon) { icon.classList.remove('text-cyan-600'); icon.classList.add('text-gray-400'); }

            if (link.dataset.page === pagina) {
                link.classList.remove('text-gray-600', 'border-transparent');
                link.classList.add('bg-cyan-50', 'text-cyan-800', 'border-l-4', 'border-cyan-600', 'shadow-sm', 'font-bold');
                if(icon) { icon.classList.remove('text-gray-400'); icon.classList.add('text-cyan-600'); }
            }
        });
    }, 100);
}

function mostrarErrorSinCaja() {
    const lista = document.getElementById('lista-divisas');
    if(lista) lista.innerHTML = '<p class="text-red-500 p-4">Usuario sin caja asignada</p>';
}

function mostrarModalError({titulo, mensaje}) {
    const m = document.getElementById('modal-error');
    if(!m) { alert(mensaje); return; }
    
    document.getElementById('modal-error-titulo').textContent = titulo;
    document.getElementById('modal-error-mensaje').textContent = mensaje;
    m.classList.remove('hidden');
    document.getElementById('modal-error-confirmar').onclick = () => m.classList.add('hidden');
}

function mostrarModalExitoso() {
    const m = document.getElementById('modal-exitoso');
    if(m) {
        m.classList.remove('hidden');
        document.getElementById('volver').onclick = () => window.location.reload();
    } else {
        alert("Guardado exitoso");
        window.location.reload();
    }
}