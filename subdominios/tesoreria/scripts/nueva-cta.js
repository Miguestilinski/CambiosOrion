import { initSystem } from './index.js';

document.addEventListener("DOMContentLoaded", async () => {
    // 1. Inicializar sistema (Sidebar y Header)
    // Usamos 'cuentas' para iluminar el link correcto en el sidebar
    await initSystem('cuentas');

    const clienteInput = document.getElementById("cliente");
    const resultadoClientes = document.getElementById("resultado-clientes");
    const divisaInput = document.getElementById("divisa");
    const divisaSugerencias = document.getElementById("divisa-sugerencias");
    const cancelarBtn = document.getElementById('cancelar');
    const nombreCuentaInput = document.getElementById("nombre-cuenta");
    const esAdministrativaCheckbox = document.getElementById("es-administrativa");
    const mensajeFuncionario = document.getElementById("mensaje-funcionario");
    const form = document.getElementById("form-nueva-cta");

    let clienteSeleccionado = null;
    let divisaSeleccionada = null;
    let esFuncionarioSeleccionado = false;
    let ultimaVerificacionId = 0;

    // --- NAVEGACIÓN ---
    if (cancelarBtn) {
        cancelarBtn.addEventListener('click', () => {
            window.location.href = 'https://tesoreria.cambiosorion.cl/cuentas';
        });
    }

    // --- LÓGICA DE NEGOCIO ---
    function determinarTipoCuenta() {
        const tieneCliente = clienteSeleccionado !== null;
        const esAdminChecked = esAdministrativaCheckbox.checked;

        if (esAdminChecked) return "administrativa"; 
        if (tieneCliente && esFuncionarioSeleccionado) return "funcionario"; 
        if (tieneCliente && !esFuncionarioSeleccionado) return "cliente"; 
        
        // Si no hay cliente y no es admin explícito, por defecto admin interno
        if (!tieneCliente) return "administrativa"; 

        return "general"; 
    }

    function actualizarNombreCuenta() {
        if (clienteSeleccionado && divisaSeleccionada) {
            // Sugerencia automática: "NombreCliente CODIGO"
            nombreCuentaInput.value = `${clienteSeleccionado.nombre} ${divisaSeleccionada.codigo}`;
        }
    }

    function actualizarTipoCuentaVisualmente() {
        const tipo = determinarTipoCuenta();
        
        // Sincronizar checkbox si el sistema detecta que debe ser administrativa
        if(tipo === 'administrativa' && !esAdministrativaCheckbox.checked && !clienteSeleccionado) {
             // Solo forzamos visualmente si no hay conflicto lógico
        }

        if (mensajeFuncionario) {
            mensajeFuncionario.classList.toggle("hidden", tipo !== "funcionario");
        }
    }

    // --- BUSCADORES ---
    
    // 1. Cliente
    let clienteTimeout;
    clienteInput.addEventListener("input", (e) => {
        clearTimeout(clienteTimeout);
        const query = e.target.value.trim();
        
        // Reset al escribir
        clienteSeleccionado = null;
        esFuncionarioSeleccionado = false;
        mensajeFuncionario.classList.add("hidden");
        
        if (query.length < 2) {
            resultadoClientes.classList.add("hidden");
            return;
        }

        clienteTimeout = setTimeout(async () => {
            try {
                const res = await fetch(`https://cambiosorion.cl/data/nueva-cta.php?buscar_cliente=${encodeURIComponent(query)}`);
                if (!res.ok) throw new Error("Error en búsqueda");
                
                const clientes = await res.json();
                resultadoClientes.innerHTML = "";
                
                if(clientes.length === 0) {
                    resultadoClientes.innerHTML = `<li class="p-3 text-xs text-slate-500 italic text-center">No se encontraron clientes</li>`;
                }

                clientes.forEach((cliente) => {
                    const li = document.createElement("li");
                    li.textContent = cliente.nombre;
                    li.className = "px-4 py-2 hover:bg-slate-100 cursor-pointer text-sm text-slate-800 border-b border-slate-100 last:border-0 transition";
                    
                    li.addEventListener("click", async () => {
                        seleccionarCliente(cliente);
                    });
                    resultadoClientes.appendChild(li);
                });
                resultadoClientes.classList.remove("hidden");
            } catch (error) {
                console.error(error);
            }
        }, 300);
    });

    async function seleccionarCliente(cliente) {
        clienteInput.value = cliente.nombre;
        clienteSeleccionado = cliente;
        resultadoClientes.classList.add("hidden");
        
        // Al seleccionar cliente, desactivamos "Administrativa" si estaba activa
        esAdministrativaCheckbox.checked = false;
        clienteInput.disabled = false;

        // Verificar si es funcionario
        const verificacionIdActual = ++ultimaVerificacionId;
        try {
            const resultado = await verificarFuncionario(cliente.rut);
            if (verificacionIdActual === ultimaVerificacionId) {
                esFuncionarioSeleccionado = resultado.esFuncionario;
                actualizarTipoCuentaVisualmente();
            }
        } catch (e) { console.error(e); }

        actualizarNombreCuenta();
    }

    async function verificarFuncionario(rut) {
        if (!rut || rut.trim() === '') return { esFuncionario: false };
        try {
            const res = await fetch(`https://cambiosorion.cl/data/nueva-cta.php?rut=${encodeURIComponent(rut)}`);
            if (!res.ok) return { esFuncionario: false };
            const data = await res.json();
            return { esFuncionario: !!data.es_funcionario };
        } catch (error) { return { esFuncionario: false }; }
    }

    // 2. Divisa
    let divisaTimeout;
    divisaInput.addEventListener("input", (e) => {
        clearTimeout(divisaTimeout);
        const query = e.target.value.trim();
        divisaSeleccionada = null;
        
        if (query.length < 1) {
            divisaSugerencias.classList.add("hidden");
            return;
        }

        divisaTimeout = setTimeout(async () => {
            try {
                const res = await fetch(`https://cambiosorion.cl/data/nueva-cta.php?buscar_divisa=${encodeURIComponent(query)}`);
                const divisas = await res.json();
                divisaSugerencias.innerHTML = "";
                
                divisas.forEach((divisa) => {
                    const li = document.createElement("li");
                    li.innerHTML = `<span class="font-bold text-amber-600">${divisa.codigo}</span> - ${divisa.nombre}`;
                    li.className = "px-4 py-2 hover:bg-slate-100 cursor-pointer text-sm text-slate-800 border-b border-slate-100 last:border-0 transition";
                    
                    li.addEventListener("click", () => {
                        divisaInput.value = divisa.nombre;
                        divisaSeleccionada = divisa;
                        divisaSugerencias.classList.add("hidden");
                        actualizarNombreCuenta();
                    });      
                    divisaSugerencias.appendChild(li);
                });
                divisaSugerencias.classList.remove("hidden");
            } catch (error) { console.error(error); }
        }, 300);
    });

    // Cerrar dropdowns al clickear fuera
    document.addEventListener("click", (e) => {
        if (!clienteInput.contains(e.target) && !resultadoClientes.contains(e.target)) resultadoClientes.classList.add("hidden");
        if (!divisaInput.contains(e.target) && !divisaSugerencias.contains(e.target)) divisaSugerencias.classList.add("hidden");
    });

    // Checkbox Administrativa
    esAdministrativaCheckbox.addEventListener("change", () => {
        if (esAdministrativaCheckbox.checked) {
            // Modo Administrativa: Limpiar cliente
            clienteInput.value = "";
            clienteInput.disabled = true;
            clienteInput.classList.add("opacity-50", "cursor-not-allowed");
            clienteSeleccionado = null;
            esFuncionarioSeleccionado = false;
            mensajeFuncionario.classList.add("hidden");
        } else {
            // Modo Normal
            clienteInput.disabled = false;
            clienteInput.classList.remove("opacity-50", "cursor-not-allowed");
        }
        actualizarNombreCuenta();
    });

    // --- SUBMIT ---
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        if (!divisaSeleccionada) return mostrarModal({ tipo: 'error', titulo: "Falta Divisa", mensaje: "Debes seleccionar una divisa válida de la lista." });
        
        const nombreCuenta = nombreCuentaInput.value.trim();
        if (nombreCuenta.length === 0) return mostrarModal({ tipo: 'error', titulo: "Falta Nombre", mensaje: "Debes asignar un nombre a la cuenta." });

        const tipoCuenta = determinarTipoCuenta();

        const payload = {
            cliente_id: clienteSeleccionado ? clienteSeleccionado.id : null,
            divisa_id: divisaSeleccionada.id,
            nombre_cuenta: nombreCuenta,
            tipo_cuenta: tipoCuenta,
        };

        enviarDatos(payload);
    });

    async function enviarDatos(payload, forzar = false) {
        try {
            const url = forzar ? `https://cambiosorion.cl/data/nueva-cta.php?forzar=1` : `https://cambiosorion.cl/data/nueva-cta.php`;
            
            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (data.success) {
                mostrarModal({ 
                    tipo: 'exito', 
                    titulo: "Cuenta Creada", 
                    mensaje: "La cuenta ha sido generada correctamente.",
                    onConfirmar: () => {
                        form.reset();
                        clienteSeleccionado = null;
                        divisaSeleccionada = null;
                        esAdministrativaCheckbox.checked = false;
                        clienteInput.disabled = false;
                        clienteInput.classList.remove("opacity-50");
                    }
                });
            } else if (data.warning && data.continue_possible) {
                // Advertencia (ej: Cuenta duplicada para cliente)
                mostrarModal({
                    tipo: 'advertencia',
                    titulo: "Atención",
                    mensaje: data.warning,
                    textoConfirmar: "Crear de todas formas",
                    textoCancelar: "Cancelar",
                    onConfirmar: () => enviarDatos(payload, true) // Reintentar forzando
                });
            } else {
                mostrarModal({ tipo: 'error', titulo: "Error", mensaje: data.error || "No se pudo crear la cuenta." });
            }

        } catch (error) {
            console.error("Error submit:", error);
            mostrarModal({ tipo: 'error', titulo: "Error de Conexión", mensaje: "No se pudo conectar con el servidor." });
        }
    }

    // --- SISTEMA MODALES UNIFICADO (SVG) ---
    function mostrarModal({ tipo = 'info', titulo, mensaje, textoConfirmar = "Aceptar", textoCancelar = null, onConfirmar, onCancelar }) {
        const modal = document.getElementById("modal-generico");
        const iconoDiv = document.getElementById("modal-generico-icono");
        const btnConfirmar = document.getElementById("modal-generico-confirmar");
        const btnCancelar = document.getElementById("modal-generico-cancelar");

        // Iconos SVG
        const iconos = {
            'exito': `<div class="p-3 rounded-full bg-green-900/30 border border-green-500/30"><svg class="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg></div>`,
            'error': `<div class="p-3 rounded-full bg-red-900/30 border border-red-500/30"><svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></div>`,
            'advertencia': `<div class="p-3 rounded-full bg-amber-900/30 border border-amber-500/30"><svg class="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg></div>`,
            'info': ''
        };

        if(iconoDiv) iconoDiv.innerHTML = iconos[tipo] || '';

        document.getElementById("modal-generico-titulo").textContent = titulo;
        document.getElementById("modal-generico-mensaje").textContent = mensaje;
        
        btnConfirmar.textContent = textoConfirmar;
        
        if (textoCancelar) {
            btnCancelar.classList.remove("hidden");
            btnCancelar.textContent = textoCancelar;
        } else {
            btnCancelar.classList.add("hidden");
        }

        modal.classList.remove("hidden");

        const newConfirm = btnConfirmar.cloneNode(true);
        const newCancel = btnCancelar.cloneNode(true);
        btnConfirmar.parentNode.replaceChild(newConfirm, btnConfirmar);
        btnCancelar.parentNode.replaceChild(newCancel, btnCancelar);

        newConfirm.onclick = () => { modal.classList.add("hidden"); if (onConfirmar) onConfirmar(); };
        newCancel.onclick = () => { modal.classList.add("hidden"); if (onCancelar) onCancelar(); };
    }
});