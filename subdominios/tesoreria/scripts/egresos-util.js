document.addEventListener('DOMContentLoaded', () => {
    let currentPage = 1;

    const inputsFiltro = {
        numero: document.getElementById('numero'),
        fecha: document.getElementById('fecha'),
        tipo: document.getElementById('tipo-egreso'),
        // 'cliente' eliminado, usamos 'buscar' para el concepto
        caja: document.getElementById('caja'),
        divisa: document.getElementById('divisa'),
        estado: document.getElementById('estado'),
        buscar: document.getElementById('buscar'),
        mostrar: document.getElementById('mostrar-registros')
    };

    const btnNuevo = document.getElementById('nuevo-egreso-util');

    // 1. Función Principal
    function obtenerEgresos(page = 1) {
        currentPage = page;
        const params = new URLSearchParams();
        params.set('page', page);
        params.set('mostrar', inputsFiltro.mostrar ? inputsFiltro.mostrar.value : 25);
        params.set('buscar', inputsFiltro.buscar.value);
        params.set('numero', inputsFiltro.numero.value);
        params.set('fecha', inputsFiltro.fecha.value);
        params.set('tipo_egreso', inputsFiltro.tipo.value);
        params.set('caja', inputsFiltro.caja.value);
        params.set('divisa', inputsFiltro.divisa.value);
        params.set('estado', inputsFiltro.estado.value);

        fetch(`https://cambiosorion.cl/data/egresos-util.php?${params.toString()}`)
            .then(async res => {
                const text = await res.text();
                try { return JSON.parse(text); } catch (e) { console.error(text); throw new Error("Error JSON"); }
            })
            .then(res => {
                mostrarResultados(res.data);
                actualizarContador(res.total, res.limit, res.page);
                renderPaginacion(res.totalPages, res.page);
            })
            .catch(err => console.error(err));
    }

    // 2. Renderizado
    function mostrarResultados(lista) {
        const tbody = document.querySelector('#egresos-util table tbody');
        tbody.innerHTML = '';
        
        if (!lista || lista.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" class="text-center bg-white text-gray-600 py-4">No se encontraron registros.</td></tr>';
            return;
        }

        lista.forEach(item => {
            const tr = document.createElement('tr');
            tr.className = 'border-b bg-white border-gray-700 text-gray-700 hover:bg-gray-50';
            
            const fechaFmt = formatDate(item.fecha);
            const montoFmt = '$' + Number(item.monto).toLocaleString('es-CL');
            const estadoClass = getEstadoClass(item.estado);

            tr.innerHTML = `
                <td class="px-4 py-2 font-medium">${item.id}</td>
                <td class="px-4 py-2">${fechaFmt}</td>
                <td class="px-4 py-2">${item.tipo_egreso}</td>
                <td class="px-4 py-2 font-bold text-gray-800 uppercase">${item.item_utilidad || 'Sin detalle'}</td> <!-- AQUÍ EL CAMBIO -->
                <td class="px-4 py-2">${item.caja || '—'}</td>
                <td class="px-4 py-2">${item.divisa || '—'}</td>
                <td class="px-4 py-2 font-bold text-red-600">-${montoFmt}</td>
                <td class="px-4 py-2"><span class="px-2 py-1 rounded text-xs font-bold uppercase ${estadoClass}">${item.estado}</span></td>
                <td class="px-4 py-2 text-center">
                    <button onclick="window.location.href='detalle-egr-util?id=${item.id}'" class="text-white bg-yellow-600 hover:bg-yellow-700 rounded-lg text-sm px-3 py-1">Ver</button>
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
        return `${d}/${m}/${y}`;
    }

    function getEstadoClass(est) {
        const e = (est || '').toLowerCase();
        if(e === 'vigente') return 'bg-green-100 text-green-800';
        if(e === 'anulado') return 'bg-red-100 text-red-800';
        return 'bg-gray-100 text-gray-800';
    }

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
            const cls = active ? 'text-blue-600 bg-blue-50 border-blue-300' : 'text-gray-500 bg-white border-gray-300 hover:bg-gray-100';
            li.innerHTML = `<button class="px-3 py-2 leading-tight border ${cls}" ${disabled ? 'disabled' : ''}>${text}</button>`;
            if(!disabled) li.onclick = () => obtenerEgresos(page);
            return li;
        };

        container.appendChild(createBtn('Ant', currentP - 1, currentP === 1, false));
        for(let i = 1; i <= totalP; i++) container.appendChild(createBtn(i, i, false, i === currentP));
        container.appendChild(createBtn('Sig', currentP + 1, currentP === totalP, false));
    }

    // Listeners
    Object.values(inputsFiltro).forEach(el => { if(el) el.addEventListener('input', () => obtenerEgresos(1)); });
    if(btnNuevo) btnNuevo.addEventListener('click', () => window.location.href = 'nuevo-egr-util');

    obtenerEgresos(1);
});