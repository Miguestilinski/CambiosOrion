document.addEventListener("DOMContentLoaded", function() {
    const administrativoTab = document.getElementById('administrativoTab');
    const administrativoForm = document.getElementById('administrativo-form');
    
    // Establecer "Cliente" como la pestaña predeterminada
    administrativoTab.classList.add('active');
    administrativoForm.classList.add('active');
    
    const loginForm = document.getElementById("loginForm");
    loginForm.addEventListener("submit", async function(event) {
        event.preventDefault();

        const tipoUsuario = document.querySelector('.tab-button.active').dataset.tipoUsuario;
        let rut = rutInput.value.trim().replace(/[^\dKk]/g, '').toUpperCase(); // Limpieza final del RUT
        let correo = document.getElementById("correo").value.trim().toLowerCase();
        const password = document.getElementById("password").value.trim();

        // Convertir el correo a minúsculas automáticamente
        correo = correo.toLowerCase();

        if (tipoUsuario === 'administrativo' && correo === "") {
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
            const response = await fetch('https://cambiosorion.cl/data/login.php', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) throw new Error("Error en la conexión con el servidor");

            const result = await response.json();
            
            if (result.success) {
                localStorage.setItem('sessionActive', 'true');
                if (tipoUsuario === 'administrativo') {
                    window.location.href = "index";
                } else if (tipoUsuario === 'cliente') {
                    window.location.href = "https://cambiosorion.cl/sin-acceso";
                }
            } else {
                alert(result.message);
            }
        } catch (error) {
            console.error("Error en la solicitud AJAX:", error);
            alert("Hubo un problema al conectar con el servidor.");
        }
    });

    // Funciones de validación
    function validarRUT(rut) {
        rut = rut.replace(/[^\dKk]/g, '').toUpperCase();
    
        if (rut.length < 2) return false;
    
        const cuerpo = rut.slice(0, -1);
        const dv = rut.slice(-1);
    
        if (!/^\d+$/.test(cuerpo)) return false;
    
        let suma = 0;
        let multiplo = 2;
    
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
