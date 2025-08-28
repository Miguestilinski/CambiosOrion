// Función para obtener parámetros de la URL
function getParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

async function cargarReserva() {
    const code = getParam("code"); // <-- ahora usamos "code"
    const container = document.getElementById("reserva-container");

    if (!code) {
        container.innerHTML = "<p class='text-red-500'>❌ No se especificó un código de reserva.</p>";
        return;
    }

    try {
        // Petición AJAX al backend usando el código
        const response = await fetch(`https://cambiosorion.cl/data/detalle-reserva.php?code=${code}`);
        if (!response.ok) throw new Error("Error al obtener los datos");

        const data = await response.json(); // asumo que devuelves JSON

        // Renderizar los datos
        container.innerHTML = `
            <h2 class="text-xl font-semibold mb-2">Reserva #${data.codigo_reserva}</h2>
            <p><strong>Cliente:</strong> ${data.cliente}</p>
            <p><strong>Fecha:</strong> ${data.fecha}</p>
            <p><strong>Hora:</strong> ${data.hora}</p>
            <p><strong>Operación:</strong> ${data.tipo_operacion}</p>
            <p><strong>Divisa:</strong> ${data.divisa_nombre} (${data.divisa_codigo})</p>
            <p><strong>Pagas:</strong> ${data.total_formateado}</p>
            <p><strong>Recibes:</strong> ${data.monto_formateado}</p>
            <p><strong>Tasa de cambio:</strong> ${data.tasa_cambio_formateada} CLP</p>
            <p><strong>Estado:</strong> <span class="font-medium">${data.estado}</span></p>
        `;
    } catch (error) {
        container.innerHTML = `<p class="text-red-500">⚠️ Error al cargar la reserva.</p>`;
        console.error(error);
    }
}

cargarReserva();