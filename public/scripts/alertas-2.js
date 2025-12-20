let alertaStep = 1;
let alertaData = {};

// Referencias DOM
const alertaBtn = document.getElementById("alertaBtn");
const alertaSlideBtn = document.getElementById("alertaSlideBtn");
const alertaWrapper = document.getElementById("alerta-wrapper");
const prevBtn = document.getElementById("alerta-prev");
const nextBtn = document.getElementById("alerta-next");
const guardarBtn = document.getElementById("guardar-alerta");
const errorText = document.getElementById("alerta-stepper-error");

// Toggle Wrapper (Acordeón)
function toggleAlertaWrapper(e) {
  if(e) e.preventDefault();
  if (alertaWrapper.classList.contains("max-h-0")) {
    alertaWrapper.classList.remove("max-h-0");
    alertaWrapper.classList.add("max-h-[1000px]");
    // Scroll suave hacia la alerta
    setTimeout(() => {
        alertaWrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  } else {
    alertaWrapper.classList.add("max-h-0");
    alertaWrapper.classList.remove("max-h-[1000px]");
  }
}

// Listeners apertura
if(alertaBtn) alertaBtn.addEventListener("click", toggleAlertaWrapper);
if(alertaSlideBtn) alertaSlideBtn.addEventListener("click", toggleAlertaWrapper);

// Navegación Stepper
if(prevBtn) {
    prevBtn.addEventListener("click", () => {
      if (alertaStep > 1) {
        alertaStep--;
        updateAlertaStepper();
      }
    });
}

if(nextBtn) nextBtn.addEventListener("click", nextAlertaStep);

// Configuración de textos
const condicionLabels = {
  alcanza: "Alcanza el precio",
  sube: "Precio sube sobre",
  baja: "Precio baja a",
  cambio_sobre: "Variación sobre %",
  cambio_bajo: "Variación bajo %"
};

// Función Principal Visual del Stepper
function updateAlertaStepper() {
  if(!errorText) return;
  
  errorText.classList.add("hidden");
  const valorInput = document.getElementById("alerta-valor");
  if(valorInput) valorInput.classList.remove("ring-2", "ring-red-500");

  for (let i = 1; i <= 3; i++) {
    const stepContent = document.getElementById(`alerta-step-${i}`);
    const badge = document.getElementById(`alerta-badge-${i}`);
    const text = document.getElementById(`alerta-text-${i}`);

    if (i === alertaStep) {
      stepContent.classList.remove("hidden");
      badge.classList.remove("bg-gray-200", "text-gray-500");
      badge.classList.add("bg-[#1e3a8a]", "text-white");
      text.classList.add("text-[#1e3a8a]", "font-bold");
      text.classList.remove("text-gray-500");
    } else {
      stepContent.classList.add("hidden");
      badge.classList.remove("bg-[#1e3a8a]", "text-white");
      badge.classList.add("bg-gray-200", "text-gray-500");
      text.classList.remove("text-[#1e3a8a]", "font-bold");
      text.classList.add("text-gray-500");
    }
  }

  prevBtn.classList.toggle("hidden", alertaStep === 1);
  nextBtn.classList.toggle("hidden", alertaStep === 1 || alertaStep === 3);
  guardarBtn.classList.toggle("hidden", alertaStep !== 3);

  if (alertaStep === 3) {
    alertaData.condicion = document.getElementById("alerta-condicion").value;
    alertaData.valor = parseFloat(document.getElementById("alerta-valor").value);
  }

  updateSummaries();
}

function updateSummaries() {
    const summary2 = document.getElementById("alerta-step-2-summary");
    const summary3 = document.getElementById("alerta-step-3-summary");

    const baseResumen = (alertaData.divisa && alertaData.tipoPrecio && alertaData.precioRef)
    ? `
      <div class="flex flex-col items-center gap-2">
        <div class="flex items-center gap-2 text-xl">
          <img src="${alertaData.icono}" alt="${alertaData.divisa}" class="w-6 h-6 rounded-full shadow-sm">
          <span class="font-bold text-gray-800">${alertaData.divisa}</span>
        </div>
        <div class="bg-blue-50 text-[#1e3a8a] px-4 py-1 rounded-full text-sm font-semibold border border-blue-100">
          Precio ${alertaData.tipoPrecio}: 
          ${alertaData.precioRef.toLocaleString("es-CL")} CLP
        </div>
      </div>
    `
    : "Selecciona una divisa.";

    const resumenExtendido = (alertaData.condicion && alertaData.valor)
    ? `
      ${baseResumen}
      <div class="mt-4 pt-4 border-t border-blue-100 w-full">
        <div class="text-sm text-gray-500 uppercase font-bold tracking-wide mb-1">Tu objetivo</div>
        <div class="text-lg text-gray-800 font-medium">
          ${condicionLabels[alertaData.condicion] || alertaData.condicion} 
          <span class="font-bold text-[#1e3a8a]">${alertaData.valor.toLocaleString("es-CL")}</span>
        </div>
      </div>
    `
    : baseResumen;

    if (summary2) summary2.innerHTML = baseResumen;
    if (summary3) summary3.innerHTML = resumenExtendido;
}

function nextAlertaStep() {
  const valorInput = document.getElementById("alerta-valor");
  const condicionSelect = document.getElementById("alerta-condicion");
  
  errorText.classList.add("hidden"); 
  if(valorInput) valorInput.classList.remove("ring-2", "ring-red-500");

  if (alertaStep === 2) {
    const condicion = condicionSelect.value;
    const valor = parseFloat(valorInput.value);
    const precioRef = alertaData.precioRef;

    if (!condicion || isNaN(valor)) {
      showError("❌ Debes ingresar un valor numérico válido.");
      return;
    }

    if (condicion === "alcanza" && valor === precioRef) {
        showError("❌ El valor objetivo debe ser distinto al precio actual.");
        return;
    }
    if (condicion === "sube" && valor <= precioRef) {
        showError(`❌ Para 'sube', el valor debe ser mayor a ${precioRef}.`);
        return;
    }
    if (condicion === "baja" && valor >= precioRef) {
        showError(`❌ Para 'baja', el valor debe ser menor a ${precioRef}.`);
        return;
    }

    alertaData.condicion = condicion;
    alertaData.valor = valor;
  }

  if (alertaStep < 3) {
    alertaStep++;
    updateAlertaStepper();
  }
}

function showError(msg) {
    errorText.textContent = msg;
    errorText.classList.remove("hidden");
    const valorInput = document.getElementById("alerta-valor");
    if(valorInput) {
        valorInput.classList.add("ring-2", "ring-red-500");
        valorInput.focus();
    }
}

function showAlertaDropdown() {
    const dropdown = document.getElementById("alerta-divisa-dropdown");
    const button = document.getElementById("alerta-divisa-button");
    
    // 1. Mover el dropdown al <body> para que no lo corte el overflow-hidden del contenedor
    if (dropdown.parentElement !== document.body) {
        document.body.appendChild(dropdown);
    }

    if (dropdown.classList.contains("hidden")) {
        // 2. Calcular posición exacta del botón
        const rect = button.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

        // 3. Aplicar estilos fijos para que flote encima de todo
        dropdown.style.position = 'absolute';
        dropdown.style.top = `${rect.bottom + scrollTop + 8}px`; // 8px de margen
        dropdown.style.left = `${rect.left + scrollLeft}px`;
        dropdown.style.width = `${rect.width}px`; // Mismo ancho que el botón
        dropdown.style.zIndex = '9999'; // Z-index máximo para estar sobre el footer

        dropdown.classList.remove("hidden");
    } else {
        dropdown.classList.add("hidden");
    }

    // 4. Cerrar al hacer clic fuera
    const closeFn = function(e) {
        if (!dropdown.contains(e.target) && !button.contains(e.target)) {
            dropdown.classList.add("hidden");
            document.removeEventListener("click", closeFn);
        }
    };
    // Usamos setTimeout para evitar que el click actual cierre inmediatamente el menú
    setTimeout(() => document.addEventListener("click", closeFn), 0);
}

function selectAlertaCurrency(nombre, icono) {
    document.getElementById("alerta-currency-text").textContent = nombre;
    const iconImg = document.getElementById("alerta-icon");
    iconImg.src = icono;
    iconImg.classList.remove("hidden");
    
    document.getElementById("alerta-divisa-dropdown").classList.add("hidden");
}

function loadAlertaCurrenciesFromArray() {
    const ul = document.querySelector("#alerta-divisa-dropdown ul");
    const preciosCard = document.getElementById("alerta-precios-card");

    if (!window.exchangeRates || !ul) return;

    ul.innerHTML = ""; 

    Object.keys(window.exchangeRates).forEach(nombre => {
        const divisa = window.exchangeRates[nombre];
        
        const li = document.createElement("li");
        li.innerHTML = `
            <div class="flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer transition border-b border-gray-100 last:border-0">
                <img src="${divisa.icono}" alt="${nombre}" class="w-8 h-8 mr-3 rounded-full shadow-sm">
                <span class="font-bold text-gray-700">${nombre}</span>
            </div>
        `;
        
        li.addEventListener("click", () => {
            selectAlertaCurrency(nombre, divisa.icono);
            
            alertaData.divisa = nombre;
            alertaData.icono = divisa.icono;

            preciosCard.innerHTML = `
                <div class="grid grid-cols-2 gap-4 animate-fadeIn">
                    <div class="cursor-pointer bg-white border-2 border-blue-100 hover:border-[#1e3a8a] hover:bg-blue-50 rounded-xl p-4 text-center transition shadow-sm group"
                         onclick="setPrecioRef('compra', ${divisa.compra})">
                        <div class="text-xs text-gray-500 uppercase font-bold mb-1">Precio Compra</div>
                        <div class="text-xl font-extrabold text-[#1e3a8a] group-hover:scale-105 transition-transform">${divisa.compra.toLocaleString("es-CL", {maximumFractionDigits: 5})}</div>
                        <div class="text-xs text-gray-400 mt-1">CLP</div>
                    </div>
                    <div class="cursor-pointer bg-white border-2 border-blue-100 hover:border-[#1e3a8a] hover:bg-blue-50 rounded-xl p-4 text-center transition shadow-sm group"
                         onclick="setPrecioRef('venta', ${divisa.venta})">
                        <div class="text-xs text-gray-500 uppercase font-bold mb-1">Precio Venta</div>
                        <div class="text-xl font-extrabold text-[#1e3a8a] group-hover:scale-105 transition-transform">${divisa.venta.toLocaleString("es-CL", {maximumFractionDigits: 5})}</div>
                        <div class="text-xs text-gray-400 mt-1">CLP</div>
                    </div>
                </div>
                <p class="text-center text-xs text-gray-400 mt-3 italic">Selecciona el precio de referencia para continuar</p>
            `;
            preciosCard.classList.remove("hidden");
        });

        ul.appendChild(li);
    });
}

window.setPrecioRef = function(tipo, valor) {
    alertaData.tipoPrecio = tipo;
    alertaData.precioRef = valor;
    nextAlertaStep();
};

const condicionSelect = document.getElementById("alerta-condicion");
const helpText = document.getElementById("alerta-condicion-help");
const condicionConfig = {
  alcanza: "Te avisaremos cuando el precio sea exactamente este.",
  sube: "Te avisaremos cuando el precio supere este valor.",
  baja: "Te avisaremos cuando el precio caiga por debajo de este valor."
};

if(condicionSelect) {
    condicionSelect.addEventListener("change", () => {
        const val = condicionSelect.value;
        if(helpText) helpText.textContent = condicionConfig[val] || "";
    });
    if(helpText) helpText.textContent = condicionConfig[condicionSelect.value];
}

if(guardarBtn) {
    guardarBtn.addEventListener("click", async () => {
        alertaData.nombre = document.getElementById("alerta-nombre").value.trim();
        alertaData.email = document.getElementById("alerta-email").value.trim();
        const statusText = document.getElementById("alerta-status");

        if (!alertaData.nombre || !alertaData.email) {
            statusText.textContent = "❌ Completa todos los campos.";
            statusText.className = "text-center font-bold text-red-500 mt-4";
            return;
        }

        statusText.textContent = "Guardando...";
        statusText.className = "text-center font-bold text-gray-500 mt-4";

        try {
            const response = await fetch("https://cambiosorion.cl/data/alertas.php", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(alertaData)
            });
            
            const raw = await response.text();
            let result = JSON.parse(raw);

            if (result.success) {
              statusText.textContent = "✅ ¡Alerta creada con éxito!";
              statusText.className = "text-center font-bold text-green-600 mt-4 text-lg";
              guardarBtn.classList.add("hidden");
            } else {
              throw new Error("Error backend");
            }
        } catch (e) {
            statusText.textContent = "❌ Error al guardar alerta.";
            statusText.className = "text-center font-bold text-red-500 mt-4";
        }
    });
}

updateAlertaStepper();

const checkRatesAlertas = setInterval(() => {
    if (window.exchangeRates && Object.keys(window.exchangeRates).length > 0) {
        clearInterval(checkRatesAlertas);
        loadAlertaCurrenciesFromArray();
    }
}, 500);