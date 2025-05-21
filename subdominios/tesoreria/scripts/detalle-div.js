document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  if (!id) {
    document.getElementById('info-divisa').innerHTML = "<p>ID de divisa no proporcionado.</p>";
    return;
  }

  fetch(`https://cambiosorion.cl/data/detalle-div.php?id=${id}`)
    .then(async res => {
      const text = await res.text();
      console.log("Respuesta cruda divisa:", text);
      return JSON.parse(text);
    })
    .then(data => {
      if (data.error) {
        document.getElementById("info-divisa").innerHTML = `<p>${data.error}</p>`;
        return;
      }

      const divisa = data.divisa;
      let divisaOriginal = { ...divisa };

      const infoHTML = `
        <div><span class="font-semibold text-gray-300">Nombre:</span> ${divisa.nombre}</div>
        <div><span class="font-semibold text-gray-300">Símbolo:</span> ${divisa.simbolo}</div>
        <div><span class="font-semibold text-gray-300">Código:</span> ${divisa.codigo}</div>
        <div><span class="font-semibold text-gray-300">País:</span> ${divisa.pais}</div>
        <div><span class="font-semibold text-gray-300">Estado:</span> 
          <span class="${divisa.estado === 'activo' ? 'text-green-500' : 'text-red-500'}">
            ${divisa.estado === 'habilitada' ? 'Habilitada' : 'Deshabilitada'}
          </span>
        </div>
      `;
      document.getElementById("info-divisa").innerHTML = infoHTML;

      document.getElementById("btn-editar").addEventListener("click", () => {
        const formHTML = `
          <div class="mb-3">
            <label for="input-nombre" class="text-gray-300">Nombre:</label>
            <input type="text" id="input-nombre" value="${divisa.nombre}" class="w-full p-2 rounded bg-white text-black" />
          </div>
          <div class="mb-3">
            <label for="input-simbolo" class="text-gray-300">Símbolo:</label>
            <input type="text" id="input-simbolo" value="${divisa.simbolo}" class="w-full p-2 rounded bg-white text-black" />
          </div>
          <div class="mb-3">
            <label for="input-codigo" class="text-gray-300">Código:</label>
            <input type="text" id="input-codigo" value="${divisa.codigo}" class="w-full p-2 rounded bg-white text-black" />
          </div>
          <div class="mb-3">
            <label for="input-pais" class="text-gray-300">País:</label>
            <input type="text" id="input-pais" value="${divisa.pais}" class="w-full p-2 rounded bg-white text-black" />
          </div>
          <div class="mb-3">
            <label for="input-estado" class="text-gray-300">Estado:</label>
            <select id="input-estado" class="w-full p-2 rounded bg-white text-black">
              <option value="habilitada" ${divisa.estado === 'habilitada' ? 'selected' : ''}>Habilitada</option>
              <option value="deshabilitada" ${divisa.estado === 'deshabilitada' ? 'selected' : ''}>Deshabilitada</option>
            </select>
          </div>
        `;
        document.getElementById("info-divisa").innerHTML = formHTML;
        document.getElementById("acciones-edicion").classList.remove("hidden");
      });

      document.getElementById("btn-cancelar").addEventListener("click", () => {
        const infoHTML = `
          <div><span class="font-semibold text-gray-300">Nombre:</span> ${divisaOriginal.nombre}</div>
          <div><span class="font-semibold text-gray-300">Símbolo:</span> ${divisaOriginal.simbolo}</div>
          <div><span class="font-semibold text-gray-300">Código:</span> ${divisaOriginal.codigo}</div>
          <div><span class="font-semibold text-gray-300">País:</span> ${divisaOriginal.pais}</div>
          <div><span class="font-semibold text-gray-300">Estado:</span> 
          <span class="${divisa.estado === 'activo' ? 'text-green-500' : 'text-red-500'}">
            ${divisaOriginal.estado === 'habilitada' ? 'Habilitada' : 'Deshabilitada'}
          </span>
          </div>
        `;
        document.getElementById("info-divisa").innerHTML = infoHTML;
        document.getElementById("acciones-edicion").classList.add("hidden");
      });

      document.getElementById("btn-guardar").addEventListener("click", () => {
        const datosActualizados = {
          id: divisaOriginal.id,
          nombre: document.getElementById("input-nombre").value,
          simbolo: document.getElementById("input-simbolo").value,
          codigo: document.getElementById("input-codigo").value,
          pais: document.getElementById("input-pais").value,
          estado: document.getElementById("input-estado").value,
        };

        fetch("https://cambiosorion.cl/data/detalle-div.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(datosActualizados),
        })
          .then(res => res.text())
          .then(text => {
            try {
              const response = JSON.parse(text);
              if (response.success) {
                alert("Divisa actualizada correctamente");
              } else {
                alert("Error: " + response.error);
              }
            } catch (error) {
              console.error("Error al parsear la respuesta JSON", error);
              alert("Hubo un error al procesar la respuesta del servidor");
              console.log("Respuesta cruda del servidor:", text);
            }
          })
          .catch(error => {
            console.error("Error de red o servidor", error);
            alert("Error al intentar guardar los datos");
          });
      });

      document.getElementById("btn-eliminar").addEventListener("click", () => {
        const confirmacion = confirm("¿Estás seguro que deseas eliminar esta divisa? Esta acción es permanente y no se podrán realizar más operaciones con ella.");
        if (!confirmacion) return;

        fetch(`https://cambiosorion.cl/data/detalle-div.php?id=${divisaOriginal.id}`, {
          method: "DELETE",
        })
          .then(res => res.text())
          .then(text => {
            try {
              const response = JSON.parse(text);
              if (response.success) {
                alert("Divisa eliminada correctamente.");
                window.location.href = "https://tesoreria.cambiosorion.cl/divisas-int"; // o redirigir a la lista de divisas
              } else {
                alert("Error al eliminar: " + response.error);
              }
            } catch (err) {
              alert("Error procesando la respuesta del servidor");
              console.error(err);
            }
          })
          .catch(err => {
            alert("Error de red o servidor");
            console.error(err);
          });
      });

    })
    .catch(err => {
      console.error(err);
      document.getElementById("info-divisa").innerHTML = "<p>Error al cargar la divisa.</p>";
    });
});
