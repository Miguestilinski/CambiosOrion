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
                  </tr>
                </thead>
                <tbody>
                  ${data.operaciones.map(op => `
                    <tr class="border-b border-gray-700">
                      <td class="px-4 py-2">${op.fecha}</td>
                      <td class="px-4 py-2">${op.id}</td>
                      <td class="px-4 py-2">${cliente.razon_social}</td>
                      <td class="px-4 py-2">${op.tipo_documento || ''}</td>
                      <td class="px-4 py-2">${op.nro_doc || ''}</td>
                      <td class="px-4 py-2">${op.nro_nota || ''}</td>
                      <td class="px-4 py-2">${op.tipo_transaccion || ''}</td>
                      <td class="px-4 py-2">${op.divisa || ''}</td>
                      <td class="px-4 py-2">${formatNumber(op.monto)}</td>
                      <td class="px-4 py-2">${formatNumber(op.tasa_cambio)}</td>
                      <td class="px-4 py-2">${formatNumber(op.total)}</td>
                      <td class="px-4 py-2">${op.estado || ''}</td>
                    </tr>
                  `).join("")}
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
      })
      .catch(err => {
        console.error(err);
        document.getElementById("info-cliente").innerHTML = "<p>Error al cargar el cliente.</p>";
      });
  });
  