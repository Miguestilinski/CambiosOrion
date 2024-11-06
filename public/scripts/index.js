let exchangeRates = {};
let iconsLoaded = {};
let isEditMode = false;
let activeDropdown = null;
let displayedCurrencies = ["CLP", "USD", "EUR", "ARS"];

document.addEventListener("DOMContentLoaded", function () {
    loadCurrencies();
    fillCurrencyTable();
});

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

            console.log(dropdown1, dropdown2);

            if (dropdown1) dropdown1.innerHTML = '';
            if (dropdown2) dropdown2.innerHTML = '';

            if (!dropdown1 || !dropdown2) {
                console.error("Error: uno de los dropdowns no se encuentra en el DOM.");
                return;
            }

            data.forEach(divisa => {
                const circularIcon = divisa.icono_circular;
                exchangeRates[divisa.nombre] = {
                    compra: parseFloat(divisa.compra),
                    venta: parseFloat(divisa.venta),
                    icono: circularIcon
                };

                preloadIcon(circularIcon);

                const option1 = document.createElement("div");
                option1.innerHTML = `<img src="${circularIcon}" alt="${divisa.nombre}" class="w-6 h-6 mr-2"> ${divisa.nombre}`;
                option1.className = "p-2 hover:bg-gray-100 cursor-pointer";
                option1.onclick = function () {
                    setCurrency1(divisa.nombre);
                    toggleDropdown('dropdown1');
                };
                dropdown1.appendChild(option1);

                const option2 = document.createElement("div");
                option2.innerHTML = `<img src="${circularIcon}" alt="${divisa.nombre}" class="w-5 h-5 mr-2"> ${divisa.nombre}`;
                option2.className = "p-2 hover:bg-gray-100 cursor-pointer";
                option2.onclick = function () {
                    setCurrency2(divisa.nombre);
                    toggleDropdown('dropdown2');
                };
                dropdown2.appendChild(option2);
            });

            updateAddCurrencyDropdown();
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

function fillCurrencyTable() {
    // Limpia el contenido de la tabla antes de llenarla
    const tableBody = document.querySelector("#currency-table tbody");
    tableBody.innerHTML = ""; // Limpia el contenido de la tabla

    currencyData.forEach((currency, index) => {
        const row = document.createElement("tr");

        // Agrega las celdas de la moneda y el valor
        row.innerHTML = `
            <td>${currency.name}</td>
            <td>${currency.value}</td>
            <td class="edit-column hidden">
                <button onclick="deleteCurrency(${index})">🗑️</button>
            </td>
        `;

        tableBody.appendChild(row);
    });
}

function updateAddCurrencyDropdown() {
    const dropdown = document.getElementById("add-currency-dropdown");
    dropdown.innerHTML = '';
    Object.keys(exchangeRates).forEach(currency => {
        if (!displayedCurrencies.includes(currency)) {
            const option = document.createElement("div");
            option.innerHTML = `<img src="${exchangeRates[currency].icono}" alt="${currency}" class="w-6 h-6 mr-2"> ${currency}`;
            option.className = "p-2 hover:bg-gray-100 cursor-pointer";
            option.onclick = function () {
                displayedCurrencies.push(currency);
                toggleDropdown('add-currency-dropdown');
                fillCurrencyTable();
            };
            dropdown.appendChild(option);
        }
    });
}

function toggleDropdown(dropdownId, event) {
    event.stopPropagation(); // Evita que el evento burbujee y cierre el dropdown
    const dropdown = document.getElementById(dropdownId);

    console.log(`Toggling dropdown: ${dropdownId}`);
    console.log("Active dropdown before:", activeDropdown);

    if (activeDropdown && activeDropdown !== dropdown) {
        activeDropdown.classList.add("hidden");
        console.log("Hiding previous dropdown");
    }

    // Alternar la visibilidad del dropdown actual
    if (dropdown.classList.contains("hidden")) {
        dropdown.classList.remove("hidden");
        activeDropdown = dropdown; // Actualiza el dropdown activo
    } else {
        dropdown.classList.add("hidden");
        activeDropdown = null; // Si se oculta, reinicia el dropdown activo
    }

    console.log("Active dropdown after:", activeDropdown);
}
window.toggleDropdown = toggleDropdown;

document.addEventListener("click", function (event) {
    // Verifica si el clic está fuera del dropdown activo y del elemento de activación
    if (
        activeDropdown &&
        !activeDropdown.contains(event.target) &&
        !event.target.closest("[data-dropdown-id]")
    ) {
        console.log("Clic fuera del dropdown");
        activeDropdown.classList.add("hidden");
        activeDropdown = null;
    }
});

function toggleEditMode() {
    isEditMode = !isEditMode;
    console.log("Edit Mode:", isEditMode); // Añade un log para confirmar si el modo edición está cambiando

    // Selecciona y alterna la visibilidad de las columnas de edición
    document.querySelectorAll(".edit-column").forEach(col => {
        if (isEditMode) {
            col.classList.remove("hidden");
        } else {
            col.classList.add("hidden");
        }
    });
}
window.toggleEditMode = toggleEditMode;

function deleteCurrency(currency) {
    displayedCurrencies = displayedCurrencies.filter(curr => curr !== currency);
    fillCurrencyTable();
}
window.deleteCurrency = deleteCurrency;
