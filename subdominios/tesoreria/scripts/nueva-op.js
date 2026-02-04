import { initSystem } from './index.js';

document.addEventListener("DOMContentLoaded", async () => {
    // 1. Inicializar sistema (Sidebar y Header)
    // Usamos 'nueva-operacion' para iluminar el sidebar si corresponde
    await initSystem('nueva-operacion');

    const form = document.getElementById("form-nueva-operacion");
    const cajaSelect = document.getElementById("caja");
    const clienteInput = document.getElementById("cliente");
    const resultadoClientes = document.getElementById("resultado-clientes");
    const containerDivisas = document.getElementById("contenedor-divisas");
    const templateFila = document.getElementById("template-fila");
    const totalDisplay = document.getElementById("total-display");
    const totalFinal = document.getElementById("total-final");
    
    // El usuarioSesionId ahora se gestiona principalmente en PHP via sesión,
    // pero mantenemos la lógica de verificación frontend por seguridad UX.
    const btnSubmit = document.querySelector("button[type='submit']");

    // Validar Sesión Activa
    fetch("https://cambiosorion.cl/data/session_status.php", { credentials: 'include' })
        .then(r => r.json())
        .then(data => {
            if (!data.isAuthenticated) {
                mostrarModal({ tipo: 'error', titulo: "Sesión Expirada", mensaje: "Por favor inicie sesión nuevamente.", onConfirmar: () => window.location.href = 'https://admin.cambiosorion.cl/login' });
            }
        });

    // 2. Cargar Cajas
    async function cargarCajas() {
        try {
            const res = await fetch("https://tesoreria.cambiosorion.cl/api/nueva-op.php?buscar_cajas=1");
            const cajas = await res.json();
            cajaSelect.innerHTML = '';
            cajas.forEach(c => {
                const opt = document.createElement("option");
                opt.value = c.id; opt.textContent = c.nombre;
                cajaSelect.appendChild(opt);
            });
        } catch(e) { console.error(e); }
    }
    cargarCajas();

    // 3. Buscador Cliente
    let clienteTimeout;
    clienteInput.addEventListener("input", () => {
        clearTimeout(clienteTimeout);
        const q = clienteInput.value.trim();
        if (q.length < 2) { resultadoClientes.classList.add("hidden"); return; }
        
        clienteTimeout = setTimeout(async () => {
            try {
                const res = await fetch(`https://tesoreria.cambiosorion.cl/api/nueva-op.php?buscar_cliente=${encodeURIComponent(q)}`);
                const clientes = await res.json();
                resultadoClientes.innerHTML = "";
                clientes.forEach(c => {
                    const li = document.createElement("li");
                    li.textContent = c.nombre;
                    li.className = "p-2 hover:bg-slate-100 cursor-pointer text-sm text-slate-800 border-b border-slate-100 last:border-0 transition";
                    li.addEventListener("click", () => {
                        clienteInput.value = c.nombre;
                        clienteInput.dataset.id = c.id;
                        resultadoClientes.classList.add("hidden");
                    });
                    resultadoClientes.appendChild(li);
                });
                resultadoClientes.classList.remove("hidden");
            } catch(e) { console.error("Error buscando cliente", e); }
        }, 300);
    });

    // Cerrar lista clientes al hacer click fuera
    document.addEventListener("click", (e) => {
        if(!clienteInput.contains(e.target) && !resultadoClientes.contains(e.target)) {
            resultadoClientes.classList.add("hidden");
        }
    });

    // 4. Lógica Filas Divisas
    function agregarFila() {
        const clone = templateFila.content.cloneNode(true);
        const fila = clone.querySelector(".fila-divisa");
        
        const inpDivisa = fila.querySelector(".input-divisa");
        const ulDivisa = fila.querySelector(".lista-sugerencias");
        const inpMonto = fila.querySelector(".input-monto");
        const inpTasa = fila.querySelector(".input-tasa");
        const divSubtotal = fila.querySelector(".input-subtotal");
        const btnDel = fila.querySelector(".btn-eliminar");
        const iconContainer = fila.querySelector(".icon-container");

        // Buscador Divisa en Fila
        inpDivisa.addEventListener("input", async (e) => {
            const q = e.target.value.trim();
            if(q.length < 1) { ulDivisa.classList.add("hidden"); return; }
            
            try {
                const res = await fetch(`https://tesoreria.cambiosorion.cl/api/nueva-op.php?buscar_divisa=${encodeURIComponent(q)}`);
                const divisas = await res.json();
                ulDivisa.innerHTML = "";
                divisas.forEach(d => {
                    const li = document.createElement("li");
                    li.className = "p-2 hover:bg-slate-100 cursor-pointer text-sm text-slate-800 flex items-center gap-2 border-b border-slate-100 last:border-0";
                    
                    // Icono SVG o Imagen
                    let iconHtml = `<svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;
                    if(d.icono) iconHtml = `<img src="${d.icono}" class="w-5 h-5 object-contain">`;
                    
                    li.innerHTML = `${iconHtml} ${d.nombre}`;
                    
                    li.addEventListener("click", () => {
                        inpDivisa.value = d.nombre;
                        inpDivisa.dataset.id = d.id;
                        iconContainer.innerHTML = iconHtml;
                        ulDivisa.classList.add("hidden");
                        
                        // Buscar Precio Sugerido
                        const tipoOp = document.querySelector('input[name="tipo_op"]:checked').value; // Compra o Venta
                        fetch(`https://tesoreria.cambiosorion.cl/api/nueva-op.php?precio_divisa=${encodeURIComponent(d.nombre)}&tipo=${tipoOp.toLowerCase()}`)
                            .then(r => r.json())
                            .then(p => {
                                if(p.precio) {
                                    inpTasa.value = p.precio;
                                    calcularFila();
                                }
                            });
                    });
                    ulDivisa.appendChild(li);
                });
                ulDivisa.classList.remove("hidden");
            } catch(e){}
        });

        // Cálculos
        const calcularFila = () => {
            const m = parseFloat(inpMonto.value.replace(/\./g, '')) || 0;
            const t = parseFloat(inpTasa.value) || 0;
            const sub = Math.round(m * t);
            divSubtotal.textContent = "$" + sub.toLocaleString("es-CL");
            divSubtotal.dataset.val = sub;
            calcularTotalGeneral();
        };

        inpMonto.addEventListener("input", (e) => {
            let v = e.target.value.replace(/\D/g, '');
            if(v) e.target.value = parseInt(v).toLocaleString("es-CL");
            calcularFila();
        });
        
        inpTasa.addEventListener("input", calcularFila);

        // Eliminar
        btnDel.addEventListener("click", () => {
            fila.remove();
            calcularTotalGeneral();
        });

        // Cerrar lista click fuera
        document.addEventListener("click", (e) => {
            if(!inpDivisa.contains(e.target) && !ulDivisa.contains(e.target)) ulDivisa.classList.add("hidden");
        });

        containerDivisas.appendChild(fila);
    }

    function calcularTotalGeneral() {
        let total = 0;
        document.querySelectorAll(".input-subtotal").forEach(el => {
            total += parseFloat(el.dataset.val || 0);
        });
        const fmt = "$" + total.toLocaleString("es-CL");
        totalDisplay.textContent = fmt;
        totalFinal.textContent = fmt;
    }

    const btnAgregar = document.getElementById("btn-agregar-fila");
    if(btnAgregar) btnAgregar.addEventListener("click", agregarFila);
    
    // Iniciar con una fila vacía
    agregarFila();

    // 5. Submit Formulario
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const tipoOp = document.querySelector('input[name="tipo_op"]:checked').value;
        const clienteId = clienteInput.dataset.id;
        
        // Recopilar detalles
        const detalles = [];
        let totalCalc = 0;
        
        document.querySelectorAll(".fila-divisa").forEach(row => {
            const divId = row.querySelector(".input-divisa").dataset.id;
            const monto = parseFloat(row.querySelector(".input-monto").value.replace(/\./g, ''));
            const tasa = parseFloat(row.querySelector(".input-tasa").value);
            const sub = parseFloat(row.querySelector(".input-subtotal").dataset.val);
            
            if(divId && monto > 0 && tasa > 0) {
                detalles.push({ divisa_id: divId, monto: monto, tasa_cambio: tasa, subtotal: sub });
                totalCalc += sub;
            }
        });

        if(detalles.length === 0) return mostrarModal({ tipo: 'error', titulo: "Faltan Datos", mensaje: "Agregue al menos una divisa con monto y tasa." });

        const payload = {
            caja: cajaSelect.value,
            tipo_transaccion: tipoOp,
            cliente_id: clienteId || null, 
            tipo_documento: document.getElementById("tipo-documento").value,
            observaciones: document.getElementById("observaciones").value,
            total: totalCalc,
            detalles: detalles
        };

        try {
            const res = await fetch("https://tesoreria.cambiosorion.cl/api/nueva-op.php", {
                method: "POST", credentials: 'include', headers: {"Content-Type":"application/json"}, body: JSON.stringify(payload)
            });
            const data = await res.json();
            
            if(data.success) {
                // Mostrar Modal de Éxito Especial
                mostrarModal({ 
                    tipo: 'exito-operacion', 
                    titulo: "Operación Creada", 
                    mensaje: `Código: #${data.codigo_operacion || "---"}`, 
                    dataAdicional: data 
                });
                
                // Resetear form en background
                form.reset();
                containerDivisas.innerHTML = ''; 
                agregarFila(); 
                clienteInput.dataset.id = "";
                calcularTotalGeneral();
            } else {
                mostrarModal({ tipo: 'error', titulo: "Error al Guardar", mensaje: data.error || "Error desconocido" });
            }
        } catch(e) { 
            console.error(e);
            mostrarModal({ tipo: 'error', titulo: "Error de Conexión", mensaje: "No se pudo conectar con el servidor." }); 
        }
    });

    // --- SISTEMA DE MODALES MEJORADO ---
    function mostrarModal({ tipo = 'info', titulo, mensaje, dataAdicional, onConfirmar }) {
        const modal = document.getElementById("modal-generico");
        const iconoDiv = document.getElementById("modal-generico-icono");
        const btnsDefault = document.getElementById("modal-botones-default");
        const btnsExito = document.getElementById("modal-botones-exito");
        const btnIrDetalle = document.getElementById("btn-ir-detalle");

        // Iconos SVG
        const iconos = {
            'exito': `<div class="p-3 rounded-full bg-green-900/30 border border-green-500/30"><svg class="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg></div>`,
            'exito-operacion': `<div class="p-3 rounded-full bg-blue-900/30 border border-blue-500/30"><svg class="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div>`,
            'error': `<div class="p-3 rounded-full bg-red-900/30 border border-red-500/30"><svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></div>`,
            'advertencia': `<div class="p-3 rounded-full bg-amber-900/30 border border-amber-500/30"><svg class="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg></div>`
        };

        if(iconoDiv) iconoDiv.innerHTML = iconos[tipo] || iconos['info'];

        document.getElementById("modal-generico-titulo").textContent = titulo;
        
        // Si es exito-operacion, el mensaje puede llevar HTML (para el codigo en bold)
        const pMensaje = document.getElementById("modal-generico-mensaje");
        if (tipo === 'exito-operacion') {
            pMensaje.innerHTML = mensaje.replace('#', '<span class="text-white font-mono font-bold text-lg block mt-1">#') + '</span>';
            btnsDefault.classList.add("hidden");
            btnsExito.classList.remove("hidden");
            
            if(dataAdicional && dataAdicional.operacion_id && btnIrDetalle) {
                btnIrDetalle.onclick = () => window.location.href = `detalle-op?id=${dataAdicional.operacion_id}`;
            }
        } else {
            pMensaje.textContent = mensaje;
            btnsDefault.classList.remove("hidden");
            btnsExito.classList.add("hidden");
            
            // Configurar botón aceptar default
            const btnOk = document.getElementById("modal-generico-confirmar");
            const newOk = btnOk.cloneNode(true);
            btnOk.parentNode.replaceChild(newOk, btnOk);
            
            newOk.onclick = () => {
                document.getElementById("modal-generico").classList.add("hidden");
                if (onConfirmar) onConfirmar();
            };
            
            // Ocultar cancelar si es error simple
            const btnCancel = document.getElementById("modal-generico-cancelar");
            if (tipo === 'error') btnCancel.classList.add('hidden');
            else btnCancel.classList.remove('hidden');
            
            btnCancel.onclick = () => document.getElementById("modal-generico").classList.add("hidden");
        }

        modal.classList.remove("hidden");
    }

    // Eventos extra: Actualizar tasas si cambia el tipo de operación (Compra/Venta)
    document.querySelectorAll('input[name="tipo_op"]').forEach(r => {
        r.addEventListener('change', () => {
            const nuevoTipo = document.querySelector('input[name="tipo_op"]:checked').value;
            
            // Recorrer todas las filas existentes
            document.querySelectorAll(".fila-divisa").forEach(fila => {
                const inpDivisa = fila.querySelector(".input-divisa");
                const inpTasa = fila.querySelector(".input-tasa");
                const nombreDivisa = inpDivisa.value.trim();

                // Solo actualizar si hay una divisa seleccionada
                if (nombreDivisa) {
                    // Feedback visual (opacidad) mientras carga
                    inpTasa.classList.add("opacity-50", "cursor-wait");
                    
                    fetch(`https://tesoreria.cambiosorion.cl/api/nueva-op.php?precio_divisa=${encodeURIComponent(nombreDivisa)}&tipo=${nuevoTipo}`)
                        .then(res => res.json())
                        .then(data => {
                            if (data.precio) {
                                inpTasa.value = data.precio;
                                // IMPORTANTE: Disparar el evento 'input' manualmente para que 
                                // se ejecute la función calcularFila() y se actualice el subtotal
                                inpTasa.dispatchEvent(new Event('input'));
                                
                                // Efecto visual flash para indicar cambio
                                inpTasa.classList.add("bg-amber-900/30", "text-amber-300");
                                setTimeout(() => inpTasa.classList.remove("bg-amber-900/30", "text-amber-300"), 500);
                            }
                        })
                        .catch(err => console.error("Error al actualizar tasa automática", err))
                        .finally(() => {
                            inpTasa.classList.remove("opacity-50", "cursor-wait");
                        });
                }
            });
        });
    });
});