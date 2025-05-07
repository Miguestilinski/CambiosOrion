document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    if (!id) {
        document.getElementById("info-cliente").innerHTML = "<p>ID de cliente no proporcionado.</p>";
        return;
    }

    fetch(`https://cambiosorion.cl/data/detalle-cl.php?id=${id}`)
        .then(async res => {
            const text = await res.text();
            console.log("Respuesta cruda cliente:", text);
            return JSON.parse(text);
        })    
        .then(data => {
            if (data.error) {
                document.getElementById("info-cliente").innerHTML = `<p>${data.error}</p>`;
                return;
            }

            const cliente = data.cliente;

            const infoHTML = `
                <div><span class="font-semibold text-gray-300">Razón social:</span> ${cliente.razon_social}</div>
                <div><span class="font-semibold text-gray-300">RUT:</span> ${cliente.rut}</div>
                <div><span class="font-semibold text-gray-300">Email:</span> ${cliente.email}</div>
                <div><span class="font-semibold text-gray-300">Teléfono:</span> ${cliente.telefono}</div>
                <div><span class="font-semibold text-gray-300">Dirección:</span> ${cliente.direccion}</div>
            `;
            document.getElementById("info-cliente").innerHTML = infoHTML;

            const formatNumber = (num) => {
                const n = parseFloat(num);
                if (isNaN(n)) return num;
                return n.toLocaleString('es-CL', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 3
                });
            };

            const operacionesHTML = data.operaciones.map(op => `
                <div class="p-4 rounded-lg bg-white shadow-md border border-gray-200 text-gray-800">
                    <div><span class="font-medium text-gray-600">Número operación:</span> ${op.id}</div>
                    <div><span class="font-medium text-gray-600">Código:</span> ${op.codigo_operacion}</div>
                    <div><span class="font-medium text-gray-600">Total:</span> $${formatNumber(op.total)}</div>
                    <div><span class="font-medium text-gray-600">Fecha:</span> ${op.fecha}</div>
                    <a href="detalle-op.html?id=${op.id}" class="mt-2 inline-block bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">
                        Ver operación
                    </a>
                </div>
            `).join("");

            document.getElementById("detalle-operaciones-cliente").innerHTML = operacionesHTML;
        })
        .catch(err => {
            console.error(err);
            document.getElementById("info-cliente").innerHTML = "<p>Error al cargar el cliente.</p>";
        });
});
