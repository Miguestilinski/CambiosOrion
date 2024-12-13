let exchangeRates = {};
let closingRates = {};
let iconsLoaded = {};
let isEditMode = false;
let activeDropdown = null;
let displayedCurrencies = ["CLP", "USD", "EUR", "ARS"];

function initializePage() {
    loadCurrenciesWithSSE();
    fetchClosingRates();
    fillCurrencyTable();
}

function loadCurrenciesWithSSE() {
    console.log('Conectando con el servidor SSE...');
    const eventSource = new EventSource('https://cambiosorion.cl/api/divisas/stream/stream_divisas.php');

    eventSource.onopen = () => {
        console.log('Conexión SSE establecida correctamente.');
    };

    eventSource.onmessage = (event) => {
        console.log('Mensaje SSE recibido:', event.data);
        try {
            const responseData = JSON.parse(event.data);

            console.log('Datos SSE procesados:', responseData);

            // Validar si los datos son un array
            if (!Array.isArray(responseData)) {
                console.error('Formato de datos inesperado:', responseData);
                return;
            }

            const dropdown1 = document.getElementById("dropdown1");
            const dropdown2 = document.getElementById("dropdown2");

            if (dropdown1) dropdown1.innerHTML = '';
            if (dropdown2) dropdown2.innerHTML = '';

            responseData.forEach(divisa => {
                console.log('Procesando divisa:', divisa);
                const circularIcon = divisa.icono_circular;
                exchangeRates[divisa.nombre] = {
                    compra: parseFloat(divisa.compra),
                    venta: parseFloat(divisa.venta),
                    icono: circularIcon
                };

                console.log('Tasa de cambio agregada:', exchangeRates[divisa.nombre]);
                preloadIcon(circularIcon);

                const option1 = document.createElement("div");
                option1.innerHTML = `<img src="${circularIcon}" alt="${divisa.nombre}" class="w-6 h-6 mr-2"> ${divisa.nombre}`;
                option1.className = "p-2 hover:bg-gray-100 cursor-pointer";
                option1.onclick = function () {
                    setCurrency1(divisa.nombre);
                    toggleDropdown('dropdown1', event);
                };
                dropdown1.appendChild(option1);

                const option2 = document.createElement("div");
                option2.innerHTML = `<img src="${circularIcon}" alt="${divisa.nombre}" class="w-5 h-5 mr-2"> ${divisa.nombre}`;
                option2.className = "p-2 hover:bg-gray-100 cursor-pointer";
                option2.onclick = function () {
                    setCurrency2(divisa.nombre);
                    toggleDropdown('dropdown2', event);
                };
                dropdown2.appendChild(option2);
            });

            console.log('Actualizando la lista de divisas en la tabla...');
            updateAddCurrencyDropdown();
            fillCurrencyTable();
        } catch (error) {
            console.error('Error procesando los datos SSE:', error);
        }
    };

    eventSource.onerror = (error) => {
        console.error('Error con la conexión SSE:', error);
        eventSource.close(); // Cierra la conexión si ocurre un error persistente
    };
}

async function fetchClosingRates() {
    try {
        const response = await fetch('https://cambiosorion.cl/data/obtener_divisas_cierre.php');
        const data = await response.json();

        if (data.error) {
            console.error('Error al cargar datos de cierre:', data.error);
            return;
        }

        // Llenar solo los datos de cierre correctamente
        data.forEach(item => {
            closingRates[item.nombre] = {
                compra: parseFloat(item.compra),
                venta: parseFloat(item.venta)
            };
        });

    } catch (error) {
        console.error('Error al obtener datos de cierre:', error);
    }
}

// Calcula variación y determina si es positiva o negativa
function calculateVariationPercentage(currentRate, closingRate) {
    if (!closingRate || closingRate <= 0) return { variation: 0, isPositive: null };

    const variation = ((currentRate - closingRate) / closingRate) * 100;
    const isPositive = variation >= 0;

    return { variation, isPositive };
}

function fillCurrencyTable() {
    console.log('Llenando la tabla de divisas...');
    const tableBody = document.getElementById("currency-table-body");
    if (!tableBody) {
        console.error("Error: 'currency-table-body' no se encuentra en el DOM.");
        return; // Evita continuar si el elemento no existe
    }
    tableBody.innerHTML = '';
    displayedCurrencies.forEach((currency, index) => {
        console.log('Procesando divisa para la tabla:', currency);
        if (exchangeRates[currency]) {
            const row = document.createElement("tr");

            const compra = exchangeRates[currency].compra;
            const venta = exchangeRates[currency].venta;

            // Obtener las tasas de cierre con validación
            const closingCompra = closingRates[currency]?.compra || 0;
            const closingVenta = closingRates[currency]?.venta || 0;

            console.log(`Compra actual: ${compra}, Venta actual: ${venta}`);
            console.log(`Compra de cierre: ${closingCompra}, Venta de cierre: ${closingVenta}`);

            const variationCompra = calculateVariationPercentage(compra, closingCompra);
            const variationVenta = calculateVariationPercentage(venta, closingVenta);

            console.log(`Compra variation: ${variationCompra}, Ventas variation: ${variationVenta}`);

            row.classList.add("currency-row");
            row.innerHTML = `
                <td class="px-4 py-2 flex items-center justify-start space-x-2 sm:w-auto w-full">
                    <img src="${exchangeRates[currency].icono}" alt="${currency}" class="w-6 h-6 mr-2"> ${currency}
                </td>
                <td class="px-4 py-2">${compra ? Math.round(compra) + ' CLP' : 'N/A'}</td>
                <td class="px-4 py-2">
                    ${currency === 'CLP' ? 'N/A' :
                    variationCompra.isPositive === null
                        ? 'N/A'
                        : variationCompra.isPositive
                            ? `+${variationCompra.variation.toFixed(2)}% ↑`
                            : `-${Math.abs(variationCompra.variation).toFixed(2)}% ↓`}
                </td>
                <td class="px-4 py-2 edit-column ${isEditMode ? '' : 'hidden'}">
                    <button onclick="deleteCurrency('${currency}')" class="delete-btn">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="w-6 h-6 text-white">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </td>
            `;
            if (index === 0) {
                row.classList.add("first-row");
            }
            tableBody.appendChild(row);
        }
    });
}

function preloadIcon(iconUrl) {
    if (!iconsLoaded[iconUrl]) {
        const img = new Image();
        img.onload = () => {
            iconsLoaded[iconUrl] = true;
        };
        img.onerror = () => {
            iconsLoaded[iconUrl] = false;
            console.error(`No se pudo cargar el ícono: ${iconUrl}`);
        };
        img.src = iconUrl; // Carga la imagen en el navegador
    }
}

// Función para establecer currency1
function setCurrency1(currency) {
    document.getElementById("currency1-text").textContent = currency;

    if (currency !== "CLP") {
        document.getElementById("currency2-text").textContent = "CLP";
    }

    exchangeRates[currency] = exchangeRates[currency] || { compra: 0, venta: 0 };
    convertFromAmount1();
    updateCurrencyIcon();
}

// Función para establecer currency2
function setCurrency2(currency) {
    document.getElementById("currency2-text").textContent = currency;

    if (currency !== "CLP") {
        document.getElementById("currency1-text").textContent = "CLP";
    }

    exchangeRates[currency] = exchangeRates[currency] || { compra: 0, venta: 0 };
    convertFromAmount2();
    updateCurrencyIcon();
}

// Modificar los inputs para formatear y validar el contenido
document.addEventListener('DOMContentLoaded', () => {
    initializePage();
    const amountInputs = [document.getElementById("amount1"), document.getElementById("amount2")];

    amountInputs.forEach(input => {
        if (input) {
            // Restringir la entrada a solo números y formato con separador de miles
            input.addEventListener('input', (event) => {
                const rawValue = event.target.value.replace(/\./g, ''); // Quitar puntos existentes
                const numericValue = rawValue.replace(/\D/g, ''); // Quitar caracteres no numéricos

                if (numericValue.length > 9) {
                    event.target.value = formatWithThousandsSeparator(numericValue.slice(0, 9));
                } else {
                    event.target.value = formatWithThousandsSeparator(numericValue);
                }
            });

            // Evitar caracteres no permitidos
            input.addEventListener('keydown', (event) => {
                const allowedKeys = ["Backspace", "ArrowLeft", "ArrowRight", "Delete", "Tab"];
                const isNumber = /^[0-9]$/.test(event.key);

                if (!isNumber && !allowedKeys.includes(event.key)) {
                    event.preventDefault();
                }
            });

            // Actualizar el valor al salir del campo
            input.addEventListener('blur', () => {
                const rawValue = input.value.replace(/\./g, '');
                const numericValue = rawValue.replace(/\D/g, '');
                input.value = formatWithThousandsSeparator(numericValue);
            });
        }
    });
});

// Formatear números con separador de miles
function formatWithThousandsSeparator(value) {
    return value.replace(/\B(?=(\d{3})+(?!\d))/g, '.'); // Inserta puntos como separadores de miles
}

// Mantener las conversiones funcionales
function convertFromAmount1() {
    const amount1 = parseFloat(document.getElementById("amount1").value.replace(/\./g, ''));
    const currency1 = document.getElementById("currency1-text").textContent;
    const currency2 = document.getElementById("currency2-text").textContent;

    if (amount1 && exchangeRates[currency1] && exchangeRates[currency2]) {
        let result;

        if (currency1 === "CLP") {
            result = amount1 / exchangeRates[currency2].venta;
        } else {
            result = amount1 * exchangeRates[currency1].compra;
        }

        document.getElementById("amount2").value = formatWithThousandsSeparator(result.toFixed(0));
    }
}

function convertFromAmount2() {
    const amount2 = parseFloat(document.getElementById("amount2").value.replace(/\./g, ''));
    const currency1 = document.getElementById("currency1-text").textContent;
    const currency2 = document.getElementById("currency2-text").textContent;

    if (amount2 && exchangeRates[currency1] && exchangeRates[currency2]) {
        let result;

        if (currency2 === "CLP") {
            result = amount2 * exchangeRates[currency1].venta;
        } else {
            result = amount2 / exchangeRates[currency2].compra;
        }

        document.getElementById("amount1").value = formatWithThousandsSeparator(result.toFixed(0));
    }
}

// Función para actualizar el ícono de divisa seleccionado
function updateCurrencyIcon() {
    const currency1 = document.getElementById("currency1-text").textContent;
    const currency2 = document.getElementById("currency2-text").textContent;

    document.getElementById("icon-currency1").src = exchangeRates[currency1].icono;
    document.getElementById("icon-currency2").src = exchangeRates[currency2].icono;
}   

function updateAddCurrencyDropdown() {
    const dropdown = document.getElementById("add-currency-dropdown");
    dropdown.innerHTML = '';  // Limpiar el dropdown actual

    // Agregar divisas que no están en displayedCurrencies
    Object.keys(exchangeRates).forEach(currency => {
        // Solo mostrar divisas que no están en displayedCurrencies
        if (!displayedCurrencies.includes(currency)) {
            const option = document.createElement("div");
            option.innerHTML = `<img src="${exchangeRates[currency].icono}" alt="${currency}" class="w-6 h-6 mr-2"> ${currency}`;
            option.className = "p-2 hover:bg-gray-100 cursor-pointer";
            option.onclick = function () {
                if (isEditMode) {
                    isEditMode = false;
                    document.querySelectorAll(".edit-column").forEach(col => {
                        col.classList.add("hidden");
                        col.style.display = "none"; // Ocultar columnas de edición
                    });
                }
                displayedCurrencies.push(currency);
                toggleDropdown('add-currency-dropdown', event);  // Pasa el evento aquí
                fillCurrencyTable();  // Actualiza la tabla con la nueva divisa
                updateAddCurrencyDropdown();  // Actualiza el dropdown
            };
            dropdown.appendChild(option);
        }
    });
}

function toggleDropdown(dropdownId, event) {
    event.stopPropagation();
    const dropdown = document.getElementById(dropdownId);

    if (activeDropdown && activeDropdown !== dropdown) {
        activeDropdown.classList.add("hidden");
    }

    // Alternar la visibilidad del dropdown actual
    if (dropdown.classList.contains("hidden")) {
        dropdown.classList.remove("hidden");
        activeDropdown = dropdown;
    } else {
        dropdown.classList.add("hidden");
        activeDropdown = null;
    }
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
     // Cerrar el menú si el clic es fuera de un botón o menú
     if (!navMenuButton.contains(event.target) && !navMobileMenu.contains(event.target)) {
        navMobileMenu.style.display = 'none';
    }
    if (!sessionMenuButton.contains(event.target) && !sessionMobileMenu.contains(event.target)) {
        sessionMobileMenu.style.display = 'none';
    }
});

function toggleEditMode() {
    isEditMode = !isEditMode;

    document.querySelectorAll(".edit-column").forEach(col => {
        if (isEditMode) {
            col.classList.remove("hidden");
            col.style.display = "table-cell"; // Asegúrate de que se muestre como una celda de tabla
        } else {
            col.classList.add("hidden");
            col.style.display = "none"; // Asegúrate de que se oculte
        }
    });
}
window.toggleEditMode = toggleEditMode;

document.querySelectorAll(".edit-column").forEach(col => {
    if (isEditMode) {
        col.classList.remove("hidden");
        col.style.display = "table-cell"; // Asegúrate que se muestre
    } else {
        col.classList.add("hidden");
        col.style.display = "none"; // Asegúrate que se oculte
    }
});

function deleteCurrency(currency) {
    displayedCurrencies = displayedCurrencies.filter(curr => curr !== currency);
    isEditMode = false;
    document.querySelectorAll(".edit-column").forEach(col => {
        col.classList.add("hidden");
        col.style.display = "none"; // Asegúrate que se oculte
    });
    updateAddCurrencyDropdown();  // Actualiza el dropdown
    fillCurrencyTable();  // Refresca la tabla
}
window.deleteCurrency = deleteCurrency;
