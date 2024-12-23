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

                    if (nombre) {
                        userNameElement.textContent = nombre;
                    } else {
                        console.error('El nombre no está definido:', nombre);
                        userNameElement.textContent = "Usuario desconocido";
                    }

                    // Actualiza la UI
                    userNameElement.textContent = nombre || "Usuario desconocido";
                    emailElement.placeholder = correo || "Correo no disponible";
                    rutElement.textContent = rut || "RUT no disponible";
                    emailElement.value = "";     

                    console.log('Nombre:', nombre);
                    console.log('Tipo de cliente:', tipo_cliente);
                    console.log('Rol:', rol);
                    

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


                    console.log({ nombre, correo, rut, tipo_cliente, rol });
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
