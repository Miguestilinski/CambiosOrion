import { initAdminHeader } from './header.js';

document.addEventListener("DOMContentLoaded", async () => {

    // --- 1. CONFIGURACIÓN UI: MODAL (Reemplazo de alerts) ---
    const modalNotif = document.getElementById('modal-notification');
    const modalIcon = document.getElementById('modal-icon-container');
    const modalTitle = document.getElementById('modal-title');
    const modalMsg = document.getElementById('modal-message');
    const modalBtn = document.getElementById('modal-btn');

    function showAlert(title, message, isError = false, redirectCallback = null) {
        // Si no existe el modal en el HTML (puede pasar si no se actualizó el HTML), usamos alert fallback
        if (!modalNotif) {
            alert(message);
            if (redirectCallback) redirectCallback();
            return;
        }

        const iconSuccess = `<svg class="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`;
        const iconError = `<svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>`;

        if(modalIcon) {
            modalIcon.innerHTML = isError ? iconError : iconSuccess;
            modalIcon.className = isError 
                ? "w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"
                : "w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4";
        }

        if(modalTitle) modalTitle.textContent = title;
        if(modalMsg) modalMsg.textContent = message;
        
        if(modalBtn) {
            modalBtn.className = isError 
                ? "w-full px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold transition shadow-lg shadow-red-500/30"
                : "w-full px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold transition shadow-lg shadow-indigo-500/30";

            modalBtn.onclick = () => {
                modalNotif.classList.add('hidden');
                if (redirectCallback) redirectCallback();
            };
        }

        modalNotif.classList.remove('hidden');
    }

    // --- 2. INICIALIZACIÓN GLOBAL ---
    // Mantenemos 'remuneraciones' activo en el sidebar
    const sessionData = await initAdminHeader('remuneraciones');

    if (!sessionData.isAuthenticated) return;

    // --- 3. SEGURIDAD ---
    const role = (sessionData.rol || '').toLowerCase().trim();
    const allowedRoles = ['socio', 'admin', 'gerente', 'rrhh'];
    
    if (!allowedRoles.includes(role)) {
        showAlert("Acceso Denegado", "No tienes permisos para crear remuneraciones.", true, () => {
            window.location.href = 'remuneraciones';
        });
        return;
    }

    // --- 4. REFERENCIAS DOM LOCALES ---
    const select = document.getElementById("integrante");
    const montoInput = document.getElementById("monto");
    const form = document.getElementById("form-nueva-remuneracion");
    const btnCancel = document.getElementById("cancelar-remuneracion");

    // --- 5. LÓGICA DE NEGOCIO ---

    function generarPeriodos() {
        const selectPeriodo = document.getElementById("periodo");
        if(!selectPeriodo) return;

        const hoy = new Date();
        const meses = [
            "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
            "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
        ];

        for (let i = -2; i <= 1; i++) {
            const fecha = new Date(hoy.getFullYear(), hoy.getMonth() + i, 1);
            const mesNum = String(fecha.getMonth() + 1).padStart(2, "0");
            const mesNombre = meses[fecha.getMonth()];
            const anio = fecha.getFullYear();
            const value = `${mesNum}-${anio}`;
            const display = `${mesNombre} ${anio}`;

            const option = document.createElement("option");
            option.value = value;
            option.textContent = display;
            // Seleccionar el mes actual por defecto
            if(i === 0) option.selected = true;
            selectPeriodo.appendChild(option);
        }
    }

    function formatearMonto(valor) {
        if (valor === undefined || valor === null) return "";
        const numero = parseInt(valor.toString().replace(/\D/g, ""), 10);
        if (isNaN(numero)) return "";
        return "$" + numero.toLocaleString("es-CL");
    }

    function limpiarMonto(formateado) {
        return formateado.replace(/\D/g, "");
    }

    // Inicializar selectores
    generarPeriodos();

    // Eventos de input para formato moneda
    if(montoInput) {
        montoInput.addEventListener("input", () => {
            const limpio = limpiarMonto(montoInput.value);
            montoInput.value = formatearMonto(limpio);
        });
    }

    // Cargar Integrantes
    let integrantes = [];
    try {
        // CORRECCIÓN: Agregar credentials: 'include' para pasar la sesión al PHP
        const res = await fetch("https://cambiosorion.cl/data/nueva-rem.php", {
            credentials: 'include'
        });
        const data = await res.json();

        if (data.success && Array.isArray(data.integrantes)) {
            integrantes = data.integrantes;
            
            if(select) {
                integrantes.forEach((int) => {
                    const option = document.createElement("option");
                    option.value = int.id;
                    option.textContent = int.nombre;
                    select.appendChild(option);
                });

                // Auto-llenar sueldo base al cambiar selección
                select.addEventListener("change", () => {
                    const selectedId = select.value;
                    // Aseguramos comparar tipos iguales (int vs string)
                    const integrante = integrantes.find((i) => i.id == selectedId);
                    if (integrante && montoInput) {
                        montoInput.value = formatearMonto(integrante.sueldo_liquido);
                    }
                });
            }
        } else {
            showAlert("Error", data.message || "No se pudieron cargar los integrantes.", true);
        }
    } catch (error) {
        console.error("Error al cargar integrantes:", error);
        showAlert("Error de Conexión", "No se pudo conectar con el servidor.", true);
    }

    // Enviar Formulario
    if(form) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();

            const periodo = document.getElementById("periodo").value.trim();
            const integranteId = document.getElementById("integrante").value;
            const monto = limpiarMonto(document.getElementById("monto").value.trim());
            const estado = document.getElementById("estado").value;

            if (!periodo || !integranteId || !monto || !estado) {
                showAlert("Campos Incompletos", "Por favor completa todos los campos.", true);
                return;
            }

            const body = { 
                periodo, 
                integranteId, 
                monto, 
                estado,
                // Enviamos el ID del usuario actual por seguridad/log si el backend lo requiere
                current_user_id: sessionData.equipo_id 
            };
            
            // UI Feedback
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn ? submitBtn.textContent : 'Guardar';
            if(submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = "Guardando...";
            }

            try {
                const res = await fetch("https://cambiosorion.cl/data/nueva-rem.php", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                    credentials: 'include' // IMPORTANTE
                });

                const text = await res.text();
                let data;
                try {
                    data = JSON.parse(text);
                } catch(err) {
                    console.error("Respuesta no JSON:", text);
                    throw new Error("Respuesta inválida del servidor");
                }

                if (data.success) {
                    showAlert("¡Éxito!", "Remuneración guardada correctamente.", false, () => {
                        window.location.href = "remuneraciones";
                    });
                } else {
                    showAlert("Error", data.error || data.message || "Error al guardar.", true);
                }
            } catch (err) {
                console.error("Error al conectar:", err);
                showAlert("Error de Conexión", "Ocurrió un problema al guardar.", true);
            } finally {
                if(submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                }
            }
        });
    }

    // Botón Cancelar
    if(btnCancel) {
        btnCancel.addEventListener("click", () => {
            window.location.href = 'remuneraciones';
        });
    }
});