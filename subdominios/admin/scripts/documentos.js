import { initAdminHeader } from './header.js';

document.addEventListener('DOMContentLoaded', async() => {
    // --- REFERENCIAS DOM LOCALES ---
    // Upload Refs
    const uploadSection = document.getElementById('upload-section');
    const uploadToggleBtn = document.getElementById('btn-upload-toggle');
    const uploadForm = document.getElementById('upload-form');
    const fileInput = document.getElementById('file-input');
    const dropZone = document.getElementById('drop-zone');
    const fileNameDisplay = document.getElementById('file-name');
    
    // Table Refs
    const adminControls = document.getElementById('admin-controls');
    const employeeSelect = document.getElementById('employee-select');
    const tableBody = document.getElementById('documents-table-body');
    const tableTitle = document.getElementById('table-title');
    const docCount = document.getElementById('doc-count');

    // --- 1. INICIALIZACIÓN GLOBAL ---
    const sessionData = await initAdminHeader('documentos');

    if (!sessionData.isAuthenticated) return;

    // --- 2. CONFIGURACIÓN LOCAL ---
    let currentUserId = sessionData.equipo_id;
    let currentUserRole = (sessionData.rol || '').toLowerCase().trim();
    let selectedUserId = 'me'; 

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
    setupUploadLogic();
    fetchDocuments(); // Carga inicial

    // --- ADMIN FEATURES ---
    function loadEmployeesList() {
        // Mock Data - Reemplazar con fetch real
        const mockEmployees = [
            { id: 101, name: "Juan Pérez" },
            { id: 102, name: "Maria Soto" },
            { id: 103, name: "Carlos Diaz" }
        ];

        mockEmployees.forEach(emp => {
            const opt = new Option(emp.name, emp.id);
            employeeSelect.appendChild(opt);
        });

        employeeSelect.addEventListener('change', (e) => {
            selectedUserId = e.target.value;
            tableTitle.textContent = selectedUserId === 'me' ? "Mis Documentos" : `Documentos de ${e.target.options[e.target.selectedIndex].text}`;
            fetchDocuments();
        });
    }

    // --- DATA FETCHING ---
    function fetchDocuments() {
        // Simulando delay de red
        tableBody.innerHTML = `<tr><td colspan="5" class="text-center py-8"><div class="animate-spin h-8 w-8 border-4 border-indigo-500 rounded-full border-t-transparent mx-auto"></div></td></tr>`;

        setTimeout(() => {
            // Mock Data
            const allDocs = [
                { id: 1, user_id: 'me', name: "Contrato Laboral.pdf", type: "Contrato", date: "2024-01-15", status: "Vigente", url: "#" },
                { id: 2, user_id: 'me', name: "Anexo Noviembre.pdf", type: "Anexo", date: "2024-11-01", status: "Vigente", url: "#" },
                { id: 3, user_id: 101, name: "Cédula Identidad.jpg", type: "Cédula", date: "2023-05-20", status: "Vigente", url: "#" },
                { id: 4, user_id: 102, name: "Antecedentes.pdf", type: "Antecedentes", date: "2024-02-10", status: "Vencido", url: "#" }
            ];

            // Filter logic
            const docs = allDocs.filter(d => 
                selectedUserId === 'me' ? (d.user_id === 'me' || d.user_id === currentUserId) 
                : d.user_id == selectedUserId
            );

            renderTable(docs);
        }, 600);
    }

    function renderTable(docs) {
        docCount.textContent = `${docs.length} archivos`;
        tableBody.innerHTML = '';

        if (docs.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="5" class="text-center py-8 text-slate-400">No hay documentos en esta carpeta.</td></tr>`;
            return;
        }

        docs.forEach(doc => {
            const statusClass = doc.status === 'Vigente' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800';

            const row = document.createElement('tr');
            row.className = "bg-white border-b hover:bg-slate-50 transition";
            row.innerHTML = `
                <td class="px-6 py-4 font-medium text-slate-900 flex items-center">
                    <svg class="w-5 h-5 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                    ${doc.name}
                </td>
                <td class="px-6 py-4">${doc.type}</td>
                <td class="px-6 py-4 text-slate-500">${doc.date}</td>
                <td class="px-6 py-4 text-center">
                    <span class="px-2.5 py-0.5 rounded-full text-xs font-bold ${statusClass}">${doc.status}</span>
                </td>
                <td class="px-6 py-4 text-right">
                    <a href="${doc.url}" class="text-indigo-600 hover:text-indigo-900 font-medium hover:underline">Ver</a>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    // --- UPLOAD LOGIC ---
    function setupUploadLogic() {
        // Toggle Panel
        uploadToggleBtn.addEventListener('click', () => {
            uploadSection.classList.toggle('hidden');
        });

        // Click on zone triggers input
        dropZone.addEventListener('click', () => fileInput.click());

        // File Selection
        fileInput.addEventListener('change', (e) => handleFiles(e.target.files));

        // Drag & Drop
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        });
        dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            handleFiles(e.dataTransfer.files);
        });

        // Form Submit
        uploadForm.addEventListener('submit', (e) => {
            e.preventDefault();
            // Aquí iría la lógica fetch POST
            document.getElementById('modal-success').classList.remove('hidden');
            uploadSection.classList.add('hidden');
            uploadForm.reset();
            fileNameDisplay.classList.add('hidden');
        });
    }

    function handleFiles(files) {
        if (files.length > 0) {
            fileNameDisplay.textContent = `Archivo seleccionado: ${files[0].name}`;
            fileNameDisplay.classList.remove('hidden');
        }
    }
});