document.addEventListener("DOMContentLoaded", () => {
    const tipoSelect = document.getElementById("tipo");
    const fieldsetDireccion = document.getElementById("fieldset-direccion");
    const campoPais = document.getElementById("pais");
    const campoComuna = document.getElementById("comuna");

    const rutInput = document.getElementById("rut");
    const rutError = document.getElementById("rut-error");

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

    tipoSelect.addEventListener("change", () => {
        const tipo = tipoSelect.value;

        if (tipo === "Persona Juridica" || tipo === "Persona Natural") {
            fieldsetDireccion.classList.remove("hidden");
            campoPais.classList.add("hidden");
            campoComuna.classList.remove("hidden");
        } else if (tipo === "Extranjero") {
            fieldsetDireccion.classList.remove("hidden");
            campoPais.classList.remove("hidden");
            campoComuna.classList.add("hidden");
        } else {
            fieldsetDireccion.classList.add("hidden");
        }
    });

    // Validación de campos requeridos
    document.getElementById("form-nuevo-cliente").addEventListener("submit", (e) => {
        e.preventDefault();

        const tipo = tipoSelect.value.trim();
        const razonSocial = document.getElementById("razon_social").value.trim();
        const rut = document.getElementById("rut").value.trim();
        const correo = document.getElementById("correo").value.trim();
        const telefono = document.getElementById("fono").value.trim();
        const direccion = document.getElementById("direccion_detalle").value.trim();

        rutError.classList.add("hidden");
        rutInput.classList.remove("border-red-500", "focus:border-red-500");

        if (!tipo || !razonSocial || !rut || !correo) {
            mostrarModalError({
                titulo: "❌ Error",
                mensaje: `Campos requeridos incompletos. Por favor complete todos los campos marcados con *.`,
                textoConfirmar: "Cerrar"
            });
        }

        if (!validarRut(rut)) {
            rutError.classList.remove("hidden");
            rutInput.classList.add("border-red-500", "focus:border-red-500");
            
            // Opcional: mostrar modal de error específico si prefieres
            // mostrarModalError({
            //     titulo: "❌ Error",
            //     mensaje: `El RUT ingresado no es válido.`,
            //     textoConfirmar: "Cerrar"
            // });
            return; // Detener aquí
        }

        const datosCliente = {
            tipo: tipo,
            razon_social: razonSocial,
            rut: rut,
            correo: correo,
            telefono: telefono,
            direccion: direccion,
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
    const dvEsperado = 11 - (suma % 11);

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
