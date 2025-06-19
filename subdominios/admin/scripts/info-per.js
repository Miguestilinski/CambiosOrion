document.addEventListener('DOMContentLoaded', () => {
    const userTypeElement = document.getElementById('user-type');
    const userNameElement = document.getElementById('user-name-dashboard');
    const roleTypeElement = document.getElementById('role-type');
    const rutGroupElement = document.getElementById('rut-group');
    const rutElement = document.getElementById('rut');
    const editButton = document.getElementById('edit-button');
    const saveButton = document.getElementById('save_changes');

    const editableFields = [
        { id: 'email', viewId: 'email-view', inputId: 'email' },
        { id: 'telefono', viewId: 'telefono-view', inputId: 'telefono' },
        { id: 'direccion', viewId: 'direccion-view', inputId: 'direccion' },
        { id: 'estado_civil', viewId: 'estado_civil-view', inputId: 'estado_civil' },
        { id: 'fecha_nacimiento', viewId: 'fecha_nacimiento-view', inputId: 'fecha_nacimiento' },
        { id: 'banco', viewId: 'banco-view', inputId: 'banco' },
        { id: 'tipo_cuenta', viewId: 'tipo_cuenta-view', inputId: 'tipo_cuenta' },
        { id: 'numero_cuenta', viewId: 'numero_cuenta-view', inputId: 'numero_cuenta' }
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
        fetch(`https://cambiosorion.cl/data/info-per.php?equipo_id=${equipoId}`, {
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
            const view = document.getElementById(field.viewId);
            const input = document.getElementById(field.inputId);

            if (view) {
                view.textContent = user[field.id] || '—';
            }

            if (input) {
                input.classList.add('hidden');
            }
        });
    }

    getSession();

    editButton.addEventListener('click', () => {
        isEditing = !isEditing;

        editableFields.forEach(field => {
            const view = document.getElementById(field.viewId);
            const input = document.getElementById(field.inputId);

            if (view && input) {
                if (isEditing) {
                    input.value = view.textContent === '—' ? '' : view.textContent;
                    view.classList.add('hidden');
                    input.classList.remove('hidden');
                } else {
                    input.classList.add('hidden');
                    view.classList.remove('hidden');
                }
            }
        });

        // Cambiar texto del botón
        editButton.textContent = isEditing ? 'Cancelar' : 'Editar Datos';
        // Mostrar u ocultar botón de guardar
        saveButton.classList.toggle('hidden', !isEditing);
    });
});