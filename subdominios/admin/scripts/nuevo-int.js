import { initAdminHeader } from './header.js';

document.addEventListener('DOMContentLoaded', async () => {

    // --- 1. CONFIGURACIÓN UI: MODAL (Copiado para reemplazar alerts) ---
    const modalNotif = document.getElementById('modal-notification');
    const modalIcon = document.getElementById('modal-icon-container');
    const modalTitle = document.getElementById('modal-title');
    const modalMsg = document.getElementById('modal-message');
    const modalBtn = document.getElementById('modal-btn');

    function showAlert(title, message, isError = false, redirectUrl = null) {
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
                if(modalNotif) modalNotif.classList.add('hidden');
                if (redirectUrl) window.location.href = redirectUrl;
            };
        }

        if(modalNotif) modalNotif.classList.remove('hidden');
    }

    // --- 2. INICIALIZACIÓN GLOBAL ---
    // Marcamos 'equipo' como activo en el sidebar porque esta página es subsección de Equipo
    const sessionData = await initAdminHeader('equipo');

    if (!sessionData.isAuthenticated) return;

    // --- 3. SEGURIDAD ---
    const role = (sessionData.rol || '').toLowerCase().trim();
    const allowedRoles = ['socio', 'admin', 'gerente', 'rrhh'];
    
    if (!allowedRoles.includes(role)) {
        showAlert("Acceso Denegado", "No tienes permisos para agregar integrantes.", true, 'equipo');
        return;
    }

    // --- 4. LÓGICA DEL FORMULARIO ---
    const form = document.getElementById("form-nuevo-int");
    
    if (form) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();

            // Referencias a inputs
            const nombre = document.getElementById("nombre").value.trim();
            const rut = document.getElementById("rut").value.trim();
            const estadoCivil = document.getElementById("estadoCivil").value.trim();
            const fechaNacimiento = document.getElementById("fechaNacimiento").value;
            const direccion = document.getElementById("direccion").value.trim();
            const telefono = document.getElementById("telefono").value.trim();
            const email = document.getElementById("email").value.trim();

            const fechaIngreso = document.getElementById("fechaIngreso").value;
            const rolInput = document.getElementById("rol").value;
            const tipoContrato = document.getElementById("tipoContrato").value.trim();
            const sueldoLiquido = document.getElementById("sueldoLiquido").value.trim();

            const banco = document.getElementById("banco").value.trim();
            const tipoCuenta = document.getElementById("tipoCuenta").value.trim();
            const numeroCuenta = document.getElementById("numeroCuenta").value.trim();

            // Validación básica
            if (!nombre || !rut || !estadoCivil || !fechaNacimiento || !direccion || !fechaIngreso || !rolInput || !tipoContrato || !sueldoLiquido || !banco || !tipoCuenta || !numeroCuenta || !email) {
                showAlert("Campos Incompletos", "Por favor completa todos los campos obligatorios.", true);
                return;
            }

            const body = {
                nombre, rut, estadoCivil, fechaNacimiento, direccion, telefono, email,
                fechaIngreso, rol: rolInput, tipoContrato, sueldoLiquido,
                banco, tipoCuenta, numeroCuenta
            };

            // Botón Loading (Opcional visual)
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn ? submitBtn.textContent : 'Guardar';
            if(submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = "Guardando...";
            }

            try {
                const res = await fetch("https://cambiosorion.cl/data/nuevo-int.php", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body)
                });

                const textResponse = await res.text();
                let data;
                try {
                    data = JSON.parse(textResponse);
                } catch (err) {
                    console.error("Respuesta no JSON:", textResponse);
                    throw new Error("Respuesta inválida del servidor");
                }

                if (data.success) {
                    // Éxito: Redirigimos a la lista de equipo al cerrar el modal
                    showAlert("¡Integrante Agregado!", "El nuevo integrante ha sido registrado correctamente.", false, 'equipo');
                } else {
                    showAlert("Error", data.error || "No se pudo agregar al integrante.", true);
                }

            } catch (error) {
                console.error(error);
                showAlert("Error de Conexión", "Ocurrió un problema al conectar con el servidor.", true);
            } finally {
                if(submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                }
            }
        });
    }
});