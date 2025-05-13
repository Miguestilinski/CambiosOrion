document.addEventListener("DOMContentLoaded", () => {
  const abreviacionInput = document.getElementById("abreviacion");
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
      abreviacion: abreviacionInput.value.trim().toLowerCase(),
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

  try {
    const res = await fetch("https://cambiosorion.cl/data/nueva-div.php");
    const banderas = await res.json();

    if (!Array.isArray(banderas)) throw new Error("Respuesta inesperada del servidor");

    banderas.forEach(({ codigo, url }) => {
      const img = document.createElement("img");
      img.src = url;
      img.alt = codigo.toUpperCase();
      img.className = "w-8 h-8 cursor-pointer rounded-full border border-gray-400 hover:border-blue-500";
      img.title = codigo.toUpperCase();

      img.addEventListener("click", () => {
        document.querySelectorAll("#bandera-selector img").forEach(img => img.classList.remove("ring-2", "ring-blue-500"));
        img.classList.add("ring-2", "ring-blue-500");
        urlBanderaInput.value = url;
      });

      banderaSelector.appendChild(img);
    });

  } catch (err) {
    console.error("Error cargando banderas:", err);
    alert("No se pudieron cargar las banderas. Intenta más tarde.");
  }
});