let exchangeRates = {};

// Llamar a la función para cargar las divisas al inicio
window.onload = function() {
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
                option1.innerHTML = `<img src="${divisa.icono}" alt="${divisa.nombre}" style="width: 20px; height: 20px;"> ${divisa.nombre}`;
                option1.onclick = function() {
                    document.getElementById("currency1").textContent = divisa.nombre;
                    dropdown1.style.display = 'none'; // Ocultar dropdown
                    exchangeRates[divisa.nombre] = {
                        compra: parseFloat(divisa.compra),
                        venta: parseFloat(divisa.venta),
                        tasa: parseFloat(divisa.tasa)
                    };
                };
                dropdown1.appendChild(option1);

                // Crear opción para currency2
                const option2 = document.createElement("div");
                option2.innerHTML = `<img src="${divisa.icono}" alt="${divisa.nombre}" style="width: 20px; height: 20px;"> ${divisa.nombre}`;
                option2.onclick = function() {
                    document.getElementById("currency2").textContent = divisa.nombre;
                    dropdown2.style.display = 'none'; // Ocultar dropdown
                    exchangeRates[divisa.nombre] = {
                        compra: parseFloat(divisa.compra),
                        venta: parseFloat(divisa.venta),
                        tasa: parseFloat(divisa.tasa)
                    };
                };
                dropdown2.appendChild(option2);
            });
        })
        .catch(error => console.error('Error al cargar las divisas:', error));
}

// Función para convertir divisas
function convert() {
    const amount1 = parseFloat(document.getElementById("amount1").value);
    const currency1 = document.getElementById("currency1").textContent;
    const currency2 = document.getElementById("currency2").textContent;

    if (amount1 && exchangeRates[currency1]) {
        const rate = exchangeRates[currency1].venta; // Usar la tasa de venta
        const result = (amount1 / rate) * exchangeRates[currency2].compra; // Convertir al valor de currency2
        document.getElementById("amount2").value = result.toFixed(2);
    } else {
        document.getElementById("amount2").value = "0.00";
    }
}

// Función para alternar el dropdown
function toggleDropdown(dropdownId) {
    const dropdown = document.getElementById(dropdownId);
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
}

// Cerrar dropdown al hacer clic fuera
window.onclick = function(event) {
    if (!event.target.matches('.select-box')) {
        const dropdowns = document.getElementsByClassName("dropdown-content");
        for (let i = 0; i < dropdowns.length; i++) {
            dropdowns[i].style.display = "none";
        }
    }
}
