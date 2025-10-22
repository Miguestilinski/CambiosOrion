document.addEventListener("DOMContentLoaded", () => {
    const tipoSelect = document.getElementById("tipo");
    const fieldsetDireccion = document.getElementById("fieldset-direccion");
    const campoPais = document.getElementById("pais");
    const campoComuna = document.getElementById("comuna");

    const rutContainer = document.getElementById("rut-container");
    const rutInput = document.getElementById("rut");
    const rutError = document.getElementById("rut-error");

    const dniContainer = document.getElementById("dni-container");
    const dniInput = document.getElementById("dni");
    const dniError = document.getElementById("dni-error");

    rutInput.addEventListener("input", () => {
        rutError.classList.add("hidden");
        rutInput.classList.remove("border-red-500", "focus:border-red-500");
    });

    rutInput.addEventListener("blur", () => {
        const rut = rutInput.value.trim();
        if (rut.length > 0 && !validarRut(rut)) {
            rutError.classList.remove("hidden");
            rutInput.classList.add("border-red-500", "focus:border-red-500");
        } else {
            rutError.classList.add("hidden");
            rutInput.classList.remove("border-red-500", "focus:border-red-500");
        }
    });

    rutInput.addEventListener("keydown", (e) => {
        // Permitir: números, punto, guión, K, y teclas de control
        const esValido = (
            (e.key >= '0' && e.key <= '9') ||
            e.key === 'k' || e.key === 'K' ||
            e.key === '.' || e.key === '-' ||
            // Teclas de control
            ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Home', 'End'].includes(e.key)
        );

        if (!esValido) {
            e.preventDefault();
        }
    });

    dniInput.addEventListener("input", () => {
        dniError.classList.add("hidden");
        dniInput.classList.remove("border-red-500", "focus:border-red-500");
    });

    tipoSelect.addEventListener("change", () => {
        const tipo = tipoSelect.value;

if (tipo === "Extranjero") {
            // Ocultar RUT, mostrar DNI
            rutContainer.classList.add("hidden");
            rutInput.required = false; // Ya no es obligatorio
            rutInput.value = ""; // Limpiar valor
            rutError.classList.add("hidden"); // Ocultar error

            dniContainer.classList.remove("hidden");
            dniInput.required = true; // Ahora es obligatorio
            
            // Lógica de dirección (existente)
            fieldsetDireccion.classList.remove("hidden");
            campoPais.classList.remove("hidden");
            campoComuna.classList.add("hidden");

        } else if (tipo === "Persona Juridica" || tipo === "Persona Natural" || tipo === "Miembro") {
            // Mostrar RUT, ocultar DNI
            rutContainer.classList.remove("hidden");
            rutInput.required = true; // Es obligatorio

            dniContainer.classList.add("hidden");
            dniInput.required = false; // Ya no es obligatorio
            dniInput.value = ""; // Limpiar valor
            dniError.classList.add("hidden"); // Ocultar error

            // Lógica de dirección (existente, ajustada)
            if (tipo === "Miembro") {
                fieldsetDireccion.classList.add("hidden");
            } else {
                fieldsetDireccion.classList.remove("hidden");
                campoPais.classList.add("hidden");
                campoComuna.classList.remove("hidden");
            }

        } else { // Caso "Seleccione tipo"
            fieldsetDireccion.classList.add("hidden");
            // Dejar RUT visible por defecto
            rutContainer.classList.remove("hidden");
            rutInput.required = true;
            dniContainer.classList.add("hidden");
            dniInput.required = false;
        }
    });

    // Validación de campos requeridos
    document.getElementById("form-nuevo-cliente").addEventListener("submit", (e) => {
        e.preventDefault();

        const tipo = tipoSelect.value.trim();
        const razonSocial = document.getElementById("razon_social").value.trim();
        const rut = document.getElementById("rut").value.trim();
        const dni = dniInput.value.trim();
        const correo = document.getElementById("correo").value.trim();
        const telefono = document.getElementById("fono").value.trim();
        const direccion = document.getElementById("direccion_detalle").value.trim();

        rutError.classList.add("hidden");
        rutInput.classList.remove("border-red-500", "focus:border-red-500");
        dniError.classList.add("hidden");
        dniInput.classList.remove("border-red-500", "focus:border-red-500");

        let isValid = true;

        // Validar campos comunes
        if (!tipo || !razonSocial || !correo) {
            isValid = false;
        }

        // Validar campos condicionales (RUT vs DNI)
        if (tipo === "Extranjero") {
            if (!dni) {
                isValid = false;
                dniError.classList.remove("hidden");
                dniInput.classList.add("border-red-500", "focus:border-red-500");
            }
        } else { // Persona Natural, Juridica, Miembro, etc.
            if (!rut) {
                isValid = false;
                rutError.textContent = "Por favor, ingrese un RUT."; // Mensaje específico
                rutError.classList.remove("hidden");
                rutInput.classList.add("border-red-500", "focus:border-red-500");
            } else if (!validarRut(rut)) {
                isValid = false;
                rutError.textContent = "Por favor, ingrese un RUT válido."; // Mensaje específico
                rutError.classList.remove("hidden");
                rutInput.classList.add("border-red-500", "focus:border-red-500");
            }
        }
        
        // Detener si algo es inválido
        if (!isValid) {
            // Mostrar modal genérico solo si los errores de campo específicos no se mostraron
            if (rutError.classList.contains('hidden') && dniError.classList.contains('hidden')) {
                mostrarModalError({
                    titulo: "❌ Error",
                    mensaje: `Campos requeridos incompletos. Por favor complete todos los campos marcados con *.`,
                    textoConfirmar: "Cerrar"
                });
            }
            return;
        }

        const datosCliente = {
            tipo: tipo,
            razon_social: razonSocial,
            correo: correo,
            telefono: telefono,
            direccion: direccion,
            ...(tipo === "Extranjero" ? { dni: dni } : { rut: rut })
        };

        fetch('https://cambiosorion.cl/data/nuevo-cliente.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datosCliente)
        })
        .then(response => response.text())
        .then(rawText => {
            console.log("Respuesta cruda del servidor:", rawText);

            // Luego intentar parsear como JSON manualmente
            try {
                const data = JSON.parse(rawText);
                if (data.success) {
                    mostrarModalExitoso();
                } else if (data.error) {
                    mostrarModalError({
                        titulo: "❌ Error",
                        mensaje: `Error al crear cliente: ${data.error}`,
                        textoConfirmar: "Cerrar"
                    });
                }
            } catch (err) {
                console.error("No se pudo parsear JSON:", err);
                console.error("Texto recibido:", rawText);
            }
        })
        .catch(error => {
        console.error("Error en la solicitud:", error);
        });
    });
});

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

function mostrarModalExitoso() {
  const modal = document.getElementById("modal-exitoso");
  modal.classList.remove("hidden");

  document.getElementById("nuevo-cliente").onclick = () => {
    modal.classList.add("hidden");
    document.getElementById("form-nuevo-cliente").reset();
    // Resetear también estado adicional si es necesario

    document.getElementById("rut-container").classList.remove("hidden");
    document.getElementById("dni-container").classList.add("hidden");
    document.getElementById("rut").required = true;
    document.getElementById("dni").required = false;
    document.getElementById("fieldset-direccion").classList.add("hidden");
  };

  document.getElementById("volver").onclick = () => {
    window.location.href = "https://tesoreia.cambiosorion.cl/clientes";
  };
}

function validarRut(rutCompleto) {
    if (!rutCompleto || typeof rutCompleto !== 'string') return false;

    // Limpia el RUT de puntos y guion
    const rutLimpio = rutCompleto.replace(/[^0-9kK]/g, '').toUpperCase();
    
    if (rutLimpio.length < 2) return false;

    const cuerpo = rutLimpio.slice(0, -1);
    let dv = rutLimpio.slice(-1);

    let suma = 0;
    let multiplo = 2;

    // Calcular suma ponderada
    for(let i = cuerpo.length - 1; i >= 0; i--) {
        suma += multiplo * parseInt(cuerpo.charAt(i), 10);
        multiplo = multiplo < 7 ? multiplo + 1 : 2;
    }

    // Calcular dígito verificador esperado
    let dvEsperado = 11 - (suma % 11);

    // Manejar casos especiales del dígito
    if (dvEsperado === 11) {
        dvEsperado = '0';
    } else if (dvEsperado === 10) {
        dvEsperado = 'K';
    } else {
        dvEsperado = dvEsperado.toString();
    }

    // Comparar
    return dv === dvEsperado;
}
