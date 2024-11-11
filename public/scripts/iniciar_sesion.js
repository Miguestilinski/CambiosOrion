document.addEventListener("DOMContentLoaded", function () {
    const loginForm = document.getElementById("loginForm");

    loginForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const rut = document.getElementById("rut").value;
        const contrasena = document.getElementById("contrasena").value;

        try {
            const response = await fetch('/data/iniciar_sesion.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: `rut=${encodeURIComponent(rut)}&contrasena=${encodeURIComponent(contrasena)}`
            });

            const result = await response.json();

            resetErrorStyles();

            if (result.success) {
                window.location.href = 'index.html';
            } else {
                document.getElementById('error-message').classList.remove('hidden');
                setErrorStyles(result.field);
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

function resetErrorStyles() {
    document.getElementById('rut').classList.remove('bg-red-50', 'border-red-500', 'text-red-900');
    document.getElementById('contrasena').classList.remove('bg-red-50', 'border-red-500', 'text-red-900');
    document.getElementById('rut-error').classList.add('hidden');
    document.getElementById('contrasena-error').classList.add('hidden');
}

function setErrorStyles(field) {
    if (field === 'rut') {
        document.getElementById('rut').classList.add('bg-red-50', 'border-red-500', 'text-red-900');
        document.getElementById('rut-error').classList.remove('hidden');
    } else if (field === 'contrasena') {
        document.getElementById('contrasena').classList.add('bg-red-50', 'border-red-500', 'text-red-900');
        document.getElementById('contrasena-error').classList.remove('hidden');
    }
}