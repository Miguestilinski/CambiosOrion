document.addEventListener('DOMContentLoaded', () => {
    let currentPage = 1;

    // Referencias inputs
    const inputsFiltro = {
        numero: document.getElementById('numero'),
        fecha: document.getElementById('fecha'),
        tipo: document.getElementById('tipo-ingreso'),
        cliente: document.getElementById('cliente'),
        caja: document.getElementById('caja'),
        cuenta: document.getElementById('cuenta'),
        divisa: document.getElementById('divisa'),
        estado: document.getElementById('estado'),
        buscar: document.getElementById('buscar'),
        mostrar: document.getElementById('mostrar-registros')
    };

    const btnBorrarFiltros = document.getElementById('borrar-filtros');
    const btnNuevoIngreso = document.getElementById('nuevo-ingreso');

    // 1. Cargar Opciones para Datalists (Dropdowns Buscables)
    function cargarOpcionesFiltros() {
        fetch('https://cambiosorion.cl/data/ingresos.php?get_options=1')
            .then(res => res.json())
            .then(data => {
                if(data.error) return console.error(data.error);
                
                // Llenar las listas usando el helper
                llenarDatalist('list-clientes', data.clientes, 'razon_social');
                llenarDatalist('list-cuentas', data.cuentas, 'nombre');
                llenarDatalist('list-divisas', data.divisas, 'nombre');
            })
            .catch(err => console.error("Error cargando opciones de filtro:", err));
    }

    function llenarDatalist(idList, items, campoTexto) {
        const datalist = document.getElementById(idList);
        if(!datalist || !items) return;
        
        // Creamos las opciones del dropdown
        datalist.innerHTML = items.map(item => 
            `<option value="${item[campoTexto]}">`
        ).join('');
    }

    // 2. Función Principal de Obtención
    function obtenerIngresos(page = 1) {
        currentPage = page;
        const params = new URLSearchParams();
        params.set('page', page);
        
        // Mapeo exacto de IDs HTML a parámetros PHP
        params.set('mostrar', inputsFiltro.mostrar ? inputsFiltro.mostrar.value : 25);
        params.set('buscar', inputsFiltro.buscar ? inputsFiltro.buscar.value : '');
        params.set('numero', inputsFiltro.numero ? inputsFiltro.numero.value : '');
        params.set('fecha', inputsFiltro.fecha ? inputsFiltro.fecha.value : '');
        params.set('tipo_ingreso', inputsFiltro.tipo ? inputsFiltro.tipo.value : '');
        params.set('cliente', inputsFiltro.cliente ? inputsFiltro.cliente.value : '');
        params.set('caja', inputsFiltro.caja ? inputsFiltro.caja.value : '');
        params.set('cuenta', inputsFiltro.cuenta ? inputsFiltro.cuenta.value : '');
        params.set('divisa', inputsFiltro.divisa ? inputsFiltro.divisa.value : '');
        params.set('estado', inputsFiltro.estado ? inputsFiltro.estado.value : '');

        fetch(`https://cambiosorion.cl/data/ingresos.php?${params.toString()}`)
            .then(async res => {
                const text = await res.text();
                try {
                    return JSON.parse(text);
                } catch (e) {
                    console.error("Error de respuesta:", text);
                    throw new Error("Respuesta no válida del servidor");
                }
            })
            .then(res => {
                if (res.error) {
                    console.error("Error PHP:", res.error);
                    const tbody = document.querySelector('#ingresos table tbody');
                    tbody.innerHTML = `<tr><td colspan="10" class="text-center text-red-400 py-4">Error: ${res.error}</td></tr>`;
                    return;
                }
                mostrarResultados(res.data);
                actualizarContador(res.total, res.limit, res.page);
                renderPaginacion(res.totalPages, res.page);
            })
            .catch(err => console.error('Error Fetch:', err));
    }

    // 3. Renderizado Tabla
    function mostrarResultados(lista) {
        const tbody = document.querySelector('#ingresos table tbody');
        tbody.innerHTML = '';
        
        if (!lista || lista.length === 0) {
            tbody.innerHTML = '<tr><td colspan="10" class="text-center text-gray-400 py-4">No se encontraron registros.</td></tr>';
            return;
        }

        lista.forEach(item => {
            const tr = document.createElement('tr');
            tr.className = 'border-b bg-white border-gray-700 text-gray-700 hover:bg-gray-50';
            
            const fechaFmt = formatDate(item.fecha);
            const montoFmt = '$' + Number(item.monto).toLocaleString('es-CL');
            const estadoClass = getEstadoClass(item.estado);

            // AQUÍ ESTÁ EL FIX DEL UNDEFINED: Usamos || ''
            const cuentaTexto = item.cuenta || ''; 

            tr.innerHTML = `
                <td class="px-4 py-2 font-medium">${item.id}</td>
                <td class="px-4 py-2">${fechaFmt}</td>
                <td class="px-4 py-2">${item.tipo_ingreso}</td>
                <td class="px-4 py-2 truncate max-w-[150px]" title="${item.cliente}">${item.cliente || '—'}</td>
                <td class="px-4 py-2">${item.caja || '—'}</td>
                <td class="px-4 py-2 truncate max-w-[150px]" title="${cuentaTexto}">${cuentaTexto}</td>
                <td class="px-4 py-2">${item.divisa || '—'}</td>
                <td class="px-4 py-2 font-bold text-gray-900">${montoFmt}</td>
                <td class="px-4 py-2"><span class="px-2 py-1 rounded text-xs font-bold uppercase ${estadoClass}">${item.estado}</span></td>
                <td class="px-4 py-2 text-center">
                    <button onclick="window.location.href='detalle-ing?id=${item.id}'" class="text-white bg-blue-700 hover:bg-blue-800 rounded-lg text-sm px-3 py-1">Mostrar</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    // Helpers
    function formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString.replace(/-/g, "/")); 
        if (isNaN(date)) return dateString;
        const d = String(date.getDate()).padStart(2, '0');
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const y = date.getFullYear();
        const h = String(date.getHours()).padStart(2, '0');
        const min = String(date.getMinutes()).padStart(2, '0');
        return `${h}:${min} ${d}/${m}/${y}`;
    }

    function getEstadoClass(est) {
        const e = (est || '').toLowerCase();
        if(e === 'vigente') return 'bg-blue-100 text-blue-800';
        if(e === 'pagado' || e === 'cerrado') return 'bg-green-100 text-green-800';
        if(e === 'anulado') return 'bg-red-100 text-red-800';
        return 'bg-gray-100 text-gray-800';
    }

    // Paginación y Contador
    function actualizarContador(total, limit, page) {
        const start = total === 0 ? 0 : (page - 1) * limit + 1;
        const end = Math.min(page * limit, total);
        document.getElementById('inicio-registro').textContent = start;
        document.getElementById('fin-registro').textContent = end;
        document.getElementById('total-registros').textContent = total;
    }

    function renderPaginacion(totalP, currentP) {
        const container = document.getElementById('pagination-controls');
        container.innerHTML = '';
        if (totalP <= 1) return;

        const createBtn = (text, page, disabled, active) => {
            const li = document.createElement('li');
            const cls = active 
                ? 'text-blue-600 bg-blue-50 border-blue-300 hover:bg-blue-100' 
                : 'text-gray-500 bg-white border-gray-300 hover:bg-gray-100';
            
            li.innerHTML = `<button class="px-3 py-2 leading-tight border ${cls} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}" ${disabled ? 'disabled' : ''}>${text}</button>`;
            if(!disabled) li.onclick = () => obtenerIngresos(page);
            return li;
        };

        container.appendChild(createBtn('Anterior', currentP - 1, currentP === 1, false));
        
        let start = Math.max(1, currentP - 2);
        let end = Math.min(totalP, start + 4);
        if(end - start < 4) start = Math.max(1, end - 4);

        for(let i = start; i <= end; i++) {
            container.appendChild(createBtn(i, i, false, i === currentP));
        }

        container.appendChild(createBtn('Siguiente', currentP + 1, currentP === totalP, false));
    }

    // Listeners
    Object.values(inputsFiltro).forEach(el => {
        if(el) el.addEventListener('input', () => obtenerIngresos(1));
    });

    if(btnBorrarFiltros) {
        btnBorrarFiltros.addEventListener('click', () => {
            Object.values(inputsFiltro).forEach(el => {
                if(el.id !== 'mostrar-registros') el.value = ''; 
            });
            obtenerIngresos(1);
        });
    }

    if(btnNuevoIngreso) btnNuevoIngreso.addEventListener('click', () => window.location.href = 'https://tesoreria.cambiosorion.cl/nuevo-ing');

    // Inicialización
    cargarOpcionesFiltros();
    obtenerIngresos(1);
});