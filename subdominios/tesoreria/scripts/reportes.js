document.addEventListener("DOMContentLoaded", () => {
  const periodoRadios = Array.from(document.querySelectorAll('input[name="filtro-periodo"]'));
  const diaInput = document.getElementById("dia");
  const mesInput = document.getElementById("mes");
  const añoInput = document.getElementById("año");
  const nPeriodosInput = document.getElementById("n-periodos");

  const inputsPorPeriodo = {
    dia: ["dia", "mes", "año"],
    mes: ["mes", "año"],
    trimestre: ["trimestre", "año"],
    año: ["año"]
  };

  // Crear input de trimestre si no existe
  let trimestreInput = document.getElementById("trimestre");
  if (!trimestreInput) {
    const contenedor = document.createElement("div");
    contenedor.innerHTML = `
      <label for="trimestre" class="block mb-1 text-sm text-white">Trimestre</label>
      <select id="trimestre" class="block w-full px-2 py-2.5 text-sm rounded-lg bg-white border border-gray-600 text-gray-700">
        <option value="1">1</option>
        <option value="2">2</option>
        <option value="3">3</option>
        <option value="4">4</option>
      </select>
    `;
    contenedor.className = "trimestre-wrapper hidden";

    const gridContainer = document.querySelector(".grid");
    const añoWrapper = añoInput.closest("div");
    gridContainer.insertBefore(contenedor, añoWrapper);
    trimestreInput = document.getElementById("trimestre");
  }

  const todosLosInputs = {
    dia: diaInput,
    mes: mesInput,
    año: añoInput,
    trimestre: trimestreInput
  };

  function getPeriodoSeleccionado() {
    const seleccionado = periodoRadios.find(radio => radio.checked);
    return seleccionado ? seleccionado.value : "dia";
  }

  function actualizarVisibilidadInputs() {
    const seleccionado = getPeriodoSeleccionado();
    const activos = inputsPorPeriodo[seleccionado];

    Object.entries(todosLosInputs).forEach(([key, input]) => {
      if (!input) return;
      const wrapper = input.closest("div");
      if (activos.includes(key)) {
        wrapper.classList.remove("hidden");
      } else {
        wrapper.classList.add("hidden");
      }
    });
  }

  periodoRadios.forEach(radio => {
    radio.addEventListener("change", actualizarVisibilidadInputs);
  });

  actualizarVisibilidadInputs();
});
