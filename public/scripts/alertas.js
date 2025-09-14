let alertaStep = 1;
let alertaData = {};

// Mostrar/ocultar form
const alertaBtn = document.getElementById("alertaBtn");
const alertaSlideBtn = document.getElementById("alertaSlideBtn");
const alertaSection = document.getElementById("alerta-section");
const alertaWrapper = document.getElementById("alerta-wrapper");

function toggleAlertaWrapper(e) {
  e.preventDefault();
  if (alertaWrapper.classList.contains("max-h-0")) {
    alertaWrapper.classList.remove("max-h-0");
    alertaWrapper.classList.add("max-h-[1000px]");
  } else {
    alertaWrapper.classList.add("max-h-0");
    alertaWrapper.classList.remove("max-h-[1000px]");
  }
}

// Reutilizar función para ambos botones
alertaBtn.addEventListener("click", toggleAlertaWrapper);
alertaSlideBtn.addEventListener("click", toggleAlertaWrapper);

const prevBtn = document.getElementById("alerta-prev");
const nextBtn = document.getElementById("alerta-next");

prevBtn.addEventListener("click", () => {
  if (alertaStep > 1) {
    alertaStep--;
    updateAlertaStepper();
  }
});

nextBtn.addEventListener("click", nextAlertaStep);

const condicionLabels = {
  alcanza: "Alcanza el precio",
  sube: "Precio sube sobre",
  baja: "Precio baja a",
  cambio_sobre: "Cambio sobre %",
  cambio_bajo: "Cambio por debajo %",
  cambio_24h_sube: "Cambio en 24h sobre %",
  cambio_24h_baja: "Cambio en 24h por debajo %"
};

const guardarBtn = document.getElementById("guardar-alerta");

// Mostrar/ocultar botones según paso
function updateAlertaStepper() {
  // limpiar errores cada vez que se cambia de paso
  errorText.classList.add("hidden");
  valorInput.classList.remove("ring-2", "ring-red-500");

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

  // Mostrar botones
  prevBtn.classList.toggle("hidden", alertaStep === 1);
  nextBtn.classList.toggle("hidden", alertaStep === 1 || alertaStep === 3);
  guardarBtn.classList.toggle("hidden", alertaStep !== 3);

  // ⚡️ Solo en paso 3 se guardan condición/valor
  if (alertaStep === 3) {
    alertaData.condicion = document.getElementById("alerta-condicion").value;
    alertaData.valor = parseFloat(document.getElementById("alerta-valor").value);
  }

  // Construir resumen base (para paso 2 y 3)
  const baseResumen = (alertaData.divisa && alertaData.tipoPrecio && alertaData.precioRef)
    ? `
      <div class="flex flex-col items-center gap-1">
        <div class="flex items-center gap-2">
          <img src="${alertaData.icono}" alt="${alertaData.divisa}" class="w-5 h-5">
          <span class="font-semibold text-gray-800">${alertaData.divisa}</span>
        </div>
        <div class="text-sm text-gray-600">
          ${alertaData.tipoPrecio.charAt(0).toUpperCase() + alertaData.tipoPrecio.slice(1)}: 
          ${alertaData.precioRef.toLocaleString("es-CL")} CLP
        </div>
      </div>
    `
    : "Selecciona una divisa y completa los pasos anteriores.";

  // Resumen extendido (solo en paso 3)
  const resumenExtendido = (alertaData.condicion && alertaData.valor)
    ? `
      ${baseResumen}
      <div class="flex flex-col items-center">
        <div class="text-sm text-gray-600">
          Condición: ${condicionLabels[alertaData.condicion] || alertaData.condicion} → 
          ${alertaData.valor.toLocaleString("es-CL")}
        </div>
      </div>
    `
    : baseResumen;

  // Inyectar en los contenedores
  const summary2 = document.getElementById("alerta-step-2-summary");
  const summary3 = document.getElementById("alerta-step-3-summary");

  if (summary2) summary2.innerHTML = baseResumen;
  if (summary3) summary3.innerHTML = resumenExtendido;
}

const errorText = document.getElementById("alerta-stepper-error");

function nextAlertaStep() {
  errorText.classList.add("hidden"); // limpiar error previo
  valorInput.classList.remove("ring-2", "ring-red-500"); // reset borde rojo

  if (alertaStep === 2) {
    const condicion = condicionSelect.value;
    const valor = parseFloat(valorInput.value);

    // validar que estén completos
    if (!condicion || !valor) {
      errorText.textContent = "❌ Debes seleccionar una condición y un valor.";
      errorText.classList.remove("hidden");
      valorInput.classList.add("ring-2", "ring-red-500");
      return;
    }

    // validar que no sea igual al precio actual
    if (valor === alertaData.precioRef) {
      errorText.textContent = `❌ El valor no puede ser igual al precio actual (${alertaData.precioRef.toLocaleString("es-CL")} CLP).`;
      errorText.classList.remove("hidden");
      valorInput.classList.add("ring-2", "ring-red-500");
      valorInput.focus();
      return;
    }

    // guardar en alertaData si pasa validación
    alertaData.condicion = condicion;
    alertaData.valor = valor;
  }

  // avanzar si no hubo error
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
                        class="bg-[#1e3a8a] hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow w-full text-center leading-tight cursor-pointer"
                        data-precio="compra" 
                        data-valor="${divisa.compra}">
                        <div class="font-semibold">Compra:</div>
                        <div>${(divisa.compra).toLocaleString("es-CL")} CLP</div>
                    </button>
                    <button 
                        class="bg-[#1e3a8a] hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow w-full text-center leading-tight cursor-pointer"
                        data-precio="venta" 
                        data-valor="${divisa.venta}">
                        <div class="font-semibold">Venta:</div>
                        <div>${(divisa.venta).toLocaleString("es-CL")} CLP</div>
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

// Definir textos de ayuda y placeholders según condición
const condicionConfig = {
  alcanza: {
    placeholder: "Ej: 950",
    help: "La alerta se activará cuando el precio alcance exactamente este valor."
  },
  sube: {
    placeholder: "Ej: 1000",
    help: "La alerta se activará cuando el precio suba por sobre este valor."
  },
  baja: {
    placeholder: "Ej: 900",
    help: "La alerta se activará cuando el precio baje hasta este valor."
  },
  cambio_sobre: {
    placeholder: "Ej: 5",
    help: "La alerta se activará cuando la variación supere este porcentaje."
  },
  cambio_bajo: {
    placeholder: "Ej: -5",
    help: "La alerta se activará cuando la variación sea menor a este porcentaje."
  },
  cambio_24h_sube: {
    placeholder: "Ej: 3",
    help: "La alerta se activará cuando el cambio en 24h supere este porcentaje."
  },
  cambio_24h_baja: {
    placeholder: "Ej: -3",
    help: "La alerta se activará cuando el cambio en 24h esté por debajo de este porcentaje."
  }
};

// Referencias
const condicionSelect = document.getElementById("alerta-condicion");
const valorInput = document.getElementById("alerta-valor");
const helpText = document.getElementById("alerta-condicion-help");

// Función para actualizar UI
function updateCondicionUI() {
  const seleccion = condicionSelect.value;
  if (condicionConfig[seleccion]) {
    valorInput.placeholder = condicionConfig[seleccion].placeholder;
    helpText.textContent = condicionConfig[seleccion].help;
  }
}

// Evento al cambiar el select
condicionSelect.addEventListener("change", updateCondicionUI);

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

  if (alertaData.valor === alertaData.precioRef) {
    statusText.textContent = `❌ El valor no puede ser igual al precio actual (${alertaData.precioRef.toLocaleString("es-CL")} CLP).`;
    statusText.style.color = "red";
    return;
  }

  try {
    const response = await fetch("https://cambiosorion.cl/data/alertas.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(alertaData)
    });

    // Leer como texto en bruto para debug
    const raw = await response.text();
    console.log("📡 Respuesta RAW de alertas.php:", raw);

    // Intentar parsear como JSON
    let result;
    try {
      result = JSON.parse(raw);
    } catch (e) {
      console.error("❌ Error al parsear JSON:", e);
      statusText.textContent = "❌ Respuesta inválida del servidor.";
      statusText.style.color = "red";
      return;
    }

    if (result.success) {
      statusText.textContent = "✅ Alerta guardada, recibirás un correo cuando se cumpla.";
      statusText.style.color = "green";
    } else {
      statusText.textContent = "❌ Hubo un error, intenta más tarde.";
      statusText.style.color = "red";
    }
  } catch (error) {
    console.error("❌ Error en fetch:", error);
    statusText.textContent = "❌ No se pudo conectar al servidor.";
    statusText.style.color = "red";
  }
});

// Init
updateAlertaStepper();

// Inicializar al cargar paso 2
updateCondicionUI();

window.onCurrenciesLoaded = function() {
    loadAlertaCurrenciesFromArray();
};
