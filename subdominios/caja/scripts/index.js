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

    // Función para obtener los datos del usuario
    function getWorkerData() {
        fetch('https://cambiosorion.cl/data/get_worker_data.php', {
            method: 'GET',
            credentials: 'include' // Asegura que se envíen las cookies de sesión
        })
            .then(response => response.json()) // Parsear directamente como JSON
            .then(data => {
                if (data.success) {
                    const { nombre, correo, rol } = data.user;

                    // Actualiza la UI
                    userNameElement.textContent = nombre || "Usuario desconocido";
                    emailElement.placeholder = correo || "Correo no disponible";
                    emailElement.value = "";

                    if (rol === 'caja') {
                        userTypeElement.textContent = "Administrativo";
                        roleTypeElement.textContent = "Caja";
                    } else if (rol === 'admin') {
                        userTypeElement.textContent = "Administrativo";
                        roleTypeElement.textContent = "Admin";
                    } else if (rol === 'socio') {
                        userTypeElement.textContent = "Administrativo";
                        roleTypeElement.textContent = "Socio";
                    } else if (rol === 'otro') {
                        userTypeElement.textContent = "Administrativo";
                        roleTypeElement.textContent = "Otro";
                    } else {
                        userTypeElement.textContent = "Tipo desconocido";
                        rutGroupElement.classList.add('hidden');
                    }

                } else {
                    console.error('Error: ', data.message);
                    window.location.href = 'https://cambiosorion.cl/sin-acceso';
                }
            })
            .catch(error => {
                console.error('Error al cargar los datos del usuario:', error);
            });
    }

    getWorkerData();
    
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
});