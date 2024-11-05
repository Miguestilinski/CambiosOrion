let exchangeRates = {};
let iconsLoaded = {}; // Almacena los íconos en memoria

// Cargar las divisas
function loadCurrencies() {
    fetch('https://cambiosorion.cl/data/obtener_divisas.php')
        .then(response => {
            if (!response.ok) {
                throw new Error('Error en la red: ' + response.status);
            }
            return response.json();
        })
        .then(data => {
            const dropdown1 = document.getElementById("dropdown1");
            const dropdown2 = document.getElementById("dropdown2");

            if (dropdown1) dropdown1.innerHTML = '';
            console.log(document.getElementById("dropdown1")); // Verifica si existe

            if (dropdown2) dropdown2.innerHTML = '';

            // Verifica el contenido de data
            console.log(data); // Agrega esto para ver qué se está recibiendo

            data.forEach(divisa => {
                const circularIcon = divisa.icono_circular;
                exchangeRates[divisa.nombre] = {
                    compra: parseFloat(divisa.compra),
                    venta: parseFloat(divisa.venta),
                    icono: circularIcon
                };

                // Pre-cargar el ícono si no está en memoria
                preloadIcon(circularIcon);

                const option1 = document.createElement("div");
                option1.innerHTML = `<img src="${circularIcon}" alt="${divisa.nombre}" class="w-5 h-5 mr-2"> ${divisa.nombre}`;
                option1.className = "p-2 hover:bg-gray-100 cursor-pointer";
                option1.onclick = function () {
                    setCurrency1(divisa.nombre);
                    toggleDropdown('dropdown1'); // Cierra el dropdown
                };
                dropdown1.appendChild(option1);

                const option2 = document.createElement("div");
                option2.innerHTML = `<img src="${circularIcon}" alt="${divisa.nombre}" class="w-5 h-5 mr-2"> ${divisa.nombre}`;
                option2.className = "p-2 hover:bg-gray-100 cursor-pointer";
                option2.onclick = function () {
                    setCurrency2(divisa.nombre);
                    toggleDropdown('dropdown2'); // Cierra el dropdown
                };
                dropdown2.appendChild(option2);
            });

            // Llenar la tabla comparativa
            fillCurrencyTable();
        })
        .catch(error => console.error('Error al cargar las divisas:', error));
}

// Función para pre-cargar el ícono
function preloadIcon(iconUrl) {
    if (!iconsLoaded[iconUrl]) {
        const img = new Image();
        img.src = iconUrl; // Carga la imagen en el navegador
        iconsLoaded[iconUrl] = true; // Marcar como cargado
    }
}

// Función para establecer currency1
function setCurrency1(currency) {
    document.getElementById("currency1-text").textContent = currency;

    // Si el usuario selecciona una divisa diferente a CLP, currency2 se convierte en CLP automáticamente
    if (currency !== "CLP") {
        document.getElementById("currency2-text").textContent = "CLP";
    }

    exchangeRates[currency] = exchangeRates[currency] || { compra: 0, venta: 0 };
    convertFromAmount1();
    updateCurrencyIcon(); // Actualizar el ícono al seleccionar
}

// Función para establecer currency2
function setCurrency2(currency) {
    document.getElementById("currency2-text").textContent = currency;

    // Si el usuario selecciona una divisa diferente a CLP, currency1 se convierte en CLP automáticamente
    if (currency !== "CLP") {
        document.getElementById("currency1-text").textContent = "CLP";
    }

    exchangeRates[currency] = exchangeRates[currency] || { compra: 0, venta: 0 };
    convertFromAmount2();
    updateCurrencyIcon(); // Actualizar el ícono al seleccionar
}

// Función para convertir desde la primera cantidad (desde currency1 a currency2)
function convertFromAmount1() {
    const amount1 = parseFloat(document.getElementById("amount1").value);
    const currency1 = document.getElementById("currency1-text").textContent;
    const currency2 = document.getElementById("currency2-text").textContent;

    if (amount1 && exchangeRates[currency1] && exchangeRates[currency2]) {
        let result;

        if (currency1 === "CLP") {
            // Convertir desde CLP a otra divisa usando tasa de venta (vendes CLP, compras la divisa)
            result = amount1 / exchangeRates[currency2].venta;
        } else {
            // Convertir desde una divisa a CLP usando tasa de compra (vendes la divisa, compras CLP)
            result = amount1 * exchangeRates[currency1].compra;
        }

        document.getElementById("amount2").value = result.toFixed(2);
    }
}

// Función para convertir desde la segunda cantidad (desde currency2 a currency1)
function convertFromAmount2() {
    const amount2 = parseFloat(document.getElementById("amount2").value);
    const currency1 = document.getElementById("currency1-text").textContent;
    const currency2 = document.getElementById("currency2-text").textContent;

    if (amount2 && exchangeRates[currency1] && exchangeRates[currency2]) {
        let result;

        if (currency2 === "CLP") {
            // Convertir desde CLP a otra divisa usando tasa de compra (vendes CLP, compras la divisa)
            result = amount2 * exchangeRates[currency1].venta;
        } else {
            // Convertir desde otra divisa a CLP usando tasa de venta (vendes la divisa, compras CLP)
            result = amount2 / exchangeRates[currency2].compra;
        }

        document.getElementById("amount1").value = result.toFixed(2);
    }
}

// Función para actualizar el ícono de divisa seleccionado
function updateCurrencyIcon() {
    const currency1 = document.getElementById("currency1-text").textContent;
    const currency2 = document.getElementById("currency2-text").textContent;

    document.getElementById("icon-currency1").src = exchangeRates[currency1].icono;
    document.getElementById("icon-currency2").src = exchangeRates[currency2].icono;
}

// Función para llenar la tabla comparativa con las tasas de cambio
function fillCurrencyTable() {
    const tableBody = document.getElementById("currency-table-body");
    tableBody.innerHTML = '';

    for (const [currency, rateInfo] of Object.entries(exchangeRates)) {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">${currency}</td>
            <td class="px-6 py-4">${rateInfo.compra.toFixed(2)}</td>
            <td class="px-6 py-4">${rateInfo.venta.toFixed(2)}</td>
        `;

        tableBody.appendChild(row);
    }
}

// Función para alternar la visibilidad de un dropdown
function toggleDropdown(dropdownId) {
    const dropdown = document.getElementById(dropdownId);
    dropdown.classList.toggle("hidden");
    dropdown.classList.toggle("block");
}

document.addEventListener("DOMContentLoaded", () => {
    loadCurrencies();
});