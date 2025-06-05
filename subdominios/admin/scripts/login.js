document.addEventListener("DOMContentLoaded", function() {
    const loginForm = document.getElementById("loginForm");
    const rememberCheckbox = document.getElementById("remember");
    const correoInput = document.getElementById("correo");

    // Leer del localStorage si ya se guardó el correo antes
    const savedEmail = localStorage.getItem("rememberedEmail");
    if (savedEmail) {
        correoInput.value = savedEmail;
        rememberCheckbox.checked = true;
    }

    loginForm.addEventListener("submit", async function(event) {
        event.preventDefault();

        let correo = document.getElementById("correo").value.trim().toLowerCase();
        const password = document.getElementById("password").value.trim();

        // Convertir el correo a minúsculas automáticamente
        correo = correo.toLowerCase();

        if (!correo) {
            console.warn("Correo vacío");
            mostrarModalError({
                titulo: "❌ Error",
                mensaje: "Por favor, ingresa un correo válido.",
                textoConfirmar: "Entendido"
            });
            return;
        }
    
        if (!password) {
            console.warn("Contraseña vacía");
            mostrarModalError({
                titulo: "❌ Error",
                mensaje: "Por favor, ingresa tu contraseña.",
                textoConfirmar: "Entendido"
            });
            return;
        }

        // Guardar o eliminar correo dependiendo del checkbox
        if (rememberCheckbox.checked) {
            localStorage.setItem("rememberedEmail", correo);
        } else {
            localStorage.removeItem("rememberedEmail");
        }

        const formData = new FormData(loginForm);

        try {
            const response = await fetch('https://cambiosorion.cl/data/login_admin.php', {
                method: 'POST',
                body: formData,
                credentials: "include"
            });

            console.log("Respuesta recibida", response);

            if (!response.ok) {
                console.log("Error en la respuesta del servidor:", response.status);
                mostrarModalError({
                    titulo: "❌ Error",
                    mensaje: `Error en la conexión con el servidor: ${esponse.status}`,
                    textoConfirmar: "Entendido"
                });
            }

            const result = await response.json();
            
            if (result.success) {
                console.log("Login exitoso, redirigiendo...");
                localStorage.setItem('sessionActive', 'true');
                window.location.href = "https://admin.cambiosorion.cl/";
            } else {
                console.warn("Error en login:", result.message);
                mostrarModalError({
                    titulo: "❌ Error",
                    mensaje: `Error en login: ${result.message}`,
                    textoConfirmar: "Entendido"
                });
            }
        } catch (error) {
            console.error("Error en la solicitud:", error);
            mostrarModalError({
                titulo: "❌ Error",
                mensaje: "Hubo un problema al conectar con el servidor.",
                textoConfirmar: "Entendido"
            });
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

function mostrarModalError({ titulo, mensaje, textoConfirmar = "Aceptar", textoCancelar = null, onConfirmar, onCancelar }) {
  const modal = document.getElementById("modal-error");
  const tituloElem = document.getElementById("modal-error-titulo");
  const mensajeElem = document.getElementById("modal-error-mensaje");
  const btnConfirmar = document.getElementById("modal-error-confirmar");
  const btnCancelar = document.getElementById("modal-error-cancelar");

  tituloElem.textContent = titulo;
  mensajeElem.textContent = mensaje;
  btnConfirmar.textContent = textoConfirmar;

  if (textoCancelar) {
    btnCancelar.classList.remove("hidden");
    btnCancelar.textContent = textoCancelar;
  } else {
    btnCancelar.classList.add("hidden");
  }

  modal.classList.remove("hidden");

  // Remover handlers anteriores
  btnConfirmar.onclick = () => {
    modal.classList.add("hidden");
    if (onConfirmar) onConfirmar();
  };

  btnCancelar.onclick = () => {
    modal.classList.add("hidden");
    if (onCancelar) onCancelar();
  };
}