document.addEventListener('DOMContentLoaded', () => {
    const userTypeElement = document.getElementById('user-type');
    const userNameElement = document.getElementById('user-name-dashboard');
    const roleTypeElement = document.getElementById('role-type');
    const rutGroupElement = document.getElementById('rut-group');
    const rutElement = document.getElementById('rut');

    const editableFields = [
        { id: 'email', type: 'email' },
        { id: 'telefono', type: 'text' },
        { id: 'direccion', type: 'text' },
        { id: 'estado_civil', type: 'text' },
        { id: 'fecha_nacimiento', type: 'date' },
        { id: 'banco', type: 'text' },
        { id: 'tipo_cuenta', type: 'text' },
        { id: 'numero_cuenta', type: 'text' }
    ];

    let isEditing = false;
    let equipoId = null;

    async function getSession() {
        try {
            const res = await fetch("https://cambiosorion.cl/data/session_status.php", {
                credentials: "include"
            });
            if (!res.ok) throw new Error("No se pudo obtener la sesión.");
            const data = await res.json();
            equipoId = data.equipo_id;
            if (!equipoId) throw new Error("No se encontró equipo_id en sesión");
            getUserData();
        } catch (error) {
            console.error("Error obteniendo la sesión:", error);
            window.location.href = 'https://cambiosorion.cl/sin-acceso';
        }
    }

    function getUserData() {
        fetch('https://cambiosorion.cl/data/info-per.php', {
            method: 'GET',
            credentials: 'include'
        })
            .then(res => res.json())
            .then(data => {
                if (!data.success) {
                    window.location.href = 'https://cambiosorion.cl/sin-acceso';
                    return;
                }

                const user = data.user;
                fillUserData(user);

                if (user.tipo_cliente === 'persona' || user.tipo_cliente === 'empresa') {
                    userTypeElement.textContent = "Cliente";
                    roleTypeElement.textContent = user.tipo_cliente === 'persona' ? "Persona" : "Empresa";
                    rutGroupElement.classList.remove('hidden');
                    rutElement.textContent = user.rut || "RUT no disponible";
                } else {
                    userTypeElement.textContent = "Administrativo";
                    roleTypeElement.textContent = capitalizeFirstLetter(user.rol || "Otro");
                    rutGroupElement.classList.add('hidden');
                }

                userNameElement.textContent = user.nombre || "Usuario desconocido";
            })
            .catch(error => console.error('Error al cargar los datos del usuario:', error));
    }

    function fillUserData(user) {
        editableFields.forEach(field => {
            const container = document.getElementById(field.id);
            const span = document.createElement('span');
            span.classList.add('field-text');
            span.textContent = user[field.id] || '—';
            container.innerHTML = '';
            container.appendChild(span);
        });
    }

    document.getElementById('edit-button').addEventListener('click', () => {
        if (isEditing) return;
        isEditing = true;

        editableFields.forEach(field => {
            const container = document.getElementById(field.id);
            const currentValue = container.querySelector('.field-text')?.textContent || '';
            container.innerHTML = '';

            const input = document.createElement('input');
            input.type = field.type;
            input.name = field.id;
            input.id = field.id;
            input.placeholder = currentValue;
            input.className = 'bg-gray-50 border border-gray-300 text-white text-sm rounded-lg block w-full p-2.5';
            input.value = '';

            container.appendChild(input);
        });
    });

    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    getSession();
});