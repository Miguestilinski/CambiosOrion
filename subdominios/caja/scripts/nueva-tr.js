let usuarioSesion = null;

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

let clienteSeleccionado = null;

const clienteInput = document.getElementById("cliente");
const resultadoClientes = document.getElementById("resultado-clientes");

clienteInput.addEventListener("input", async (e) => {
  const query = e.target.value.trim();
  if (query.length < 2) {
    resultadoClientes.classList.add("hidden");
    return;
  }

  try {
    const res = await fetch(`https://cambiosorion.cl/data/nueva-tr.php?buscar_cliente=${encodeURIComponent(query)}`);
    const clientes = await res.json();
    resultadoClientes.innerHTML = "";
    clientes.forEach((cliente) => {
      const li = document.createElement("li");
      li.textContent = cliente.nombre;
      li.classList.add("px-2", "py-1", "hover:bg-gray-200", "cursor-pointer");
      li.addEventListener("click", () => {
        clienteInput.value = cliente.nombre;
        clienteSeleccionado = cliente;
        resultadoClientes.classList.add("hidden");
      });
      resultadoClientes.appendChild(li);
    });
    resultadoClientes.classList.remove("hidden");
  } catch (error) {
    console.error("Error al buscar cliente.", error);
  }
});

document.addEventListener("click", (e) => {
  if (!clienteInput.contains(e.target) && !resultadoClientes.contains(e.target)) {
    resultadoClientes.classList.add("hidden");
  }
});

// Divisa única
const montoInput = document.getElementById("monto");
const tasaInput = document.getElementById("tasa-cambio");
const divisaInput = document.getElementById("divisa");
const sugerenciasUl = document.getElementById("sugerencias-divisas");
const totalOperacion = document.getElementById("total-transaccion");

function calcularTotalOperacion() {
  const monto = parseFloat(montoInput.value);
  const tasa = parseFloat(tasaInput.value);
  const divisaId = divisaInput.dataset.id;

  const todosValidos = !isNaN(monto) && !isNaN(tasa) && divisaId && divisaId !== "";

  const total = todosValidos ? Math.round(monto * tasa) : 0;

  if (totalOperacion) {
    totalOperacion.textContent = `${new Intl.NumberFormat('es-CL').format(total)}`;
  }
}

montoInput.addEventListener("input", (e) => {
  e.target.value = e.target.value.replace(/[^0-9]/g, '');
  calcularTotalOperacion();
});

tasaInput.addEventListener("input", (e) => {
  let value = e.target.value;
  if (value.match(/^(\d+(\.\d{0,2})?)?$/)) {
    e.target.value = value;
  } else {
    e.target.value = value.slice(0, -1);
  }
  calcularTotalOperacion();
});

divisaInput.addEventListener("input", async (e) => {
  tasaInput.value = "";

  const query = e.target.value.trim();
  if (query.length < 1) {
    sugerenciasUl.classList.add("hidden");
    calcularTotalOperacion();
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

        const tipoOperacion = document.getElementById("tipo-transaccion").value;
        try {
          const res = await fetch(`https://cambiosorion.cl/data/nueva-tr.php?precio_divisa=${encodeURIComponent(divisa.nombre)}&tipo=${tipoOperacion}`);
          const data = await res.json();
          if (data && data.precio) {
            const precio = parseFloat(data.precio);
            const precioFormateado = Number.isInteger(precio)
              ? new Intl.NumberFormat('es-CL').format(precio)
              : new Intl.NumberFormat('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(precio);
            tasaInput.placeholder = `≈ ${precioFormateado}`;
          } else {
            tasaInput.placeholder = "Tasa de cambio";
          }
        } catch (err) {
          console.error("Error al obtener tasa:", err);
          tasaInput.placeholder = "Tasa de cambio";
        }
        calcularTotalOperacion();
      });
      sugerenciasUl.appendChild(li);
    });
    sugerenciasUl.classList.remove("hidden");
  } catch (err) {
    console.error(err);
  }
});

document.addEventListener("click", (e) => {
  if (!divisaInput.contains(e.target) && !sugerenciasUl.contains(e.target)) {
    sugerenciasUl.classList.add("hidden");
  }
});

const tipoTransaccionSelect = document.getElementById("tipo-transaccion");
const metodoPagoSelect = document.getElementById("metodo-pago");

// Función que aplica la lógica según el tipo de transacción
function actualizarMetodoPago() {
  const tipo = tipoTransaccionSelect.value;

  // Si es compra, solo se permite efectivo
  if (tipo === "compra") {
    for (const option of metodoPagoSelect.options) {
      if (option.value !== "efectivo") {
        option.disabled = true;
      } else {
        option.disabled = false;
        option.selected = true;
      }
    }
  } else {
    // Si es venta, habilita todas las opciones
    for (const option of metodoPagoSelect.options) {
      option.disabled = false;
    }
  }
}

// Escuchar cambios en tipo de transacción
tipoTransaccionSelect.addEventListener("change", async () => {
  actualizarMetodoPago();

  // Actualización de tasa
  const nombre = divisaInput.value.trim();
  if (!nombre) return;

  try {
    const res = await fetch(`https://cambiosorion.cl/data/nueva-tr.php?precio_divisa=${encodeURIComponent(nombre)}&tipo=${tipoTransaccionSelect.value}`);
    const data = await res.json();

    if (data && data.precio) {
      const precio = parseFloat(data.precio);
      const precioFormateado = Number.isInteger(precio)
        ? new Intl.NumberFormat('es-CL').format(precio)
        : new Intl.NumberFormat('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(precio);

      tasaInput.placeholder = `≈ ${precioFormateado}`;
    } else {
      tasaInput.placeholder = "Tasa de cambio";
    }
  } catch (err) {
    console.error("Error al actualizar precio:", err);
    tasaInput.placeholder = "Tasa de cambio";
  }
});

// Aplicar lógica inicial al cargar la página
actualizarMetodoPago();

document.querySelector("button[type='submit']").addEventListener("click", async (e) => {
  e.preventDefault();

  if (!clienteSeleccionado && clienteInput.value.trim() !== "") {
    mostrarModalError({
      titulo: "❌ Error",
      mensaje: "Selecciona un cliente válido.",
      textoConfirmar: "Entendido"
    });
    return;
  }

  if (!usuarioSesion || !usuarioSesion.isAuthenticated) {
    mostrarModalError({
      titulo: "❌ Error",
      mensaje: "No se pudo validar al usuario.",
      textoConfirmar: "Entendido"
    });
    return;
  }

  const divisaId = divisaInput.dataset.id;
  const nombre = divisaInput.value.trim();
  const monto = parseInt(montoInput.value) || 0;
  const tasa = parseFloat(tasaInput.value) || 0;
  const total = Math.round(monto * tasa);

  if (!divisaId || !nombre) {
    mostrarModalError({
      titulo: "❌ Error",
      mensaje: "Selecciona una divisa válida.",
      textoConfirmar: "Entendido"
    });
    return;
  }

  await procesarVenta(total);

  async function obtenerTasaCambio(nombreDivisa, tipo) {
    try {
      const response = await fetch(`https://cambiosorion.cl/data/nueva-tr.php?precio_divisa=${encodeURIComponent(nombreDivisa)}&tipo=${encodeURIComponent(tipo)}`);
      const data = await response.json();
      return data.precio ? parseFloat(data.precio) : null;
    } catch (error) {
      console.error("Error al obtener la tasa de cambio:", error);
      return null;
    }
  }

  async function enviarTransaccion() {
    const payload = {
      caja: usuarioSesion.caja_id,
      cliente_id: clienteSeleccionado ? clienteSeleccionado.id : null,
      tipo_transaccion: document.getElementById("tipo-transaccion").value,
      tipo_documento: document.getElementById("tipo-documento").value,
      numero_documento: "DOC-" + Math.floor(100000 + Math.random() * 900000),
      numero_nota: "NOTA-" + Math.floor(1000 + Math.random() * 9000),
      metodo_pago: document.getElementById("metodo-pago").value,
      estado: "Vigente",
      email: document.getElementById("email").value,
      total: total,
      divisa: [{
        divisa_id: divisaId,
        nombre,
        monto: monto,
        tasa_cambio: tasa
      }],
      vendedor: {
        id: usuarioSesion.equipo_id,
        nombre: usuarioSesion.equipo_nombre,
      }
    };

    try {
      const res = await fetch("https://cambiosorion.cl/data/nueva-tr.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      
      console.log("Payload enviado:", JSON.stringify(payload, null, 2));

      const rawText = await res.text();
      console.log("Respuesta cruda:", rawText);

      let resultado;
      try {
        resultado = JSON.parse(rawText); // intentar parsear si es posible
      } catch (jsonError) {
        console.error("Error al parsear JSON:", jsonError);
        console.error("Respuesta del servidor:", rawText);
        mostrarModalError({
          titulo: "❌ Error",
          mensaje: `Respuesta inesperada del servidor:\n\n${rawText}`,
          textoConfirmar: "Entendido"
        });
        return;
      }

      if (resultado.error) {
        mostrarModalError({
          titulo: "❌ Error",
          mensaje: ("Error: " + resultado.error),
          textoConfirmar: "Entendido"
        });
      } else {
        mostrarModalExitoso();
      }
    } catch (err) {
      console.error(err);
      mostrarModalError({
        titulo: "❌ Error",
        mensaje: `Error al registrar transacción: ${err}`,
        textoConfirmar: "Entendido"
      });
    }
  }

  // Uso en tu función principal:
  async function procesarVenta(subtotalCLP) {
    const tipoTransaccion = document.getElementById("tipo-transaccion").value;

    const tasaCambio = await obtenerTasaCambio(nombre, tipoTransaccion);

    if (!tasaCambio) {
      mostrarModalError({
        titulo: "❌ Error",
        mensaje: "No se pudo obtener la tasa de cambio.",
        textoConfirmar: "Entendido"
      });
      return;
    }

    const subtotalUSD = subtotalCLP / tasaCambio;

    if (subtotalUSD >= 3000) {
      mostrarModalAdvertencia({
        mensaje: "El monto supera los $3000 USD. Recuerda solicitar el Carnet de Identidad al cliente.",
        textoConfirmar: "Continuar",
        textoCancelar: "Cancelar",
        onConfirmar: async () => {
          await enviarTransaccion();
        },
        onCancelar: () => {
          // No hacer nada
        }
      });
      return;
    }

    // Si no supera los 3000 USD, enviamos normalmente
    await enviarTransaccion();
  }
});

document.getElementById("cancelar").addEventListener("click", () => {
  window.location.href = "https://caja.cambiosorion.cl/transacciones";
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
