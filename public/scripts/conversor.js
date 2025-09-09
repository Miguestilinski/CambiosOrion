// Función para establecer currency1
function setCurrency1(currency) {
    const currency2 = document.getElementById("currency2-text").textContent;

    if (currency === currency2) {
        // Si se selecciona la misma que está en currency2 => swap
        swapCurrencies();
        return;
    }

    if (currency !== "CLP" && currency2 !== "CLP") {
        document.getElementById("currency2-text").textContent = "CLP";
    }

    document.getElementById("currency1-text").textContent = currency;
    updateCurrencyIcon();
    filterDropdownCurrencies();
    convertCurrency();
}

// Función para establecer currency2
function setCurrency2(currency) {
    const currency1 = document.getElementById("currency1-text").textContent;

    if (currency === currency1) {
        // Si se selecciona la misma que está en currency1 => swap
        swapCurrencies();
        return;
    }

    if (currency !== "CLP" && currency1 !== "CLP") {
        document.getElementById("currency1-text").textContent = "CLP";
    }

    document.getElementById("currency2-text").textContent = currency;
    updateCurrencyIcon();
    filterDropdownCurrencies();
    convertCurrency();
}

function swapCurrencies() {
    const currency1 = document.getElementById("currency1-text").textContent;
    const currency2 = document.getElementById("currency2-text").textContent;

    document.getElementById("currency1-text").textContent = currency2;
    document.getElementById("currency2-text").textContent = currency1;

    const iconCurrency1 = document.getElementById("icon-currency1").src;
    const iconCurrency2 = document.getElementById("icon-currency2").src;

    document.getElementById("icon-currency1").src = iconCurrency2;
    document.getElementById("icon-currency2").src = iconCurrency1;

    convertCurrency(); // Realizar la conversión tras intercambiar divisas
}

// Función para filtrar las opciones de divisas
function filterDropdownCurrencies() {
    const dropdown1 = document.getElementById("dropdown1");
    const dropdown2 = document.getElementById("dropdown2");

    const currency1 = document.getElementById("currency1-text").textContent;
    const currency2 = document.getElementById("currency2-text").textContent;

    // Primero mostrar todo
    dropdown1.querySelectorAll("li").forEach(option => option.classList.remove("hidden"));
    dropdown2.querySelectorAll("li").forEach(option => option.classList.remove("hidden"));

    // Ocultar en dropdown1 las divisas seleccionadas en currency1 y currency2
    dropdown1.querySelectorAll("li").forEach(option => {
        const divisa = option.textContent.trim();
        if (divisa === currency1 || divisa === currency2) {
            option.classList.add("hidden");
        }
    });

    // Ocultar en dropdown2 las divisas seleccionadas en currency1 y currency2
    dropdown2.querySelectorAll("li").forEach(option => {
        const divisa = option.textContent.trim();
        if (divisa === currency2 || divisa === currency1) {
            option.classList.add("hidden");
        }
    });

    // Asegurar que CLP esté arriba
    moveCLPToTop(dropdown1);
    moveCLPToTop(dropdown2);
}

// Función para mover CLP al principio
function moveCLPToTop(dropdown, currentCurrency) {
    const clpOption = Array.from(dropdown.children).find(option => option.textContent.trim() === "CLP");
    if (clpOption) {
        dropdown.insertBefore(clpOption, dropdown.firstChild);
    }
}

// Modificar los inputs para formatear y validar el contenido
document.addEventListener('DOMContentLoaded', () => {
    initializePage();
    const amount1Input = document.getElementById("amount1");

    if (amount1Input) {
        // Actualizar el valor interno al escribir
        amount1Input.addEventListener('input', (event) => {
            const rawValue = event.target.value.replace(/\./g, ''); // Quitar puntos existentes
            const numericValue = rawValue.replace(/\D/g, ''); // Quitar caracteres no numéricos
            amount1Input.dataset.rawValue = numericValue; // Guardar el valor sin formatear en un atributo personalizado
            amount1Input.value = formatWithThousandsSeparator(numericValue); // Mostrar el valor con separadores
            convertCurrency(); // Realizar conversión en tiempo real
        });

        // Al entrar al campo, mostrar sin formato
        amount1Input.addEventListener('focus', () => {
            const rawValue = amount1Input.dataset.rawValue || '';
            amount1Input.value = rawValue; // Mostrar el valor sin puntos para edición
        });

        // Al salir del campo, asegurar el formato
        amount1Input.addEventListener('blur', () => {
            const rawValue = amount1Input.dataset.rawValue || '';
            amount1Input.value = formatWithThousandsSeparator(rawValue); // Mostrar el valor formateado
        });
    }
});

// Formatear números con separador de miles
function formatWithThousandsSeparator(value) {
    // Asegurarse de que `value` sea una cadena antes de aplicar `replace`
    const stringValue = String(value); // Convertir a cadena si no lo es
    return stringValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.'); // Insertar puntos como separadores de miles
}

// Mantener las conversiones funcionales
function convertCurrency() {
    const amount1Raw = document.getElementById("amount1").dataset.rawValue || '0'; // Obtener valor sin formato
    const amount1 = parseFloat(amount1Raw); // Convertir a número
    const currency1 = document.getElementById("currency1-text").textContent;
    const currency2 = document.getElementById("currency2-text").textContent;

    const tradeInfo = document.getElementById("trade-info");
    const tradePrice = document.getElementById("trade-price");

    if (amount1 && exchangeRates[currency1] && exchangeRates[currency2]) {
        let result, priceNumber;
        let actionText = '';
        let actionColor = '';
        let priceText = '';

        if (currency1 === "CLP" && currency2 !== "CLP") {
            result = amount1 / exchangeRates[currency2].venta;
            priceNumber = exchangeRates[currency2].venta;
            actionText = `Estás comprando ${currency2}`;
            actionColor = 'text-green-600';
            priceText = `Precio: ${formatWithThousandsSeparator(priceNumber)} CLP`;
        } else if (currency2 === "CLP" && currency1 !== "CLP") {
            result = amount1 * exchangeRates[currency1].compra;
            priceNumber = exchangeRates[currency1].compra;
            actionText = `Estás vendiendo ${currency1}`;
            actionColor = 'text-red-600';
            priceText = `Precio: ${formatWithThousandsSeparator(priceNumber)} CLP`;
        } else {
            result = amount1 * exchangeRates[currency1].compra / exchangeRates[currency2].venta;
            priceNumber = exchangeRates[currency1].compra / exchangeRates[currency2].venta;
            actionText = `Estás cambiando ${currency1} a ${currency2}`;
            actionColor = 'text-blue-600';
            priceText = `Precio: ${formatWithThousandsSeparator(priceNumber)}`;
        }

        // Mostrar el resultado en amount2
        document.getElementById("amount2").value = formatWithThousandsSeparator(Math.round(result));

        // Actualizar texto dinámico y precio
        tradeInfo.textContent = actionText;
        tradeInfo.className = `mb-1 text-center font-semibold text-md ${actionColor}`;
        tradePrice.className = `text-center text-gray-600 text-sm`;
        tradePrice.textContent = priceText;
        tradePrice.dataset.price = priceNumber;

        // 🔑 Guardar valores globalmente para usarlos después
        window.lastAmountCLP = currency1 === "CLP" ? amount1 : (currency2 === "CLP" ? result : 0);
        window.lastCurrency1 = currency1;
        window.lastCurrency2 = currency2;

    } else {
        document.getElementById("amount2").value = '';
        tradeInfo.textContent = '';
        tradePrice.textContent = '';
        tradePrice.dataset.price = '0';
    }
}

// Asegurar que el segundo campo de entrada sea de solo lectura
document.addEventListener('DOMContentLoaded', () => {
    const amount2Input = document.getElementById("amount2");

    if (amount2Input) {
        amount2Input.setAttribute('readonly', true); // Hacerlo de solo lectura
    }
});

// Función para actualizar los íconos de divisas seleccionadas
function updateCurrencyIcon() {
    const currency1 = document.getElementById("currency1-text").textContent;
    const currency2 = document.getElementById("currency2-text").textContent;

    document.getElementById("icon-currency1").src = exchangeRates[currency1].icono;
    document.getElementById("icon-currency2").src = exchangeRates[currency2].icono;
}