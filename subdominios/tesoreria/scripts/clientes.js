import { 
    initSystem, 
    limpiarTexto, 
    formatearFechaHora, 
    mostrarModalError 
} from './index.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Inicializar sistema
    initSystem('clientes');

    // Referencias DOM
    const tablaClientes = document.getElementById('tabla-clientes');
    const conteoResultados = document.getElementById('conteo-resultados');
    const paginationControls = document.getElementById('pagination-controls');
    
    const nuevoClienteBtn = document.getElementById('nuevo-cliente');
    const borrarFiltrosBtn = document.getElementById('borrar-filtros');

    let paginaActual = 1;

    // Filtros
    const filtros = {
        fechaInicio: document.getElementById("fecha-inicio"),
        fechaFin: document.getElementById("fecha-fin"),
        nombre: document.getElementById("nombre-cliente"),
        rut: document.getElementById("rut-cliente"),
        tipo: document.getElementById("tipo-cliente"),
        estadoDoc: document.getElementById("estado-doc"),
        estado: document.getElementById("estado-cliente"),
        mostrar: document.getElementById("mostrar-registros")
    };

    // Botón Nuevo
    if (nuevoClienteBtn) {
        nuevoClienteBtn.addEventListener('click', () => {
            window.location.href = 'https://tesoreria.cambiosorion.cl/nuevo-cliente';
        });
    }

    // --- FETCH DATOS ---
    function obtenerClientes() {
        const params = new URLSearchParams();

        if (filtros.fechaInicio.value) params.set('fecha_inicio', filtros.fechaInicio.value);
        if (filtros.fechaFin.value) params.set('fecha_fin', filtros.fechaFin.value);
        if (filtros.nombre.value) params.set('nombre', filtros.nombre.value.trim());
        if (filtros.rut.value) params.set('rut', filtros.rut.value.trim());
        if (filtros.tipo.value) params.set('tipo', filtros.tipo.value);
        if (filtros.estadoDoc.value) params.set('estado_doc', filtros.estadoDoc.value);
        if (filtros.estado.value) params.set('estado', filtros.estado.value);
        
        if (filtros.mostrar.value) params.set('mostrar_registros', filtros.mostrar.value);
        params.set('pagina', paginaActual);

        // Spinner Ámbar
        tablaClientes.innerHTML = `<tr><td colspan="9" class="text-center py-10"><div class="animate-spin h-8 w-8 border-4 border-amber-500 rounded-full border-t-transparent mx-auto"></div></td></tr>`;

        fetch(`https://cambiosorion.cl/data/clientes.php?${params.toString()}`)
            .then(res => res.json())
            .then(data => {
                const lista = data.clientes || [];
                const total = parseInt(data.totalFiltrado) || 0;
                renderizarTabla(lista);
                renderizarPaginacion(total, parseInt(filtros.mostrar.value), paginaActual);
            })
            .catch(error => {
                console.error('Error:', error);
                tablaClientes.innerHTML = `<tr><td colspan="9" class="text-center text-red-400 py-4">Error de conexión.</td></tr>`;
            });
    }

    // --- RENDERIZADO ---
    function renderizarTabla(clientes) {
        tablaClientes.innerHTML = '';

        if (clientes.length === 0) {
            tablaClientes.innerHTML = `<tr><td colspan="9" class="text-center text-slate-500 py-10 italic">No se encontraron clientes.</td></tr>`;
            return;
        }

        clientes.forEach(cliente => {
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-white/5 transition-all border-b border-white/5 last:border-0 text-slate-300';

            // --- MAPEO DE DATOS (CORRECCIÓN CRÍTICA) ---
            // Usamos || para dar soporte a ambos nombres por si acaso cambia el PHP
            const nombreMostrar = cliente.razon_social || cliente.nombre || 'Sin Nombre';
            const fechaRegistro = cliente.fecha_ingreso || cliente.created_at;
            const tipoCliente = cliente.tipo || cliente.tipo_cliente;
            // 'activo' suele ser "1" o "0" en la BD
            const esActivo = (cliente.activo == 1 || cliente.activo === '1' || cliente.habilitado == 1);

            // Badges
            let estadoClass = esActivo 
                ? 'bg-green-900/40 text-green-300 border border-green-500/30' 
                : 'bg-red-900/40 text-red-300 border border-red-500/30';
            let estadoTexto = esActivo ? 'Habilitado' : 'Deshabilitado';

            let docClass = cliente.estado_documentacion === 'Completa' 
                ? 'text-green-400 font-bold' 
                : 'text-amber-400 italic';

            // Botón Acción
            const btnVer = document.createElement('button');
            btnVer.innerHTML = `<svg class="w-5 h-5 text-slate-400 hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>`;
            btnVer.className = 'flex items-center justify-center p-1.5 bg-white/5 rounded-full hover:bg-amber-600 shadow-sm border border-transparent transition-all mx-auto';
            btnVer.onclick = (e) => {
                e.stopPropagation();
                window.location.href = `detalle-cliente?id=${cliente.id}`;
            };

            tr.innerHTML = `
                <td class="px-4 py-3 whitespace-nowrap text-xs">${formatearFechaHora(fechaRegistro)}</td>
                <td class="px-4 py-3 font-mono text-xs font-bold text-slate-500">${cliente.id}</td>
                <td class="px-4 py-3 font-semibold text-sm text-white truncate max-w-[200px]" title="${limpiarTexto(nombreMostrar)}">${limpiarTexto(nombreMostrar)}</td>
                <td class="px-4 py-3 font-mono text-xs text-amber-100">${limpiarTexto(cliente.rut)}</td>
                <td class="px-4 py-3 text-xs text-slate-400">
                    <div class="truncate max-w-[150px]">${limpiarTexto(cliente.email)}</div>
                    <div class="text-[10px] text-slate-500">${limpiarTexto(cliente.fono)}</div>
                </td>
                <td class="px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-slate-400">${limpiarTexto(tipoCliente)}</td>
                <td class="px-4 py-3 text-center text-xs ${docClass}">${limpiarTexto(cliente.estado_documentacion)}</td>
                <td class="px-4 py-3 text-center">
                    <span class="px-2 py-0.5 rounded text-[10px] uppercase font-bold ${estadoClass}">${estadoTexto}</span>
                </td>
                <td class="px-4 py-3 text-center cell-action"></td>
            `;
            
            tr.querySelector('.cell-action').appendChild(btnVer);
            tablaClientes.appendChild(tr);
        });
    }

    // --- PAGINACIÓN ---
    function renderizarPaginacion(totalRegistros, porPagina, pagina) {
        conteoResultados.textContent = `Total: ${totalRegistros}`;
        paginationControls.innerHTML = '';

        const totalPaginas = Math.ceil(totalRegistros / porPagina);
        if (totalPaginas <= 1) return;

        const btnPrev = crearBotonPag('Anterior', pagina > 1, () => cambioPagina(pagina - 1));
        paginationControls.appendChild(btnPrev);

        const span = document.createElement('span');
        span.className = "text-xs font-bold text-slate-400 px-2";
        span.textContent = `${pagina} / ${totalPaginas}`;
        paginationControls.appendChild(span);

        const btnNext = crearBotonPag('Siguiente', pagina < totalPaginas, () => cambioPagina(pagina + 1));
        paginationControls.appendChild(btnNext);
    }

    function crearBotonPag(texto, habilitado, onClick) {
        const btn = document.createElement('button');
        btn.textContent = texto;
        btn.className = `px-3 py-1 bg-slate-800 border border-slate-600 rounded hover:bg-slate-700 text-white text-xs transition ${!habilitado ? 'opacity-50 cursor-not-allowed' : ''}`;
        btn.disabled = !habilitado;
        btn.onclick = onClick;
        return btn;
    }

    function cambioPagina(nuevaPagina) {
        paginaActual = nuevaPagina;
        obtenerClientes();
    }

    // --- EVENTOS ---
    const resetAndFetch = () => { paginaActual = 1; obtenerClientes(); };

    borrarFiltrosBtn.addEventListener('click', () => {
        Object.values(filtros).forEach(input => {
            if(!input) return;
            input.value = '';
            if(input._flatpickr) input._flatpickr.clear();
        });
        if(filtros.mostrar) filtros.mostrar.value = '25';
        resetAndFetch();
    });

    Object.values(filtros).forEach(input => {
        if(input) {
            input.addEventListener('input', resetAndFetch);
            input.addEventListener('change', resetAndFetch);
        }
    });

    obtenerClientes();
});