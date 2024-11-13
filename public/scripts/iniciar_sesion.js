function formatearRUT(rut) {
    rut = rut.replace(/[^\dKk]/g, '').toUpperCase();

    if (rut.length <= 1) return rut;

    const cuerpo = rut.slice(0, -1);
    const dv = rut.slice(-1);

    const cuerpoFormateado = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    return cuerpoFormateado + '-' + dv.toLowerCase();
}

// Función para validar el RUT chileno
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

document.addEventListener('DOMContentLoaded', function() {
    // Obtener los botones y menús
    const menuToggle = document.getElementById('menu-toggle');
    const sessionToggle = document.getElementById('session-toggle');
    const navMenu = document.getElementById('nav-menu');
    const sessionMenu = document.getElementById('session-menu');

    // Función para alternar la visibilidad del menú de navegación
    menuToggle.addEventListener('click', function() {
        navMenu.classList.toggle('hidden');
    });

    // Función para alternar la visibilidad del menú de sesión
    sessionToggle.addEventListener('click', function() {
        sessionMenu.classList.toggle('hidden');
    });
});

document.addEventListener("DOMContentLoaded", function () {
    const loginForm = document.getElementById("loginForm");

    document.getElementById("rut").addEventListener("blur", function () {
        const rut = this.value;
        this.value = formatearRUT(rut);
    });

    document.getElementById("rut").addEventListener("input", function (event) {
        let valor = this.value;
        valor = valor.replace(/[^0-9Kk-]/g, '');
        this.value = valor;
    });

    loginForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const rut = document.getElementById("rut").value;
        const contrasena = document.getElementById("contrasena").value;

        if (!validarRUT(rut)) {
            document.getElementById('rut-error').textContent = "Escriba un RUT válido.";
            document.getElementById('rut-error').classList.remove('hidden');
            document.getElementById('rut').classList.add('bg-red-50', 'border-red-500', 'text-red-900');
            return;
        }

        try {
            const response = await fetch('/data/iniciar_sesion.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: `rut=${encodeURIComponent(rut)}&contrasena=${encodeURIComponent(contrasena)}`
            });

            const result = await response.json();

            // Restablece el estilo de error antes de cualquier cambio
            resetErrorStyles();

            if (result.success) {
                // Redirige al usuario a la página principal
                window.location.href = 'index.html';
            } else {
                // Muestra mensaje de error y marca los campos con error
                document.getElementById('error-message').classList.remove('hidden');
                setErrorStyles(result.field); // Define qué campo necesita el estilo de error
            }
        } catch (error) {
            console.error('Error al iniciar sesión:', error);
        }
    });
});

// Función para restablecer los estilos de error
function resetErrorStyles() {
    // Elimina las clases de error
    document.getElementById('rut').classList.remove('bg-red-50', 'border-red-500', 'text-red-900');
    document.getElementById('contrasena').classList.remove('bg-red-50', 'border-red-500', 'text-red-900');
    document.getElementById('rut-error').classList.add('hidden');
    document.getElementById('contrasena-error').classList.add('hidden');
}

// Función para aplicar estilos de error
function setErrorStyles(field) {
    if (field === 'rut') {
        document.getElementById('rut').classList.add('bg-red-50', 'border-red-500', 'text-red-900');
        document.getElementById('rut-error').classList.remove('hidden');
    } else if (field === 'contrasena') {
        document.getElementById('contrasena').classList.add('bg-red-50', 'border-red-500', 'text-red-900');
        document.getElementById('contrasena-error').classList.remove('hidden');
    }
}
