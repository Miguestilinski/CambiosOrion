document.addEventListener('DOMContentLoaded', () => {
    // Referencias DOM principales
    const sidebarContainer = document.getElementById('sidebar-container');
    const mobileSidebarContainer = document.getElementById('mobile-sidebar-container');
    
    // Referencias de UI Usuario
    const welcomeName = document.getElementById('welcome-name');
    const welcomeRole = document.getElementById('welcome-role');
    const headerName = document.getElementById('header-user-name');
    const headerEmail = document.getElementById('dropdown-user-email');
    
    // Referencias Perfil
    const roleTypeElement = document.getElementById('role-type');
    const emailElement = document.getElementById('email');
    const rutGroupElement = document.getElementById('rut-group');
    const rutElement = document.getElementById('rut');
    const userNameDashboard = document.getElementById('user-name-dashboard');

    // 1. GESTIÓN DE SESIÓN
    async function getSession() {
        try {
            const res = await fetch("https://cambiosorion.cl/data/session_status_clientes.php", {
                credentials: "include"
            });
            const data = await res.json();
            console.log("Datos recibidos:", data);
            
            if (!data.isAuthenticated) {
            console.error("No autenticado. Razón:", data); // <--- Ver razón
            // window.location.href = 'https://cambiosorion.cl/login'; // <--- COMENTA ESTA LÍNEA CON //
            alert("Me hubiera redirigido, pero lo detuve. Revisa la consola."); // Aviso visual
            return;
        }

            // Poblar datos en la UI
            const nombre = data.nombre || 'Cliente';
            const primerNombre = nombre.split(' ')[0];
            const correo = data.correo || '';
            const rut = data.rut || 'No registrado';
            // Asumimos que data.tipo viene del PHP, si no, inferimos
            const tipoCliente = data.tipo_cliente || 'cliente'; 

            // Header y Saludo
            if(welcomeName) welcomeName.textContent = primerNombre;
            if(headerName) headerName.textContent = primerNombre;
            if(headerEmail) headerEmail.textContent = correo;
            
            // Sección Perfil
            if(userNameDashboard) userNameDashboard.textContent = nombre;
            if(emailElement) emailElement.value = correo; // Input readonly
            if(rutElement) rutElement.textContent = rut;

            // Lógica visual de Tipo de Cliente
            if (rut && rut !== 'No registrado') {
                rutGroupElement.classList.remove('hidden');
            }
            if(roleTypeElement) roleTypeElement.textContent = tipoCliente === 'empresa' ? 'Cuenta Empresa' : 'Cuenta Personal';
            if(welcomeRole) welcomeRole.textContent = tipoCliente === 'empresa' ? 'Empresa Verificada' : 'Usuario Verificado';

            // Cargar Sidebar una vez validada la sesión
            loadSidebar();

        } catch (error) {
            console.error("Error validando sesión:", error);
            //window.location.href = 'https://cambiosorion.cl/login';
        }
    }

    // 2. CARGAR SIDEBAR Y GESTIONAR NAVEGACIÓN
    function loadSidebar() {
        fetch('sidebar-cliente.html')
            .then(response => response.text())
            .then(html => {
                // Inyectar en escritorio
                if(sidebarContainer) {
                    sidebarContainer.innerHTML = html;
                    setupNavigation(sidebarContainer);
                }
                // Clonar lógica para móvil si es necesario o inyectar links básicos
                // Para simplificar, usamos la misma lógica de navegación
            })
            .catch(err => console.error("Error cargando sidebar:", err));
    }

    function setupNavigation(container) {
        const menuItems = container.querySelectorAll('.menu-item');
        const sections = document.querySelectorAll('.content-section');

        menuItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault(); // Evitar salto de ancla

                // 1. Actualizar estilo Sidebar
                menuItems.forEach(menu => {
                    menu.classList.remove('bg-blue-50', 'text-blue-600', 'font-bold');
                    menu.classList.add('text-gray-600');
                    // Resetear icono
                    const icon = menu.querySelector('svg');
                    if(icon) icon.classList.remove('text-blue-600');
                });
                
                // Activar actual
                item.classList.remove('text-gray-600');
                item.classList.add('bg-blue-50', 'text-blue-600', 'font-bold');

                // 2. Mostrar Sección
                const targetId = item.getAttribute('data-section');
                sections.forEach(section => {
                    section.classList.add('hidden-section'); // Ocultar todas
                    if(section.id === `section-${targetId}`) {
                        section.classList.remove('hidden-section'); // Mostrar target
                    }
                });
            });
        });

        // Simular click en "Inicio" al cargar
        const defaultLink = container.querySelector('[data-section="dashboard"]');
        if(defaultLink) defaultLink.click();
    }

    // 3. LOGICA FORMULARIO DOCUMENTOS (Mantenida del original pero adaptada)
    const documentationForm = document.getElementById('documentation-form');
    const uploadStatus = document.getElementById('upload-status');

    if(documentationForm) {
        documentationForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            
            // UI Feedback
            const btn = documentationForm.querySelector('button[type="submit"]');
            const originalBtnText = btn.textContent;
            btn.disabled = true;
            btn.textContent = "Subiendo...";
            uploadStatus.textContent = "";

            // Validación simple
            let isValid = true;
            const inputs = documentationForm.querySelectorAll('input[type="file"]');
            inputs.forEach(input => {
                const errorElement = document.getElementById(`${input.id}-error`);
                if (!input.files.length) {
                    // Nota: Podrías hacer que no todos sean obligatorios según lógica de negocio
                    // isValid = false; 
                    // if(errorElement) { errorElement.textContent = "Archivo requerido"; errorElement.classList.remove('hidden'); }
                } else {
                    if(errorElement) errorElement.classList.add('hidden');
                }
            });

            const formData = new FormData(documentationForm);

            try {
                // Necesitamos el ID del usuario. Lo pedimos de nuevo o lo guardamos globalmente.
                // Opción robusta: volver a pedir data ligera o leer de un campo hidden si lo hubieramos puesto.
                const userRes = await fetch('https://cambiosorion.cl/data/session_status_clientes.php', { credentials: 'include' });
                const userData = await userRes.json();
                
                if (userData.cliente_id) {
                    formData.append('id', userData.cliente_id);
                } else {
                    throw new Error("No se pudo identificar el usuario.");
                }

                const uploadResponse = await fetch('https://cambiosorion.cl/data/upload_documents.php', {
                    method: 'POST',
                    body: formData,
                    credentials: 'include',
                });

                const uploadData = await uploadResponse.json();

                if (uploadData.success) {
                    uploadStatus.textContent = "¡Documentos subidos exitosamente!";
                    uploadStatus.className = "text-sm font-bold text-green-600";
                    setTimeout(() => window.location.reload(), 2000);
                } else {
                    throw new Error(uploadData.message || "Error en servidor");
                }
            } catch (error) {
                console.error(error);
                uploadStatus.textContent = "Error: " + error.message;
                uploadStatus.className = "text-sm font-bold text-red-600";
            } finally {
                btn.disabled = false;
                btn.textContent = originalBtnText;
            }
        });
    }

    // Helper global para lista de archivos (Usado en el HTML onchange)
    window.updateFileList = function(inputId) {
        const input = document.getElementById(inputId);
        const list = document.getElementById(`${inputId}-file-list`);
        if(!input || !list) return;

        list.innerHTML = "";
        Array.from(input.files).forEach(file => {
            const li = document.createElement('li');
            li.textContent = file.name;
            list.appendChild(li);
        });
    }

    // Iniciar todo
    getSession();
});