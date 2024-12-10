let preciosAnteriores = {};

// Crear la conexión al servidor SSE
let eventSource;

// Función para establecer la conexión
function initSSE() {
  eventSource = new EventSource('https://cambiosorion.cl/api/divisas/stream');

  eventSource.onopen = () => {
    console.log('Conectado al servidor SSE');
  };

  eventSource.onmessage = (event) => {
    try {
      const responseData = JSON.parse(event.data);
      console.log('Datos SSE recibidos:', responseData);
      processData(responseData);
    } catch (error) {
      console.error('Error al procesar los datos SSE:', error);
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
  const highlightedList = document.getElementById("highlighted-currencies");
  const normalList = document.getElementById("normal-currencies");

  // Limpiar las listas anteriores para reconstruirlas
  highlightedList.innerHTML = '';
  normalList.innerHTML = '';

  let cambiosDetectados = false;

  const divisasFiltradas = ["USD", "EUR", "BRL", "ARS", "PEN", "MXN", "ORO 100"];

  divisasFiltradas.forEach((key) => {
    const divisa = data.find(d => d.nombre === key);

    if (divisa && divisa.compra && divisa.venta && divisa.icono_circular) {
      const { icono_circular, compra, venta } = divisa;

      if (preciosAnteriores[key] && (preciosAnteriores[key].compra !== compra || preciosAnteriores[key].venta !== venta)) {
        cambiosDetectados = true;
      }

      preciosAnteriores[key] = { compra, venta };

      const row = document.createElement("tr");
      const formattedCompra = removeTrailingZeros(compra);
      const formattedVenta = removeTrailingZeros(venta);

      if (key === "USD" || key === "EUR") {
        row.classList.add('divisa-destacada');
        row.innerHTML = `
          <td class="icono">
            <span class="nombre">${key}</span>
            <img src="${icono_circular}" alt="${key} icon">
          </td>
          <td class="espacio"></td>
          <td class="compra">${formattedCompra}</td>
          <td class="venta">${formattedVenta}</td>
        `;
        highlightedList.appendChild(row);
      } else {
        row.classList.add('divisa-normal');
        row.innerHTML = `
          <td class="icono"><img src="${icono_circular}" alt="${key} icon"></td>
          <td class="nombre">${key}</td>
          <td class="compra">${formattedCompra}</td>
          <td class="venta">${formattedVenta}</td>
        `;
        normalList.appendChild(row);
      }
    }
  });

  // Reproducir alerta solo si se detectaron cambios significativos en los datos
  if (cambiosDetectados) {
    try {
      const priceAlert = new Audio('/orionapp/sounds/alert.mp3');
      priceAlert.play().catch(error => console.error("Error al reproducir la alerta:", error));
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
