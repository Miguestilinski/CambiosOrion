document.addEventListener("DOMContentLoaded", () => {
  const cajaSelect = document.getElementById("caja");
  const clienteInput = document.getElementById("cliente");
  const resultadoClientes = document.getElementById("resultado-clientes");
  const cuentaClienteInput = document.getElementById("cuenta-cliente");
  const divisasContainer = document.getElementById("divisas-container");
  const form = document.getElementById("form-nuevo-egreso");

  // Cargar cajas activas
  async function cargarCajas() {
    try {
      const res = await fetch("https://cambiosorion.cl/data/nuevo-egr.php?buscar_cajas=1");
      const cajas = await res.json();
      cajaSelect.innerHTML = '<option value="">Seleccione una caja</option>';
      cajas.forEach(c => {
        const opt = document.createElement("option");
        opt.value = c.id;
        opt.textContent = c.nombre;
        cajaSelect.appendChild(opt);
      });
    } catch (err) {
      console.error("Error cargando cajas:", err);
    }
  }
  cargarCajas();

  // Buscar clientes (igual que en nuevo-ing)
  let clienteTimeout;
  clienteInput.addEventListener("input", () => {
    clearTimeout(clienteTimeout);
    const query = clienteInput.value.trim();
    if (query.length < 2) {
      resultadoClientes.classList.add("hidden");
      return;
    }
    clienteTimeout = setTimeout(async () => {
      const res = await fetch(`https://cambiosorion.cl/data/nuevo-egr.php?buscar_cliente=${encodeURIComponent(query)}`);
      const clientes = await res.json();
      resultadoClientes.innerHTML = "";
      clientes.forEach(c => {
        const li = document.createElement("li");
        li.textContent = c.nombre;
        li.dataset.id = c.id;
        li.className = "p-2 cursor-pointer hover:bg-gray-200";
        li.addEventListener("click", () => {
          clienteInput.value = c.nombre;
          clienteInput.dataset.id = c.id;
          resultadoClientes.classList.add("hidden");
          cargarCuentasCliente(c.id);
        });
        resultadoClientes.appendChild(li);
      });
      resultadoClientes.classList.remove("hidden");
    }, 300);
  });

  async function cargarCuentasCliente(clienteId) {
    const res = await fetch(`https://cambiosorion.cl/data/nuevo-egr.php?cliente_id=${clienteId}`);
    const cuentas = await res.json();
    const selectCuenta = document.getElementById("cuenta-cliente");
    selectCuenta.innerHTML = "";
    if (cuentas.length === 0) {
      const opt = document.createElement("option");
      opt.textContent = "No hay cuentas activas";
      opt.disabled = true;
      selectCuenta.appendChild(opt);
      return;
    }
    cuentas.forEach(cuenta => {
      const opt = document.createElement("option");
      opt.value = cuenta.id;
      opt.textContent = `${cuenta.nombre_cliente} - ${cuenta.codigo_divisa}`;
      opt.dataset.nombreDivisa = cuenta.nombre_divisa;
      opt.dataset.saldo = cuenta.debo; // 👈 para mostrar saldo disponible
      selectCuenta.appendChild(opt);
    });
  }

  // Submit
  form.addEventListener("submit", async e => {
    e.preventDefault();
    const tipo_egreso = document.getElementById("tipo-transaccion").value;
    const cliente_id = clienteInput.dataset.id;
    const cuenta_id = cuentaClienteInput.dataset.id;
    const caja_id = cajaSelect.value || null;
    const divisaItem = divisasContainer.querySelector(".divisa-item:not(.hidden)");
    const divisa_id = divisaItem?.querySelector(".divisa-nombre").dataset.id;
    const monto = parseFloat(divisaItem?.querySelector(".divisa-monto").value || 0);
    const observaciones = document.getElementById("observaciones").value.trim();

    if (!cliente_id || !divisa_id || !monto) {
      alert("Complete todos los campos obligatorios.");
      return;
    }

    const payload = { tipo_egreso, cliente_id, cuenta_id, caja_id, divisa_id, monto, observaciones };

    try {
      const res = await fetch("https://cambiosorion.cl/data/nuevo-egr.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        form.reset();
      } else {
        alert("Error: " + data.error);
      }
    } catch (err) {
      console.error("Error enviando egreso:", err);
    }
  });
});
