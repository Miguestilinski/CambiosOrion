document.addEventListener("DOMContentLoaded", () => {
  const urlIconoInput = document.getElementById("url-icono");
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
      url_icono: urlIconoInput.value,
      fraccionable: fraccionableCheckbox.checked ? 1 : 0,
      denominaciones: document.getElementById("denominaciones").value.trim()
    };

    try {
      const endpoint = "https://cambiosorion.cl/data/nueva-div.php";
      console.log("Enviando datos a:", endpoint);

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const text = await res.text();
      console.log("Respuesta cruda del servidor:", text);

      let result;
      try {
        result = JSON.parse(text);
      } catch (e) {
        // Mostrar respuesta como HTML si no es JSON
        const nuevaVentana = window.open();
        nuevaVentana.document.write(text);
        nuevaVentana.document.close();
        throw new Error("La respuesta no es JSON válido. Se abrió en una nueva ventana.");
      }

      if (!res.ok || result.error) {
        throw new Error(result.error || "Error al guardar divisa");
      }

      console.log("Datos enviados correctamente:", data);
      alert("Divisa guardada exitosamente");
      location.reload();
    } catch (err) {
      console.error("Error en el envío:", err);
      alert("Hubo un problema al guardar la divisa: " + err.message);
    }
  });
});

document.addEventListener("DOMContentLoaded", async () => {
  const IconoSelector = document.getElementById("icono-selector");
  const urlIconoInput = document.getElementById("url-icono");
  const iconoSeleccionado = document.getElementById("icono-seleccionado");

  try {
    const res = await fetch("https://cambiosorion.cl/data/nueva-div.php");
    const iconos = await res.json();

    if (!Array.isArray(iconos)) throw new Error("Respuesta inesperada del servidor");

    iconos.forEach(({ codigo, url }) => {
      const img = document.createElement("img");
      img.src = url;
      img.alt = codigo;
      img.className = "w-8 h-8 m-1 cursor-pointer rounded-full border border-gray-400 hover:border-blue-500";
      img.title = codigo;

      img.addEventListener("click", () => {
        // Remueve selección previa
        document.querySelectorAll("#icono-selector img").forEach(img =>
          img.classList.remove("ring-2", "ring-blue-500")
        );

        // Marca esta bandera como seleccionada
        img.classList.add("ring-2", "ring-blue-500");
        urlIconoInput.value = url;

        // Muestra la imagen seleccionada al lado del label
        iconoSeleccionado.src = url;
        iconoSeleccionado.classList.remove("hidden");
      });

      IconoSelector.appendChild(img);
    });

  } catch (err) {
    console.error("Error cargando iconos:", err);
    alert("No se pudieron cargar los iconos. Intenta más tarde.");
  }
});

document.getElementById("cancelar").addEventListener("click", () => {
  window.location.href = "https://tesoreria.cambiosorion.cl/divisas-int";
});