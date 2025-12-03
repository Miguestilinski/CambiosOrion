window.exchangeRates = {};
let closingRates = {};
let iconsLoaded = {};
let isEditMode = false;
let activeDropdown = null;
let displayedCurrencies = ["CLP", "USD", "EUR", "ARS"];

function initializePage() {
    showSkeleton();
    loadCurrenciesWithSSE();
    fetchIndicators();
    fetchClosingRates();
    updateLastUpdatedTimestamp();
    updateStepper();
}

function loadCurrenciesWithSSE() {
    showDropdownSkeleton("dropdown1");
    showDropdownSkeleton("dropdown2");
    const eventSource = new EventSource('https://cambiosorion.cl/api/stream/stream_divisas.php');

    eventSource.onopen = () => {};

    eventSource.onmessage = (event) => {
        try {
            const responseData = JSON.parse(event.data);

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

                exchangeRates[divisa.nombre] = {
                    compra: parseFloat(divisa.compra),
                    venta: parseFloat(divisa.venta),
                    icono: circularIcon
                };

                preloadIcon(circularIcon);

                const option1 = createDropdownOption(divisa.nombre, circularIcon, function () {
                    setCurrency1(divisa.nombre);
                    filterDropdownCurrencies();
                    toggleDropdown('dropdown1', event);
                });
                if(dropdown1) dropdown1.appendChild(option1);

                const option2 = createDropdownOption(divisa.nombre, circularIcon, function () {
                    setCurrency2(divisa.nombre);
                    filterDropdownCurrencies();
                    toggleDropdown('dropdown2', event);
                });
                if(dropdown2) dropdown2.appendChild(option2);
            });

            filterDropdownCurrencies();
            updateAddCurrencyDropdown();
            hideSkeleton();
            fillCurrencyTable();

            if (responseData.length && responseData[0].fecha_actualizacion) {
                updateLastUpdatedTimestamp(responseData[0].fecha_actualizacion);
            }

            if (typeof window.onCurrenciesLoaded === "function") {
                window.onCurrenciesLoaded(); 
            }
        } catch (error) {
            console.error('Error procesando los datos SSE:', error);
        }
    };

    eventSource.onerror = (error) => {
        console.error('Error con la conexión SSE:', error);
        eventSource.close();
    };
}

async function fetchIndicators() {
    fetch('https://cambiosorion.cl/data/indicadores.php')
    .then(response => response.json())
    .then(data => {
        let fechaActual = new Date().toLocaleDateString("es-CL");
        const dateEl = document.getElementById("paridades-date");
        if(dateEl) dateEl.innerText = `${fechaActual}`;

        let content = "";
        for (const [nombre, value] of Object.entries(data)) {
            content += `${nombre}: ${value.valor} CLP   |   `;
        }
        
        const tickerEl = document.getElementById("ticker-content");
        if(tickerEl) {
            // Duplicamos contenido para efecto infinito
            tickerEl.innerHTML = content + content; 
            
            // Removemos clase de carga y agregamos clase de animación
            tickerEl.classList.remove("animate-pulse");
            tickerEl.classList.add("ticker-loaded");
        }
    })
    .catch(error => console.error("Error:", error));
}

async function fetchClosingRates() {
    try {
        const response = await fetch('https://cambiosorion.cl/data/obtener_divisas_cierre.php');
        const data = await response.json();

        if (data.error) {
            console.error('Error al cargar datos de cierre:', data.error);
            return;
        }

        data.forEach(item => {
            closingRates[item.nombre] = {
                compra: parseFloat(item.compra),
                venta: parseFloat(item.venta)
            };
        });
        // Refrescar la tabla una vez tengamos los datos de cierre para calcular variaciones
        fillCurrencyTable();

    } catch (error) {
        console.error('Error al obtener datos de cierre:', error);
    }
}

function calculateVariationPercentage(currentRate, closingRate) {
    if (closingRate && closingRate > 0) {
        return ((currentRate - closingRate) / closingRate) * 100;
    }
    return 0;
}

// Genera el HTML del "Badge" o "Pill" de variación usando clases Tailwind
function getVariationBadge(variation) {
    let classes = "";
    let iconSVG = "";
    let sign = "";

    // SVG Icons
    const arrowUp = `<svg class="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 10l7-7m0 0l7 7m-7-7v18"></path></svg>`;
    const arrowDown = `<svg class="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg>`;
    const dash = `<svg class="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M20 12H4"></path></svg>`;

    if (variation > 0) {
        // Positivo: Verde
        classes = "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30";
        iconSVG = arrowUp;
        sign = "+";
    } else if (variation < 0) {
        // Negativo: Rojo
        classes = "bg-rose-500/20 text-rose-400 border border-rose-500/30";
        iconSVG = arrowDown;
        sign = ""; // El número ya trae el negativo
    } else {
        // Neutro: Gris
        classes = "bg-gray-500/20 text-gray-400 border border-gray-500/30";
        iconSVG = dash;
        sign = "";
    }

    return `
        <div class="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-md font-bold tracking-wide ${classes}">
            ${sign}${variation.toFixed(2)}%
            ${iconSVG}
        </div>
    `;
}

function showSkeleton() {
    const tableBody = document.getElementById("currency-table-body");
    if (tableBody) {
        tableBody.innerHTML = ''; 
        const skeletonRow = `
            <tr>
                <td class="px-6 py-4" colspan="6">
                    <div class="animate-pulse flex space-x-4">
                        <div class="rounded-full bg-white/10 h-8 w-8"></div>
                        <div class="flex-1 space-y-4 py-1">
                            <div class="h-4 bg-white/10 rounded w-3/4"></div>
                        </div>
                    </div>
                </td>
            </tr>
        `;
        tableBody.innerHTML = skeletonRow.repeat(4);
    }
}

function showDropdownSkeleton(dropdownId) {
    const dropdown = document.getElementById(dropdownId);
    if (dropdown) {
        dropdown.innerHTML = '';
        for (let i = 0; i < 3; i++) {
            const skeleton = document.createElement('div');
            skeleton.className = 'skeleton-loader-dropdown animate-pulse bg-gray-200 h-8 m-2 rounded';
            dropdown.appendChild(skeleton);
        }
    }
}

function hideSkeleton() {
    const tableBody = document.getElementById("currency-table-body");
    if (tableBody) {
        tableBody.innerHTML = ''; 
    }
}

function preloadIcon(iconUrl) {
    if (!iconsLoaded[iconUrl]) {
        const img = new Image();
        img.onload = () => { iconsLoaded[iconUrl] = true; };
        img.onerror = () => { iconsLoaded[iconUrl] = false; };
        img.src = iconUrl;
    }
}

function createDropdownOption(currency, icon, onClickHandler) {
    const option = document.createElement("div");
    option.innerHTML = `<img src="${icon}" alt="${currency}" class="w-8 h-8 mr-3 rounded-full shadow-sm"> <span class="text-lg font-bold text-gray-700">${currency}</span>`;
    option.className = "flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-50 last:border-0";
    option.onclick = onClickHandler;
    return option;
}

function updateAddCurrencyDropdown() {
    const dropdown = document.getElementById("add-currency-dropdown");
    if(!dropdown) return;
    dropdown.innerHTML = '';

    Object.keys(exchangeRates).forEach(currency => {
        if (!displayedCurrencies.includes(currency)) {
            const option = document.createElement("div");
            option.innerHTML = `<img src="${exchangeRates[currency].icono}" alt="${currency}" class="w-6 h-6 mr-3 rounded-full"> <span class="font-semibold">${currency}</span>`;
            option.className = "flex items-center px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm text-gray-800";
            option.onclick = function (e) {
                if (isEditMode) {
                    isEditMode = false;
                    toggleEditModeState();
                }
                displayedCurrencies.push(currency);
                toggleDropdown('add-currency-dropdown', e);
                fillCurrencyTable();
                updateAddCurrencyDropdown();
            };
            dropdown.appendChild(option);
        }
    });
}

function fillCurrencyTable() {
    const tableBody = document.getElementById("currency-table-body");
    if (!tableBody) return;

    tableBody.innerHTML = '';
    
    displayedCurrencies.forEach((currency, index) => {
        if (exchangeRates[currency]) {
            const row = document.createElement("tr");

            // Datos
            const compra = exchangeRates[currency].compra;
            const venta = exchangeRates[currency].venta;
            
            // Variaciones
            const closingCompra = closingRates[currency]?.compra || 0;
            const closingVenta = closingRates[currency]?.venta || 0;
            const varCompra = calculateVariationPercentage(compra, closingCompra);
            const varVenta = calculateVariationPercentage(venta, closingVenta);

            // Obtener Badges
            const badgeCompra = (currency === 'CLP') ? '' : getVariationBadge(varCompra);
            const badgeVenta = (currency === 'CLP') ? '' : getVariationBadge(varVenta);

            // Determinar clases para hover y fondo
            const baseClasses = "hover:bg-white/10 transition duration-200";
            // Si es la primera fila (CLP normalmente), le damos un tinte azul muy sutil
            const rowClass = index === 0 ? "bg-blue-900/20" : "";
            
            row.className = `${baseClasses} ${rowClass} currency-row`;

            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <img class="h-10 w-10 rounded-full shadow-md object-cover mr-4 ring-2 ring-white/10" src="${exchangeRates[currency].icono}" alt="${currency}">
                        <div class="text-xl font-bold text-white tracking-wide">${currency}</div>
                    </div>
                </td>
                
                <td class="px-6 py-4 text-center whitespace-nowrap compra-column">
                    <div class="text-xl font-bold text-white">${compra ? Math.floor(compra) : '-'} <span class="text-md text-blue-300 ml-1">CLP</span></div>
                </td>

                <td class="px-6 py-4 text-center whitespace-nowrap compra-column">
                    ${badgeCompra}
                </td>

                <td class="px-6 py-4 text-center whitespace-nowrap venta-column hidden">
                    <div class="text-xl font-bold text-white">${venta ? Math.floor(venta) : '-'} <span class="text-md text-blue-300 ml-1">CLP</span></div>
                </td>

                <td class="px-6 py-4 text-center whitespace-nowrap venta-column hidden">
                    ${badgeVenta}
                </td>

                <td class="px-2 py-4 text-center whitespace-nowrap edit-column ${isEditMode ? '' : 'hidden'}">
                    ${currency !== 'CLP' ? `
                    <button onclick="deleteCurrency('${currency}')" class="text-red-400 hover:text-red-300 hover:bg-red-900/30 p-2 rounded-full transition">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                    ` : ''}
                </td>
            `;

            tableBody.appendChild(row);
        }
    });

    toggleTableColumns();
    toggleEditModeState();
}

function toggleTableColumns() {
    const isMobile = window.matchMedia('(max-width: 887px)').matches;
    const isChecked = document.getElementById("toggle-switch")?.checked;
    const mobileToggle = document.getElementById("mobile-toggle");
    
    // Columnas
    const compraColumns = document.querySelectorAll(".compra-column");
    const ventaColumns = document.querySelectorAll(".venta-column");
    
    // Headers (col)
    const compraHeaders = document.querySelectorAll(".compra-col");
    const ventaHeaders = document.querySelectorAll(".venta-col");

    if (isMobile) {
        if(mobileToggle) mobileToggle.classList.remove("hidden");
        
        if (isChecked) {
            // Mostrar Venta
            compraColumns.forEach(el => el.classList.add("hidden"));
            compraHeaders.forEach(el => el.classList.add("hidden"));
            
            ventaColumns.forEach(el => el.classList.remove("hidden"));
            ventaHeaders.forEach(el => el.classList.remove("hidden"));
        } else {
            // Mostrar Compra
            compraColumns.forEach(el => el.classList.remove("hidden"));
            compraHeaders.forEach(el => el.classList.remove("hidden"));
            
            ventaColumns.forEach(el => el.classList.add("hidden"));
            ventaHeaders.forEach(el => el.classList.add("hidden"));
        }
    } else {
        if(mobileToggle) mobileToggle.classList.add("hidden");
        // Escritorio: mostrar todo
        compraColumns.forEach(el => el.classList.remove("hidden"));
        ventaColumns.forEach(el => el.classList.remove("hidden"));
        compraHeaders.forEach(el => el.classList.remove("hidden"));
        ventaHeaders.forEach(el => el.classList.remove("hidden"));
    }
}

function updateLastUpdatedTimestamp(fecha) {
    const format = { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' };
    
    // Usar fecha actual si no viene fecha
    const dateObj = fecha ? new Date(fecha) : new Date();
    const dateStr = dateObj.toLocaleString('es-CL', format);

    const el1 = document.getElementById("last-updated1");
    const el2 = document.getElementById("last-updated2");
    
    if (el1) el1.textContent = `Actualizado: ${dateStr}`;
    if (el2) el2.textContent = `Actualizado: ${dateStr}`;
}

function toggleDropdown(dropdownId, event) {
    if(event) event.stopPropagation();
    const dropdown = document.getElementById(dropdownId);
    if(!dropdown) return;

    if (activeDropdown && activeDropdown !== dropdown) {
        activeDropdown.classList.add("hidden");
    }

    if (dropdown.classList.contains("hidden")) {
        dropdown.classList.remove("hidden");
        activeDropdown = dropdown;
        if (dropdown.children.length === 0) {
            showDropdownSkeleton(dropdownId);
        }
    } else {
        dropdown.classList.add("hidden");
        activeDropdown = null;
    }
}

window.toggleDropdown = toggleDropdown;

document.addEventListener("click", function (event) {
    if (activeDropdown && !activeDropdown.contains(event.target) && !event.target.closest("[onclick*='toggleDropdown']")) {
        activeDropdown.classList.add("hidden");
        activeDropdown = null;
    }
});

function toggleEditModeState() {
    const editColumns = document.querySelectorAll(".edit-column");
    editColumns.forEach(col => {
        if (isEditMode) {
            col.classList.remove("hidden");
            // Forzamos table-cell si no es hidden, tailwind lo maneja con hidden class, 
            // pero si usas display:none inline en algún lado, límpialo.
            col.style.display = ""; 
        } else {
            col.classList.add("hidden");
        }
    });
}

function toggleEditMode() {
    isEditMode = !isEditMode;
    toggleEditModeState();
    fillCurrencyTable(); // Re-render para asegurar estructura
}
window.toggleEditMode = toggleEditMode;

function deleteCurrency(currency) {
    displayedCurrencies = displayedCurrencies.filter(c => c !== currency);
    // Si borras, podrías querer mantener el modo edición o salir. Aquí salimos para seguridad visual.
    // isEditMode = false; 
    fillCurrencyTable();
    updateAddCurrencyDropdown();
}
window.deleteCurrency = deleteCurrency;

// Listeners
window.addEventListener("resize", toggleTableColumns);
window.addEventListener("load", toggleTableColumns);