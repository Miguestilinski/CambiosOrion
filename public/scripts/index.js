let exchangeRates = {};

// Llamar a la función para cargar las divisas al inicio
window.onload = function () {
    loadCurrencies();
};

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

            dropdown1.innerHTML = '';
            dropdown2.innerHTML = '';

            data.forEach(divisa => {
                // Crear opción para currency1
                const option1 = document.createElement("div");
                option1.innerHTML = `<img src="${divisa.icono}" alt="${divisa.nombre}" class="w-5 h-5 mr-2"> ${divisa.nombre}`;
                option1.className = "p-2 hover:bg-gray-100 cursor-pointer";
                option1.onclick = function () {
                    setCurrency1(divisa.nombre);
                    dropdown1.style.display = 'none';
                };
                dropdown1.appendChild(option1);

                // Crear opción para currency2
                const option2 = document.createElement("div");
                option2.innerHTML = `<img src="${divisa.icono}" alt="${divisa.nombre}" class="w-5 h-5 mr-2"> ${divisa.nombre}`;
                option2.className = "p-2 hover:bg-gray-100 cursor-pointer";
                option2.onclick = function () {
                    setCurrency2(divisa.nombre);
                    dropdown2.style.display = 'none';
                };
                dropdown2.appendChild(option2);
            });

            // Establecer opciones por defecto
            document.getElementById("currency1").textContent = "CLP"; 
            document.getElementById("currency2").textContent = "USD"; 

            // Inicializar tasas de CLP y USD
            exchangeRates["CLP"] = {
                compra: parseFloat(data.find(d => d.nombre === "CLP").compra),
                venta: parseFloat(data.find(d => d.nombre === "CLP").venta),
            };
            exchangeRates["USD"] = {
                compra: parseFloat(data.find(d => d.nombre === "USD").compra),
                venta: parseFloat(data.find(d => d.nombre === "USD").venta),
            };

            convertFromAmount1(); 
        })
        .catch(error => console.error('Error al cargar las divisas:', error));
}

// Función para establecer currency1
function setCurrency1(currency) {
    document.getElementById("currency1").textContent = currency;

    // Si el usuario selecciona una divisa diferente a CLP, currency2 se convierte en CLP automáticamente
    if (currency !== "CLP") {
        document.getElementById("currency2").textContent = "CLP";
    }

    exchangeRates[currency] = exchangeRates[currency] || { compra: 0, venta: 0 }; // Si aún no se ha asignado la tasa de esa divisa
    convertFromAmount1();
}

// Función para establecer currency2
function setCurrency2(currency) {
    document.getElementById("currency2").textContent = currency;

    // Si el usuario selecciona una divisa diferente a CLP, currency1 se convierte en CLP automáticamente
    if (currency !== "CLP") {
        document.getElementById("currency1").textContent = "CLP";
    }

    exchangeRates[currency] = exchangeRates[currency] || { compra: 0, venta: 0 }; // Si aún no se ha asignado la tasa de esa divisa
    convertFromAmount2();
}

// Función para convertir desde la primera cantidad (desde currency1 a currency2)
function convertFromAmount1() {
    const amount1 = parseFloat(document.getElementById("amount1").value);
    const currency1 = document.getElementById("currency1").textContent;
    const currency2 = document.getElementById("currency2").textContent;

    if (amount1 && exchangeRates[currency1] && exchangeRates[currency2]) {
        let result;
        if (currency1 === "CLP" && currency2 !== "CLP") {
            // Convertir de CLP a currency2 (compra currency2 a tasa de venta)
            result = (amount1 / exchangeRates[currency2].venta).toFixed(2);
        } else if (currency1 !== "CLP" && currency2 === "CLP") {
            // Convertir de currency1 a CLP (vende currency1 a tasa de compra)
            result = (amount1 * exchangeRates[currency1].compra).toFixed(2);
        } else if (currency1 !== "CLP" && currency2 !== "CLP") {
            // Convertir de una divisa extranjera a otra divisa extranjera (intermedio CLP)
            const clpAmount = amount1 * exchangeRates[currency1].compra; // Convierte a CLP usando compra
            result = (clpAmount / exchangeRates[currency2].venta).toFixed(2); // Convierte de CLP a currency2 usando venta
        } else {
            // Si ambas divisas son CLP, no se requiere conversión
            result = amount1.toFixed(2);
        }
        document.getElementById("amount2").value = result;
    } else {
        document.getElementById("amount2").value = "0.00";
    }
}

// Función para convertir desde la segunda cantidad (desde currency2 a currency1)
function convertFromAmount2() {
    const amount2 = parseFloat(document.getElementById("amount2").value);
    const currency1 = document.getElementById("currency1").textContent;
    const currency2 = document.getElementById("currency2").textContent;

    if (amount2 && exchangeRates[currency1] && exchangeRates[currency2]) {
        let result;
        if (currency2 === "CLP" && currency1 !== "CLP") {
            // Convertir de CLP a currency1 (compra currency1 a tasa de venta)
            result = (amount2 / exchangeRates[currency1].venta).toFixed(2);
        } else if (currency2 !== "CLP" && currency1 === "CLP") {
            // Convertir de currency2 a CLP (vende currency2 a tasa de compra)
            result = (amount2 * exchangeRates[currency2].compra).toFixed(2);
        } else if (currency1 !== "CLP" && currency2 !== "CLP") {
            // Convertir de una divisa extranjera a otra divisa extranjera (intermedio CLP)
            const clpAmount = amount2 * exchangeRates[currency2].compra; // Convierte a CLP usando compra
            result = (clpAmount / exchangeRates[currency1].venta).toFixed(2); // Convierte de CLP a currency1 usando venta
        } else {
            // Si ambas divisas son CLP, no se requiere conversión
            result = amount2.toFixed(2);
        }
        document.getElementById("amount1").value = result;
    } else {
        document.getElementById("amount1").value = "0.00";
    }
}

// Función para alternar el dropdown
function toggleDropdown(dropdownId) {
    const dropdown = document.getElementById(dropdownId);
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
}

// Cerrar dropdowns al hacer clic fuera
window.onclick = function (event) {
    if (!event.target.matches('.select-box')) {
        const dropdowns = document.getElementsByClassName("dropdown-content");
        for (let i = 0; i < dropdowns.length; i++) {
            dropdowns[i].style.display = "none";
        }
    }
};
