document.addEventListener('DOMContentLoaded', () => {
    // 1. Estructura Base
    getSession();
    cargarSidebar();
    obtenerDivisas();

    const mostrarRegistros = document.getElementById('mostrar-registros');
    const buscarInput = document.getElementById('buscar');
    const nombreInput = document.getElementById('nombre');
    const paisInput = document.getElementById('pais');
    const codigoInput = document.getElementById('codigo');
    const simboloInput = document.getElementById('simbolo');
    const tipoInput = document.getElementById('tipo');
    const fraccionableInput = document.getElementById('fraccionable');
    const tablaDivisas = document.querySelector('table tbody');

    // --- FUNCIONES HEADER Y SIDEBAR ---
    function cargarSidebar() {
        fetch('sidebar.html')
            .then(response => response.text())
            .then(html => {
                const container = document.getElementById('sidebar-container');
                if (container) {
                    container.innerHTML = html;
                    activarLinkSidebar('divisas');
                }
            });
    }

    function activarLinkSidebar(pagina) {
        setTimeout(() => {
            const links = document.querySelectorAll('#sidebar-nav a');
            links.forEach(link => {
                link.classList.remove('bg-cyan-50', 'text-cyan-800', 'border-l-4', 'border-cyan-600', 'shadow-sm', 'font-bold');
                link.classList.add('text-gray-600', 'border-transparent');
                const icon = link.querySelector('svg');
                if(icon) { icon.classList.remove('text-cyan-600'); icon.classList.add('text-gray-400'); }

                if (link.dataset.page === pagina) {
                    link.classList.remove('text-gray-600', 'border-transparent');
                    link.classList.add('bg-cyan-50', 'text-cyan-800', 'border-l-4', 'border-cyan-600', 'shadow-sm', 'font-bold');
                    if(icon) { icon.classList.remove('text-gray-400'); icon.classList.add('text-cyan-600'); }
                }
            });
        }, 100);
    }

    async function getSession() {
        try {
            const res = await fetch("https://cambiosorion.cl/data/session_status_admin.php", { credentials: "include" });
            if (!res.ok) throw new Error("Error sesión");
            const data = await res.json();
            
            if (!data.isAuthenticated || !data.equipo_id) {
                window.location.href = 'https://admin.cambiosorion.cl/login';
                return;
            }

            const headerName = document.getElementById('header-user-name');
            const headerEmail = document.getElementById('dropdown-user-email');
            
            if (headerName) headerName.textContent = data.nombre ? data.nombre.split(' ')[0] : 'Admin';
            if (headerEmail) headerEmail.textContent = data.correo;

        } catch (error) {
            console.error("Error sesión:", error);
        }
    }
    // ----------------------------------

    function obtenerDivisas() {
        const params = new URLSearchParams();
        
        // Mapeo de filtros
        if(document.getElementById('nombre')) params.set('nombre', document.getElementById('nombre').value);
        if(document.getElementById('pais')) params.set('pais', document.getElementById('pais').value);
        if(document.getElementById('codigo')) params.set('codigo', document.getElementById('codigo').value);
        if(document.getElementById('simbolo')) params.set('simbolo', document.getElementById('simbolo').value);
        if(document.getElementById('tipo')) params.set('tipo', document.getElementById('tipo').value);
        if(document.getElementById('fraccionable')) params.set('fraccionable', document.getElementById('fraccionable').value);
        if(document.getElementById('buscar')) params.set('buscar', document.getElementById('buscar').value);
        
        // Paginación
        if(document.getElementById('mostrar-registros')) params.set('mostrar', document.getElementById('mostrar-registros').value);
        params.set('pagina', paginaActual);

        // Spinner de carga
        tablaDivisas.innerHTML = `<tr><td colspan="9" class="text-center py-10"><div class="animate-spin h-8 w-8 border-4 border-cyan-500 rounded-full border-t-transparent mx-auto"></div></td></tr>`;

        fetch(`https://cambiosorion.cl/data/divisas-int.php?${params.toString()}`, { credentials: "include" })
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
                console.error('Error al obtener las divisas:', error);
                if(error.message !== "No autorizado") {
                    tablaDivisas.innerHTML = `<tr><td colspan="9" class="text-center py-4 text-red-500">Error de conexión al cargar divisas.</td></tr>`;
                }
            });
    }

    function actualizarPaginacion(cantidadResultados) {
        if (pageIndicator) pageIndicator.textContent = `Página ${paginaActual}`;
        if (contadorRegistros) contadorRegistros.textContent = `${cantidadResultados} registros`;

        const mostrarInput = document.getElementById('mostrar-registros');
        const limite = mostrarInput ? (parseInt(mostrarInput.value) || 25) : 25;
        
        if (btnPrev) btnPrev.disabled = (paginaActual <= 1);
        // Si llegan menos registros que el límite, asumimos que es la última página
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
            tr.className = 'hover:bg-gray-50 border-b border-gray-100 transition text-sm';

            // Badge de estado
            let estadoClass = "bg-gray-100 text-gray-600";
            if (divisa.estado === 'Activa' || divisa.estado === '1') estadoClass = "bg-green-100 text-green-700 border border-green-200";
            if (divisa.estado === 'Inactiva' || divisa.estado === '0') estadoClass = "bg-red-100 text-red-700 border border-red-200";

            const btnMostrar = document.createElement('button');
            btnMostrar.innerHTML = `<svg class="w-5 h-5 text-gray-600 hover:text-cyan-700 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>`;
            btnMostrar.className = 'flex items-center justify-center p-1.5 bg-white/50 rounded-full hover:bg-white shadow-sm border border-transparent hover:border-cyan-300 mx-auto';
            btnMostrar.addEventListener('click', (e) => {
                e.stopPropagation();
                window.location.href = `detalle-div?id=${divisa.id}`;
            });

            tr.innerHTML = `
                <td class="px-4 py-3 text-center">
                    <img src="${divisa.icono}" alt="${divisa.codigo}" class="w-8 h-8 rounded-full border border-gray-200 object-contain mx-auto shadow-sm" onerror="this.src='https://cambiosorion.cl/orionapp/icons/default.png'" />
                </td>
                <td class="px-4 py-3 font-bold text-gray-700">${divisa.nombre}</td>
                <td class="px-4 py-3 text-gray-600">${divisa.pais}</td>
                <td class="px-4 py-3 font-mono font-bold text-slate-800">${divisa.codigo}</td>
                <td class="px-4 py-3 text-center font-serif text-lg">${divisa.simbolo}</td>
                <td class="px-4 py-3 text-center text-xs uppercase font-semibold text-gray-500">${divisa.tipo_divisa ?? '-'}</td>
                <td class="px-4 py-3 text-center text-xs">${divisa.fraccionable == 1 ? 'Sí' : 'No'}</td>
                <td class="px-4 py-3 text-center">
                    <span class="px-2 py-0.5 rounded text-[10px] uppercase font-bold ${estadoClass}">${divisa.estado}</span>
                </td>
                <td class="px-4 py-3 text-center mostrar-btn-cell"></td>
            `;

            tr.querySelector('.mostrar-btn-cell').appendChild(btnMostrar);
            tablaDivisas.appendChild(tr);
        });
    }

    // Listeners
    [nombreInput, paisInput, codigoInput, simboloInput, tipoInput, fraccionableInput, buscarInput, mostrarRegistros].forEach(input => {
        if(input) {
            input.addEventListener('input', obtenerDivisas);
            input.addEventListener('change', obtenerDivisas);
        }
    });

    // --- EVENTOS DE PAGINACIÓN (Agregar al final del DOMContentLoaded) ---
    if (btnPrev) {
        btnPrev.addEventListener('click', () => {
            if (paginaActual > 1) {
                paginaActual--;
                obtenerDivisas();
            }
        });
    }

    if (btnNext) {
        btnNext.addEventListener('click', () => {
            paginaActual++;
            obtenerDivisas();
        });
    }

    obtenerDivisas();
});