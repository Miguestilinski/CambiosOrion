document.addEventListener("DOMContentLoaded", function() {
    const loginForm = document.getElementById("loginForm");
    loginForm.addEventListener("submit", async function(event) {
        event.preventDefault();

        let correo = document.getElementById("correo").value.trim().toLowerCase();
        const password = document.getElementById("password").value.trim();

        console.log("Formulario enviado", correo, password);

        // Convertir el correo a minúsculas automáticamente
        correo = correo.toLowerCase();

        if (correo === "") {
            alert("Por favor, ingresa un correo válido.");
            return;
        }
    
        if (password === "") {
            alert("Por favor, ingresa tu contraseña.");
            return;
        }

        const formData = new FormData(loginForm);
        formData.set("correo", correo);

        try {
            const response = await fetch('https://cambiosorion.cl/data/login_admin.php', {
                method: 'POST',
                body: formData,
                credentials: "include"
            });

            if (!response.ok) {
                console.log("Error en la respuesta del servidor:", response.status);
                throw new Error("Error en la conexión con el servidor");
            }

            const result = await response.json();
            console.log("Respuesta del servidor:", result);
            
            if (result.success) {
                localStorage.setItem('sessionActive', 'true');
                window.location.href = "https://admin.cambiosorion.cl/";
            } else {
                alert(result.message);
            }
        } catch (error) {
            console.error("Error en la solicitud AJAX:", error);
            alert("Hubo un problema al conectar con el servidor.");
        }
    });
});

// Función para restablecer los estilos de error
function resetErrorStyles() {
    // Elimina las clases de error
    const passwordError = document.getElementById('password-error');
    if (passwordError) passwordError.classList.add('hidden');

    const correoInput = document.getElementById('correo');
    const passwordInput = document.getElementById('password');
    if (correoInput) correoInput.classList.remove('bg-red-50', 'border-red-500', 'text-red-900');
    if (passwordInput) passwordInput.classList.remove('bg-red-50', 'border-red-500', 'text-red-900');
}

// Función para aplicar estilos de error
function setErrorStyles(field) {
    if (field === 'correo') {
        const correoInput = document.getElementById('correo');
        const correoError = document.getElementById('correo-error');
        if (correoInput) correoInput.classList.add('bg-red-50', 'border-red-500', 'text-red-900');
        if (correoError) correoError.classList.remove('hidden');
    } else if (field === 'password') {
        const passwordInput = document.getElementById('password');
        const passwordError = document.getElementById('password-error');
        if (passwordInput) passwordInput.classList.add('bg-red-50', 'border-red-500', 'text-red-900');
        if (passwordError) passwordError.classList.remove('hidden');
    }
}
