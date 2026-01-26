import { initAdminHeader } from './header.js';

document.addEventListener('DOMContentLoaded', async () => {

    // --- 1. CONFIGURACIÓN UI: MODAL ---
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
    const sessionData = await initAdminHeader('equipo');

    if (!sessionData.isAuthenticated) return;

    // --- 3. SEGURIDAD ---
    const role = (sessionData.rol || '').toLowerCase().trim();
    const allowedRoles = ['socio', 'admin', 'gerente', 'rrhh'];
    
    if (!allowedRoles.includes(role)) {
        showAlert("Acceso Denegado", "No tienes permisos para gestionar integrantes.", true, () => {
            window.location.href = 'equipo';
        });
        return;
    }

    // --- 4. REFERENCIAS DOM ---
    const pageTitle = document.getElementById('page-title-crumb');
    const profileName = document.getElementById('profile-name');
    
    // Inputs del formulario
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
    
    // Inputs Bancarios
    const fBanco = document.getElementById('f-banco');
    const fTipoCuenta = document.getElementById('f-tipo-cuenta');
    const fNumeroCuenta = document.getElementById('f-numero-cuenta');
    
    const btnSave = document.getElementById('btn-save');

    // --- 5. LÓGICA DE MODO (CREAR vs EDITAR) ---
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('id');
    const isCreateMode = (userId === 'new');

    if (isCreateMode) {
        setupCreateMode();
    } else if (userId) {
        loadUserDetails(userId);
    } else {
        showAlert("Error", "No se especificó un ID válido.", true, () => {
            window.location.href = 'equipo';
        });
    }

    setupEventListeners();


    // --- FUNCIONES ---

    function setupCreateMode() {
        if(profileName) profileName.textContent = "Nuevo Integrante";
        if(pageTitle) pageTitle.textContent = "Agregando Integrante";
        if(btnSave) btnSave.textContent = "Crear Integrante";
        
        if(fNombre) fNombre.value = "";
        if(fRut) fRut.value = "";
        if(fRol) fRol.value = "Staff"; 
        if(fContrato) fContrato.value = "Indefinido";
    }

    async function loadUserDetails(id) {
        try {
            // CORRECCIÓN: Agregamos credentials: 'include'
            const res = await fetch(`https://cambiosorion.cl/data/detalle-int.php?id=${id}`, {
                credentials: 'include' 
            });
            const json = await res.json();

            if (json.success && json.data) {
                const u = json.data;
                
                // Llenar campos
                if(fId) fId.value = u.id;
                if(fNombre) fNombre.value = u.nombre;
                if(fRut) fRut.value = u.rut;
                if(fNacimiento) fNacimiento.value = u.fecha_nacimiento;
                if(fCivil) fCivil.value = u.estado_civil;
                if(fDireccion) fDireccion.value = u.direccion;
                if(fEmail) fEmail.value = u.email;
                if(fTelefono) fTelefono.value = u.telefono;
                if(fIngreso) fIngreso.value = u.fecha_ingreso;
                if(fSueldo) fSueldo.value = u.sueldo_liquido;
                if(fContrato) fContrato.value = u.tipo_contrato;

                if(fBanco && u.banco) fBanco.value = u.banco;
                if(fTipoCuenta && u.tipo_cuenta) fTipoCuenta.value = u.tipo_cuenta;
                if(fNumeroCuenta && u.numero_cuenta) fNumeroCuenta.value = u.numero_cuenta;

                if(profileName) profileName.textContent = u.nombre;
                if(pageTitle) pageTitle.textContent = "Editando Integrante";

                // Roles
                const standardRoles = ['Socio', 'Gerente', 'Admin', 'RRHH', 'Cajero', 'Contador', 'Staff'];
                if (fRol) {
                    if (standardRoles.includes(u.rol)) {
                        fRol.value = u.rol;
                        if(fRolCustom) fRolCustom.classList.add('hidden');
                    } else {
                        fRol.value = 'custom';
                        if(fRolCustom) {
                            fRolCustom.classList.remove('hidden');
                            fRolCustom.value = u.rol;
                        }
                    }
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
        if (!fNombre?.value || !fRut?.value || !fEmail?.value) {
            showAlert("Datos Faltantes", "Nombre, RUT y Email son obligatorios.", true);
            return;
        }

        let finalRol = fRol.value;
        if (finalRol === 'custom') {
            finalRol = fRolCustom.value.trim();
            if (!finalRol) {
                showAlert("Rol Faltante", "Especifique el cargo personalizado.", true);
                return;
            }
        }

        btnSave.disabled = true;
        btnSave.textContent = isCreateMode ? "Creando..." : "Guardando...";

        try {
            let url, payload;

            if (isCreateMode) {
                url = "https://cambiosorion.cl/data/nuevo-int.php";
                payload = {
                    nombre: fNombre.value,
                    rut: fRut.value,
                    // AQUÍ ESTÁ EL CAMBIO: Usar nombres con guion bajo
                    estado_civil: fCivil?.value || '',      // Antes: estadoCivil
                    fecha_nacimiento: fNacimiento?.value || '', // Antes: fechaNacimiento
                    direccion: fDireccion?.value || '',
                    telefono: fTelefono?.value || '',
                    email: fEmail.value,
                    fecha_ingreso: fIngreso?.value || '',   // Antes: fechaIngreso
                    rol: finalRol,
                    tipo_contrato: fContrato?.value || '',  // Antes: tipoContrato
                    sueldo_liquido: fSueldo?.value || 0,    // Antes: sueldoLiquido
                    banco: fBanco?.value || '',
                    tipo_cuenta: fTipoCuenta?.value || '',  // Antes: tipoCuenta
                    numero_cuenta: fNumeroCuenta?.value || '' // Antes: numeroCuenta
                };
            } else {
                url = "https://cambiosorion.cl/data/detalle-int.php";
                payload = {
                    id: fId.value,
                    nombre: fNombre.value,
                    rut: fRut.value,
                    fecha_nacimiento: fNacimiento?.value,
                    estado_civil: fCivil?.value,
                    direccion: fDireccion?.value,
                    email: fEmail.value,
                    telefono: fTelefono?.value,
                    rol: finalRol,
                    tipo_contrato: fContrato?.value,
                    fecha_ingreso: fIngreso?.value,
                    sueldo_liquido: fSueldo?.value,
                    banco: fBanco?.value,
                    tipo_cuenta: fTipoCuenta?.value,
                    numero_cuenta: fNumeroCuenta?.value
                };
            }

            // CORRECCIÓN: Agregamos credentials: 'include'
            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
                credentials: 'include' 
            });
            
            const json = await res.json();

            if (json.success) {
                const msg = isCreateMode ? "Integrante creado correctamente." : "Perfil actualizado correctamente.";
                showAlert("¡Éxito!", msg, false, () => {
                    if (isCreateMode) window.location.href = 'equipo';
                    else location.reload();
                });
            } else {
                showAlert("Error", json.message || json.error || "No se pudo guardar.", true);
            }
        } catch (e) {
            console.error(e);
            showAlert("Error de Conexión", "No se pudo contactar al servidor.", true);
        } finally {
            btnSave.disabled = false;
            btnSave.textContent = isCreateMode ? "Crear Integrante" : "Guardar Cambios";
        }
    }

    function setupEventListeners() {
        if(btnSave) {
            btnSave.addEventListener('click', (e) => {
                e.preventDefault();
                saveProfile();
            });
        }

        if(fRol) {
            fRol.addEventListener('change', () => {
                if (fRol.value === 'custom') {
                    if(fRolCustom) {
                        fRolCustom.classList.remove('hidden');
                        fRolCustom.value = ''; 
                        fRolCustom.focus();
                    }
                } else {
                    if(fRolCustom) fRolCustom.classList.add('hidden');
                }

                if (fRol.value === 'Socio') {
                    if(fContrato) fContrato.value = 'Dueño';
                } else if (fContrato && fContrato.value === 'Dueño') {
                    fContrato.value = 'Indefinido';
                }
            });
        }
    }
});