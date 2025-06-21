document.addEventListener("DOMContentLoaded", () => {
  const periodoRadios = Array.from(document.querySelectorAll('input[name="filtro-periodo"]'));
  const diaWrapper = document.getElementById("dia").closest("div");
  const mesWrapper = document.getElementById("mes").closest("div");
  const añoWrapper = document.getElementById("año").closest("div");
  const trimestreWrapper = document.getElementById("trimestre-wrapper");
  const nPeriodosInput = document.getElementById("n-periodos");

  const inputsPorPeriodo = {
    dia: [diaWrapper, mesWrapper, añoWrapper],
    mes: [mesWrapper, añoWrapper],
    trimestre: [trimestreWrapper, añoWrapper],
    año: [añoWrapper]
  };

  function getPeriodoSeleccionado() {
    const seleccionado = periodoRadios.find(radio => radio.checked);
    return seleccionado ? seleccionado.value : "dia";
  }

  function actualizarVisibilidadInputs() {
    const seleccionado = getPeriodoSeleccionado();
    const activos = inputsPorPeriodo[seleccionado];

    // Primero ocultar todos
    [diaWrapper, mesWrapper, añoWrapper, trimestreWrapper].forEach(w => w.classList.add("hidden"));

    // Mostrar los activos
    activos.forEach(w => w.classList.remove("hidden"));
  }

  periodoRadios.forEach(radio => {
    radio.addEventListener("change", actualizarVisibilidadInputs);
  });

  actualizarVisibilidadInputs();
});
