document.addEventListener('DOMContentLoaded', () => {
    const menuItems = document.querySelectorAll('.menu-item');
    const sections = document.querySelectorAll('.content-section');
    const userTypeElement = document.getElementById('user-type');
    const userNameElement = document.getElementById('user-name');
    const emailElement = document.getElementById('email');
    const rutGroupElement = document.getElementById('rut-group');

    // Función para obtener los datos del usuario
    function getUserData() {
        fetch('/data/get_user_data.php', {
            method: 'GET',
            credentials: 'include' // Asegura que se envíen las cookies de sesión
        })
            .then(response => response.json()) // Parsear directamente como JSON
            .then(data => {
                if (data.success) {
                    const { nombre, correo, rut, tipo_cliente } = data.user;
        
                    // Actualiza la UI
                    userNameElement.textContent = nombre || "Usuario desconocido";
                    emailElement.value = correo || "Correo no disponible";
        
                    // Define el tipo de usuario
                    if (tipo_cliente === 'persona') {
                        userTypeElement.textContent = "Cliente Persona";
                        rutGroupElement.classList.remove('hidden');
                        document.getElementById('rut').value = rut || "RUT no disponible";
                    } else if (tipo_cliente === 'empresa') {
                        userTypeElement.textContent = "Cliente Empresa";
                        rutGroupElement.classList.add('hidden');
                    } else {
                        userTypeElement.textContent = "Tipo desconocido";
                        rutGroupElement.classList.add('hidden');
                    }

                    console.log({ nombre, correo, rut, tipo_cliente });

                } else {
                    console.error('Error: ', data.message);
                    window.location.href = '/login'; // Redirige si falla la autenticación
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
