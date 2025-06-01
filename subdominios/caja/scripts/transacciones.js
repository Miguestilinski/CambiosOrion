document.addEventListener("DOMContentLoaded", () => {
    const nuevaTransaccionBtn = document.getElementById('nueva-tr');

    // Redirigir al hacer clic en "Nueva Transaccion"
    if (nuevaTransaccionBtn) {
        nuevaTransaccionBtn.addEventListener('click', () => {
            window.location.href = 'https://caja.cambiosorion.cl/nueva-tr';
        });
    }

    const filtros = {
        fechaInicio: document.getElementById("fecha-inicio"),
        fechaFin: document.getElementById("fecha-fin"),
        emitidas: document.getElementById("emitidas"),
        noEmitidas: document.getElementById("no-emitidas"),
        numero: document.getElementById("numero"),
        cliente: document.getElementById("cliente"),
        tipoDoc: document.getElementById("tipo-doc"),
        nDoc: document.getElementById("n-doc"),
        nNota: document.getElementById("n-nota"),
        tipoTransaccion: document.getElementById("tipo-transaccion"),
        divisa: document.getElementById("divisa"),
        estado: document.getElementById("estado"),
        mostrar: document.getElementById("mostrar-registros"),
        buscar: document.getElementById("buscar")
    };

    const tablaBody = document.querySelector("tbody");

    function cargarTransacciones() {
        const formData = new FormData();

        // Recorre los filtros y los agrega al formData
        for (const [clave, input] of Object.entries(filtros)) {
            if (input.type === "checkbox") {
                formData.append(clave, input.checked ? "1" : "0");
            } else {
                formData.append(clave, input.value.trim());
            }
        }

        fetch("https://cambiosorion.cl/data/transacciones.php", {
            method: "POST",
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            tablaBody.innerHTML = ""; // Limpia la tabla
            if (data.length === 0) {
                tablaBody.innerHTML = `<tr><td colspan="14" class="text-center text-white py-4">No se encontraron resultados.</td></tr>`;
                return;
            }
            data.forEach(tr => {
                const fila = document.createElement("tr");
                fila.className = "border-b border-gray-700 text-gray-700";

                fila.innerHTML = `
                    <td class="px-4 py-2">${tr.fecha}</td>
                    <td class="px-4 py-2">${tr.numero}</td>
                    <td class="px-4 py-2">${tr.cliente}</td>
                    <td class="px-4 py-2">${tr.tipo_doc}</td>
                    <td class="px-4 py-2">${tr.n_doc}</td>
                    <td class="px-4 py-2">${tr.n_nota}</td>
                    <td class="px-4 py-2">${tr.tipo_transaccion}</td>
                    <td class="px-4 py-2">${tr.divisa}</td>
                    <td class="px-4 py-2">${tr.monto}</td>
                    <td class="px-4 py-2">${tr.tasa_cambio}</td>
                    <td class="px-4 py-2">${tr.subtotal}</td>
                    <td class="px-4 py-2">${tr.total}</td>
                    <td class="px-4 py-2">${tr.estado}</td>
                    <td class="px-4 py-2">
                        <button class="text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-sm px-3 py-1">
                            Mostrar
                        </button>
                    </td>
                `;
                tablaBody.appendChild(fila);
            });
        })
        .catch(error => {
            console.error("Error cargando transacciones:", error);
        });
    }

    // Cargar automáticamente al inicio
    cargarTransacciones();

    // Recargar al cambiar cualquier filtro
    Object.values(filtros).forEach(el => {
        el.addEventListener("change", cargarTransacciones);
        el.addEventListener("input", cargarTransacciones);
    });

    // Botón para borrar filtros
    document.getElementById("borrar-filtros").addEventListener("click", () => {
        Object.values(filtros).forEach(input => {
            if (input.type === "checkbox") input.checked = false;
            else input.value = "";
        });
        cargarTransacciones();
    });
});
