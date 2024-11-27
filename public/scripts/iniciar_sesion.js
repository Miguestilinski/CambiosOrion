document.addEventListener("DOMContentLoaded", function() {
    const clienteTab = document.getElementById('clienteTab');
    const administrativoTab = document.getElementById('administrativoTab');
    const clienteForm = document.getElementById('cliente-form');
    const administrativoForm = document.getElementById('administrativo-form');
    
    // Establecer "Cliente" como seleccionado por defecto
    clienteTab.classList.add('active');
    clienteForm.classList.add('active');

    // Cambiar entre "Cliente" y "Administrativo" al hacer clic
    clienteTab.addEventListener('click', function() {
        clienteTab.classList.add('active');
        administrativoTab.classList.remove('active');
        
        clienteForm.classList.add('active');
        administrativoForm.classList.remove('active');
        
        // Eliminar 'required' de campos no relevantes
        document.getElementById('rut').setAttribute('required', 'required');
        document.getElementById('email').removeAttribute('required');
    });

    administrativoTab.addEventListener('click', function() {
        administrativoTab.classList.add('active');
        clienteTab.classList.remove('active');
        
        administrativoForm.classList.add('active');
        clienteForm.classList.remove('active');
        
        // Eliminar 'required' de campos no relevantes
        document.getElementById('email').setAttribute('required', 'required');
        document.getElementById('rut').removeAttribute('required');
    });

    // Manejo de la validación y el envío del formulario
    const loginForm = document.getElementById("loginForm");
    loginForm.addEventListener("submit", function(event) {
        event.preventDefault();

        const tipoUsuario = document.querySelector('.tab-button.active').dataset.tipoUsuario;
        const rut = document.getElementById("rut") ? document.getElementById("rut").value : '';
        const email = document.getElementById("email") ? document.getElementById("email").value : '';
        const password = document.getElementById("password").value;

        // Validación para el formulario de "Cliente"
        if (tipoUsuario === 'cliente') {
            if (!validarRUT(rut)) {
                document.getElementById('rut-error').textContent = "Escriba un RUT válido.";
                document.getElementById('rut-error').classList.remove('hidden');
                return;
            } else {
                document.getElementById('rut-error').classList.add('hidden');
            }
        }

        if (!password) {
            document.getElementById('password-error').textContent = "Escriba una contraseña.";
            document.getElementById('password-error').classList.remove('hidden');
            return;
        } else {
            document.getElementById('password-error').classList.add('hidden');
        }

        // Enviar los datos con fetch
        const formData = new FormData(loginForm);
        fetch('https://cambiosorion.cl/data/iniciar_sesion.php', {
            method: 'POST',
            body: formData,
        })
        .then(response => response.json())
        .then(data => {
            console.log("Respuesta del servidor:", data);
            if (data.success) {
                localStorage.setItem('userAuthenticated', 'true');
                // Verificar el tipo de usuario y redirigir
                if (tipoUsuario === 'cliente') {
                    window.location.href = "index.html";
                } else if (tipoUsuario === 'administrativo') {
                    window.location.href = "edit.html";
                }
            } else {
                // Mostrar mensajes de error en campos específicos
                const { field, message } = data;
                if (field === "rut") {
                    document.getElementById('rut-error').textContent = message;
                } else if (field === "correo") {
                    document.getElementById('email-error').textContent = message;
                } else if (field === "password") {
                    document.getElementById('password-error').textContent = message;
                }
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });   

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
