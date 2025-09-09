// Función para establecer currency1
function setCurrency1(currency) {
    console.log('[setCurrency1] seleccionado ->', currency);
    const currency2 = document.getElementById("currency2-text").textContent;
    console.log('[setCurrency1] currency2 actual ->', currency2);

    if (currency === currency2) {
        console.log('[setCurrency1] moneda igual a currency2 -> hago swap');
        swapCurrencies();
        return;
    }

    if (currency !== "CLP" && currency2 !== "CLP") {
        console.log('[setCurrency1] ninguna es CLP -> pongo currency2 = CLP');
        document.getElementById("currency2-text").textContent = "CLP";
    }

    document.getElementById("currency1-text").textContent = currency;
    updateCurrencyIcon();
    filterDropdownCurrencies();
    convertCurrency();
    console.log('[setCurrency1] terminado. currency1 ahora ->', currency);
}

// Función para establecer currency2
function setCurrency2(currency) {
    console.log('[setCurrency2] seleccionado ->', currency);
    const currency1 = document.getElementById("currency1-text").textContent;
    console.log('[setCurrency2] currency1 actual ->', currency1);

    if (currency === currency1) {
        console.log('[setCurrency2] moneda igual a currency1 -> hago swap');
        swapCurrencies();
        return;
    }

    if (currency !== "CLP" && currency1 !== "CLP") {
        console.log('[setCurrency2] ninguna es CLP -> pongo currency1 = CLP');
        document.getElementById("currency1-text").textContent = "CLP";
    }

    document.getElementById("currency2-text").textContent = currency;
    updateCurrencyIcon();
    filterDropdownCurrencies();
    convertCurrency();
    console.log('[setCurrency2] terminado. currency2 ahora ->', currency);
}

function swapCurrencies() {
    const currency1 = document.getElementById("currency1-text").textContent;
    const currency2 = document.getElementById("currency2-text").textContent;
    console.log('[swapCurrencies] antes ->', { currency1, currency2 });

    document.getElementById("currency1-text").textContent = currency2;
    document.getElementById("currency2-text").textContent = currency1;

    const iconCurrency1 = document.getElementById("icon-currency1").src;
    const iconCurrency2 = document.getElementById("icon-currency2").src;

    document.getElementById("icon-currency1").src = iconCurrency2;
    document.getElementById("icon-currency2").src = iconCurrency1;

    convertCurrency(); // Realizar la conversión tras intercambiar divisas
    console.log('[swapCurrencies] después ->', {
        currency1: document.getElementById("currency1-text").textContent,
        currency2: document.getElementById("currency2-text").textContent
    });
}

// Función para filtrar las opciones de divisas
function filterDropdownCurrencies() {
    const dropdown1 = document.getElementById("dropdown1");
    const dropdown2 = document.getElementById("dropdown2");

    const currency1 = document.getElementById("currency1-text").textContent.trim();
    const currency2 = document.getElementById("currency2-text").textContent.trim();

    console.log('[filterDropdownCurrencies] entrada ->', { currency1, currency2 });

    // Primero mostrar todo
    const list1 = dropdown1.querySelectorAll("ul li");
    const list2 = dropdown2.querySelectorAll("ul li");
    console.log(`[filter] items dropdown1: ${list1.length}, dropdown2: ${list2.length}`);

    list1.forEach(option => option.classList.remove("hidden"));
    list2.forEach(option => option.classList.remove("hidden"));

    // Ocultar en dropdown1 la divisa que está en currency1 o currency2
    list1.forEach(option => {
        const span = option.querySelector("span");
        const divisa = span ? span.textContent.trim() : option.textContent.trim();
        const shouldHide = (divisa === currency1 || divisa === currency2);
        console.log(`[filter][dropdown1] opcion="${divisa}" -> hide?`, shouldHide);
        if (shouldHide) option.classList.add("hidden");
    });

    // Ocultar en dropdown2 la divisa que está en currency1 o currency2
    list2.forEach(option => {
        const span = option.querySelector("span");
        const divisa = span ? span.textContent.trim() : option.textContent.trim();
        const shouldHide = (divisa === currency2 || divisa === currency1);
        console.log(`[filter][dropdown2] opcion="${divisa}" -> hide?`, shouldHide);
        if (shouldHide) option.classList.add("hidden");
    });

    // Asegurar que CLP esté arriba
    moveCLPToTop(dropdown1);
    moveCLPToTop(dropdown2);

    console.log('[filterDropdownCurrencies] terminado');
}

// Función para mover CLP al principio
function moveCLPToTop(dropdown) {
    const id = dropdown.id || 'unknown';
    const clpOption = Array.from(dropdown.children).find(option => {
        const span = option.querySelector("span");
        const text = span ? span.textContent.trim() : option.textContent.trim();
        return text === "CLP";
    });
    if (clpOption) {
        dropdown.insertBefore(clpOption, dropdown.firstChild);
        console.log(`[moveCLPToTop] CLP movido al inicio de ${id}`);
    } else {
        console.log(`[moveCLPToTop] CLP NO encontrado en ${id}`);
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