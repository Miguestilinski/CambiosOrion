import { initSystem } from './index.js';

document.addEventListener("DOMContentLoaded", async () => {
    // 1. Init System
    const sessionData = await initSystem('egresos'); 
    
    if (!sessionData || !sessionData.isAuthenticated) return;
    const usuarioSesionId = sessionData.equipo_id || sessionData.id;

    // Referencias
    const form = document.getElementById("form-nuevo-utilidad");
    
    // Toggles
    const radiosTipo = document.getElementsByName("tipo_transaccion");
    const contenedorCuenta = document.getElementById("contenedor-cuenta");
    const cuentaSelect = document.getElementById("cuenta");
    
    // Inputs Principales
    const cajaSelect = document.getElementById("caja");
    const conceptoInput = document.getElementById("concepto");
    const listaConceptos = document.getElementById("lista-conceptos");
    
    const divisaInput = document.getElementById("divisa-input");
    const divisaIdInput = document.getElementById("divisa-id");
    const listaDivisas = document.getElementById("lista-divisas");
    
    const montoInput = document.getElementById("monto");
    const obsInput = document.getElementById("observaciones");
    const limpiarBtn = document.getElementById("limpiar");

    let conceptosCache = [];
    let divisasCache = [];

    // --- LOGICA DE INTERFAZ ---

    // Toggle Efectivo / Cuenta
    radiosTipo.forEach(radio => {
        radio.addEventListener('change', () => {
            if(radio.value === 'cuenta') {
                contenedorCuenta.classList.remove('hidden');
                // Si no hay cuentas cargadas, cargarlas
                if(cuentaSelect.options.length <= 1) cargarCuentas();
            } else {
                contenedorCuenta.classList.add('hidden');
                cuentaSelect.value = "";
            }
        });
    });

    // Limpiar
    if(limpiarBtn) {
        limpiarBtn.addEventListener('click', () => {
            form.reset();
            // Restaurar defaults
            contenedorCuenta.classList.add('hidden');
            divisaInput.value = ""; 
            divisaIdInput.value = "";
            seleccionarDivisaPorDefecto(); // Volver a poner CLP
        });
    }

    // --- CARGA DE DATOS ---

    async function cargarDatosIniciales() {
        try {
            // 1. Cajas
            const resCajas = await fetch("https://cambiosorion.cl/data/nuevo-egr-util.php?buscar_cajas=1");
            const cajas = await resCajas.json();
            
            cajaSelect.innerHTML = '<option value="">Seleccione Caja</option>';
            if(Array.isArray(cajas)) {
                cajas.forEach(c => {
                    const opt = document.createElement("option");
                    opt.value = c.id;
                    opt.textContent = c.nombre;
                    cajaSelect.appendChild(opt);
                });
                // Seleccionar caja usuario o Tesorería (que viene primera por el PHP)
                if(sessionData.caja_id && sessionData.caja_id != 0) {
                    cajaSelect.value = sessionData.caja_id;
                } else if (cajas.length > 0) {
                    cajaSelect.value = cajas[0].id; // Tesorería por defecto
                }
            }

            // 2. Conceptos (Cache)
            const resConceptos = await fetch("https://cambiosorion.cl/data/nuevo-egr-util.php?buscar_conceptos=1");
            conceptosCache = await resConceptos.json();

            // 3. Divisas (Cache)
            const resDivisas = await fetch("https://cambiosorion.cl/data/nuevo-egr-util.php?buscar_divisas=1");
            divisasCache = await resDivisas.json();
            seleccionarDivisaPorDefecto();

        } catch (error) {
            console.error("Error cargando datos:", error);
        }
    }

    async function cargarCuentas() {
        try {
            const res = await fetch("https://cambiosorion.cl/data/nuevo-egr-util.php?buscar_cuentas=1");
            const cuentas = await res.json();
            cuentaSelect.innerHTML = '<option value="">Seleccione Cuenta</option>';
            if(Array.isArray(cuentas)) {
                cuentas.forEach(cta => {
                    const opt = document.createElement("option");
                    opt.value = cta.id;
                    opt.textContent = `${cta.nombre} (${cta.banco || ''})`;
                    cuentaSelect.appendChild(opt);
                });
            }
        } catch (e) { console.error(e); }
    }

    // --- AUTOCOMPLETE: CONCEPTOS ---
    conceptoInput.addEventListener('input', () => {
        const val = conceptoInput.value.toLowerCase();
        listaConceptos.innerHTML = '';
        if(!val) { listaConceptos.classList.add('hidden'); return; }

        const filtrados = conceptosCache.filter(c => c.toLowerCase().includes(val));
        
        // Siempre mostrar opción de lo que escribe como nuevo
        // Pero listar coincidencias
        if (filtrados.length > 0) {
            listaConceptos.classList.remove('hidden');
            filtrados.forEach(c => {
                const div = document.createElement('div');
                div.className = 'autocomplete-item';
                div.textContent = c;
                div.onclick = () => {
                    conceptoInput.value = c;
                    listaConceptos.classList.add('hidden');
                };
                listaConceptos.appendChild(div);
            });
        } else {
            listaConceptos.classList.add('hidden');
        }
    });

    // --- AUTOCOMPLETE: DIVISAS (Con búsqueda real) ---
    divisaInput.addEventListener('input', () => {
        const val = divisaInput.value.toLowerCase();
        listaDivisas.innerHTML = '';
        if(!val) { listaDivisas.classList.add('hidden'); return; }

        const filtrados = divisasCache.filter(d => 
            d.nombre.toLowerCase().includes(val) || 
            d.codigo.toLowerCase().includes(val)
        );

        if (filtrados.length > 0) {
            listaDivisas.classList.remove('hidden');
            filtrados.forEach(d => {
                const div = document.createElement('div');
                div.className = 'autocomplete-item flex justify-between';
                div.innerHTML = `<span>${d.nombre}</span> <span class="font-mono text-amber-500">${d.codigo}</span>`;
                div.onclick = () => {
                    divisaInput.value = `${d.nombre} (${d.codigo})`;
                    divisaIdInput.value = d.id;
                    listaDivisas.classList.add('hidden');
                };
                listaDivisas.appendChild(div);
            });
        } else {
            listaDivisas.innerHTML = '<div class="p-2 text-xs text-slate-500 italic">Sin resultados</div>';
            listaDivisas.classList.remove('hidden');
        }
    });

    // Ocultar listas al hacer click fuera
    document.addEventListener('click', (e) => {
        if (!conceptoInput.contains(e.target)) listaConceptos.classList.add('hidden');
        if (!divisaInput.contains(e.target)) listaDivisas.classList.add('hidden');
    });

    function seleccionarDivisaPorDefecto() {
        if(!divisasCache.length) return;
        // Buscar CLP
        const clp = divisasCache.find(d => d.codigo === 'CLP');
        if(clp) {
            divisaInput.value = `${clp.nombre} (${clp.codigo})`;
            divisaIdInput.value = clp.id;
        }
    }

    cargarDatosIniciales();

    // --- SUBMIT ---
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        // Obtener tipo seleccionado
        let tipoTx = 'efectivo';
        radiosTipo.forEach(r => { if(r.checked) tipoTx = r.value; });

        // Validaciones
        if (!cajaSelect.value) return mostrarModal({ tipo: 'error', titulo: "Falta Caja", mensaje: "Seleccione una caja de origen." });
        if (!conceptoInput.value.trim()) return mostrarModal({ tipo: 'error', titulo: "Falta Concepto", mensaje: "Indique el motivo del retiro." });
        if (!divisaIdInput.value) return mostrarModal({ tipo: 'error', titulo: "Falta Divisa", mensaje: "Seleccione una divisa válida de la lista." });
        
        if (tipoTx === 'cuenta' && !cuentaSelect.value) {
            return mostrarModal({ tipo: 'error', titulo: "Falta Cuenta", mensaje: "Seleccione la cuenta bancaria de cargo." });
        }

        const monto = parseFloat(montoInput.value);
        if (isNaN(monto) || monto <= 0) return mostrarModal({ tipo: 'error', titulo: "Monto Inválido", mensaje: "El monto debe ser mayor a 0." });

        const payload = {
            caja_id: cajaSelect.value,
            item_utilidad: conceptoInput.value.trim(),
            divisa_id: divisaIdInput.value,
            monto: monto,
            observaciones: obsInput.value.trim(),
            usuario_id: usuarioSesionId,
            es_cuenta: (tipoTx === 'cuenta'),
            cuenta_id: (tipoTx === 'cuenta' ? cuentaSelect.value : null)
        };

        try {
            const res = await fetch("https://cambiosorion.cl/data/nuevo-egr-util.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            
            const data = await res.json();

            if (data.success) {
                mostrarModal({ 
                    tipo: 'exito', 
                    titulo: "Retiro Registrado", 
                    mensaje: "El egreso se guardó correctamente.",
                    onConfirmar: () => window.location.reload()
                });
            } else {
                mostrarModal({ tipo: 'error', titulo: "Error", mensaje: data.error || "No se pudo guardar." });
            }

        } catch (error) {
            mostrarModal({ tipo: 'error', titulo: "Error Conexión", mensaje: "Fallo al comunicar con el servidor." });
        }
    });

    // --- MODAL SIMPLE ---
    function mostrarModal({ tipo = 'info', titulo, mensaje, onConfirmar }) {
        const modal = document.getElementById("modal-generico");
        const iconoDiv = document.getElementById("modal-generico-icono");
        const btnConfirmar = document.getElementById("modal-generico-confirmar");

        const iconos = {
            'exito': `<div class="p-3 rounded-full bg-green-900/30 border border-green-500/30"><svg class="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg></div>`,
            'error': `<div class="p-3 rounded-full bg-red-900/30 border border-red-500/30"><svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></div>`
        };

        iconoDiv.innerHTML = iconos[tipo] || '';
        document.getElementById("modal-generico-titulo").textContent = titulo;
        document.getElementById("modal-generico-mensaje").textContent = mensaje;
        
        modal.classList.remove("hidden");

        const newConfirm = btnConfirmar.cloneNode(true);
        btnConfirmar.parentNode.replaceChild(newConfirm, btnConfirmar);

        newConfirm.onclick = () => { 
            modal.classList.add("hidden"); 
            if (onConfirmar) onConfirmar(); 
        };
    }
});