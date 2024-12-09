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

        document.getElementById('tipoUsuario').value = 'cliente';
    });

    administrativoTab.addEventListener('click', function() {
        administrativoTab.classList.add('active');
        clienteTab.classList.remove('active');
        
        administrativoForm.classList.add('active');
        clienteForm.classList.remove('active');
        
        // Eliminar 'required' de campos no relevantes
        document.getElementById('email').setAttribute('required', 'required');
        document.getElementById('rut').removeAttribute('required');

        document.getElementById('tipoUsuario').value = 'administrativo';
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

        const formData = new FormData(loginForm);
        fetch('https://cambiosorion.cl/data/iniciar_sesion.php', {
            method: 'POST',
            body: formData,
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("Datos enviados:", Object.fromEntries(formData));
            console.log("Respuesta del servidor:", data);
            if (data.success) {
                localStorage.setItem('sessionActive', 'true');
                console.log("Sesión iniciada");
                if (tipoUsuario === 'cliente') {
                    window.location.href = "index";
                } else if (tipoUsuario === 'administrativo') {
                    window.location.href = "edit";
                }
            } else {
                const { field, message } = data;
                if (field === "rut") {
                    document.getElementById('rut-error').textContent = message;
                } else if (field === "email") {
                    document.getElementById('email-error').textContent = message;
                } else if (field === "password") {
                    document.getElementById('password-error').textContent = message;
                }
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert("Hubo un problema con la conexión al servidor. Inténtalo más tarde.");
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
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    if (rutInput) rutInput.classList.remove('bg-red-50', 'border-red-500', 'text-red-900');
    if (emailInput) emailInput.classList.remove('bg-red-50', 'border-red-500', 'text-red-900');
    if (passwordInput) passwordInput.classList.remove('bg-red-50', 'border-red-500', 'text-red-900');
}

// Función para aplicar estilos de error
function setErrorStyles(field) {
    if (field === 'rut') {
        const rutInput = document.getElementById('rut');
        const rutError = document.getElementById('rut-error');
        if (rutInput) rutInput.classList.add('bg-red-50', 'border-red-500', 'text-red-900');
        if (rutError) rutError.classList.remove('hidden');
    } else if (field === 'email') {
        const emailInput = document.getElementById('email');
        const emailError = document.getElementById('email-error');
        if (emailInput) emailInput.classList.add('bg-red-50', 'border-red-500', 'text-red-900');
        if (emailError) emailError.classList.remove('hidden');
    } else if (field === 'password') {
        const passwordInput = document.getElementById('password');
        const passwordError = document.getElementById('password-error');
        if (passwordInput) passwordInput.classList.add('bg-red-50', 'border-red-500', 'text-red-900');
        if (passwordError) passwordError.classList.remove('hidden');
    }
}
