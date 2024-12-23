// JavaScript for Dashboard functionality
document.addEventListener('DOMContentLoaded', () => {
    const menuItems = document.querySelectorAll('.menu-item');
    const sections = document.querySelectorAll('.content-section');
    const userTypeElement = document.getElementById('user-type');
    const userNameElement = document.getElementById('user-name');
    const emailElement = document.getElementById('email');
    const rutGroupElement = document.getElementById('rut-group');
    const additionalInfoElement = document.getElementById('additional-info');

    // Función para obtener los datos del usuario
    function getUserData() {
        fetch('/data/get_user_data.php')
            .then(response => response.json())
            .then(data => {
                if (data.isAuthenticated) {
                    const { tipo, nombre, correo, rut } = data;
                    userTypeElement.textContent = tipo;
                    userNameElement.textContent = nombre;
                    emailElement.value = correo;

                    if (tipo === 'Cliente') {
                        rutGroupElement.classList.remove('hidden');
                        document.getElementById('rut').value = rut; // Asume que el RUT viene en los datos
                        additionalInfoElement.textContent = 'Persona';
                    } else {
                        additionalInfoElement.textContent = 'Rol del Usuario';
                    }
                } else {
                    // Redirigir a la página de login si no está autenticado
                    window.location.href = '/login.html';
                }
            })
            .catch(error => console.error('Error al cargar los datos del usuario:', error));
    }

    getUserData(); // Llamada para cargar los datos del usuario al cargar la página

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
  