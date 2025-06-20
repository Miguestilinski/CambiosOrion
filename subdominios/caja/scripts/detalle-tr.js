document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    if (!id) {
        document.getElementById("info-transaccion").innerHTML = "<p>ID de transacción no proporcionado.</p>";
        return;
    }

    fetch(`https://cambiosorion.cl/data/detalle-tr.php?id=${id}`)
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

            // Mostrar información general
            const infoHTML = `
                <div class="text-white space-y-2">
                    <p><strong>Estado:</strong> <span style="color: ${color}">${info.estado}</span></p>
                    <p><strong>Fecha:</strong> ${new Date(info.fecha).toLocaleString("es-CL")}</p>
                    <p><strong>Cliente:</strong> ${info.nombre_cliente || "Sin cliente"}</p>
                    <p><strong>Vendedor:</strong> ${info.vendedor}</p>
                    <p><strong>Caja:</strong> ${info.caja}</p>
                    <p><strong>Tipo:</strong> ${info.tipo_transaccion}</p>
                    <p><strong>Total:</strong> ${formatToCLP(info.total)}</p>
                    <p><strong>Método de pago:</strong> ${info.metodo_pago}</p>
                </div>
            `;
            document.getElementById("info-transaccion").innerHTML = infoHTML;

            // Mostrar divisas
            const contenedorDetalles = document.getElementById("detalle-divisas");
            contenedorDetalles.innerHTML = "";

            data.detalles.forEach(det => {
                const html = `
                    <div class="flex items-center gap-4 bg-gray-800 text-white px-4 py-3 rounded mb-2">
                        <img src="${det.divisa_icono}" alt="${det.divisa}" class="w-6 h-6 rounded-full" />
                        <div class="flex-1">
                            <p class="font-semibold">${det.divisa}</p>
                            <p>Monto: ${formatToCLP(det.monto)}</p>
                            <p>Tasa: ${formatNumber(det.tasa_cambio)}</p>
                            <p>Subtotal: ${formatToCLP(det.subtotal)}</p>
                        </div>
                    </div>
                `;
                contenedorDetalles.innerHTML += html;
            });

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
                    fetch(`https://cambiosorion.cl/data/detalle-tr.php`, {
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

            fetch(`https://cambiosorion.cl/data/detalle-tr.php`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: info.id })
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