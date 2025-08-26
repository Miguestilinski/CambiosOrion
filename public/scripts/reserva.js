// Función para obtener parámetros de la URL
function getParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

async function cargarReserva() {
    const id = getParam("id");
    const container = document.getElementById("reserva-container");

    if (!id) {
    container.innerHTML = "<p class='text-red-500'>❌ No se especificó un ID de reserva.</p>";
    return;
    }

    try {
    // Petición AJAX al backend
    const response = await fetch(`reserva.php?id=${id}`);
    if (!response.ok) throw new Error("Error al obtener los datos");

    const data = await response.json(); // asumo que devuelves JSON
    // Renderizar los datos
    container.innerHTML = `
        <h2 class="text-xl font-semibold mb-2">Reserva #${data.id}</h2>
        <p><strong>Cliente:</strong> ${data.cliente}</p>
        <p><strong>Fecha:</strong> ${data.fecha}</p>
        <p><strong>Servicio:</strong> ${data.servicio}</p>
        <p><strong>Estado:</strong> <span class="font-medium">${data.estado}</span></p>
    `;
    } catch (error) {
    container.innerHTML = `<p class="text-red-500">⚠️ Error al cargar la reserva.</p>`;
    console.error(error);
    }
}

cargarReserva();