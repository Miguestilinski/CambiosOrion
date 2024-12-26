document.addEventListener('DOMContentLoaded', () => {
    const menuItems = document.querySelectorAll('.menu-item');
    const sections = document.querySelectorAll('.content-section');

    // Funcionalidad de menú para mostrar las secciones correspondientes
    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            menuItems.forEach(menu => menu.classList.remove('active'));
            sections.forEach(section => section.classList.remove('active'));
            item.classList.add('active');

            const sectionId = item.getAttribute('data-section');
            const targetSection = document.getElementById(sectionId);
            if (targetSection) {
                targetSection.classList.add('active');
            } else {
                console.error(`No se encontró la sección con id: ${sectionId}`);
            }
        });
    });

    const userTypeElement = document.getElementById('user-type');
    const userNameElement = document.getElementById('user-name-dashboard');
    const roleTypeElement = document.getElementById('role-type');
    const emailElement = document.getElementById('email');
    const rutGroupElement = document.getElementById('rut-group');
    const rutElement = document.getElementById('rut');

    // Función para obtener los datos del usuario
    function getUserData() {
        fetch('/data/get_user_data.php', {
            method: 'GET',
            credentials: 'include' // Asegura que se envíen las cookies de sesión
        })
            .then(response => response.json()) // Parsear directamente como JSON
            .then(data => {
                if (data.success) {
                    const { nombre, correo, rut, tipo_cliente, rol } = data.user;

                    // Actualiza la UI
                    userNameElement.textContent = nombre || "Usuario desconocido";
                    emailElement.placeholder = correo || "Correo no disponible";
                    rutElement.textContent = rut || "RUT no disponible";
                    emailElement.value = "";

                    if (tipo_cliente === 'persona') {
                        userTypeElement.textContent = "Cliente";
                        roleTypeElement.textContent = "Persona";
                        rutGroupElement.classList.remove('hidden');
                    } else if (tipo_cliente === 'empresa') {
                        userTypeElement.textContent = "Cliente";
                        roleTypeElement.textContent = "Empresa";
                        rutGroupElement.classList.remove('hidden');
                    } else if (rol === 'caja') {
                        userTypeElement.textContent = "Administrativo";
                        roleTypeElement.textContent = "Caja";
                    } else if (rol === 'admin') {
                        userTypeElement.textContent = "Administrativo";
                        roleTypeElement.textContent = "Admin";
                    } else {
                        userTypeElement.textContent = "Tipo desconocido";
                        rutGroupElement.classList.add('hidden');
                    }

                } else {
                    console.error('Error: ', data.message);
                    window.location.href = '/iniciar_sesion';
                }
            })
            .catch(error => {
                console.error('Error al cargar los datos del usuario:', error);
            });
    }

    getUserData();

    async function checkIfSignatureReady() {
        // Simulación de la espera a que el celular termine la firma
        // Esto puede estar basado en un endpoint del servidor
        const signatureResponse = await fetch('/check-signature-status', {
            method: 'GET',
            credentials: 'include'
        });

        const signatureStatus = await signatureResponse.json();
        return signatureStatus.signed; // true o false
    }

    const documentationForm = document.getElementById('documentation-form');
    const uploadStatus = document.getElementById('upload-status');
    
    // Validar inputs de archivo antes de enviar el formulario
    documentationForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        // Simular espera de firma
        const isSigned = await checkIfSignatureReady();
        if (!isSigned) {
            alert('Debe firmar el formulario desde su celular antes de continuar.');
            return;
        }

        let isValid = true;
        const inputs = document.querySelectorAll('input[type="file"]');
    
        // Validación de archivos subidos
        inputs.forEach(input => {
            const errorElement = document.getElementById(`${input.id}-error`);
            if (!input.files.length) {
                isValid = false;
                errorElement.textContent = `Por favor, sube al menos un archivo para este campo.`;
                errorElement.classList.remove('hidden');
            } else {
                errorElement.textContent = '';
                errorElement.classList.add('hidden');
            }
        });
    
        if (!isValid) return;
    
        // Agregar id del cliente a los datos del formulario
        const formData = new FormData(documentationForm);

        try {
            // Obtener datos del usuario activo
            const userDataResponse = await fetch('/data/get_user_data.php', {
                method: 'GET',
                credentials: 'include',
            });

            const userData = await userDataResponse.json();

            if (!userData.success || !userData.user?.id) {
                throw new Error('No se pudo obtener el identificador del cliente.');
            }

            const userId = userData.user.id;
            formData.append('id', userId); // Agregar id al FormData

            // Subir los documentos
            const uploadResponse = await fetch('/data/upload_documents.php', {
                method: 'POST',
                body: formData,
                credentials: 'include',
            });

            const uploadData = await uploadResponse.json();

            if (uploadData.success) {
                uploadStatus.textContent = "¡Documentos subidos exitosamente!";
                uploadStatus.style.color = "lime";
                // Redirigir al listado de documentos
                window.location.href = '/dashboard';  // Aquí deberías poner la URL de la página que muestra el listado de documentos
            } else {
                uploadStatus.textContent = "Error al subir los documentos: " + uploadData.message;
                uploadStatus.style.color = "red";
            }
        } catch (error) {
            console.error('Error durante el proceso de subida:', error);
            uploadStatus.textContent = "Ocurrió un error inesperado. Intenta nuevamente.";
            uploadStatus.style.color = "red";
        }
    });
    
    
    // Manejar la selección y eliminación de archivos
    document.querySelectorAll('input[type="file"]').forEach(input => {
        const fileListContainer = document.getElementById(`${input.id}-file-list`);
        const dataTransfer = new DataTransfer(); // Para mantener los archivos acumulados

        input.addEventListener('change', event => {
            const newFiles = Array.from(event.target.files);
            console.log(`Archivos seleccionados: ${newFiles.length}`, newFiles);

            // Añadir los nuevos archivos al DataTransfer
            newFiles.forEach(file => {
                dataTransfer.items.add(file);
            });

            // Actualizar el objeto FileList del input
            input.files = dataTransfer.files;
            console.log(`Archivos en input después de agregar: ${input.files.length}`);

            // Llamar a la función para actualizar la lista visual
            updateFileList(input.id); // Actualiza la lista de archivos al cambiar el input
        });
    });           

    // Función para actualizar la lista visual de archivos seleccionados
    window.updateFileList = function(inputId) {
        const inputElement = document.getElementById(inputId);
        const fileListContainer = document.getElementById(`${inputId}-file-list`);
        const fileList = inputElement.files;
        
        console.log(`Actualizando lista de archivos para ${inputId}. Archivos: ${fileList.length}`);

        // Limpiar la lista visual
        fileListContainer.innerHTML = "";

        // Si hay archivos seleccionados, mostrarlos
        if (fileList.length > 0) {
            Array.from(fileList).forEach((file, index) => {
                const listItem = document.createElement('li');
                listItem.textContent = file.name;

                const removeButton = document.createElement('button');
                removeButton.textContent = 'x';
                removeButton.addEventListener('click', () => {
                    // Eliminar el archivo del DataTransfer
                    const dataTransfer = new DataTransfer();
                    Array.from(fileList).forEach((item, idx) => {
                        if (idx !== index) dataTransfer.items.add(item);
                    });

                    // Actualizar el objeto FileList del input
                    inputElement.files = dataTransfer.files;

                    // Actualizar la lista visual
                    updateFileList(inputId);
                });

                listItem.appendChild(removeButton);
                fileListContainer.appendChild(listItem);
            });
        } else {
            fileListContainer.innerHTML = "<li>No se han seleccionado archivos.</li>";
        }
    }
});