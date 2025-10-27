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
            ? `<img src="${cuenta.divisa_icono}" alt="${cuenta.divisa_nombre}" class="w-4 h-4 inline-block ml-1" style="margin-top: -2px;">` 
            : '';
        const infoHTML = `
          <div><span class="font-semibold text-gray-300">Nombre:</span> ${cuenta.nombre || ''}</div>
          <div><span class="font-semibold text-gray-300">Tipo:</span> ${cuenta.tipo_cuenta || ''}</div>
          <div>
            <span class="font-semibold text-gray-300">Divisa:</span> 
            ${cuenta.divisa_nombre || (cuenta.divisa_id || '')}
            ${iconoHTML}
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

        const tipos = ['general', 'cliente', 'funcionario', 'administrativa'];
        const opcionesTipo = tipos.map(tipo => 
            `<option value="${tipo}" ${cuenta.tipo_cuenta === tipo ? 'selected' : ''}>${tipo.charAt(0).toUpperCase() + tipo.slice(1)}</option>`
        ).join('');

        const iconoHTML = cuenta.divisa_icono 
            ? `<img src="${cuenta.divisa_icono}" alt="${cuenta.divisa_nombre}" class="w-4 h-4 inline-block mr-2" style="margin-top: -2px;">` 
            : '';

        const formHTML = `
            <div class="mb-3">
              <label for="input-nombre" class="text-gray-300">Nombre:</label>
              <input type="text" id="input-nombre" value="${cuenta.nombre || ''}" class="w-full p-2 rounded bg-white text-black" />
            </div>
            
            <div class="mb-3">
              <label for="input-tipo-cuenta" class="text-gray-300">Tipo:</label>
              <select id="input-tipo-cuenta" class="w-full p-2 rounded bg-white text-black">
                ${opcionesTipo}
              </select>
            </div>

            <div class="mb-3 relative">
              <label for="input-divisa-search" class="text-gray-300">Divisa</label>
              
              <input type="text" 
                     id="input-divisa-search" 
                     placeholder="Buscar por nombre..." 
                     value="${cuenta.divisa_nombre || ''}" 
                     class="w-full p-2 rounded bg-white text-black" />
              <input type="hidden" id="input-divisa-id-hidden" value="${cuenta.divisa_id || ''}" />
              <ul id="divisa-sugerencias" class="absolute z-10 w-full bg-white border border-gray-600 text-gray-700 rounded-lg mt-1 hidden max-h-48 overflow-y-auto"></ul>
            </div>
            
            <p class="text-xs text-gray-400">Los saldos y estados no son editables desde esta vista.</p>
        `;        
        infoContenedor.innerHTML = formHTML;
        accionesEdicion.classList.remove("hidden");
        btnEditar.classList.add("hidden");

        const divisaSearchInput = document.getElementById("input-divisa-search");
        const divisaHiddenInput = document.getElementById("input-divisa-id-hidden");

        divisaSearchInput.addEventListener("input", async () => {
            const divisaSugerencias = document.getElementById("divisa-sugerencias");
            if (!divisaSugerencias) return;
            
            const query = divisaSearchInput.value.trim();
            if (query.length < 1) {
                divisaSugerencias.classList.add("hidden");
                return;
            }

            // Llamar al PHP para buscar divisas
            const res = await fetch(`https://cambiosorion.cl/data/detalle-cta.php?buscar_divisa=${encodeURIComponent(query)}`);
            const text = await res.text(); // Leer como texto primero

            try {
                const divisas = JSON.parse(text);
                divisaSugerencias.innerHTML = "";
                
                divisas.forEach(divisa => {
                    const li = document.createElement("li");
                    li.className = "px-3 py-2 hover:bg-gray-200 cursor-pointer flex items-center";
                    
                    // Añadir ícono y nombre
                    const icono = divisa.icono ? `<img src="${divisa.icono}" class="w-4 h-4 mr-2">` : '<div class="w-4 h-4 mr-2"></div>'; // Placeholder
                    li.innerHTML = `${icono} ${divisa.nombre}`;
                    
                    li.addEventListener("click", () => {
                        divisaSearchInput.value = divisa.nombre; // Mostrar nombre en el input
                        divisaHiddenInput.value = divisa.id; // Guardar ID en el input oculto
                        divisaSugerencias.classList.add("hidden");
                    });
                    divisaSugerencias.appendChild(li);
                });

                divisaSugerencias.classList.remove("hidden");

            } catch(e) {
                console.error("Error al parsear JSON de divisas:", e, text);
            }
        });

        // Ocultar sugerencias si se hace clic fuera
        document.addEventListener("click", (e) => {
            const currentSugerencias = document.getElementById("divisa-sugerencias"); 
            if (currentSugerencias && !infoContenedor.contains(e.target)) {
                currentSugerencias.classList.add("hidden"); 
            }
        }, { once: true }); // El listener se ejecuta una vez y se remueve
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
              tipo_cuenta: document.getElementById("input-tipo-cuenta").value, // Leer del Select
              divisa_id: document.getElementById("input-divisa-id-hidden").value, // Leer del Input Oculto
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
              mostrarModal({
                  titulo: "❌ Error de Red",
                  mensaje: "Error al intentar guardar los datos."
              });
          });
        });
      })
      .catch(err => {
        console.error(err);
        infoContenedor.innerHTML = "<p>Error al cargar la cuenta.</p>";
      });
  });