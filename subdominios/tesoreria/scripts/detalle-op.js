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

            // Mostrar info general de la operación
            const info = data.operacion;
            const totalOperacion = parseFloat(info.total);
            let abonado = parseFloat(info.monto_pagado || 0);
            let restante = totalOperacion - abonado;

            document.getElementById("estado-actual").textContent = info.estado;

            if (abonado > 0) {
                document.getElementById("seccion-abonos").style.display = "block";
                const lista = document.getElementById("lista-abonos");

                // Supongamos que `data.abonos` es un array con abonos previos.
                if (Array.isArray(data.abonos)) {
                    data.abonos.forEach(a => {
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

            const inputPago = document.getElementById("input-pago");
            const btnPago = document.getElementById("btn-registrar-pago");

            inputPago.placeholder = `Monto sugerido: $${formatNumber(restante)}`;

            if (info.estado === "Pagado") {
                inputPago.disabled = true;
                btnPago.disabled = true;
                btnPago.textContent = "Pagado";
            }

            btnPago.addEventListener("click", () => {
                const montoIngresado = parseFloat(inputPago.value || "0");

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
                        abono: montoIngresado
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
                <div><span class="font-semibold text-gray-300">Número de operación:</span> ${info.numero_operacion}</div>
                <div><span class="font-semibold text-gray-300">Código:</span> ${info.codigo_operacion}</div>
                <div><span class="font-semibold text-gray-300">Cliente:</span> ${info.cliente}</div>
            `;
            document.getElementById("info-operacion").innerHTML = infoHTML;

            // Mostrar detalles de divisas
            const detallesHTML = data.detalles.map(det => `
                <div class="p-4 rounded-lg bg-white shadow-md border border-gray-200 text-gray-800">
                    <div class="mb-1"><span class="font-medium text-gray-600">Divisa:</span> ${det.divisa}</div>
                    <div class="mb-1"><span class="font-medium text-gray-600">Monto:</span> ${formatNumber(det.monto)}</div>
                    <div class="mb-1"><span class="font-medium text-gray-600">Tasa de cambio:</span> ${formatNumber(det.tasa_cambio)}</div>
                    <div><span class="font-medium text-gray-600">Subtotal:</span> $${formatNumber(det.subtotal)}</div>
                </div>
            `).join("");

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

            document.getElementById("select-estado").value = info.estado;

            if (info.estado === "Abonado") {
            document.getElementById("seccion-abono").style.display = "block";
            document.getElementById("input-abono").value = info.monto_pagado;
            }

            // Mostrar o esconder abono según selección
            document.getElementById("select-estado").addEventListener("change", (e) => {
            const val = e.target.value;
            document.getElementById("seccion-abono").style.display = val === "Abonado" ? "block" : "none";
            });

            // Guardar cambio de estado
            document.getElementById("btn-guardar-estado").addEventListener("click", () => {
            const estado = document.getElementById("select-estado").value;
            const abono = parseFloat(document.getElementById("input-abono").value || 0);

            if (estado === "Abonado" && (isNaN(abono) || abono <= 0 || abono > parseFloat(info.total))) {
                alert("Monto de abono inválido.");
                return;
            }

            fetch(`https://cambiosorion.cl/data/detalle-op.php`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                id: info.id_operacion,
                estado,
                abono
                })
            })
            .then(res => res.json())
            .then(res => {
                if (res.success) {
                alert("Estado actualizado.");
                location.reload();
                } else {
                alert("Error al actualizar: " + res.message);
                }
            });
            });

            // Anular operación
            document.getElementById("btn-anular").addEventListener("click", () => {
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
});
