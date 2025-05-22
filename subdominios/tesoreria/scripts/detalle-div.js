document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  if (!id) {
    document.getElementById('info-divisa').innerHTML = "<p>ID de divisa no proporcionado.</p>";
    return;
  }

  fetch(`https://cambiosorion.cl/data/detalle-div.php?id=${id}&_=${Date.now()}`)
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
      divisa.estado = Number(divisa.estado);
      let divisaOriginal = { ...divisa };
      const estadoTexto = (estado) => estado == 1 ? "habilitada" : "deshabilitada";

      const renderInfo = () => {
        const estadoStr = estadoTexto(Number(divisa.estado));
        const infoHTML = `
          <div><span class="font-semibold text-gray-300">Nombre:</span> ${divisa.nombre}</div>
          <div><span class="font-semibold text-gray-300">Símbolo:</span> ${divisa.simbolo}</div>
          <div><span class="font-semibold text-gray-300">Código:</span> ${divisa.codigo}</div>
          <div><span class="font-semibold text-gray-300">País:</span> ${divisa.pais}</div>
          <div><span class="font-semibold text-gray-300">Estado:</span> 
            <span class="${estadoStr === 'habilitada' ? 'text-green-500' : 'text-red-500'}">
              ${estadoStr.charAt(0).toUpperCase() + estadoStr.slice(1)}
            </span>
          </div>
        `;
        document.getElementById("info-divisa").innerHTML = infoHTML;
      };

      const btnToggleEstado = document.getElementById("btn-toggle-estado");
      const actualizarBotonEstado = () => {
        btnToggleEstado.textContent = divisa.estado == 1 ? "Deshabilitar" : "Habilitar";
        btnToggleEstado.classList.remove("bg-green-700", "bg-red-700", "bg-green-600");
        btnToggleEstado.classList.add(divisa.estado == 1 ? "bg-yellow-700" : "bg-green-700");
      };

      actualizarBotonEstado();

      btnToggleEstado.onclick = () => {
        const nuevoEstado = Number(divisa.estado) === 1 ? 0 : 1;

        fetch("https://cambiosorion.cl/data/detalle-div.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: divisa.id, estado: nuevoEstado })
        })
        .then(res => res.text())
        .then(text => {
          console.log("Respuesta cruda POST:", text);
          try {
            return JSON.parse(text);
          } catch(e) {
            console.error("Error JSON:", e);
            throw e;
          }
        })
        .then(response => {
          if (response.success) {
            divisa.estado = nuevoEstado;
            divisaOriginal.estado = nuevoEstado;

            console.log("Estado actual de divisa:", divisa.estado);

            renderInfo();
            actualizarBotonEstado();
          } else {
            alert("Error al cambiar el estado");
          }
        });
      };

      renderInfo();

      let modoEdicion = false;

      document.getElementById("btn-editar").addEventListener("click", () => {
        if (modoEdicion) {
          // Salir del modo edición
          divisa.nombre = divisaOriginal.nombre;
          divisa.simbolo = divisaOriginal.simbolo;
          divisa.codigo = divisaOriginal.codigo;
          divisa.pais = divisaOriginal.pais;

          renderInfo();
          document.getElementById("acciones-edicion").classList.add("hidden");
          document.getElementById("btn-editar").textContent = "Editar";
          modoEdicion = false;
        } else {
          // Entrar modo edición, sin el input estado
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
          `;
          document.getElementById("info-divisa").innerHTML = formHTML;
          document.getElementById("acciones-edicion").classList.remove("hidden");
          document.getElementById("btn-editar").textContent = "Cancelar edición";
          modoEdicion = true;
        }
      });

      document.getElementById("btn-cancelar").addEventListener("click", () => {
        renderInfo();
        document.getElementById("acciones-edicion").classList.add("hidden");
        document.getElementById("btn-editar").textContent = "Editar";
        modoEdicion = false;
      });

      document.getElementById("btn-guardar").addEventListener("click", () => {
        const datosActualizados = {
          id: divisaOriginal.id,
          nombre: document.getElementById("input-nombre").value,
          simbolo: document.getElementById("input-simbolo").value,
          codigo: document.getElementById("input-codigo").value,
          pais: document.getElementById("input-pais").value,
          // No enviamos estado aquí porque se maneja solo por el botón
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

                // Actualizar datos en divisaOriginal y divisa
                divisaOriginal = { ...divisaOriginal, ...datosActualizados };
                Object.assign(divisa, datosActualizados);

                renderInfo();
                document.getElementById("acciones-edicion").classList.add("hidden");
                document.getElementById("btn-editar").textContent = "Editar";
                modoEdicion = false;
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

      // Referencias a elementos del modal
      const btnEliminar = document.getElementById("btn-eliminar");
      const modal = document.getElementById("modal-confirmar-eliminacion");
      const btnCancelarModal = document.getElementById("cancelar-eliminacion");
      const btnConfirmarEliminar = document.getElementById("confirmar-eliminacion");

      // Mostrar modal
      btnEliminar.addEventListener("click", () => {
        modal.classList.remove("hidden");
      });

      // Cancelar eliminación
      btnCancelarModal.addEventListener("click", () => {
        modal.classList.add("hidden");
      });

      btnConfirmarEliminar.addEventListener("click", () => {

        fetch(`https://cambiosorion.cl/data/detalle-div.php?id=${divisaOriginal.id}`, {
          method: "DELETE",
        })
          .then(res => res.text())
          .then(text => {
            try {
              const response = JSON.parse(text);
              if (response.success) {
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