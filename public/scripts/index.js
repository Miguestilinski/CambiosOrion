let exchangeRates = {}; // Aquí se almacenan las tasas de compra y venta de cada divisa.

// Función que se ejecuta al cargar la página
window.onload = function () {
    loadCurrencies();
};

// Cargar las divisas desde el servidor
function loadCurrencies() {
    fetch('https://cambiosorion.cl/data/obtener_divisas.php')
        .then(response => response.json())
        .then(data => {
            const dropdown1 = document.getElementById("dropdown1");
            const dropdown2 = document.getElementById("dropdown2");

            dropdown1.innerHTML = '';
            dropdown2.innerHTML = '';

            data.forEach(divisa => {
                // Almacena las tasas de compra y venta de cada divisa
                exchangeRates[divisa.nombre] = {
                    compra: parseFloat(divisa.compra),
                    venta: parseFloat(divisa.venta)
                };

                // Crear opciones para los dropdowns
                const option1 = createOptionElement(divisa);
                const option2 = createOptionElement(divisa);

                // Asignar a dropdowns
                dropdown1.appendChild(option1);
                dropdown2.appendChild(option2);

                option1.onclick = function () {
                    handleCurrencyChange("currency1", divisa.nombre, "dropdown1", "currency2");
                };

                option2.onclick = function () {
                    handleCurrencyChange("currency2", divisa.nombre, "dropdown2", "currency1");
                };
            });

            // Establecer opciones por defecto (CLP y USD)
            document.getElementById("currency1").textContent = "CLP";
            document.getElementById("currency2").textContent = "USD";

            convertFromAmount1(); 
        })
        .catch(error => console.error('Error al cargar las divisas:', error));
}

// Función para crear las opciones en los dropdowns
function createOptionElement(divisa) {
    const option = document.createElement("div");
    option.innerHTML = `<img src="${divisa.icono}" alt="${divisa.nombre}" class="w-5 h-5 mr-2"> ${divisa.nombre}`;
    option.className = "p-2 hover:bg-gray-100 cursor-pointer";
    return option;
}

// Función para manejar el cambio de divisa seleccionada
function handleCurrencyChange(currencyElementId, selectedCurrency, dropdownId, otherCurrencyId) {
    const otherCurrency = document.getElementById(otherCurrencyId).textContent;

    // Si la divisa seleccionada no es CLP, la otra divisa debe ser CLP.
    if (selectedCurrency !== "CLP" && otherCurrency !== "CLP") {
        document.getElementById(otherCurrencyId).textContent = "CLP";
    }

    document.getElementById(currencyElementId).textContent = selectedCurrency;
    document.getElementById(dropdownId).style.display = 'none';
    
    // Ejecutar conversión nuevamente
    convertFromAmount1();
}

// Convertir desde el monto ingresado en divisa1 (CLP u otra)
function convertFromAmount1() {
    const amount1 = parseFloat(document.getElementById("amount1").value);
    const currency1 = document.getElementById("currency1").textContent;
    const currency2 = document.getElementById("currency2").textContent;

    if (amount1 && exchangeRates[currency1] && exchangeRates[currency2]) {
        if (currency1 === "CLP") {
            const result = amount1 / exchangeRates[currency2].venta;
            document.getElementById("amount2").value = result.toFixed(2);
        } else if (currency2 === "CLP") {
            const result = amount1 * exchangeRates[currency1].compra;
            document.getElementById("amount2").value = result.toFixed(2);
        }
    } else {
        document.getElementById("amount2").value = "0.00";
    }
}

// Convertir desde el monto ingresado en divisa2 (CLP u otra)
function convertFromAmount2() {
    const amount2 = parseFloat(document.getElementById("amount2").value);
    const currency1 = document.getElementById("currency1").textContent;
    const currency2 = document.getElementById("currency2").textContent;

    if (amount2 && exchangeRates[currency1] && exchangeRates[currency2]) {
        if (currency2 === "CLP") {
            const result = amount2 / exchangeRates[currency1].compra;
            document.getElementById("amount1").value = result.toFixed(2);
        } else if (currency1 === "CLP") {
            const result = amount2 * exchangeRates[currency2].venta;
            document.getElementById("amount1").value = result.toFixed(2);
        }
    } else {
        document.getElementById("amount1").value = "0.00";
    }
}
