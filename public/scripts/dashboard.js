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
        fetch('/data/get_user_data.php', {
            method: 'GET',
            credentials: 'include' // Asegura que la sesión se envíe correctamente
        })
            .then(response => response.json()) // Obtener la respuesta como JSON
            .then(data => {
                if (data.success) { // Verificar que los datos sean correctos
                    const { tipo, nombre, correo, rut, tipo_cliente, rol } = data.user;

                    // Asignar los datos a los elementos correspondientes
                    userTypeElement.textContent = tipo === 'cliente' ? 'Cliente' : 'Administrativo';
                    userNameElement.textContent = nombre;
                    emailElement.value = correo;

                    // Mostrar RUT solo si el tipo es Cliente
                    if (tipo === 'cliente') {
                        rutGroupElement.classList.remove('hidden');
                        document.getElementById('rut').value = rut; // Asume que el RUT viene en los datos
                        additionalInfoElement.textContent = tipo_cliente === 'Persona' ? 'Persona' : 'Empresa';
                    } else {
                        rutGroupElement.classList.add('hidden');
                        additionalInfoElement.textContent = rol === 'Caja' ? 'Caja' : 'Admin';
                    }
                } else {
                    console.error('Error: ', data.message);
                    window.location.href = '/login'; // Redirigir a login si no hay éxito
                }
            })
            .catch(error => {
                console.error('Error al cargar los datos del usuario:', error);
            });
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
