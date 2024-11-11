document.addEventListener("DOMContentLoaded", function () {
    const loginForm = document.getElementById("loginForm");

    loginForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const rut = document.getElementById("rut").value;
        const contrasena = document.getElementById("contrasena").value;
        const errorMessage = document.getElementById("error-message");

        try {
            const response = await fetch('/data/iniciar_sesion.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: `rut=${encodeURIComponent(rut)}&contrasena=${encodeURIComponent(contrasena)}`
            });

            const result = await response.json();

            if (result.success) {
                window.location.href = 'index.html';
            } else {
                errorMessage.textContent = result.message;
                errorMessage.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Error al iniciar sesión:', error);
        }
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
