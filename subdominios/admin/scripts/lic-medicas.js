import { initAdminHeader } from './header.js';

document.addEventListener('DOMContentLoaded', async() => {
    // --- REFERENCIAS DOM LOCALES ---
    // Upload Refs
    const uploadSection = document.getElementById('upload-section');
    const newLicenseBtn = document.getElementById('btn-new-license');
    const licenseForm = document.getElementById('license-form');
    const fileInput = document.getElementById('file-input');
    const dropZone = document.getElementById('drop-zone');
    const fileNameDisplay = document.getElementById('file-name');
    
    // Admin Refs
    const adminControls = document.getElementById('admin-controls');
    const employeeSelect = document.getElementById('employee-select');
    const tableBody = document.getElementById('licenses-table-body');

    // --- 1. INICIALIZACIÓN GLOBAL ---
    // Carga sesión, sidebar (marcando 'licencias-medicas'), header y lógica de usuario
    const sessionData = await initAdminHeader('licencias-medicas');

    if (!sessionData.isAuthenticated) return;

    // --- 2. CONFIGURACIÓN LOCAL ---
    let currentUserId = sessionData.equipo_id || 99; // Mock ID fallback si no hay real
    let currentUserRole = (sessionData.rol || '').toLowerCase().trim();
    let filterUserId = 'all';

    // Mock Data (Se mantiene igual)
    const mockLicenses = [
        { id: 1, folio: "12345678", user_id: 99, user_name: "Yo Mismo", start: "2025-05-10", days: 3, status: "tramite", url: "#" },
        { id: 2, folio: "87654321", user_id: 101, user_name: "Juan Pérez", start: "2025-04-20", days: 15, status: "aprobada", url: "#" },
        { id: 3, folio: "99887766", user_id: 102, user_name: "Maria Soto", start: "2025-06-01", days: 7, status: "rechazada", url: "#" },
        { id: 4, folio: "11223344", user_id: 99, user_name: "Yo Mismo", start: "2025-01-15", days: 2, status: "aprobada", url: "#" }
    ];

    // Lógica de Roles (Admin ve selector de empleados)
    const superUsers = ['socio', 'admin', 'gerente', 'rrhh']; 
    const isSuperUser = superUsers.includes(currentUserRole);

    if (isSuperUser) {
        if(adminControls) adminControls.classList.remove('hidden');
        loadEmployeesList();
    } else {
        if(adminControls) adminControls.remove();
    }

    // --- 3. INICIAR LÓGICA DE PÁGINA ---
    setupFormLogic();
    renderTable();

    // --- DATA HANDLING ---
    function renderTable() {
        tableBody.innerHTML = '';
        
        let dataToRender = mockLicenses;

        // Si NO es superusuario, filtrar solo las mías
        const superUsers = ['socio', 'admin', 'gerente']; 
        if (!superUsers.includes(currentUserRole)) {
            dataToRender = mockLicenses.filter(l => l.user_id === currentUserId);
        } else {
            // Si ES superusuario, aplicar filtro del select
            if (filterUserId !== 'all') {
                dataToRender = mockLicenses.filter(l => l.user_id == filterUserId);
            }
        }

        if (dataToRender.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="6" class="text-center py-8 text-slate-400">No hay licencias registradas.</td></tr>`;
            return;
        }

        dataToRender.forEach(lic => {
            const row = document.createElement('tr');
            row.className = "bg-white border-b hover:bg-slate-50 transition";
            row.innerHTML = `
                <td class="px-6 py-4 font-bold text-slate-900">${lic.folio}</td>
                <td class="px-6 py-4 font-medium">${lic.user_name}</td>
                <td class="px-6 py-4 text-slate-500">${formatDate(lic.start)}</td>
                <td class="px-6 py-4">${lic.days} días</td>
                <td class="px-6 py-4 text-center">${getStatusBadge(lic.status)}</td>
                <td class="px-6 py-4 text-right">
                    <a href="${lic.url}" class="text-indigo-600 hover:text-indigo-900 font-medium hover:underline">Ver</a>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    function loadEmployeesList() {
        const uniqueUsers = [...new Map(mockLicenses.map(item => [item.user_id, item.user_name])).entries()];
        uniqueUsers.forEach(([id, name]) => {
            const opt = new Option(name, id);
            employeeSelect.appendChild(opt);
        });

        employeeSelect.addEventListener('change', (e) => {
            filterUserId = e.target.value;
            renderTable();
        });
    }

    // --- FORM LOGIC ---
    function setupFormLogic() {
        newLicenseBtn.addEventListener('click', () => {
            uploadSection.classList.toggle('hidden');
        });

        dropZone.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => {
            if(e.target.files.length > 0) {
                fileNameDisplay.textContent = e.target.files[0].name;
                fileNameDisplay.classList.remove('hidden');
            }
        });

        dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
        dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            if(e.dataTransfer.files.length > 0) {
                fileInput.files = e.dataTransfer.files;
                fileNameDisplay.textContent = e.dataTransfer.files[0].name;
                fileNameDisplay.classList.remove('hidden');
            }
        });

        licenseForm.addEventListener('submit', (e) => {
            e.preventDefault();
            document.getElementById('modal-success').classList.remove('hidden');
            uploadSection.classList.add('hidden');
        });
    }

    // --- UTILS ---
    function formatDate(dateStr) {
        return new Date(dateStr).toLocaleDateString('es-CL');
    }

    function getStatusBadge(status) {
        const badges = {
            tramite: '<span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">En Trámite</span>',
            aprobada: '<span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200">Aprobada</span>',
            rechazada: '<span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">Rechazada</span>'
        };
        return badges[status] || status;
    }
});