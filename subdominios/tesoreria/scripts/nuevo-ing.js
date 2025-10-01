document.addEventListener("DOMContentLoaded", () => {
  const cajaSelect = document.getElementById("caja");
  const clienteInput = document.getElementById("cliente");
  const resultadoClientes = document.getElementById("resultado-clientes");
  const cuentaInput = document.getElementById("cuenta");
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
              // Resetear cuenta al cambiar cliente
              cuentaInput.value = "";
              cuentaInput.dataset.id = "";
              resultadoCuentas.innerHTML = "";
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

  // búsqueda de cuentas ===
  let cuentaTimeout;

  async function buscarCuentas(query) {
    const clienteId = clienteInput.dataset.id || "";

    let url = "";
    if (!query && clienteId) {
      url = `https://cambiosorion.cl/data/nuevo-ing.php?cliente_id=${clienteId}`;
    } else if (query) {
      url = `https://cambiosorion.cl/data/nuevo-ing.php?todas_cuentas=1`;
    } else {
      return [];
    }

    try {
      const res = await fetch(url);
      let cuentas = await res.json();

      if (query) {
        cuentas = cuentas.filter(c =>
          `${c.nombre_cliente || ''} ${c.codigo_divisa || ''}`
            .toLowerCase()
            .includes(query.toLowerCase())
        );
      }
      return cuentas;
    } catch (e) {
      console.error("Error buscando cuentas:", e);
      return [];
    }
  }

  function renderizarCuentas(cuentas) {
    resultadoCuentas.innerHTML = "";
    if (cuentas.length === 0) {
      resultadoCuentas.innerHTML = "<li class='p-2'>No hay resultados</li>";
    } else {
      cuentas.forEach(c => {
        const li = document.createElement("li");
        li.textContent = `${c.nombre_cliente || '—'} - ${c.codigo_divisa}`;
        li.classList.add("p-2","cursor-pointer","hover:bg-gray-200");
        li.addEventListener("click", () => {
          cuentaInput.value = `${c.nombre_cliente || '—'} - ${c.codigo_divisa}`;
          cuentaInput.dataset.id = c.id;
          cuentaInput.dataset.nombreDivisa = c.nombre_divisa;
          cuentaInput.dataset.deuda = c.me_deben || 0;
          resultadoCuentas.classList.add("hidden");
          actualizarDeuda();
          bloquearDivisa();
        });
        resultadoCuentas.appendChild(li);
      });
    }
    resultadoCuentas.classList.remove("hidden");
  }

  cuentaInput.addEventListener("focus", async () => {
    clearTimeout(cuentaTimeout);
    const query = cuentaInput.value.trim();
    const clienteId = clienteInput.dataset.id || "";

    // Si hay cliente seleccionado y no hay query => mostrar sus cuentas
    if (clienteId && query === "") {
      const res = await fetch(`https://cambiosorion.cl/data/nuevo-ing.php?cliente_id=${clienteId}`);
      const cuentas = await res.json();
      renderizarCuentas(cuentas);
      return;
    }

    if (query.length < 1) {
      resultadoCuentas.classList.add("hidden");
      return;
    }

    cuentaTimeout = setTimeout(async () => {
      const cuentas = await buscarCuentas(query);
      resultadoCuentas.innerHTML = "";

      if (cuentas.length === 0) {
        resultadoCuentas.innerHTML = "<li class='p-2'>No hay resultados</li>";
      } else {
        cuentas.forEach(c => {
          const li = document.createElement("li");
          li.textContent = `${c.nombre_cliente || '—'} - ${c.codigo_divisa}`;
          li.classList.add("p-2","cursor-pointer","hover:bg-gray-200");
          li.addEventListener("click", () => {
            cuentaInput.value = `${c.nombre_cliente || '—'} - ${c.codigo_divisa}`;
            cuentaInput.dataset.id = c.id;
            cuentaInput.dataset.nombreDivisa = c.nombre_divisa;
            cuentaInput.dataset.deuda = c.me_deben || 0;
            resultadoCuentas.classList.add("hidden");
            actualizarDeuda();
            bloquearDivisa();
          });
          resultadoCuentas.appendChild(li);
        });
      }
      resultadoCuentas.classList.remove("hidden");
    }, 300);
  });

  // Ocultar sugerencias al hacer click afuera
  document.addEventListener("click", (e) => {
    if (!clienteInput.contains(e.target) && !resultadoClientes.contains(e.target)) {
      resultadoClientes.classList.add("hidden");
    }
  });

  document.addEventListener("click", (e) => {
    if (!cuentaInput.contains(e.target) && !resultadoCuentas.contains(e.target)) {
      resultadoCuentas.classList.add("hidden");
    }
  });

  function actualizarDeuda() {
    const deuda = parseFloat(cuentaInput.dataset.deuda || 0);
    const nombreDivisa = cuentaInput.dataset.nombreDivisa || '';
    document.getElementById("deuda-actual").textContent =
      `Debe: ${deuda.toLocaleString()} ${nombreDivisa}`;
  }

  document.getElementById("monto-ingreso").addEventListener("input", () => {
    const deuda = parseFloat(cuentaInput.dataset.deuda || 0);
    const monto = parseFloat(document.getElementById("monto-ingreso").value || 0);
    const nombreDivisa = cuentaInput.dataset.nombreDivisa || '';
    document.getElementById("deuda-futura").textContent =
      `Deberá: ${(deuda - monto).toLocaleString()} ${nombreDivisa}`;
  });

  function bloquearDivisa() {
    const inputDivisa = divisasContainer.querySelector(".divisa-nombre");
    if (inputDivisa) {
      inputDivisa.value = cuentaInput.dataset.nombreDivisa || "";
      inputDivisa.readOnly = true;
      inputDivisa.classList.add("bg-gray-100", "cursor-not-allowed");
      inputDivisa.removeAttribute("data-id");
    }
  }

  // Manejar submit del formulario
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const operacion_id = 0; // Puedes cambiar esto o agregar un input oculto si se necesita
    const tipo_ingreso = document.getElementById("tipo-transaccion").value;
    const cliente_id = clienteInput.dataset.id;
    const caja_id = cajaSelect.value;
    const cuenta_id = cuentaInput.dataset.id;
    const divisaItems = form.querySelectorAll(".divisa-item:not(.hidden)");

    if (!cuenta_id) {
      alert("Debe seleccionar una cuenta válida.");
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
        cuentaInput.dataset.id = "";
        document.getElementById("deuda-actual").textContent = "Debe: —";
        document.getElementById("deuda-futura").textContent = "Deberá: —";
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
