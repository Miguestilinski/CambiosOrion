// Funcionalidad del formulario de registro
document.addEventListener("DOMContentLoaded", function () {
    const registerForm = document.getElementById("register-form");

    registerForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        // Obtener valores de los campos
        const rut = document.getElementById("rut").value;
        const tipoUsuario = document.getElementById("tipo_usuario").value;
        const nombreUsuario = document.getElementById("nombre_usuario").value;
        const correo = document.getElementById("correo").value;
        const contrasena = document.getElementById("contrasena").value;
        const confirmContrasena = document.getElementById("confirm_contrasena").value;

        // Validaciones de los campos
        if (!rut || !nombreUsuario || !correo || !contrasena || !confirmContrasena) {
            alert("Por favor completa todos los campos.");
            return;
        }

        if (contrasena !== confirmContrasena) {
            alert("Las contraseñas no coinciden.");
            return;
        }

        if (!validarRUT(rut)) {
            alert("Por favor ingresa un RUT válido.");
            return;
        }

        // Construir datos para enviar al servidor
        const userData = {
            rut,
            tipo_usuario: tipoUsuario,
            nombre_usuario: nombreUsuario,
            correo,
            contrasena,
        };

        try {
            // Enviar datos al servidor
            const response = await fetch('registro.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData),
            });

            const result = await response.text();
            alert(result);

            if (response.ok) {
                // Redirigir al inicio de sesión
                window.location.href = "iniciar_sesion.html";
            }
        } catch (error) {
            console.error("Error al registrar:", error);
            alert("Hubo un problema al procesar el registro.");
        }
    });

    document.getElementById("rut").addEventListener("input", function () {
        let valor = this.value;
        valor = valor.replace(/[^0-9Kk-]/g, ''); // Permitir solo números, 'K' o 'k' y el guion
        this.value = valor;
    });

    document.getElementById("rut").addEventListener("blur", function () {
        this.value = formatearRUT(this.value);
    });
});