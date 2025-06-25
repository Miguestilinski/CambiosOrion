document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    let info = null;

    if (!id) {
        document.getElementById("info-operacion").innerHTML = "<p>ID de operación no proporcionado.</p>";
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
                document.getElementById("info-operacion").innerHTML = `<p>${data.error}</p>`;
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

            // Mostrar info general de la operación
            info = data.operacion;
            const color = colorEstado(info.estado);
            const totalOperacion = parseFloat(info.total);
            let abonado = parseFloat(info.monto_pagado || 0);
            let restante = totalOperacion - abonado;
            let margenTotal = 0;
            data.detalles.forEach(det => {
                margenTotal += parseFloat(det.margen || 0);
            });

            // --- Funcionalidad Botón Exportar PDF ---
            document.getElementById("exportar-pdf").addEventListener("click", () => {
                // Abre el PDF en una nueva pestaña
                if (info.numero_documento) {
                    const urlPDF = `https://cambiosorion.cl/documentos/${info.numero_documento}.pdf`;
                    window.open(urlPDF, "_blank");
                } else {
                    mostrarModal({
                        titulo: "❌ Error",
                        mensaje: "No hay documento emitido para exportar PDF",
                        textoConfirmar: "Entendido"
                    });
                }
            });

            // --- Funcionalidad Botón Emitir Documento SII ---
            document.getElementById("emitir-doc").addEventListener("click", () => {
                if (info.estado === "Anulado") {
                    mostrarModal({
                        titulo: "❌ Error",
                        mensaje: "No se puede emitir documento para una operación anulada",
                        textoConfirmar: "Entendido"
                    });
                    return;
                }

                if (confirm("¿Deseas emitir el documento al SII?")) {
                    fetch(`https://cambiosorion.cl/data/emitir-doc.php`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ id: info.id_operacion })
                    })
                    .then(res => res.json())
                    .then(res => {
                        if (res.success) {
                            mostrarModal({
                                titulo: ">✅ Emisión Exitosa",
                                mensaje: "Documento emitido correctamente",
                                textoConfirmar: "Entendido"
                            });
                            location.reload();
                        } else {
                            mostrarModal({
                                titulo: "❌ Error",
                                mensaje: "Error al emitir documento: " + res.message,
                                textoConfirmar: "Entendido"
                            });
                        }
                    })
                    .catch(() => {
                        mostrarModal({
                                titulo: "❌ Error",
                                mensaje: "Error de conexión al emitir documento",
                                textoConfirmar: "Entendido"
                        });
                    });
                }
            });

            // --- Funcionalidad Botón Anular (el rojo en la fila superior) ---
            document.getElementById("anular").addEventListener("click", () => {
                if (info.estado === "Anulado") {
                    mostrarModal({
                        titulo: "❌ Error",
                        mensaje: "La operación ya está anulada",
                        textoConfirmar: "Entendido"
                    });
                    return;
                }
                if (confirm("¿Seguro que deseas anular esta operación? Esto revertirá el inventario.")) {
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
                                mensaje: "Operación anulada",
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
                            mensaje: "Error de conexión al anular operación",
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

            // Mostrar tabla de pagos si existen
            const contenedorCliente = document.getElementById("tabla-historico-pagos-cliente");
            const contenedorOrion = document.getElementById("tabla-historico-pagos-orion");

            const pagosCliente = data.pagos.filter(p => p.origen === "cliente");
            const pagosOrion = data.pagos.filter(p => p.origen === "orion");

            function renderTabla(contenedor, titulo, pagos, origen) {
                if (pagos.length === 0) {
                    contenedor.innerHTML = `<p class="text-gray-400 italic">No se han realizado pagos de ${titulo.toLowerCase()}.</p>`;
                    return;
                }

                const tabla = document.createElement("table");
                tabla.className = "w-full text-left text-gray-200 border-collapse";

                tabla.innerHTML = `
                    <thead class="text-sm border-b border-gray-500 rounded-t-md">
                        <tr>
                            <th colspan="5" class="py-2 text-lg font-semibold rounded-t-md">${titulo}</th>
                        </tr>
                        <tr class="bg-blue-700">
                            <th class="py-2 px-2">Fecha</th>
                            <th class="py-2 px-2">Tipo</th>
                            <th class="py-2 px-2">Divisa</th>
                            <th class="py-2 px-2">Monto</th>
                            <th class="py-2 px-2 text-center"> </th>
                        </tr>
                    </thead>
                    <tbody>
                        ${pagos.map(p => `
                            <tr class="border-b border-gray-700">
                                <td class="py-1 px-2">${p.fecha}</td>
                                <td class="py-1 px-2">${p.tipo || '—'}</td>
                                <td class="py-1 px-2">${p.divisa || 'CLP'}</td>
                                <td class="py-1 px-2">$${formatNumber(p.monto)}</td>
                                <td class="py-1 px-2 text-center">
                                    <button 
                                        class="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-2 rounded delete-button"
                                        data-id="${p.id}" 
                                        data-origen="${origen}">
                                        ✕
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                `;

                contenedor.innerHTML = "";
                contenedor.appendChild(tabla);

                // Añadir funcionalidad al botón eliminar
                tabla.querySelectorAll(".delete-button").forEach(btn => {
                    btn.addEventListener("click", () => {
                        const id = btn.dataset.id;
                        const origen = btn.dataset.origen;

                        mostrarModal({
                            titulo: "⚠️ Confirmar eliminación",
                            mensaje: "¿Estás seguro que deseas eliminar este pago?",
                            textoConfirmar: "Eliminar",
                            textoCancelar: "Cancelar",
                            onConfirmar: () => {
                                fetch(`https://cambiosorion.cl/data/detalle-op.php`, {
                                    method: "POST",
                                    headers: {
                                        "Content-Type": "application/json"
                                    },
                                    body: JSON.stringify({ id, origen })
                                })
                                .then(res => res.json())
                                .then(response => {
                                    if (response.success) {
                                        mostrarModal({
                                            titulo: "✅ Elimiación Exitosa",
                                            mensaje: "Pago eliminado correctamente.",
                                            onConfirmar: () => location.reload()
                                        });
                                    } else {
                                        mostrarModal({
                                            titulo: "❌ Error",
                                            mensaje: "Error al eliminar el pago: " + (response.message || ''),
                                            textoConfirmar: "Cerrar"
                                        });
                                    }
                                })
                                .catch(() => {
                                    mostrarModal({
                                        titulo: "❌ Error",
                                        mensaje: "Error de conexión al eliminar el pago.",
                                        textoConfirmar: "Cerrar"
                                    });
                                });
                            },
                            onCancelar: () => {
                                // No hacer nada al cancelar
                            }
                        });
                    });
                });
            }

            renderTabla(contenedorCliente, "Pagos de Cliente", pagosCliente, "cliente");
            renderTabla(contenedorOrion, "Pagos de Orion", pagosOrion, "orion");

            const inputPago = document.getElementById("input-pago");
            const btnPago = document.getElementById("btn-registrar-pago");

            const divisaSelect = document.getElementById("divisa-select");

            divisaSelect.addEventListener("change", () => {
                const divisaSeleccionada = divisaSelect.value;
                console.log("Divisa seleccionada:", `"${divisaSeleccionada}"`);
                let sugerido = 0;

                if (divisaSeleccionada === "D47") {
                    const pagosCLP = data.pagos
                        .filter(p => p.divisa.trim() === "D47")
                        .reduce((sum, p) => sum + parseFloat(p.monto), 0);
                    sugerido = pagosCLP > 0 ? (info.total - pagosCLP) : info.total;
                } else if (data.detalles) {
                    const detalle = data.detalles.find(det => det.divisa_id === divisaSeleccionada);
                    if (detalle) {
                        const pagosDivisa = data.pagos
                            .filter(p => p.divisa.trim() === detalle.divisa.trim())
                            .reduce((sum, p) => sum + parseFloat(p.monto), 0);
                        sugerido = pagosDivisa > 0 ? (detalle.monto - pagosDivisa) : detalle.monto;
                    }
                }

                sugerido = sugerido < 0 ? 0 : sugerido;

                inputPago.placeholder = formatToCLP(sugerido);
            });

            divisaSelect.dispatchEvent(new Event('change'));

            //inputPago.placeholder = `$${formatNumber(restante)}`;

            if (info.estado === "Pagado") {
                inputPago.disabled = true;
                btnPago.disabled = true;
                btnPago.textContent = "Pagado";
            }

            function formatToCLP(value) {
                if (value === null || value === undefined || value === "") return "";

                const number = parseFloat(value);
                if (isNaN(number)) return "";

                return "$" + number.toLocaleString("es-CL", {
                    minimumFractionDigits: number % 1 === 0 ? 0 : 2,
                    maximumFractionDigits: 2
                });
            }

            inputPago.addEventListener("input", (e) => {
                const cursorPosition = inputPago.selectionStart;

                const onlyNumbers = inputPago.value.replace(/[^0-9]/g, "");

                let numero = parseInt(onlyNumbers, 10);

                if (!isNaN(numero) && numero > restante) {
                    numero = Math.floor(restante);
                }

                const formatted = numero ? formatToCLP(numero) : "";

                inputPago.value = formatted;

                inputPago.selectionStart = inputPago.selectionEnd = inputPago.value.length;
            });

            btnPago.addEventListener("click", () => {
                if (!document.getElementById("origen-pago").value) {
                    mostrarModal({
                        titulo: "❌ Error",
                        mensaje: "Selecciona el origen del pago",
                        textoConfirmar: "Entendido"
                    });
                    return;
                }

                if (!document.getElementById("tipo-pago").value) {
                    mostrarModal({
                        titulo: "❌ Error",
                        mensaje: "Selecciona el tipo de pago",
                        textoConfirmar: "Entendido"
                    });
                    return;
                }

                if (!document.getElementById("divisa-select").value) {
                    mostrarModal({
                        titulo: "❌ Error",
                        mensaje: "Selecciona la divisa",
                        textoConfirmar: "Entendido"
                    });
                    return;
                }

                // Extraemos sólo números del input
                const rawValue = inputPago.value;
                const numericString = rawValue.replace(/[^0-9]/g, "");

                if (!numericString) {
                    mostrarModal({
                        titulo: "❌ Error",
                        mensaje: "Monto inválido",
                        textoConfirmar: "Entendido"
                    });
                    return;
                }

                const montoIngresado = parseFloat(numericString);

                if (isNaN(montoIngresado) || montoIngresado <= 0) {
                    mostrarModal({
                        titulo: "❌ Error",
                        mensaje: "Monto inválido",
                        textoConfirmar: "Entendido"
                    });
                    return;
                }

                if (montoIngresado > restante) {
                    mostrarModal({
                        titulo: "❌ Error",
                        mensaje: "El monto excede lo pendiente",
                        textoConfirmar: "Entendido"
                    });
                    return;
                }

                const tipoOperacion = info.tipo_transaccion; // "Compra" o "Venta"
                const origenPago = document.getElementById("origen-pago").value;
                const divisaSeleccionada = document.getElementById("divisa-select").value;

                if (
                    (tipoOperacion === "Compra" && origenPago === "cliente" && divisaSeleccionada !== "D47") ||
                    (tipoOperacion === "Compra" && origenPago === "orion" && divisaSeleccionada === "D47") ||
                    (tipoOperacion === "Venta" && origenPago === "cliente" && divisaSeleccionada === "D47") ||
                    (tipoOperacion === "Venta" && origenPago === "orion" && divisaSeleccionada !== "D47")
                ) {
                    mostrarModal({
                        titulo: "❌ Pago inválido",
                        mensaje: `Para una operación de ${tipoOperacion.toLowerCase()}, el ${
                            origenPago === "cliente" ? "cliente" : "equipo Orion"
                        } solo puede pagar en ${
                            tipoOperacion === "Compra"
                                ? origenPago === "cliente"
                                    ? "Pesos Chilenos"
                                    : "divisas extranjeras"
                                : origenPago === "cliente"
                                    ? "divisas extranjeras"
                                    : "Pesos Chilenos"
                        }.`,
                        textoConfirmar: "Entendido"
                    });
                    return;
                }

                // Nuevo estado
                let nuevoEstado = "Abonado";
                if (montoIngresado === restante) {
                    nuevoEstado = "Pagado";
                }

                const payload = {
                    id: info.id,
                    estado: nuevoEstado,
                    pagos: montoIngresado,
                    caja_id: 99,
                    tipo_pago: document.getElementById("tipo-pago").value,
                    divisa: document.getElementById("divisa-select").value,
                    origen: document.getElementById("origen-pago").value,
                    cliente_id: info.cliente_id
                };

                console.log("Enviando payload:", payload);

                fetch(`https://cambiosorion.cl/data/detalle-op.php`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                })
                .then(res => res.json())
                .then(res => {
                    if (res.success) {
                        mostrarModalPagoExitoso();
                    } else {
                        mostrarModal({
                            titulo: "❌ Error",
                            mensaje: "Error al registrar: " + (res.message ?? "Respuesta inválida del servidor"),
                            textoConfirmar: "Entendido"
                        });
                        console.error("Respuesta del servidor:", res);
                    }
                })
                .catch(error => {
                    mostrarModal({
                        titulo: "❌ Error",
                        mensaje: "Error de red o respuesta inválida: " + error,
                        textoConfirmar: "Entendido"
                    });
                    console.error("Error en el fetch:", error);
                });
            });

            const infoHTML = `
                <div><span class="font-semibold text-gray-300">Número de operación:</span> ${info.id}</div>
                <div><span class="font-semibold text-gray-300">Código:</span> ${info.codigo_operacion}</div>
                <div><span class="font-semibold text-gray-300">Vendedor:</span> ${info.vendedor}</div>
                <div><span class="font-semibold text-gray-300">Caja:</span> ${info.caja}</div>
                <div><span class="font-semibold text-gray-300">Cliente:</span> ${info.nombre_cliente}</div>
                <div><span class="font-semibold text-gray-300">Tipo de Transacción:</span> ${info.tipo_transaccion}</div>
                <div><span class="font-semibold text-gray-300">Margen:</span> ${formatToCLP(margenTotal)}</div>
                <div><span class="font-semibold text-gray-300">Observaciones:</span> ${info.observaciones}</div>
                <div>
                    <span class="font-semibold text-gray-300">Estado:</span> 
                    <span style="color: ${color}; font-weight: 700;">${info.estado}</span>
                </div>
            `;
            document.getElementById("info-operacion").innerHTML = infoHTML;

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
                    Total operación: $${formatNumber(info.total)}
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
                        Esta operación fue registrada internamente, pero no fue emitida al SII.
                    </div>
                `;
            }

            const seccionDocumento = document.getElementById("seccion-documento");
            seccionDocumento.innerHTML = documentoTitulo + documentoHTML;

            // Anular operación
            document.getElementById("anular").addEventListener("click", () => {
            if (!confirm("¿Seguro que deseas anular esta operación? Esto revertirá el inventario.")) return;

            fetch(`https://cambiosorion.cl/data/detalle-op.php`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: info.id_operacion })
            })
            .then(res => res.json())
            .then(res => {
                if (res.success) {
                    mostrarModal({
                        titulo: ">✅ Anulación Exitosa",
                        mensaje: "Operación anulada",
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
        document.getElementById("info-operacion").innerHTML = "<p>Error al cargar la operación.</p>";
    });

    const btnNuevoPago = document.getElementById("btn-nuevo-pago");
    const formNuevoPago = document.getElementById("form-nuevo-pago");

    btnNuevoPago.addEventListener("click", () => {
        const isHidden = formNuevoPago.classList.contains("hidden");

        formNuevoPago.classList.toggle("hidden");

        if (isHidden) {
            btnNuevoPago.textContent = "Cancelar Pago";
            document.getElementById("titulo-pago").textContent = "Nuevo Pago";

            const tipoOperacion = info.tipo_transaccion; // "Compra" o "Venta"
            const quienPaga = document.getElementById("origen-pago").value; // "cliente" u "orion"

            if (!quienPaga) {
                mostrarModal({
                    titulo: "⚠️ Selecciona un origen",
                    mensaje: "Debes seleccionar si el pago es del cliente o de Orion.",
                    textoConfirmar: "Entendido"
                });
                return;
            }

            cargarDivisas(id, tipoOperacion, quienPaga);

        } else {
            btnNuevoPago.textContent = "Nuevo Pago";
            document.getElementById("titulo-pago").textContent = "Pagos";
        }
    });

    async function cargarDivisas(operacionId, tipoOperacion, quienPaga) {
        const divisaSelect = document.getElementById("divisa-select");

        try {
            const res = await fetch(`https://cambiosorion.cl/data/detalle-op.php?buscar_divisas=1&operacion_id=${operacionId}`);
            const divisas = await res.json();

            // Limpiar select
            divisaSelect.innerHTML = '<option value="">Seleccione una divisa</option>';

            // Filtrar según lógica de negocio
            const divisasFiltradas = divisas.filter(divisa => {
                const esCLP = divisa.id === "D47";

                if (tipoOperacion === "Compra" && quienPaga === "Orion") {
                    return esCLP;
                } else if (tipoOperacion === "Compra" && quienPaga === "Cliente") {
                    return !esCLP;
                } else if (tipoOperacion === "Venta" && quienPaga === "Orion") {
                    return !esCLP;
                } else if (tipoOperacion === "Venta" && quienPaga === "Cliente") {
                    return esCLP;
                }

                return false; // Por seguridad, si no calza con ningún caso.
            });

            // Agregar al select
            divisasFiltradas.forEach(divisa => {
                const option = document.createElement("option");
                option.value = divisa.id;
                option.textContent = divisa.nombre;
                divisaSelect.appendChild(option);
            });

        } catch (err) {
            console.error("Error al cargar divisas:", err);
            divisaSelect.innerHTML = '<option value="">Error al cargar</option>';
        }
    }
    
    document.querySelectorAll(".origen-card").forEach(card => {
        card.addEventListener("click", () => {
            document.getElementById("origen-pago").value = card.dataset.origen;

            document.querySelectorAll(".origen-card").forEach(c => {
                c.classList.remove("border-blue-500", "bg-blue-600", "text-white");
                c.classList.add("border-gray-500", "bg-transparent", "text-gray-300");
            });

            card.classList.remove("border-gray-500", "bg-transparent", "text-gray-300");
            card.classList.add("border-blue-500", "bg-blue-600", "text-white");

            // 👇 Esta línea fuerza la recarga del select cuando se elige un origen
            const tipoOperacion = info?.tipo_transaccion;
            if (tipoOperacion && id) {
                cargarDivisas(id, tipoOperacion, card.dataset.origen);
            }
        });
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
    window.location.href = "https://tesoreria.cambiosorion.cl/operaciones";
  };
}