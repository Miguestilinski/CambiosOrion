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
    updateLastUpdatedTimestamp();
}

function loadCurrenciesWithSSE() {
    const eventSource = new EventSource('https://cambiosorion.cl/api/divisas/stream/stream_divisas.php');

    eventSource.onopen = () => {};

    eventSource.onmessage = (event) => {
        try {
            const responseData = JSON.parse(event.data);

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
                const circularIcon = divisa.icono_circular;

                // Redondear tasas de cambio a enteros
                exchangeRates[divisa.nombre] = {
                    compra: Math.round(parseFloat(divisa.compra)),
                    venta: Math.round(parseFloat(divisa.venta)),
                    icono: circularIcon
                };

                preloadIcon(circularIcon);

                // Crear opciones para dropdown1
                const option1 = createDropdownOption(divisa.nombre, circularIcon, function () {
                    setCurrency1(divisa.nombre);
                    filterDropdownCurrencies();
                    toggleDropdown('dropdown1', event);
                });
                dropdown1.appendChild(option1);

                // Crear opciones para dropdown2
                const option2 = createDropdownOption(divisa.nombre, circularIcon, function () {
                    setCurrency2(divisa.nombre);
                    filterDropdownCurrencies();
                    toggleDropdown('dropdown2', event);
                });
                dropdown2.appendChild(option2);
            });

            filterDropdownCurrencies();
            updateAddCurrencyDropdown();
            fillCurrencyTable();

            // Capturar la fecha de última actualización
            if (responseData.length && responseData[0].fecha_actualizacion) {
                updateLastUpdatedTimestamp(responseData[0].fecha_actualizacion);
            }
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
    if (closingRate && closingRate > 0) {
        const variation = ((currentRate - closingRate) / closingRate) * 100;
        return variation;
    }
    return 0; // Si no hay datos de cierre válidos, se considera neutro
}

function getVariationStyle(variation) {
    let containerStyle = "";
    let textStyle = "";
    let arrowHTML = "";

    if (variation > 0) {
        // Positiva
        containerStyle = "background-color: #DEF7E8; color: #215436;";
        arrowHTML = `<img src="/orionapp/icons/arrow-up-green.svg" alt="Positivo" class="arrow-icon">`;
    } else if (variation < 0) {
        // Negativa
        containerStyle = "background-color: #F7DEDE; color: #591D1D;";
        arrowHTML = `<img src="/orionapp/icons/arrow-down-red.svg" alt="Negativo" class="arrow-icon">`;
    } else {
        // Neutra
        containerStyle = "background-color: #E0E0E0; color: #555;";
        arrowHTML = `<img src="/orionapp/icons/arrow-left-gray.svg" alt="Neutro" class="arrow-icon">`;
    }

    return { containerStyle, arrowHTML };
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

// Función para crear opciones reutilizables
function createDropdownOption(currency, icon, onClickHandler) {
    const option = document.createElement("div");
    option.innerHTML = `<img src="${icon}" alt="${currency}" class="w-6 h-6 mr-2"> ${currency}`;
    option.className = "p-2 hover:bg-gray-100 cursor-pointer";
    option.onclick = onClickHandler;
    return option;
}

// Función para filtrar las opciones de divisas
function filterDropdownCurrencies() {
    const dropdown1 = document.getElementById("dropdown1");
    const dropdown2 = document.getElementById("dropdown2");

    const currency1 = document.getElementById("currency1-text").textContent;
    const currency2 = document.getElementById("currency2-text").textContent;

    // Limpiar los dropdowns antes de actualizar
    Array.from(dropdown1.children).forEach(option => option.style.display = 'block');
    Array.from(dropdown2.children).forEach(option => option.style.display = 'block');

    // Actualizar dropdown1: Ocultar la divisa seleccionada en currency1
    Array.from(dropdown1.children).forEach(option => {
        const divisa = option.textContent.trim();
        if (divisa === currency1) {
            option.style.display = 'none'; // Ocultar currency1
        } else if (divisa === currency2) {
            option.style.display = 'none'; // Ocultar currency2 si está en dropdown1
        }
    });

    // Actualizar dropdown2: Ocultar la divisa seleccionada en currency2
    Array.from(dropdown2.children).forEach(option => {
        const divisa = option.textContent.trim();
        if (divisa === currency2) {
            option.style.display = 'none'; // Ocultar currency2
        } else if (divisa === currency1) {
            option.style.display = 'none'; // Ocultar currency1 si está en dropdown2
        }
    });

    // Asegurar que CLP esté al principio
    moveCLPToTop(dropdown1, currency1);
    moveCLPToTop(dropdown2, currency2);
}

// Función para mover CLP al principio
function moveCLPToTop(dropdown, currentCurrency) {
    const clpOption = Array.from(dropdown.children).find(option => option.textContent.trim() === "CLP");
    if (clpOption) {
        dropdown.insertBefore(clpOption, dropdown.firstChild);
    }
}

// Función para establecer currency1
function setCurrency1(currency) {
    const currency2 = document.getElementById("currency2-text").textContent;

    // Evitar que currency1 sea igual a currency2
    if (currency === currency2) {
        alert("No puedes seleccionar la misma divisa en ambos dropdowns.");
        return; // No hacer nada si las divisas son iguales
    }

    // Asegurarse de que al menos una de las divisas sea CLP
    if (currency !== "CLP" && currency2 !== "CLP") {
        document.getElementById("currency2-text").textContent = "CLP"; // Cambiar a CLP si ninguna es CLP
    }

    document.getElementById("currency1-text").textContent = currency;
    updateCurrencyIcon();
    filterDropdownCurrencies(); // Actualizar opciones visibles
    convertCurrency(); // Realizar la conversión después de actualizar la divisa
}

// Función para establecer currency2
function setCurrency2(currency) {
    const currency1 = document.getElementById("currency1-text").textContent;

    // Evitar que currency2 sea igual a currency1
    if (currency === currency1) {
        alert("No puedes seleccionar la misma divisa en ambos dropdowns.");
        return; // No hacer nada si las divisas son iguales
    }

    // Asegurarse de que al menos una de las divisas sea CLP
    if (currency !== "CLP" && currency1 !== "CLP") {
        document.getElementById("currency1-text").textContent = "CLP"; // Cambiar a CLP si ninguna es CLP
    }

    document.getElementById("currency2-text").textContent = currency;
    updateCurrencyIcon();
    filterDropdownCurrencies(); // Actualizar opciones visibles
    convertCurrency(); // Realizar la conversión después de actualizar la divisa
}

// Función para intercambiar las divisas entre currency1 y currency2
function swapCurrencies() {
    const currency1 = document.getElementById("currency1-text").textContent;
    const currency2 = document.getElementById("currency2-text").textContent;

    document.getElementById("currency1-text").textContent = currency2;
    document.getElementById("currency2-text").textContent = currency1;

    updateCurrencyIcon();
    filterDropdownCurrencies(); // Actualizar opciones visibles
    convertCurrency(); // Realizar la conversión después de actualizar las divisas
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

    if (amount1 && exchangeRates[currency1] && exchangeRates[currency2]) {
        let result;

        if (currency1 === "CLP" && currency2 !== "CLP") {
            // Si la moneda base es CLP, usar el precio de venta de la moneda objetivo
            result = amount1 / exchangeRates[currency2].venta;
        } else if (currency2 === "CLP" && currency1 !== "CLP") {
            // Si la moneda objetivo es CLP, usar el precio de compra de la moneda base
            result = amount1 * exchangeRates[currency1].compra;
        } else {
            // Para otras conversiones, usar el valor de la venta o compra
            result = amount1 * exchangeRates[currency1].compra / exchangeRates[currency2].venta;
        }

        // Mostrar el resultado en el campo amount2 con formato
        document.getElementById("amount2").value = formatWithThousandsSeparator(Math.round(result));
    } else {
        // Limpiar el campo si no hay datos válidos
        document.getElementById("amount2").value = '';
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

function fillCurrencyTable() {
    const tableBody = document.getElementById("currency-table-body");
    if (!tableBody) {
        console.error("Error: 'currency-table-body' no se encuentra en el DOM.");
        return; // Evita continuar si el elemento no existe
    }

    // Eliminar el skeleton al comenzar a llenar la tabla
    const skeletonRow = tableBody.querySelector(".skeleton-row");
    if (skeletonRow) {
        skeletonRow.style.display = "none"; // Ocultar skeleton mientras llenamos con datos
    }

    tableBody.innerHTML = '';
    // Aquí puedes simular un pequeño retraso para mostrar el skeleton
    setTimeout(() => {
    displayedCurrencies.forEach((currency, index) => {
        if (exchangeRates[currency]) {
            const row = document.createElement("tr");

            const compra = exchangeRates[currency].compra;
            const venta = exchangeRates[currency].venta;

            // Obtener las tasas de cierre con validación
            const closingCompra = closingRates[currency]?.compra || 0;
            const closingVenta = closingRates[currency]?.venta || 0;

            const variationCompra = calculateVariationPercentage(compra, closingCompra);
            const variationVenta = calculateVariationPercentage(venta, closingVenta);
            
            const compraStyle = getVariationStyle(variationCompra);
            const ventaStyle = getVariationStyle(variationVenta);

            row.classList.add("currency-row");
            row.innerHTML = `
                <td class="px-4 py-2 flex items-center justify-start space-x-2 sm:w-auto w-full">
                    <img src="${exchangeRates[currency].icono}" alt="${currency}" class="w-6 h-6 mr-2"> ${currency}
                </td>
                <td class="px-4 py-2">${compra ? Math.round(compra) + ' CLP' : ' '}</td>
                <td class="px-4 py-2">
                    ${currency === 'CLP' ? '' : `
                        <div style="${compraStyle.containerStyle}" class="variation-container">
                            ${variationCompra !== 0 ? 
                                (variationCompra > 0 ? `+${variationCompra.toFixed(2)}%` : `${variationCompra.toFixed(2)}%`) 
                                : `${variationCompra.toFixed(2)}%`
                            }
                            ${compraStyle.arrowHTML}
                        </div>
                    `}
                </td>
                <td class="px-4 py-2 edit-column ${isEditMode ? '' : 'hidden'}">
                    <button onclick="deleteCurrency('${currency}')" class="delete-btn">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="w-9 h-9 text-white">
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
    }, 500);
}

function updateLastUpdatedTimestamp(fecha) {
    const lastUpdatedElement = document.getElementById("last-updated");
    if (lastUpdatedElement) {
        const dateObject = new Date(fecha);
        const formattedDate = dateObject.toLocaleString('es-CL', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        lastUpdatedElement.textContent = `Última actualización: ${formattedDate}`;
    }
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
