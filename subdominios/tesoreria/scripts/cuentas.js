import { 
    initSystem, 
    limpiarTexto, 
    formatearNumero,
    mostrarModalError 
} from './index.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Inicializar sistema
    initSystem('cuentas');

    // Referencias DOM
    const tablaCuentas = document.getElementById('tabla-cuentas');
    const conteoResultados = document.getElementById('conteo-resultados');
    const paginationControls = document.getElementById('pagination-controls');
    
    const nuevaCuentaBtn = document.getElementById('nuevo-cuenta');
    const borrarFiltrosBtn = document.getElementById('borrar-filtros');

    let paginaActual = 1;

    // Filtros
    const filtros = {
        buscar: document.getElementById("buscar"),
        nombre: document.getElementById("nombre"),
        divisa: document.getElementById("divisa"),
        tipo: document.getElementById("tipo"),
        porCobrar: document.getElementById("por-cobrar"),
        porPagar: document.getElementById("por-pagar"),
        activa: document.getElementById("activa"),
        mostrar: document.getElementById("mostrar-registros")
    };

    if (nuevaCuentaBtn) {
        nuevaCuentaBtn.addEventListener('click', () => {
            window.location.href = 'https://tesoreria.cambiosorion.cl/nueva-cta';
        });
    }

    // --- FETCH DATOS ---
    function obtenerCuentas() {
        const params = new URLSearchParams();

        if (filtros.buscar.value) params.set('buscar', filtros.buscar.value.trim());
        if (filtros.nombre.value) params.set('nombre', filtros.nombre.value.trim());
        if (filtros.divisa.value) params.set('divisa', filtros.divisa.value.trim());
        if (filtros.tipo.value) params.set('tipo', filtros.tipo.value.trim());
        
        if (filtros.porCobrar.value) params.set('por_cobrar', filtros.porCobrar.value);
        if (filtros.porPagar.value) params.set('por_pagar', filtros.porPagar.value);
        if (filtros.activa.value) params.set('activa', filtros.activa.value);
        
        if (filtros.mostrar.value) params.set('mostrar_registros', filtros.mostrar.value);
        params.set('pagina', paginaActual);

        // Spinner Ámbar
        tablaCuentas.innerHTML = `<tr><td colspan="10" class="text-center py-10"><div class="animate-spin h-8 w-8 border-4 border-amber-500 rounded-full border-t-transparent mx-auto"></div></td></tr>`;

        fetch(`https://tesoreria.cambiosorion.cl/api/cuentas.php?${params.toString()}`)
            .then(res => res.json())
            .then(data => {
                const lista = data.cuentas || [];
                const total = parseInt(data.totalFiltrado) || 0;
                renderizarTabla(lista);
                renderizarPaginacion(total, parseInt(filtros.mostrar.value), paginaActual);
            })
            .catch(error => {
                console.error('Error:', error);
                tablaCuentas.innerHTML = `<tr><td colspan="10" class="text-center text-red-400 py-4">Error de conexión.</td></tr>`;
            });
    }

    // --- RENDERIZADO ---
    function renderizarTabla(cuentas) {
        tablaCuentas.innerHTML = '';

        if (cuentas.length === 0) {
            tablaCuentas.innerHTML = `<tr><td colspan="10" class="text-center text-slate-500 py-10 italic">No se encontraron cuentas.</td></tr>`;
            return;
        }

        cuentas.forEach(cta => {
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-white/5 transition-all border-b border-white/5 last:border-0 text-slate-300';

            // Estados Lógicos
            const esActiva = (cta.activa == 1 || cta.activa === '1');
            const porCobrar = (cta.por_cobrar == 1);
            const porPagar = (cta.por_pagar == 1);

            // Badges
            const estadoClass = esActiva 
                ? 'bg-green-900/40 text-green-300 border border-green-500/30' 
                : 'bg-red-900/40 text-red-300 border border-red-500/30';
            const estadoTexto = esActiva ? 'Activa' : 'Inactiva';

            const checkIcon = `<svg class="w-4 h-4 text-green-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`;
            const dashIcon = `<span class="text-slate-600">-</span>`;

            // Botón Acción
            const btnVer = document.createElement('button');
            btnVer.innerHTML = `<svg class="w-5 h-5 text-slate-400 hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>`;
            btnVer.className = 'flex items-center justify-center p-1.5 bg-white/5 rounded-full hover:bg-amber-600 shadow-sm border border-transparent transition-all mx-auto';
            btnVer.onclick = (e) => {
                e.stopPropagation();
                window.location.href = `detalle-cta?id=${cta.id}`;
            };

            const iconoDivisa = cta.divisa_icono || 'https://cambiosorion.cl/orionapp/icons/default.png';

            tr.innerHTML = `
                <td class="px-4 py-3 font-mono text-xs font-bold text-slate-500 text-center">${cta.id}</td>
                <td class="px-4 py-3">
                    <div class="font-bold text-white text-sm">${limpiarTexto(cta.nombre)}</div>
                    <div class="text-xs text-amber-500/80">${limpiarTexto(cta.banco)}</div>
                </td>
                <td class="px-4 py-3 font-mono text-xs text-slate-400">${limpiarTexto(cta.numero)}</td>
                <td class="px-4 py-3">
                    <div class="flex items-center justify-center gap-2">
                        <img src="${iconoDivisa}" class="w-5 h-5 object-contain" onerror="this.src='https://cambiosorion.cl/orionapp/icons/default.png'">
                        <span class="font-bold text-xs text-slate-300">${limpiarTexto(cta.divisa)}</span>
                    </div>
                </td>
                <td class="px-4 py-3 text-xs text-slate-400">${limpiarTexto(cta.tipo)}</td>
                <td class="px-4 py-3 text-right font-mono font-bold text-sm text-white">${formatearNumero(cta.saldo)}</td>
                <td class="px-4 py-3 text-center">${porCobrar ? checkIcon : dashIcon}</td>
                <td class="px-4 py-3 text-center">${porPagar ? checkIcon : dashIcon}</td>
                <td class="px-4 py-3 text-center">
                    <span class="px-2 py-0.5 rounded text-[10px] uppercase font-bold ${estadoClass}">${estadoTexto}</span>
                </td>
                <td class="px-4 py-3 text-center cell-action"></td>
            `;
            
            tr.querySelector('.cell-action').appendChild(btnVer);
            tablaCuentas.appendChild(tr);
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
        obtenerCuentas();
    }

    // --- EVENTOS ---
    const resetAndFetch = () => { paginaActual = 1; obtenerCuentas(); };

    borrarFiltrosBtn.addEventListener('click', () => {
        Object.values(filtros).forEach(input => {
            if(!input) return;
            input.value = '';
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

    obtenerCuentas();
});