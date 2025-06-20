document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    if (!id) {
        document.getElementById("info-transaccion").innerHTML = "<p>ID de transacción no proporcionado.</p>";
        return;
    }

    fetch(`https://cambiosorion.cl/data/detalle-op.php?id=${id}`)
        .then(async res => {
            const text = await res.text();
            console.log("Respuesta cruda:", text);
            return JSON.parse(text);
        })    
        .then(data => {
            if (data.error) {
                document.getElementById("info-transaccion").innerHTML = `<p>${data.error}</p>`;
                return;
            }

            const formatNumber = (num) => {
                const n = parseFloat(num);
                if (isNaN(n)) return num;
                return n.toLocaleString('es-CL', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 3
                });
            };

            function colorEstado(estado) {
                switch (estado) {
                    case "Vigente":
                        return "#3B82F6"; // Azul (Tailwind blue-500)
                    case "Abonado":
                        return "#F97316"; // Naranjo (Tailwind orange-500)
                    case "Pagado":
                        return "#22C55E"; // Verde (Tailwind green-500)
                    case "Anulado":
                        return "#EF4444"; // Rojo (Tailwind red-500)
                    default:
                        return "#FFFFFF"; // Blanco por defecto
                }
            }

            // Mostrar info general de la transacción
            const info = data.transaccion;
            const color = colorEstado(info.estado);
            const totalTransaccion = parseFloat(info.total);
            let abonado = parseFloat(info.monto_pagado || 0);
            let restante = totalTransaccion - abonado;

            // --- Funcionalidad Botón Anular (el rojo en la fila superior) ---
            document.getElementById("anular").addEventListener("click", () => {
                if (info.estado === "Anulado") {
                    mostrarModal({
                        titulo: "❌ Error",
                        mensaje: "La transacción ya está anulada",
                        textoConfirmar: "Entendido"
                    });
                    return;
                }
                if (confirm("¿Seguro que deseas anular esta transacción? Esto revertirá el inventario.")) {
                    fetch(`https://cambiosorion.cl/data/detalle-op.php`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ id: info.id })
                    })
                    .then(res => res.json())
                    .then(res => {
                        if (res.success) {
                            mostrarModal({
                                titulo: ">✅ Anulación Exitosa",
                                mensaje: "Transacción anulada",
                                textoConfirmar: "Entendido"
                            });
                            location.reload();
                        } else {
                            mostrarModal({
                                titulo: "❌ Error",
                                mensaje: "Error al anular: " + res.message,
                                textoConfirmar: "Entendido"
                            });
                        }
                    })
                    .catch(() => {
                        mostrarModal({
                            titulo: "❌ Error",
                            mensaje: "Error de conexión al anular transacción",
                            textoConfirmar: "Entendido"
                        });
                    });
                }
            });

            // --- Funcionalidad Botón Imprimir ---
            document.getElementById("imprimir").addEventListener("click", () => {
                window.print();
            });

            if (abonado > 0) {
                document.getElementById("seccion-pagos").style.display = "block";
                const lista = document.getElementById("lista-pagos");

                // Supongamos que `data.pagos` es un array con pagos previos.
                if (Array.isArray(data.pagos)) {
                    data.pagos.forEach(a => {
                        const li = document.createElement("li");
                        li.textContent = `$${formatNumber(a.monto)} - ${a.fecha}`;
                        lista.appendChild(li);
                    });
                } else {
                    const li = document.createElement("li");
                    li.textContent = `$${formatNumber(abonado)} registrado anteriormente`;
                    lista.appendChild(li);
                }
            }

            function formatToCLP(value) {
                if (!value) return "";
                // Quitar todo lo que no sea número o coma/punto decimal
                const cleanValue = value.toString().replace(/[^0-9]/g, "");
                if (cleanValue === "") return "";

                const number = parseInt(cleanValue, 10);
                if (isNaN(number)) return "";

                // Formatear usando Intl.NumberFormat para Chile
                return "$" + number.toLocaleString("es-CL");
            }

            const infoHTML = `
                <div><span class="font-semibold text-gray-300">Número de transacción:</span> ${info.id}</div>
                <div><span class="font-semibold text-gray-300">Código:</span> ${info.codigo_transaccion}</div>
                <div><span class="font-semibold text-gray-300">Vendedor:</span> ${info.vendedor}</div>
                <div><span class="font-semibold text-gray-300">Caja:</span> ${info.caja}</div>
                <div><span class="font-semibold text-gray-300">Cliente:</span> ${info.nombre_cliente}</div> 
                <div><span class="font-semibold text-gray-300">Tipo de Transacción:</span> ${info.tipo_transaccion}</div>
                <div><span class="font-semibold text-gray-300">Observaciones:</span> ${info.observaciones}</div>
                <div>
                    <span class="font-semibold text-gray-300">Estado:</span> 
                    <span style="color: ${color}; font-weight: 700;">${info.estado}</span>
                </div>
            `;
            document.getElementById("info-transaccion").innerHTML = infoHTML;

            // Mostrar detalles de divisas
            const detallesHTML = `
                <div class="overflow-x-auto w-full">
                    <div class="min-w-max border border-gray-300 rounded-lg bg-white shadow-md">
                        <div class="grid grid-cols-4 rounded-t-lg text-sm font-medium text-gray-700 bg-gray-100 border-b border-black text-center">
                            <div class="p-2">Divisa</div>
                            <div class="p-2">Monto</div>
                            <div class="p-2">Tasa de cambio</div>
                            <div class="p-2">Subtotal</div>
                        </div>
                        ${data.detalles.map(det => `
                            <div class="grid grid-cols-4 rounded-lg text-sm text-center text-gray-800 border-b border-gray-200">
                                <div class="p-2 flex items-center justify-center gap-2">
                                    <img src="${det.divisa_icono}" alt="${det.divisa}" class="w-5 h-5 inline-block" />
                                    <span>${det.divisa}</span>
                                </div>
                                <div class="p-2">${formatNumber(det.monto)}</div>
                                <div class="p-2">${formatNumber(det.tasa_cambio)}</div>
                                <div class="p-2">$${formatNumber(det.subtotal)}</div>
                            </div>
                        `).join("")}
                    </div>
                </div>
            `;

            document.getElementById("detalle-divisas").innerHTML = detallesHTML;

            // Total al final en blanco
            const totalHTML = `
                <div class="mt-4 text-white text-lg font-semibold">
                    Total transacción: $${formatNumber(info.total)}
                </div>
            `;
            document.getElementById("detalle-divisas").insertAdjacentHTML("afterend", totalHTML);

            // Sección de documento
            let documentoHTML = "";

            // Título h2
            let documentoTitulo = `<h2 class="text-xl font-semibold text-white mt-6 mb-3">Documento</h2>`;

            if (info.numero_documento) {
                documentoHTML = `
                    <div class="mt-4 text-gray-300 font-medium">
                        Documento emitido al SII: <strong>${info.numero_documento}</strong><br/>
                        <button onclick="window.open('https://cambiosorion.cl/documentos/${info.numero_documento}.pdf', '_blank')" 
                                class="mt-2 inline-block bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700">
                            Ver documento
                        </button>
                    </div>
                `;
            } else {
                documentoHTML = `
                    <div class="mt-4 text-gray-300 font-medium">
                        Esta transacción fue registrada internamente, pero no fue emitida al SII.
                    </div>
                `;
            }

            const seccionDocumento = document.getElementById("seccion-documento");
            seccionDocumento.innerHTML = documentoTitulo + documentoHTML;

            // Anular transacción
            document.getElementById("anular").addEventListener("click", () => {
            if (!confirm("¿Seguro que deseas anular esta transacción? Esto revertirá el inventario.")) return;

            fetch(`https://cambiosorion.cl/data/detalle-op.php`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: info.id_transaccion })
            })
            .then(res => res.json())
            .then(res => {
                if (res.success) {
                    mostrarModal({
                        titulo: ">✅ Anulación Exitosa",
                        mensaje: "transacción anulada",
                        textoConfirmar: "Entendido"
                    });
                location.reload();
                } else {
                    mostrarModal({
                        titulo: "❌ Error",
                        mensaje: "Error al anular: " + res.message,
                        textoConfirmar: "Entendido"
                    });
                }
            });
            });
        })
    .catch(err => {
        console.error(err);
        document.getElementById("info-transaccion").innerHTML = "<p>Error al cargar la transacción.</p>";
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

  // Remover handlers anteriores
  btnConfirmar.onclick = () => {
    modal.classList.add("hidden");
    if (onConfirmar) onConfirmar();
  };

  btnCancelar.onclick = () => {
    modal.classList.add("hidden");
    if (onCancelar) onCancelar();
  };
}

function mostrarModalPagoExitoso() {
  const modal = document.getElementById("modal-pago-exitoso");
  modal.classList.remove("hidden");

  document.getElementById("nuevo-pago").onclick = () => {
    location.reload();
  };

  document.getElementById("volver").onclick = () => {
    window.location.href = "https://caja.cambiosorion.cl/transacciones";
  };
}