document.addEventListener('DOMContentLoaded', () => {
    // DOM Refs
    const headerBadge = document.getElementById('header-badge');
    const headerName = document.getElementById('header-user-name');
    const headerEmail = document.getElementById('dropdown-user-email');
    const sidebarContainer = document.getElementById('sidebar-container');
    
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

    // State
    let currentUserId = null;
    let currentUserRole = null;
    let filterUserId = 'all';

    // Mock Data
    const mockLicenses = [
        { id: 1, folio: "12345678", user_id: 99, user_name: "Yo Mismo", start: "2025-05-10", days: 3, status: "tramite", url: "#" },
        { id: 2, folio: "87654321", user_id: 101, user_name: "Juan Pérez", start: "2025-04-20", days: 15, status: "aprobada", url: "#" },
        { id: 3, folio: "99887766", user_id: 102, user_name: "Maria Soto", start: "2025-06-01", days: 7, status: "rechazada", url: "#" },
        { id: 4, folio: "11223344", user_id: 99, user_name: "Yo Mismo", start: "2025-01-15", days: 2, status: "aprobada", url: "#" }
    ];

    // --- INIT ---
    getSession();
    setupFormLogic();

    // --- SESSION ---
    async function getSession() {
        try {
            const res = await fetch("https://cambiosorion.cl/data/session_status.php", { credentials: "include" });
            if (!res.ok) throw new Error("Error sesión");
            const data = await res.json();
            
            if (!data.isAuthenticated) {
                window.location.href = 'https://admin.cambiosorion.cl/login';
                return;
            }

            currentUserId = data.equipo_id || 99; // Mock ID fallback
            currentUserRole = (data.rol || '').toLowerCase().trim();
            
            if(headerName) headerName.textContent = (data.nombre || 'Usuario').split(' ')[0];
            if(headerEmail) headerEmail.textContent = data.correo;

            configureViewByRole(currentUserRole);
            renderTable();

        } catch (error) {
            console.error(error);
        }
    }

    // --- VIEW CONFIG ---
    function configureViewByRole(rol) {
        const superUsers = ['socio', 'admin', 'gerente']; 
        const isSuperUser = superUsers.includes(rol);

        fetch('sidebar.html')
            .then(res => res.text())
            .then(html => {
                if(sidebarContainer) {
                    sidebarContainer.innerHTML = html;
                    const adminItems = sidebarContainer.querySelectorAll('.admin-only');
                    if (isSuperUser) adminItems.forEach(item => item.classList.remove('hidden'));
                    else adminItems.forEach(item => item.remove());
                    
                    const active = sidebarContainer.querySelector('a[href="licencias-medicas"]');
                    if(active) active.classList.add('bg-indigo-50', 'text-indigo-700', 'font-bold');
                }
            });

        if(isSuperUser) {
            if(headerBadge) {
                headerBadge.textContent = "PORTAL SOCIOS";
                headerBadge.className = "hidden md:inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 tracking-wider uppercase";
            }
            adminControls.classList.remove('hidden');
            loadEmployeesList();
        } else {
            if(headerBadge) {
                headerBadge.textContent = "PORTAL COLABORADOR";
                headerBadge.className = "hidden md:inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 tracking-wider uppercase";
            }
            adminControls.remove();
        }
    }

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