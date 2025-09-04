let currentStep = 1;
const totalSteps = 3;

function updateStepper() {
    for (let i = 1; i <= totalSteps; i++) {
        const stepElem = document.getElementById(`stepper-${i}`);
        if (i === currentStep) {
            stepElem.classList.add("text-blue-600", "font-semibold");
            stepElem.classList.remove("text-gray-500");
        } else {
            stepElem.classList.remove("text-blue-600", "font-semibold");
            stepElem.classList.add("text-gray-500");
        }
    }
}

document.getElementById('nextStep').addEventListener('click', () => {
    if (currentStep < totalSteps) {
        // Guardar nombre/email justo antes de cambiar paso
        if (currentStep === 2) {
            const nameInput = document.getElementById("reserva-nombre");
            const emailInput = document.getElementById("reserva-email");
            const phoneInput = document.getElementById("reserva-fono");

            window.reservaNombre = nameInput?.value?.trim() || "";
            window.reservaEmail = emailInput?.value?.trim() || "";

            if (!window.reservaNombre || !window.reservaEmail) {
                alert("Por favor, completa tu nombre y correo antes de continuar.");
                return;
            }

            // Si teléfono estaba visible, asegurarse de que lo llenó
            if (!document.getElementById("telefono-container").classList.contains("hidden")) {
                window.reservaTelefono = phoneInput?.value?.trim() || "";
                if (!window.reservaTelefono) {
                    alert("Por favor, ingresa tu número de teléfono para continuar.");
                    return;
                }
            } else {
                window.reservaTelefono = "";
            }
        }

        // Ocultar step actual y mostrar el siguiente
        document.getElementById(`step-${currentStep}`).classList.add('hidden');
        currentStep++;
        document.getElementById(`step-${currentStep}`).classList.remove('hidden');

        // 🔑 Al entrar en el Paso 2, decidir si mostrar el input teléfono
        if (currentStep === 2) {
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
    }
    toggleButtons();
});

function toggleButtons() {
    const nextBtn = document.getElementById('nextStep');
    const prevBtn = document.getElementById('prevStep');
    const btnContainer = document.getElementById('stepperButtons'); // el div que contiene los botones

    prevBtn.classList.toggle('hidden', currentStep === 1);

    updateStepper();

    // Cambiar texto del botón según el paso
    if (currentStep === 1) {
        nextBtn.textContent = 'Reservar';
        nextBtn.classList.remove('hidden');
    } else if (currentStep === totalSteps) {
        nextBtn.textContent = 'Finalizar';
        nextBtn.classList.add('hidden');
    } else {
        nextBtn.textContent = 'Siguiente';
        nextBtn.classList.remove('hidden');
    }

    // Ajustar la alineación del contenedor según el paso
    if (currentStep === 1) {
        btnContainer.classList.remove('justify-between');
        btnContainer.classList.add('justify-center');
    } else {
        btnContainer.classList.remove('justify-center');
        btnContainer.classList.add('justify-between');
    }

    if (currentStep === 3) {
        showStep3Summary();
    }
}

function showStep3Summary() {
    // Detectar operación automáticamente
    const currency1 = document.getElementById("currency1-text").textContent.trim();
    const currency2 = document.getElementById("currency2-text").textContent.trim();
    let operationType = "";

    if (currency1 === "CLP" && currency2 !== "CLP") {
        operationType = "Venta";
    } else if (currency2 === "CLP" && currency1 !== "CLP") {
        operationType = "Compra";
    } else {
        operationType = "Cambio"; // Caso especial divisa-divisa
    }

    const amount = parseFloat(document.getElementById("amount1").dataset.rawValue || '0');

    // Precio numérico y texto
    const tradePriceElem = document.getElementById("trade-price");
    const tradePrice = Number(tradePriceElem.dataset.price || '0');
    const tradePriceText = `${formatWithThousandsSeparator(tradePrice)} CLP`;

    let currencyName, currencyIcon, payText, getText;

    const name = window.reservaNombre || 'No indicado';
    const email = window.reservaEmail || 'No indicado';

    // Calcular montos
    if (operationType === "Venta") {
        // Cliente entrega CLP y recibe divisa extranjera (currency2)
        currencyName = currency2;
        currencyIcon = document.getElementById("icon-currency2")?.outerHTML || '';
        payText = `${formatWithThousandsSeparator(amount)} CLP`;
        getText = `${formatWithThousandsSeparator((amount / tradePrice).toFixed(0))} ${currencyName}`;
    } else if (operationType === "Compra") {
        // Cliente entrega divisa extranjera (currency1) y recibe CLP
        currencyName = currency1;
        currencyIcon = document.getElementById("icon-currency1")?.outerHTML || '';
        payText = `${formatWithThousandsSeparator(amount)} ${currencyName}`;
        getText = `${formatWithThousandsSeparator((amount * tradePrice).toFixed(0))} CLP`;
    } else {
        // Cambio divisa-divisa
        currencyName = currency1;
        currencyIcon = document.getElementById("icon-currency1")?.outerHTML || '';
        payText = `${formatWithThousandsSeparator(amount)} ${currencyName}`;
        getText = "Conversión a otra divisa";
    }

    // Fecha y hora actual
    const now = new Date();
    const date = now.toLocaleDateString('es-CL');
    const time = now.toLocaleTimeString('es-CL', { hour12: false, hour: '2-digit', minute: '2-digit' });

    // Actualizar DOM
    document.getElementById("summary-operation").textContent = operationType;
    document.getElementById("summary-currency-name").innerHTML = `${currencyIcon} ${currencyName}`;
    document.getElementById("summary-pay").textContent = payText;
    document.getElementById("summary-get").textContent = getText;
    document.getElementById("summary-price").textContent = tradePriceText;
    document.getElementById("summary-name").textContent = name;
    document.getElementById("summary-email").textContent = email;
    document.getElementById("summary-date").textContent = date;
    document.getElementById("summary-time").textContent = time;

    const telefono = window.reservaTelefono || "";
    const phoneSummary = document.getElementById("summary-phone-container");
    document.getElementById("summary-phone").textContent = telefono || "--";

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

    if (equivalenteUSD > 5000) {
        // Mostrar teléfono
        phoneSummary.classList.remove("hidden");

        // 🔑 Actualizar el bloque de instrucciones con texto especial
        instrucciones.classList.remove("hidden");
        instrucciones.innerHTML = `
            <p class="font-semibold">⚠️ Operación mayor a 5.000 USD</p>
            <p>Tu solicitud será enviada a un ejecutivo de Cambios Orion.</p>
            <p class="mt-2">📞 Un ejecutivo se pondrá en contacto contigo al teléfono registrado 
            para confirmar la reserva y validar la operación.</p>
            <p class="mt-2">📧 Una vez confirmada, recibirás un correo con tu código QR 
            para presentar en nuestra sucursal.</p>
            <p class="mt-2 font-semibold">⏰ Recuerda que la reserva es válida solo hasta el cierre del día (17:00 hrs).</p>
        `;

        // Ocultar botón confirmar y mostrar botón ejecutivo
        confirmBtn.style.display = "none";
        contactBtn.classList.remove("hidden");

        const currentHour = now.getHours();
        if (currentHour >= 1 && currentHour < 24) {
            confirmBtn.disabled = false;
            statusText.textContent = "✅ Puedes solicitar tu reserva.";
        } else {
            confirmBtn.disabled = true;
            statusText.textContent = "⛔ Fuera de horario de atención. No puedes solicitar la reserva.";
        }

        window.operationType = operationType;
        window.currency1 = currency1;
        window.currency2 = currency2;

        return;
    } else {
        phoneSummary.classList.add("hidden");

        // Restaurar instrucciones normales
        instrucciones.classList.remove("hidden");
        instrucciones.innerHTML = `
            <p class="font-semibold">📍 Lugar de atención:</p>
            <p>Cambios Orion - Agustinas 1035, Oficina 13</p>

            <p class="mt-2 font-semibold">🕒 Horario de atención:</p>
            <p>Lunes a Viernes de <strong>09:00 a 17:00 hrs</strong>.</p>

            <p class="mt-2">⚠️ La reserva es <strong>válida solo hasta el cierre del día</strong>. 
            A las 17:00 hrs deja de ser válida, y al día hábil siguiente deberás generar una nueva, 
            ya que los precios pueden cambiar.</p>

            <p class="mt-2">📧 Recibirás un correo con un código QR que deberás mostrar en el local para hacer efectiva la operación.</p>
        `;

        confirmBtn.style.display = "inline-block";
        contactBtn.classList.add("hidden");
    }

    // Validar horario
    const currentHour = now.getHours();
    if (currentHour >= 1 && currentHour < 24) {
        confirmBtn.disabled = false;
        statusText.textContent = "✅ Puedes confirmar tu reserva.";
    } else {
        confirmBtn.disabled = true;
        statusText.textContent = "⛔ Fuera de horario de atención. No puedes confirmar la reserva.";
    }

    window.operationType = operationType;
    window.currency1 = currency1;
    window.currency2 = currency2;
}

// Evento click para confirmar
document.getElementById("confirmReservation").addEventListener('click', async () => {
    const confirmBtn = document.getElementById("confirmReservation");
    const statusText = document.getElementById("reservation-status");

    let divisaCodigo;
    if(window.operationType === "Compra") {
        divisaCodigo = window.currency1;
    } else if(window.operationType === "Venta") {
        divisaCodigo = window.currency2;
    } else {
        divisaCodigo = window.currency1;
    }

    const reservaData = {
        nombre: window.reservaNombre,
        email: window.reservaEmail,
        fecha: document.getElementById("summary-date").textContent,
        hora: document.getElementById("summary-time").textContent,
        operacion: operationType,
        divisa: divisaCodigo,
        total: parseInt(document.getElementById("summary-pay").textContent.replace(/\D/g,'')),
        tasa_cambio: parseFloat(document.getElementById("trade-price").dataset.price),
        monto: parseInt(document.getElementById("summary-get").textContent.replace(/\D/g,''))
    };

    try {
        const response = await fetch('https://cambiosorion.cl/data/reserva.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reservaData)
        });

        // Leer como texto crudo
        const rawText = await response.text();
        console.log("🔎 Respuesta cruda del servidor:", rawText);

        let result;
        try {
            result = JSON.parse(rawText);
        } catch (e) {
            console.warn("⚠️ La respuesta no es JSON válido, mostrando crudo en consola.");
            statusText.textContent = "❌ Error en el servidor, intentelo más tarde.";
            statusText.style.color = "red";
            return;
        }

        if(result.success){
            // ✅ Éxito
            confirmBtn.style.display = "none"; // ocultar botón
            statusText.textContent = "✅ Reserva Enviada";
            statusText.style.color = "green";
        } else {
            // ❌ Error de servidor
            statusText.textContent = "❌ Error en el servidor, intentelo más tarde.";
            statusText.style.color = "red";
        }
    } catch (error) {
        console.error("❌ Error en fetch:", error);
        statusText.textContent = "❌ Error en la comunicación con el servidor.";
        statusText.style.color = "red";
    }
});

document.getElementById("contactExecutive").addEventListener('click', async () => {
    const contactBtn = document.getElementById("contactExecutive");
    const statusText = document.getElementById("reservation-status");

    let divisaCodigo;
    if(window.operationType === "Compra") {
        divisaCodigo = window.currency1;
    } else if(window.operationType === "Venta") {
        divisaCodigo = window.currency2;
    } else {
        divisaCodigo = window.currency1;
    }

    const reservaData = {
        nombre: window.reservaNombre,
        email: window.reservaEmail,
        telefono: window.reservaTelefono,
        fecha: document.getElementById("summary-date").textContent,
        hora: document.getElementById("summary-time").textContent,
        operacion: window.operationType,
        divisa: divisaCodigo,
        total: parseInt(document.getElementById("summary-pay").textContent.replace(/\D/g,'')),
        tasa_cambio: parseFloat(document.getElementById("trade-price").dataset.price),
        monto: parseInt(document.getElementById("summary-get").textContent.replace(/\D/g,'')),
        requiereEjecutivo: true // 🔑 bandera para el backend
    };

    console.log("📦 Datos que envío al backend:", reservaData);

    try {
        const response = await fetch('https://cambiosorion.cl/data/contacto-orion.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reservaData)
        });

        const rawText = await response.text();
        console.log("🔎 Respuesta cruda del servidor (ejecutivo):", rawText);

        let result;
        try {
            result = JSON.parse(rawText);
        } catch (e) {
            statusText.textContent = "❌ Error en el servidor, intentelo más tarde.";
            statusText.style.color = "red";
            return;
        }

        if(result.success){
            contactBtn.style.display = "none"; 
            statusText.textContent = "✅ Solicitud enviada, un ejecutivo se contactará contigo.";
            statusText.style.color = "green";
        } else {
            statusText.textContent = "❌ Error en el servidor, intentelo más tarde.";
            statusText.style.color = "red";
        }
    } catch (error) {
        console.error("❌ Error en fetch:", error);
        statusText.textContent = "❌ Error en la comunicación con el servidor.";
        statusText.style.color = "red";
    }
});