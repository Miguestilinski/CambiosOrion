document.addEventListener("DOMContentLoaded", () => {
  const urlBanderaInput = document.getElementById("url-bandera");
  const fraccionableCheckbox = document.getElementById("fraccionable");
  const seccionDenominaciones = document.getElementById("seccion-denominaciones");

  // Mostrar/ocultar sección de denominaciones
  fraccionableCheckbox.addEventListener("change", () => {
    seccionDenominaciones.classList.toggle("hidden", !fraccionableCheckbox.checked);
  });

  // Enviar formulario
  document.getElementById("form-nueva-divisa").addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = {
      nombre: document.getElementById("nombre").value.trim(),
      tipo_divisa: document.getElementById("tipo-divisa").value,
      pais: document.getElementById("pais").value.trim(),
      codigo: document.getElementById("codigo").value.trim().toUpperCase(),
      simbolo: document.getElementById("simbolo").value.trim(),
      url_bandera: urlBanderaInput.value,
      fraccionable: fraccionableCheckbox.checked ? 1 : 0,
      denominaciones: document.getElementById("denominaciones").value.trim()
    };

    try {
      const res = await fetch("https://cambiosorion.cl/data/nueva-div.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (!res.ok || result.error) throw new Error(result.error || "Error al guardar divisa");

      alert("Divisa guardada exitosamente");
      location.reload();
    } catch (err) {
      console.error(err);
      alert("Hubo un problema al guardar la divisa: " + err.message);
    }
  });
});

document.addEventListener("DOMContentLoaded", async () => {
  const banderaSelector = document.getElementById("bandera-selector");
  const urlBanderaInput = document.getElementById("url-bandera");
  const iconoSeleccionado = document.getElementById("icono-seleccionado");

  try {
    const res = await fetch("https://cambiosorion.cl/data/nueva-div.php");
    const banderas = await res.json();

    if (!Array.isArray(banderas)) throw new Error("Respuesta inesperada del servidor");

    banderas.forEach(({ codigo, url }) => {
      const img = document.createElement("img");
      img.src = url;
      img.alt = codigo;
      img.className = "w-8 h-8 m-1 cursor-pointer rounded-full border border-gray-400 hover:border-blue-500";
      img.title = codigo;

      img.addEventListener("click", () => {
        // Remueve selección previa
        document.querySelectorAll("#bandera-selector img").forEach(img =>
          img.classList.remove("ring-2", "ring-blue-500")
        );

        // Marca esta bandera como seleccionada
        img.classList.add("ring-2", "ring-blue-500");
        urlBanderaInput.value = url;

        // Muestra la imagen seleccionada al lado del label
        iconoSeleccionado.src = url;
        iconoSeleccionado.classList.remove("hidden");
      });

      banderaSelector.appendChild(img);
    });

  } catch (err) {
    console.error("Error cargando banderas:", err);
    alert("No se pudieron cargar las banderas. Intenta más tarde.");
  }
});

document.getElementById("cancelar").addEventListener("click", () => {
  window.location.href = "https://tesoreria.cambiosorion.cl/divisas-int";
});