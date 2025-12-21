document.addEventListener('DOMContentLoaded', () => {
    // UI References
    const editButtonContainer = document.getElementById('edit-button-container'); 
    const editBtn = document.getElementById('edit-button');
    const saveButton = document.getElementById('save_changes');
    const saveBar = document.getElementById('save-bar');
    const passwordGroup = document.getElementById('password-group');
    
    // Data Display References
    const userTypeElement = document.getElementById('user-type');
    const userNameElement = document.getElementById('user-name-dashboard');
    const roleTypeElement = document.getElementById('role-type');
    const rutElement = document.getElementById('rut');

    // Field Mapping
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

    // --- 1. Load Data ---
    async function getUserData() {
        try {
            const res = await fetch('https://cambiosorion.cl/data/mi-perfil.php', {
                method: 'GET',
                credentials: 'include'
            });
            const data = await res.json();

            if (!data.success) {
                if(data.message === 'No autorizado') window.location.href = 'login';
                return;
            }

            const user = data.user;
            userCanEdit = data.can_edit; // Backend decide logic

            // Populate Static Header Data
            if(userNameElement) userNameElement.textContent = user.nombre;
            if(rutElement) rutElement.textContent = user.rut || '—';
            if(roleTypeElement) roleTypeElement.textContent = user.rol;
            if(userTypeElement) userTypeElement.textContent = "Colaborador";

            // Populate Form Fields
            fillUserData(user);

            // Handle Edit Permission UI
            if (userCanEdit) {
                editButtonContainer.classList.remove('hidden');
                
                // Auto-open edit mode if critical data is missing (First Time UX)
                if (!user.direccion || user.direccion.length < 3 || !user.rut) {
                    toggleEditMode(true);
                }
            } else {
                editButtonContainer.classList.add('hidden');
                toggleEditMode(false); // Ensure readonly
            }

        } catch (error) {
            console.error('Error fetching profile:', error);
        }
    }

    function fillUserData(user) {
        editableFields.forEach(field => {
            const view = document.getElementById(field.viewId);
            const input = document.getElementById(field.inputId);
            const val = user[field.id] || '';

            if (view) view.textContent = val || '—';
            if (input) input.value = val;
        });
    }

    // --- 2. Edit Mode Toggle ---
    function toggleEditMode(enable) {
        const inputs = document.querySelectorAll('form input, form select');
        const texts = document.querySelectorAll('form p[id$="-view"]');

        if (enable) {
            inputs.forEach(input => input.classList.remove('hidden'));
            texts.forEach(p => p.classList.add('hidden'));
            if(passwordGroup) passwordGroup.classList.remove('hidden');
            if(saveBar) saveBar.classList.remove('hidden');
            if(editBtn) editBtn.classList.add('hidden');
        } else {
            inputs.forEach(input => input.classList.add('hidden'));
            texts.forEach(p => p.classList.remove('hidden'));
            if(passwordGroup) passwordGroup.classList.add('hidden');
            if(saveBar) saveBar.classList.add('hidden');
            if(editBtn && userCanEdit) editBtn.classList.remove('hidden');
        }
    }

    if(editBtn) editBtn.addEventListener('click', () => toggleEditMode(true));

    // Cancel Button Logic
    // Buscamos el botón de cancelar dentro de la barra flotante
    const cancelBtn = document.querySelector('#save-bar button[type="button"]'); 
    if(cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            toggleEditMode(false);
            getUserData(); // Reset data to original state
        });
    }

    // --- 3. Save Data ---
    if(saveButton) {
        saveButton.addEventListener('click', async (e) => {
            e.preventDefault();

            if (!userCanEdit) {
                alert("No tienes permiso para editar.");
                return;
            }

            const dataToSend = {};
            editableFields.forEach(field => {
                const input = document.getElementById(field.inputId);
                if (input) dataToSend[field.id] = input.value.trim();
            });

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
                    const modalSuccess = document.getElementById('modal-exitoso');
                    if(modalSuccess) modalSuccess.classList.remove('hidden');
                } else {
                    alert("Error: " + result.message);
                }

            } catch (error) {
                console.error("Save error:", error);
                alert("Error de conexión al guardar.");
            }
        });
    }

    // Initialize
    getUserData();
});