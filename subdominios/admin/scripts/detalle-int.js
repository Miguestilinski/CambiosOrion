document.addEventListener('DOMContentLoaded', () => {
    // Referencias
    const headerName = document.getElementById('header-user-name');
    const headerBadge = document.getElementById('header-badge');
    const headerEmail = document.getElementById('dropdown-user-email');
    const sidebarContainer = document.getElementById('sidebar-container');
    
    // Campos Form
    const pageTitle = document.getElementById('page-title-crumb');
    const profileName = document.getElementById('profile-name');
    const fId = document.getElementById('f-id');
    const fNombre = document.getElementById('f-nombre');
    const fRut = document.getElementById('f-rut');
    const fNacimiento = document.getElementById('f-nacimiento');
    const fCivil = document.getElementById('f-civil');
    const fDireccion = document.getElementById('f-direccion');
    const fEmail = document.getElementById('f-email');
    const fTelefono = document.getElementById('f-telefono');
    const fRol = document.getElementById('f-rol');
    const fContrato = document.getElementById('f-contrato');
    const fIngreso = document.getElementById('f-ingreso');
    const fSueldo = document.getElementById('f-sueldo');
    
    const btnSave = document.getElementById('btn-save');

    // Modal Notification Elements
    const modalNotif = document.getElementById('modal-notification');
    const modalIcon = document.getElementById('modal-icon-container');
    const modalTitle = document.getElementById('modal-title');
    const modalMsg = document.getElementById('modal-message');
    const modalBtn = document.getElementById('modal-btn');

    let currentUserId = null;

    init();

    function init() {
        getSession();
        setupEventListeners();
    }

    // --- FUNCIÓN ALERT REEMPLAZO ---
    function showAlert(title, message, isError = false, callback = null) {
        // Iconos
        const iconSuccess = `<svg class="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`;
        const iconError = `<svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>`;

        modalIcon.innerHTML = isError ? iconError : iconSuccess;
        modalIcon.className = isError 
            ? "w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"
            : "w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4";

        modalTitle.textContent = title;
        modalMsg.textContent = message;
        
        modalBtn.className = isError 
            ? "w-full px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold transition shadow-lg shadow-red-500/30"
            : "w-full px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold transition shadow-lg shadow-indigo-500/30";

        modalBtn.onclick = () => {
            modalNotif.classList.add('hidden');
            if(callback) callback();
        };

        modalNotif.classList.remove('hidden');
    }

    // --- UTILS ---
    function formatName(fullName) {
        if (!fullName) return '';
        const parts = fullName.trim().split(/\s+/);
        if (parts.length >= 3) return `${parts[0]} ${parts[2]}`;
        if (parts.length === 2) return `${parts[0]} ${parts[1]}`;
        return parts[0];
    }

    async function getSession() {
        try {
            const res = await fetch("https://cambiosorion.cl/data/session_status.php", { credentials: "include" });
            const data = await res.json();
            
            if (!data.isAuthenticated) {
                window.location.href = 'https://admin.cambiosorion.cl/login';
                return;
            }

            currentUserId = data.equipo_id;
            const role = (data.rol || '').toLowerCase().trim();
            
            if (!['socio', 'admin', 'gerente', 'rrhh'].includes(role)) {
                alert("Acceso restringido");
                window.location.href = 'index';
                return;
            }

            if(headerName) headerName.textContent = formatName(data.nombre);
            if(headerEmail) headerEmail.textContent = data.correo;
            if(headerBadge) {
                headerBadge.textContent = "PORTAL ADMIN";
                headerBadge.className = "hidden md:inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-indigo-600 text-white border border-indigo-500/30 tracking-wider uppercase shadow-lg shadow-indigo-500/20";
            }

            loadSidebar();
            
            // Obtener ID de la URL
            const urlParams = new URLSearchParams(window.location.search);
            const targetId = urlParams.get('id');

            if (targetId && targetId !== 'new') {
                loadProfile(targetId);
            } else {
                setupNewProfile();
            }

        } catch (error) {
            console.error(error);
        }
    }

    function loadSidebar() {
        fetch('sidebar.html').then(r => r.text()).then(html => {
            if(sidebarContainer) {
                sidebarContainer.innerHTML = html;
                // Mostrar items de admin
                sidebarContainer.querySelectorAll('.admin-only').forEach(el => el.classList.remove('hidden'));
                
                // Marcar "Equipo" como activo ya que Detalle es hijo de Equipo
                const link = sidebarContainer.querySelector('a[href="equipo"]');
                if(link) link.classList.add('bg-indigo-50', 'text-indigo-700', 'font-bold');
            }
        });
    }

    function setupNewProfile() {
        pageTitle.textContent = "Nuevo Integrante";
        profileName.textContent = "Creando Perfil";
        fId.value = 0;
        fIngreso.valueAsDate = new Date();
    }

    async function loadProfile(id) {
        pageTitle.textContent = "Detalles del Perfil";
        
        try {
            // CAMBIO: Apunta a detalle-int.php
            const res = await fetch(`https://cambiosorion.cl/data/detalle-int.php?current_user_id=${currentUserId}&id=${id}`);
            const json = await res.json();

            if (!json.success) {
                showAlert("Error", json.message, true, () => window.location.href = 'equipo');
                return;
            }

            const u = json.data;
            fId.value = u.id;
            
            // Llenar campos
            fNombre.value = u.nombre;
            fRut.value = u.rut;
            fEmail.value = u.email;
            fTelefono.value = u.telefono || '';
            fNacimiento.value = u.fecha_nacimiento || '';
            fCivil.value = u.estado_civil || '';
            fDireccion.value = u.direccion || '';
            
            fRol.value = u.rol; 
            fContrato.value = u.tipo_contrato;
            fIngreso.value = u.fecha_ingreso;
            fSueldo.value = u.sueldo_liquido;

            profileName.textContent = u.nombre;

        } catch (e) {
            console.error(e);
            showAlert("Error", "Error al cargar el perfil. Revisa tu conexión.", true);
        }
    }

    async function saveProfile() {
        const payload = {
            current_user_id: currentUserId,
            id: fId.value,
            nombre: fNombre.value,
            rut: fRut.value,
            email: fEmail.value,
            telefono: fTelefono.value,
            fecha_nacimiento: fNacimiento.value,
            estado_civil: fCivil.value,
            direccion: fDireccion.value,
            rol: fRol.value,
            tipo_contrato: fContrato.value,
            fecha_ingreso: fIngreso.value,
            sueldo_liquido: fSueldo.value
        };

        if(!payload.nombre || !payload.rut || !payload.email) {
            showAlert("Faltan Datos", "Nombre, RUT y Email son obligatorios.", true);
            return;
        }

        btnSave.disabled = true;
        btnSave.textContent = "Guardando...";

        try {
            const res = await fetch("https://cambiosorion.cl/data/detalle-int.php", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(payload)
            });
            const json = await res.json();

            if (json.success) {
                showAlert("¡Éxito!", "El perfil ha sido guardado correctamente.", false, () => {
                    if (fId.value == 0) window.location.href = 'equipo';
                    else location.reload();
                });
            } else {
                showAlert("Error al Guardar", json.message, true);
            }
        } catch (e) {
            console.error(e);
            showAlert("Error de Conexión", "No se pudo conectar con el servidor.", true);
        } finally {
            btnSave.disabled = false;
            btnSave.textContent = "Guardar Cambios";
        }
    }

    function setupEventListeners() {
        btnSave.addEventListener('click', (e) => {
            e.preventDefault();
            saveProfile();
        });
    }
});