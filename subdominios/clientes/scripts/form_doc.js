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

// ==========================================
// 1. HELPERS Y FUNCIONES DE API (GEO)
// ==========================================

const cargarPaises = async (selectId) => {
    try {
        const response = await fetch("https://api.countrystatecity.in/v1/countries", requestOptions);
        const countries = await response.json();
        populateSelect(document.getElementById(selectId), countries, "Selecciona un país");
    } catch (error) {
        console.error("Error al cargar países:", error);
    }
};

const cargarRegiones = async (countryCode, regionSelectId, citySelectId) => {
    try {
        const response = await fetch(`https://api.countrystatecity.in/v1/countries/${countryCode}/states`, requestOptions);
        const states = await response.json();
        const regionSelect = document.getElementById(regionSelectId);
        populateSelect(regionSelect, states, "Selecciona una región");
        regionSelect.disabled = states.length === 0;
        resetCitySelect(citySelectId);
    } catch (error) {
        console.error("Error al cargar regiones:", error);
    }
};

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

const populateSelect = (selectElement, items, placeholder) => {
    if (!selectElement) return;
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

const resetCitySelect = (citySelectId) => {
    const citySelect = document.getElementById(citySelectId);
    if (!citySelect) return;
    citySelect.innerHTML = "<option value='' disabled selected>Selecciona una ciudad</option>";
    citySelect.disabled = true;
};

// ==========================================
// 2. LÓGICA DE INTERFAZ (TOGGLES Y FORMATOS)
// ==========================================

const toggleEmpresaTipo = () => {
    const tipoEmpresa = document.querySelector('input[name="tipo-empresa"]:checked')?.value;
    if (!tipoEmpresa) return;

    const rutEmpresaContainer = document.getElementById("rut-empresa-container");
    const taxIdContainer = document.getElementById("tax-id-container");
    const rutEmpresaInput = document.getElementById("rut-empresa");
    const taxIdInput = document.getElementById("tax-id");

    if (tipoEmpresa === "nacional") {
        rutEmpresaContainer.classList.remove("hidden");
        taxIdContainer.classList.add("hidden");
        rutEmpresaInput.required = true;
        taxIdInput.required = false;
        rutEmpresaInput.value = "";
    } else if (tipoEmpresa === "extranjera") {
        rutEmpresaContainer.classList.add("hidden");
        taxIdContainer.classList.remove("hidden");
        rutEmpresaInput.required = false;
        taxIdInput.required = true;
        taxIdInput.value = "";
    }
};

const toggleNacionalidadRlegal = () => {
    const nacionalidadRlegal = document.querySelector('input[name="nacionalidad-rlegal"]:checked')?.value;
    if (!nacionalidadRlegal) return;

    const rutRlegalContainer = document.getElementById("rut-rlegal-container");
    const docIdRlegalContainer = document.getElementById("doc-id-rlegal-container");
    const rutRlegalInput = document.getElementById("rut-rlegal");
    const docIdRlegalInput = document.getElementById("doc-id-rlegal");

    if (nacionalidadRlegal === "chilena") {
        rutRlegalContainer.classList.remove("hidden");
        docIdRlegalContainer.classList.add("hidden");
        rutRlegalInput.required = true;
        docIdRlegalInput.required = false;
        rutRlegalInput.value = "";
    } else if (nacionalidadRlegal === "extranjera") {
        rutRlegalContainer.classList.add("hidden");
        docIdRlegalContainer.classList.remove("hidden");
        rutRlegalInput.required = false;
        docIdRlegalInput.required = true;
        docIdRlegalInput.value = "";
    }
};

const toggleNacionalidadDec = () => {
    const nacionalidadDec = document.querySelector('input[name="nacionalidad-dec"]:checked')?.value;
    if (!nacionalidadDec) return;

    const rutDecContainer = document.getElementById("rut-dec-container");
    const docIdDecContainer = document.getElementById("doc-id-dec-container");
    const rutDecInput = document.getElementById("rut-dec");
    const docIdDecInput = document.getElementById("doc-id-dec");

    if (nacionalidadDec === "chilena") {
        rutDecContainer.classList.remove("hidden");
        docIdDecContainer.classList.add("hidden");
        rutDecInput.required = true;
        docIdDecInput.required = false;
        rutDecInput.value = "";
    } else if (nacionalidadDec === "extranjera") {
        rutDecContainer.classList.add("hidden");
        docIdDecContainer.classList.remove("hidden");
        rutDecInput.required = false;
        docIdDecInput.required = true;
        docIdDecInput.value = "";
    }
};

const formatRUT = (rut) => {
    rut = rut.replace(/[^0-9kK]/g, "");
    if (rut.length > 1) {
        rut = rut.slice(0, -1).replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.") + "-" + rut.slice(-1);
    }
    return rut.toUpperCase();
};

// Event Listeners para RUT
["rut-empresa", "rut-rlegal", "rut-dec"].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
        el.addEventListener("input", (event) => {
            event.target.value = formatRUT(event.target.value);
        });
    }
});

// Exponer funciones al scope global para el HTML inline
window.toggleEmpresaTipo = toggleEmpresaTipo;
window.toggleNacionalidadDec = toggleNacionalidadDec;
window.toggleNacionalidadRlegal = toggleNacionalidadRlegal;
window.cargarRegiones = cargarRegiones;
window.cargarCiudades = cargarCiudades;

// ==========================================
// 3. GENERACIÓN DE PDF
// ==========================================

async function completarPDF(formularioData, autorizadosCount, beneficiariosCount) {
    try {
        const pdfUrl = "https://cambiosorion.cl/orionapp/assets/Formulario_Estandar_Orion.pdf";
        const existingPdfBytes = await fetch(pdfUrl).then(res => res.arrayBuffer());
        const pdfDoc = await PDFDocument.load(existingPdfBytes);
        const form = pdfDoc.getForm();

        // --- Mapeo de Campos ---

        // Fecha
        const fechaField = form.getTextField('fecha:date');
        const fechaInput = document.querySelector('#fecha');
        if (fechaField && fechaInput.value) {
            const fecha = new Date(fechaInput.value);
            // Ajuste de zona horaria simple o uso directo de componentes
            // Nota: fechaInput.value viene en YYYY-MM-DD
            const parts = fechaInput.value.split('-');
            const year = parts[0];
            const month = parts[1];
            const day = parts[2];
            fechaField.setText(`${day}/${month}/${year}`);
        }

        // Checkboxes Tipo Empresa
        const tipoEmpresaValue = document.querySelector('input[name="tipo-empresa"]:checked')?.value;
        if (tipoEmpresaValue === 'nacional') form.getCheckBox('tipo-empresa-nacional')?.check();
        if (tipoEmpresaValue === 'extranjera') form.getCheckBox('tipo-empresa-extranjera')?.check();

        // Tipo Órdenes
        const tipoOrdenesValue = document.querySelector('input[name="tipo-ordenes"]:checked')?.value;
        if (tipoOrdenesValue) form.getCheckBox(`tipo-ordenes-${tipoOrdenesValue}`)?.check();

        // Uso Interno
        const usoIntValue = document.querySelector('input[name="uso-int"]:checked')?.value;
        if (usoIntValue) {
            form.getCheckBox(`uso-int-${usoIntValue}`)?.check();
            if (usoIntValue === 'otros') {
                const otrosAntValue = document.querySelector('input[name="otros-ant"]')?.value || '';
                form.getTextField('uso-int-otros-ant')?.setText(otrosAntValue);
            }
        }

        // Función Helper interna para textos
        const setPDFText = (pdfFieldId, domIdOrValue, isDirectValue = false) => {
            try {
                const field = form.getTextField(pdfFieldId);
                if (!field) return;
                
                let val = "";
                if (isDirectValue) {
                    val = domIdOrValue || "";
                } else {
                    // Intenta buscar en formularioData primero, luego en DOM
                    val = formularioData[domIdOrValue] || document.getElementById(domIdOrValue)?.value || "";
                }
                field.setText(val);
            } catch (e) {
                console.warn(`Campo PDF ${pdfFieldId} no encontrado o error al setear.`);
            }
        };

        // Asignación Inteligente (RUT vs Tax ID)
        const asignarCampoCondicional = (campoPDF, tipo, idNacional, idExtranjero) => {
            const tipoVal = document.querySelector(`input[name="${tipo}"]:checked`)?.value;
            let valor = "";
            if (tipoVal === "chilena" || tipoVal === "nacional") {
                valor = document.getElementById(idNacional)?.value;
            } else if (tipoVal === "extranjera") {
                valor = document.getElementById(idExtranjero)?.value;
            }
            if (valor) form.getTextField(campoPDF)?.setText(valor);
        };

        asignarCampoCondicional("doc-id-empresa", "tipo-empresa", "rut-empresa", "tax-id");
        asignarCampoCondicional("doc-id-rlegal", "nacionalidad-rlegal", "rut-rlegal", "doc-id-rlegal");
        asignarCampoCondicional("doc-id-dec", "nacionalidad-dec", "rut-dec", "doc-id-dec");

        // Campos de Texto Directos
        const camposSimples = [
            'razon-social-empresa', 'rubro-empresa', 'nombre-empresa', 'tipo-sociedad',
            'direccion-empresa', 'ciudad-empresa', 'pais-empresa', 'email-empresa', 'telefono-empresa',
            'estado-civil-rlegal', 'nombre-rlegal', 'direccion-rlegal', 'email-rlegal',
            'nombre-dec', 'actividad', 'origen-fondos', 'destino-fondos'
        ];

        camposSimples.forEach(id => setPDFText(id, id));

        // Nacionalidades (radio buttons en web -> texto en PDF)
        const nacRlegal = document.querySelector('input[name="nacionalidad-rlegal"]:checked')?.value;
        if(nacRlegal) setPDFText('nacionalidad-rlegal', nacRlegal.toUpperCase(), true);

        const nacDec = document.querySelector('input[name="nacionalidad-dec"]:checked')?.value;
        if(nacDec) {
             // Si es extranjera, usamos el input de texto, si es chilena, texto fijo
             const val = nacDec === 'extranjera' 
                ? document.querySelector('input[name="nacionalidad-dec-ext"]')?.value 
                : 'CHILENA';
             setPDFText('nacionalidad-dec', val, true);
        }

        // Bucles para Autorizados
        for (let i = 1; i <= autorizadosCount; i++) {
            setPDFText(`nombre-autorizado${i}`, `nombre-autorizado${i}`);
            setPDFText(`doc-id-autorizado${i}`, `doc-id-autorizado${i}`);
            setPDFText(`cargo-autorizado${i}`, `cargo-autorizado${i}`);
            setPDFText(`email-autorizado${i}`, `email-autorizado${i}`);
        }

        // Bucles para Beneficiarios
        for (let i = 1; i <= beneficiariosCount; i++) {
            setPDFText(`nombre-ben${i}`, `nombre-ben${i}`);
            // Corrección: Interpolación correcta de strings
            setPDFText(`doc-id-ben${i}`, `doc-id-ben${i}`); 
            setPDFText(`direccion-ben${i}`, `direccion-ben${i}`); 
            setPDFText(`porc-ben${i}`, `porc-ben${i}`);
        }

        // PEPs (Personas Expuestas Políticamente)
        const checkPEP = (prefix, index = '') => {
            // Lógica para marcar SI/NO en PEP
            // El formulario web solo tiene un radio PEP general en el paso 4, 
            // pero el PDF tiene PEP por cada persona.
            // Asumiremos el valor general para el Declarante/RLegal si aplica.
            const pepVal = document.querySelector('input[name="pep"]:checked')?.value;
            if(pepVal === 'ser') {
                // Checkbox específico en PDF
                form.getCheckBox(`pep-ser-${prefix}${index}`)?.check();
            } else {
                 form.getCheckBox(`pep-no-ser-${prefix}${index}`)?.check();
            }
        };

        // Esta parte depende de cómo esté estructurado tu PDF exactamente para PEPs
        // Se mantiene la lógica simple basada en tu código anterior
        const pepValue = document.querySelector('input[name="pep"]:checked')?.value;
        if(pepValue === 'ser') form.getCheckBox('pep-ser')?.check();
        if(pepValue === 'no-ser') form.getCheckBox('pep-no-ser')?.check();


        // Generar y descargar
        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: "application/pdf" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `Documentacion_Orion_${new Date().getTime()}.pdf`;
        link.click();

    } catch (error) {
        console.error("Error al completar el PDF:", error);
        alert("Hubo un error al generar el PDF. Revise la consola.");
    }
}

// ==========================================
// 4. INICIALIZACIÓN (DOM LOADED)
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("dynamic-form");
    const autorizadosContainer = document.getElementById("autorizados-container");
    const addAutorizadoButton = document.getElementById("add-autorizado");
    const beneficiariosContainer = document.getElementById("bens-container");
    const addBeneficiarioButton = document.getElementById("add-ben");
    
    // Contadores globales
    let autorizadosCount = 0;
    let beneficiariosCount = 0;

    // --- Agregar Autorizados (Con estilo Dark Mode) ---
    const agregarPersonaAutorizada = () => {
        if (autorizadosCount >= 2) {
            alert("Solo puedes agregar un máximo de 2 personas autorizadas.");
            return;
        }
        autorizadosCount++;

        const div = document.createElement("div");
        div.classList.add("bg-slate-800/50", "p-4", "rounded-xl", "border", "border-white/10", "mb-4", "autorizado-item", "fade-in");
        div.dataset.index = autorizadosCount;

        div.innerHTML = `
            <div class="flex justify-between items-center mb-4">
                <h4 class="text-blue-400 font-bold text-sm">Autorizado #${autorizadosCount}</h4>
                <button type="button" class="remove-autorizado text-red-400 hover:text-red-300 text-xs font-medium">Eliminar</button>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block mb-2 text-xs font-medium text-gray-400">Nombre Completo</label>
                    <input type="text" name="nombre-autorizado${autorizadosCount}" class="input-dark w-full p-2.5 text-sm" required>
                </div>
                <div>
                    <label class="block mb-2 text-xs font-medium text-gray-400">Nº Doc. Identidad</label>
                    <input type="text" name="doc-id-autorizado${autorizadosCount}" class="input-dark w-full p-2.5 text-sm" required>
                </div>
                <div>
                    <label class="block mb-2 text-xs font-medium text-gray-400">Cargo</label>
                    <input type="text" name="cargo-autorizado${autorizadosCount}" class="input-dark w-full p-2.5 text-sm" required>
                </div>
                <div>
                    <label class="block mb-2 text-xs font-medium text-gray-400">Email</label>
                    <input type="email" name="email-autorizado${autorizadosCount}" class="input-dark w-full p-2.5 text-sm" required>
                </div>
            </div>
        `;

        autorizadosContainer.appendChild(div);

        div.querySelector(".remove-autorizado").addEventListener("click", () => {
            div.remove();
            autorizadosCount--;
        });
    };

    // --- Agregar Beneficiarios (Con estilo Dark Mode) ---
    const agregarBen = () => {
        if (beneficiariosCount >= 4) { // Aumentado a 4 por si acaso, PDF permite varios
            alert("Máximo de beneficiarios alcanzado.");
            return;
        }
        beneficiariosCount++;

        const div = document.createElement("div");
        div.classList.add("bg-slate-800/50", "p-4", "rounded-xl", "border", "border-white/10", "mb-4", "ben-item", "fade-in");
        div.dataset.index = beneficiariosCount;

        div.innerHTML = `
            <div class="flex justify-between items-center mb-4">
                <h4 class="text-blue-400 font-bold text-sm">Beneficiario #${beneficiariosCount}</h4>
                <button type="button" class="remove-ben text-red-400 hover:text-red-300 text-xs font-medium">Eliminar</button>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block mb-2 text-xs font-medium text-gray-400">Nombre Completo</label>
                    <input type="text" name="nombre-ben${beneficiariosCount}" class="input-dark w-full p-2.5 text-sm" required>
                </div>
                <div>
                    <label class="block mb-2 text-xs font-medium text-gray-400">Nº Doc. Identidad</label>
                    <input type="text" name="doc-id-ben${beneficiariosCount}" class="input-dark w-full p-2.5 text-sm" required>
                </div>
                <div>
                    <label class="block mb-2 text-xs font-medium text-gray-400">Dirección</label>
                    <input type="text" name="direccion-ben${beneficiariosCount}" class="input-dark w-full p-2.5 text-sm" required>
                </div>
                <div>
                    <label class="block mb-2 text-xs font-medium text-gray-400">% Participación</label>
                    <input type="text" name="porc-ben${beneficiariosCount}" class="input-dark w-full p-2.5 text-sm" placeholder="Ej: 25%" required>
                </div>
            </div>
        `;

        beneficiariosContainer.appendChild(div);

        div.querySelector(".remove-ben").addEventListener("click", () => {
            div.remove();
            beneficiariosCount--;
        });
    };

    if(addAutorizadoButton) addAutorizadoButton.addEventListener("click", agregarPersonaAutorizada);
    if(addBeneficiarioButton) addBeneficiarioButton.addEventListener("click", agregarBen);

    // --- Inicializar Fecha ---
    const fechaInput = document.getElementById("fecha");
    if (fechaInput) {
        const today = new Date();
        const isoDate = today.toISOString().split('T')[0];
        fechaInput.value = isoDate;
    }

    // --- Inicializar Selects GEO ---
    cargarPaises("pais-empresa");
    cargarPaises("pais-rlegal");

    document.getElementById("pais-empresa")?.addEventListener("change", (e) => {
        cargarRegiones(e.target.value, "region-empresa", "ciudad-empresa");
    });
    document.getElementById("region-empresa")?.addEventListener("change", (e) => {
        const country = document.getElementById("pais-empresa").value;
        cargarCiudades(country, e.target.value, "ciudad-empresa");
    });

    document.getElementById("pais-rlegal")?.addEventListener("change", (e) => {
        cargarRegiones(e.target.value, "region-rlegal", "ciudad-rlegal");
    });
    document.getElementById("region-rlegal")?.addEventListener("change", (e) => {
        const country = document.getElementById("pais-rlegal").value;
        cargarCiudades(country, e.target.value, "ciudad-rlegal");
    });

    // --- MANEJO DEL SUBMIT ---
    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        // 1. Determinar Tipo de Cliente (Lógica corregida)
        let tipoCliente = "Persona Natural";
        const esExtranjero = document.querySelector('input[name="nacionalidad-dec"][value="extranjera"]')?.checked;
        const esEmpresa = document.querySelector('input[name="tipo-empresa"][value="nacional"]')?.checked || 
                          document.querySelector('input[name="tipo-empresa"][value="extranjera"]')?.checked; // Asumiendo que si llena la ficha 2 es empresa

        // La lógica original usaba radios de nacionalidad y empresa.
        // Si llenó datos de empresa (Paso 2), prioridad a Jurídica.
        if (esEmpresa) {
            tipoCliente = "Persona Juridica";
        } else if (esExtranjero) {
            tipoCliente = "Extranjero";
        }

        // 2. Recopilar Datos
        const formData = new FormData(form);
        let formularioData = {};
        formData.forEach((value, key) => {
            formularioData[key] = value;
        });

        // Agregar tipo calculado
        formularioData['tipo_cliente'] = tipoCliente; 

        console.log("Enviando datos:", formularioData);

        // 3. Enviar al Backend
        try {
            const response = await fetch("https://cambiosorion.cl/data/save_cliente.php", {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json' // Aseguramos que se envíe como JSON
                },
                body: JSON.stringify(formularioData)
            });

            // Intentar parsear respuesta, manejando texto plano por si acaso
            const textResponse = await response.text();
            let result;
            try {
                result = JSON.parse(textResponse);
            } catch (e) {
                console.warn("Respuesta no es JSON puro:", textResponse);
                result = { success: false, message: textResponse };
            }

            if (result.success || textResponse.includes('success')) { // Fallback por si el backend devuelve string
                // 4. Generar PDF
                alert("Datos guardados correctamente. Generando documento PDF...");
                await completarPDF(formularioData, autorizadosCount, beneficiariosCount);
            } else {
                alert("Error al guardar en base de datos: " + (result.message || "Error desconocido"));
            }

        } catch (error) {
            console.error("Error crítico:", error);
            alert("Error de conexión al enviar el formulario.");
        }
    });

    // Lógica opcional para firma digital en móvil
    const startSignatureButton = document.getElementById("start-signature");
    if(startSignatureButton) {
        startSignatureButton.addEventListener('click', function() {
            const container = document.getElementById("signature-pad-container");
            container.classList.remove("hidden");
            container.scrollIntoView({ behavior: 'smooth' });
        });
    }
});