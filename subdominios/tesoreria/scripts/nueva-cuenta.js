const clienteInput = document.getElementById("cliente");
const resultadoClientes = document.getElementById("resultado-clientes");
const divisaInput = document.getElementById("divisa");
const resultadoDivisas = document.getElementById("resultado-divisas");
let clienteSeleccionado = null;
let divisaSeleccionada = null;

// Buscar cliente
clienteInput.addEventListener("input", async (e) => {
  const query = e.target.value.trim();
  if (query.length < 2) {
    resultadoClientes.classList.add("hidden");
    return;
  }

  const res = await fetch(
    `https://cambiosorion.cl/data/nueva-cuenta.php?buscar_cliente=${encodeURIComponent(
      query
    )}`
  );

  // Verificar si la respuesta es válida
  if (!res.ok) {
    console.error('Error al buscar cliente', res.statusText);
    return;
  }

  try {
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
    console.error("Error al procesar la respuesta de los clientes", error);
  }
});

// Buscar divisa
divisaInput.addEventListener("input", async (e) => {
  const query = e.target.value.trim();
  if (query.length < 1) {
    resultadoDivisas.classList.add("hidden");
    return;
  }

  const res = await fetch(
    `https://cambiosorion.cl/data/nueva-cuenta.php?buscar_divisa=${encodeURIComponent(
      query
    )}`
  );

  // Verificar si la respuesta es válida
  if (!res.ok) {
    console.error('Error al buscar divisa', res.statusText);
    return;
  }

  try {
    const divisas = await res.json();
    resultadoDivisas.innerHTML = "";
    divisas.forEach((divisa) => {
      const li = document.createElement("li");
      li.textContent = divisa.nombre;
      li.classList.add("px-2", "py-1", "hover:bg-gray-200", "cursor-pointer");
      li.addEventListener("click", () => {
        divisaInput.value = divisa.nombre;
        divisaSeleccionada = divisa;
        resultadoDivisas.classList.add("hidden");
      });
      resultadoDivisas.appendChild(li);
    });
    resultadoDivisas.classList.remove("hidden");
  } catch (error) {
    console.error("Error al procesar la respuesta de las divisas", error);
  }
});

// Cerrar dropdown al clickear fuera
document.addEventListener("click", (e) => {
  if (!clienteInput.contains(e.target) && !resultadoClientes.contains(e.target)) {
    resultadoClientes.classList.add("hidden");
  }
  if (!divisaInput.contains(e.target) && !resultadoDivisas.contains(e.target)) {
    resultadoDivisas.classList.add("hidden");
  }
});

// Enviar formulario
document.getElementById("form-nueva-cuenta").addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!clienteSeleccionado || !divisaSeleccionada) {
    alert("Debes seleccionar un cliente y una divisa.");
    return;
  }

  const body = {
    cliente_id: clienteSeleccionado.id,
    divisa_id: divisaSeleccionada.id,
  };

  try {
    const res = await fetch("https://cambiosorion.cl/data/nueva-cuenta.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    // Verificar si la respuesta es válida
    if (!res.ok) {
      throw new Error('Error al crear la cuenta: ' + res.statusText);
    }

    const data = await res.json();

    if (data.success) {
      alert(`Cuenta creada exitosamente: ${data.cuenta_id}`);
      // Reset
      clienteInput.value = "";
      divisaInput.value = "";
      clienteSeleccionado = null;
      divisaSeleccionada = null;
    } else {
      alert(data.error || "Error al crear la cuenta.");
    }
  } catch (error) {
    alert("Error de conexión con el servidor.");
    console.error(error);
  }
});
