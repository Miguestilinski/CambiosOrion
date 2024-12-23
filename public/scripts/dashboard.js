document.addEventListener('DOMContentLoaded', () => {
    const menuItems = document.querySelectorAll('.menu-item');
    const sections = document.querySelectorAll('.content-section');

    const userTypeElement = document.getElementById('user-type');
    const userNameElement = document.getElementById('user-name-dashboard');
    const roleTypeElement = document.getElementById('role-type');
    const emailElement = document.getElementById('email');
    const rutGroupElement = document.getElementById('rut-group');
    const rutElement = document.getElementById('rut');

    const documentationForm = document.getElementById('documentation-form');
    const uploadStatus = document.getElementById('upload-status');

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

    documentationForm.addEventListener('submit', (event) => {
        event.preventDefault();

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

    // Funcionalidad de menú para mostrar las secciones correspondientes
    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            menuItems.forEach(menu => menu.classList.remove('active'));
            sections.forEach(section => section.classList.remove('active'));

            item.classList.add('active');
            const sectionId = item.getAttribute('data-section');
            document.getElementById(sectionId).classList.add('active');
        });
    });
});
