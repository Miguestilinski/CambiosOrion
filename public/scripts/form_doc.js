// Lógica para cargar el formulario dinámicamente
const formContent = document.getElementById("form-content");

// Datos del formulario según las páginas
const formularioData = [
    {
        title: "FICHA CLIENTE PERSONA JURÍDICA",
        fields: [
            { label: "Fecha (Día, Mes, Año)", type: "date", name: "fecha" },
            { label: "RUT/Tax ID", type: "text", name: "rut_tax_id" },
            { label: "Rubro Empresa", type: "text", name: "rubro_empresa" },
            { label: "Razón Social", type: "text", name: "razon_social" },
            { label: "Nombre Fantasía", type: "text", name: "nombre_fantasia" },
            { label: "Tipo Sociedad", type: "text", name: "tipo_sociedad" },
            { label: "Dirección", type: "text", name: "direccion" },
            { label: "Ciudad", type: "text", name: "ciudad" },
            { label: "País", type: "text", name: "pais" },
            { label: "E-Mail", type: "email", name: "email" },
            { label: "Teléfono", type: "tel", name: "telefono" }
        ]
    },
    {
        title: "REPRESENTANTE LEGAL Y/O GERENTE GENERAL",
        fields: [
            { label: "Nombre", type: "text", name: "rep_nombre" },
            { label: "Nº Doc. Identidad", type: "text", name: "rep_doc_identidad" },
            { label: "Nacionalidad", type: "text", name: "rep_nacionalidad" },
            { label: "Estado Civil", type: "text", name: "rep_estado_civil" },
            { label: "E-Mail", type: "email", name: "rep_email" },
            { label: "Dirección Particular", type: "text", name: "rep_direccion" }
        ]
    },
    {
        title: "PERSONAS AUTORIZADAS PARA DAR ÓRDENES",
        fields: [
            { label: "Nombre", type: "text", name: "aut_nombre[]" },
            { label: "Nº Doc. Identidad", type: "text", name: "aut_doc_identidad[]" },
            { label: "Cargo", type: "text", name: "aut_cargo[]" },
            { label: "E-Mail", type: "email", name: "aut_email[]" }
        ],
        multiple: true
    },
    // Continúa con otras páginas como "DECLARACIÓN DE VÍNCULO CON PERSONAS EXPUESTAS POLÍTICAMENTE (PEP)", etc.
];

// Función para generar los campos dinámicos
function renderForm() {
    formularioData.forEach(section => {
        const sectionDiv = document.createElement('div');
        sectionDiv.classList.add('form-section');

        const sectionTitle = document.createElement('h2');
        sectionTitle.textContent = section.title;
        sectionDiv.appendChild(sectionTitle);

        section.fields.forEach(field => {
            const fieldDiv = document.createElement('div');
            fieldDiv.classList.add('form-group');

            const label = document.createElement('label');
            label.textContent = field.label;
            label.htmlFor = field.name;

            const input = document.createElement('input');
            input.type = field.type;
            input.name = field.name;
            input.id = field.name;
            input.classList.add('form-control');

            fieldDiv.appendChild(label);
            fieldDiv.appendChild(input);
            sectionDiv.appendChild(fieldDiv);
        });

        if (section.multiple) {
            const addButton = document.createElement('button');
            addButton.type = "button";
            addButton.textContent = "Añadir más";
            addButton.classList.add('btn', 'btn-secondary', 'add-more');
            addButton.addEventListener('click', () => addMoreFields(section.fields, sectionDiv, addButton));

            sectionDiv.appendChild(addButton);
        }

        formContent.appendChild(sectionDiv);
    });
}

// Función para añadir más campos dinámicamente
function addMoreFields(fields, container, addButton) {
    const newFieldsDiv = document.createElement('div');
    newFieldsDiv.classList.add('form-group-multiple');

    fields.forEach(field => {
        const fieldDiv = document.createElement('div');
        fieldDiv.classList.add('form-group');

        const label = document.createElement('label');
        label.textContent = field.label;
        label.htmlFor = field.name;

        const input = document.createElement('input');
        input.type = field.type;
        input.name = field.name;
        input.id = `${field.name}-${Date.now()}`;
        input.classList.add('form-control');

        fieldDiv.appendChild(label);
        fieldDiv.appendChild(input);
        newFieldsDiv.appendChild(fieldDiv);
    });

    container.insertBefore(newFieldsDiv, addButton);
}

// Renderizar el formulario al cargar la página
renderForm();

// Lógica para la firma en celular
const signaturePadContainer = document.getElementById("signature-pad-container");
const startSignatureButton = document.getElementById("start-signature");

startSignatureButton.addEventListener('click', function() {
    if (window.innerWidth <= 768) {
        signaturePadContainer.style.display = "block";
        signaturePadContainer.scrollIntoView({ behavior: 'smooth' });
    }
});

// Enviar formulario (simulación de flujo)
const dynamicForm = document.getElementById('dynamic-form');
dynamicForm.addEventListener('submit', function(event) {
    event.preventDefault();
    alert("Formulario enviado correctamente. Validando firma electrónica.");
    // Aquí puedes integrar la lógica para manejar los datos del formulario
});
