import { Country, State, City } from "/orionapp/node-modules/country-state-city";

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("dynamic-form");
    const autorizadosContainer = document.getElementById("autorizados-container");
    const addAutorizadoButton = document.getElementById("add-autorizado");

    // Array para almacenar los datos del formulario
    let formularioData = [];

    // Función para agregar un nuevo campo de persona autorizada
    const agregarPersonaAutorizada = () => {
        const autorizadoDiv = document.createElement("div");
        autorizadoDiv.classList.add("mb-6", "autorizado-item");

        autorizadoDiv.innerHTML = `
            <div class="mb-6">
                <label class="block mt-2 mb-2 text-sm font-medium text-white">Nombre:</label>
                <input type="text" name="autorizado_nombre[]" class="bg-gray-700 border border-gray-600 text-gray-100 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" required>
            </div>
            <div class="mb-6">
                <label class="block mt-2 mb-2 text-sm font-medium text-white">Teléfono:</label>
                <input type="tel" name="autorizado_telefono[]" class="bg-gray-700 border border-gray-600 text-gray-100 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" required>
            </div>
            <div class="mb-6">
                <label class="block mt-2 mb-2 text-sm font-medium text-white">Email:</label>
                <input type="email" name="autorizado_email[]" class="bg-gray-700 border border-gray-600 text-gray-100 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" required>
            </div>
            <button type="button" class="remove-autorizado text-white bg-red-600 hover:bg-red-700 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm px-4 py-2">Eliminar</button>
        `;

        autorizadosContainer.appendChild(autorizadoDiv);

        autorizadoDiv.querySelector(".remove-autorizado").addEventListener("click", () => {
            autorizadoDiv.remove();
        });
    };

    addAutorizadoButton.addEventListener("click", () => {
        agregarPersonaAutorizada();
    }); 

    const fechaInput = document.getElementById("fecha");

    if (fechaInput) {
        const today = new Date();

        // Formatear la fecha como yyyy-MM-dd para el campo
        const isoDate = [
            today.getFullYear(),
            String(today.getMonth() + 1).padStart(2, '0'),
            String(today.getDate()).padStart(2, '0')
        ].join('-');

        // Establecer el valor ISO en el campo de fecha
        fechaInput.value = isoDate;

        // Opcional: Mostrar el formato dd/mm/yyyy en un elemento de texto si lo necesitas
        const formattedDate = [
            String(today.getDate()).padStart(2, '0'),
            String(today.getMonth() + 1).padStart(2, '0'),
            today.getFullYear()
        ].join('/');

    } else {
        console.error("No se encontró el campo con ID 'fecha'");
    }

    // Evento para manejar el envío del formulario
    form.addEventListener("submit", (event) => {
        event.preventDefault(); // Evitar envío normal del formulario

        // Recopilar todos los datos del formulario
        const formData = new FormData(form);

        formularioData = [];
        formData.forEach((value, key) => {
            formularioData.push({ [key]: value });
        });

        console.log("Datos recopilados:", formularioData);

        // Lógica para la firma en celular
        const signaturePadContainer = document.getElementById("signature-pad-container");
        const startSignatureButton = document.getElementById("start-signature");

        startSignatureButton.addEventListener('click', function() {
            if (window.innerWidth <= 887) {
                signaturePadContainer.style.display = "block";
                signaturePadContainer.scrollIntoView({ behavior: 'smooth' });
            }
        });

        // Enviar formulario (simulación de flujo)
        const dynamicForm = document.getElementById('dynamic-form');
        dynamicForm.addEventListener('submit', function(event) {
            event.preventDefault();

            // Verificar si la firma fue realizada
            const signaturePad = document.getElementById("signature-pad");
            if (!signaturePad || signaturePad.value === "") {
                alert("Por favor, firme el formulario.");
                return;
            }

            alert("Formulario enviado correctamente. Validando firma electrónica.");
            // Aquí puedes integrar la lógica para manejar los datos del formulario
        });

        // fetch("/submit_form", { method: "POST", body: JSON.stringify(formularioData) });

        alert("Formulario enviado exitosamente.");
    });

    // Referencias a elementos del DOM
    const pais = document.getElementById("pais");
    const region = document.getElementById("region");
    const ciudad = document.getElementById("ciudad");

    const paisParticular = document.getElementById("pais-particular");
    const regionParticular = document.getElementById("region-particular");
    const ciudadParticular = document.getElementById("ciudad-particular");
    
    // Helper function to populate a select dropdown
    const populateSelect = (selectElement, items, placeholder) => {
        selectElement.innerHTML = ""; // Clear previous options
        const defaultOption = document.createElement("option");
        defaultOption.value = "";
        defaultOption.textContent = placeholder;
        defaultOption.disabled = true;
        defaultOption.selected = true;
        selectElement.appendChild(defaultOption);

        items.forEach(item => {
            const option = document.createElement("option");
            option.value = item.isoCode || item.name; // Use isoCode or name as value
            option.textContent = item.name;
            selectElement.appendChild(option);
        });
    };

    // Load countries for both sections
    const loadCountries = () => {
        const countries = Country.getAllCountries();
        populateSelect(pais, countries, "Selecciona un país");
        populateSelect(paisParticular, countries, "Selecciona un país");
    };

    // Load regions based on selected country
    const loadRegions = (countryCode, targetRegionSelect) => {
        const states = State.getStatesOfCountry(countryCode);
        populateSelect(targetRegionSelect, states, "Selecciona una región");
        targetRegionSelect.disabled = states.length === 0;
    };

    // Load cities based on selected region
    const loadCities = (countryCode, stateCode, targetCitySelect) => {
        const cities = City.getCitiesOfState(countryCode, stateCode);
        populateSelect(targetCitySelect, cities, "Selecciona una ciudad");
        targetCitySelect.disabled = cities.length === 0;
    };

    // Event listeners for 'pais' and 'pais-particular'
    pais.addEventListener("change", () => {
        const selectedCountry = pais.value;
        loadRegions(selectedCountry, region);
        ciudad.disabled = true; // Disable city until region is selected
        ciudad.innerHTML = "<option disabled selected>Selecciona una ciudad</option>";
    });

    paisParticular.addEventListener("change", () => {
        const selectedCountry = paisParticular.value;
        loadRegions(selectedCountry, regionParticular);
        ciudadParticular.disabled = true; // Disable city until region is selected
        ciudadParticular.innerHTML = "<option disabled selected>Selecciona una ciudad</option>";
    });

    // Event listeners for 'region' and 'region-particular'
    region.addEventListener("change", () => {
        const selectedRegion = region.value;
        const selectedCountry = pais.value;
        loadCities(selectedCountry, selectedRegion, ciudad);
    });

    regionParticular.addEventListener("change", () => {
        const selectedRegion = regionParticular.value;
        const selectedCountry = paisParticular.value;
        loadCities(selectedCountry, selectedRegion, ciudadParticular);
    });

    // Initialize the form with countries
    loadCountries();
});

