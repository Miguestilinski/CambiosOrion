document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("form-nueva-operacion");
    const cajaSelect = document.getElementById("caja");
    const clienteInput = document.getElementById("cliente");
    const resultadoClientes = document.getElementById("resultado-clientes");
    const containerDivisas = document.getElementById("contenedor-divisas");
    const templateFila = document.getElementById("template-fila");
    const totalDisplay = document.getElementById("total-display");
    const totalFinal = document.getElementById("total-final");
    
    let usuarioSesionId = null;
    const btnSubmit = document.querySelector("button[type='submit']");

    // 1. Sesión
    if(btnSubmit) { btnSubmit.disabled = true; btnSubmit.classList.add("opacity-50"); }
    
    async function initSesion() {
        try {
            const res = await fetch("https://cambiosorion.cl/data/session_status.php", { credentials: 'include' });
            const data = await res.json();
            if (data.isAuthenticated && data.equipo_id) {
                usuarioSesionId = data.equipo_id;
                if(btnSubmit) { btnSubmit.disabled = false; btnSubmit.classList.remove("opacity-50"); }
            } else { mostrarAlerta("Sesión no válida."); }
        } catch (e) { console.error(e); }
    }
    initSesion();

    // 2. Cargar Cajas
    async function cargarCajas() {
        try {
            const res = await fetch("https://cambiosorion.cl/data/nueva-op.php?buscar_cajas=1");
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
            const res = await fetch(`https://cambiosorion.cl/data/nueva-op.php?buscar_cliente=${encodeURIComponent(q)}`);
            const clientes = await res.json();
            resultadoClientes.innerHTML = "";
            clientes.forEach(c => {
                const li = document.createElement("li");
                li.textContent = c.nombre;
                li.className = "p-2 hover:bg-gray-100 cursor-pointer text-sm text-gray-800 border-b border-gray-100";
                li.addEventListener("click", () => {
                    clienteInput.value = c.nombre;
                    clienteInput.dataset.id = c.id;
                    resultadoClientes.classList.add("hidden");
                });
                resultadoClientes.appendChild(li);
            });
            resultadoClientes.classList.remove("hidden");
        }, 300);
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
                const res = await fetch(`https://cambiosorion.cl/data/nueva-op.php?buscar_divisa=${encodeURIComponent(q)}`);
                const divisas = await res.json();
                ulDivisa.innerHTML = "";
                divisas.forEach(d => {
                    const li = document.createElement("li");
                    li.className = "p-2 hover:bg-gray-100 cursor-pointer text-sm text-gray-800 flex items-center gap-2";
                    const img = d.icono ? `<img src="${d.icono}" class="w-5 h-5 object-contain">` : '';
                    li.innerHTML = `${img} ${d.nombre}`;
                    
                    li.addEventListener("click", () => {
                        inpDivisa.value = d.nombre;
                        inpDivisa.dataset.id = d.id;
                        if(d.icono) iconContainer.innerHTML = `<img src="${d.icono}" class="w-5 h-5 object-contain">`;
                        ulDivisa.classList.add("hidden");
                        
                        // Buscar Precio Sugerido
                        const tipoOp = document.querySelector('input[name="tipo_op"]:checked').value; // Compra o Venta
                        fetch(`https://cambiosorion.cl/data/nueva-op.php?precio_divisa=${encodeURIComponent(d.nombre)}&tipo=${tipoOp.toLowerCase()}`)
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

    document.getElementById("btn-agregar-fila").addEventListener("click", agregarFila);
    
    // Iniciar con una fila
    agregarFila();

    // 5. Submit
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        if(!usuarioSesionId) return mostrarAlerta("Sin sesión activa.");

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

        if(detalles.length === 0) return mostrarAlerta("Agregue al menos una divisa con monto y tasa.");

        const payload = {
            caja: cajaSelect.value,
            tipo_transaccion: tipoOp,
            cliente_id: clienteId || null, // Puede ser anónimo
            tipo_documento: document.getElementById("tipo-documento").value,
            observaciones: document.getElementById("observaciones").value,
            total: totalCalc,
            detalles: detalles,
            // El vendedor ID se saca de la sesión en PHP, pero podemos enviarlo como respaldo si tu lógica lo requiere
            // pero la validación de seguridad está en PHP usando usuario_id
        };

        try {
            const res = await fetch("https://cambiosorion.cl/data/nueva-op.php", {
                method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify(payload)
            });
            const data = await res.json();
            
            if(data.success) {
                document.getElementById("codigo-op-exito").textContent = data.codigo_operacion || "---";
                document.getElementById("btn-ir-detalle").onclick = () => window.location.href = `detalle-op?id=${data.operacion_id}`;
                document.getElementById("modal-exitoso").classList.remove("hidden");
                form.reset();
                containerDivisas.innerHTML = ''; // Limpiar filas
                agregarFila(); // Una nueva vacía
                clienteInput.dataset.id = "";
                calcularTotalGeneral();
            } else {
                mostrarAlerta(data.error || "Error desconocido");
            }
        } catch(e) { mostrarAlerta("Error de conexión."); }
    });

    function mostrarAlerta(msg) {
        document.getElementById("modal-mensaje").textContent = msg;
        document.getElementById("modal-alerta").classList.remove("hidden");
        document.getElementById("cerrar-modal").onclick = () => document.getElementById("modal-alerta").classList.add("hidden");
    }

    // Actualizar tasas si cambia el tipo de operación (Compra/Venta)
    document.querySelectorAll('input[name="tipo_op"]').forEach(r => {
        r.addEventListener('change', () => {
            // Aquí podrías recorrer las filas y re-consultar el precio sugerido si ya hay divisa seleccionada
        });
    });
});