document.addEventListener("DOMContentLoaded", () => {
  const abreviacionInput = document.getElementById("abreviacion");
  const urlBanderaInput = document.getElementById("url-bandera");
  const fraccionableCheckbox = document.getElementById("fraccionable");
  const seccionDenominaciones = document.getElementById("seccion-denominaciones");

  // Actualizar URL automáticamente al escribir la abreviación
  abreviacionInput.addEventListener("input", () => {
    const abrev = abreviacionInput.value.trim().toLowerCase();
    if (abrev.length === 2) {
      urlBanderaInput.value = `https://cambiosorion.cl/orionapp/node_modules/circle-flags/flags/${abrev}.svg`;
    } else {
      urlBanderaInput.value = "";
    }
  });

  // Mostrar/ocultar sección de denominaciones
  fraccionableCheckbox.addEventListener("change", () => {
    seccionDenominaciones.classList.toggle("hidden", !fraccionableCheckbox.checked);
  });

  // Enviar formulario
  document.getElementById("form-nueva-divisa").addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = {
      id: idGeneradoInput.value,
      nombre: document.getElementById("nombre").value.trim(),
      abreviacion: abreviacionInput.value.trim().toUpperCase(),
      pais: document.getElementById("pais").value.trim(),
      url_bandera: urlBanderaInput.value,
      fraccionable: fraccionableCheckbox.checked,
      denominaciones: document.getElementById("denominaciones").value.trim(),
    };

    try {
      const res = await fetch("https://cambiosorion.cl/data/guardar-divisa.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Error al guardar divisa");

      alert("Divisa guardada exitosamente");
      location.reload();
    } catch (err) {
      console.error(err);
      alert("Hubo un problema al guardar la divisa.");
    }
  });
});