let usuarioSesion = null;

// Obtener datos del usuario desde session_status.php
(async () => {
  try {
    const res = await fetch("https://cambiosorion.cl/data/session_status.php", {
      credentials: "include"
    });
    if (!res.ok) throw new Error("No se pudo obtener la sesión.");
    const data = await res.json();
    usuarioSesion = data;
    console.log("Usuario autenticado:", usuarioSesion);
  } catch (error) {
    console.error("Error obteniendo la sesión:", error);
  }
})();

document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("form-nueva-tr");
  const montoInput = document.getElementById("monto");
  const tasaCambioInput = document.getElementById("tasa-cambio");
  const totalSpan = document.getElementById("total-transaccion");
  const cancelarBtn = document.getElementById("cancelar-transaccion");

  let clienteID = null;
  let divisaID = null;

  function formatearMiles(valor) {
    return valor.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }

  function limpiarFormato(valor) {
    return valor.toString().replace(/\./g, "");
  }

  function actualizarTotal() {
    const monto = parseFloat(limpiarFormato(montoInput.value)) || 0;
    const tasa = parseFloat(tasaCambioInput.value) || 0;
    const total = monto * tasa;
    totalSpan.textContent = total.toFixed(2);
  }

  montoInput.addEventListener("input", function (e) {
    let valor = limpiarFormato(e.target.value);
    if (!/^\d*$/.test(valor)) return;

    const num = parseInt(valor, 10) || 0;
    e.target.value = formatearMiles(num);
    actualizarTotal();
  });

  tasaCambioInput.addEventListener("input", actualizarTotal);

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    if (!usuarioSesion || !usuarioSesion.isAuthenticated) {
      mostrarModalError({
        titulo: "❌ Error",
        mensaje: "No se pudo validar al usuario.",
        textoConfirmar: "Entendido"
      });
      return;
    }

    const datos = {
      tipo_transaccion: document.getElementById("tipo-transaccion").value,
      tipo_documento: document.getElementById("tipo-documento").value,
      cliente: clienteID,
      email: document.getElementById("email").value,
      divisa: divisaID,
      tasa: parseFloat(tasaCambioInput.value) || 0,
      monto: parseFloat(limpiarFormato(montoInput.value)) || 0,
      vendedor: {
        id: usuarioSesion.equipo_id,
        nombre: usuarioSesion.equipo_nombre
      }
    };

    fetch("https://cambiosorion.cl/data/nueva-tr.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(datos),
    })
      .then((res) => res.json())
      .then((respuesta) => {
        if (respuesta.exito) {
          mostrarModalExitoso();
        } else {
          mostrarModalError({
            titulo: "❌ Error",
            mensaje: `Error del servidor: ${respuesta.mensaje}`,
            textoConfirmar: "Entendido"
          });
        }
      })
      .catch((error) => {
        console.error("Error al enviar:", error);
        mostrarModalError({
          titulo: "❌ Error",
          mensaje: `Error al enviar los datos ${error}`,
          textoConfirmar: "Entendido"
        });
      });
  });

  cancelarBtn.addEventListener("click", function () {
    mostrarModalError({
      mensaje: `¿Seguro que quieres cancelar la transacción?`,
      textoConfirmar: "Cancelar",
      textoCancelar: "Volver",
      onConfirmar: () => {
        form.reset();
        totalSpan.textContent = "0.00";
        clienteID = null;
        divisaID = null;
      }
    });
  });

  document.getElementById("tipo-transaccion").addEventListener("change", () => {
    if (divisaID) {
      obtenerPreciosDivisa(divisaID).then((precios) => {
        actualizarPlaceholderTasa(precios);
      });
    }
  });

  const clienteInput = document.getElementById("cliente");
  const resultadoClientes = document.getElementById("resultado-clientes");

  clienteInput.addEventListener("input", function () {
    const query = clienteInput.value.trim();
    if (query.length < 2) {
      resultadoClientes.classList.add("hidden");
      return;
    }

    fetch(`https://cambiosorion.cl/data/nueva-tr.php?buscar_cliente=${encodeURIComponent(query)}`)
      .then((res) => res.json())
      .then((data) => {
        resultadoClientes.innerHTML = "";
        if (data.length === 0) {
          resultadoClientes.classList.add("hidden");
          return;
        }

        data.forEach((cliente) => {
          const li = document.createElement("li");
          li.textContent = cliente.nombre;
          li.dataset.id = cliente.id;
          li.classList.add("px-2", "py-1", "hover:bg-gray-200", "cursor-pointer");
          li.addEventListener("click", () => {
            clienteInput.value = cliente.nombre;
            clienteID = cliente.id;
            resultadoClientes.classList.add("hidden");
          });
          resultadoClientes.appendChild(li);
        });

        resultadoClientes.classList.remove("hidden");
      });
  });

  const divisaInput = document.getElementById("divisa");
  const sugerenciasDivisas = document.getElementById("sugerencias-divisas");

    divisaInput.addEventListener("input", async (e) => {
        const query = e.target.value.trim();
        if (query.length < 1) {
        sugerenciasUl.classList.add("hidden");
        return;
        }
        try {
        const res = await fetch(`https://cambiosorion.cl/data/nueva-tr.php?buscar_divisa=${encodeURIComponent(query)}`);
        const divisas = await res.json();
        sugerenciasUl.innerHTML = "";
        divisas.forEach((divisa) => {
            const li = document.createElement("li");
            li.textContent = divisa.nombre;
            li.classList.add("px-2", "py-1", "hover:bg-gray-200", "cursor-pointer");
            li.addEventListener("click", async () => {
              divisaInput.value = divisa.nombre;
              divisaInput.dataset.id = divisa.id;
              sugerenciasUl.classList.add("hidden");
              console.log(`Divisa seleccionada: ${divisa.nombre}, ID: ${divisa.id}`);

              // Actualizar inmediatamente el placeholder al seleccionar divisa
              const tipoOperacion = document.getElementById("tipo-transaccion").value;
              try {
                  const res = await fetch(`https://cambiosorion.cl/data/nueva-tr.php?precio_divisa=${encodeURIComponent(divisa.nombre)}&tipo=${tipoOperacion}`);
                  const data = await res.json();
                  if (data && data.precio) {
                      const precio = parseFloat(data.precio);
                      const precioFormateado = Number.isInteger(precio)
                          ? new Intl.NumberFormat('es-CL').format(precio)
                          : new Intl.NumberFormat('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(precio);
                      nuevaDivisa.querySelector(".divisa-tasa").placeholder = `≈ ${precioFormateado}`;
                  } else {
                      nuevaDivisa.querySelector(".divisa-tasa").placeholder = "Tasa de cambio";
                  }
              } catch (err) {
                  console.error("Error al obtener tasa:", err);
                  nuevaDivisa.querySelector(".divisa-tasa").placeholder = "Tasa de cambio";
              }
            });
            sugerenciasUl.appendChild(li);
        });
        sugerenciasUl.classList.remove("hidden");
        } catch (err) {
        console.error(err);
        }
    });

  function obtenerPreciosDivisa(divisaID) {
    return fetch(`https://cambiosorion.cl/data/nueva-tr.php?divisa_id=${divisaID}`)
      .then((res) => res.json())
      .catch((error) => {
        console.error("Error al obtener precios de la divisa:", error);
        return null;
      });
  }

  function actualizarPlaceholderTasa(precios) {
    const tipoTransaccion = document.getElementById("tipo-transaccion").value;
    if (!precios) {
      tasaCambioInput.placeholder = "Tasa de cambio";
      return;
    }

    if (tipoTransaccion === "compra") {
      tasaCambioInput.placeholder = precios.compra ? precios.compra.toFixed(2) : "Tasa de cambio";
    } else if (tipoTransaccion === "venta") {
      tasaCambioInput.placeholder = precios.venta ? precios.venta.toFixed(2) : "Tasa de cambio";
    } else {
      tasaCambioInput.placeholder = "Tasa de cambio";
    }
  }
});

function mostrarModalAdvertencia({mensaje, textoConfirmar = "Aceptar", textoCancelar = null, onConfirmar, onCancelar }) {
  const modal = document.getElementById("modal-advertencia");
  const mensajeElem = document.getElementById("modal-advertencia-mensaje");
  const btnConfirmar = document.getElementById("modal-advertencia-confirmar");
  const btnCancelar = document.getElementById("modal-advertencia-cancelar");

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

  document.getElementById("nueva-transaccion").onclick = () => {
    modal.classList.add("hidden");
    document.getElementById("form-nueva-tr").reset();
    // Resetear también estado adicional si es necesario
  };

  document.getElementById("volver").onclick = () => {
    window.location.href = "https://caja.cambiosorion.cl/transacciones";
  };
}
