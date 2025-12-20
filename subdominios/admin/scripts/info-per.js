document.addEventListener('DOMContentLoaded', () => {
    // Referencias DOM
    const userTypeElement = document.getElementById('user-type');
    const userNameElement = document.getElementById('user-name-dashboard');
    const roleTypeElement = document.getElementById('role-type');
    const rutElement = document.getElementById('rut');
    const editButtonContainer = document.getElementById('edit-button-container'); 
    const saveButton = document.getElementById('save_changes');
    const headerBadge = document.getElementById('header-badge');
    const profileColorBar = document.getElementById('profile-color-bar');
    const sidebarContainer = document.getElementById('sidebar-container');

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

    let isEditing = false;
    let equipoId = null;
    let currentUser = null;

    // 1. Obtener Sesión y determinar Rol
    async function getSession() {
        try {
            const res = await fetch("https://cambiosorion.cl/data/session_status.php", {
                credentials: "include"
            });
            if (!res.ok) throw new Error("No se pudo obtener la sesión.");
            
            const data = await res.json();
            
            if (!data.isAuthenticated || !data.equipo_id) {
                window.location.href = 'https://admin.cambiosorion.cl/login';
                return;
            }

            equipoId = data.equipo_id;
            // Normalizamos el rol a minúsculas para comparar fácil
            const rol = (data.rol || '').toLowerCase().trim();

            // Configurar UI según Rol
            configureDashboardByRole(rol);

            // Cargar datos específicos del usuario
            getUserData();

        } catch (error) {
            console.error("Error obteniendo la sesión:", error);
            window.location.href = 'https://admin.cambiosorion.cl/login';
        }
    }

    // 2. Configuración Visual y Sidebar según Rol
    function configureDashboardByRole(rol) {
        // Definimos quiénes son los "Super Usuarios" que pueden ver todo
        // Ajusta esta lista según los roles reales de tu base de datos
        const superUsers = ['socio', 'admin', 'gerente']; 
        const isSuperUser = superUsers.includes(rol);

        // Cargar Sidebar Único
        fetch('sidebar.html')
            .then(response => response.text())
            .then(html => {
                if(sidebarContainer) {
                    sidebarContainer.innerHTML = html;
                    
                    // Lógica de filtrado del menú
                    const adminItems = sidebarContainer.querySelectorAll('.admin-only');
                    
                    if (isSuperUser) {
                        // Si es super usuario, mostramos los items ocultos
                        adminItems.forEach(item => item.classList.remove('hidden'));
                    } else {
                        // Si es normal, nos aseguramos que sigan ocultos (o los removemos del DOM)
                        adminItems.forEach(item => item.remove());
                    }
                    
                    // Marcar activo el link actual
                    const currentPath = window.location.pathname.split('/').pop() || 'info-per';
                    const activeLink = sidebarContainer.querySelector(`a[href="${currentPath}"]`);
                    if(activeLink) {
                        activeLink.classList.add('bg-indigo-50', 'text-indigo-700', 'font-bold');
                        activeLink.classList.remove('text-slate-600');
                    }
                }
            })
            .catch(err => console.error("Error cargando sidebar:", err));

        // Ajustes visuales del Header y Perfil
        if (isSuperUser) {
            // Estilos para SOCIOS / ADMIN
            if(headerBadge) {
                headerBadge.textContent = "PORTAL SOCIOS";
                headerBadge.className = "hidden md:inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 tracking-wider uppercase";
            }
            if(profileColorBar) {
                profileColorBar.className = "absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500";
            }
            // Los socios pueden editar todo (o al menos ver el botón)
            if(editButtonContainer) editButtonContainer.classList.remove('hidden');

        } else {
            // Estilos para ADMINISTRATIVOS / NORMALES
            if(headerBadge) {
                headerBadge.textContent = "PORTAL COLABORADOR";
                headerBadge.className = "hidden md:inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 tracking-wider uppercase";
            }
            if(profileColorBar) {
                profileColorBar.className = "absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500";
            }
            // Los normales solo ven, no editan (o según tu regla de negocio)
            if(editButtonContainer) editButtonContainer.classList.add('hidden');
        }
    }

    // 3. Obtener Datos del Usuario
    function getUserData() {
        fetch(`https://cambiosorion.cl/data/info-per.php?equipo_id=${equipoId}`, {
            method: 'GET',
            credentials: 'include'
        })
            .then(res => res.json())
            .then(data => {
                if (!data.success) {
                    console.error("Error success false en info-per");
                    return;
                }

                const user = data.user;
                currentUser = user;
                fillUserData(user);

                if(userTypeElement) userTypeElement.textContent = "Colaborador";
                if(roleTypeElement) roleTypeElement.textContent = capitalizeFirstLetter(user.rol || "Usuario");
                if(rutElement) rutElement.textContent = user.rut || "—";
                if(userNameElement) userNameElement.textContent = user.nombre || "Usuario";
                
                const headerEmail = document.getElementById('dropdown-user-email');
                if(headerEmail) headerEmail.textContent = user.correo;
                
                const headerName = document.getElementById('header-user-name');
                if(headerName) headerName.textContent = user.nombre ? user.nombre.split(' ')[0] : 'Usuario';
            })
            .catch(error => console.error('Error al cargar los datos del usuario:', error));
    }

    function fillUserData(user) {
        editableFields.forEach(field => {
            const view = document.getElementById(field.viewId);
            const input = document.getElementById(field.inputId);

            const value = user[field.id] || '';
            const defaultPlaceholders = {
                correo: 'Ej: correo@dominio.cl',
                telefono: 'Ej: +56 9 1234 5678',
                direccion: 'Ej: Agustinas 1035',
                estado_civil: 'Ej: Soltero, Casado',
                fecha_nacimiento: 'Selecciona una fecha',
                banco: 'Nombre del banco',
                tipo_cuenta: 'Corriente, Vista, etc.',
                numero_cuenta: 'Ej: 1234567890'
            };

            if (view) view.textContent = value || '—';

            if (input) {
                if (input.tagName === 'SELECT') {
                    input.value = value;
                } else {
                    input.placeholder = value || defaultPlaceholders[field.id] || '';
                }
            }
        });
    }

    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    // 4. Guardar
    if(saveButton) {
        saveButton.addEventListener('click', async (e) => {
            e.preventDefault();

            const dataToSend = { equipo_id: equipoId };

            editableFields.forEach(field => {
                const input = document.getElementById(field.inputId);
                if (input) dataToSend[field.id] = input.value.trim();
            });

            const password = document.getElementById('password').value.trim();
            const confirmPassword = document.getElementById('confirm-password').value.trim();

            if (password || confirmPassword) {
                if (password !== confirmPassword) {
                    alert("Las contraseñas no coinciden.");
                    return;
                }
                dataToSend.password = password;
            }

            try {
                const res = await fetch('https://cambiosorion.cl/data/info-per.php', {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(dataToSend)
                });

                const raw = await res.text();
                let data;
                try {
                    data = JSON.parse(raw);
                } catch (err) {
                    console.error("Respuesta no válida", raw);
                    return;
                }

                if (data.success) {
                    const modalSuccess = document.getElementById('modal-exitoso');
                    if(modalSuccess) modalSuccess.classList.remove('hidden');
                } else {
                    alert(`Error: ${data.message}`);
                }
            } catch (error) {
                console.error('Error crítico al guardar:', error);
                alert("Error de conexión al guardar.");
            }
        });
    }

    getSession();
});