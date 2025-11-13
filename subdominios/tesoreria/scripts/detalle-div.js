document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const opsContenedor = document.getElementById("detalle-operaciones-divisa");
  const btnOperaciones = document.getElementById("btn-operaciones");

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
      const operaciones = data.operaciones || [];
      divisa.estado = Number(divisa.estado);
      let divisaOriginal = { ...divisa };
      const estadoTexto = (estado) => estado == 1 ? "habilitada" : "deshabilitada";

      const renderInfo = () => {
        const estadoStr = estadoTexto(Number(divisa.estado));
        const iconoImg = divisa.icono 
            ? `<img src="${divisa.icono}" alt="${divisa.nombre}" class="w-8 h-8 object-contain ml-2 inline-block">` 
            : '<span class="text-gray-500 italic ml-2">(Sin ícono)</span>';
        const infoHTML = `
          <div class="flex items-center mb-2">
             <span class="font-semibold text-gray-300 mr-2">Ícono:</span> 
             ${iconoImg}
          </div>
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

      document.getElementById("btn-editar").addEventListener("click", async () => {
        if (modoEdicion) {
          // Salir del modo edición
          divisa.nombre = divisaOriginal.nombre;
          divisa.simbolo = divisaOriginal.simbolo;
          divisa.codigo = divisaOriginal.codigo;
          divisa.pais = divisaOriginal.pais;
          divisa.icono = divisaOriginal.icono;

          renderInfo();
          document.getElementById("acciones-edicion").classList.add("hidden");
          document.getElementById("btn-editar").textContent = "Editar";
          modoEdicion = false;
        } else {
          // Entrar modo edición, sin el input estado
          const formHTML = `
            <div class="mb-4 col-span-2">
                <div class="flex items-center gap-2 mb-2">
                    <label class="text-gray-300">Icono:</label>
                    <img id="preview-icono-edit" src="${divisa.icono || ''}" class="w-8 h-8 rounded-full border border-gray-400 ${divisa.icono ? '' : 'hidden'}" alt="Seleccionado">
                </div>
                
                <div id="grid-iconos-container" class="grid grid-cols-8 gap-2 max-h-40 overflow-y-auto bg-white p-2 rounded-lg border border-gray-600">
                    <p class="col-span-8 text-center text-gray-500 text-xs">Cargando iconos...</p>
                </div>
                
                <input type="hidden" id="input-icono" value="${divisa.icono || ''}">
            </div>
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

          const gridContainer = document.getElementById("grid-iconos-container");
          const inputIcono = document.getElementById("input-icono");
          const previewIcono = document.getElementById("preview-icono-edit");

          try {
              // Llamamos al nuevo endpoint que creamos en el PHP
              const res = await fetch("https://cambiosorion.cl/data/detalle-div.php?get_icons=1");
              const iconos = await res.json();

              if (Array.isArray(iconos)) {
                  gridContainer.innerHTML = ""; // Limpiar mensaje de carga
                  
                  iconos.forEach(({ codigo, url }) => {
                      const img = document.createElement("img");
                      img.src = url;
                      img.alt = codigo;
                      img.title = codigo;
                      img.className = "w-8 h-8 cursor-pointer rounded-full border border-gray-300 hover:border-blue-500 hover:scale-110 transition-transform";
                      
                      // Marcar el actual si coincide
                      if (url === divisa.icono) {
                          img.classList.add("ring-2", "ring-blue-500");
                      }

                      img.addEventListener("click", () => {
                          // Quitar selección visual de otros
                          gridContainer.querySelectorAll("img").forEach(i => i.classList.remove("ring-2", "ring-blue-500"));
                          
                          // Seleccionar este
                          img.classList.add("ring-2", "ring-blue-500");
                          
                          // Actualizar input y preview
                          inputIcono.value = url;
                          previewIcono.src = url;
                          previewIcono.classList.remove("hidden");
                      });

                      gridContainer.appendChild(img);
                  });
              } else {
                  gridContainer.innerHTML = '<p class="col-span-8 text-red-500 text-xs">Error cargando iconos.</p>';
              }
          } catch (e) {
              console.error("Error fetch iconos:", e);
              gridContainer.innerHTML = '<p class="col-span-8 text-red-500 text-xs">Error de conexión.</p>';
          }
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

      // --- Lógica Operaciones (Igual que detalle-cta) ---
      btnOperaciones.addEventListener("click", () => {
        if (opsContenedor.classList.contains("hidden")) {
          if (operaciones.length === 0) {
             opsContenedor.innerHTML = '<p class="text-white p-4 bg-gray-800 rounded">No hay operaciones registradas con esta divisa.</p>';
          } else {
              const tablaHTML = `
                <table class="w-full text-sm text-left text-white bg-gray-800">
                  <thead class="text-xs uppercase bg-gray-800 text-white">
                    <tr>
                      <th class="px-4 py-2">Fecha</th>
                      <th class="px-4 py-2">ID Op</th>
                      <th class="px-4 py-2">Cliente</th> 
                      <th class="px-4 py-2">Tipo Doc</th>
                      <th class="px-4 py-2">Tipo Trans.</th>
                      <th class="px-4 py-2">Monto (${divisa.codigo})</th>
                      <th class="px-4 py-2">Tasa</th>
                      <th class="px-4 py-2">Total Op (CLP)</th>
                      <th class="px-4 py-2">Estado</th>
                      <th class="px-4 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                  ${operaciones.map(op => {
                      const colorFondo = op.tipo_transaccion === 'Compra'
                      ? 'style="background-color: #c3e8f1;"'
                      : op.tipo_transaccion === 'Venta'
                      ? 'style="background-color: #dbf599;"'
                      : '';
                      const colorAnulado = op.estado === 'Anulado'
                      ? 'style="background-color: #f9b8a3;"'
                      : colorFondo;

                      return `
                      <tr class="border-b bg-white border-gray-700 text-gray-700" ${colorAnulado}>
                          <td class="px-4 py-2">${formatearFecha(op.fecha)}</td>
                          <td class="px-4 py-2">${op.id}</td>
                          <td class="px-4 py-2">${op.nombre_cliente || 'N/A'}</td>
                          <td class="px-4 py-2">${op.tipo_documento || ''}</td>
                          <td class="px-4 py-2">${op.tipo_transaccion || ''}</td>
                          <td class="px-4 py-2 font-bold">${formatNumber(op.monto)}</td>
                          <td class="px-4 py-2">${formatNumber(op.tasa_cambio)}</td>
                          <td class="px-4 py-2">${formatNumber(op.total)}</td>
                          <td class="px-4 py-2">${op.estado || ''}</td>
                          <td class="px-4 py-2">
                          <a href="/detalle-op?id=${op.id}" class="text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-sm px-3 py-1">Mostrar</a>
                          </td>
                      </tr>
                      `;
                  }).join("")}
                  </tbody>
                </table>
              `;
              opsContenedor.innerHTML = tablaHTML;
          }
          opsContenedor.classList.remove("hidden");
          btnOperaciones.innerText = "Ocultar Operaciones";
        } else {
          opsContenedor.classList.add("hidden");
          btnOperaciones.innerText = "Ver Operaciones";
        }
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