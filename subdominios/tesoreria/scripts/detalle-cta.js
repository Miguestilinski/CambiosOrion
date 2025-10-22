document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
  
    const infoContenedor = document.getElementById("info-cuenta");
    const accionesEdicion = document.getElementById("acciones-edicion");
    const btnEditar = document.getElementById("btn-editar");
    const btnGuardar = document.getElementById("btn-guardar");
    const btnCancelar = document.getElementById("btn-cancelar");
    const btnOperaciones = document.getElementById("btn-operaciones");
    const opsContenedor = document.getElementById("detalle-operaciones-cuenta");

    if (!id) {
      infoContenedor.innerHTML = "<p>ID de cuenta no proporcionado.</p>";
      return;
    }
  
    let cuentaOriginal = {}; // Para guardar el estado original al editar

    // Función para formatear la fecha (copiada de tu script)
    const formatearFecha = (timestamp) => {
        if (!timestamp) return ''; 
        const fecha = new Date(timestamp);
        if (isNaN(fecha.getTime())) return timestamp;
        
        const hh = String(fecha.getHours()).padStart(2, '0');
        const min = String(fecha.getMinutes()).padStart(2, '0');
        const dd = String(fecha.getDate()).padStart(2, '0');
        const mm = String(fecha.getMonth() + 1).padStart(2, '0'); // +1
        const yyyy = fecha.getFullYear();
        
        return `${hh}:${min} ${dd}/${mm}/${yyyy}`;
    };

    // Función para formatear números (copiada de tu script)
    const formatNumber = (num) => {
      const n = parseFloat(num);
      if (isNaN(n)) return num;
      return n.toLocaleString('es-CL', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 3
      });
    };

    // Función para renderizar la vista de solo lectura
    const renderizarVista = (cuenta) => {
        const infoHTML = `
          <div><span class="font-semibold text-gray-300">Nombre:</span> ${cuenta.nombre || ''}</div>
          <div><span class="font-semibold text-gray-300">Tipo:</span> ${cuenta.tipo || ''}</div>
          <div><span class="font-semibold text-gray-300">Moneda:</span> ${cuenta.moneda || ''}</div>
          <div><span class="font-semibold text-gray-300">Saldo Inicial:</span> ${formatNumber(cuenta.saldo_inicial)}</div>
        `;
        infoContenedor.innerHTML = infoHTML;
        accionesEdicion.classList.add("hidden");
        btnEditar.classList.remove("hidden");
    };

    // Función para renderizar el formulario de edición
    const renderizarEdicion = (cuenta) => {
        const formHTML = `
            <div class="mb-3">
              <label for="input-nombre" class="text-gray-300">Nombre:</label>
              <input type="text" id="input-nombre" value="${cuenta.nombre || ''}" class="w-full p-2 rounded bg-white text-black" />
            </div>
            <div class="mb-3">
              <label for="input-tipo" class="text-gray-300">Tipo:</label>
              <input type="text" id="input-tipo" value="${cuenta.tipo || ''}" class="w-full p-2 rounded bg-white text-black" />
            </div>
            <div class="mb-3">
              <label for="input-moneda" class="text-gray-300">Moneda:</label>
              <input type="text" id="input-moneda" value="${cuenta.moneda || ''}" class="w-full p-2 rounded bg-white text-black" />
            </div>
            <p class="text-xs text-gray-400">El Saldo Inicial no es editable desde esta vista.</p>
        `;        
        infoContenedor.innerHTML = formHTML;
        accionesEdicion.classList.remove("hidden");
        btnEditar.classList.add("hidden");
    };

    // --- Carga inicial de datos ---
    fetch(`https://cambiosorion.cl/data/detalle-cta.php?id=${id}`)
      .then(async res => {
        const text = await res.text();
        console.log("Respuesta cruda cuenta:", text);
        return JSON.parse(text);
      })
      .then(data => {
        if (data.error) {
          infoContenedor.innerHTML = `<p>${data.error}</p>`;
          return;
        }
  
        cuentaOriginal = { ...data.cuenta }; // Guardar estado original
        renderizarVista(cuentaOriginal); // Renderizar vista inicial
  
        // --- Listener para el botón de Operaciones ---
        btnOperaciones.addEventListener("click", () => {
          if (opsContenedor.classList.contains("hidden")) {
            const tablaHTML = `
              <table class="w-full text-sm text-left text-white bg-gray-800">
                <thead class="text-xs uppercase bg-gray-800 text-white">
                  <tr>
                    <th class="px-4 py-2">Fecha</th>
                    <th class="px-4 py-2">Número</th>
                    <th class="px-4 py-2">Cliente</th> 
                    <th class="px-4 py-2">Tipo Doc</th>
                    <th class="px-4 py-2">Nº Doc</th>
                    <th class="px-4 py-2">Nº Nota</th>
                    <th class="px-4 py-2">Tipo Trans.</th>
                    <th class="px-4 py-2">Divisa</th>
                    <th class="px-4 py-2">Monto</th>
                    <th class="px-4 py-2">Tasa</th>
                    <th class="px-4 py-2">Total</th>
                    <th class="px-4 py-2">Estado</th>
                    <th class="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                ${data.operaciones.map(op => {
                    const colorFondo = op.tipo_transaccion === 'Compra'
                    ? 'style="background-color: #c3e8f1;"' // Celeste
                    : op.tipo_transaccion === 'Venta'
                    ? 'style="background-color: #dbf599;"' // Verde
                    : '';
                    const colorAnulado = op.estado === 'Anulado'
                    ? 'style="background-color: #f9b8a3;"' // Rojo
                    : colorFondo;

                    return `
                    <tr class="border-b bg-white border-gray-700 text-gray-700" ${colorAnulado}>
                        <td class="px-4 py-2">${formatearFecha(op.fecha)}</td>
                        <td class="px-4 py-2">${op.id}</td>
                        <td class="px-4 py-2">${op.nombre_cliente || 'N/A'}</td>
                        <td class="px-4 py-2">${op.tipo_documento || ''}</td>
                        <td class="px-4 py-2">${op.numero_documento || ''}</td>
                        <td class="px-4 py-2">${op.numero_nota || ''}</td>
                        <td class="px-4 py-2">${op.tipo_transaccion || ''}</td>
                        <td class="px-4 py-2">${op.divisa || ''}</td>
                        <td class="px-4 py-2">${formatNumber(op.monto)}</td>
                        <td class="px-4 py-2">${formatNumber(op.tasa_cambio)}</td>
                        <td class="px-4 py-2">${formatNumber(op.total)}</td>
                        <td class="px-4 py-2">${op.estado || ''}</td>
                        <td class="px-4 py-2 gap-2">
                        <a href="/detalle-op?id=${op.id}" class="text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-sm px-3 py-1">Mostrar</a>
                        </td>
                    </tr>
                    `;
                }).join("")}
                </tbody>
              </table>
            `;
            opsContenedor.innerHTML = tablaHTML;
            opsContenedor.classList.remove("hidden");
            btnOperaciones.innerText = "Ocultar Operaciones";
          } else {
            opsContenedor.classList.add("hidden");
            btnOperaciones.innerText = "Ver Operaciones";
          }
        });

        // --- Listeners para Edición ---
        btnEditar.addEventListener("click", () => renderizarEdicion(cuentaOriginal));
        
        btnCancelar.addEventListener("click", () => renderizarVista(cuentaOriginal));

        btnGuardar.addEventListener("click", () => {
          const datosActualizados = {
              id: cuentaOriginal.id,
              nombre: document.getElementById("input-nombre").value,
              tipo: document.getElementById("input-tipo").value,
              moneda: document.getElementById("input-moneda").value,
          };

          fetch("https://cambiosorion.cl/data/detalle-cta.php", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(datosActualizados),
          })
          .then(res => res.text())
          .then(text => {
              try {
                  const response = JSON.parse(text);
                  if (response.success) {
                      alert("Cuenta actualizada correctamente");
                      // Actualizar los datos "originales" y volver a modo vista
                      cuentaOriginal = { ...cuentaOriginal, ...datosActualizados };
                      renderizarVista(cuentaOriginal);
                  } else {
                      alert("Error: " + (response.error || "Desconocido"));
                  }
              } catch (error) {
                  console.error("Error al parsear JSON:", error, text);
                  alert("Hubo un error al procesar la respuesta.");
              }
          })        
          .catch(error => {
              console.error("Error de red:", error);
              alert("Error al intentar guardar los datos");
          });
        });
      })
      .catch(err => {
        console.error(err);
        infoContenedor.innerHTML = "<p>Error al cargar la cuenta.</p>";
      });
  });