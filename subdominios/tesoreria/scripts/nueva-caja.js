document.addEventListener("DOMContentLoaded", () => {
  const tablaDivisas = document.getElementById("tabla-divisas");
  const contador = document.getElementById("contador-divisas");
  const checkTodas = document.getElementById("check-todas-divisas");
  const formCaja = document.getElementById("form-nueva-caja");

  // Botón para mostrar/ocultar tabla
  const botonAgregar = document.createElement("button");
  botonAgregar.innerText = "Agregar Divisas";
  botonAgregar.type = "button";
  botonAgregar.className = "mb-4 bg-green-700 hover:bg-green-800 text-white font-medium rounded-lg text-sm px-4 py-2";
  tablaDivisas.closest("div").insertBefore(botonAgregar, tablaDivisas.closest("div").firstChild);

  const tablaContainer = tablaDivisas.closest("div");
  tablaContainer.classList.add("hidden");

  botonAgregar.addEventListener("click", () => {
    tablaContainer.classList.toggle("hidden");
    botonAgregar.innerText = tablaContainer.classList.contains("hidden") ? "Agregar Divisas" : "Ocultar Divisas";
  });

    let divisas = [];

    cargarDivisas();

    function cargarDivisas() {
    fetch("https://cambiosorion.cl/data/nueva-caja.php", {
        method: "GET"
    })
        .then(res => res.json())
        .then(data => {
        if (data.error) {
            console.log("Error al cargar divisas: " + data.error);
            return;
        }
        divisas = data.divisas || [];
        mostrarDivisas();
        })
        .catch(err => {
        console.error("Error al obtener divisas:", err);
        });
    }

  // Cargar tabla
  function mostrarDivisas() {
    tablaDivisas.innerHTML = divisas.map(divisa => `
      <tr>
        <td class="px-4 py-2"><input type="checkbox" class="check-divisa" data-id="${divisa.codigo}" /></td>
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

      // Si se desmarca una, desactiva el check de "todas"
      if (!e.target.checked) checkTodas.checked = false;

      // Si se marcan todas individualmente, marcar "todas"
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
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify({
        nombre,
        tipo: tipoCaja,
        divisas: seleccionadas
    })
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
    }
    })
    .catch(err => {
    console.error("Error al enviar datos:", err);
    alert("Error inesperado al crear la caja.");
    });

    formCaja.reset();
    actualizarContador();
    checkTodas.checked = false;
  });

});