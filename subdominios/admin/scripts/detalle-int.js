import { initAdminHeader } from './header.js';

document.addEventListener('DOMContentLoaded', async () => {

    // --- 1. CONFIGURACIÓN UI: MODAL (Reemplazo de alerts) ---
    const modalNotif = document.getElementById('modal-notification');
    const modalIcon = document.getElementById('modal-icon-container');
    const modalTitle = document.getElementById('modal-title');
    const modalMsg = document.getElementById('modal-message');
    const modalBtn = document.getElementById('modal-btn');

    function showAlert(title, message, isError = false, redirectCallback = null) {
        const iconSuccess = `<svg class="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`;
        const iconError = `<svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>`;

        if(modalIcon) {
            modalIcon.innerHTML = isError ? iconError : iconSuccess;
            modalIcon.className = isError 
                ? "w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"
                : "w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4";
        }

        if(modalTitle) modalTitle.textContent = title;
        if(modalMsg) modalMsg.textContent = message;
        
        if(modalBtn) {
            modalBtn.className = isError 
                ? "w-full px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold transition shadow-lg shadow-red-500/30"
                : "w-full px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold transition shadow-lg shadow-indigo-500/30";

            modalBtn.onclick = () => {
                if(modalNotif) modalNotif.classList.add('hidden');
                if (redirectCallback) redirectCallback();
            };
        }

        if(modalNotif) modalNotif.classList.remove('hidden');
    }

    // --- 2. INICIALIZACIÓN GLOBAL ---
    // Marcamos 'equipo' como activo
    const sessionData = await initAdminHeader('equipo');

    if (!sessionData.isAuthenticated) return;

    // --- 3. SEGURIDAD ---
    const role = (sessionData.rol || '').toLowerCase().trim();
    const allowedRoles = ['socio', 'admin', 'gerente', 'rrhh'];
    
    if (!allowedRoles.includes(role)) {
        showAlert("Acceso Denegado", "No tienes permisos para editar integrantes.", true, () => {
            window.location.href = 'equipo';
        });
        return;
    }

    // --- 4. REFERENCIAS DOM (FORMULARIO) ---
    const pageTitle = document.getElementById('page-title-crumb');
    const profileName = document.getElementById('profile-name');
    
    // Inputs
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

    // --- 5. LÓGICA DE CARGA DE DATOS ---
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('id');

    if (userId) {
        loadUserDetails(userId);
    } else {
        showAlert("Error", "No se especificó un ID de integrante.", true, () => {
            window.location.href = 'equipo';
        });
    }

    setupEventListeners();

    // --- FUNCIONES ---

    async function loadUserDetails(id) {
        try {
            // Asumimos que existe un endpoint GET que devuelve los datos del usuario por ID
            const res = await fetch(`https://cambiosorion.cl/data/detalle-int.php?id=${id}`);
            const json = await res.json();

            if (json.success && json.data) {
                const u = json.data;
                
                // Llenar campos
                fId.value = u.id;
                fNombre.value = u.nombre;
                fRut.value = u.rut;
                fNacimiento.value = u.fecha_nacimiento;
                fCivil.value = u.estado_civil;
                fDireccion.value = u.direccion;
                fEmail.value = u.email;
                fTelefono.value = u.telefono;
                fIngreso.value = u.fecha_ingreso;
                fSueldo.value = u.sueldo_liquido;
                fContrato.value = u.tipo_contrato;

                // UI Header Profile Name
                if(profileName) profileName.textContent = u.nombre;

                // Lógica de Roles (Custom vs Select)
                const standardRoles = ['Socio', 'Gerente', 'Admin', 'RRHH', 'Cajero', 'Contador'];
                if (standardRoles.includes(u.rol)) {
                    fRol.value = u.rol;
                    fRolCustom.classList.add('hidden');
                } else {
                    fRol.value = 'custom';
                    fRolCustom.classList.remove('hidden');
                    fRolCustom.value = u.rol;
                }

            } else {
                showAlert("Error", "No se encontraron datos para este integrante.", true, () => {
                    window.location.href = 'equipo';
                });
            }
        } catch (error) {
            console.error(error);
            showAlert("Error de Conexión", "No se pudieron cargar los datos.", true);
        }
    }

    async function saveProfile() {
        // Validaciones básicas
        if (!fNombre.value || !fRut.value || !fEmail.value) {
            showAlert("Datos Faltantes", "Nombre, RUT y Email son obligatorios.", true);
            return;
        }

        // Determinar rol final
        let finalRol = fRol.value;
        if (finalRol === 'custom') {
            finalRol = fRolCustom.value.trim();
            if (!finalRol) {
                showAlert("Rol Faltante", "Especifique el cargo personalizado.", true);
                return;
            }
        }

        const payload = {
            id: fId.value,
            nombre: fNombre.value,
            rut: fRut.value,
            fecha_nacimiento: fNacimiento.value,
            estado_civil: fCivil.value,
            direccion: fDireccion.value,
            email: fEmail.value,
            telefono: fTelefono.value,
            rol: finalRol,
            tipo_contrato: fContrato.value,
            fecha_ingreso: fIngreso.value,
            sueldo_liquido: fSueldo.value
        };

        btnSave.disabled = true;
        btnSave.textContent = "Guardando...";

        try {
            const res = await fetch("https://cambiosorion.cl/data/detalle-int.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            
            const json = await res.json();

            if (json.success) {
                showAlert("¡Éxito!", "Perfil actualizado correctamente.", false, () => {
                    location.reload();
                });
            } else {
                showAlert("Error", json.message || "No se pudo actualizar.", true);
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

        // Evento cambio de Rol (Mostrar/Ocultar custom)
        fRol.addEventListener('change', () => {
            if (fRol.value === 'custom') {
                fRolCustom.classList.remove('hidden');
                fRolCustom.value = ''; 
                fRolCustom.focus();
            } else {
                fRolCustom.classList.add('hidden');
            }

            // Lógica Automática Socio -> Dueño
            if (fRol.value === 'Socio') {
                fContrato.value = 'Dueño';
            } else if (fContrato.value === 'Dueño') {
                fContrato.value = 'Indefinido';
            }
        });
    }
});