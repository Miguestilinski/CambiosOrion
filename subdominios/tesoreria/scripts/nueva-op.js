let clienteSeleccionado = null;

// Autocompletado cliente
const clienteInput = document.getElementById("cliente");
const resultadoClientes = document.getElementById("resultado-clientes");

clienteInput.addEventListener("input", async (e) => {
  const query = e.target.value.trim();
  if (query.length < 2) {
    resultadoClientes.classList.add("hidden");
    return;
  }

  try {
    const res = await fetch(`https://cambiosorion.cl/data/nueva-op.php?buscar_cliente=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error("Error al buscar cliente");
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
    alert("Hubo un problema buscando clientes.");
  }
});

document.addEventListener("click", (e) => {
  if (!clienteInput.contains(e.target) && !resultadoClientes.contains(e.target)) {
    resultadoClientes.classList.add("hidden");
  }
});

// Manejo de divisas
let divisaIndex = 0;
const divisaContainer = document.getElementById("divisa-container");
const totalSpan = document.getElementById("total-operacion");

document.getElementById("agregar-divisa").addEventListener("click", () => {
  agregarDivisa();
});

function agregarDivisa() {
  const index = divisaIndex++;

  const wrapper = document.createElement("div");
  wrapper.className = "grid grid-cols-6 gap-2 items-end mb-4";
  wrapper.dataset.index = index;

  wrapper.innerHTML = `
    <div class="col-span-2">
      <label class="block text-sm text-white">Divisa</label>
      <input type="text" class="divisa-input block w-full px-2 py-1.5 rounded-lg bg-white border border-gray-600 text-gray-700" placeholder="Buscar divisa" data-index="${index}" />
      <ul class="divisa-sugerencias bg-white border border-gray-600 text-gray-700 rounded-lg mt-1 hidden" data-index="${index}"></ul>
    </div>
    <div>
      <label class="block text-sm text-white">Monto</label>
      <input type="number" step="any" class="monto-input block w-full px-2 py-1.5 rounded-lg bg-white border border-gray-600 text-gray-700" />
    </div>
    <div>
      <label class="block text-sm text-white">Tasa</label>
      <input type="number" step="any" class="tasa-input block w-full px-2 py-1.5 rounded-lg bg-white border border-gray-600 text-gray-700" />
    </div>
    <div>
      <label class="block text-sm text-white">Subtotal</label>
      <input type="text" class="subtotal-input block w-full px-2 py-1.5 rounded-lg bg-gray-100 border border-gray-600 text-gray-700" readonly />
    </div>
    <div>
      <button type="button" class="eliminar-divisa text-sm text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded">Eliminar</button>
    </div>
  `;

  divisaContainer.appendChild(wrapper);

  const montoInput = wrapper.querySelector(".monto-input");
  const tasaInput = wrapper.querySelector(".tasa-input");
  const subtotalInput = wrapper.querySelector(".subtotal-input");

  function calcularSubtotal() {
    const monto = parseFloat(montoInput.value) || 0;
    const tasa = parseFloat(tasaInput.value) || 0;
    const subtotal = monto * tasa;
    subtotalInput.value = subtotal.toFixed(2);
    calcularTotal();
  }

  montoInput.addEventListener("input", calcularSubtotal);
  tasaInput.addEventListener("input", calcularSubtotal);

  // eliminar divisa
  wrapper.querySelector(".eliminar-divisa").addEventListener("click", () => {
    wrapper.remove();
    calcularTotal();
  });

  // autocompletar divisa
  const divisaInput = wrapper.querySelector(".divisa-input");
  const sugerenciasUl = wrapper.querySelector(".divisa-sugerencias");

  divisaInput.addEventListener("input", async (e) => {
    const query = e.target.value.trim();
    if (query.length < 1) {
      sugerenciasUl.classList.add("hidden");
      return;
    }
    try {
      const res = await fetch(`https://cambiosorion.cl/data/nueva-cuenta.php?buscar_divisa=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error("Error buscando divisa");
      const divisas = await res.json();
      sugerenciasUl.innerHTML = "";
      divisas.forEach((divisa) => {
        const li = document.createElement("li");
        li.textContent = divisa.nombre;
        li.classList.add("px-2", "py-1", "hover:bg-gray-200", "cursor-pointer");
        li.addEventListener("click", () => {
          divisaInput.value = divisa.nombre;
          sugerenciasUl.classList.add("hidden");
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
}

function calcularTotal() {
  let total = 0;
  document.querySelectorAll(".subtotal-input").forEach((input) => {
    const val = parseFloat(input.value);
    if (!isNaN(val)) total += val;
  });
  totalSpan.textContent = total.toFixed(2);
}

// Inicializar con una divisa por defecto
agregarDivisa();
