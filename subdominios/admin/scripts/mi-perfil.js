import { initAdminHeader } from './header.js';

document.addEventListener('DOMContentLoaded', async() => {

    // 1. INICIALIZAR HEADER GLOBAL (Sesión, Sidebar, Menú Móvil)
    // Pasamos 'mi-perfil' para que quede marcado en el sidebar
    const sessionData = await initAdminHeader('mi-perfil');

    if (!sessionData.isAuthenticated) return; // initAdminHeader ya redirige si falla

    // 2. CONFIGURACIÓN ESPECÍFICA DE LA PÁGINA
    let userCanEdit = false;
    let currentUserId = sessionData.equipo_id;

    // Referencias UI específicas de Perfil
    const editButtonContainer = document.getElementById('edit-button-container'); 
    const editBtn = document.getElementById('edit-button');
    const saveButton = document.getElementById('save_changes');
    const saveBar = document.getElementById('save-bar');
    const passwordGroup = document.getElementById('password-group');
    
    const userTypeElement = document.getElementById('user-type');
    const userNameElement = document.getElementById('user-name-dashboard');
    const roleTypeElement = document.getElementById('role-type');
    const rutElement = document.getElementById('rut');

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

    // Cargar datos del perfil específico
    loadUserProfile(currentUserId);

    // --- 3. LOGICA DE DATOS DEL PERFIL ---
    async function loadUserProfile(id) {
        try {
            const res = await fetch(`https://cambiosorion.cl/data/mi-perfil.php?id=${id}`);
            const data = await res.json();

            if (!data.success) {
                console.error("Error API Perfil:", data.message);
                return;
            }

            const user = data.user;
            userCanEdit = data.can_edit;

            // Renderizar datos en la tarjeta de perfil
            if(userNameElement) userNameElement.textContent = user.nombre;
            if(rutElement) rutElement.textContent = user.rut || '—';
            if(roleTypeElement) roleTypeElement.textContent = user.rol;
            if(userTypeElement) userTypeElement.textContent = "Colaborador";

            fillUserData(user);

            // Mostrar botón editar solo si corresponde
            if (userCanEdit) {
                if(editButtonContainer) editButtonContainer.classList.remove('hidden');
                
                // Auto-activar edición si faltan datos (Primera vez)
                if (!user.direccion || user.direccion.length < 3 || !user.rut) {
                    toggleEditMode(true);
                }
            } else {
                if(editButtonContainer) editButtonContainer.classList.add('hidden');
                toggleEditMode(false);
            }

        } catch (error) {
            console.error("Error cargando datos del perfil:", error);
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

    // --- 4. INTERFAZ DE EDICIÓN ---
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

    // Botón cancelar
    const cancelBtn = document.querySelector('#save-bar button:not([type="submit"])'); 
    if(cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            toggleEditMode(false);
            loadUserProfile(currentUserId); 
        });
    }

    // --- 5. GUARDAR DATOS ---
    if(saveButton) {
        saveButton.addEventListener('click', async (e) => {
            e.preventDefault();

            if (!userCanEdit) {
                alert("No tienes permiso para editar.");
                return;
            }

            const dataToSend = { user_id: currentUserId }; 
            
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
                console.error("Error guardando:", error);
                alert("Error de conexión al guardar.");
            }
        });
    }

    // Modal éxito - volver
    const btnVolver = document.getElementById('volver');
    if(btnVolver){
        btnVolver.addEventListener('click', ()=>{
             location.reload();
        });
    }

});