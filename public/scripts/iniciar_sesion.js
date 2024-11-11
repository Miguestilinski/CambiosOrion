document.addEventListener("DOMContentLoaded", function () {
    // Inicializar cualquier cosa si es necesario cuando la página está completamente cargada
    const loginForm = document.getElementById("login-form");

    loginForm.addEventListener("submit", function (event) {
        event.preventDefault();
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        // Llamada a la función de inicio de sesión
        loginUser(email, password);
    });
});

// Función para iniciar sesión
function loginUser(email, password) {
    if (!email || !password) {
        alert("Por favor ingresa todos los campos.");
        return;
    }

    // Simulando una llamada a la API (puedes cambiar esto a una llamada real)
    const userData = {
        email: "usuario@ejemplo.com",
        password: "12345",
    };

    if (email === userData.email && password === userData.password) {
        alert("Inicio de sesión exitoso.");
        // Redirigir al usuario después de un inicio de sesión exitoso
        window.location.href = "dashboard.html";
    } else {
        alert("Credenciales incorrectas. Intenta nuevamente.");
    }
}
