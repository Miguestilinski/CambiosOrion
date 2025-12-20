// Función para establecer currency1
function setCurrency1(currency) {
    const currency2 = document.getElementById("currency2-text").textContent;

    if (currency === currency2) {
        swapCurrencies();
        return;
    }

    if (currency !== "CLP" && currency2 !== "CLP") {
        document.getElementById("currency2-text").textContent = "CLP";
    }

    document.getElementById("currency1-text").textContent = currency;
    updateCurrencyIcon();
    // Verifica si la función de filtro está disponible (está en landing.js)
    if(typeof filterDropdownCurrencies === "function") filterDropdownCurrencies();
    convertCurrency();
}

// Función para establecer currency2
function setCurrency2(currency) {
    const currency1 = document.getElementById("currency1-text").textContent;

    if (currency === currency1) {
        swapCurrencies();
        return;
    }

    if (currency !== "CLP" && currency1 !== "CLP") {
        document.getElementById("currency1-text").textContent = "CLP";
    }

    document.getElementById("currency2-text").textContent = currency;
    updateCurrencyIcon();
    if(typeof filterDropdownCurrencies === "function") filterDropdownCurrencies();
    convertCurrency();
}

function swapCurrencies() {
    const currency1 = document.getElementById("currency1-text").textContent;
    const currency2 = document.getElementById("currency2-text").textContent;

    document.getElementById("currency1-text").textContent = currency2;
    document.getElementById("currency2-text").textContent = currency1;

    // Asumimos que los iconos se actualizan con updateCurrencyIcon
    updateCurrencyIcon();

    convertCurrency();
    if(typeof filterDropdownCurrencies === "function") filterDropdownCurrencies();
    updateTradeSwitch();
}

// Modificar los inputs para formatear y validar el contenido
document.addEventListener('DOMContentLoaded', () => {
    // initializePage() se llama usualmente en landing.js o index.js, 
    // pero si conversor-2.js se carga de forma independiente, aseguramos listeners aquí
    
    const amount1Input = document.getElementById("amount1");
    const amount2Input = document.getElementById("amount2");

    if (amount2Input) amount2Input.setAttribute('readonly', true);

    if (amount1Input) {
        // Actualizar el valor interno al escribir
        amount1Input.addEventListener('input', (event) => {
            const rawValue = event.target.value.replace(/\./g, '');
            const numericValue = rawValue.replace(/\D/g, '');
            amount1Input.dataset.rawValue = numericValue; 
            amount1Input.value = formatWithThousandsSeparator(numericValue); 
            convertCurrency(); 
        });

        amount1Input.addEventListener('focus', () => {
            const rawValue = amount1Input.dataset.rawValue || '';
            amount1Input.value = rawValue;
        });

        amount1Input.addEventListener('blur', () => {
            const rawValue = amount1Input.dataset.rawValue || '';
            amount1Input.value = formatWithThousandsSeparator(rawValue);
        });
    }
});

function formatWithThousandsSeparator(value) {
    const stringValue = String(value);
    return stringValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// Mantener las conversiones funcionales
function convertCurrency() {
    const amount1Raw = document.getElementById("amount1").dataset.rawValue || '0';
    const amount1 = parseFloat(amount1Raw);
    const currency1 = document.getElementById("currency1-text").textContent;
    const currency2 = document.getElementById("currency2-text").textContent;

    const tradeInfo = document.getElementById("trade-info");
    const tradePrice = document.getElementById("trade-price");

    if (amount1 && exchangeRates[currency1] && exchangeRates[currency2]) {
        let result, priceNumber;
        let actionText = '';
        let actionColor = ''; // Clases de color para el texto
        let priceText = '';

        if (currency1 === "CLP" && currency2 !== "CLP") {
            // Venta (Usuario compra Divisa)
            result = amount1 / exchangeRates[currency2].venta;
            priceNumber = exchangeRates[currency2].venta;
            actionText = `Estás comprando ${currency2}`;
            actionColor = 'text-green-600';
            priceText = `Precio: ${priceNumber.toLocaleString("es-CL", {maximumFractionDigits: 5})} CLP`;
        } else if (currency2 === "CLP" && currency1 !== "CLP") {
            // Compra (Usuario vende Divisa)
            result = amount1 * exchangeRates[currency1].compra;
            priceNumber = exchangeRates[currency1].compra;
            actionText = `Estás vendiendo ${currency1}`;
            actionColor = 'text-red-600';
            priceText = `Precio: ${priceNumber.toLocaleString("es-CL", {maximumFractionDigits: 5})} CLP`;
        } else {
            // Cruce
            result = amount1 * exchangeRates[currency1].compra / exchangeRates[currency2].venta;
            priceNumber = exchangeRates[currency1].compra / exchangeRates[currency2].venta;
            actionText = `Estás cambiando ${currency1} a ${currency2}`;
            actionColor = 'text-blue-600';
            priceText = `Precio: ${priceNumber.toLocaleString("es-CL", {maximumFractionDigits: 5})}`;
        }

        document.getElementById("amount2").value = formatWithThousandsSeparator(Math.round(result));

        if (tradeInfo) {
            tradeInfo.textContent = actionText;
            tradeInfo.className = `text-lg font-bold ${actionColor}`;
        }
        if (tradePrice) {
            tradePrice.className = `text-gray-500 text-base font-medium mt-1`;
            tradePrice.textContent = priceText;
            tradePrice.dataset.price = priceNumber;
        }

        window.lastAmountCLP = currency1 === "CLP" ? amount1 : (currency2 === "CLP" ? result : 0);
        window.lastCurrency1 = currency1;
        window.lastCurrency2 = currency2;

    } else {
        document.getElementById("amount2").value = '';
        if(tradeInfo) tradeInfo.textContent = '';
        if(tradePrice) {
            tradePrice.textContent = '';
            tradePrice.dataset.price = '0';
        }
    }

    updateTradeSwitch();
}

function updateCurrencyIcon() {
    const currency1 = document.getElementById("currency1-text").textContent;
    const currency2 = document.getElementById("currency2-text").textContent;

    // Verifica que exchangeRates tenga datos antes de intentar acceder
    if (exchangeRates[currency1]) {
        document.getElementById("icon-currency1").src = exchangeRates[currency1].icono;
    }
    if (exchangeRates[currency2]) {
        document.getElementById("icon-currency2").src = exchangeRates[currency2].icono;
    }
}

// --- LÓGICA VISUAL DEL SWITCH ACTUALIZADA ---
function updateTradeSwitch() {
    const currency1 = document.getElementById("currency1-text").textContent;
    const currency2 = document.getElementById("currency2-text").textContent;

    const buyDiv = document.getElementById("trade-buy");
    const sellDiv = document.getElementById("trade-sell");

    if(!buyDiv || !sellDiv) return;

    let buyPrice = 0;
    let sellPrice = 0;

    // Calcular precios para mostrar en el switch
    if (exchangeRates[currency1] && exchangeRates[currency2]) {
        if (currency1 === "CLP") {
            // CLP en 1 -> Venta (Usuario recibe Divisa)
            buyPrice = exchangeRates[currency2].compra; // Ref
            sellPrice = exchangeRates[currency2].venta;
        } else if (currency2 === "CLP") {
            // CLP en 2 -> Compra (Usuario da Divisa)
            buyPrice = exchangeRates[currency1].compra;
            sellPrice = exchangeRates[currency1].venta; // Ref
        } else {
            buyPrice = exchangeRates[currency1].compra / exchangeRates[currency2].venta;
            sellPrice = exchangeRates[currency1].venta / exchangeRates[currency2].compra;
        }
    }

    // Texto descriptivo (Opcional: podrías quitar "Compra:" y dejar solo el valor si prefieres minimalismo)
    buyDiv.textContent = `Compra: ${buyPrice.toLocaleString("es-CL", {maximumFractionDigits: 5})} CLP`;
    sellDiv.textContent = `Venta: ${sellPrice.toLocaleString("es-CL", {maximumFractionDigits: 5})} CLP`;

    // Clases base para el estado "Inactivo" (Gris, texto suave)
    const baseClass = "flex-1 py-3 text-center rounded-xl cursor-pointer md:text-lg text-md font-bold transition-all duration-300 text-gray-500 hover:text-gray-700";
    
    // Clases para el estado "Activo" (Blanco, Sombra, Texto oscuro)
    const activeClass = "bg-white shadow-sm text-gray-900";

    // Resetear clases
    buyDiv.className = baseClass;
    sellDiv.className = baseClass;

    // Determinar cuál está activo
    if (currency2 === "CLP") {
        // Estamos "Comprando" pesos (Usuario vende USD) -> Activar Compra
        buyDiv.classList.add(...activeClass.split(" "));
        buyDiv.classList.remove("text-gray-500", "hover:text-gray-700");
    } else {
        // Estamos "Vendiendo" pesos (Usuario compra USD) -> Activar Venta
        // O caso cruzado -> Default a Venta o como prefieras
        sellDiv.classList.add(...activeClass.split(" "));
        sellDiv.classList.remove("text-gray-500", "hover:text-gray-700");
    }
}

// Eventos Click en el Switch
const btnBuy = document.getElementById("trade-buy");
const btnSell = document.getElementById("trade-sell");

if (btnBuy) {
    btnBuy.addEventListener("click", () => {
        const currency2 = document.getElementById("currency2-text").textContent;
        // Queremos "Compra" activa -> currency2 debe ser CLP
        if (currency2 !== "CLP") swapCurrencies();
        else updateTradeSwitch(); // Refrescar visual por si acaso
    });
}

if (btnSell) {
    btnSell.addEventListener("click", () => {
        const currency1 = document.getElementById("currency1-text").textContent;
        // Queremos "Venta" activa -> currency1 debe ser CLP
        if (currency1 !== "CLP") swapCurrencies();
        else updateTradeSwitch();
    });
}

// Función inicial para esperar datos y setear defaults
function updateSwitchWhenRatesReady() {
    const waitForRates = setInterval(() => {
        if (window.exchangeRates && window.exchangeRates["USD"] && window.exchangeRates["CLP"]) {
            clearInterval(waitForRates);

            // Default inicial
            document.getElementById("currency1-text").textContent = "CLP";
            document.getElementById("currency2-text").textContent = "USD";

            updateCurrencyIcon();
            if(typeof filterDropdownCurrencies === "function") filterDropdownCurrencies();
            convertCurrency();
            updateTradeSwitch();
        }
    }, 100);
}

// Esperar a que se carguen las divisas (hookeando window.onCurrenciesLoaded si existe)
const checkLoader = setInterval(() => {
    if (typeof window.onCurrenciesLoaded === "function") {
        clearInterval(checkLoader);
        const originalFn = window.onCurrenciesLoaded;
        window.onCurrenciesLoaded = function() {
            originalFn(); 
            updateSwitchWhenRatesReady();
        };
    } else {
        // Fallback si no existe la función
        if (window.exchangeRates && Object.keys(window.exchangeRates).length > 0) {
             clearInterval(checkLoader);
             updateSwitchWhenRatesReady();
        }
    }
}, 100);