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

    const documentationForm = document.getElementById('documentation-form');
    const uploadStatus = document.getElementById('upload-status');
    
    // Validar inputs de archivo antes de enviar el formulario
    documentationForm.addEventListener('submit', (event) => {
        event.preventDefault();
    
        let isValid = true;
        const inputs = document.querySelectorAll('input[type="file"]');
    
        inputs.forEach(input => {
            if (!input.files.length) {
                isValid = false;
                const label = input.previousElementSibling.textContent.trim();
                alert(`Por favor, sube al menos un archivo para el campo: "${label}"`);
            }
        });
    
        if (!isValid) return;
    
        const formData = new FormData(documentationForm);
    
        fetch('/data/upload_documents.php', {
            method: 'POST',
            body: formData,
            credentials: 'include',
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                uploadStatus.textContent = "¡Documentos subidos exitosamente!";
                uploadStatus.style.color = "lime";
            } else {
                uploadStatus.textContent = "Error al subir los documentos: " + data.message;
                uploadStatus.style.color = "red";
            }
        })
        .catch(error => {
            console.error('Error al subir los documentos:', error);
            uploadStatus.textContent = "Ocurrió un error inesperado.";
            uploadStatus.style.color = "red";
        });
    });
    
    // Manejar la selección y eliminación de archivos
    document.querySelectorAll('input[type="file"]').forEach(input => {
        const fileListContainer = document.getElementById(`${input.id}-file-list`);
        const dataTransfer = new DataTransfer(); // Para mantener los archivos acumulados
    
        input.addEventListener('change', event => {
            const newFiles = Array.from(event.target.files);
    
            // Añadir los nuevos archivos al DataTransfer
            newFiles.forEach(file => {
                dataTransfer.items.add(file);
            });
    
            // Actualizar el objeto FileList del input
            input.files = dataTransfer.files;
    
            // Actualizar la lista visual
            fileListContainer.innerHTML = ''; // Limpia la lista visual
            Array.from(dataTransfer.files).forEach((file, index) => {
                const listItem = document.createElement('li');
                listItem.textContent = file.name;
    
                const removeButton = document.createElement('button');
                removeButton.textContent = 'x';
                removeButton.addEventListener('click', () => {
                    // Eliminar el archivo del DataTransfer
                    dataTransfer.items.remove(index);
    
                    // Actualizar el objeto FileList del input
                    input.files = dataTransfer.files;
    
                    // Actualizar la lista visual
                    listItem.remove();
                });
    
                listItem.appendChild(removeButton);
                fileListContainer.appendChild(listItem);
            });
    
            // Limpiar el valor del input después de procesar los nuevos archivos
            input.value = '';
        });
    });        
});
