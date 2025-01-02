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

        // Formatear la fecha como dd/mm/aaaa
        const formattedDate = [
            String(today.getDate()).padStart(2, '0'),
            String(today.getMonth() + 1).padStart(2, '0'),
            today.getFullYear()
        ].join('/');

        // Establecer el valor en el campo de fecha
        fechaInput.value = formattedDate;

        // Opcional: si quieres evitar que el formato se sobrescriba al enviar el formulario
        fechaInput.addEventListener("change", (event) => {
            const selectedDate = new Date(event.target.value);
            const formattedSelectedDate = [
                String(selectedDate.getDate()).padStart(2, '0'),
                String(selectedDate.getMonth() + 1).padStart(2, '0'),
                selectedDate.getFullYear()
            ].join('/');
            fechaInput.value = formattedSelectedDate;
        });
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
            if (window.innerWidth <= 768) {
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
});

