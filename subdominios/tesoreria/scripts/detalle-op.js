document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

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
            const info = data.operacion;
            const color = colorEstado(info.estado);
            const totalOperacion = parseFloat(info.total);
            let abonado = parseFloat(info.monto_pagado || 0);
            let restante = totalOperacion - abonado;

            // --- Funcionalidad Botón Exportar PDF ---
            document.getElementById("exportar-pdf").addEventListener("click", () => {
                // Abre el PDF en una nueva pestaña
                if (info.numero_documento) {
                    const urlPDF = `https://cambiosorion.cl/documentos/${info.numero_documento}.pdf`;
                    window.open(urlPDF, "_blank");
                } else {
                    alert("No hay documento emitido para exportar PDF.");
                }
            });

            // --- Funcionalidad Botón Emitir Documento SII ---
            document.getElementById("emitir-doc").addEventListener("click", () => {
                if (info.estado === "Anulado") {
                    alert("No se puede emitir documento para una operación anulada.");
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
                            alert("Documento emitido correctamente.");
                            location.reload();
                        } else {
                            alert("Error al emitir documento: " + res.message);
                        }
                    })
                    .catch(() => {
                        alert("Error de conexión al emitir documento.");
                    });
                }
            });

            // --- Funcionalidad Botón Anular (el rojo en la fila superior) ---
            document.getElementById("anular").addEventListener("click", () => {
                if (info.estado === "Anulado") {
                    alert("La operación ya está anulada.");
                    return;
                }
                if (confirm("¿Seguro que deseas anular esta operación? Esto revertirá el inventario.")) {
                    fetch(`https://cambiosorion.cl/data/anular-op.php`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ id: info.id_operacion })
                    })
                    .then(res => res.json())
                    .then(res => {
                        if (res.success) {
                            alert("Operación anulada.");
                            location.reload();
                        } else {
                            alert("Error al anular: " + res.message);
                        }
                    })
                    .catch(() => {
                        alert("Error de conexión al anular operación.");
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

            function renderTabla(contenedor, titulo, pagos) {
                if (pagos.length === 0) {
                    contenedor.innerHTML = `<p class="text-gray-400 italic">No se han realizado pagos de ${titulo.toLowerCase()}.</p>`;
                    return;
                }

                const tabla = document.createElement("table");
                tabla.className = "w-full text-left text-gray-200 border-collapse";

                tabla.innerHTML = `
                    <thead class="text-sm border-b border-gray-500">
                        <tr>
                            <th colspan="4" class="py-2 text-lg font-semibold">${titulo}</th>
                        </tr>
                        <tr>
                            <th class="py-2">Fecha</th>
                            <th class="py-2">Tipo</th>
                            <th class="py-2">Divisa</th>
                            <th class="py-2">Monto</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${pagos.map(p => `
                            <tr class="border-b border-gray-700">
                                <td class="py-1">${p.fecha}</td>
                                <td class="py-1">${p.tipo || '—'}</td>
                                <td class="py-1">${p.divisa || 'CLP'}</td>
                                <td class="py-1">$${formatNumber(p.monto)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                `;

                contenedor.innerHTML = "";
                contenedor.appendChild(tabla);
            }

            renderTabla(contenedorCliente, "Pagos de Cliente", pagosCliente);
            renderTabla(contenedorOrion, "Pagos de Orion", pagosOrion);

            const inputPago = document.getElementById("input-pago");
            const btnPago = document.getElementById("btn-registrar-pago");

            inputPago.placeholder = `$${formatNumber(restante)}`;

            if (info.estado === "Pagado") {
                inputPago.disabled = true;
                btnPago.disabled = true;
                btnPago.textContent = "Pagado";
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
                // Extraemos sólo números del input
                const rawValue = inputPago.value;
                const numericString = rawValue.replace(/[^0-9]/g, "");

                if (!numericString) {
                    alert("Monto inválido");
                    return;
                }

                const montoIngresado = parseFloat(numericString);

                if (isNaN(montoIngresado) || montoIngresado <= 0) {
                    alert("Monto inválido");
                    return;
                }

                if (montoIngresado > restante) {
                    alert("El monto excede lo pendiente");
                    return;
                }

                // Nuevo estado
                let nuevoEstado = "Abonado";
                if (montoIngresado === restante) {
                    nuevoEstado = "Pagado";
                }

                fetch(`https://cambiosorion.cl/data/detalle-op.php`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        id: info.id_operacion,
                        estado: nuevoEstado,
                        pagos: montoIngresado,
                        tipo: document.getElementById("tipo-pago").value,
                        divisa: document.getElementById("divisa").value
                    })
                })
                .then(res => res.json())
                .then(res => {
                    if (res.success) {
                        alert("Pago registrado correctamente");
                        location.reload();
                    } else {
                        alert("Error al registrar: " + res.message);
                    }
                });
            });

            const infoHTML = `
                <div><span class="font-semibold text-gray-300">Número de operación:</span> ${info.id}</div>
                <div><span class="font-semibold text-gray-300">Código:</span> ${info.codigo_operacion}</div>
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
                alert("Operación anulada.");
                location.reload();
                } else {
                alert("Error al anular: " + res.message);
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

        // Mostrar u ocultar el formulario
        formNuevoPago.classList.toggle("hidden");

        // Cambiar el texto del botón y del título
        if (isHidden) {
            btnNuevoPago.textContent = "Cancelar Pago";
            document.getElementById("titulo-pago").textContent = "Nuevo Pago";
        } else {
            btnNuevoPago.textContent = "Nuevo Pago";
            document.getElementById("titulo-pago").textContent = "Pagos";
        }
        
        cargarDivisas(id);
    });

    async function cargarDivisas(operacionId) {
        const divisaSelect = document.getElementById("divisa-select");

        try {
            const res = await fetch(`https://cambiosorion.cl/data/detalle-op.php?buscar_divisas=1&operacion_id=${operacionId}`);
            const divisas = await res.json();

            // Limpiar y agregar opciones
            divisaSelect.innerHTML = '<option value="">Seleccione una divisa</option>';
            divisas.forEach(divisa => {
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
        });
    });


});