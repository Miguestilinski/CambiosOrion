document.addEventListener("DOMContentLoaded", () => {
    const tipoSelect = document.getElementById("tipo");
    const fieldsetDireccion = document.getElementById("fieldset-direccion");
    const campoPais = document.getElementById("pais");
    const campoComuna = document.getElementById("comuna");

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


        if (!tipo || !razonSocial || !rut || !correo) {
            mostrarModalError({
                titulo: "❌ Error",
                mensaje: `Campos requeridos incompletos. Por favor complete todos los campos marcados con *.`,
                textoConfirmar: "Cerrar"
            });
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