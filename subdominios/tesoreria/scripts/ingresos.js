document.addEventListener('DOMContentLoaded', () => {
    // Variables globales de estado
    let currentPage = 1;
    let totalPages = 1;

    // Referencias DOM
    const mostrarRegistros = document.getElementById('mostrar-registros');
    const buscarInput = document.getElementById('buscar');
    const tablaIngresos = document.querySelector('#ingresos table tbody');
    const nuevoIngresoBtn = document.getElementById('nuevo-ingreso');
    
    // Inputs Filtros
    const numeroInput = document.getElementById('numero');
    const fechaInput = document.getElementById('fecha');
    const tipoIngresoInput = document.getElementById('tipo-ingreso');
    const clienteInput = document.getElementById('cliente');
    const cajaInput = document.getElementById('caja');
    const cuentaInput = document.getElementById('cuenta');
    const divisaInput = document.getElementById('divisa');
    const estadoInput = document.getElementById('estado');

    // Referencias Paginación
    const paginationControls = document.getElementById('pagination-controls');
    const inicioRegSpan = document.getElementById('inicio-registro');
    const finRegSpan = document.getElementById('fin-registro');
    const totalRegSpan = document.getElementById('total-registros');

    if (nuevoIngresoBtn) {
        nuevoIngresoBtn.addEventListener('click', () => {
            window.location.href = 'https://tesoreria.cambiosorion.cl/nuevo-ing';
        });
    }

    function obtenerIngresos(page = 1) {
        currentPage = parseInt(page);
        const limit = mostrarRegistros.value;

        const params = new URLSearchParams();
        params.set('page', currentPage);
        params.set('mostrar', limit);
        params.set('buscar', buscarInput.value);
        
        // Filtros
        params.set('numero', numeroInput.value);
        params.set('fecha', fechaInput.value);
        params.set('tipo_ingreso', tipoIngresoInput.value);
        params.set('cliente', clienteInput.value);
        params.set('caja', cajaInput.value);
        params.set('cuenta', cuentaInput.value);
        params.set('divisa', divisaInput.value);
        params.set('estado', estadoInput.value);

        fetch(`https://cambiosorion.cl/data/ingresos.php?${params.toString()}`)
            .then(response => response.json())
            .then(response => {
                // La respuesta ahora es { data: [], total: X, page: Y, ... }
                if (response.error) {
                    console.error(response.error);
                    return;
                }
                mostrarResultados(response.data);
                actualizarContador(response.total, response.limit, response.page);
                renderPaginacion(response.totalPages, response.page);
            })
            .catch(error => console.error('Error:', error));
    }

    // --- FORMATO FECHA SOLICITADO (hh:mm dd/mm/yyyy) ---
    function formatDate(dateString) {
        if (!dateString) return '';
        // Reemplazo para compatibilidad Safari/Firefox con fechas SQL
        const date = new Date(dateString.replace(/-/g, "/")); 
        if (isNaN(date)) return dateString;

        const d = String(date.getDate()).padStart(2, '0');
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const y = date.getFullYear();
        const h = String(date.getHours()).padStart(2, '0');
        const min = String(date.getMinutes()).padStart(2, '0');
        
        return `${h}:${min} ${d}/${m}/${y}`;
    }

    function formatMonto(monto) {
        return '$' + Number(monto).toLocaleString('es-CL');
    }

    function mostrarResultados(lista) {
        tablaIngresos.innerHTML = '';
        
        if (!lista || lista.length === 0) {
            tablaIngresos.innerHTML = '<tr><td colspan="10" class="text-center text-gray-400 py-4">No se encontraron ingresos.</td></tr>';
            return;
        }

        lista.forEach(item => {
            const tr = document.createElement('tr');
            tr.classList.add('border-b', 'bg-white', 'border-gray-700', 'text-gray-700', 'hover:bg-gray-50');

            const btnMostrar = document.createElement('button');
            btnMostrar.textContent = 'Mostrar';
            btnMostrar.className = 'text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-sm px-3 py-1 focus:ring-2 focus:ring-blue-300';
            btnMostrar.addEventListener('click', () => window.location.href = `detalle-ing?id=${item.id}`);

            tr.innerHTML = `
                <td class="px-4 py-2 font-medium">${item.id}</td>
                <td class="px-4 py-2">${formatDate(item.fecha)}</td>
                <td class="px-4 py-2">${item.tipo_ingreso}</td>
                <td class="px-4 py-2 truncate max-w-xs" title="${item.cliente}">${item.cliente}</td>
                <td class="px-4 py-2">${item.caja}</td>
                <td class="px-4 py-2 truncate max-w-xs" title="${item.cuenta}">${item.cuenta ?? '—'}</td>
                <td class="px-4 py-2">${item.divisa}</td>
                <td class="px-4 py-2 font-bold text-gray-900">${formatMonto(item.monto)}</td>
                <td class="px-4 py-2">
                    <span class="px-2 py-1 rounded text-xs font-bold uppercase ${getEstadoClass(item.estado)}">
                        ${item.estado}
                    </span>
                </td>
                <td class="px-4 py-2 text-center mostrar-btn-cell"></td>
            `;

            tr.querySelector('.mostrar-btn-cell').appendChild(btnMostrar);
            tablaIngresos.appendChild(tr);
        });
    }

    function getEstadoClass(estado) {
        const e = (estado || '').toLowerCase();
        if (e === 'vigente') return 'bg-blue-100 text-blue-800';
        if (e === 'pagado' || e === 'cerrado') return 'bg-green-100 text-green-800';
        if (e === 'anulado') return 'bg-red-100 text-red-800';
        return 'bg-gray-100 text-gray-800';
    }

    // --- CONTADOR DE REGISTROS ---
    function actualizarContador(total, limit, page) {
        const start = (page - 1) * limit + 1;
        let end = page * limit;
        
        if (total === 0) {
            inicioRegSpan.textContent = 0;
            finRegSpan.textContent = 0;
        } else {
            if (end > total) end = total;
            inicioRegSpan.textContent = start;
            finRegSpan.textContent = end;
        }
        totalRegSpan.textContent = total;
    }

    // --- RENDERIZADO DE PAGINACIÓN ---
    function renderPaginacion(totalP, currentP) {
        paginationControls.innerHTML = '';
        
        if (totalP <= 1) return; // No mostrar si solo hay 1 página

        // Botón Anterior
        const liPrev = document.createElement('li');
        liPrev.innerHTML = `
            <button class="flex items-center justify-center px-3 py-2 ml-0 leading-tight text-gray-500 bg-white border border-gray-300 rounded-l-lg hover:bg-gray-100 hover:text-gray-700 ${currentP === 1 ? 'opacity-50 cursor-not-allowed' : ''}" 
            ${currentP === 1 ? 'disabled' : ''}>
                Anterior
            </button>`;
        liPrev.onclick = () => { if (currentP > 1) obtenerIngresos(currentP - 1); };
        paginationControls.appendChild(liPrev);

        // Lógica para mostrar rango de páginas (ej: 1 ... 4 5 6 ... 10)
        const maxButtons = 5;
        let startPage = Math.max(1, currentP - 2);
        let endPage = Math.min(totalP, startPage + maxButtons - 1);

        if (endPage - startPage < maxButtons - 1) {
            startPage = Math.max(1, endPage - maxButtons + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            const li = document.createElement('li');
            li.innerHTML = `
                <button class="flex items-center justify-center px-3 py-2 leading-tight border ${i === currentP ? 'text-blue-600 border-blue-300 bg-blue-50 hover:bg-blue-100 hover:text-blue-700' : 'text-gray-500 bg-white border-gray-300 hover:bg-gray-100 hover:text-gray-700'}">
                    ${i}
                </button>`;
            li.onclick = () => obtenerIngresos(i);
            paginationControls.appendChild(li);
        }

        // Botón Siguiente
        const liNext = document.createElement('li');
        liNext.innerHTML = `
            <button class="flex items-center justify-center px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 rounded-r-lg hover:bg-gray-100 hover:text-gray-700 ${currentP === totalP ? 'opacity-50 cursor-not-allowed' : ''}"
            ${currentP === totalP ? 'disabled' : ''}>
                Siguiente
            </button>`;
        liNext.onclick = () => { if (currentP < totalP) obtenerIngresos(currentP + 1); };
        paginationControls.appendChild(liNext);
    }

    // Listeners para filtros (reset a página 1 al filtrar)
    const inputs = [buscarInput, numeroInput, fechaInput, tipoIngresoInput, clienteInput, cajaInput, cuentaInput, divisaInput, estadoInput, mostrarRegistros];
    
    inputs.forEach(element => {
        element.addEventListener('input', () => obtenerIngresos(1));
        if(element.tagName === 'SELECT') element.addEventListener('change', () => obtenerIngresos(1));
    });

    // Carga inicial
    obtenerIngresos(1);
});