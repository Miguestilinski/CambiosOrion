// Función para inicializar la lógica del menú
function initMenu() {
    const menuToggle = document.getElementById('menu-toggle');
    const sessionToggle = document.getElementById('session-toggle');
    const navMenu = document.getElementById('nav-menu');
    const sessionMenu = document.getElementById('session-menu');

    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('hidden');
            if (sessionMenu && !sessionMenu.classList.contains('hidden')) {
                sessionMenu.classList.add('hidden');
            }
        });
    }

    if (sessionToggle && sessionMenu) {
        sessionToggle.addEventListener('click', () => {
            sessionMenu.classList.toggle('hidden');
            if (navMenu && !navMenu.classList.contains('hidden')) {
                navMenu.classList.add('hidden');
            }
        });
    }
}

// Función para marcar la opción activa
function setActiveLinks() {
    const markActive = (menuId) => {
        const links = document.querySelectorAll(`${menuId} a`);
        const currentPath = window.location.pathname;

        links.forEach(link => {
            if (link.getAttribute('href') === currentPath) {
                link.classList.add('selected');
            } else {
                link.classList.remove('selected');
            }
        });
    };

    markActive('#nav-menu');
    markActive('#session-menu');
}

// Función para inicializar el formulario de registro
function initRegisterForm() {
    const registerForm = document.getElementById("register-form");

    if (!registerForm) return;

    registerForm.addEventListener("submit", async (event) => {
        event.preventDefault();
    
        const rut = document.getElementById("rut")?.value;
        const tipoUsuario = document.getElementById("tipo_usuario")?.value;
        const nombreUsuario = document.getElementById("nombre_usuario")?.value;
        const correo = document.getElementById("correo")?.value;
        const contrasena = document.getElementById("contrasena")?.value;
        const confirmContrasena = document.getElementById("confirm_contrasena")?.value;
    
        // Validaciones
        if (!rut || !nombreUsuario || !correo || !contrasena || !confirmContrasena) {
            alert("Por favor completa todos los campos.");
            return;
        }
    
        if (contrasena !== confirmContrasena) {
            alert("Las contraseñas no coinciden.");
            return;
        }
    
        if (!validarRUT(rut)) {
            alert("Por favor ingresa un RUT válido.");
            return;
        }
    
        const userData = { rut, tipo_usuario: tipoUsuario, nombre_usuario: nombreUsuario, correo, contrasena };
    
        try {
            const response = await fetch('https://cambiosorion.cl/data/registro.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData),
            });
    
            // Verificar si la respuesta es vacía
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error en la respuesta del servidor:', errorText);
                alert("Hubo un problema al procesar la solicitud.");
                return;
            }
    
            const result = await response.json();  // Aquí usamos `.json()`
    
            // Manejo de la respuesta
            if (result.success) {
                alert(result.success);
                window.location.href = "iniciar_sesion.html";
            } else {
                alert(result.error || "Error al registrar el usuario.");
            }
        } catch (error) {
            console.error("Error al procesar la solicitud:", error);
            alert("Hubo un problema al procesar el registro.");
        }
    });    

    // Validaciones de RUT
    const rutInput = document.getElementById("rut");
    if (rutInput) {
        rutInput.addEventListener("input", () => {
            rutInput.value = rutInput.value.replace(/[^0-9Kk-]/g, '');
        });

        rutInput.addEventListener("blur", () => {
            rutInput.value = formatearRUT(rutInput.value);
        });
    }
}

// Validar el RUT
function validarRUT(rut) {
    rut = rut.replace(/[^\dKk]/g, '').toUpperCase();
    if (rut.length < 2) return false;

    const cuerpo = rut.slice(0, -1);
    const dv = rut.slice(-1);

    if (!/^\d+$/.test(cuerpo)) return false;
    if (dv !== "K" && !/^\d$/.test(dv)) return false;

    return true;
}

// Formatear el RUT
function formatearRUT(rut) {
    rut = rut.replace(/[^\dKk]/g, '').toUpperCase();
    if (rut.length <= 1) return rut;

    const cuerpo = rut.slice(0, -1);
    const dv = rut.slice(-1);

    return cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + '-' + dv.toLowerCase();
}

// Inicializar todas las funcionalidades al cargar el DOM
document.addEventListener("DOMContentLoaded", () => {
    initMenu();
    setActiveLinks();
    initRegisterForm();
});
