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

            // Mostrar info general de la operación
            const info = data.operacion;
            const infoHTML = `
                <div><span class="font-semibold text-gray-300">Número de operación:</span> ${info.numero_operacion}</div>
                <div><span class="font-semibold text-gray-300">Código:</span> ${info.codigo_operacion}</div>
                <div><span class="font-semibold text-gray-300">Cliente:</span> ${info.cliente}</div>
                <div><span class="font-semibold text-gray-300">Total:</span> $${info.total.toLocaleString()}</div>
            `;
            document.getElementById("info-operacion").innerHTML = infoHTML;

            // Mostrar detalles de divisas
            const detallesHTML = data.detalles.map(det => `
                <div class="p-4 rounded-lg bg-white shadow-md border border-gray-200 text-gray-800">
                    <div class="mb-1"><span class="font-medium text-gray-600">Divisa:</span> ${det.divisa}</div>
                    <div class="mb-1"><span class="font-medium text-gray-600">Monto:</span> ${det.monto}</div>
                    <div class="mb-1"><span class="font-medium text-gray-600">Tasa de cambio:</span> ${det.tasa_cambio}</div>
                    <div><span class="font-medium text-gray-600">Subtotal:</span> $${det.subtotal}</div>
                </div>
            `).join("");

            document.getElementById("detalle-divisas").innerHTML = detallesHTML;
        })
        .catch(err => {
            console.error(err);
            document.getElementById("info-operacion").innerHTML = "<p>Error al cargar la operación.</p>";
        });
});
