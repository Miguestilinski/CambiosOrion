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
            const selectCuenta = document.getElementById("cuenta-cliente");
            selectCuenta.innerHTML = "";  // limpiar opciones

            if (cuentas.length === 0) {
            // Si quieres, puedes agregar una opción deshabilitada:
            const option = document.createElement("option");
            option.textContent = "No hay cuentas activas para este cliente";
            option.disabled = true;
            selectCuenta.appendChild(option);
            return;
            }

            cuentas.forEach(cuenta => {
            const option = document.createElement("option");
            option.value = cuenta.id; // id de la cuenta
            option.textContent = `${cuenta.nombre_cliente} - ${cuenta.codigo_divisa}`;
            selectCuenta.appendChild(option);
            });
            selectCuenta.addEventListener("change", () => {
                
            const selectedOption = selectCuenta.options[selectCuenta.selectedIndex];
            const selectedText = selectedOption.textContent;

            // Extraer código de divisa (asumiendo que está al final del texto)
            const codigoDivisa = selectedText.split(" - ").pop();

            // Buscar el input de divisa correspondiente (ajusta el selector si es necesario)
            const inputDivisa = divisasContainer.querySelector(".divisa-nombre");

            if (inputDivisa) {
                inputDivisa.value = codigoDivisa;
                inputDivisa.readOnly = true; // Desactiva edición
                inputDivisa.classList.add("bg-gray-100", "cursor-not-allowed"); // Opcional: estilo visual
                inputDivisa.removeAttribute("data-id"); // Limpiar ID previa si la hubo
            }

            // Oculta las sugerencias, por si quedaron visibles
            const sugerenciasList = inputDivisa?.nextElementSibling;
            if (sugerenciasList) sugerenciasList.classList.add("hidden");
            });
        } catch (error) {
            console.error("Error cargando cuentas cliente:", error);
        }
    }

  // Ocultar sugerencias al hacer click afuera
  document.addEventListener("click", (e) => {
    if (!clienteInput.contains(e.target)) {
      resultadoClientes.classList.add("hidden");
    }
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
