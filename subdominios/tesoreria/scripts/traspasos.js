// Variable global para almacenar la información de la sesión y caja
let sesionData = null;

document.addEventListener('DOMContentLoaded', async () => {
    // Obtener la sesión actual
    await obtenerSesion();

    // Configurar listeners para filtros y búsqueda
    setupEventListeners();

    // Cargar los traspasos iniciales
    if (sesionData && sesionData.caja_id) {
        cargarTraspasos();
    } else {
        mostrarError("No se pudo obtener la información de la caja. Por favor, recarga la página.");
    }
});

async function obtenerSesion() {
    try {
        // Se asume que existe un endpoint que devuelve el estado de la sesión
        // y que incluye el ID de la caja actual y si es tesorería.
        const response = await fetch('https://cambiosorion.cl/data/session_status.php'); // Ajusta la URL si es necesario
        if (!response.ok) throw new Error('Error al obtener la sesión');
        const data = await response.json();

        if (data.isAuthenticated && data.caja_id) {
            sesionData = {
                caja_id: data.caja_id,
                caja_nombre: data.caja_nombre || 'Caja',
                es_tesoreria: data.caja_nombre && data.caja_nombre.toLowerCase().includes('tesoreria')
            };
            console.log("Sesión cargada:", sesionData);

            // Actualizar títulos o elementos de la UI según si es tesorería o no (Opcional)
            if (sesionData.es_tesoreria) {
                // Ejemplo: document.querySelector('h1').textContent = 'Traspasos - Tesorería';
            }
        } else {
             throw new Error('Sesión no válida o sin caja asignada');
             // Redirigir al login si es necesario: window.location.href = '/login.html';
        }

    } catch (error) {
        console.error('Error:', error);
        mostrarError("Error al cargar la sesión. Verifica tu conexión.");
        sesionData = null; // Asegurar que sea null si falla
    }
}

function setupEventListeners() {
    const btnActualizar = document.getElementById('btn-actualizar');
    const busquedaInput = document.getElementById('busqueda');
    const filtroEstado = document.getElementById('filtro-estado');
    const filtroFecha = document.getElementById('filtro-fecha');
    const filtroTipo = document.getElementById('filtro-tipo');

    btnActualizar.addEventListener('click', cargarTraspasos);

    // Debounce para la búsqueda
    let timeout;
    busquedaInput.addEventListener('input', () => {
        clearTimeout(timeout);
        timeout = setTimeout(cargarTraspasos, 300);
    });

    filtroEstado.addEventListener('change', cargarTraspasos);
    filtroFecha.addEventListener('change', cargarTraspasos);
    filtroTipo.addEventListener('change', cargarTraspasos);
}

async function cargarTraspasos() {
    if (!sesionData || !sesionData.caja_id) return;

    const tbody = document.getElementById('tabla-traspasos-body');
    mostrarCargando(tbody);

    try {
        // --- MODIFICACIÓN PRINCIPAL: Usar el nuevo endpoint unificado ---
        const cajaId = sesionData.caja_id;
        
        // Construir URL con filtros (apuntando a traspasos.php)
        let url = `https://cambiosorion.cl/data/traspasos.php?caja_id=${cajaId}`;

        const busqueda = document.getElementById('busqueda').value.trim();
        const estado = document.getElementById('filtro-estado').value;
        const fecha = document.getElementById('filtro-fecha').value;
        // const tipo = document.getElementById('filtro-tipo').value; // El backend no filtra por 'tipo' (enviado/recibido) directamente aún, lo haremos en el cliente si es necesario, o idealmente actualizar el backend.

        if (busqueda) url += `&busqueda=${encodeURIComponent(busqueda)}`; // El backend actual no tiene filtro 'busqueda' genérico, usa filtros específicos (numero, origen, etc).
        // Si quieres que el input de búsqueda filtre por ID:
        if (busqueda && !isNaN(busqueda)) url += `&numero=${busqueda}`;
        
        if (estado !== 'todos') url += `&estado=${encodeURIComponent(estado)}`;
        if (fecha) url += `&fecha=${fecha}`;

        console.log("Cargando traspasos desde:", url);

        const response = await fetch(url);
        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
        
        // El nuevo PHP devuelve el array de traspasos directamente
        let traspasos = await response.json();

        // Filtrado en cliente para "tipo" (Enviados/Recibidos) si el backend no lo hace
        const filtroTipo = document.getElementById('filtro-tipo').value;
        if (filtroTipo !== 'todos') {
            traspasos = traspasos.filter(t => {
                // Es enviado si el origen_id coincide con mi caja_id
                const esEnviado = t.origen_id == cajaId;
                return filtroTipo === 'enviados' ? esEnviado : !esEnviado;
            });
        }
        
        renderizarTabla(traspasos);
        actualizarResumen(traspasos);

    } catch (error) {
        console.error('Error al cargar traspasos:', error);
        mostrarErrorTabla(tbody, "Error al cargar los datos. Intenta nuevamente.");
    } finally {
        lucide.createIcons(); // Re-inicializar iconos después de renderizar
    }
}

function renderizarTabla(traspasos) {
    const tbody = document.getElementById('tabla-traspasos-body');
    tbody.innerHTML = '';

    if (traspasos.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="px-6 py-8 text-center text-gray-500">
                    <i data-lucide="inbox" class="w-8 h-8 mx-auto mb-2 text-gray-400"></i>
                    <p>No se encontraron traspasos con los filtros seleccionados.</p>
                </td>
            </tr>
        `;
        return;
    }

    traspasos.forEach(traspaso => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-gray-50 transition-colors';

        // Determinar si es enviado o recibido para iconos y colores
        const esEnviado = traspaso.origen_id == sesionData.caja_id;
        const tipoIcon = esEnviado ? 'arrow-up-right' : 'arrow-down-left';
        const tipoColor = esEnviado ? 'text-blue-600' : 'text-green-600';
        const tipoTexto = esEnviado ? 'Enviado' : 'Recibido';

        // Formatear fecha
        const fecha = new Date(traspaso.fecha).toLocaleString('es-CL', {
            day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit'
        });

        // Formatear monto
        const montoFmt = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(traspaso.monto).replace('CLP', '').trim();

        // Badge de estado
        let badgeClass = '';
        switch (traspaso.estado) {
            case 'Pendiente': badgeClass = 'badge-pendiente'; break;
            case 'Completado': case 'Pagado': badgeClass = 'badge-completado'; break; // Aceptamos 'Pagado' también
            case 'Rechazado': case 'Anulado': badgeClass = 'badge-rechazado'; break;
            default: badgeClass = 'bg-gray-100 text-gray-800 border-gray-200';
        }

        tr.innerHTML = `
            <td class="px-6 py-4 font-medium text-gray-900">#${traspaso.id}</td>
            <td class="px-6 py-4">${fecha}</td>
            <td class="px-6 py-4">
                <span class="flex items-center gap-1 ${tipoColor} font-medium">
                    <i data-lucide="${tipoIcon}" class="w-4 h-4"></i> ${tipoTexto}
                </span>
            </td>
            <td class="px-6 py-4">
                <div class="flex flex-col">
                    <span class="text-xs text-gray-500">De: <span class="font-medium text-gray-700">${traspaso.origen || 'ID ' + traspaso.origen_id}</span></span>
                    <span class="text-xs text-gray-500">A: <span class="font-medium text-gray-700">${traspaso.destino || 'ID ' + traspaso.destino_id}</span></span>
                </div>
            </td>
            <td class="px-6 py-4 font-medium">${traspaso.divisa || traspaso.divisa_id}</td>
            <td class="px-6 py-4 text-right font-bold text-gray-900">${montoFmt}</td>
            <td class="px-6 py-4 text-center">
                <span class="badge ${badgeClass}">${traspaso.estado}</span>
            </td>
            <td class="px-6 py-4 text-center">
                <button class="p-1 text-gray-500 hover:text-blue-600 rounded hover:bg-blue-50 transition-colors" title="Ver Detalles" onclick="verDetalles(${traspaso.id})">
                    <i data-lucide="eye" class="w-5 h-5"></i>
                </button>
                </td>
        `;
        tbody.appendChild(tr);
    });
}

function actualizarResumen(traspasos) {
    // Esta función puede ser más compleja, sumando montos por divisa, etc.
    // Por ahora, un conteo simple basado en los datos cargados.
    const enviados = traspasos.filter(t => t.origen_id == sesionData.caja_id).length;
    const recibidos = traspasos.filter(t => t.destino_id == sesionData.caja_id).length;
    const pendientes = traspasos.filter(t => t.estado === 'Pendiente').length;

    // Actualizar el DOM (Asumiendo que los elementos muestran cantidades, no montos por ahora)
    // Para mostrar montos reales habría que hacer la suma considerando las divisas.
    document.getElementById('resumen-enviados').textContent = enviados;
    document.getElementById('resumen-recibidos').textContent = recibidos;
    document.getElementById('resumen-pendientes').textContent = pendientes;
}


function mostrarCargando(tbody) {
    tbody.innerHTML = `
        <tr>
            <td colspan="8" class="px-6 py-8 text-center text-gray-500">
                <div class="flex flex-col items-center justify-center">
                    <i data-lucide="loader-2" class="w-8 h-8 animate-spin text-blue-500 mb-2"></i>
                    <p>Cargando traspasos...</p>
                </div>
            </td>
        </tr>
    `;
    lucide.createIcons();
}

function mostrarErrorTabla(tbody, mensaje) {
    tbody.innerHTML = `
        <tr>
            <td colspan="8" class="px-6 py-8 text-center text-red-500 bg-red-50">
                <i data-lucide="alert-circle" class="w-8 h-8 mx-auto mb-2"></i>
                <p>${mensaje}</p>
            </td>
        </tr>
    `;
    lucide.createIcons();
}

function mostrarError(mensaje) {
    Swal.fire({
        icon: 'error',
        title: 'Error',
        text: mensaje,
        confirmButtonColor: '#3b82f6'
    });
}

// Función placeholder para ver detalles (a implementar)
window.verDetalles = function(id) {
    // Implementar lógica para abrir modal o navegar a página de detalle
    Swal.fire({
        title: `Detalles del Traspaso #${id}`,
        text: 'Funcionalidad de detalles en desarrollo.',
        icon: 'info',
        confirmButtonColor: '#3b82f6'
    });
}