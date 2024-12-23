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
        .then(response => {
            console.log(response); // Imprime la respuesta completa
            return response.text(); // Obtener el cuerpo de la respuesta como texto
        })
        .then(text => {
            console.log(text); // Ver el contenido de la respuesta antes de convertirlo
            try {
                const data = JSON.parse(text); // Intentar parsear el JSON
                if (data.success) {
                    const { nombre, correo, rut, tipo_cliente, tipo, rol } = data.user;
                    // Asigna los valores al HTML como antes
                    userNameElement.textContent = nombre;
                    emailElement.value = correo;
                    if (tipo === 'persona' || tipo === 'empresa') {
                        userTypeElement.textContent = tipo_cliente === 'Persona' ? 'Cliente Persona' : 'Cliente Empresa';
                        additionalInfoElement.textContent = tipo_cliente === 'Persona' ? 'Persona' : 'Empresa';
                        if (tipo_cliente === 'Persona') {
                            rutGroupElement.classList.remove('hidden');
                            document.getElementById('rut').value = rut;
                        } else {
                            rutGroupElement.classList.add('hidden');
                        }
                    } else if (tipo === 'administrativo') {
                        userTypeElement.textContent = 'Administrativo';
                        additionalInfoElement.textContent = rol === 'Caja' ? 'Caja' : 'Admin';
                        rutGroupElement.classList.add('hidden');
                    }
                } else {
                    console.error('Error: ', data.message);
                    window.location.href = '/login';
                }
            } catch (error) {
                console.error('Error al parsear JSON:', error);
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
