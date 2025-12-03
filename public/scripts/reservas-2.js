let currentStep = 1;
let errorStep = null;
const totalSteps = 3;

// Actualiza el visual del Stepper (Círculos y Texto)
function updateStepper() {
    for (let i = 1; i <= totalSteps; i++) {
        const stepText = document.getElementById(`stepper-${i}`);
        const stepBadge = document.getElementById(`badge-${i}`);

        if (i === currentStep) {
            // Activo: Texto Azul, Badge Azul/Texto Blanco
            stepText.classList.add("text-[#1e3a8a]", "font-bold");
            stepText.classList.remove("text-gray-500");
            
            stepBadge.classList.remove("bg-gray-200", "text-gray-500");
            stepBadge.classList.add("bg-[#1e3a8a]", "text-white");
        } else {
            // Inactivo: Texto Gris, Badge Gris/Texto Gris
            stepText.classList.remove("text-[#1e3a8a]", "font-bold");
            stepText.classList.add("text-gray-500");

            stepBadge.classList.remove("bg-[#1e3a8a]", "text-white");
            stepBadge.classList.add("bg-gray-200", "text-gray-500");
        }
    }
}

// Función para mostrar errores
function showStepperError(message) {
    const errorElem = document.getElementById("conversor-stepper-error");
    errorElem.textContent = message;
    errorElem.classList.remove("hidden");
    errorStep = currentStep;
}

// Función para limpiar errores
function clearStepperError() {
    const errorElem = document.getElementById("conversor-stepper-error");
    if (errorStep !== currentStep) {
        errorElem.classList.add("hidden");
        errorElem.textContent = "";
        errorStep = null;
    }
}

document.getElementById('nextStep').addEventListener('click', () => {
    if (currentStep < totalSteps) {
        // Validaciones Paso 2
        if (currentStep === 2) {
            const nameInput = document.getElementById("reserva-nombre");
            const emailInput = document.getElementById("reserva-email");
            const phoneInput = document.getElementById("reserva-fono");

            window.reservaNombre = nameInput?.value?.trim() || "";
            window.reservaEmail = emailInput?.value?.trim() || "";

            if (!window.reservaNombre || !window.reservaEmail) {
                showStepperError("❌ Por favor, completa tu nombre y correo antes de continuar.");
                return;
            }

            // Validar teléfono si es visible
            if (!document.getElementById("telefono-container").classList.contains("hidden")) {
                window.reservaTelefono = phoneInput?.value?.trim() || "";
                if (!window.reservaTelefono) {
                    showStepperError("❌ Por favor, ingresa tu número de teléfono para continuar.");
                    return;
                }
            } else {
                window.reservaTelefono = "";
            }
        }

        // Cambio de pantalla
        document.getElementById(`step-${currentStep}`).classList.add('hidden');
        currentStep++;
        document.getElementById(`step-${currentStep}`).classList.remove('hidden');

        clearStepperError();

        // Lógica al entrar al Paso 2 (Mostrar teléfono si > 5000 USD)
        if (currentStep === 2) {
            // window.lastAmountCLP viene de conversor-2.js
            const amountCLP = window.lastAmountCLP || 0;
            const usdRate = exchangeRates["USD"]?.venta || 0;
            const equivalenteUSD = usdRate ? (amountCLP / usdRate) : 0;

            const phoneContainer = document.getElementById("telefono-container");
            if (equivalenteUSD > 5000) {
                phoneContainer.classList.remove("hidden");
            } else {
                phoneContainer.classList.add("hidden");
            }
        }
    }
    toggleButtons();
});

document.getElementById('prevStep').addEventListener('click', () => {
    if (currentStep > 1) {
        document.getElementById(`step-${currentStep}`).classList.add('hidden');
        currentStep--;
        document.getElementById(`step-${currentStep}`).classList.remove('hidden');
        clearStepperError();
    }
    toggleButtons();
});

function toggleButtons() {
    const nextBtn = document.getElementById('nextStep');
    const prevBtn = document.getElementById('prevStep');
    const btnContainer = document.getElementById('stepperButtons');

    // Mostrar/Ocultar botón Anterior
    prevBtn.classList.toggle('hidden', currentStep === 1);

    updateStepper();

    // Texto del botón siguiente
    if (currentStep === 1) {
        nextBtn.textContent = 'Reservar';
        nextBtn.classList.remove('hidden');
    } else if (currentStep === totalSteps) {
        nextBtn.textContent = 'Finalizar'; // Se oculta en paso 3 de todas formas por lógica de confirmación
        nextBtn.classList.add('hidden'); 
    } else {
        nextBtn.textContent = 'Siguiente';
        nextBtn.classList.remove('hidden');
    }

    // Alineación de botones
    if (currentStep === 1) {
        btnContainer.classList.remove('justify-between');
        btnContainer.classList.add('justify-end'); // Botón Reservar a la derecha
    } else {
        btnContainer.classList.remove('justify-end');
        btnContainer.classList.add('justify-between');
    }

    // Generar resumen al llegar al paso 3
    if (currentStep === 3) {
        showStep3Summary();
    }
}

// Función auxiliar para formatear miles
function formatMoney(amount) {
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function showStep3Summary() {
    const currency1 = document.getElementById("currency1-text").textContent.trim();
    const currency2 = document.getElementById("currency2-text").textContent.trim();
    let operationType = "";

    // Determinar tipo de operación
    if (currency1 === "CLP" && currency2 !== "CLP") {
        operationType = "Venta";
    } else if (currency2 === "CLP" && currency1 !== "CLP") {
        operationType = "Compra";
    } else {
        operationType = "Cambio";
    }

    const amount = parseFloat(document.getElementById("amount1").dataset.rawValue || '0');
    const tradePriceElem = document.getElementById("trade-price");
    const tradePrice = Number(tradePriceElem.dataset.price || '0');
    const tradePriceText = `${formatMoney(tradePrice)} CLP`;

    let currencyName, currencyIcon, payText, getText;
    const name = window.reservaNombre || 'No indicado';
    const email = window.reservaEmail || 'No indicado';

    // Lógica de cálculo de montos
    if (operationType === "Venta") {
        currencyName = currency2;
        // Clonamos la imagen del ícono para insertarla en el resumen
        const iconSrc = document.getElementById("icon-currency2").src;
        currencyIcon = `<img src="${iconSrc}" class="w-5 h-5 inline-block mr-1">`;
        
        payText = `${formatMoney(amount)} CLP`;
        getText = `${formatMoney((amount / tradePrice).toFixed(0))} ${currencyName}`;
    } else if (operationType === "Compra") {
        currencyName = currency1;
        const iconSrc = document.getElementById("icon-currency1").src;
        currencyIcon = `<img src="${iconSrc}" class="w-5 h-5 inline-block mr-1">`;
        
        payText = `${formatMoney(amount)} ${currencyName}`;
        getText = `${formatMoney((amount * tradePrice).toFixed(0))} CLP`;
    } else {
        currencyName = currency1;
        const iconSrc = document.getElementById("icon-currency1").src;
        currencyIcon = `<img src="${iconSrc}" class="w-5 h-5 inline-block mr-1">`;
        
        payText = `${formatMoney(amount)} ${currencyName}`;
        getText = "Conversión a otra divisa";
    }

    // Fecha y hora
    const now = new Date();
    const dateStr = now.toLocaleDateString('es-CL');
    const timeStr = now.toLocaleTimeString('es-CL', { hour12: false, hour: '2-digit', minute: '2-digit' });

    // Inyectar datos en el HTML del Paso 3
    document.getElementById("summary-operation").textContent = operationType;
    document.getElementById("summary-currency-name").innerHTML = `${currencyIcon} ${currencyName}`;
    document.getElementById("summary-pay").textContent = payText;
    document.getElementById("summary-get").textContent = getText;
    document.getElementById("summary-price").textContent = tradePriceText;
    
    document.getElementById("summary-name").textContent = name;
    document.getElementById("summary-email").textContent = email;
    document.getElementById("summary-date").textContent = dateStr;
    document.getElementById("summary-time").textContent = timeStr;

    // Manejo de Teléfono en Resumen
    const telefono = window.reservaTelefono || "";
    const phoneSummary = document.getElementById("summary-phone-container");
    if(telefono) {
        document.getElementById("summary-phone").textContent = telefono;
        phoneSummary.classList.remove("hidden");
    } else {
        phoneSummary.classList.add("hidden");
    }

    // Lógica > 5000 USD
    const usdRate = exchangeRates["USD"]?.venta || 0;
    let equivalenteUSD = 0;

    if (operationType === "Venta") {
        equivalenteUSD = usdRate ? (amount / usdRate) : 0; 
    } else if (operationType === "Compra") {
        if (currency1 === "USD") {
            equivalenteUSD = amount; 
        } else {
            equivalenteUSD = usdRate ? ((amount * tradePrice) / usdRate) : 0;
        }
    }

    const confirmBtn = document.getElementById("confirmReservation");
    const contactBtn = document.getElementById("contactExecutive");
    const statusText = document.getElementById("reservation-status");
    const instrucciones = document.getElementById("reservation-instructions");

    // Limpiar estado previo
    statusText.textContent = ""; 
    confirmBtn.disabled = false;

    if (equivalenteUSD > 5000) {
        // Instrucciones especiales para monto alto
        instrucciones.classList.remove("hidden");
        instrucciones.innerHTML = `
            <p class="font-bold text-orange-700 mb-2">⚠️ Operación mayor a 5.000 USD</p>
            <p>Tu solicitud será enviada directamente a un ejecutivo de Cambios Orion.</p>
            <p class="mt-2">📞 Un ejecutivo se pondrá en contacto contigo al teléfono registrado 
            para confirmar la tasa y validar la operación.</p>
            <p class="mt-2 text-sm text-gray-500">Recibirás un correo de confirmación una vez validada la solicitud.</p>
        `;

        confirmBtn.style.display = "none";
        contactBtn.classList.remove("hidden");

        // Validar horario ejecutivo
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const startMinutes = 9 * 60;     // 09:00
        const endMinutes   = 16 * 60 + 30; // 16:30

        if (currentMinutes >= startMinutes && currentMinutes <= endMinutes) {
            contactBtn.disabled = false;
            statusText.textContent = "";
        } else {
            contactBtn.disabled = true;
            statusText.textContent = "⛔ Fuera de horario de atención (09:00 - 16:30).";
            statusText.className = "text-center text-base font-semibold mt-2 text-red-600";
        }

    } else {
        // Instrucciones normales
        instrucciones.classList.remove("hidden");
        instrucciones.innerHTML = `
            <p class="font-bold text-[#1e3a8a] mb-1">📍 Lugar de atención:</p>
            <p class="mb-2">Cambios Orion - Agustinas 1035, Oficina 13</p>

            <p class="font-bold text-[#1e3a8a] mb-1">🕒 Horario de atención:</p>
            <p class="mb-2">Lunes a Viernes de <strong>09:00 a 17:00 hrs</strong>.</p>

            <p class="text-xs text-gray-600 mt-3 border-t border-yellow-200 pt-2">
            ⚠️ La reserva es <strong>válida solo hasta el cierre del día</strong>. 
            Recibirás un correo con un código QR que deberás mostrar en el local.
            </p>
        `;

        confirmBtn.style.display = "inline-block";
        contactBtn.classList.add("hidden");

        // Validar horario normal
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const startMinutes = 9 * 60;     // 09:00
        const endMinutes   = 16 * 60 + 30; // 16:30 (Reserva hasta 16:30 para llegar antes de las 17:00)

        if (currentMinutes >= startMinutes && currentMinutes <= endMinutes) {
            confirmBtn.disabled = false;
            statusText.textContent = "";
        } else {
            confirmBtn.disabled = true;
            statusText.textContent = "⛔ Fuera de horario de atención. No puedes confirmar la reserva.";
            statusText.className = "text-center text-base font-semibold mt-2 text-red-600";
        }
    }

    // Guardar variables globales para el envío
    window.operationType = operationType;
    window.currency1 = currency1;
    window.currency2 = currency2;
}

// --- ENVÍO DE RESERVA NORMAL ---
document.getElementById("confirmReservation").addEventListener('click', async () => {
    const confirmBtn = document.getElementById("confirmReservation");
    const statusText = document.getElementById("reservation-status");

    confirmBtn.disabled = true;
    confirmBtn.textContent = "Procesando...";

    let divisaCodigo = (window.operationType === "Venta") ? window.currency2 : window.currency1;

    // Limpiar símbolos no numéricos
    const rawTotal = document.getElementById("summary-pay").textContent.replace(/[^0-9]/g, '');
    const rawMonto = document.getElementById("summary-get").textContent.replace(/[^0-9]/g, '');

    const reservaData = {
        nombre: window.reservaNombre,
        email: window.reservaEmail,
        fecha: document.getElementById("summary-date").textContent,
        hora: document.getElementById("summary-time").textContent,
        operacion: window.operationType,
        divisa: divisaCodigo,
        total: parseInt(rawTotal),
        tasa_cambio: parseFloat(document.getElementById("trade-price").dataset.price),
        monto: parseInt(rawMonto)
    };

    try {
        const response = await fetch('https://cambiosorion.cl/data/reserva.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reservaData)
        });

        const rawText = await response.text();
        let result;
        try {
            result = JSON.parse(rawText);
        } catch (e) {
            console.error("Respuesta no JSON:", rawText);
            throw new Error("Respuesta inválida del servidor");
        }

        if(result.success){
            confirmBtn.style.display = "none"; 
            statusText.textContent = "✅ ¡Reserva Exitosa! Revisa tu correo.";
            statusText.className = "text-center text-lg font-bold mt-2 text-green-600";
        } else {
            statusText.textContent = "❌ Hubo un error al guardar la reserva.";
            statusText.className = "text-center text-base font-semibold mt-2 text-red-600";
            confirmBtn.disabled = false;
            confirmBtn.textContent = "Confirmar Reserva";
        }
    } catch (error) {
        console.error(error);
        statusText.textContent = "❌ Error de conexión.";
        statusText.className = "text-center text-base font-semibold mt-2 text-red-600";
        confirmBtn.disabled = false;
        confirmBtn.textContent = "Confirmar Reserva";
    }
});

// --- ENVÍO DE SOLICITUD EJECUTIVO ---
document.getElementById("contactExecutive").addEventListener('click', async () => {
    const contactBtn = document.getElementById("contactExecutive");
    const statusText = document.getElementById("reservation-status");

    contactBtn.disabled = true;
    contactBtn.textContent = "Enviando...";

    let divisaCodigo = (window.operationType === "Venta") ? window.currency2 : window.currency1;
    const rawTotal = document.getElementById("summary-pay").textContent.replace(/[^0-9]/g, '');
    const rawMonto = document.getElementById("summary-get").textContent.replace(/[^0-9]/g, '');

    const reservaData = {
        nombre: window.reservaNombre,
        email: window.reservaEmail,
        telefono: window.reservaTelefono,
        fecha: document.getElementById("summary-date").textContent,
        hora: document.getElementById("summary-time").textContent,
        operacion: window.operationType,
        divisa: divisaCodigo,
        total: parseInt(rawTotal),
        tasa_cambio: parseFloat(document.getElementById("trade-price").dataset.price),
        monto: parseInt(rawMonto),
        requiereEjecutivo: true 
    };

    try {
        const response = await fetch('https://cambiosorion.cl/data/contacto-orion.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reservaData)
        });

        const rawText = await response.text();
        let result;
        try {
            result = JSON.parse(rawText);
        } catch (e) {
            throw new Error("Respuesta inválida del servidor");
        }

        if(result.success){
            contactBtn.style.display = "none"; 
            statusText.textContent = "✅ Solicitud enviada. Un ejecutivo te contactará.";
            statusText.className = "text-center text-lg font-bold mt-2 text-green-600";
        } else {
            statusText.textContent = "❌ Error al enviar solicitud.";
            statusText.className = "text-center text-base font-semibold mt-2 text-red-600";
            contactBtn.disabled = false;
            contactBtn.textContent = "Contactar Ejecutivo";
        }
    } catch (error) {
        console.error(error);
        statusText.textContent = "❌ Error de conexión.";
        statusText.className = "text-center text-base font-semibold mt-2 text-red-600";
        contactBtn.disabled = false;
        contactBtn.textContent = "Contactar Ejecutivo";
    }
});