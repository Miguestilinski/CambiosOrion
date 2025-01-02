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

    // Datos de regiones y ciudades por país
    const regionesPorPais = {
        'Chile': [
            { nombre: 'Región Metropolitana', ciudades: ['Santiago', 'Maipú', 'Las Condes'] },
            { nombre: 'Valparaíso', ciudades: ['Valparaíso', 'Viña del Mar'] },
            // Agrega más regiones de Chile según sea necesario
        ],
        // Agrega más países y sus regiones y ciudades
    };

    // Cargar las regiones según el país seleccionado
    function cargarRegiones() {
        const pais = document.getElementById('pais-particular').value;
        const regionSelect = document.getElementById('region-particular');
        const ciudadSelect = document.getElementById('ciudad-particular');

        // Limpiar las opciones de región y ciudad
        regionSelect.innerHTML = '<option value="" disabled selected>Selecciona una región</option>';
        ciudadSelect.innerHTML = '<option value="" disabled selected>Selecciona una ciudad</option>';

        if (pais) {
            // Habilitar la lista de regiones
            regionSelect.disabled = false;

            // Agregar las regiones del país seleccionado
            const regiones = regionesPorPais[pais] || [];
            regiones.forEach(region => {
                const option = document.createElement('option');
                option.value = region.nombre;
                option.textContent = region.nombre;
                regionSelect.appendChild(option);
            });

            // Si Chile es el país seleccionado, seleccionar Región Metropolitana por defecto
            if (pais === 'Chile') {
                regionSelect.value = 'Región Metropolitana';
                cargarCiudades(); // Llamar para cargar las ciudades de la Región Metropolitana
            }
        } else {
            regionSelect.disabled = true;
            ciudadSelect.disabled = true;
        }
    }

    // Cargar las ciudades según la región seleccionada
    function cargarCiudades() {
        const pais = document.getElementById('pais-particular').value;
        const region = document.getElementById('region-particular').value;
        const ciudadSelect = document.getElementById('ciudad-particular');

        // Limpiar las opciones de ciudad
        ciudadSelect.innerHTML = '<option value="" disabled selected>Selecciona una ciudad</option>';

        if (pais && region) {
            // Habilitar la lista de ciudades
            ciudadSelect.disabled = false;

            // Buscar la región seleccionada y cargar sus ciudades
            const regiones = regionesPorPais[pais] || [];
            const regionSeleccionada = regiones.find(r => r.nombre === region);
            const ciudades = regionSeleccionada ? regionSeleccionada.ciudades : [];

            // Agregar las ciudades a la lista
            ciudades.forEach(ciudad => {
                const option = document.createElement('option');
                option.value = ciudad;
                option.textContent = ciudad;
                ciudadSelect.appendChild(option);
            });

            // Si la región es Región Metropolitana, seleccionar Santiago por defecto
            if (region === 'Región Metropolitana') {
                ciudadSelect.value = 'Santiago';
            }
        } else {
            ciudadSelect.disabled = true;
        }
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
});

