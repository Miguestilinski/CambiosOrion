import { initSystem } from './index.js';

document.addEventListener("DOMContentLoaded", async () => {
    // 1. Init Sistema (Sidebar: 'egresos' o 'caja' según prefieras iluminar)
    const sessionData = await initSystem('egresos'); 
    
    // Si no hay sesión válida, initSystem usualmente redirige, pero por seguridad:
    if (!sessionData || !sessionData.isAuthenticated) {
        // window.location.href = ... (ya manejado en index.js)
        return;
    }

    const usuarioSesionId = sessionData.equipo_id || sessionData.id;

    // Referencias
    const form = document.getElementById("form-nuevo-utilidad");
    const cajaSelect = document.getElementById("caja");
    const conceptoInput = document.getElementById("concepto");
    const divisaSelect = document.getElementById("divisa");
    const montoInput = document.getElementById("monto-egreso");
    const obsInput = document.getElementById("observaciones");
    const cancelarBtn = document.getElementById("cancelar");

    // Navegación
    if (cancelarBtn) {
        cancelarBtn.addEventListener("click", () => window.history.back());
    }

    // 2. Cargar Cajas y Divisas
    async function cargarDatosIniciales() {
        try {
            // Cargar Cajas
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
                
                // Pre-seleccionar caja del usuario si existe
                if(sessionData.caja_id && sessionData.caja_id != 0) {
                    cajaSelect.value = sessionData.caja_id;
                }
            }

            // Cargar Divisas
            const resDiv = await fetch("https://cambiosorion.cl/data/nuevo-egr-util.php?buscar_divisas=1");
            const divisas = await resDiv.json();
            
            divisaSelect.innerHTML = '<option value="">Seleccione Divisa</option>';
            if(Array.isArray(divisas)) {
                divisas.forEach(d => {
                    const opt = document.createElement("option");
                    opt.value = d.id;
                    opt.textContent = `${d.nombre} (${d.codigo})`;
                    divisaSelect.appendChild(opt);
                });
            }

        } catch (error) {
            console.error("Error cargando datos:", error);
            mostrarModal({ tipo: 'error', titulo: "Error de Carga", mensaje: "No se pudieron cargar cajas o divisas." });
        }
    }

    cargarDatosIniciales();

    // 3. Submit Formulario
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        // Validaciones
        if (!cajaSelect.value) return mostrarModal({ tipo: 'advertencia', titulo: "Datos Incompletos", mensaje: "Seleccione una caja de origen." });
        if (!conceptoInput.value.trim()) return mostrarModal({ tipo: 'advertencia', titulo: "Datos Incompletos", mensaje: "Indique el concepto del retiro." });
        if (!divisaSelect.value) return mostrarModal({ tipo: 'advertencia', titulo: "Datos Incompletos", mensaje: "Seleccione la divisa." });
        
        const monto = parseFloat(montoInput.value);
        if (isNaN(monto) || monto <= 0) return mostrarModal({ tipo: 'advertencia', titulo: "Monto Inválido", mensaje: "Ingrese un monto mayor a 0." });

        const payload = {
            caja_id: cajaSelect.value,
            item_utilidad: conceptoInput.value.trim(),
            divisa_id: divisaSelect.value,
            monto: monto,
            observaciones: obsInput.value.trim(),
            usuario_id: usuarioSesionId,
            tipo_egreso: "Utilidad" // Fijo para este formulario
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
                    titulo: "Retiro Exitoso", 
                    mensaje: "El egreso por utilidad se ha registrado correctamente.",
                    onConfirmar: () => {
                        window.location.reload(); 
                    }
                });
            } else {
                mostrarModal({ tipo: 'error', titulo: "Error", mensaje: data.error || "No se pudo registrar el egreso." });
            }

        } catch (error) {
            console.error(error);
            mostrarModal({ tipo: 'error', titulo: "Error de Conexión", mensaje: "Fallo al comunicar con el servidor." });
        }
    });

    // --- MODAL GENERI CO (Reutilizable) ---
    function mostrarModal({ tipo = 'info', titulo, mensaje, onConfirmar }) {
        const modal = document.getElementById("modal-generico");
        const iconoDiv = document.getElementById("modal-generico-icono");
        const btnConfirmar = document.getElementById("modal-generico-confirmar");
        const btnCancelar = document.getElementById("modal-generico-cancelar");

        const iconos = {
            'exito': `<div class="p-3 rounded-full bg-green-900/30 border border-green-500/30"><svg class="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg></div>`,
            'error': `<div class="p-3 rounded-full bg-red-900/30 border border-red-500/30"><svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></div>`,
            'advertencia': `<div class="p-3 rounded-full bg-amber-900/30 border border-amber-500/30"><svg class="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg></div>`
        };

        iconoDiv.innerHTML = iconos[tipo] || iconos['info'];
        document.getElementById("modal-generico-titulo").textContent = titulo;
        document.getElementById("modal-generico-mensaje").textContent = mensaje;
        
        btnCancelar.classList.add("hidden"); // Ocultamos cancelar por defecto en alertas simples
        
        modal.classList.remove("hidden");

        const newConfirm = btnConfirmar.cloneNode(true);
        btnConfirmar.parentNode.replaceChild(newConfirm, btnConfirmar);

        newConfirm.onclick = () => { 
            modal.classList.add("hidden"); 
            if (onConfirmar) onConfirmar(); 
        };
    }
});