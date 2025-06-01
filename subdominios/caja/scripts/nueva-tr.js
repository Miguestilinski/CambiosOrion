document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("form-nueva-tr");
  const montoInput = document.getElementById("monto");
  const tasaInput = document.getElementById("tasa");
  const totalSpan = document.getElementById("total-transaccion");
  const cancelarBtn = document.getElementById("cancelar-transaccion");

  function actualizarTotal() {
    const monto = parseFloat(montoInput.value) || 0;
    const tasa = parseFloat(tasaInput.value) || 0;
    const total = monto * tasa;
    totalSpan.textContent = total.toFixed(2);
  }

  montoInput.addEventListener("input", actualizarTotal);
  tasaInput.addEventListener("input", actualizarTotal);

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const datos = {
      tipo_transaccion: document.getElementById("tipo-transaccion").value,
      tipo_documento: document.getElementById("tipo-documento").value,
      cliente: document.getElementById("cliente").value,
      email: document.getElementById("email").value,
      divisa: document.getElementById("divisa").value,
      tasa: parseFloat(tasaInput.value) || 0,
      monto: parseFloat(montoInput.value) || 0,
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
          alert("✅ Transacción registrada correctamente");
          form.reset();
          totalSpan.textContent = "0.00";
        } else {
          alert("❌ Error: " + respuesta.mensaje);
        }
      })
      .catch((error) => {
        console.error("Error al enviar:", error);
        alert("❌ Error al enviar los datos");
      });
  });

  cancelarBtn.addEventListener("click", function () {
    if (confirm("¿Seguro que quieres cancelar la transacción?")) {
      form.reset();
      totalSpan.textContent = "0.00";
    }
  });

    // Autocompletado para cliente
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
            clienteInput.value = cliente.id; // Guardamos el ID
            resultadoClientes.classList.add("hidden");
            });
            resultadoClientes.appendChild(li);
        });

        resultadoClientes.classList.remove("hidden");
        });
    });

    // Autocompletado para divisa
    const divisaInput = document.getElementById("divisa");
    const sugerenciasDivisas = document.getElementById("sugerencias-divisas");

    divisaInput.addEventListener("input", function () {
    const query = divisaInput.value.trim();
    if (query.length < 1) {
        sugerenciasDivisas.classList.add("hidden");
        return;
    }

    fetch(`https://cambiosorion.cl/data/nueva-tr.php?buscar_divisa=${encodeURIComponent(query)}`)
        .then((res) => res.json())
        .then((data) => {
        sugerenciasDivisas.innerHTML = "";
        if (data.length === 0) {
            sugerenciasDivisas.classList.add("hidden");
            return;
        }

        data.forEach((divisa) => {
            const li = document.createElement("li");
            li.textContent = divisa.nombre;
            li.dataset.id = divisa.id;
            li.classList.add("px-2", "py-1", "hover:bg-gray-200", "cursor-pointer");
            li.addEventListener("click", () => {
            divisaInput.value = divisa.id; // Guardamos el ID
            sugerenciasDivisas.classList.add("hidden");
            });
            sugerenciasDivisas.appendChild(li);
        });

        sugerenciasDivisas.classList.remove("hidden");
        });
    });

});
