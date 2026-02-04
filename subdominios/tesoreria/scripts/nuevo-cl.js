import { initSystem } from './index.js';

document.addEventListener("DOMContentLoaded", async () => {
    // 1. Inicializar sistema (Sidebar y Header)
    // Usamos 'clientes' (o 'gestion' si no existe el link directo) para iluminar el sidebar
    await initSystem('clientes');

    const form = document.getElementById("form-nuevo-cliente");
    const tipoSelect = document.getElementById("tipo");
    const rutInput = document.getElementById("rut");
    const labelRut = document.getElementById("label-rut");
    const rutStatusIcon = document.getElementById("rut-status-icon");
    const rutError = document.getElementById("rut-error");
    const cancelarBtn = document.getElementById("cancelar");

    // Navegación Cancelar
    if(cancelarBtn) {
        cancelarBtn.addEventListener("click", () => {
            window.history.back(); // O redirigir a lista de clientes
        });
    }

    // --- MANEJO DE TIPO DE CLIENTE ---
    tipoSelect.addEventListener("change", () => {
        const tipo = tipoSelect.value;
        rutInput.value = "";
        resetRutValidation();

        if (tipo === "Extranjero") {
            labelRut.innerHTML = "Pasaporte / DNI <span class='text-amber-500'>*</span>";
            rutInput.placeholder = "Número de documento";
        } else {
            labelRut.innerHTML = "RUT <span class='text-amber-500'>*</span>";
            rutInput.placeholder = "Ej: 12.345.678-9";
        }
    });

    // --- VALIDACIÓN DE RUT EN TIEMPO REAL ---
    rutInput.addEventListener("input", (e) => {
        // Solo aplicar formato/validación estricta si NO es extranjero
        if (tipoSelect.value === "Extranjero") return;

        let valor = e.target.value.replace(/[^0-9kK]/g, ""); // Limpiar caracteres
        if (valor.length > 1) {
            // Formato simple 12345678-9
            const cuerpo = valor.slice(0, -1);
            const dv = valor.slice(-1);
            e.target.value = cuerpo + "-" + dv;
        }
        
        // Validar lógica
        if (validarRut(e.target.value)) {
            showRutStatus('valid');
        } else {
            if (e.target.value.length > 8) showRutStatus('invalid');
            else resetRutValidation();
        }
    });

    function showRutStatus(status) {
        rutStatusIcon.classList.remove("hidden");
        rutInput.classList.remove("border-slate-600", "border-red-500", "border-green-500", "focus:ring-amber-500");
        
        if (status === 'valid') {
            rutInput.classList.add("border-green-500", "focus:ring-green-500");
            rutStatusIcon.innerHTML = `<svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`;
            rutError.classList.add("hidden");
        } else {
            rutInput.classList.add("border-red-500", "focus:ring-red-500");
            rutStatusIcon.innerHTML = `<svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>`;
            rutError.classList.remove("hidden");
        }
    }

    function resetRutValidation() {
        rutStatusIcon.classList.add("hidden");
        rutError.classList.add("hidden");
        rutInput.classList.remove("border-red-500", "border-green-500", "focus:ring-red-500", "focus:ring-green-500");
        rutInput.classList.add("border-slate-600", "focus:ring-amber-500");
    }

    function validarRut(rutCompleto) {
        if (!rutCompleto || typeof rutCompleto !== 'string') return false;
        if (!/^[0-9]+-[0-9kK]{1}$/.test(rutCompleto)) return false;
        
        const tmp = rutCompleto.split('-');
        let digv = tmp[1]; 
        const rut = tmp[0];
        
        if (digv == 'K') digv = 'k';
        
        return (dv(rut) == digv);
    }

    function dv(T) {
        let M = 0, S = 1;
        for (; T; T = Math.floor(T / 10))
            S = (S + T % 10 * (9 - M++ % 6)) % 11;
        return S ? S - 1 : 'k';
    }

    // --- ENVÍO DE FORMULARIO ---
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        // Validaciones previas
        const rutVal = rutInput.value.trim();
        const tipoVal = tipoSelect.value;
        const nombreVal = document.getElementById("razon_social").value.trim();

        if (tipoVal !== "Extranjero" && !validarRut(rutVal)) {
            mostrarModal({ tipo: 'error', titulo: "Error de Validación", mensaje: "El RUT ingresado no es válido." });
            return;
        }
        if (!nombreVal) {
            mostrarModal({ tipo: 'error', titulo: "Datos Faltantes", mensaje: "Debe ingresar el nombre o razón social." });
            return;
        }

        const data = {
            tipo: tipoVal,
            razon_social: nombreVal,
            rut: rutVal, // Enviaremos el valor del input sea RUT o DNI
            dni: (tipoVal === "Extranjero") ? rutVal : "", // Compatibilidad con backend si espera dni separado
            correo: document.getElementById("correo").value.trim(),
            fono: document.getElementById("fono").value.trim(),
            direccion: document.getElementById("direccion").value.trim(),
            estado_documentacion: document.getElementById("estado_docs").value,
            activo: document.getElementById("activo").checked ? 1 : 0
        };

        try {
            const res = await fetch("https://tesoreria.cambiosorion.cl/api/nuevo-cl.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            const result = await res.json();

            if (result.success) {
                mostrarModal({ 
                    tipo: 'exito', 
                    titulo: "Cliente Creado", 
                    mensaje: `El cliente <b>${result.id || ''}</b> ha sido registrado exitosamente.`,
                    onConfirmar: () => {
                        window.location.reload(); // O redirigir
                    }
                });
            } else {
                mostrarModal({ tipo: 'error', titulo: "Error", mensaje: result.error || "No se pudo guardar el cliente." });
            }

        } catch (err) {
            console.error(err);
            mostrarModal({ tipo: 'error', titulo: "Error de Conexión", mensaje: "Hubo un problema al conectar con el servidor." });
        }
    });

    // --- SISTEMA MODALES UNIFICADO (SVG) ---
    function mostrarModal({ tipo = 'info', titulo, mensaje, textoConfirmar = "Aceptar", textoCancelar = null, onConfirmar, onCancelar }) {
        const modal = document.getElementById("modal-generico");
        const iconoDiv = document.getElementById("modal-generico-icono");
        const btnConfirmar = document.getElementById("modal-generico-confirmar");
        const btnCancelar = document.getElementById("modal-generico-cancelar");

        const iconos = {
            'exito': `<div class="p-3 rounded-full bg-green-900/30 border border-green-500/30"><svg class="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg></div>`,
            'error': `<div class="p-3 rounded-full bg-red-900/30 border border-red-500/30"><svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></div>`,
            'info': ''
        };

        if(iconoDiv) iconoDiv.innerHTML = iconos[tipo] || '';

        document.getElementById("modal-generico-titulo").textContent = titulo;
        // Permitir HTML en mensaje (para negritas)
        document.getElementById("modal-generico-mensaje").innerHTML = mensaje;
        
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