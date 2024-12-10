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
    const highlightedList = document.getElementById("highlighted-currencies");
    const normalList = document.getElementById("normal-currencies");
  
    // Limpiar las listas anteriores para reconstruirlas
    highlightedList.innerHTML = '';
    normalList.innerHTML = '';
  
    let cambiosDetectados = false;
  
    // Divisas de interés a mostrar
    const divisasFiltradas = ["USD", "EUR", "BRL", "ARS", "PEN", "MXN", "ORO 100"];
  
    divisasFiltradas.forEach((key) => {
      // Buscar el objeto de divisa en el array de datos
      const divisa = data.find(d => d.nombre === key);
  
      if (divisa && divisa.compra && divisa.venta && divisa.icono_circular) {
        const { icono_circular, compra, venta } = divisa;
  
        // Detectar cambios respecto a datos previos
        if (preciosAnteriores[key] && (preciosAnteriores[key].compra !== compra || preciosAnteriores[key].venta !== venta)) {
          cambiosDetectados = true;
        }
  
        // Guardar datos actuales en precios anteriores para futuras comparaciones
        preciosAnteriores[key] = { compra, venta };
  
        // Crear un nuevo elemento de fila
        const row = document.createElement("tr");
        const formattedCompra = removeTrailingZeros(compra);
        const formattedVenta = removeTrailingZeros(venta);
  
        // Si la divisa es destacada, agregarla a la lista de destacadas
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
          // Caso contrario, agregar a la lista normal
          row.classList.add('divisa-normal');
          row.innerHTML = `
            <td class="icono">
              <img src="${icono_circular}" alt="${key} icon">
            </td>
            <td class="nombre">${key}</td>
            <td class="compra">${formattedCompra}</td>
            <td class="venta">${formattedVenta}</td>
          `;
          normalList.appendChild(row);
        }
      } else {
        console.warn(`Divisa no encontrada en los datos: ${key}`);
      }
    });
  
    if (!cambiosDetectados) {
      console.log("Sin cambios en las divisas comparando con datos previos.");
    }

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
