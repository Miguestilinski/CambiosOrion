let exchangeRates = {};

// Llamar a la función para cargar las divisas al inicio
window.onload = function () {
    loadCurrencies();
};

// Cargar las divisas
function loadCurrencies() {
    fetch('https://cambiosorion.cl/data/obtener_divisas.php') // Asegúrate de que esta URL sea correcta
        .then(response => {
            if (!response.ok) {
                throw new Error('Error en la red: ' + response.status);
            }
            return response.json();
        })
        .then(data => {
            const dropdown1 = document.getElementById("dropdown1");
            const dropdown2 = document.getElementById("dropdown2");

            data.forEach(divisa => {
                // Crear opción para currency1
                const option1 = document.createElement("div");
                option1.innerHTML = `<img src="${divisa.icono}" alt="${divisa.nombre}" class="w-5 h-5 mr-2"> ${divisa.nombre}`;
                option1.className = "p-2 hover:bg-gray-100 cursor-pointer";
                option1.onclick = function () {
                    document.getElementById("currency1").textContent = divisa.nombre;
                    dropdown1.style.display = 'none'; // Ocultar dropdown
                    exchangeRates[divisa.nombre] = {
                        compra: parseFloat(divisa.compra),
                        venta: parseFloat(divisa.venta),
                        tasa: parseFloat(divisa.tasa)
                    };
                    // Realizar la conversión automática cuando se selecciona una divisa
                    convertFromAmount1();
                };
                dropdown1.appendChild(option1);

                // Crear opción para currency2
                const option2 = document.createElement("div");
                option2.innerHTML = `<img src="${divisa.icono}" alt="${divisa.nombre}" class="w-5 h-5 mr-2"> ${divisa.nombre}`;
                option2.className = "p-2 hover:bg-gray-100 cursor-pointer";
                option2.onclick = function () {
                    document.getElementById("currency2").textContent = divisa.nombre;
                    dropdown2.style.display = 'none'; // Ocultar dropdown
                    exchangeRates[divisa.nombre] = {
                        compra: parseFloat(divisa.compra),
                        venta: parseFloat(divisa.venta),
                        tasa: parseFloat(divisa.tasa)
                    };
                    // Realizar la conversión automática cuando se selecciona una divisa
                    convertFromAmount2(); // Asegúrate de llamar a convertFromAmount2 para reflejar el cambio
                };
                dropdown2.appendChild(option2);
            });

            // Establecer opciones por defecto
            document.getElementById("currency1").textContent = "CLP"; // Opción predeterminada
            document.getElementById("currency2").textContent = "USD"; // Opción predeterminada

            // Asegúrate de que las tasas de cambio estén disponibles para las divisas predeterminadas
            exchangeRates["CLP"] = {
                compra: parseFloat(data.find(d => d.nombre === "CLP").compra),
                venta: parseFloat(data.find(d => d.nombre === "CLP").venta),
                tasa: parseFloat(data.find(d => d.nombre === "CLP").tasa)
            };
            exchangeRates["USD"] = {
                compra: parseFloat(data.find(d => d.nombre === "USD").compra),
                venta: parseFloat(data.find(d => d.nombre === "USD").venta),
                tasa: parseFloat(data.find(d => d.nombre === "USD").tasa)
            };

            // Actualizar las tasas iniciales según las divisas predeterminadas
            convertFromAmount1(); // Para establecer el resultado inicial en amount2
        })
        .catch(error => console.error('Error al cargar las divisas:', error));
}

// Función para convertir desde la primera cantidad
function convertFromAmount1() {
    const amount1 = parseFloat(document.getElementById("amount1").value);
    const currency1 = document.getElementById("currency1").textContent;
    const currency2 = document.getElementById("currency2").textContent;

    if (amount1 && exchangeRates[currency1] && exchangeRates[currency2]) {
        const rate = exchangeRates[currency1].venta;
        const result = (amount1 / rate) * exchangeRates[currency2].compra;
        document.getElementById("amount2").value = result.toFixed(2);
    } else {
        document.getElementById("amount2").value = "0.00";
    }
}

// Función para convertir desde la segunda cantidad
function convertFromAmount2() {
    const amount2 = parseFloat(document.getElementById("amount2").value);
    const currency1 = document.getElementById("currency1").textContent;
    const currency2 = document.getElementById("currency2").textContent;

    if (amount2 && exchangeRates[currency1] && exchangeRates[currency2]) {
        const rate = exchangeRates[currency2].compra;
        const result = (amount2 / rate) * exchangeRates[currency1].venta;
        document.getElementById("amount1").value = result.toFixed(2);
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
