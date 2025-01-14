document.addEventListener("DOMContentLoaded", function () {
    // Variables
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    const forgotPasswordFormElement = document.getElementById('forgotPasswordFormElement');
    const forgotEmailInput = document.getElementById('forgotEmail');
    const forgotPasswordError = document.getElementById('forgotPasswordError');

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

            // Verificar si la respuesta es exitosa
            if (!response.ok) {
                throw new Error('Error en la respuesta del servidor');
            }

            const result = await response.json();
            if (result.success) {
                alert('Te hemos enviado un correo para restablecer tu contraseña.');
                forgotPasswordForm.classList.add('hidden'); // Ocultar el formulario
            } else {
                alert(result.message);
            }
        } catch (error) {
            console.error("Error al procesar la solicitud:", error);
            alert("Hubo un problema al procesar tu solicitud.");
        }
    });

    // Función para validar el correo electrónico
    function validateEmail(email) {
        const re = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
        return re.test(email);
    }
});
