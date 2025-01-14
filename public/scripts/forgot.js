document.addEventListener("DOMContentLoaded", function () {
    // Variables
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    const forgotPasswordFormElement = document.getElementById('forgotPasswordFormElement');
    const forgotEmailInput = document.getElementById('forgotEmail');
    const forgotPasswordError = document.getElementById('forgotPasswordError');
    const submitButton = forgotPasswordFormElement.querySelector('button[type="submit"]');

    // Enviar el formulario de recuperación de contraseña
    forgotPasswordFormElement.addEventListener('submit', async function (event) {
        event.preventDefault();

        const email = forgotEmailInput.value.trim();

        // Validación del correo electrónico
        if (!email || !validateEmail(email)) {
            forgotPasswordError.classList.remove('hidden');
            return;
        }

        // Deshabilitar el botón de envío mientras se procesa la solicitud
        submitButton.disabled = true;

        try {
            // Realizar la solicitud para restablecer la contraseña
            const response = await fetch('https://cambiosorion.cl/data/forgot.php', {
                method: 'POST',
                body: JSON.stringify({ correo: email }),
                headers: { 'Content-Type': 'application/json' }
            });

            // Verificamos si la respuesta es exitosa
            if (!response.ok) {
                throw new Error('Error en la respuesta del servidor');
            }

            // Obtenemos el tipo de contenido
            const contentType = response.headers.get("Content-Type");

            let result;
            let responseText = await response.text(); // Leemos la respuesta como texto primero

            console.log("Respuesta cruda del servidor:", responseText); // Imprimimos la respuesta cruda

            // Verificamos si la respuesta es JSON
            if (contentType && contentType.includes("application/json")) {
                try {
                    result = JSON.parse(responseText); // Intentamos parsear la respuesta como JSON
                } catch (error) {
                    throw new Error("La respuesta no es un JSON válido");
                }
            } else {
                // Si la respuesta no es JSON, lanzamos un error
                throw new Error("La respuesta del servidor no es JSON");
            }

            // Verificar si la respuesta fue exitosa
            if (result.success) {
                alert('Te hemos enviado un correo para restablecer tu contraseña.');
                forgotPasswordForm.classList.add('hidden'); // Ocultar el formulario
            } else {
                alert(result.message); // Mensaje de error del servidor
            }
        } catch (error) {
            console.error("Error al procesar la solicitud:", error);
            alert("Hubo un problema al procesar tu solicitud.");
        } finally {
            // Habilitar el botón nuevamente después de la solicitud
            submitButton.disabled = false;
        }
    });

    // Función para validar el correo electrónico
    function validateEmail(email) {
        const re = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
        return re.test(email);
    }
});
