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
        // Formato simple DD/MM/YYYY HH:MM
        return fecha.toLocaleString('es-CL');
    };

    const formatNumber = (num) => {
        const n = parseFloat(num);
        if (isNaN(n)) return num;
        return n.toLocaleString('es-CL', {minimumFractionDigits: 1, maximumFractionDigits: 1});
    };

    function cargarDetalleIngreso() {
        fetch(`https://cambiosorion.cl/data/detalle-ing.php?id=${ingresoId}`)
            .then(async res => {
                const text = await res.text();
                return JSON.parse(text);
            })    
            .then(data => {
                if (data.error) {
                    infoContenedor.innerHTML = `<p>${data.error}</p>`;
                    return;
                }

                const ing = data.ingreso;
                const esCuenta = ing.tipo_ingreso === 'Cuenta';

                // Construcción dinámica de filas para que se vea limpio como en la captura
                let htmlCampos = `
                    <div class="py-1"><span class="font-bold">Estado:</span> ${ing.estado || 'N/A'}</div>
                    <div class="py-1"><span class="font-bold">Tipo de ingreso:</span> ${ing.tipo_ingreso || 'N/A'}</div>
                    
                    <div class="border-t border-gray-600 my-2 pt-2">
                        <div class="py-1"><span class="font-bold">Caja:</span> ${ing.nombre_caja || 'N/A'}</div>
                        <div class="py-1"><span class="font-bold">Cajero:</span> ${ing.nombre_cajero || 'N/A'}</div>
                    </div>

                    <div class="border-t border-gray-600 my-2 pt-2">
                        <div class="py-1"><span class="font-bold">Divisa:</span> ${ing.nombre_divisa || 'N/A'}</div>
                        <div class="py-1"><span class="font-bold">Cliente:</span> ${ing.nombre_cliente || 'N/A'}</div>
                `;

                // Lógica de visualización de Cuentas (Estilo Sistema Antiguo)
                if (esCuenta) {
                    // Si es 'Cuenta', mostramos Origen y Destino
                    htmlCampos += `
                        <div class="py-1"><span class="font-bold">Cuenta origen:</span> ${ing.nombre_cuenta_origen || '—'}</div>
                        <div class="py-1"><span class="font-bold">Cuenta destino:</span> ${ing.nombre_cuenta_destino || '—'}</div>
                    `;
                } else {
                    // Si es 'Efectivo', SOLO mostramos destino si existe, Origen no aplica
                    htmlCampos += `
                         <div class="py-1"><span class="font-bold">Cuenta destino:</span> ${ing.nombre_cuenta_destino || '—'}</div>
                    `;
                }

                htmlCampos += `
                        <div class="py-1"><span class="font-bold">Monto:</span> ${formatNumber(ing.monto)}</div>
                        <div class="py-1"><span class="font-bold">Monto por pagar:</span> ${formatNumber(ing.monto)}</div>
                    </div>
                    
                    <div class="border-t border-gray-600 my-2 pt-2">
                        <div class="py-1"><span class="font-bold">Detalle:</span> ${ing.detalle || ''}</div>
                    </div>
                `;

                infoContenedor.innerHTML = htmlCampos;

                // --- Manejo de Tabla de Pagos ---
                const pagos = data.pagos || [];
                if (pagos.length === 0) {
                    // Muestra la tabla vacía con el mensaje "Ningún dato disponible"
                    pagosContenedor.innerHTML = `
                        <table class="w-full text-sm text-left text-white bg-gray-800">
                            <thead class="text-xs uppercase bg-yellow-700 text-white">
                                <tr>
                                    <th class="px-4 py-2">Fecha de ingreso</th>
                                    <th class="px-4 py-2">Forma de pago</th>
                                    <th class="px-4 py-2">Cuenta</th>
                                    <th class="px-4 py-2">Monto</th>
                                    <th class="px-4 py-2">Detalle</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr class="bg-gray-200 text-gray-500 text-center">
                                    <td colspan="5" class="py-4">Ningún dato disponible en esta tabla</td>
                                </tr>
                            </tbody>
                        </table>
                    `;
                } else {
                    // Si existieran pagos reales (futuro)
                    const tablaHTML = `
                        <table class="w-full text-sm text-left text-white bg-gray-800">
                            <thead class="text-xs uppercase bg-yellow-700 text-white">
                                <tr>
                                    <th class="px-4 py-2">Fecha de ingreso</th>
                                    <th class="px-4 py-2">Forma de pago</th>
                                    <th class="px-4 py-2">Cuenta</th>
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

                if (ing.estado === 'Anulado' || ing.estado === 'Cerrado') {
                    anularBtn.disabled = true;
                    anularBtn.classList.add("opacity-50", "cursor-not-allowed");
                    if(ing.estado === 'Cerrado') anularBtn.textContent = "Cerrado"; 
                    if(ing.estado === 'Anulado') anularBtn.textContent = "Anulado";
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