document.addEventListener("DOMContentLoaded", function () {
    // Variables
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    const forgotPasswordFormElement = document.getElementById('forgotPasswordFormElement');
    const forgotEmailInput = document.getElementById('forgotEmail');
    const forgotPasswordError = document.getElementById('forgotPasswordError');
    const messageDiv = document.getElementById('messageDiv');

    // Enviar el formulario de recuperación de contraseña
    forgotPasswordFormElement.addEventListener('submit', async function (event) {
        event.preventDefault();

        const email = forgotEmailInput.value.trim();

        // Validación del correo electrónico
        if (!email || !validateEmail(email)) {
            forgotPasswordError.classList.remove('hidden');
            return;
        }

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

            // Filtramos solo la parte JSON de la respuesta
            const jsonStart = responseText.indexOf("{");
            const jsonEnd = responseText.lastIndexOf("}");
            const jsonResponse = responseText.slice(jsonStart, jsonEnd + 1);

            // Intentamos parsear la parte JSON
            try {
                result = JSON.parse(jsonResponse);
            } catch (error) {
                throw new Error("La respuesta no es un JSON válido");
            }

            // Verificar si la respuesta fue exitosa
            if (result.success) {
                showMessage('Te hemos enviado un correo para restablecer tu contraseña.', 'success');
            } else {
                showMessage(result.message, 'error'); // Mensaje de error del servidor
            }
        } catch (error) {
            console.error("Error al procesar la solicitud:", error);
            showMessage("Hubo un problema al procesar tu solicitud.", 'error');
        } finally {
            // Habilitar el botón nuevamente después de la solicitud
            forgotPasswordFormElement.querySelector('button[type="submit"]').disabled = false;
        }
    });

    // Función para validar el correo electrónico
    function validateEmail(email) {
        const re = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
        return re.test(email);
    }

    // Función para mostrar el mensaje de éxito o error
    function showMessage(message, type) {
        if (type === 'success') {
            messageDiv.innerHTML = `<p class="mt-2 text-sm text-green-600">${message}</p>`;
        } else if (type === 'error') {
            messageDiv.innerHTML = `<p class="mt-2 text-sm text-red-600">${message}</p>`;
        } else {
            messageDiv.innerHTML = ''; // Limpiar el mensaje
        }
    }
});
