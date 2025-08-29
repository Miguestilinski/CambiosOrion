// Función para obtener parámetros de la URL
function getParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

// Función para formatear fecha dd-mm-yyyy
function formatFecha(fechaStr) {
    const fecha = new Date(fechaStr);
    const dia = String(fecha.getDate()).padStart(2, '0');
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const anio = fecha.getFullYear();
    return `${dia}-${mes}-${anio}`;
}

// Función para formatear hora 12h con AM/PM
function formatHora(horaStr) {
    const fecha = new Date(`1970-01-01T${horaStr}`);
    let horas = fecha.getHours();
    const minutos = String(fecha.getMinutes()).padStart(2, '0');
    const ampm = horas >= 12 ? 'PM' : 'AM';
    horas = horas % 12;
    horas = horas ? horas : 12; // 0 → 12
    return `${horas}:${minutos} ${ampm}`;
}


async function cargarReserva() {
    const code = getParam("code");
    const container = document.getElementById("reserva-container");

    if (!code) {
        container.innerHTML = "<p class='text-red-500'>❌ No se especificó un código de reserva.</p>";
        return;
    }

    try {
        const response = await fetch(`https://cambiosorion.cl/data/detalle-reserva.php?code=${code}`);
        if (!response.ok) throw new Error("Error al obtener los datos");

        const text = await response.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.error("Respuesta no es JSON válido:", text);
            throw e;
        }

        // Renderizar con estilos
        container.innerHTML = `
            <h2 class="text-2xl font-semibold mb-4">Reserva ${data.codigo_reserva}</h2>
            
            <div class="space-y-2">
                <p><span class="font-medium">👤 Cliente:</span> ${data.cliente}</p>
                <p><span class="font-medium">📅 Fecha:</span> ${formatFecha(data.fecha)}</p>
                <p><span class="font-medium">🕒 Hora:</span> ${formatHora(data.hora)}</p>
                <p><span class="font-medium">💼 Operación:</span> ${data.tipo_operacion}</p>
                <p><span class="font-medium">💱 Divisa:</span> ${data.divisa_nombre} (${data.divisa_codigo})</p>
                <p><span class="font-medium">💸 Pagas:</span> ${data.total_formateado}</p>
                <p><span class="font-medium">💰 Recibes:</span> ${data.monto_formateado}</p>
                <p><span class="font-medium">🔢 Tasa de cambio:</span> ${data.tasa_cambio_formateada} CLP</p>
                <p><span class="font-medium">📌 Estado:</span> <span class="font-semibold">${data.estado}</span></p>
            </div>
        `;
    } catch (error) {
        container.innerHTML = `<p class="text-red-500">⚠️ Error al cargar la reserva.</p>`;
        console.error(error);
    }
}

cargarReserva();