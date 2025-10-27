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
        const iconoHTML = cuenta.divisa_icono 
            ? `<img src="${cuenta.divisa_icono}" alt="${cuenta.divisa_nombre}" class="w-4 h-4 inline-block mr-2" style="margin-top: -2px;">` 
            : '';
        const infoHTML = `
          <div><span class="font-semibold text-gray-300">Nombre:</span> ${cuenta.nombre || ''}</div>
          <div><span class="font-semibold text-gray-300">Tipo:</span> ${cuenta.tipo_cuenta || ''}</div>
          <div>
            <span class="font-semibold text-gray-300">Divisa:</span> 
            ${iconoHTML}
            ${cuenta.divisa_nombre || (cuenta.divisa_id || '')}
          </div>
          <div><span class="font-semibold text-gray-300">Me Deben (+):</span> ${formatNumber(cuenta.me_deben)}</div>
          <div><span class="font-semibold text-gray-300">Debo (-):</span> ${formatNumber(cuenta.debo)}</div>
          <div><span class="font-semibold text-gray-300">Por Cobrar:</span> ${cuenta.por_cobrar == 1 ? 'Sí' : 'No'}</div>
          <div><span class="font-semibold text-gray-300">Por Pagar:</span> ${cuenta.por_pagar == 1 ? 'Sí' : 'No'}</div>
          <div><span class="font-semibold text-gray-300">Activa:</span> ${cuenta.activa == 1 ? 'Sí' : 'No'}</div>
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
              <label for="input-tipo-cuenta" class="text-gray-300">Tipo (general, cliente, funcionario, administrativa):</label>
              <input type="text" id="input-tipo-cuenta" value="${cuenta.tipo_cuenta || ''}" class="w-full p-2 rounded bg-white text-black" />
            </div>
            <div class="mb-3">
              <label for="input-divisa-id" class="text-gray-300">
                ID de Divisa 
                <span class="font-normal text-gray-400">(Actual: ${iconoHTML} ${cuenta.divisa_nombre || 'N/A'})</span>
              </label>
              <input type="text" id="input-divisa-id" value="${cuenta.divisa_id || ''}" placeholder="Ej: CLP, D99, EUR" class="w-full p-2 rounded bg-white text-black" />
            </div>
            <p class="text-xs text-gray-400">Los saldos y estados no son editables desde esta vista.</p>
        `;        
        infoContenedor.innerHTML = formHTML;
        accionesEdicion.classList.remove("hidden");
        btnEditar.classList.add("hidden");
    };

    function mostrarModal({ titulo, mensaje, onConfirmar }) {
        const modal = document.getElementById("modal-error");
        const tituloElem = document.getElementById("modal-error-titulo");
        const mensajeElem = document.getElementById("modal-error-mensaje");
        const btnConfirmar = document.getElementById("modal-error-confirmar");
        
        // Ocultar el botón de cancelar por si acaso
        document.getElementById("modal-error-cancelar").classList.add("hidden");
        
        tituloElem.textContent = titulo;
        mensajeElem.textContent = mensaje;
        
        // Asignar el evento click
        btnConfirmar.onclick = () => {
            modal.classList.add("hidden");
            if (onConfirmar) {
                onConfirmar();
            }
        };
        
        modal.classList.remove("hidden");
    }

    // --- Carga inicial de datos ---
    fetch(`https://cambiosorion.cl/data/detalle-cta.php?id=${id}`)
      .then(async res => {
        const text = await res.text();
        console.log("Respuesta cruda cuenta:", text);

        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.error("Error al parsear JSON:", e, text);
            infoContenedor.innerHTML = `<p>Error al procesar la respuesta del servidor. La respuesta no es JSON. Revise la consola.</p>`;
            return; // Detener la ejecución
        }

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
              tipo_cuenta: document.getElementById("input-tipo-cuenta").value, // Corregido
              divisa_id: document.getElementById("input-divisa-id").value, // Corregido
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
                      mostrarModal({
                          titulo: "✅ Éxito",
                          mensaje: "Cuenta actualizada correctamente.",
                          onConfirmar: () => {
                              window.location.reload();
                          }
                      });
                  } else {
                      mostrarModal({
                          titulo: "❌ Error",
                          mensaje: "Error: " + (response.error || "Desconocido")
                      });
                  }
              } catch (error) {
                  console.error("Error al parsear JSON:", error, text);
                  mostrarModal({
                      titulo: "❌ Error de Servidor",
                      mensaje: "Hubo un error al procesar la respuesta. Revise la consola."
                  });
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