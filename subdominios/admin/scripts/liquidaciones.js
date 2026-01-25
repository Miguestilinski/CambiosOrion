import { initAdminHeader } from './header.js';

document.addEventListener('DOMContentLoaded', async() => {
    // --- REFERENCIAS UI LOCALES ---
    const tableBody = document.getElementById('liquidaciones-table-body');
    const filterMonth = document.getElementById('filter-month');
    const filterYear = document.getElementById('filter-year');
    const colMain = document.getElementById('col-main');

    // Referencias del Modal
    const modal = document.getElementById('modal-upload');
    const btnClose = document.getElementById('close-modal');
    const btnCancel = document.getElementById('cancel-upload');
    const btnConfirm = document.getElementById('confirm-upload');
    const fileInput = document.getElementById('dropzone-file');
    const fileNameDisplay = document.getElementById('file-name-display');
    const uploadEmpName = document.getElementById('upload-emp-name');
    const uploadPeriodText = document.getElementById('upload-period-text');

    // --- 1. INICIALIZACIÓN GLOBAL ---
    // Carga sesión, sidebar, header y marca 'liquidaciones' como activo
    const sessionData = await initAdminHeader('liquidaciones');
    
    if (!sessionData.isAuthenticated) return;

    // --- 2. CONFIGURACIÓN LOCAL ---
    let currentUserId = sessionData.equipo_id;
    let selectedEmpId = null; 

    // Determinar si es Admin para la lógica de la tabla (subir archivos vs descargar)
    const role = (sessionData.rol || '').toLowerCase().trim();
    const isAdmin = ['socio', 'admin', 'gerente', 'rrhh'].includes(role);

    // Ajuste UI específico de esta página
    if (colMain) colMain.textContent = isAdmin ? "Colaborador" : "Periodo / Mes";

    // --- 3. INICIAR LÓGICA DE NEGOCIO ---
    initSelectors();
    fetchLiquidaciones();

    // --- FUNCIONES ---

    function initSelectors() {
        const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        filterMonth.innerHTML = '';
        months.forEach((m, i) => {
            const opt = new Option(m, i + 1);
            if (i === new Date().getMonth()) opt.selected = true;
            filterMonth.appendChild(opt);
        });

        const y = new Date().getFullYear();
        filterYear.innerHTML = '';
        for (let i = y; i >= 2024; i--) filterYear.appendChild(new Option(i, i));

        filterMonth.addEventListener('change', fetchLiquidaciones);
        filterYear.addEventListener('change', fetchLiquidaciones);
    }

    async function fetchLiquidaciones() {
        if (!currentUserId) return;
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center py-8">Cargando datos...</td></tr>';

        const m = filterMonth.value;
        const y = filterYear.value;

        try {
            const res = await fetch(`https://cambiosorion.cl/data/liquidaciones.php?current_user_id=${currentUserId}&month=${m}&year=${y}`);
            const json = await res.json();

            if (!json.success) {
                tableBody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-red-500">${json.message}</td></tr>`;
                return;
            }

            renderTable(json.data, json.role);

        } catch (error) {
            console.error(error);
            tableBody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-red-500">Error de conexión</td></tr>';
        }
    }

    function renderTable(data, role) {
        tableBody.innerHTML = '';
        
        if (data.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" class="text-center py-8 text-slate-400">No hay registros disponibles.</td></tr>';
            return;
        }

        data.forEach(row => {
            const tr = document.createElement('tr');
            tr.className = "bg-white border-b hover:bg-slate-50 transition";
            
            // CONFIGURACIÓN DE FILAS SEGÚN ROL
            let col1, colStatus, colAction;

            if (role === 'admin') {
                // VISTA ADMIN: Lista de empleados para subir archivos
                col1 = `<div>
                            <div class="font-bold text-slate-800">${row.nombre}</div>
                            <div class="text-xs text-slate-400">${row.rut}</div>
                        </div>`;
                
                // Estado visual
                if (row.tiene_archivo) {
                    colStatus = `<span class="px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200">Cargado</span>`;
                    colAction = `<div class="flex items-center justify-end gap-3">
                                    <a href="${row.url}" target="_blank" class="text-indigo-600 hover:underline text-xs font-bold">Ver PDF</a>
                                    <button onclick="window.openUploadModal(${row.id}, '${row.nombre}')" class="text-slate-400 hover:text-slate-600" title="Reemplazar Archivo">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                                    </button>
                                 </div>`;
                } else {
                    colStatus = `<span class="px-2 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200">Pendiente</span>`;
                    colAction = `<button onclick="window.openUploadModal(${row.id}, '${row.nombre}')" class="flex items-center ml-auto px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded hover:bg-indigo-700 transition">
                                    <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                                    Subir PDF
                                 </button>`;
                }
            } else {
                // VISTA EMPLEADO: Historial
                col1 = `<div class="font-bold text-slate-800">${row.mes_nombre}</div>`;
                colStatus = `<span class="px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">Disponible</span>`;
                colAction = `<a href="${row.url}" target="_blank" class="text-indigo-600 hover:underline text-xs font-bold flex items-center justify-end">
                                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                                Descargar
                             </a>`;
            }

            tr.innerHTML = `
                <td class="px-6 py-4">${col1}</td>
                <td class="px-6 py-4 text-xs text-slate-500">${row.fecha_carga || '-'}</td>
                <td class="px-6 py-4 font-mono text-xs text-slate-600">$ ${row.monto || '0'}</td>
                <td class="px-6 py-4 text-center">${colStatus}</td>
                <td class="px-6 py-4 text-right">${colAction}</td>
            `;
            tableBody.appendChild(tr);
        });
    }

    // --- MODAL UPLOAD ---
    window.openUploadModal = (empId, empName) => {
        selectedEmpId = empId;
        uploadEmpName.textContent = empName;
        uploadPeriodText.textContent = `${filterMonth.options[filterMonth.selectedIndex].text} ${filterYear.value}`;
        
        fileInput.value = '';
        fileNameDisplay.textContent = '';
        btnConfirm.disabled = true;
        
        modal.classList.remove('hidden');
    };

    fileInput.addEventListener('change', () => {
        if(fileInput.files.length > 0) {
            fileNameDisplay.textContent = fileInput.files[0].name;
            btnConfirm.disabled = false;
        } else {
            fileNameDisplay.textContent = '';
            btnConfirm.disabled = true;
        }
    });

    const closeModal = () => modal.classList.add('hidden');
    btnClose.addEventListener('click', closeModal);
    btnCancel.addEventListener('click', closeModal);

    btnConfirm.addEventListener('click', async () => {
        if(!fileInput.files[0] || !selectedEmpId) return;

        const formData = new FormData();
        formData.append('pdf_file', fileInput.files[0]);
        formData.append('current_user_id', currentUserId);
        formData.append('integrante_id', selectedEmpId);
        formData.append('periodo', `${filterYear.value}-${filterMonth.value.toString().padStart(2, '0')}`);

        btnConfirm.textContent = 'Subiendo...';
        btnConfirm.disabled = true;

        try {
            const res = await fetch("https://cambiosorion.cl/data/liquidaciones.php", {
                method: "POST",
                body: formData
            });
            const json = await res.json();

            if (json.success) {
                closeModal();
                fetchLiquidaciones(); // Refrescar tabla
            } else {
                alert("Error: " + json.message);
            }
        } catch (e) {
            console.error(e);
            alert("Error de conexión");
        } finally {
            btnConfirm.textContent = 'Subir Archivo';
            btnConfirm.disabled = false;
        }
    });
});