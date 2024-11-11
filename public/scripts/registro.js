document.addEventListener("DOMContentLoaded", function () {
    // Inicializar el formulario de registro
    const registerForm = document.getElementById("register-form");

    registerForm.addEventListener("submit", function (event) {
        event.preventDefault();
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;
        const confirmPassword = document.getElementById("confirm-password").value;

        // Llamada a la función de registro
        registerUser(email, password, confirmPassword);
    });
});

// Función para registrar un nuevo usuario
function registerUser(email, password, confirmPassword) {
    if (!email || !password || !confirmPassword) {
        alert("Por favor completa todos los campos.");
        return;
    }

    if (password !== confirmPassword) {
        alert("Las contraseñas no coinciden.");
        return;
    }

    // Simulando una llamada a la API (puedes cambiar esto a una llamada real)
    const newUser = {
        email: email,
        password: password,
    };

    // Aquí iría una llamada real a la API para registrar el usuario
    alert("Registro exitoso.");
    // Redirigir a la página de inicio de sesión después de registrarse
    window.location.href = "iniciar_sesion.html";
}
