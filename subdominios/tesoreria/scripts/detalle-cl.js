document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
  
    if (!id) {
      document.getElementById("info-cliente").innerHTML = "<p>ID de cliente no proporcionado.</p>";
      return;
    }
  
    fetch(`https://cambiosorion.cl/data/detalle-cl.php?id=${id}`)
      .then(async res => {
        const text = await res.text();
        console.log("Respuesta cruda cliente:", text);
        return JSON.parse(text);
      })
      .then(data => {
        if (data.error) {
          document.getElementById("info-cliente").innerHTML = `<p>${data.error}</p>`;
          return;
        }
  
        const cliente = data.cliente;
  
        const infoHTML = `
          <div><span class="font-semibold text-gray-300">Razón social:</span> ${cliente.razon_social}</div>
          <div><span class="font-semibold text-gray-300">RUT:</span> ${cliente.rut}</div>
          <div><span class="font-semibold text-gray-300">Email:</span> ${cliente.correo}</div>
          <div><span class="font-semibold text-gray-300">Teléfono:</span> ${cliente.fono}</div>
          <div><span class="font-semibold text-gray-300">Dirección:</span> ${cliente.direccion}</div>
        `;
        document.getElementById("info-cliente").innerHTML = infoHTML;
  
        const formatNumber = (num) => {
          const n = parseFloat(num);
          if (isNaN(n)) return num;
          return n.toLocaleString('es-CL', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 3
          });
        };
  
        document.getElementById("btn-operaciones").addEventListener("click", () => {
          const contenedor = document.getElementById("detalle-operaciones-cliente");
          if (contenedor.classList.contains("hidden")) {
            const tablaHTML = `
              <table class="w-full text-sm text-left text-white bg-gray-800">
                <thead class="text-xs uppercase bg-gray-800 text-white">
                  <tr>
                    <th class="px-4 py-2">Fecha</th>
                    <th class="px-4 py-2">Número</th>
                    <th class="px-4 py-2">Cliente</th>
                    <th class="px-4 py-2">Tipo de Documento</th>
                    <th class="px-4 py-2">Nº Doc</th>
                    <th class="px-4 py-2">Nº Nota</th>
                    <th class="px-4 py-2">Tipo de Transacción</th>
                    <th class="px-4 py-2">Divisa</th>
                    <th class="px-4 py-2">Monto</th>
                    <th class="px-4 py-2">Tasa de Cambio</th>
                    <th class="px-4 py-2">Total</th>
                    <th class="px-4 py-2">Estado</th>
                    <th class="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                ${data.operaciones.map(op => {
                    const colorFondo = op.tipo_transaccion === 'Compra'
                    ? 'style="background-color: #c3e8f1;"'
                    : op.tipo_transaccion === 'Venta'
                    ? 'style="background-color: #dbf599;"'
                    : '';

                    return `
                    <tr class="border-b bg-white border-gray-700 text-gray-700" ${colorFondo}>
                        <td class="px-4 py-2">${op.fecha}</td>
                        <td class="px-4 py-2">${op.id}</td>
                        <td class="px-4 py-2">${cliente.razon_social}</td>
                        <td class="px-4 py-2">${op.tipo_documento || ''}</td>
                        <td class="px-4 py-2">${op.numero_documento || ''}</td>
                        <td class="px-4 py-2">${op.numero_nota || ''}</td>
                        <td class="px-4 py-2">${op.tipo_transaccion || ''}</td>
                        <td class="px-4 py-2">${op.divisa || ''}</td>
                        <td class="px-4 py-2">${formatNumber(op.monto)}</td>
                        <td class="px-4 py-2">${formatNumber(op.tasa_cambio)}</td>
                        <td class="px-4 py-2">${formatNumber(op.total)}</td>
                        <td class="px-4 py-2">${op.estado || ''}</td>
                        <td class="px-4 py-2 flex gap-2">
                        <a href="/detalle-op?id=${op.id}" class="text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-sm px-3 py-1">Mostrar</a>
                        </td>
                    </tr>
                    `;
                }).join("")}
                </tbody>
              </table>
            `;
  
            contenedor.innerHTML = tablaHTML;
            contenedor.classList.remove("hidden");
            document.getElementById("btn-operaciones").innerText = "Ocultar Operaciones";
          } else {
            contenedor.classList.add("hidden");
            document.getElementById("btn-operaciones").innerText = "Ver Operaciones";
          }
        });

        let clienteOriginal = { ...cliente };

        document.getElementById("btn-editar").addEventListener("click", () => {
        const formHTML = `
            <input type="text" id="input-razon" placeholder="Razón social" value="${cliente.razon_social}" class="w-full p-2 rounded bg-gray-700 text-white" />
            <input type="text" id="input-rut" placeholder="RUT" value="${cliente.rut}" class="w-full p-2 rounded bg-gray-700 text-white" />
            <input type="email" id="input-correo" placeholder="Email" value="${cliente.correo}" class="w-full p-2 rounded bg-gray-700 text-white" />
            <input type="text" id="input-fono" placeholder="Teléfono" value="${cliente.fono}" class="w-full p-2 rounded bg-gray-700 text-white" />
            <input type="text" id="input-direccion" placeholder="Dirección" value="${cliente.direccion}" class="w-full p-2 rounded bg-gray-700 text-white" />
        `;
        document.getElementById("info-cliente").innerHTML = formHTML;
        document.getElementById("acciones-edicion").classList.remove("hidden");
        });

        // Cancelar edición
        document.getElementById("btn-cancelar").addEventListener("click", () => {
        const infoHTML = `
            <div><span class="font-semibold text-gray-300">Razón social:</span> ${clienteOriginal.razon_social}</div>
            <div><span class="font-semibold text-gray-300">RUT:</span> ${clienteOriginal.rut}</div>
            <div><span class="font-semibold text-gray-300">Email:</span> ${clienteOriginal.correo}</div>
            <div><span class="font-semibold text-gray-300">Teléfono:</span> ${clienteOriginal.fono}</div>
            <div><span class="font-semibold text-gray-300">Dirección:</span> ${clienteOriginal.direccion}</div>
        `;
        document.getElementById("info-cliente").innerHTML = infoHTML;
        document.getElementById("acciones-edicion").classList.add("hidden");
        });

        // Guardar cambios
        document.getElementById("btn-guardar").addEventListener("click", () => {
        const datosActualizados = {
            id: clienteOriginal.id,
            razon_social: document.getElementById("input-razon").value,
            rut: document.getElementById("input-rut").value,
            correo: document.getElementById("input-correo").value,
            fono: document.getElementById("input-fono").value,
            direccion: document.getElementById("input-direccion").value,
        };

        fetch("https://cambiosorion.cl/data/detalle-cl.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(datosActualizados),
        })
        .then(res => res.json())
        .then(response => {
            if (response.success) {
            alert("Cliente actualizado correctamente");
            location.reload(); // Recarga para ver los datos nuevos
            } else {
            alert("Error al actualizar: " + response.error);
            }
        })
        .catch(error => {
            console.error("Error al actualizar cliente:", error);
            alert("Hubo un error al actualizar los datos.");
        });
        });

      })
      .catch(err => {
        console.error(err);
        document.getElementById("info-cliente").innerHTML = "<p>Error al cargar el cliente.</p>";
      });
  });
  