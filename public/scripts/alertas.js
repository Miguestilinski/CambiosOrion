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

function hideAlertaDropdown() {
    const dropdown = document.getElementById("alerta-divisa-dropdown");
    dropdown.classList.add("hidden");
}

// Abrir dropdown
function showAlertaDropdown() {
    const button = document.getElementById("alerta-divisa-button");
    const dropdown = document.getElementById("alerta-divisa-dropdown");

    // Si ya está en body, no hacemos nada
    if (!dropdown.parentElement.isSameNode(document.body)) {
        document.body.appendChild(dropdown);
    }

    // Posicionar debajo del botón
    const rect = button.getBoundingClientRect();
    dropdown.style.position = 'absolute';
    dropdown.style.top = `${rect.bottom + window.scrollY}px`;
    dropdown.style.left = `${rect.left + window.scrollX}px`;
    dropdown.style.width = `${rect.width}px`;
    dropdown.style.zIndex = 9999;

    dropdown.classList.remove("hidden");

    // Cerrar al click fuera
    function handleClickOutside(e) {
        if (!dropdown.contains(e.target) && !button.contains(e.target)) {
            hideAlertaDropdown();
            document.removeEventListener("click", handleClickOutside);
        }
    }
    document.addEventListener("click", handleClickOutside);
}

// Paso 1: cargar divisas desde SSE en dropdown estilo conversor
function loadAlertaCurrenciesFromArray() {
    const dropdown = document.getElementById("alerta-divisa-dropdown");
    const ul = dropdown.querySelector("ul"); // <-- apunta al <ul>
    const preciosCard = document.getElementById("alerta-precios-card");

    if (!window.exchangeRates) {
        console.error("No existe exchangeRates, asegúrate de que index.js se cargue primero");
        return;
    }

    ul.innerHTML = ""; // limpiar lista de <li>

    Object.keys(exchangeRates).forEach(nombre => {
        const divisa = exchangeRates[nombre];

        const li = document.createElement("li");
        li.innerHTML = `
            <a href="#" class="flex items-center hover:bg-gray-100 inline-block">
                <img src="${divisa.icono}" alt="${nombre}">
                <span>${nombre}</span>
            </a>
        `;
        
        li.addEventListener("click", (e) => {
            e.preventDefault();

            // guardar en memoria
            alertaData.divisa = nombre;
            alertaData.icono = divisa.icono;

            // actualizar botón
            const alertaIcon = document.getElementById("alerta-icon");
            const alertaText = document.getElementById("alerta-currency-text");
            alertaIcon.src = divisa.icono;
            alertaIcon.classList.remove("hidden");
            alertaText.textContent = nombre;

            // mostrar card con precios separado Compra/Venta
            preciosCard.innerHTML = `
                <div class="grid grid-cols-2 gap-4 text-center">
                    <div>
                        <div class="font-semibold mb-1 text-green-700">Compra</div>
                        <button class="bg-green-100 px-3 py-1 rounded text-sm" data-precio="compra" data-valor="${divisa.compra}">
                            ${Math.round(divisa.compra)} CLP
                        </button>
                    </div>
                    <div>
                        <div class="font-semibold mb-1 text-red-700">Venta</div>
                        <button class="bg-red-100 px-3 py-1 rounded text-sm" data-precio="venta" data-valor="${divisa.venta}">
                            ${Math.round(divisa.venta)} CLP
                        </button>
                    </div>
                </div>
            `;
            preciosCard.classList.remove("hidden");

            hideAlertaDropdown(); // cerrar al seleccionar

            // asignar acción a los botones
            preciosCard.querySelectorAll("button").forEach(btn => {
                btn.addEventListener("click", () => {
                    alertaData.tipoPrecio = btn.dataset.precio;
                    alertaData.precioRef = parseFloat(btn.dataset.valor);
                    nextAlertaStep(); // avanza automáticamente
                });
            });
        });

        ul.appendChild(li); // <-- agregar al <ul>
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

window.onCurrenciesLoaded = function() {
    loadAlertaCurrenciesFromArray();
};
