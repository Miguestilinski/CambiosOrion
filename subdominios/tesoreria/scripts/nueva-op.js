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
const divisaContainer = document.getElementById("divisas-container");
const totalSpan = document.getElementById("total-operacion");

document.getElementById("agregar-divisa").addEventListener("click", () => {
  agregarDivisa();
});

function agregarDivisa() {
    const plantilla = document.querySelector(".divisa-item");
    const nuevaDivisa = plantilla.cloneNode(true);
    nuevaDivisa.classList.remove("hidden");

    // Limpiar valores
    nuevaDivisa.querySelector(".divisa-nombre").value = "";
    nuevaDivisa.querySelector(".divisa-monto").value = "";
    nuevaDivisa.querySelector(".divisa-tasa").value = "";
    nuevaDivisa.querySelector(".divisa-subtotal").textContent = "Subtotal: $0.00";

    // Añadir eventos
    const montoInput = nuevaDivisa.querySelector(".divisa-monto");
    const tasaInput = nuevaDivisa.querySelector(".divisa-tasa");
    const subtotalSpan = nuevaDivisa.querySelector(".divisa-subtotal");

    function calcularSubtotal() {
        const monto = parseFloat(montoInput.value) || 0;
        const tasa = parseFloat(tasaInput.value) || 0;
        const subtotal = monto * tasa;
        subtotalSpan.textContent = `Subtotal: $${subtotal.toFixed(2)}`;
        calcularTotal();
    }

    montoInput.addEventListener("input", calcularSubtotal);
    tasaInput.addEventListener("input", calcularSubtotal);

    nuevaDivisa.querySelector(".eliminar-divisa").addEventListener("click", () => {
        nuevaDivisa.remove();
        calcularTotal();
    });

    // Autocompletar divisa
    const divisaInput = nuevaDivisa.querySelector(".divisa-nombre");
    const sugerenciasUl = nuevaDivisa.querySelector(".divisa-sugerencias");

    divisaInput.addEventListener("input", async (e) => {
        const query = e.target.value.trim();
        if (query.length < 1) {
        sugerenciasUl.classList.add("hidden");
        return;
        }
        try {
        const res = await fetch(`https://cambiosorion.cl/data/nueva-op.php?buscar_divisa=${encodeURIComponent(query)}`);
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

    document.getElementById("divisas-container").appendChild(nuevaDivisa);
    }
  

function calcularTotal() {
    let total = 0;
    document.querySelectorAll(".divisa-item").forEach(item => {
        const subtotalText = item.querySelector(".divisa-subtotal").textContent.replace(/[^0-9.]/g, "");
        const subtotal = parseFloat(subtotalText) || 0;
        total += subtotal;
    });
    document.getElementById("total-operacion").textContent = total.toFixed(2);
}
    

// Inicializar con una divisa por defecto
agregarDivisa();
