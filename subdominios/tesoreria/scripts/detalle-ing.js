document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const ingresoId = params.get("id");
    
    const infoContenedor = document.getElementById("info-ingreso");
    const pagosContenedor = document.getElementById("detalle-pagos-ingreso");
    const anularBtn = document.getElementById("anular-ingreso");
    const imprimirBtn = document.getElementById("imprimir");

    if (!ingresoId) {
        infoContenedor.innerHTML = "<p>ID de ingreso no proporcionado.</p>";
        return;
    }

    const formatearFecha = (timestamp) => {
        if (!timestamp) return ''; 
        const fecha = new Date(timestamp);
        if (isNaN(fecha.getTime())) return timestamp;
        const hh = String(fecha.getHours()).padStart(2, '0');
        const min = String(fecha.getMinutes()).padStart(2, '0');
        const dd = String(fecha.getDate()).padStart(2, '0');
        const mm = String(fecha.getMonth() + 1).padStart(2, '0');
        const yyyy = fecha.getFullYear();
        return `${hh}:${min} ${dd}/${mm}/${yyyy}`;
    };

    const formatNumber = (num) => {
        const n = parseFloat(num);
        if (isNaN(n)) return num;
        return n.toLocaleString('es-CL');
    };

    function cargarDetalleIngreso() {
        fetch(`https://cambiosorion.cl/data/detalle-ing.php?id=${ingresoId}`)
            .then(async res => {
                const text = await res.text();
                console.log("Respuesta cruda:", text);
                return JSON.parse(text);
            })    
            .then(data => {
                if (data.error) {
                    infoContenedor.innerHTML = `<p>${data.error}</p>`;
                    return;
                }

                const ing = data.ingreso;

                // Lógica de visualización de Cuentas
                let origenTexto = ing.nombre_cuenta_origen || "—";
                let destinoTexto = ing.nombre_cuenta_destino || ing.nombre_caja || "—";

                // Si es efectivo y no hay cuenta origen explícita, asumimos cliente
                if (ing.tipo_ingreso === 'Efectivo' && !ing.nombre_cuenta_origen) {
                    origenTexto = "Efectivo (" + (ing.nombre_cliente || 'Cliente') + ")";
                }

                const infoHTML = `
                    <div><span class="font-semibold text-gray-300">ID Ingreso:</span> ${ing.id}</div>
                    <div><span class="font-semibold text-gray-300">Estado:</span> ${ing.estado || 'N/A'}</div>
                    <div><span class="font-semibold text-gray-300">Tipo de ingreso:</span> ${ing.tipo_ingreso || 'N/A'}</div>
                    <div><span class="font-semibold text-gray-300">Caja:</span> ${ing.nombre_caja || 'N/A'}</div>
                    <div><span class="font-semibold text-gray-300">Cajero:</span> ${ing.nombre_cajero || 'N/A'}</div>
                    <div><span class="font-semibold text-gray-300">Divisa:</span> ${ing.nombre_divisa || 'N/A'}</div>
                    <div><span class="font-semibold text-gray-300">Cliente:</span> ${ing.nombre_cliente || 'N/A'}</div>
                    
                    <div class="mt-2 border-t border-gray-600 pt-2">
                        <div><span class="font-semibold text-gray-300">Cuenta Origen:</span> ${origenTexto}</div>
                        <div><span class="font-semibold text-gray-300">Cuenta Destino:</span> ${destinoTexto}</div>
                    </div>
                    
                    <div class="mt-2 border-t border-gray-600 pt-2">
                        <div><span class="font-semibold text-gray-300">Monto:</span> ${formatNumber(ing.monto)}</div>
                        <div><span class="font-semibold text-gray-300">Monto por pagar:</span> ${formatNumber(ing.monto)}</div>
                        <div><span class="font-semibold text-gray-300">Detalle:</span> ${ing.detalle || 'Ninguno'}</div>
                    </div>
                `;
                infoContenedor.innerHTML = infoHTML;

                const pagos = data.pagos || [];
                if (pagos.length === 0) {
                    pagosContenedor.innerHTML = '<p class="text-white p-4 bg-gray-800 rounded">No hay información de pagos.</p>';
                } else {
                    const tablaHTML = `
                        <table class="w-full text-sm text-left text-white bg-gray-800">
                            <thead class="text-xs uppercase bg-gray-800 text-white">
                                <tr>
                                    <th class="px-4 py-2">Fecha</th>
                                    <th class="px-4 py-2">Forma de pago</th>
                                    <th class="px-4 py-2">Cuenta Destino</th>
                                    <th class="px-4 py-2">Monto</th>
                                    <th class="px-4 py-2">Detalle</th>
                                </tr>
                            </thead>
                            <tbody>
                            ${pagos.map(p => `
                                <tr class="border-b bg-white border-gray-700 text-gray-700">
                                    <td class="px-4 py-2">${formatearFecha(p.fecha)}</td>
                                    <td class="px-4 py-2">${p.forma_pago || ''}</td>
                                    <td class="px-4 py-2">${p.cuenta || ''}</td>
                                    <td class="px-4 py-2">${formatNumber(p.monto)}</td>
                                    <td class="px-4 py-2">${p.detalle || ''}</td>
                                </tr>
                            `).join("")}
                            </tbody>
                        </table>
                    `;
                    pagosContenedor.innerHTML = tablaHTML;
                }

                if (ing.estado === 'Anulado') {
                    anularBtn.disabled = true;
                    anularBtn.textContent = 'Anulado';
                    anularBtn.classList.add("opacity-50", "cursor-not-allowed");
                }

            })
            .catch(err => {
                console.error(err);
                infoContenedor.innerHTML = "<p>Error al cargar los detalles del ingreso.</p>";
            });
    }

    imprimirBtn.addEventListener("click", () => {
        window.print();
    });

    anularBtn.addEventListener("click", () => {
        mostrarModal({
            titulo: "⚠️ Confirmar Anulación",
            mensaje: "¿Estás seguro que deseas anular este ingreso?",
            textoConfirmar: "Anular",
            textoCancelar: "Cancelar",
            onConfirmar: () => {
                fetch(`https://cambiosorion.cl/data/detalle-ing.php`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: ingresoId, action: "anular" })
                })
                .then(res => res.json())
                .then(response => {
                    if (response.success) {
                        mostrarModal({
                            titulo: "✅ Éxito",
                            mensaje: "El ingreso ha sido anulado.",
                            onConfirmar: () => location.reload()
                        });
                    } else {
                        mostrarModal({
                            titulo: "❌ Error",
                            mensaje: "Error al anular: " + (response.message || "Error desconocido")
                        });
                    }
                })
                .catch(err => {
                     mostrarModal({
                        titulo: "❌ Error de Red",
                        mensaje: "No se pudo conectar con el servidor."
                    });
                });
            }
        });
    });

    function mostrarModal({ titulo, mensaje, textoConfirmar = "Aceptar", textoCancelar = null, onConfirmar, onCancelar }) {
      const modal = document.getElementById("modal-generico");
      const tituloElem = document.getElementById("modal-generico-titulo");
      const mensajeElem = document.getElementById("modal-generico-mensaje");
      const btnConfirmar = document.getElementById("modal-generico-confirmar");
      const btnCancelar = document.getElementById("modal-generico-cancelar");

      tituloElem.textContent = titulo;
      mensajeElem.textContent = mensaje;
      btnConfirmar.textContent = textoConfirmar;

      if (textoCancelar) {
        btnCancelar.classList.remove("hidden");
        btnCancelar.textContent = textoCancelar;
      } else {
        btnCancelar.classList.add("hidden");
      }

      modal.classList.remove("hidden");

      const newConfirm = btnConfirmar.cloneNode(true);
      const newCancel = btnCancelar.cloneNode(true);
      btnConfirmar.parentNode.replaceChild(newConfirm, btnConfirmar);
      btnCancelar.parentNode.replaceChild(newCancel, btnCancelar);

      newConfirm.onclick = () => {
        modal.classList.add("hidden");
        if (onConfirmar) onConfirmar();
      };

      newCancel.onclick = () => {
        modal.classList.add("hidden");
        if (onCancelar) onCancelar();
      };
    }

    cargarDetalleIngreso();
});