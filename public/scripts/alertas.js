let alertaStep = 1;
let alertaData = {};

// Mostrar/ocultar form
const alertaBtn = document.getElementById("alertaBtn");
const alertaSection = document.getElementById("alerta-section");
alertaBtn.addEventListener("click", (e) => {
  e.preventDefault();
  alertaSection.classList.toggle("hidden");
  alertaSection.scrollIntoView({ behavior: "smooth" });
});

// Actualizar stepper UI
function updateAlertaStepper() {
  for (let i = 1; i <= 3; i++) {
    const stepElem = document.getElementById(`alerta-stepper-${i}`);
    if (i === alertaStep) {
      stepElem.classList.add("text-blue-600", "font-semibold");
      stepElem.classList.remove("text-gray-500");
      document.getElementById(`alerta-step-${i}`).classList.remove("hidden");
    } else {
      stepElem.classList.remove("text-blue-600", "font-semibold");
      stepElem.classList.add("text-gray-500");
      document.getElementById(`alerta-step-${i}`).classList.add("hidden");
    }
  }
}

// Ir al siguiente paso
function nextAlertaStep() {
  if (alertaStep < 3) {
    alertaStep++;
    updateAlertaStepper();
  }
}

// Paso 1: cargar divisas desde SSE
function loadAlertaCurrencies() {
  const eventSource = new EventSource('https://cambiosorion.cl/api/stream/stream_divisas.php');
  const divisaList = document.getElementById("alerta-divisa-list");

  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (!Array.isArray(data)) return;

    divisaList.innerHTML = "";
    data.forEach(divisa => {
      const card = document.createElement("div");
      card.className = "p-4 border rounded-lg shadow cursor-pointer hover:bg-gray-50";
      card.innerHTML = `
        <div class="flex items-center mb-2">
          <img src="${divisa.icono_circular}" class="w-6 h-6 mr-2">
          <span class="font-bold">${divisa.nombre}</span>
        </div>
        <div class="flex justify-between">
          <button class="bg-green-100 px-3 py-1 rounded text-sm" data-precio="compra" data-valor="${divisa.compra}">
            Compra: ${Math.round(divisa.compra)} CLP
          </button>
          <button class="bg-red-100 px-3 py-1 rounded text-sm" data-precio="venta" data-valor="${divisa.venta}">
            Venta: ${Math.round(divisa.venta)} CLP
          </button>
        </div>
      `;

      // cuando selecciona compra o venta → pasa al paso 2
      card.querySelectorAll("button").forEach(btn => {
        btn.addEventListener("click", () => {
          alertaData.divisa = divisa.nombre;
          alertaData.tipoPrecio = btn.dataset.precio;
          alertaData.precioRef = parseFloat(btn.dataset.valor);
          nextAlertaStep();
        });
      });

      divisaList.appendChild(card);
    });
  };
}

// Paso 3: guardar alerta
document.getElementById("guardar-alerta").addEventListener("click", async () => {
  alertaData.condicion = document.getElementById("alerta-condicion").value;
  alertaData.valor = parseFloat(document.getElementById("alerta-valor").value);
  alertaData.nombre = document.getElementById("alerta-nombre").value.trim();
  alertaData.email = document.getElementById("alerta-email").value.trim();

  const statusText = document.getElementById("alerta-status");

  if (!alertaData.valor || !alertaData.nombre || !alertaData.email) {
    statusText.textContent = "❌ Debes completar todos los campos.";
    statusText.style.color = "red";
    return;
  }

  const response = await fetch("/data/alerta.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(alertaData)
  });

  const result = await response.json();
  if (result.success) {
    statusText.textContent = "✅ Alerta guardada, recibirás un correo cuando se cumpla.";
    statusText.style.color = "green";
  } else {
    statusText.textContent = "❌ Hubo un error, intenta más tarde.";
    statusText.style.color = "red";
  }
});

// Init
updateAlertaStepper();
loadAlertaCurrencies();
