import { 
    initSystem, 
    mostrarModalError, 
    mostrarModalExitoso 
} from './index.js';

let caja_id = null;
let usuarioSesion = null;
let divisasBase = []; 
let estadoArqueo = {}; 
let divisaSeleccionadaId = null;

document.addEventListener("DOMContentLoaded", async function() {
    // 1. Inicialización Sistema General
    const sessionData = await initSystem('arqueo'); // Activa sidebar 'arqueo'
    
    if (sessionData) {
        usuarioSesion = sessionData;
        caja_id = usuarioSesion.caja_id;
        
        if (!caja_id) {
            mostrarErrorSinCaja();
        } else {
            await cargarDatosIniciales(caja_id);
        }
    }

    // Filtros
    const inputBuscar = document.getElementById('buscar-divisa');
    if(inputBuscar) {
        inputBuscar.addEventListener('input', (e) => {
            renderListaLateral(e.target.value);
        });
    }

    // Botones
    const btnParcial = document.getElementById("guardar-parcial");
    if(btnParcial) {
        btnParcial.addEventListener("click", () => {
            if(!caja_id) return;
            guardarLocalStorage();
            // Feedback visual sutil
            const original = btnParcial.innerHTML;
            btnParcial.innerHTML = `<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> Guardado`;
            btnParcial.classList.add("text-green-400", "border-green-500/50");
            btnParcial.classList.remove("text-amber-400", "border-amber-500/50");
            
            setTimeout(() => {
                btnParcial.innerHTML = original;
                btnParcial.classList.remove("text-green-400", "border-green-500/50");
                btnParcial.classList.add("text-amber-400", "border-amber-500/50");
            }, 1500);
        });
    }

    const btnFinal = document.getElementById("guardar-arqueo-btn");
    if(btnFinal) {
        btnFinal.addEventListener("click", guardarArqueoFinal);
    }
    
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

// --- CARGA DE DATOS ---
async function cargarDatosIniciales(cajaId) {
    try {
        const res = await fetch(`https://cambiosorion.cl/data/arqueo-tesoreria.php?caja_id=${cajaId}`, { credentials: "include" });
        const data = await res.json();
        
        if(data.error) throw new Error(data.error);

        divisasBase = Array.isArray(data.divisas) ? data.divisas : [];
        
        divisasBase.forEach(d => {
            if(!estadoArqueo[d.id]) {
                estadoArqueo[d.id] = { fisico_total: 0, desglose: {} };
            }
        });

        restaurarLocalStorage();
        renderListaLateral();
        
        if(divisasBase.length > 0) {
            seleccionarDivisa(divisasBase[0].id);
        } else {
            const listaDivisas = document.getElementById('lista-divisas');
            if(listaDivisas) listaDivisas.innerHTML = '<div class="text-center py-10"><p class="text-xs text-slate-600">Sin divisas asignadas</p></div>';
        }

    } catch (error) {
        console.error(error);
        mostrarModalError({ titulo: "Error de Datos", mensaje: "No se pudieron cargar los datos de tesorería." });
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
        const nombre = divisa.nombre ? divisa.nombre.toLowerCase() : "";
        const codigo = divisa.codigo ? divisa.codigo.toLowerCase() : "";
        const filtroSafe = filtro.toLowerCase();

        if(filtro && !nombre.includes(filtroSafe) && !codigo.includes(filtroSafe)) return;

        const sistema = parseFloat(divisa.total_sistema) || 0;
        const fisico = estadoArqueo[divisa.id] ? estadoArqueo[divisa.id].fisico_total : 0;
        const diferencia = fisico - sistema;
        const esCuadrada = Math.abs(diferencia) < 0.01;

        if(esCuadrada) cuadradas++; else pendientes++;

        const item = document.createElement('div');
        const isSelected = divisaSeleccionadaId === divisa.id;
        
        item.className = `cursor-pointer p-2.5 border-b border-white/5 hover:bg-white/5 transition flex items-center justify-between ${isSelected ? 'active-currency' : ''}`;
        item.onclick = () => seleccionarDivisa(divisa.id);

        let statusIcon = esCuadrada 
            ? `<svg class="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`
            : `<svg class="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;
        
        item.innerHTML = `
            <div class="flex items-center gap-3">
                <img src="${divisa.icono || 'https://cambiosorion.cl/orionapp/icons/default.png'}" class="w-7 h-7 rounded-full border border-slate-600 object-contain bg-slate-800 p-0.5">
                <div>
                    <p class="text-xs font-bold text-slate-300 leading-tight">${divisa.codigo}</p>
                    <p class="text-[10px] text-slate-500 truncate max-w-[90px] leading-tight">${divisa.nombre}</p>
                </div>
            </div>
            <div class="flex flex-col items-end">
                ${statusIcon}
                ${!esCuadrada ? `<span class="text-[9px] font-mono text-red-400 mt-0.5 font-bold">${diferencia > 0 ? '+' : ''}${diferencia.toLocaleString('es-CL', {maximumFractionDigits: 0})}</span>` : ''}
            </div>
        `;
        contenedor.appendChild(item);
    });

    const elPendientes = document.getElementById('contador-pendientes');
    const elCuadradas = document.getElementById('contador-cuadradas');
    if(elPendientes) elPendientes.textContent = pendientes;
    if(elCuadradas) elCuadradas.textContent = cuadradas;
}

function seleccionarDivisa(id) {
    divisaSeleccionadaId = id;
    const inputBusqueda = document.getElementById('buscar-divisa');
    renderListaLateral(inputBusqueda ? inputBusqueda.value : ""); 
    renderDetalle(id);
}

function renderDetalle(id) {
    const divisa = divisasBase.find(d => d.id == id);
    if(!divisa) return;

    const panelVacio = document.getElementById('panel-vacio');
    const panelDetalle = document.getElementById('panel-detalle');
    if(panelVacio) panelVacio.classList.add('hidden');
    if(panelDetalle) panelDetalle.classList.remove('hidden');

    // Datos
    document.getElementById('detalle-nombre').textContent = divisa.nombre;
    document.getElementById('detalle-codigo').textContent = divisa.codigo;
    document.getElementById('detalle-icono').src = divisa.icono || 'https://cambiosorion.cl/orionapp/icons/default.png';

    const sistema = parseFloat(divisa.total_sistema) || 0;
    const datosEstado = estadoArqueo[id] || { fisico_total: 0, desglose: {} };
    const fisico = datosEstado.fisico_total;
    const diferencia = fisico - sistema;

    // Indicadores superiores
    document.getElementById('detalle-sistema').textContent = sistema.toLocaleString('es-CL', { minimumFractionDigits: 2 });
    document.getElementById('detalle-fisico').textContent = fisico.toLocaleString('es-CL', { minimumFractionDigits: 2 });
    
    const elDiferencia = document.getElementById('detalle-diferencia');
    const elDiffBg = document.getElementById('indicador-diferencia-bg');

    elDiferencia.textContent = (diferencia > 0 ? "+" : "") + diferencia.toLocaleString('es-CL', { minimumFractionDigits: 2 });
    
    if(Math.abs(diferencia) < 0.01) {
        elDiferencia.className = "text-base font-mono font-black text-green-400 relative z-10";
        if(elDiffBg) { elDiffBg.className = "absolute inset-0 bg-green-500 opacity-10"; }
    } else {
        elDiferencia.className = "text-base font-mono font-black text-red-400 relative z-10";
        if(elDiffBg) { elDiffBg.className = "absolute inset-0 bg-red-500 opacity-10"; }
    }

    // Tabla
    const tbody = document.getElementById('tabla-denominaciones');
    if(!tbody) return;
    tbody.innerHTML = "";

    let denoms = [];
    if(divisa.denominacion) {
        if(divisa.denominacion.includes('[') || divisa.denominacion.includes('{')) {
            try { denoms = JSON.parse(divisa.denominacion); } catch(e) { denoms = []; }
        } else {
            denoms = divisa.denominacion.split(',').map(s => s.trim()).filter(s => s);
        }
    }

    // Render Filas
    if (denoms.length > 0) {
        denoms.sort((a,b) => parseFloat(b) - parseFloat(a));

        denoms.forEach(denomVal => {
            const row = document.createElement('tr');
            row.className = "hover:bg-white/5 border-b border-white/5 transition";
            
            const cantidadGuardada = datosEstado.desglose[denomVal] || "";
            const subtotal = (parseFloat(cantidadGuardada) || 0) * parseFloat(denomVal);

            row.innerHTML = `
                <td class="px-5 py-2.5 font-mono font-bold text-slate-400 text-xs">${parseFloat(denomVal).toLocaleString('es-CL')}</td>
                <td class="px-5 py-2.5">
                    <input type="number" min="0" class="input-denom w-full text-center bg-slate-800 border border-slate-600 text-white text-xs rounded focus:ring-amber-500 focus:border-amber-500 block p-1.5" 
                           placeholder="0" value="${cantidadGuardada}" data-valor="${denomVal}">
                </td>
                <td class="px-5 py-2.5 text-right font-mono font-bold text-slate-300 text-xs cell-subtotal">
                    ${subtotal.toLocaleString('es-CL', { minimumFractionDigits: 0 })}
                </td>
            `;
            tbody.appendChild(row);
        });

        // Listeners Inputs
        tbody.querySelectorAll('.input-denom').forEach(input => {
            input.addEventListener('input', (e) => {
                recalcularFisicoDesdeDesglose(id);
                const val = parseFloat(e.target.dataset.valor);
                const cant = parseFloat(e.target.value) || 0;
                e.target.closest('tr').querySelector('.cell-subtotal').textContent = (val * cant).toLocaleString('es-CL');
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
        // Sin denominaciones
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="px-5 py-3 text-slate-500 italic text-xs">Monto Total</td>
            <td class="px-5 py-3">
                <input type="number" step="0.01" class="input-total-directo w-full text-center bg-slate-800 border border-slate-600 text-amber-400 font-bold text-xs rounded focus:ring-amber-500 focus:border-amber-500 block p-1.5" 
                       placeholder="0.00" value="${fisico > 0 ? fisico : ''}">
            </td>
            <td class="px-5 py-3 text-right text-xs text-slate-600">-</td>
        `;
        tbody.appendChild(row);

        const inputTotal = row.querySelector('.input-total-directo');
        inputTotal.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value) || 0;
            estadoArqueo[id].fisico_total = val;
            estadoArqueo[id].desglose = {}; 
            actualizarVistaDespuesDeCalculo(id);
        });
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
    // Header
    const divisa = divisasBase.find(d => d.id == id);
    const sistema = parseFloat(divisa.total_sistema) || 0;
    const fisico = estadoArqueo[id].fisico_total;
    const diferencia = fisico - sistema;

    document.getElementById('detalle-fisico').textContent = fisico.toLocaleString('es-CL', { minimumFractionDigits: 2 });
    
    const elDiferencia = document.getElementById('detalle-diferencia');
    const elDiffBg = document.getElementById('indicador-diferencia-bg');

    elDiferencia.textContent = (diferencia > 0 ? "+" : "") + diferencia.toLocaleString('es-CL', { minimumFractionDigits: 2 });
    
    if(Math.abs(diferencia) < 0.01) {
        elDiferencia.className = "text-base font-mono font-black text-green-400 relative z-10";
        if(elDiffBg) elDiffBg.className = "absolute inset-0 bg-green-500 opacity-10";
    } else {
        elDiferencia.className = "text-base font-mono font-black text-red-400 relative z-10";
        if(elDiffBg) elDiffBg.className = "absolute inset-0 bg-red-500 opacity-10";
    }

    // Lista lateral
    const busqueda = document.getElementById('buscar-divisa');
    renderListaLateral(busqueda ? busqueda.value : "");

    guardarLocalStorage();
}

// --- LOCAL STORAGE ---
function guardarLocalStorage() {
    if(!caja_id) return;
    const payload = {
        fecha: new Date().toISOString().split("T")[0],
        estado: estadoArqueo
    };
    localStorage.setItem(`arqueo_tesoreria_${caja_id}`, JSON.stringify(payload));
}

function restaurarLocalStorage() {
    if(!caja_id) return;
    const raw = localStorage.getItem(`arqueo_tesoreria_${caja_id}`);
    if(raw) {
        try {
            const data = JSON.parse(raw);
            const hoy = new Date().toISOString().split("T")[0];
            if(data.fecha === hoy && data.estado) {
                Object.keys(data.estado).forEach(k => {
                    if(divisasBase.some(d => d.id == k)) {
                        estadoArqueo[k] = data.estado[k];
                    }
                });
            } else {
                localStorage.removeItem(`arqueo_tesoreria_${caja_id}`);
            }
        } catch(e) { console.error("Error LS", e); }
    }
}

// --- GUARDAR ---
async function guardarArqueoFinal() {
    if(!caja_id) return;

    let hayDiferencias = false;
    divisasBase.forEach(d => {
        const sis = parseFloat(d.total_sistema) || 0;
        const fis = estadoArqueo[d.id] ? estadoArqueo[d.id].fisico_total : 0;
        if(Math.abs(fis - sis) > 0.01) hayDiferencias = true;
    });

    if(hayDiferencias && !confirm("Hay diferencias en el arqueo. ¿Guardar de todas formas?")) {
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

    const payload = {
        caja_id: caja_id,
        equipo_id: usuarioSesion.equipo_id || usuarioSesion.id,
        divisas: detalles,
        observacion: document.getElementById('observaciones-arqueo').value
    };

    try {
        const res = await fetch("https://cambiosorion.cl/data/arqueo-caja.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const data = await res.json();

        if(data.mensaje || data.arqueo_id) {
            localStorage.removeItem(`arqueo_tesoreria_${caja_id}`);
            mostrarModalExitoso({ titulo: "Cuadratura Exitosa", mensaje: "Se ha registrado el arqueo de tesorería." });
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

function mostrarErrorSinCaja() {
    const lista = document.getElementById('lista-divisas');
    if(lista) lista.innerHTML = '<div class="text-center py-10"><p class="text-xs text-red-400 font-bold bg-red-900/30 p-2 rounded">Usuario sin caja asignada</p></div>';
}