let alertaStep = 1;
let alertaData = {};

// Mostrar/ocultar form
const alertaBtn = document.getElementById("alertaBtn");
const alertaSection = document.getElementById("alerta-section");
const alertaWrapper = document.getElementById("alerta-wrapper");

alertaBtn.addEventListener("click", (e) => {
  e.preventDefault();
  if (alertaWrapper.classList.contains("max-h-0")) {
    alertaWrapper.classList.remove("max-h-0");
    alertaWrapper.classList.add("max-h-[1000px]");
  } else {
    alertaWrapper.classList.add("max-h-0");
    alertaWrapper.classList.remove("max-h-[1000px]");
  }
});

const prevBtn = document.getElementById("alerta-prev");
const nextBtn = document.getElementById("alerta-next");

prevBtn.addEventListener("click", () => {
  if (alertaStep > 1) {
    alertaStep--;
    updateAlertaStepper();
  }
});

nextBtn.addEventListener("click", () => {
  if (alertaStep < 3) {
    alertaStep++;
    updateAlertaStepper();
  }
});

// Mostrar/ocultar botones según paso
function updateAlertaStepper() {
  for (let i = 1; i <= 3; i++) {
    const stepElem = document.getElementById(`alerta-stepper-${i}`);
    const stepContent = document.getElementById(`alerta-step-${i}`);

    if (i === alertaStep) {
      stepElem.classList.add("text-blue-600", "font-semibold");
      stepElem.classList.remove("text-gray-500");
      stepContent.classList.remove("hidden");
    } else {
      stepElem.classList.remove("text-blue-600", "font-semibold");
      stepElem.classList.add("text-gray-500");
      stepContent.classList.add("hidden");
    }
  }

  // Botones
  prevBtn.classList.toggle("hidden", alertaStep === 1);
  nextBtn.classList.toggle("hidden", alertaStep === 1 || alertaStep === 3);
}

// Ir al siguiente paso
function nextAlertaStep() {
  if (alertaStep < 3) {
    alertaStep++;
    updateAlertaStepper();
  }
}

// Paso 1: cargar divisas desde SSE en dropdown estilo conversor
function loadAlertaCurrenciesFromArray() {
    const dropdown = document.getElementById("alerta-divisa-dropdown");
    const ul = dropdown.querySelector("ul");
    const preciosCard = document.getElementById("alerta-precios-card");

    if (!window.exchangeRates) {
        console.error("No existe exchangeRates, asegúrate de que index.js se cargue primero");
        return;
    }

    ul.innerHTML = "";

    Object.keys(exchangeRates).forEach(nombre => {
        const divisa = exchangeRates[nombre];

        const li = document.createElement("li");

        li.innerHTML = `
            <a href="#" class="flex items-center">
                <img src="${divisa.icono}" alt="${nombre}">
                <span>${nombre}</span>
            </a>
        `;

        li.addEventListener("click", (e) => {
            e.preventDefault();

            // guardar en memoria
            alertaData.divisa = nombre;
            alertaData.icono = divisa.icono;

            // mostrar card con precios
            preciosCard.innerHTML = `
                <div class="flex items-center mb-2">
                    <img src="${divisa.icono}" class="w-6 h-6 mr-2">
                    <span class="font-bold">${nombre}</span>
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
            preciosCard.classList.remove("hidden");

            preciosCard.querySelectorAll("button").forEach(btn => {
                btn.addEventListener("click", () => {
                    alertaData.tipoPrecio = btn.dataset.precio;
                    alertaData.precioRef = parseFloat(btn.dataset.valor);
                    nextAlertaStep(); // avanza automáticamente
                });
            });
        });

        ul.appendChild(li);
    });
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
loadAlertaCurrenciesFromArray(); 
