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

async function cargarCajas() {
  const cajaSelect = document.getElementById("caja");
  cajaSelect.innerHTML = "";

  try {
    const res = await fetch("https://cambiosorion.cl/data/nueva-tr.php?buscar_cajas=1");
    if (!res.ok) throw new Error("No se pudo obtener las cajas.");
    const cajas = await res.json();

    cajas.forEach((caja) => {
      const option = document.createElement("option");
      option.value = caja.id;
      option.textContent = caja.nombre;
      cajaSelect.appendChild(option);
    });
  } catch (error) {
    console.error("Error al cargar cajas:", error);
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "Error al cargar cajas";
    cajaSelect.appendChild(option);
  }
}

cargarCajas();

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
    console.error(error);
    alert("Error al buscar cliente.");
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
  const monto = parseFloat(montoInput.value) || 0;
  const tasa = parseFloat(tasaInput.value) || 0;
  const total = Math.round(monto * tasa);
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

document.getElementById("tipo-transaccion").addEventListener("change", async () => {
  const nombre = divisaInput.value.trim();
  if (!nombre) return;

  try {
    const res = await fetch(`https://cambiosorion.cl/data/nueva-tr.php?precio_divisa=${encodeURIComponent(nombre)}&tipo=${document.getElementById("tipo-transaccion").value}`);
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

document.querySelector("button[type='submit']").addEventListener("click", async (e) => {
  e.preventDefault();

  if (!clienteSeleccionado) {
    alert("Selecciona un cliente válido.");
    return;
  }

  if (!usuarioSesion || !usuarioSesion.isAuthenticated) {
    alert("No se pudo validar al usuario.");
    return;
  }

  const divisaId = divisaInput.dataset.id;
  const nombre = divisaInput.value.trim();
  const monto = parseInt(montoInput.value) || 0;
  const tasa = parseFloat(tasaInput.value) || 0;
  const subtotal = Math.round(monto * tasa);

  if (!divisaId || !nombre) {
    alert("Selecciona una divisa válida.");
    return;
  }

  const payload = {
    caja: document.getElementById("caja").value,
    cliente_id: clienteSeleccionado.id,
    tipo_transaccion: document.getElementById("tipo-transaccion").value,
    tipo_documento: document.getElementById("tipo-documento").value,
    numero_documento: "DOC-" + Math.floor(100000 + Math.random() * 900000),
    numero_nota: "NOTA-" + Math.floor(1000 + Math.random() * 9000),
    estado: "Vigente",
    email: document.getElementById("email").value,
    total: subtotal,
    divisa: [{
      divisa_id: divisaId,
      nombre,
      monto,
      tasa_cambio: tasa,
      subtotal
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

    const resultado = await res.json();
    if (resultado.error) {
      alert("Error: " + resultado.error);
    } else {
      alert("✅ Transacción registrada exitosamente.");
      location.href = "https://caja.cambiosorion.cl/transacciones";
    }
  } catch (err) {
    console.error(err);
    alert("Error al registrar transacción.");
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
