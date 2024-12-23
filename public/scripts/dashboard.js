document.addEventListener('DOMContentLoaded', () => {
    const menuItems = document.querySelectorAll('.menu-item');
    const sections = document.querySelectorAll('.content-section');
    const userTypeElement = document.getElementById('user-type');
    const userNameElement = document.getElementById('user-name');
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
                    userNameElement.textContent = nombre;
                    emailElement.placeholder = correo;
                    emailElement.value = "";

                    if (rut) {
                        rutElement.value = rut;
                    } else {
                        rutElement.value = "RUT no disponible";
                    }                    

                    // Define el tipo de usuario y visualización del RUT
                    if (tipo_cliente === 'persona') {
                        userTypeElement.textContent = "Cliente";
                        roleTypeElement.textContent = "Persona";
                        rutGroupElement.classList.remove('hidden');
                    } else if (tipo_cliente === 'empresa') {
                        userTypeElement.textContent = "Cliente";
                        roleTypeElement.textContent = "Empresa";
                        rutGroupElement.classList.add('hidden');
                    } else if (rol === 'caja'){
                        userTypeElement.textContent = "Administrativo";
                        roleTypeElement.textContent = "Caja";
                    } else if (rol === 'admin'){
                        userTypeElement.textContent = "Administrativo";
                        roleTypeElement.textContent = "Admin";
                    } else {
                        userTypeElement.textContent = "Tipo desconocido";
                        rutGroupElement.classList.add('hidden');
                    }

                    console.log({ nombre, correo, rut, tipo_cliente });
                } else {
                    console.error('Error: ', data.message);
                    window.location.href = '/iniciar_sesion';
                }
            })
            .catch(error => {
                console.error('Error al cargar los datos del usuario:', error);
            });
    }

    getUserData(); // Llamada para cargar los datos del usuario al cargar la página

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
