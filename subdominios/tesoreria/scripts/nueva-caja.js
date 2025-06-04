document.addEventListener("DOMContentLoaded", () => {
  const tablaDivisas = document.getElementById("tabla-divisas");
  const contador = document.getElementById("contador-divisas");
  const checkTodas = document.getElementById("check-todas-divisas");
  const formCaja = document.getElementById("form-nueva-caja");

  const btnAgregarDivisas = document.getElementById("btn-agregar-divisas");
  const tablaContainer = document.getElementById("tabla-divisas-container");

  btnAgregarDivisas.addEventListener("click", () => {
    const isHidden = tablaContainer.classList.contains("hidden");
    if (isHidden) {
      tablaContainer.classList.remove("hidden");
      contadorContainer.classList.remove("hidden");
      btnAgregarDivisas.innerText = "Ocultar Divisas";
    } else {
      tablaContainer.classList.add("hidden");
      contadorContainer.classList.add("hidden");
      btnAgregarDivisas.innerText = "Agregar Divisas";
    }
  });

  let divisas = [];

  cargarDivisas();

  function cargarDivisas() {
    fetch("https://cambiosorion.cl/data/nueva-caja.php", {
        method: "GET"
    })
    .then(res => res.text())
    .then(text => {
        try {
            const data = JSON.parse(text);
            if (data.error) {
                console.error("Error al cargar divisas: " + data.error);
                return;
            }
            divisas = data.divisas || [];
            mostrarDivisas();
        } catch(e) {
            console.error("JSON inválido:", e);
        }
    })
    .catch(err => {
        console.error("Error al obtener divisas:", err);
    });
  }

  // Cargar tabla
  function mostrarDivisas() {
    tablaDivisas.querySelector("tbody").innerHTML = divisas.map(divisa => `
      <tr class="border-b bg-white border-gray-700 text-gray-700">
        <td class="px-4 py-2">
          <input type="checkbox" class="check-divisa rounded form-checkbox h-4 w-4 text-blue-600" data-id="${divisa.codigo}" />
        </td>
        <td class="px-4 py-2">${divisa.codigo}</td>
        <td class="px-4 py-2">${divisa.nombre}</td>
      </tr>
    `).join("");
    actualizarContador();
  }

  // Actualizar contador
  function actualizarContador() {
    const seleccionadas = document.querySelectorAll(".check-divisa:checked").length;
    contador.textContent = seleccionadas;
  }

  // Delegación para contar cada vez que se marque/desmarque
  tablaDivisas.addEventListener("change", (e) => {
    if (e.target.classList.contains("check-divisa")) {
      actualizarContador();

      if (!e.target.checked) checkTodas.checked = false;

      const total = document.querySelectorAll(".check-divisa").length;
      const marcadas = document.querySelectorAll(".check-divisa:checked").length;
      if (total === marcadas) checkTodas.checked = true;
    }
  });

  // Checkbox maestro
  checkTodas.addEventListener("change", () => {
    const checkboxes = document.querySelectorAll(".check-divisa");
    checkboxes.forEach(cb => cb.checked = checkTodas.checked);
    actualizarContador();
  });

  // Envío del formulario
  formCaja.addEventListener("submit", (e) => {
    e.preventDefault();

    const tipoCaja = document.getElementById("tipo-caja").value;
    const nombre = document.getElementById("nombre").value.trim();
    const seleccionadas = Array.from(document.querySelectorAll(".check-divisa:checked"))
                              .map(cb => cb.dataset.id);

    if (!nombre) {
      alert("Debes ingresar un nombre para la caja.");
      return;
    }

    if (seleccionadas.length === 0) {
      alert("Debes seleccionar al menos una divisa.");
      return;
    }

    fetch("https://cambiosorion.cl/data/nueva-caja.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, tipo: tipoCaja, divisas: seleccionadas })
    })
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        alert("Error: " + data.error);
      } else {
        alert("Caja creada correctamente con ID: " + data.caja_id);
        formCaja.reset();
        actualizarContador();
        checkTodas.checked = false;
        // Opcional: ocultar tabla y contador después de crear la caja
        tablaContainer.classList.add("hidden");
        contadorContainer.classList.add("hidden");
        btnAgregarDivisas.innerText = "Agregar Divisas";
      }
    })
    .catch(err => {
      console.error("Error al enviar datos:", err);
      alert("Error inesperado al crear la caja.");
    });
  });
});