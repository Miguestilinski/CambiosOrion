document.addEventListener("DOMContentLoaded", () => {
  const cajaSelect = document.getElementById("caja");
  const clienteInput = document.getElementById("cliente");
  const resultadoClientes = document.getElementById("resultado-clientes");
  const cuentaClienteInput = document.getElementById("cuenta-cliente");
  const resultadoCuentas = document.getElementById("resultado-cuentas");
  const divisasContainer = document.getElementById("divisas-container");
  const form = document.getElementById("form-nuevo-ingreso");

  // Cargar cajas activas
  async function cargarCajas() {
    try {
      const res = await fetch("https://cambiosorion.cl/data/nuevo-ing.php?buscar_cajas=1");
      const cajas = await res.json();
      cajaSelect.innerHTML = '<option value="">Seleccione una caja</option>';
      cajas.forEach(caja => {
        const option = document.createElement("option");
        option.value = caja.id;
        option.textContent = caja.nombre;
        cajaSelect.appendChild(option);
      });
    } catch (error) {
      console.error("Error cargando cajas:", error);
      cajaSelect.innerHTML = '<option value="">Error cargando cajas</option>';
    }
  }
  cargarCajas();

  // Buscar clientes
  let clienteTimeout;
  clienteInput.addEventListener("input", () => {
    clearTimeout(clienteTimeout);
    const query = clienteInput.value.trim();
    if (query.length < 2) {
      resultadoClientes.classList.add("hidden");
      return;
    }
    clienteTimeout = setTimeout(async () => {
      try {
        const res = await fetch(`https://cambiosorion.cl/data/nuevo-ing.php?buscar_cliente=${encodeURIComponent(query)}`);
        const clientes = await res.json();
        resultadoClientes.innerHTML = "";
        if (clientes.length === 0) {
          resultadoClientes.innerHTML = "<li class='p-2'>No hay resultados</li>";
        } else {
          clientes.forEach(c => {
            const li = document.createElement("li");
            li.textContent = c.nombre;
            li.dataset.id = c.id;
            li.classList.add("p-2", "cursor-pointer", "hover:bg-gray-200");
            li.addEventListener("click", () => {
              clienteInput.value = c.nombre;
              clienteInput.dataset.id = c.id; // Guardar id del cliente
              resultadoClientes.classList.add("hidden");
              cargarCuentasCliente(c.id);
            });
            resultadoClientes.appendChild(li);
          });
        }
        resultadoClientes.classList.remove("hidden");
      } catch (error) {
        console.error("Error buscando clientes:", error);
      }
    }, 300);
  });

  // Cargar cuentas del cliente seleccionado
  async function cargarCuentasCliente(clienteId) {
    try {
      const res = await fetch(`https://cambiosorion.cl/data/nuevo-ing.php?cliente_id=${clienteId}`);
      const cuentas = await res.json();
      resultadoCuentas.innerHTML = "";
      cuentaClienteInput.value = "";
      cuentaClienteInput.dataset.id = "";
      if (cuentas.length === 0) {
        resultadoCuentas.innerHTML = "<li class='p-2'>No hay cuentas activas para este cliente</li>";
        resultadoCuentas.classList.remove("hidden");
        return;
      }
      cuentas.forEach(cuenta => {
        const li = document.createElement("li");
        li.textContent = `Cuenta #${cuenta.id} - Divisa: ${cuenta.divisa_id} - Debo: ${cuenta.debo}`;
        li.dataset.id = cuenta.id;
        li.classList.add("p-2", "cursor-pointer", "hover:bg-gray-200");
        li.addEventListener("click", () => {
          cuentaClienteInput.value = li.textContent;
          cuentaClienteInput.dataset.id = cuenta.id;
          resultadoCuentas.classList.add("hidden");
        });
        resultadoCuentas.appendChild(li);
      });
      resultadoCuentas.classList.remove("hidden");
    } catch (error) {
      console.error("Error cargando cuentas cliente:", error);
    }
  }

  // Sugerencias para cuenta cliente
  cuentaClienteInput.addEventListener("input", () => {
    // Si quieres, podrías implementar búsqueda en cuentas aquí,
    // pero en este diseño sólo se permite seleccionar de la lista cargada.
    resultadoCuentas.classList.add("hidden");
  });

  // Manejo de búsqueda de divisas en cada input de divisa-nombre
  divisasContainer.addEventListener("input", async (e) => {
    if (!e.target.classList.contains("divisa-nombre")) return;

    const inputDivisa = e.target;
    const query = inputDivisa.value.trim();
    const sugerenciasList = inputDivisa.nextElementSibling; // ul.divisa-sugerencias

    if (query.length < 2) {
      sugerenciasList.classList.add("hidden");
      sugerenciasList.innerHTML = "";
      return;
    }

    try {
      const res = await fetch(`https://cambiosorion.cl/data/nuevo-ing.php?buscar_divisa=${encodeURIComponent(query)}`);
      const divisas = await res.json();
      sugerenciasList.innerHTML = "";
      if (divisas.length === 0) {
        sugerenciasList.innerHTML = "<li class='p-2'>No hay resultados</li>";
      } else {
        divisas.forEach(divisa => {
          const li = document.createElement("li");
          li.textContent = divisa.nombre;
          li.dataset.id = divisa.id;
          li.classList.add("p-2", "cursor-pointer", "hover:bg-gray-200");
          li.addEventListener("click", () => {
            inputDivisa.value = divisa.nombre;
            inputDivisa.dataset.id = divisa.id; // Guardar id
            sugerenciasList.classList.add("hidden");
          });
          sugerenciasList.appendChild(li);
        });
      }
      sugerenciasList.classList.remove("hidden");
    } catch (error) {
      console.error("Error buscando divisas:", error);
    }
  });

  // Ocultar sugerencias al hacer click afuera
  document.addEventListener("click", (e) => {
    if (!clienteInput.contains(e.target)) {
      resultadoClientes.classList.add("hidden");
    }
    if (!cuentaClienteInput.contains(e.target)) {
      resultadoCuentas.classList.add("hidden");
    }
    divisasContainer.querySelectorAll(".divisa-sugerencias").forEach(ul => {
      if (!ul.previousElementSibling.contains(e.target)) {
        ul.classList.add("hidden");
      }
    });
  });

  // Manejar submit del formulario
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const operacion_id = 0; // Puedes cambiar esto o agregar un input oculto si se necesita
    const tipo_ingreso = document.getElementById("tipo-transaccion").value;
    const cliente_id = clienteInput.dataset.id;
    const caja_id = cajaSelect.value;
    const cuenta_id = cuentaClienteInput.dataset.id;
    const divisaItems = form.querySelectorAll(".divisa-item:not(.hidden)");

    if (!cliente_id) {
      alert("Debe seleccionar un cliente válido.");
      return;
    }
    if (!cuenta_id) {
      alert("Debe seleccionar una cuenta cliente válida.");
      return;
    }
    if (!caja_id) {
      alert("Debe seleccionar una caja.");
      return;
    }
    if (divisaItems.length === 0) {
      alert("Debe agregar al menos una divisa con monto.");
      return;
    }

    // Por ahora vamos a enviar sólo la primera divisa con monto (puedes extender para enviar varios ingresos)
    // Busca la primera divisa que tenga monto > 0 y un divisa_id válido
    let divisa_id = null;
    let monto = null;

    for (const divisaItem of divisaItems) {
      const nombreInput = divisaItem.querySelector(".divisa-nombre");
      const montoInput = divisaItem.querySelector(".divisa-monto");
      const nombreDivisaId = nombreInput.dataset.id;
      const montoVal = parseFloat(montoInput.value);
      if (nombreDivisaId && !isNaN(montoVal) && montoVal > 0) {
        divisa_id = nombreDivisaId;
        monto = montoVal;
        break;
      }
    }

    if (!divisa_id || !monto) {
      alert("Debe ingresar una divisa válida con monto mayor a 0.");
      return;
    }

    // Preparar datos para enviar
    const payload = {
      operacion_id,
      tipo_ingreso,
      cliente_id,
      caja_id,
      cuenta_id,
      divisa_id,
      monto,
    };

    try {
      const res = await fetch("https://cambiosorion.cl/data/nuevo-ing.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        form.reset();
        // Limpiar IDs guardados
        clienteInput.dataset.id = "";
        cuentaClienteInput.dataset.id = "";
        // Podrías recargar las cajas o divisas si quieres
      } else {
        alert("Error: " + data.message);
      }
    } catch (error) {
      console.error("Error enviando formulario:", error);
      alert("Error al enviar el ingreso.");
    }
  });
});
