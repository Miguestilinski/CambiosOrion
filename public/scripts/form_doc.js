import { PDFDocument } from 'https://cdn.skypack.dev/pdf-lib';

// Tu API Key
const API_KEY = "VGxiNkY4OTUzb3FPamxZWlNmb3Iwd3V5Z0NFdVVNd082NXJTdWR4OQ==";

// Configuración de los headers para la solicitud
const headers = new Headers();
headers.append("X-CSCAPI-KEY", API_KEY);

const requestOptions = {
    method: "GET",
    headers: headers,
    redirect: "follow",
};

// Función genérica para cargar países
const cargarPaises = async (selectId) => {
    try {
        const response = await fetch("https://api.countrystatecity.in/v1/countries", requestOptions);
        const countries = await response.json();
        populateSelect(document.getElementById(selectId), countries, "Selecciona un país");
    } catch (error) {
        console.error("Error al cargar países:", error);
    }
};

// Función genérica para cargar regiones
const cargarRegiones = async (countryCode, regionSelectId, citySelectId) => {
    try {
        const response = await fetch(`https://api.countrystatecity.in/v1/countries/${countryCode}/states`, requestOptions);
        const states = await response.json();
        const regionSelect = document.getElementById(regionSelectId);
        populateSelect(regionSelect, states, "Selecciona una región");
        regionSelect.disabled = states.length === 0;

        // Reiniciar la lista de ciudades
        resetCitySelect(citySelectId);
    } catch (error) {
        console.error("Error al cargar regiones:", error);
    }
};

// Función genérica para cargar ciudades
const cargarCiudades = async (countryCode, stateCode, citySelectId) => {
    try {
        const response = await fetch(`https://api.countrystatecity.in/v1/countries/${countryCode}/states/${stateCode}/cities`, requestOptions);
        const cities = await response.json();
        const citySelect = document.getElementById(citySelectId);
        populateSelect(citySelect, cities, "Selecciona una ciudad");
        citySelect.disabled = cities.length === 0;
    } catch (error) {
        console.error("Error al cargar ciudades:", error);
    }
};

// Helper para llenar un select
const populateSelect = (selectElement, items, placeholder) => {
    selectElement.innerHTML = "";
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = placeholder;
    defaultOption.disabled = true;
    defaultOption.selected = true;
    selectElement.appendChild(defaultOption);

    items.forEach((item) => {
        const option = document.createElement("option");
        option.value = item.iso2 || item.name;
        option.textContent = item.name;
        selectElement.appendChild(option);
    });
};

// Helper para reiniciar un select de ciudades
const resetCitySelect = (citySelectId) => {
    const citySelect = document.getElementById(citySelectId);
    citySelect.innerHTML = "<option value='' disabled selected>Selecciona una ciudad</option>";
    citySelect.disabled = true;
};

const toggleEmpresaTipo = () => {
    const tipoEmpresa = document.querySelector('input[name="tipo-empresa"]:checked').value;
    const rutContainer = document.getElementById("rut-container");
    const taxIdContainer = document.getElementById("tax-id-container");
    const rutInput = document.getElementById("rut");
    const taxIdInput = document.getElementById("tax-id");

    if (tipoEmpresa === "nacional") {
        rutContainer.classList.remove("hidden");
        taxIdContainer.classList.add("hidden");
        rutInput.required = true;
        taxIdInput.required = false;
        rutInput.value = ""; // Limpia el campo al cambiar
    } else if (tipoEmpresa === "extranjera") {
        rutContainer.classList.add("hidden");
        taxIdContainer.classList.remove("hidden");
        rutInput.required = false;
        taxIdInput.required = true;
        taxIdInput.value = ""; // Limpia el campo al cambiar
    }
};

// Formatear el RUT automáticamente
document.getElementById("rut").addEventListener("input", (event) => {
    const input = event.target;
    input.value = formatRUT(input.value);
});

const formatRUT = (rut) => {
    rut = rut.replace(/[^0-9kK]/g, ""); // Elimina caracteres no válidos
    if (rut.length > 1) {
        rut = rut.slice(0, -1).replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.") + "-" + rut.slice(-1);
    }
    return rut.toUpperCase();
};

window.toggleEmpresaTipo = toggleEmpresaTipo;

async function completarPDF(formularioData) {
    try {
        const pdfUrl = "/orionapp/assets/Formulario_Estandar_Orion.pdf";
        const existingPdfBytes = await fetch(pdfUrl).then(res => res.arrayBuffer());
        const pdfDoc = await PDFDocument.load(existingPdfBytes);
        const form = pdfDoc.getForm();

        const fechaField = form.getTextField('fecha:date');

        const fechaInput = document.querySelector('#fecha');
        const fecha = new Date(fechaInput.value); 

        const dia = fecha.getDate().toString().padStart(2, '0');
        const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
        const año = fecha.getFullYear();

        fechaField.setText(fecha.toLocaleDateString());

        const diaField = form.getTextField('dia');
        const mesField = form.getTextField('mes');
        const añoField = form.getTextField('año');

        diaField.setText(dia);
        mesField.setText(mes);
        añoField.setText(año.toString());

        const tipoEmpresa = form.getChechbox('tipo-empresa');
        const docIdEmpresaField = form.getTextField('doc-id-empresa');
        const razonSocialEmpresaField = form.getTextField('razon-social-empresa');
        const rubroEmpresaField = form.getTextField('rubro-empresa');
        const nombreEmpresaField = form.getTextField('nombre-empresa');
        const direccionEmpresaField = form.getTextField('direccion-empresa');
        const ciudadEmpresaField = form.getTextField('ciudad-empresa');
        const regionEmpresaField = form.getTextField('region-empresa');
        const paisEmpresaField = form.getTextField('pais-empresa');
        const emailEmpresaField = form.getTextField('email-empresa');
        const telefonoEmpresaField = form.getTextField('telefono-empresa');

        fechaField.setText('fecha');
        diaField.setText('dia');
        mesField.setText('dia');
        añoField.setText('año');

        tipoEmpresa.check();
        docIdEmpresaField.setText('doc-id-empresa');
        razonSocialEmpresaField.setText('razon-social-empresa');
        rubroEmpresaField.setText('rubro-empresa');
        nombreEmpresaField.setText('nombre-empresa');
        direccionEmpresaField.setText('direccion-empresa');
        ciudadEmpresaField.setText('ciudad-empresa');
        regionEmpresaField.setText('region-empresa');
        paisEmpresaField.setText('pais-empresa');
        emailEmpresaField.setText('email-empresa');
        telefonoEmpresaField.setText('telefono-empresa');

        
        formularioData.forEach(field => {
            const fieldName = Object.keys(field)[0];
            const fieldValue = field[fieldName];
            const pdfField = form.getTextField(fieldName);
            if (pdfField) {
                pdfField.setText(fieldValue);
            }
        });

        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: "application/pdf" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "Formulario_Completado.pdf";
        link.click();
    } catch (error) {
        console.error("Error al completar el PDF:", error);
    }
}

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
                <input type="text" name="nombre-autorizado[]" class="bg-gray-700 border border-gray-600 text-gray-100 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" required>
            </div>
            <div class="mb-6">
                <label class="block mt-2 mb-2 text-sm font-medium text-white">Nº Doc. Identidad:</label>
                <input type="text" name="doc-id-autorizado[]" class="bg-gray-700 border border-gray-600 text-gray-100 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" required>
            </div>
            <div class="mb-6">
                <label class="block mt-2 mb-2 text-sm font-medium text-white">Cargo:</label>
                <input type="text" name="cargo-autorizado[]" class="bg-gray-700 border border-gray-600 text-gray-100 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" required>
            </div>
            <div class="mb-6">
                <label class="block mt-2 mb-2 text-sm font-medium text-white">Email:</label>
                <input type="email" name="email-autorizado[]" class="bg-gray-700 border border-gray-600 text-gray-100 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" required>
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
    form.addEventListener("submit", async (event) => {
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

        // Completar y descargar el PDF
        await completarPDF(formularioData);

        alert("PDF generado y descargado exitosamente.");

        // fetch("/submit_form", { method: "POST", body: JSON.stringify(formularioData) });

        alert("Formulario enviado exitosamente.");
    });

    // Cargar países para ambos conjuntos
    cargarPaises("pais-empresa");
    cargarPaises("pais-rlegal");

    // Listener para el primer conjunto
    document.getElementById("pais-empresa").addEventListener("change", (e) => {
        const countryCode = e.target.value;
        cargarRegiones(countryCode, "region-empresa", "ciudad-empresa");
    });

    document.getElementById("region-empresa").addEventListener("change", (e) => {
        const stateCode = e.target.value;
        const countryCode = document.getElementById("pais-empresa").value;
        cargarCiudades(countryCode, stateCode, "ciudad-empresa");
    });

    // Listener para el segundo conjunto
    document.getElementById("pais-rlegal").addEventListener("change", (e) => {
        const countryCode = e.target.value;
        cargarRegiones(countryCode, "region-rlegal", "ciudad-rlegal");
    });

    document.getElementById("region-rlegal").addEventListener("change", (e) => {
        const stateCode = e.target.value;
        const countryCode = document.getElementById("pais-rlegal").value;
        cargarCiudades(countryCode, stateCode, "ciudad-rlegal");
    });

    window.cargarRegiones = cargarRegiones;
    window.cargarCiudades = cargarCiudades;

});
