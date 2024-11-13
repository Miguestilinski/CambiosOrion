// Obtener los botones y menús
const menuToggle = document.getElementById('menu-toggle');
const sessionToggle = document.getElementById('session-toggle');
const navMenu = document.getElementById('nav-menu');
const sessionMenu = document.getElementById('session-menu');

// Función para alternar la visibilidad del menú de navegación
menuToggle.addEventListener('click', function() {
    // Alternar la visibilidad del menú de navegación
    navMenu.classList.toggle('hidden');
    
    // Si el menú de sesión está abierto, cerrarlo
    if (!sessionMenu.classList.contains('hidden')) {
        sessionMenu.classList.add('hidden');
    }
});

// Función para alternar la visibilidad del menú de sesión
sessionToggle.addEventListener('click', function() {
    // Alternar la visibilidad del menú de sesión
    sessionMenu.classList.toggle('hidden');
    
    // Si el menú de navegación está abierto, cerrarlo
    if (!navMenu.classList.contains('hidden')) {
        navMenu.classList.add('hidden');
    }
});

// Función para marcar la opción activa en el menú de navegación y sesión
function setActiveLink(menuId) {
    const links = document.querySelectorAll(`${menuId} a`);
    const currentPath = window.location.pathname; // Obtener la ruta actual

    links.forEach(link => {
        // Si la URL del enlace coincide con la URL actual, marca como seleccionado
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('selected');
        } else {
            link.classList.remove('selected');
        }
    });
}

// Marcar la opción activa al cargar la página
window.addEventListener('DOMContentLoaded', function() {
    // Aplicar la clase 'selected' en el menú de navegación
    setActiveLink('#nav-menu');

    // Aplicar la clase 'selected' en el menú de sesión
    setActiveLink('#session-menu');
});

// Marcar la opción activa al cargar la página
window.addEventListener('DOMContentLoaded', function() {
    // Aplicar la clase 'selected' en el menú de navegación
    setActiveLink('#nav-menu');

    // Aplicar la clase 'selected' en el menú de sesión
    setActiveLink('#session-menu');
});

document.addEventListener("DOMContentLoaded", function () {
    // Inicializar el formulario de registro
    const registerForm = document.getElementById("register-form");

    registerForm.addEventListener("submit", function (event) {
        event.preventDefault();

        // Obtener valores de los campos
        const rut = document.getElementById("rut").value;
        const tipoUsuario = document.getElementById("tipo_usuario").value;
        const nombreUsuario = document.getElementById("nombre_usuario").value;
        const correo = document.getElementById("correo").value;
        const contrasena = document.getElementById("contrasena").value;
        const confirmContrasena = document.getElementById("confirm_contrasena").value;

        // Validaciones de los campos
        if (!rut || !nombreUsuario || !correo || !contrasena || !confirmContrasena) {
            alert("Por favor completa todos los campos.");
            return;
        }

        if (contrasena !== confirmContrasena) {
            alert("Las contraseñas no coinciden.");
            return;
        }

        // Validar formato de RUT
        if (!validarRUT(rut)) {
            alert("Por favor ingresa un RUT válido.");
            return;
        }

        // Simulando un registro de usuario
        const newUser = {
            rut: rut,
            tipo_usuario: tipoUsuario,
            nombre_usuario: nombreUsuario,
            correo: correo,
            contrasena: contrasena
        };

        // Simulando la llamada a la API para registrar el usuario
        alert("Registro exitoso.");

        // Redirigir a la página de inicio de sesión
        window.location.href = "iniciar_sesion.html";
    });

    // Filtrar los caracteres permitidos mientras el usuario escribe el RUT
    document.getElementById("rut").addEventListener("input", function () {
        let valor = this.value;
        valor = valor.replace(/[^0-9Kk-]/g, ''); // Permitir solo números, 'K' o 'k' y el guion
        this.value = valor;
    });

    // Función para formatear el RUT
    document.getElementById("rut").addEventListener("blur", function () {
        this.value = formatearRUT(this.value);
    });
});

// Función para validar el RUT
function validarRUT(rut) {
    rut = rut.replace(/[^\dKk]/g, '').toUpperCase(); // Eliminar todo menos números y la letra K
    if (rut.length < 2) return false; // Si el RUT tiene menos de 2 caracteres es inválido

    // Obtener cuerpo y dígito verificador
    const cuerpo = rut.slice(0, -1);
    const dv = rut.slice(-1);

    // Validar el dígito verificador (lo ideal sería tener una función para validarlo, pero por ahora lo simplificamos)
    if (!/^\d+$/.test(cuerpo)) return false; // El cuerpo solo debe contener números

    if (dv !== "K" && !/^\d$/.test(dv)) return false; // El dígito verificador debe ser un número o K

    return true;
}

// Función para formatear el RUT con puntos y guion
function formatearRUT(rut) {
    rut = rut.replace(/[^\dKk]/g, '').toUpperCase(); // Eliminar caracteres no permitidos y convertir a mayúscula
    if (rut.length <= 1) return rut;

    const cuerpo = rut.slice(0, -1); // Los números antes del último caracter
    const dv = rut.slice(-1); // El último caracter que es el dígito verificador

    const cuerpoFormateado = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return cuerpoFormateado + '-' + dv.toLowerCase(); // Convertir la 'K' a minúscula
}
