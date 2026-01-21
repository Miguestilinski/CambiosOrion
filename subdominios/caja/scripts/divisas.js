import { initCajaHeader } from './header.js';

document.addEventListener('DOMContentLoaded', async() => {
    // 1. Inicializar Header marcando 'divisas' en el sidebar
    const sessionData = await initCajaHeader('divisas');

    const tablaDivisas = document.getElementById('tabla-divisas');
    const borrarFiltrosBtn = document.getElementById('borrar-filtros');
    const contadorRegistros = document.getElementById('contador-registros');
    
    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');
    const pageIndicator = document.getElementById('page-indicator');
    
    let paginaActual = 1;
    // Capturamos el ID de la caja de la sesión para pasarlo al detalle
    let currentCajaId = (sessionData && sessionData.caja_id) ? sessionData.caja_id : '';

    const filtros = {
        buscar: document.getElementById('buscar'),
        nombre: document.getElementById('nombre'),
        pais: document.getElementById('pais'),
        codigo: document.getElementById('codigo'),
        simbolo: document.getElementById('simbolo'),
        tipo: document.getElementById('tipo'),
        fraccionable: document.getElementById('fraccionable'),
        mostrar: document.getElementById('mostrar-registros')
    };

    // (La función cargarSidebar ya no es necesaria aquí, la maneja header.js)

    function obtenerDivisas() {
        const params = new URLSearchParams();
        
        for (const [clave, input] of Object.entries(filtros)) {
            if (input && input.value) {
                params.set(clave, input.value.trim());
            }
        }
        params.set('pagina', paginaActual);

        tablaDivisas.innerHTML = `<tr><td colspan="9" class="text-center py-10"><div class="animate-spin h-8 w-8 border-4 border-cyan-500 rounded-full border-t-transparent mx-auto"></div></td></tr>`;

        fetch(`https://cambiosorion.cl/data/divisas-caja.php?${params.toString()}`, { credentials: "include" })
            .then(response => {
                if (response.status === 401) {
                    window.location.href = 'https://admin.cambiosorion.cl/login';
                    throw new Error("No autorizado");
                }
                return response.json();
            })
            .then(data => {
                if (Array.isArray(data)) {
                    mostrarResultados(data);
                    actualizarPaginacion(data.length);
                } else {
                    console.error("Formato inválido:", data);
                    tablaDivisas.innerHTML = `<tr><td colspan="9" class="text-center py-4 text-red-500">Error en el formato de datos.</td></tr>`;
                }
            })
            .catch(error => {
                console.error('Error:', error);
                if(error.message !== "No autorizado") {
                    tablaDivisas.innerHTML = `<tr><td colspan="9" class="text-center py-4 text-red-500">Error de conexión.</td></tr>`;
                }
            });
    }

    function actualizarPaginacion(cantidadResultados) {
        if (pageIndicator) pageIndicator.textContent = `Página ${paginaActual}`;
        if (contadorRegistros) contadorRegistros.textContent = `${cantidadResultados} registros`;

        const limite = parseInt(filtros.mostrar.value) || 25;
        
        if (btnPrev) btnPrev.disabled = (paginaActual <= 1);
        if (btnNext) btnNext.disabled = (cantidadResultados < limite);
    }

    function mostrarResultados(divisas) {
        tablaDivisas.innerHTML = '';
        
        if (!divisas || divisas.length === 0) {
            tablaDivisas.innerHTML = `<tr><td colspan="9" class="text-center py-10 text-gray-500 italic">No se encontraron divisas.</td></tr>`;
            return;
        }

        divisas.forEach(divisa => {
            const tr = document.createElement('tr');
            tr.className = 'hover:brightness-95 transition-all text-gray-800 font-medium border-b border-gray-100 last:border-0 bg-white';

            let estadoClass = "bg-gray-100 text-gray-600";
            let textoEstado = "Inactiva";
            
            if (String(divisa.estado) === '1' || String(divisa.estado).toLowerCase() === 'activa') {
                estadoClass = "bg-green-100 text-green-700 border border-green-200";
                textoEstado = "Activa";
            } else if (String(divisa.estado) === '0' || String(divisa.estado).toLowerCase() === 'inactiva') {
                estadoClass = "bg-red-100 text-red-700 border border-red-200";
                textoEstado = "Inactiva";
            }

            const textoFracc = (String(divisa.fraccionable) === '1') ? 'SÍ' : 'NO';

            const btnMostrar = document.createElement('button');
            btnMostrar.innerHTML = `<svg class="w-5 h-5 text-gray-600 hover:text-cyan-700 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>`;
            btnMostrar.className = 'flex items-center justify-center p-1.5 bg-white/50 rounded-full hover:bg-white shadow-sm border border-transparent hover:border-cyan-300 mx-auto';
            btnMostrar.title = "Ver detalle";
            
            // --- LOGICA DE REDIRECCIÓN ACTUALIZADA ---
            btnMostrar.addEventListener('click', (e) => {
                e.stopPropagation();
                // Enviamos origin=divisas y el caja_id de la sesión actual
                window.location.href = `detalle-div.html?id=${divisa.id}&caja_id=${currentCajaId}&origin=divisas`;
            });

            tr.innerHTML = `
                <td class="px-4 py-3 text-center">
                    <img src="${divisa.icono}" alt="${divisa.codigo}" class="w-8 h-8 rounded-full border border-gray-200 object-contain mx-auto shadow-sm p-0.5" onerror="this.src='https://cambiosorion.cl/orionapp/icons/default.png'" />
                </td>
                <td class="px-4 py-3 font-bold text-gray-700">${divisa.nombre}</td>
                <td class="px-4 py-3 text-gray-600">${divisa.pais}</td>
                <td class="px-4 py-3 font-mono font-bold text-slate-800">${divisa.codigo}</td>
                <td class="px-4 py-3 text-center font-serif text-lg">${divisa.simbolo}</td>
                <td class="px-4 py-3 text-center text-xs uppercase font-semibold text-gray-500">${divisa.tipo_divisa ?? '-'}</td>
                <td class="px-4 py-3 text-center text-xs font-mono">${textoFracc}</td>
                <td class="px-4 py-3 text-center">
                    <span class="px-2 py-0.5 rounded text-[10px] uppercase font-bold ${estadoClass}">${textoEstado}</span>
                </td>
                <td class="px-4 py-3 text-center mostrar-btn-cell"></td>
            `;

            tr.querySelector('.mostrar-btn-cell').appendChild(btnMostrar);
            tablaDivisas.appendChild(tr);
        });
    }

    if (btnPrev) btnPrev.addEventListener('click', () => { if (paginaActual > 1) { paginaActual--; obtenerDivisas(); } });
    if (btnNext) btnNext.addEventListener('click', () => { paginaActual++; obtenerDivisas(); });

    if (borrarFiltrosBtn) {
        borrarFiltrosBtn.addEventListener('click', () => {
            Object.values(filtros).forEach(input => {
                if(!input) return;
                input.value = '';
            });
            if(filtros.mostrar) filtros.mostrar.value = '25';
            paginaActual = 1;
            obtenerDivisas();
        });
    }

    Object.values(filtros).forEach(input => {
        if(input) {
            const resetAndFetch = () => { paginaActual = 1; obtenerDivisas(); };
            input.addEventListener('input', resetAndFetch);
            input.addEventListener('change', resetAndFetch);
        }
    });
    
    // Llamada inicial
    obtenerDivisas();
});