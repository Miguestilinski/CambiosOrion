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
            <p><strong>Número de operación:</strong> ${info.numero_operacion}</p>
            <p><strong>Código:</strong> ${info.codigo_operacion}</p>
            <p><strong>Cliente:</strong> ${info.cliente}</p>
            <p><strong>Total:</strong> $${info.total}</p>
        `;
        document.getElementById("info-operacion").innerHTML = infoHTML;

        // Mostrar detalles de divisas
        const detallesHTML = data.detalles.map(det => `
            <div class="mb-4 p-3 rounded border border-white bg-gray-800">
            <p><strong>Divisa:</strong> ${det.divisa}</p>
            <p><strong>Monto:</strong> ${det.monto}</p>
            <p><strong>Tasa de cambio:</strong> ${det.tasa_cambio}</p>
            <p><strong>Subtotal:</strong> ${det.subtotal}</p>
            </div>
        `).join("");

        document.getElementById("detalle-divisas").innerHTML = detallesHTML;
        })
        .catch(err => {
        console.error(err);
        document.getElementById("info-operacion").innerHTML = "<p>Error al cargar la operación.</p>";
    });
});
