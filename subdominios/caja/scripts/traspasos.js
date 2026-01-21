import { initCajaHeader } from './header.js';

document.addEventListener('DOMContentLoaded', async() => {
    // 1. Inicializar Header, Sidebar y Sesión
    const sessionData = await initCajaHeader('traspasos');

    // 2. Variables de Estado
    let paginaActual = 1;
    let modoCompletarPendientes = false;
    let totalesPorDivisa = {};
    
    // 3. Configurar Filtros
    const filtros = {
        fechaInicio: document.getElementById("fecha-inicio"),
        fechaFin: document.getElementById("fecha-fin"),
        numero: document.getElementById("numero"),
        origen: document.getElementById("origen"),
        destino: document.getElementById("destino"),
        divisa: document.getElementById("divisa"),
        monto: document.getElementById("monto"),
        estado: document.getElementById("estado"),
        mostrar: document.getElementById("mostrar-registros"),
        caja_id: { value: "" } // Objeto simulado para mantener consistencia
    };

    // 4. Asignar Caja ID desde la Sesión (CRÍTICO)
    if (sessionData && sessionData.caja_id) {
        filtros.caja_id.value = sessionData.caja_id;
        console.log("Caja ID configurada para Traspasos:", sessionData.caja_id);
    } else {
        console.warn("No se detectó caja en la sesión.");
    }

    initDatePickers();

    // Referencias DOM
    const nuevoTraspasoBtn = document.getElementById('nuevo-tp');
    const completarPendientesBtn = document.getElementById('activar-completado');
    const panelResumen = document.getElementById('panel-resumen-completar');
    const listaResumenGlobal = document.getElementById('lista-resumen-global');
    const confirmarCompletadoBtn = document.getElementById('confirmar-completado');
    const listaResumenSeleccion = document.getElementById('lista-resumen');

    const tabla = document.getElementById('tabla-transacciones');
    const borrarFiltrosBtn = document.getElementById('borrar-filtros');
    const contadorRegistros = document.getElementById('contador-registros');
    
    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');
    const pageIndicator = document.getElementById('page-indicator');

    // --- EVENTOS DE BOTONES PRINCIPALES ---
    if (nuevoTraspasoBtn) {
        nuevoTraspasoBtn.addEventListener('click', () => {
            window.location.href = 'nuevo-traspaso'; 
        });
    }

    if (completarPendientesBtn) {
        completarPendientesBtn.addEventListener('click', () => {
            modoCompletarPendientes = !modoCompletarPendientes;
            
            if (modoCompletarPendientes) {
                // Activar Modo Pendientes
                completarPendientesBtn.innerHTML = `<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg> Cancelar`;
                completarPendientesBtn.classList.replace("bg-indigo-600", "bg-red-600");
                completarPendientesBtn.classList.replace("hover:bg-indigo-700", "hover:bg-red-700");
                completarPendientesBtn.classList.replace("border-indigo-500", "border-red-500");
                completarPendientesBtn.classList.replace("shadow-indigo-500/30", "shadow-red-500/30");
                
                // Forzar filtro 'pendiente' y bloquear
                if(filtros.estado) {
                    filtros.estado.value = "pendiente"; 
                    filtros.estado.disabled = true;
                }
                
                if(panelResumen) panelResumen.classList.remove('hidden');
                const colCheck = document.getElementById('col-check');
                if(colCheck) colCheck.innerHTML = 'Seleccionar';

            } else {
                // Desactivar
                completarPendientesBtn.innerHTML = `<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> Completar Pendientes`;
                completarPendientesBtn.classList.replace("bg-red-600", "bg-indigo-600");
                completarPendientesBtn.classList.replace("hover:bg-red-700", "hover:bg-indigo-700");
                completarPendientesBtn.classList.replace("border-red-500", "border-indigo-500");
                completarPendientesBtn.classList.replace("shadow-red-500/30", "shadow-indigo-500/30");
                
                if(filtros.estado) {
                    filtros.estado.value = "";
                    filtros.estado.disabled = false;
                }
                
                if(panelResumen) panelResumen.classList.add('hidden');
                const colCheck = document.getElementById('col-check');
                if(colCheck) colCheck.innerHTML = '';
            }
            paginaActual = 1;
            obtenerTraspasos();
        });
    }

    // --- SETUP GENERAL ---
    function initDatePickers() {
        const config = { locale: "es", dateFormat: "Y-m-d", altInput: true, altFormat: "d/m/Y", allowInput: true, disableMobile: "true" };
        if (typeof flatpickr !== 'undefined') flatpickr(".flatpickr", config);
    }

    // --- LÓGICA DE DATOS ---
    function obtenerTraspasos() {
        const params = new URLSearchParams();
        
        // Recorrer filtros
        for (const [clave, input] of Object.entries(filtros)) {
            // Verificamos que 'input' exista y tenga un valor distinto de null/undefined
            if (input && input.value !== null && input.value !== undefined && input.value !== "") {
                // CORRECCIÓN: Convertimos a String antes de hacer trim()
                // Esto previene el error si el valor es un número (como caja_id)
                params.set(clave, String(input.value).trim());
            }
        }
        params.set('pagina', paginaActual);

        if(tabla) {
            tabla.innerHTML = `<tr><td colspan="9" class="text-center py-10"><div class="animate-spin h-8 w-8 border-4 border-cyan-500 rounded-full border-t-transparent mx-auto"></div></td></tr>`;
        }

        fetch(`https://cambiosorion.cl/data/traspasos-caja.php?${params.toString()}`)
            .then(response => response.json())
            .then(data => {
                if(Array.isArray(data)) {
                    mostrarResultados(data);
                    actualizarPaginacion(data.length);
                    if (modoCompletarPendientes) calcularTotales(data);
                } else if (data && data.traspasos) {
                     // Por si la API responde con {traspasos:[], total:0}
                    mostrarResultados(data.traspasos);
                    actualizarPaginacion(data.traspasos.length);
                    if (modoCompletarPendientes) calcularTotales(data.traspasos);
                } else {
                    console.error("Data inválida:", data);
                    if(tabla) tabla.innerHTML = `<tr><td colspan="9" class="text-center py-4 text-red-500">Error en formato de datos.</td></tr>`;
                }
            })
            .catch(error => {
                console.error('Error:', error);
                if(tabla) tabla.innerHTML = `<tr><td colspan="9" class="text-center py-4 text-red-500">Error de conexión.</td></tr>`;
            });
    }

    function formatearNumero(numero) {
        if (numero === null || numero === undefined || numero === '') return '';
        return Number(numero).toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    }

    function formatearFechaHora(fechaString) {
        if (!fechaString) return '';
        try {
            const [datePart, timePart] = fechaString.split(' ');
            const [y, m, d] = datePart.split('-');
            const [h, min] = timePart.split(':');
            return `<div class="flex flex-col"><span class="font-mono font-bold text-gray-600">${h}:${min}</span><span class="text-gray-400 text-[10px]">${d}/${m}/${y}</span></div>`;
        } catch (e) { return fechaString; }
    }

    function mostrarResultados(traspasos) {
        if(!tabla) return;
        tabla.innerHTML = '';

        if (!traspasos || traspasos.length === 0) {
            tabla.innerHTML = `<tr><td colspan="9" class="text-center py-10 text-gray-500 italic">No se encontraron traspasos.</td></tr>`;
            return;
        }

        traspasos.forEach(trx => {
            const tr = document.createElement('tr');
            tr.className = 'hover:brightness-95 transition-all text-gray-800 font-medium border-b border-gray-100 last:border-0 bg-white';

            let checkboxCell = '';
            if (modoCompletarPendientes) {
                // Solo permitimos seleccionar si está pendiente
                const isPendiente = String(trx.estado).toLowerCase() === 'pendiente';
                checkboxCell = `
                    <td class="px-4 py-3 text-center">
                        ${isPendiente ? `<input type="checkbox" class="traspaso-check w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 cursor-pointer" 
                               value="${trx.id}" data-monto="${trx.monto}" data-divisa="${trx.divisa}">` : ''}
                    </td>`;
            } else {
                checkboxCell = `<td class="px-4 py-3"></td>`;
            }

            let estadoClass = "bg-gray-100 text-gray-600";
            const estadoLower = String(trx.estado).toLowerCase();
            if (estadoLower === 'completado') estadoClass = "bg-green-100 text-green-700 border border-green-200";
            if (estadoLower === 'pendiente') estadoClass = "bg-yellow-100 text-yellow-700 border border-yellow-200";
            if (estadoLower === 'anulado') estadoClass = "bg-red-100 text-red-700 border border-red-200";

            tr.innerHTML = `
                ${checkboxCell}
                <td class="px-4 py-3 whitespace-nowrap text-xs">${formatearFechaHora(trx.fecha)}</td>
                <td class="px-4 py-3 font-mono text-xs font-bold text-gray-600">${trx.id}</td>
                <td class="px-4 py-3 text-xs uppercase font-bold text-gray-500 tracking-wide">${trx.caja_origen}</td>
                <td class="px-4 py-3 text-xs uppercase font-bold text-gray-500 tracking-wide">${trx.caja_destino}</td>
                <td class="px-4 py-3 text-center font-black text-slate-700 text-xs">${trx.divisa}</td>
                <td class="px-4 py-3 text-right font-bold font-mono text-slate-800 text-sm">${formatearNumero(trx.monto)}</td>
                <td class="px-4 py-3 text-center"><span class="px-2 py-0.5 rounded text-[10px] uppercase font-bold ${estadoClass}">${trx.estado}</span></td>
                <td class="px-4 py-3 text-center">
                    <button class="text-gray-400 hover:text-cyan-600 transition" onclick="window.location.href='detalle-traspaso?id=${trx.id}'">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                    </button>
                </td>
            `;
            tabla.appendChild(tr);
        });

        if (modoCompletarPendientes) {
            document.querySelectorAll('.traspaso-check').forEach(chk => {
                chk.addEventListener('change', actualizarResumenSeleccion);
            });
        }
    }

    // --- LÓGICA COMPLETAR PENDIENTES ---
    function calcularTotales(data) {
        totalesPorDivisa = {};
        data.forEach(trx => {
            if (String(trx.estado).toLowerCase() === 'pendiente') {
                if (!totalesPorDivisa[trx.divisa]) totalesPorDivisa[trx.divisa] = 0;
                totalesPorDivisa[trx.divisa] += parseFloat(trx.monto);
            }
        });
        
        if(listaResumenGlobal) {
            listaResumenGlobal.innerHTML = '';
            for (const [divisa, total] of Object.entries(totalesPorDivisa)) {
                const li = document.createElement('li');
                li.className = "flex justify-between items-center text-xs border-b border-indigo-200/50 py-1 last:border-0";
                li.innerHTML = `<span class="font-bold text-indigo-800">${divisa}:</span> <span class="font-mono text-gray-700">${total.toLocaleString('es-CL')}</span>`;
                listaResumenGlobal.appendChild(li);
            }
        }
    }

    function actualizarResumenSeleccion() {
        if(!listaResumenSeleccion) return;
        
        const seleccionados = document.querySelectorAll('.traspaso-check:checked');
        let totalSeleccionado = {};

        seleccionados.forEach(chk => {
            const divisa = chk.dataset.divisa;
            const monto = parseFloat(chk.dataset.monto);
            if (!totalSeleccionado[divisa]) totalSeleccionado[divisa] = 0;
            totalSeleccionado[divisa] += monto;
        });

        listaResumenSeleccion.innerHTML = '';
        if (Object.keys(totalSeleccionado).length === 0) {
            listaResumenSeleccion.innerHTML = '<li class="text-gray-400 italic font-normal">0 seleccionados</li>';
            return;
        }

        for (const [divisa, total] of Object.entries(totalSeleccionado)) {
            const li = document.createElement('li');
            li.className = "flex justify-between gap-3 text-xs";
            li.innerHTML = `<span>${divisa}:</span> <span>${total.toLocaleString('es-CL')}</span>`;
            listaResumenSeleccion.appendChild(li);
        }
    }

    if (confirmarCompletadoBtn) {
        confirmarCompletadoBtn.addEventListener('click', () => {
            const ids = Array.from(document.querySelectorAll('.traspaso-check:checked')).map(cb => cb.value);
            
            if (ids.length === 0) {
                mostrarModalError({ titulo: "Sin selección", mensaje: "Selecciona al menos un traspaso." });
                return;
            }

            fetch('https://cambiosorion.cl/data/traspasos-caja.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: ids })
            })
            .then(res => res.json())
            .then(data => {
                if (data.exito) {
                    mostrarModalExitoso();
                } else {
                    mostrarModalError({ titulo: "Error", mensaje: data.mensaje || "Error al actualizar." });
                }
            })
            .catch(err => {
                console.error(err);
                mostrarModalError({ titulo: "Error de red", mensaje: "No se pudo conectar con el servidor." });
            });
        });
    }

    // --- PAGINACIÓN Y FILTROS ---
    function actualizarPaginacion(cantidadResultados) {
        if (pageIndicator) pageIndicator.textContent = `Página ${paginaActual}`;
        if (contadorRegistros) contadorRegistros.textContent = `${cantidadResultados} registros visibles`;
        const limite = parseInt(filtros.mostrar ? filtros.mostrar.value : 25) || 25;
        
        if (btnPrev) btnPrev.disabled = (paginaActual <= 1);
        if (btnNext) btnNext.disabled = (cantidadResultados < limite);
    }

    if (btnPrev) btnPrev.addEventListener('click', () => { if (paginaActual > 1) { paginaActual--; obtenerTraspasos(); } });
    if (btnNext) btnNext.addEventListener('click', () => { paginaActual++; obtenerTraspasos(); });

    if (borrarFiltrosBtn) {
        borrarFiltrosBtn.addEventListener('click', () => {
            Object.values(filtros).forEach(input => {
                if(!input || input === filtros.caja_id) return;
                input.value = '';
                if(input._flatpickr) input._flatpickr.clear();
                input.disabled = false;
            });
            
            if (modoCompletarPendientes) {
                if(filtros.estado) {
                    filtros.estado.value = "pendiente";
                    filtros.estado.disabled = true;
                }
            } else {
                if(filtros.mostrar) filtros.mostrar.value = '25';
            }
            paginaActual = 1;
            obtenerTraspasos();
        });
    }

    Object.values(filtros).forEach(input => {
        if(input && input.tagName) { // Evitar el objeto caja_id
            const resetAndFetch = () => { paginaActual = 1; obtenerTraspasos(); };
            input.addEventListener('input', resetAndFetch);
            input.addEventListener('change', resetAndFetch);
        }
    });

    // --- MODALES ---
    function mostrarModalError({ titulo, mensaje }) {
        const modal = document.getElementById("modal-error");
        if(modal) {
            document.getElementById("modal-error-titulo").textContent = titulo;
            document.getElementById("modal-error-mensaje").textContent = mensaje;
            const btnOk = document.getElementById("modal-error-confirmar");
            const btnCancel = document.getElementById("modal-error-cancelar");
            
            modal.classList.remove("hidden");
            if(btnCancel) btnCancel.classList.add("hidden"); 

            if(btnOk) btnOk.onclick = () => modal.classList.add("hidden");
        } else {
            alert(`${titulo}: ${mensaje}`);
        }
    }

    function mostrarModalExitoso() {
        const modal = document.getElementById("modal-exitoso");
        if(modal) {
            modal.classList.remove("hidden");
            document.getElementById("volver").onclick = () => {
                modal.classList.add("hidden");
                location.reload();
            };
        } else {
            alert('Operación exitosa');
            location.reload();
        }
    }

    // --- LLAMADA INICIAL ---
    // Llamar a obtenerTraspasos solo después de que caja_id se haya intentado establecer
    obtenerTraspasos();
});