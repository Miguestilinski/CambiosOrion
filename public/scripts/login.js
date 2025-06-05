document.addEventListener("DOMContentLoaded", function() {
    const rutInput = document.getElementById("rut");
    const rememberCheckbox = document.getElementById("remember");

    // Pre-cargar RUT si está guardado
    const rutGuardado = localStorage.getItem("rutRecordado");
    if (rutGuardado) {
        rutInput.value = rutGuardado;
        rememberCheckbox.checked = true;
    }

    rutInput.addEventListener("blur", function() {
        let rut = rutInput.value.replace(/[^\dKk]/g, "").toUpperCase();
        if (rut.length < 2) {
            rutInput.value = rut;
            return;
        }
        const cuerpo = rut.slice(0, -1);
        const dv = rut.slice(-1);
        const cuerpoFormateado = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        rutInput.value = `${cuerpoFormateado}-${dv}`;
    });

    const loginForm = document.getElementById("loginForm");
    loginForm.addEventListener("submit", async function(event) {
        event.preventDefault();

        const rut = rutInput.value.trim().replace(/[^\dKk]/g, '').toUpperCase();
        const password = document.getElementById("password").value.trim();

        if (!validarRUT(rut)) {
            mostrarModalError({
                titulo: "❌ Error",
                mensaje: "El RUT no es válido.",
                textoConfirmar: "Entendido"
            });
            return;
        }

        if (password === "") {
            mostrarModalError({
                titulo: "❌ Error",
                mensaje: "Por favor, ingresa tu contraseña.",
                textoConfirmar: "Entendido"
            });
            return;
        }

        // Guardar o eliminar RUT en localStorage
        if (rememberCheckbox.checked) {
            localStorage.setItem("rutRecordado", rutInput.value);
        } else {
            localStorage.removeItem("rutRecordado");
        }

        const formData = new FormData(loginForm);

        try {
            const response = await fetch('https://cambiosorion.cl/data/login_cliente.php', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) throw new Error("Error en la conexión con el servidor");

            const result = await response.json();
            
            if (result.success) {
                localStorage.setItem('sessionActive', 'true');
                window.location.href = "https://clientes.cambiosorion.cl/";
            } else {
                alert(result.message);
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

    // Funciones de validación
    function validarRUT(rut) {
        rut = rut.replace(/[^\dKk]/g, '').toUpperCase();
        if (rut.length < 2) return false;
    
        const cuerpo = rut.slice(0, -1);
        const dv = rut.slice(-1);
        if (!/^\d+$/.test(cuerpo)) return false;
    
        let suma = 0, multiplo = 2;
        for (let i = cuerpo.length - 1; i >= 0; i--) {
            suma += cuerpo.charAt(i) * multiplo;
            multiplo = multiplo === 7 ? 2 : multiplo + 1;
        }
        const dvCalculado = 11 - (suma % 11);
        const dvCorrecto = dvCalculado === 10 ? 'K' : dvCalculado === 11 ? '0' : dvCalculado.toString();
        return dv === dvCorrecto;
    }
});

// Función para restablecer los estilos de error
function resetErrorStyles() {
    // Elimina las clases de error
    const rutError = document.getElementById('rut-error');
    const passwordError = document.getElementById('password-error');
    if (rutError) rutError.classList.add('hidden');
    if (passwordError) passwordError.classList.add('hidden');

    const rutInput = document.getElementById('rut');
    const correoInput = document.getElementById('correo');
    const passwordInput = document.getElementById('password');
    if (rutInput) rutInput.classList.remove('bg-red-50', 'border-red-500', 'text-red-900');
    if (correoInput) correoInput.classList.remove('bg-red-50', 'border-red-500', 'text-red-900');
    if (passwordInput) passwordInput.classList.remove('bg-red-50', 'border-red-500', 'text-red-900');
}

// Función para aplicar estilos de error
function setErrorStyles(field) {
    if (field === 'rut') {
        const rutInput = document.getElementById('rut');
        const rutError = document.getElementById('rut-error');
        if (rutInput) rutInput.classList.add('bg-red-50', 'border-red-500', 'text-red-900');
        if (rutError) rutError.classList.remove('hidden');
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