// Lógica para cargar el formulario dinámicamente
const formContent = document.getElementById("form-content");

const documentos = [
    { id: "doc1", label: "Copia de la cédula de identidad" },
    { id: "doc2", label: "Copia del RUT de la empresa" },
    // Aquí puedes agregar más documentos según sea necesario
];

documentos.forEach(doc => {
    const div = document.createElement('div');
    div.classList.add('mb-6', 'p-6', 'bg-white', 'rounded-lg');
    div.innerHTML = `
        <label for="${doc.id}" class="block mb-2 text-lg font-medium text-black">${doc.label}</label>
        <input type="file" id="${doc.id}" name="${doc.id}" class="block mb-2 w-full text-sm text-black bg-gray-50 rounded-lg border border-gray-300">
    `;
    formContent.appendChild(div);
});

// Lógica para la firma en celular
const signaturePadContainer = document.getElementById("signature-pad-container");
const startSignatureButton = document.getElementById("start-signature");

startSignatureButton.addEventListener('click', function() {
    // Si el dispositivo es un celular, mostrar el pop-up para la firma
    if (window.innerWidth <= 768) {
        signaturePadContainer.style.display = "block";
    }
});

// Enviar formulario (simulación de flujo)
const dynamicForm = document.getElementById('dynamic-form');
dynamicForm.addEventListener('submit', function(event) {
    event.preventDefault();
    
    // Aquí puedes validar la firma, y si está lista, proceder con el siguiente paso
    alert("Formulario enviado, pendiente de firma en celular.");
    // Aquí puedes hacer la integración con el servidor para la carga de documentos y firma
});