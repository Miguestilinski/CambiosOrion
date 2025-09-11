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

  // Actualizar resumen del Step 2
  if (alertaStep === 2) {
      const summary = document.getElementById("alerta-step-2-summary");
      if (alertaData.divisa && alertaData.tipoPrecio) {
          const tipoTexto = alertaData.tipoPrecio.charAt(0).toUpperCase() + alertaData.tipoPrecio.slice(1);
          summary.textContent = `Has seleccionado: ${alertaData.divisa} (${tipoTexto})`;
      } else {
          summary.textContent = "Selecciona una divisa y un tipo de precio en el paso anterior.";
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

function hideAlertaDropdown() {
    const dropdown = document.getElementById("alerta-divisa-dropdown");
    dropdown.classList.add("hidden");
}

// Abrir dropdown (centrado horizontalmente respecto al botón)
function showAlertaDropdown() {
    const button = document.getElementById("alerta-divisa-button");
    const dropdown = document.getElementById("alerta-divisa-dropdown");

    // Asegurar que esté en body para posicionarlo respecto a viewport
    if (!dropdown.parentElement.isSameNode(document.body)) {
        document.body.appendChild(dropdown);
    }

    // --- Quitar clases de Tailwind que pueden interferir con el posicionamiento calculado
    ['left-1/2', '-translate-x-1/2', 'top-full', 'mt-1', 'ml-6'].forEach(c => {
        if (dropdown.classList.contains(c)) dropdown.classList.remove(c);
    });

    // Obtener rect del botón
    const rect = button.getBoundingClientRect();

    // Para medir el tamaño real del dropdown (si está oculto por `hidden`, offsetWidth = 0)
    const wasHidden = dropdown.classList.contains('hidden');
    let prevVisibility = dropdown.style.visibility;
    if (wasHidden) {
        // Mostrarlo pero invisible para medir
        dropdown.classList.remove('hidden');
        dropdown.style.visibility = 'hidden';
    }

    // Medir
    const dropdownWidth = dropdown.offsetWidth || rect.width;
    const dropdownHeight = dropdown.offsetHeight || 0;

    // Restaurar visibilidad previa (si lo dejamos visible para medir lo volveremos a mostrar abajo)
    dropdown.style.visibility = prevVisibility || '';
    // Si estaba hidden, lo volveremos a mostrar después de posicionarlo

    // Calcular left para centrar horizontalmente respecto al botón
    let left = rect.left + window.scrollX + (rect.width - dropdownWidth) / 2;
    let top = rect.bottom + window.scrollY + 6; // un pequeño gap (6px) bajo el botón

    // Evitar que se salga del viewport (padding de 8px)
    const minLeft = 8 + window.scrollX;
    const maxLeft = window.innerWidth - dropdownWidth - 8 + window.scrollX;
    left = Math.max(minLeft, Math.min(left, maxLeft));

    // Aplicar estilos en línea (esto anula utilidades de Tailwind como left-1/2)
    dropdown.style.position = 'absolute';
    dropdown.style.left = `${left}px`;
    dropdown.style.top = `${top}px`;
    dropdown.style.zIndex = '9999';

    // Si quieres que tenga el mismo ancho que el botón, descomenta:
    // dropdown.style.width = `${rect.width}px`;

    // Finalmente mostrarlo (si estaba hidden)
    if (wasHidden) {
        dropdown.classList.remove('hidden');
        dropdown.style.visibility = '';
    }

    // Cerrar al click fuera
    function handleClickOutside(e) {
        if (!dropdown.contains(e.target) && !button.contains(e.target)) {
            hideAlertaDropdown();
            document.removeEventListener("click", handleClickOutside);
        }
    }
    // Registrar listener (se quita dentro de handleClickOutside)
    document.addEventListener("click", handleClickOutside);
}

// Manejar selección de divisa
function selectAlertaCurrency(nombre, icono) {
    const button = document.getElementById("alerta-divisa-button");
    const text = document.getElementById("alerta-currency-text");
    const icon = document.getElementById("alerta-icon");
    const container = document.getElementById("alerta-divisa-container");

    // Cambiar texto e icono
    text.textContent = nombre;
    icon.src = icono;
    icon.classList.remove("hidden");

    // Cambiar ancho del contenedor (200px → 150px)
    container.classList.remove("w-[200px]");
    container.classList.add("w-[150px]");

    // Ocultar dropdown
    hideAlertaDropdown();
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
            <a href="#" class="flex items-center hover:bg-gray-100 inline-block"
            onclick="selectAlertaCurrency('${nombre}', '${divisa.icono}')">
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
                <div class="flex gap-3">
                    <button 
                        class="bg-[#1e3a8a] hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow w-full text-center leading-tight"
                        data-precio="compra" 
                        data-valor="${divisa.compra}">
                        <div class="font-semibold">Compra:</div>
                        <div>${Math.round(divisa.compra).toLocaleString("es-CL")} CLP</div>
                    </button>
                    <button 
                        class="bg-[#1e3a8a] hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow w-full text-center leading-tight"
                        data-precio="venta" 
                        data-valor="${divisa.venta}">
                        <div class="font-semibold">Venta:</div>
                        <div>${Math.round(divisa.venta).toLocaleString("es-CL")} CLP</div>
                    </button>
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
