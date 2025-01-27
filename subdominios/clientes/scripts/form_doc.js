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
    const rutEmpresaContainer = document.getElementById("rut-empresa-container");
    const taxIdContainer = document.getElementById("tax-id-container");
    const rutEmpresaInput = document.getElementById("rut-empresa");
    const taxIdInput = document.getElementById("tax-id");

    if (tipoEmpresa === "nacional") {
        rutEmpresaContainer.classList.remove("hidden");
        taxIdContainer.classList.add("hidden");
        rutEmpresaInput.required = true;
        taxIdInput.required = false;
        rutEmpresaInput.value = ""; // Limpia el campo al cambiar
    } else if (tipoEmpresa === "extranjera") {
        rutEmpresaContainer.classList.add("hidden");
        taxIdContainer.classList.remove("hidden");
        rutEmpresaInput.required = false;
        taxIdInput.required = true;
        taxIdInput.value = ""; // Limpia el campo al cambiar
    }
};

const toggleNacionalidadRlegal = () => {
    const nacionalidadRlegal = document.querySelector('input[name="nacionalidad-rlegal"]:checked').value;
    const rutRlegalContainer = document.getElementById("rut-rlegal-container");
    const docIdRlegalContainer = document.getElementById("doc-id-rlegal-container");
    const rutRlegalInput = document.getElementById("rut-rlegal");
    const docIdRlegalInput = document.getElementById("doc-id-rlegal");

    if (nacionalidadRlegal === "chilena") {
        rutRlegalContainer.classList.remove("hidden");
        docIdRlegalContainer.classList.add("hidden");
        rutRlegalInput.required = true;
        docIdRlegalInput.required = false;
        rutRlegalInput.value = ""; // Limpia el campo al cambiar
    } else if (nacionalidadRlegal === "extranjera") {
        rutRlegalContainer.classList.add("hidden");
        docIdRlegalContainer.classList.remove("hidden");
        rutRlegalInput.required = false;
        docIdRlegalInput.required = true;
        docIdRlegalInput.value = ""; // Limpia el campo al cambiar
    }
};

const toggleNacionalidadDec = () => {
    const nacionalidadDec = document.querySelector('input[name="nacionalidad-dec"]:checked').value;
    const rutDecContainer = document.getElementById("rut-dec-container");
    const docIdDecContainer = document.getElementById("doc-id-dec-container");
    const rutDecInput = document.getElementById("rut-dec");
    const docIdDecInput = document.getElementById("doc-id-dec");

    if (nacionalidadDec === "chilena") {
        rutDecContainer.classList.remove("hidden");
        docIdDecContainer.classList.add("hidden");
        rutDecInput.required = true;
        docIdDecInput.required = false;
        rutDecInput.value = ""; // Limpia el campo al cambiar
    } else if (nacionalidadDec === "extranjera") {
        rutDecContainer.classList.add("hidden");
        docIdDecContainer.classList.remove("hidden");
        rutDecInput.required = false;
        docIdDecInput.required = true;
        docIdDecInput.value = ""; // Limpia el campo al cambiar
    }
};

// Formatear el RUT automáticamente
document.getElementById("rut-empresa").addEventListener("input", (event) => {
    const input = event.target;
    input.value = formatRUT(input.value);
});

document.getElementById("rut-rlegal").addEventListener("input", (event) => {
    const input = event.target;
    input.value = formatRUT(input.value);
});

document.getElementById("rut-dec").addEventListener("input", (event) => {
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
window.toggleNacionalidadDec = toggleNacionalidadDec;
window.toggleNacionalidadRlegal = toggleNacionalidadRlegal;

// Contador de personas autorizadas
let autorizadosCount = 0;
let beneficiariosCount = 0;

async function completarPDF(formularioData, autorizadosCount, beneficiariosCount) {
    try {
        const pdfUrl = "https://cambiosorion.cl/orionapp/assets/Formulario_Estandar_Orion.pdf";
        const existingPdfBytes = await fetch(pdfUrl).then(res => res.arrayBuffer());
        const pdfDoc = await PDFDocument.load(existingPdfBytes);
        const form = pdfDoc.getForm();

        // Fecha
        const fechaField = form.getTextField('fecha:date');
        const fechaInput = document.querySelector('#fecha');
        const fecha = new Date(fechaInput.value);

        const dia = (fecha.getDate() + 1).toString().padStart(2, '0');
        const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
        const año = fecha.getFullYear();

        fechaField.setText(`${dia}/${mes}/${año}`);

        // Tipo de empresa
        const tipoEmpresaValue = document.querySelector('input[name="tipo-empresa"]:checked')?.value;

        // Comprobar cuál radio button está seleccionado
        if (tipoEmpresaValue === 'nacional') {
            const tipoEmpresaNacional = form.getCheckBox('tipo-empresa-nacional');
            tipoEmpresaNacional.check();
        } else if (tipoEmpresaValue === 'extranjera') {
            const tipoEmpresaExtranjera = form.getCheckBox('tipo-empresa-extranjera');
            tipoEmpresaExtranjera.check();
        }

        // Tipo de Órdenes a Recibir
        const tipoOrdenesValue = document.querySelector('input[name="tipo-ordenes"]:checked')?.value;
        if (tipoOrdenesValue) {
            const tipoOrdenesField = form.getCheckBox(`tipo-ordenes-${tipoOrdenesValue}`);
            if (tipoOrdenesField) {
                tipoOrdenesField.check();
            }
        }

        // Uso Interno
        const usoIntValue = document.querySelector('input[name="uso-int"]:checked')?.value;
        if (usoIntValue) {
            const usoIntField = form.getCheckBox(`uso-int-${usoIntValue}`);
            if (usoIntField) {
                usoIntField.check();
            }

            // Campo de texto adicional para "otros antecedentes"
            if (usoIntValue === 'otros') {
                const otrosAntValue = document.querySelector('input[name="otros-ant"]')?.value || '';
                const otrosAntField = form.getTextField('uso-int-otros-ant');
                if (otrosAntField) {
                    otrosAntField.setText(otrosAntValue);
                }
            }
        }

        // PEP
        const pepValue = document.querySelector('input[name="pep"]:checked')?.value;
        if (pepValue) {
            const pepField = form.getCheckBox(`pep-${pepValue}`);
            if (pepField) {
                pepField.check();
            }
        }

        // Función para asignar un campo basado en la lógica de nacionalidad/tipo
        const asignarCampoSegunTipo = (campoPDF, tipoCampo, idNacional, idExtranjero) => {
            const tipoSeleccionado = document.querySelector(`input[name="${tipoCampo}"]:checked`)?.value;
            let valor = "";

            if (tipoSeleccionado === "chilena" || tipoSeleccionado === "nacional") {
                valor = document.getElementById(idNacional)?.value || "";
            } else if (tipoSeleccionado === "extranjera") {
                valor = document.getElementById(idExtranjero)?.value || "";
            }

            const campoPdf = form.getTextField(campoPDF);
            if (campoPdf) {
                campoPdf.setText(valor);
            }
        };

        // Asignar valores al PDF para cada caso
        asignarCampoSegunTipo("doc-id-empresa", "tipo-empresa", "rut-empresa", "tax-id");
        asignarCampoSegunTipo("doc-id-rlegal", "nacionalidad-rlegal", "rut-rlegal", "doc-id-rlegal");
        asignarCampoSegunTipo("doc-id-dec", "nacionalidad-dec", "rut-dec", "doc-id-dec");

        // Asignar valores de texto del formulario web
        const asignarCampoTexto = (campoId, nombreVariable) => {
            const valor = document.querySelector(`#${nombreVariable}`)?.value || "";
            const campoPdf = form.getTextField(campoId);
            if (campoPdf) {
                campoPdf.setText(valor);
            }
        };

        asignarCampoTexto('dia', 'dia');
        asignarCampoTexto('mes', 'mes');
        asignarCampoTexto('año', 'año');

        asignarCampoTexto('razon-social-empresa', 'razon-social-empresa');
        asignarCampoTexto('rubro-empresa', 'rubro-empresa');
        asignarCampoTexto('nombre-empresa', 'nombre-empresa');
        asignarCampoTexto('tipo-sociedad', 'tipo-sociedad');
        asignarCampoTexto('direccion-empresa', 'direccion-empresa');
        asignarCampoTexto('ciudad-empresa', 'ciudad-empresa');
        asignarCampoTexto('pais-empresa', 'pais-empresa');
        asignarCampoTexto('email-empresa', 'email-empresa');
        asignarCampoTexto('telefono-empresa', 'telefono-empresa');

        asignarCampoTexto('estado-civil-rlegal', 'estado-civil-rlegal');
        asignarCampoTexto('nombre-rlegal', 'nombre-rlegal');
        asignarCampoTexto('nacionalidad-rlegal', 'nacionalidad-rlegal');
        asignarCampoTexto('direccion-rlegal', 'direccion-rlegal');
        asignarCampoTexto('email-rlegal', 'email-rlegal');

        for (let i = 1; i <= autorizadosCount; i++) {
            asignarCampoTexto(`nombre-autorizado${i}`, `nombre-autorizado${i}`);
            asignarCampoTexto(`doc-id-autorizado${i}`, `doc-id-autorizado${i}`);
            asignarCampoTexto(`cargo-autorizado${i}`, `cargo-autorizado${i}`);
            asignarCampoTexto(`email-autorizado${i}`, `email-autorizado${i}`);
            console.log("autorizados:", i);
        }

        asignarCampoTexto('nombre-dec', 'nombre-dec');
        asignarCampoTexto('nacionalidad-dec', 'nacionalidad-dec');

        for (let i = 1; i <= beneficiariosCount; i++) {
            asignarCampoTexto(`nombre-ben${i}`, `nombre-ben${i}`);
            asignarCampoTexto(`doc-id-ben{i}`, `doc-id-ben${i}`);
            asignarCampoTexto(`cargo-ben${i}`, `cargo-ben${i}`);
            asignarCampoTexto(`email-ben${i}`, `email-ben${i}`);
            console.log("beneficiarios:", i);
        }

        asignarCampoTexto('actividad', 'actividad');
        asignarCampoTexto('origen-fondos', 'origen-fondos');
        asignarCampoTexto('destino-fondos', 'destino-fondos');

        // Función para completar la sección PEP
        const completarPEP = (tipo, index, nombre, docId, nacionalidad, pep) => {
            const pepPrefix = tipo === 'rlegal' ? '' : `${tipo}${index}`;
            form.getTextField(`nombre-${pepPrefix}`).setText(nombre);
            form.getTextField(`doc-id-${pepPrefix}`).setText(docId);
            form.getTextField(`nacionalidad-${pepPrefix}`).setText(nacionalidad);
            form.getCheckBox(`pep-${pep}-ser-${pepPrefix}`).check();
        };

        // Obtener datos del formulario
        const rlegal = {
            nombre: formularioData['nombre-rlegal'],
            docId: formularioData['doc-id-rlegal'],
            nacionalidad: formularioData['nacionalidad-rlegal'],
            pep: formularioData['pep-rlegal'],
        };

        const autorizados = [];
        for (let i = 1; i <= 2; i++) {
            if (formularioData[`nombre-autorizado${i}`]) {
                autorizados.push({
                    nombre: formularioData[`nombre-autorizado${i}`],
                    docId: formularioData[`doc-id-autorizado${i}`],
                    nacionalidad: formularioData[`nacionalidad-autorizado${i}`],
                    pep: formularioData[`pep-autorizado${i}`],
                });
            }
        }

        const beneficiarios = [];
        for (let i = 1; i <= 9; i++) {
            if (formularioData[`nombre-ben${i}`]) {
                beneficiarios.push({
                    nombre: formularioData[`nombre-ben${i}`],
                    docId: formularioData[`doc-id-ben${i}`],
                    nacionalidad: formularioData[`nacionalidad-ben${i}`],
                    pep: formularioData[`pep-ben${i}`],
                });
            }
        }

        // Completar datos de la sección PEP
        completarPEP('rlegal', '', rlegal.nombre, rlegal.docId, rlegal.nacionalidad, rlegal.pep);
        
        autorizados.forEach((aut, index) => {
            completarPEP('autorizado', index + 1, aut.nombre, aut.docId, aut.nacionalidad, aut.pep);
        });

        beneficiarios.forEach((ben, index) => {
            completarPEP('ben', index + 1, ben.nombre, ben.docId, ben.nacionalidad, ben.pep);
        });

        // Generar y descargar el PDF
        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: "application/pdf" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "Documentacion Orion.pdf";
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

    // Función para agregar una persona autorizada
    const agregarPersonaAutorizada = () => {
        if (autorizadosCount >= 2) {
            alert("Solo puedes agregar un máximo de 2 personas autorizadas.");
            return;
        }

        autorizadosCount++;

        const autorizadoDiv = document.createElement("div");
        autorizadoDiv.classList.add("mb-6", "autorizado-item");
        autorizadoDiv.dataset.index = autorizadosCount;

        autorizadoDiv.innerHTML = `
            <div class="mb-6">
                <label class="block mt-2 mb-2 text-sm font-medium text-white">Nombre:</label>
                <input type="text" name="nombre-autorizado${autorizadosCount}" class="bg-white border border-gray-600 text-gray-800 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" required>
            </div>
            <div class="mb-6">
                <label class="block mt-2 mb-2 text-sm font-medium text-white">Nº Doc. Identidad:</label>
                <input type="text" name="doc-id-autorizado${autorizadosCount}" class="bg-white border border-gray-600 text-gray-800 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" required>
            </div>
            <div class="mb-6">
                <label class="block mt-2 mb-2 text-sm font-medium text-white">Cargo:</label>
                <input type="text" name="cargo-autorizado${autorizadosCount}" class="bg-white border border-gray-600 text-gray-800 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" required>
            </div>
            <div class="mb-6">
                <label class="block mt-2 mb-2 text-sm font-medium text-white">Email:</label>
                <input type="email" name="email-autorizado${autorizadosCount}" class="bg-white border border-gray-600 text-gray-800 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" required>
            </div>
            <button type="button" class="remove-autorizado text-white bg-red-600 hover:bg-red-700 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm px-4 py-2">Eliminar</button>
        `;

        autorizadosContainer.appendChild(autorizadoDiv);

        autorizadoDiv.querySelector(".remove-autorizado").addEventListener("click", () => {
            autorizadoDiv.remove();
            autorizadosCount--;
        });
    };

    addAutorizadoButton.addEventListener("click", agregarPersonaAutorizada);

    const beneficiariosContainer = document.getElementById("bens-container");
    const addBeneficiarioButton = document.getElementById("add-ben");

    // Función para agregar una persona autorizada
    const agregarBen = () => {
        if (beneficiariosCount >= 2) {
            alert("Solo puedes agregar un máximo de 2 personas autorizadas.");
            return;
        }

        beneficiariosCount++;

        const beneficiarioDiv = document.createElement("div");
        beneficiarioDiv.classList.add("mb-6", "ben-item");
        beneficiarioDiv.dataset.index = beneficiariosCount;

        beneficiarioDiv.innerHTML = `
            <div class="mb-6">
                <label class="block mt-2 mb-2 text-sm font-medium text-white">Nombre:</label>
                <input type="text" name="nombre-ben${beneficiariosCount}" class="bg-white border border-gray-600 text-gray-800 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" required>
            </div>
            <div class="mb-6">
                <label class="block mt-2 mb-2 text-sm font-medium text-white">Nº Doc. Identidad:</label>
                <input type="text" name="doc-id-ben${beneficiariosCount}" class="bg-white border border-gray-600 text-gray-800 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" required>
            </div>
            <div class="mb-6">
                <label class="block mt-2 mb-2 text-sm font-medium text-white">Direccion:</label>
                <input type="text" name="direccion-ben${beneficiariosCount}" class="bg-white border border-gray-600 text-gray-800 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" required>
            </div>
            <div class="mb-6">
                <label class="block mt-2 mb-2 text-sm font-medium text-white">Porcentaje:</label>
                <input type="text" name="porc-ben${beneficiariosCount}" class="bg-white border border-gray-600 text-gray-800 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" required>
            </div>
            <button type="button" class="remove-autorizado text-white bg-red-600 hover:bg-red-700 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm px-4 py-2">Eliminar</button>
        `;

        beneficiariosContainer.appendChild(beneficiarioDiv);

        beneficiarioDiv.querySelector(".remove-ben").addEventListener("click", () => {
            beneficiarioDiv.remove();
            beneficiariosCount--;
        });
    };

    addBeneficiarioButton.addEventListener("click", agregarBen);

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
        await completarPDF(formularioData, autorizadosCount);

        // fetch("/submit_form", { method: "POST", body: JSON.stringify(formularioData) });

        alert("Formulario enviado, PDF generado y descargado exitosamente.");
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
