document.addEventListener('DOMContentLoaded', () => {
    // Referencias DOM
    const editButtonContainer = document.getElementById('edit-button-container'); 
    const editBtn = document.getElementById('edit-button');
    const saveButton = document.getElementById('save_changes');
    const saveBar = document.getElementById('save-bar');
    const passwordGroup = document.getElementById('password-group');
    const userTypeElement = document.getElementById('user-type');
    const userNameElement = document.getElementById('user-name-dashboard');
    const roleTypeElement = document.getElementById('role-type');
    const rutElement = document.getElementById('rut');

    // Campos mapeados
    const editableFields = [
        { id: 'correo', viewId: 'email-view', inputId: 'email' },
        { id: 'telefono', viewId: 'telefono-view', inputId: 'telefono' },
        { id: 'direccion', viewId: 'direccion-view', inputId: 'direccion' },
        { id: 'estado_civil', viewId: 'estado_civil-view', inputId: 'estado_civil' },
        { id: 'fecha_nacimiento', viewId: 'fecha_nacimiento-view', inputId: 'fecha_nacimiento' },
        { id: 'banco', viewId: 'banco-view', inputId: 'banco' },
        { id: 'tipo_cuenta', viewId: 'tipo_cuenta-view', inputId: 'tipo_cuenta' },
        { id: 'numero_cuenta', viewId: 'numero_cuenta-view', inputId: 'numero_cuenta' }
    ];

    let userCanEdit = false;

    // --- 1. Obtener Datos y Permisos ---
    async function getUserData() {
        try {
            const res = await fetch('https://cambiosorion.cl/data/mi-perfil.php', {
                method: 'GET',
                credentials: 'include'
            });
            const data = await res.json();

            if (!data.success) {
                console.error(data.message);
                if(data.message === 'No autorizado') window.location.href = 'login';
                return;
            }

            const user = data.user;
            userCanEdit = data.can_edit; // Flag clave del backend

            // Llenar UI Base
            if(userNameElement) userNameElement.textContent = user.nombre;
            if(rutElement) rutElement.textContent = user.rut || '—';
            if(roleTypeElement) roleTypeElement.textContent = user.rol;
            if(userTypeElement) userTypeElement.textContent = "Colaborador";

            // Llenar Campos
            fillUserData(user);

            // Configurar Botón Editar según Permisos
            if (userCanEdit) {
                editButtonContainer.classList.remove('hidden');
                
                // UX: Si es primera vez (faltan datos clave), activar edición automáticamente
                if (!user.direccion || user.direccion.length < 5) {
                    toggleEditMode(true);
                }
            } else {
                editButtonContainer.classList.add('hidden');
                // Asegurarnos que el formulario esté limpio de inputs si no tiene permiso
                toggleEditMode(false);
            }

        } catch (error) {
            console.error('Error cargando perfil:', error);
        }
    }

    function fillUserData(user) {
        editableFields.forEach(field => {
            const view = document.getElementById(field.viewId);
            const input = document.getElementById(field.inputId);
            const val = user[field.id] || '';

            // Llenar Vista Texto
            if (view) view.textContent = val || '—';

            // Llenar Inputs (aunque estén ocultos)
            if (input) input.value = val;
        });
    }

    // --- 2. Lógica Visual Editar/Guardar ---
    
    // Activar modo edición
    function toggleEditMode(enable) {
        const inputs = document.querySelectorAll('form input, form select');
        const texts = document.querySelectorAll('form p[id$="-view"]');

        if (enable) {
            // Mostrar Inputs, Ocultar Textos
            inputs.forEach(input => input.classList.remove('hidden'));
            texts.forEach(p => p.classList.add('hidden'));
            if(passwordGroup) passwordGroup.classList.remove('hidden');
            if(saveBar) saveBar.classList.remove('hidden');
            if(editBtn) editBtn.classList.add('hidden'); // Ocultar botón "Editar" mientras se edita
        } else {
            // Modo Solo Lectura
            inputs.forEach(input => input.classList.add('hidden'));
            texts.forEach(p => p.classList.remove('hidden'));
            if(passwordGroup) passwordGroup.classList.add('hidden');
            if(saveBar) saveBar.classList.add('hidden');
            if(editBtn && userCanEdit) editBtn.classList.remove('hidden');
        }
    }

    if(editBtn) {
        editBtn.addEventListener('click', () => toggleEditMode(true));
    }

    // Cancelar (Botón dentro del save-bar)
    const cancelBtn = document.querySelector('#save-bar button[type="button"]'); // Asumiendo que es el de cancelar
    if(cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            toggleEditMode(false);
            // Opcional: Recargar datos originales para deshacer cambios en inputs
            getUserData(); 
        });
    }

    // --- 3. Guardar Datos (POST) ---
    if(saveButton) {
        saveButton.addEventListener('click', async (e) => {
            e.preventDefault();

            if (!userCanEdit) {
                alert("No tienes permiso para realizar esta acción.");
                return;
            }

            const dataToSend = {};
            editableFields.forEach(field => {
                const input = document.getElementById(field.inputId);
                if (input) dataToSend[field.id] = input.value.trim();
            });

            // Password handling
            const pass = document.getElementById('password')?.value.trim();
            const confirm = document.getElementById('confirm-password')?.value.trim();
            if (pass) {
                if (pass !== confirm) {
                    alert("Las contraseñas no coinciden.");
                    return;
                }
                dataToSend.password = pass;
            }

            try {
                const res = await fetch('https://cambiosorion.cl/data/mi-perfil.php', {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(dataToSend)
                });

                const result = await res.json();

                if (result.success) {
                    // Éxito: Mostrar modal y recargar
                    const modalSuccess = document.getElementById('modal-exitoso');
                    if(modalSuccess) modalSuccess.classList.remove('hidden');
                } else {
                    alert("Error: " + result.message);
                }

            } catch (error) {
                console.error("Error guardando:", error);
                alert("Hubo un error de conexión.");
            }
        });
    }

    // Iniciar
    getUserData();
});