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
    });

    administrativoTab.addEventListener('click', function() {
        administrativoTab.classList.add('active');
        clienteTab.classList.remove('active');
        
        administrativoForm.classList.add('active');
        clienteForm.classList.remove('active');
    });

    // Manejo de la validación y el envío del formulario
    const loginForm = document.getElementById("loginForm");
    loginForm.addEventListener("submit", function(event) {
        event.preventDefault();

        const tipoUsuario = document.querySelector('.tab-button.active').dataset.tipoUsuario;
        const rut = document.getElementById("rut").value;
        const email = document.getElementById("email").value;
        const contrasena = document.getElementById("contrasena").value;

        if (tipoUsuario === 'cliente' && !validarRUT(rut)) {
            document.getElementById('rut-error').textContent = "Escriba un RUT válido.";
            document.getElementById('rut-error').classList.remove('hidden');
            return;
        } else {
            document.getElementById('rut-error').classList.add('hidden');
        }

        if (tipoUsuario === 'administrativo' && !email) {
            document.getElementById('email-error').textContent = "Escriba un correo electrónico válido.";
            document.getElementById('email-error').classList.remove('hidden');
            return;
        } else {
            document.getElementById('email-error').classList.add('hidden');
        }

        // Aquí iría la lógica para enviar los datos al servidor (fetch o AJAX)
        console.log("Formulario enviado");
    });

    function formatearRUT(rut) {
        rut = rut.replace(/[^\dKk]/g, '').toUpperCase();
    
        if (rut.length <= 1) return rut;
    
        const cuerpo = rut.slice(0, -1);
        const dv = rut.slice(-1);
    
        const cuerpoFormateado = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    
        return cuerpoFormateado + '-' + dv.toLowerCase();
    }    

    function validarRUT(rut) {
        const rutSinFormato = rut.replace(/[.-]/g, '');
        let sum = 0;
        let factor = 2;

        for (let i = rutSinFormato.length - 2; i >= 0; i--) {
            sum += parseInt(rutSinFormato[i]) * factor;
            factor = factor === 7 ? 2 : factor + 1;
        }

        const remainder = sum % 11;
        const dv = 11 - remainder;
        const lastDigit = rutSinFormato[rutSinFormato.length - 1].toUpperCase();
        const expectedDv = dv === 11 ? '0' : dv === 10 ? 'K' : dv.toString();

        return lastDigit === expectedDv;
    }
});

// Función para alternar visibilidad
function toggleMenu(menu) {
    if (menu) {
        menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
    }
}

// Marcar la opción activa en el menú
function setActiveLink(menuId) {
    const links = document.querySelectorAll(`${menuId} a`);
    const currentPath = window.location.pathname;
    links.forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('selected');
        } else {
            link.classList.remove('selected');
        }
    });
}

window.addEventListener('resize', function () {
    const mobileButtons = document.querySelector('.md\\:hidden');
});

// Función para restablecer los estilos de error
function resetErrorStyles() {
    // Elimina las clases de error
    const rutError = document.getElementById('rut-error');
    const contrasenaError = document.getElementById('contrasena-error');
    if (rutError) rutError.classList.add('hidden');
    if (contrasenaError) contrasenaError.classList.add('hidden');

    const rutInput = document.getElementById('rut');
    const correoInput = document.getElementById('correo');
    const contrasenaInput = document.getElementById('contrasena');
    if (rutInput) rutInput.classList.remove('bg-red-50', 'border-red-500', 'text-red-900');
    if (correoInput) correoInput.classList.remove('bg-red-50', 'border-red-500', 'text-red-900');
    if (contrasenaInput) contrasenaInput.classList.remove('bg-red-50', 'border-red-500', 'text-red-900');
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
    } else if (field === 'contrasena') {
        const contrasenaInput = document.getElementById('contrasena');
        const contrasenaError = document.getElementById('contrasena-error');
        if (contrasenaInput) contrasenaInput.classList.add('bg-red-50', 'border-red-500', 'text-red-900');
        if (contrasenaError) contrasenaError.classList.remove('hidden');
    }
}
