import { 
    initCajaHeader // Usamos el header de caja
} from './header.js';

document.addEventListener('DOMContentLoaded', async () => {
    
    // 1. Inicializar Header
    const sessionData = await initCajaHeader('inventario');

    // 2. Obtener parámetros
    const params = new URLSearchParams(window.location.search);
    const divisaId = params.get('id');
    // Prioridad: URL > Session
    const cajaId = params.get('caja_id') || (sessionData ? sessionData.caja_id : null);

    if (!divisaId) {
        alert("Error: ID de divisa no especificado");
        window.history.back();
        return;
    }

    // 3. Referencias DOM
    const refs = {
        tituloNombre: document.getElementById('titulo-nombre'),
        tituloCodigo: document.getElementById('titulo-codigo'),
        iconoImg: document.getElementById('icono-img'),
        infoPais: document.getElementById('info-pais'),
        infoSimbolo: document.getElementById('info-simbolo'),
        infoFraccionable: document.getElementById('info-fraccionable'),
        infoDenominacion: document.getElementById('info-denominacion'),
        badgeEstado: document.getElementById('badge-estado'),
        tablaMovimientos: document.getElementById('tabla-movimientos'),
        totalMovimientos: document.getElementById('total-movimientos'),
        infoCajaActual: document.getElementById('info-caja-actual'),
        btnVolver: document.getElementById('volver-lista')
    };

    if (refs.btnVolver) {
        refs.btnVolver.onclick = () => window.location.href = 'inventario.html';
    }

    // 4. Lógica de Carga (Switch entre Tesoreria y Caja)
    // Como estamos en el sistema de Caja, forzamos el uso del endpoint de caja
    cargarDetalleCaja();

    function cargarDetalleCaja() {
        if (!cajaId) {
            alert("No se detectó una caja válida en la sesión.");
            return;
        }

        // Llamamos al NUEVO PHP creado
        const url = `https://cambiosorion.cl/data/detalle-div-caja.php?id=${divisaId}&caja_id=${cajaId}`;

        fetch(url)
            .then(res => res.json())
            .then(data => {
                if (data.error) throw new Error(data.error);

                const d = data.divisa;
                
                // Llenar Ficha (Solo Lectura)
                refs.tituloNombre.textContent = d.nombre;
                refs.tituloCodigo.textContent = d.codigo;
                refs.infoPais.textContent = d.pais || '-';
                refs.infoSimbolo.textContent = d.simbolo || '-';
                refs.infoFraccionable.textContent = (d.fraccionable == 1) ? 'Sí' : 'No';
                refs.infoDenominacion.textContent = d.denominacion || 'N/A';
                
                if (d.icono) refs.iconoImg.src = d.icono;
                else refs.iconoImg.src = 'https://cambiosorion.cl/orionapp/icons/default.png';

                const activa = (d.estado === 'Habilitada' || d.estado == 1);
                refs.badgeEstado.textContent = activa ? 'Activa' : 'Inactiva';
                refs.badgeEstado.className = `text-xs font-bold uppercase px-3 py-1 rounded-full border ${activa ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`;

                // Info Caja
                if (data.caja_info && refs.infoCajaActual) {
                    refs.infoCajaActual.textContent = data.caja_info.nombre;
                }

                renderizarMovimientos(data.operaciones || []);
            })
            .catch(err => {
                console.error(err);
                alert("Error al cargar datos: " + err.message);
            });
    }

    function renderizarMovimientos(lista) {
        refs.tablaMovimientos.innerHTML = '';
        refs.totalMovimientos.textContent = `${lista.length} registros recientes`;

        if (lista.length === 0) {
            refs.tablaMovimientos.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-gray-400 italic">No hay movimientos registrados en esta caja para esta divisa.</td></tr>`;
            return;
        }

        lista.forEach(op => {
            const esCompra = String(op.tipo_transaccion).toLowerCase() === 'compra';
            const tipoClass = esCompra 
                ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
                : 'bg-blue-100 text-blue-700 border-blue-200';
            
            const tr = document.createElement('tr');
            tr.className = "hover:bg-gray-50 border-b border-gray-100 transition last:border-0";
            
            // Click para ir al detalle de la operación
            tr.style.cursor = "pointer";
            tr.onclick = () => window.location.href = `detalle-op?id=${op.id}`;

            tr.innerHTML = `
                <td class="px-5 py-3">
                    <div class="font-bold text-gray-700 text-xs">${op.fecha}</div>
                    <div class="text-[10px] text-gray-400 font-mono">#${op.id}</div>
                </td>
                <td class="px-5 py-3 text-xs text-gray-600">
                    <div class="font-medium">${op.nombre_cliente}</div>
                </td>
                <td class="px-5 py-3 text-center">
                    <span class="text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${tipoClass}">${op.tipo_transaccion}</span>
                </td>
                <td class="px-5 py-3 text-right font-mono text-gray-800 text-xs font-medium">
                    ${parseFloat(op.monto).toLocaleString('es-CL', { minimumFractionDigits: 2 })}
                </td>
                <td class="px-5 py-3 text-right font-mono text-gray-500 text-[10px]">
                    ${parseFloat(op.tasa_cambio).toLocaleString('es-CL', { minimumFractionDigits: 2 })}
                </td>
                <td class="px-5 py-3 text-right font-mono text-cyan-700 text-xs font-bold">
                    $${parseFloat(op.total).toLocaleString('es-CL', { minimumFractionDigits: 0 })}
                </td>
            `;
            refs.tablaMovimientos.appendChild(tr);
        });
    }
});