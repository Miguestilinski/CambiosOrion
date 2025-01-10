let preciosAnteriores = {};

// Crear la conexión al servidor SSE
let eventSource;

// Función para establecer la conexión
function initSSE() {
  eventSource = new EventSource('https://cambiosorion.cl/api/divisas/stream/stream_divisas.php');

  eventSource.onopen = () => {
    console.log('Conectado al servidor SSE');
  };

  eventSource.onmessage = (event) => {
    try {
      const responseData = JSON.parse(event.data);
      processData(responseData);
    } catch (error) {
      console.error('Error al procesar datos SSE:', error);
    }
  };

  eventSource.onerror = (error) => {
    console.error('Error en la conexión SSE:', error);

    if (eventSource.readyState === EventSource.CLOSED) {
      console.log('Conexión cerrada. Intentando reconectar...');
      setTimeout(initSSE, 5000); // Intentar reconectar cada 5 segundos
    }
  };
}

// Procesar los datos de divisas y actualizar la UI
function processData(data) {
  const currencyList = document.getElementById("currency-list");
  currencyList.innerHTML = ''; // Limpiar la lista anterior para reconstruirla

  let cambiosDetectados = false;

  const divisasOrdenadas = [
    "USD", "EUR", "ARS", "BRL", "PEN", "COP",
    "UYU", "BOB", "CAD", "GBP", "JPY", "GNY",
    "SEK", "AUD", "MXN", "NZD", "CHF", "DKK",
    "ORO 100"
  ];

  divisasOrdenadas.forEach((key) => {
    const divisa = data.find(d => d.nombre === key);

    if (divisa && divisa.compra && divisa.venta && divisa.icono_circular) {
      const { icono_circular, compra, venta } = divisa;

      if (preciosAnteriores[key]) {
        if (preciosAnteriores[key].compra !== compra || preciosAnteriores[key].venta !== venta) {
          cambiosDetectados = true;
        }
      }

      // Guardar los datos actuales para futuras comparaciones
      preciosAnteriores[key] = { compra, venta };

      const row = document.createElement("tr");
      const formattedCompra = removeTrailingZeros(compra);
      const formattedVenta = removeTrailingZeros(venta);

      row.innerHTML = `
        <td class="icono"><img src="${icono_circular}" alt="${key} icon"></td>
        <td class="nombre">${key}</td>
        <td class="compra">${formattedCompra}</td>
        <td class="venta">${formattedVenta}</td>
      `;

      currencyList.appendChild(row);
    } else {
      console.warn(`Divisa no encontrada en los datos: ${key}`);
    }
  });

  if (cambiosDetectados) {
    try {
      const priceAlert = new Audio('/orionapp/sounds/alert.mp3');
      priceAlert.play().catch(error => console.error("Error al reproducir el sonido de alerta:", error));
    } catch (error) {
      console.error("No se pudo reproducir el sonido de alerta:", error);
    }
  }
}

function removeTrailingZeros(value) {
  if (value === null || value === undefined) return '';
  const floatValue = parseFloat(value);
  return floatValue.toString();
}

// Iniciar la conexión SSE al cargar la página
document.addEventListener('DOMContentLoaded', () => {
  initSSE();
});
