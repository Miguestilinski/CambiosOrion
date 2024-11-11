// Función para formatear el RUT
function formatearRUT(rut) {
    // Eliminar todos los caracteres que no sean números ni la letra K
    rut = rut.replace(/[^\dKk]/g, '').toUpperCase();

    // Si el RUT tiene menos de 8 caracteres, no lo formateamos
    if (rut.length <= 1) return rut;

    // Dividir en partes (cuerpo y dígito verificador)
    const cuerpo = rut.slice(0, -1); // Los números antes del último caracter
    const dv = rut.slice(-1); // El último caracter que es el dígito verificador

    // Agregar puntos al cuerpo
    const cuerpoFormateado = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    // Si el RUT es válido (tiene un cuerpo y un dígito verificador), devolver el formato completo
    return cuerpoFormateado + '-' + dv;
}

// Función para validar el RUT chileno
function validarRUT(rut) {
    // Eliminar espacios en blanco y guiones
    rut = rut.replace(/[^\dKk]/g, '').toUpperCase();

    // Verificar que el RUT tenga al menos 2 caracteres
    if (rut.length < 2) return false;

    // Separar el cuerpo y el dígito verificador
    const cuerpo = rut.slice(0, -1);
    const dv = rut.slice(-1);

    // Validar que el cuerpo del RUT contenga solo números
    if (!/^\d+$/.test(cuerpo)) return false;

    // Calcular el dígito verificador
    let suma = 0;
    let multiplo = 2;

    // Recorremos el RUT de derecha a izquierda
    for (let i = cuerpo.length - 1; i >= 0; i--) {
        suma += cuerpo.charAt(i) * multiplo;
        multiplo = multiplo === 7 ? 2 : multiplo + 1;
    }

    const dvCalculado = 11 - (suma % 11);

    // Verificar el dígito verificador
    const dvCorrecto = dvCalculado === 10 ? 'K' : dvCalculado === 11 ? '0' : dvCalculado.toString();
    
    return dv === dvCorrecto;
}

// Función para manejar el formulario y validación
document.addEventListener("DOMContentLoaded", function () {
    const loginForm = document.getElementById("loginForm");

    document.getElementById("rut").addEventListener("blur", function () {
        const rut = this.value;
        this.value = formatearRUT(rut);
    });

    loginForm.addEventListener("submit", async function (event) {
        event.preventDefault(); // Previene el envío tradicional del formulario

        // Obtiene valores del formulario
        const rut = document.getElementById("rut").value;
        const contrasena = document.getElementById("contrasena").value;

        // Validar RUT
        if (!validarRUT(rut)) {
            // Mostrar mensaje de error si el RUT no es válido
            document.getElementById('rut-error').textContent = "Escriba un RUT válido.";
            document.getElementById('rut-error').classList.remove('hidden');
            document.getElementById('rut').classList.add('bg-red-50', 'border-red-500', 'text-red-900');
            return; // Detener el envío del formulario
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
