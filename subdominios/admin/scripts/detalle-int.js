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
    const fRolCustom = document.getElementById('f-rol-custom');
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

    // --- CARGA DE PERFIL ---
    async function loadProfile(id) {
        pageTitle.textContent = "Detalles del Perfil";
        
        try {
            const res = await fetch(`https://cambiosorion.cl/data/detalle-int.php?current_user_id=${currentUserId}&id=${id}`);
            const json = await res.json();

            if (!json.success) {
                showAlert("Error", json.message, true, () => window.location.href = 'equipo');
                return;
            }

            const u = json.data;
            fId.value = u.id;
            fNombre.value = u.nombre;
            fRut.value = u.rut;
            fEmail.value = u.email;
            fTelefono.value = u.telefono || '';
            fNacimiento.value = u.fecha_nacimiento || '';
            fCivil.value = u.estado_civil || '';
            fDireccion.value = u.direccion || '';
            
            // === LÓGICA DE ROL ===
            // Obtenemos los valores existentes en el select
            const existingOptions = Array.from(fRol.options).map(opt => opt.value);
            const rolDB = (u.rol || '').trim();

            if (rolDB && rolDB.toLowerCase() !== 'custom' && !existingOptions.includes(rolDB)) {
                // CASO 1: Es un rol personalizado válido (ej: "Piloto Jefe")
                // Creamos la opción para que aparezca en el select
                const newOpt = document.createElement('option');
                newOpt.value = rolDB;
                newOpt.textContent = rolDB;
                
                // Insertamos antes de "Agregar Nuevo..."
                const customOpt = fRol.querySelector('option[value="custom"]');
                fRol.insertBefore(newOpt, customOpt);
                
                // Seleccionamos y ocultamos el input
                fRol.value = rolDB;
                fRolCustom.classList.add('hidden');
                
            } else if (rolDB.toLowerCase() === 'custom') {
                // CASO 2: Error de datos, en la BD dice "custom"
                // Seleccionamos "Agregar Nuevo" y mostramos el input vacío para corregir
                fRol.value = 'custom';
                fRolCustom.value = ''; 
                fRolCustom.classList.remove('hidden');
            } else {
                // CASO 3: Rol estándar (ej: "Cajero")
                fRol.value = rolDB;
                fRolCustom.classList.add('hidden');
            }

            // === LÓGICA CONTRATO ===
            fContrato.value = u.tipo_contrato;
            fIngreso.value = u.fecha_ingreso;
            fSueldo.value = u.sueldo_liquido;
            profileName.textContent = u.nombre;

        } catch (e) {
            console.error(e);
            showAlert("Error", "Error al cargar el perfil.", true);
        }
    }

    // --- GUARDADO ---
    async function saveProfile() {
        // Validación Rol
        let finalRole = fRol.value;
        if (finalRole === 'custom') {
            finalRole = fRolCustom.value.trim();
            if(!finalRole) {
                showAlert("Faltan Datos", "Debe escribir el nombre del cargo personalizado.", true);
                fRolCustom.focus();
                return;
            }
            if(finalRole.toLowerCase() === 'custom') {
                showAlert("Error", "El nombre del cargo no puede ser 'custom'.", true);
                return;
            }
        }

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
            rol: finalRole, // Enviamos el texto real, nunca "custom"
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
                showAlert("¡Éxito!", "Perfil actualizado correctamente.", false, () => {
                    if (fId.value == 0) window.location.href = 'equipo';
                    else location.reload();
                });
            } else {
                showAlert("Error", json.message, true);
            }
        } catch (e) {
            console.error(e);
            showAlert("Error de Conexión", "No se pudo contactar al servidor.", true);
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

        // Evento cambio de Rol
        fRol.addEventListener('change', () => {
            // 1. Mostrar/Ocultar input
            if (fRol.value === 'custom') {
                fRolCustom.classList.remove('hidden');
                fRolCustom.value = ''; // Limpiar para escribir nuevo
                fRolCustom.focus();
            } else {
                fRolCustom.classList.add('hidden');
            }

            // 2. Lógica Automática Socio/Dueño
            if (fRol.value === 'Socio') {
                fContrato.value = 'Dueño';
            } else {
                if (fContrato.value === 'Dueño') {
                    fContrato.value = 'Indefinido';
                }
            }
        });
    }
});