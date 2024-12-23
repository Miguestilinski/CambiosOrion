document.addEventListener("DOMContentLoaded", function() {
    const clienteTab = document.getElementById('clienteTab');
    const administrativoTab = document.getElementById('administrativoTab');
    const clienteForm = document.getElementById('cliente-form');
    const administrativoForm = document.getElementById('administrativo-form');
    
    // Establecer "Cliente" como la pestaña predeterminada
    clienteTab.classList.add('active');
    clienteForm.classList.add('active');
    
    // Cambiar entre Cliente y Administrativo
    clienteTab.addEventListener('click', function() {
        cambiarVista('cliente');
    });

    administrativoTab.addEventListener('click', function() {
        cambiarVista('administrativo');
    });

    function cambiarVista(tipo) {
        if (tipo === 'cliente') {
            clienteTab.classList.add('active');
            administrativoTab.classList.remove('active');
            clienteForm.classList.add('active');
            administrativoForm.classList.remove('active');
            document.getElementById('rut').setAttribute('required', 'required');
            document.getElementById('correo').removeAttribute('required');
            document.getElementById('tipoUsuario').value = 'cliente';
        } else {
            administrativoTab.classList.add('active');
            clienteTab.classList.remove('active');
            administrativoForm.classList.add('active');
            clienteForm.classList.remove('active');
            document.getElementById('correo').setAttribute('required', 'required');
            document.getElementById('rut').removeAttribute('required');
            document.getElementById('tipoUsuario').value = 'administrativo';
        }
    }

    const loginForm = document.getElementById("loginForm");
    loginForm.addEventListener("submit", async function(event) {
        event.preventDefault();

        const tipoUsuario = document.querySelector('.tab-button.active').dataset.tipoUsuario;
        const rut = document.getElementById("rut").value.trim();
        let correo = document.getElementById("correo").value.trim().toLowerCase();
        const password = document.getElementById("password").value.trim();

        // Convertir el correo a minúsculas automáticamente
        correo = correo.toLowerCase();

        // Validación de RUT si es un cliente
        if (tipoUsuario === 'cliente' && !validarRUT(rut)) {
            alert("El RUT no es válido.");
            return;
        } else if (tipoUsuario === 'administrativo' && correo === "") {
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
            const response = await fetch('https://cambiosorion.cl/data/iniciar_sesion.php', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) throw new Error("Error en la conexión con el servidor");

            const result = await response.json();
            
            if (result.success) {
                localStorage.setItem('sessionActive', 'true');
                if (tipoUsuario === 'cliente') {
                    window.location.href = "index";
                } else if (tipoUsuario === 'administrativo') {
                    window.location.href = "edit";
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
    } else if (field === 'correo') {
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
