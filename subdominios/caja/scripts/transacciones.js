document.addEventListener('DOMContentLoaded', () => {
    // 1. Iniciar Sesión y Sidebar
    getSession();
    cargarSidebar();

    const nuevaTransaccionBtn = document.getElementById('nueva-tr');
    const tablaTransacciones = document.getElementById('tabla-transacciones');
    const borrarFiltrosBtn = document.getElementById('borrar-filtros');
    const contadorRegistros = document.getElementById('contador-registros');

    // Mapeo de Filtros
    const filtros = {
        fechaInicio: document.getElementById("fecha-inicio"),
        fechaFin: document.getElementById("fecha-fin"),
        emitidas: document.getElementById("emitidas"),
        noEmitidas: document.getElementById("no-emitidas"),
        numero: document.getElementById("numero"),
        cliente: document.getElementById("cliente"),
        tipoDoc: document.getElementById("tipo-doc"),
        nDoc: document.getElementById("n-doc"),
        nNota: document.getElementById("n-nota"),
        tipoTransaccion: document.getElementById("tipo-transaccion"),
        divisa: document.getElementById("divisa"),
        estado: document.getElementById("estado"),
        mostrar: document.getElementById("mostrar-registros")
    };

    if (nuevaTransaccionBtn) {
        nuevaTransaccionBtn.addEventListener('click', () => {
            window.location.href = 'https://caja.cambiosorion.cl/nueva-tr';
        });
    }

    // --- SIDEBAR ---
    function cargarSidebar() {
        fetch('sidebar.html')
            .then(response => response.text())
            .then(html => {
                const container = document.getElementById('sidebar-container');
                if (container) {
                    container.innerHTML = html;
                    activarLinkSidebar('transacciones');
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

    // --- SESIÓN ADMIN ---
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

    // --- DATOS ---
    function obtenerTransacciones() {
        const params = new URLSearchParams();

        for (const [clave, input] of Object.entries(filtros)) {
            if (!input) continue; // Por seguridad si falta alguno (ej: n-nota oculto)
            
            if (input.type === "checkbox") {
                if (input.checked) params.set(clave, '1');
            } else if (input.value) {
                params.set(clave, input.value.trim());
            }
        }

        tablaTransacciones.innerHTML = `<tr><td colspan="13" class="text-center py-10"><div class="animate-spin h-8 w-8 border-4 border-cyan-500 rounded-full border-t-transparent mx-auto"></div></td></tr>`;

        fetch(`https://cambiosorion.cl/data/transacciones.php?${params.toString()}`)
            .then(response => response.json())
            .then(data => {
                mostrarResultados(data);
                if(contadorRegistros) contadorRegistros.textContent = `${data.length} registros encontrados`;
            })
            .catch(error => {
                console.error('Error:', error);
                tablaTransacciones.innerHTML = `<tr><td colspan="13" class="text-center py-4 text-red-500">Error al cargar datos.</td></tr>`;
            });
    }

    function limpiarTexto(valor) { return valor === null || valor === undefined ? '' : valor; }

    function formatearNumero(numero) {
        if (numero === null || numero === undefined || numero === '') return '';
        return Number(numero).toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    }

    function formatearFechaHora(fechaString) {
        if (!fechaString) return '';
        // Entrada esperada: YYYY-MM-DD HH:MM:SS
        try {
            const [datePart, timePart] = fechaString.split(' ');
            const [y, m, d] = datePart.split('-');
            const [h, min] = timePart.split(':');
            // Salida: HH:mm dd/mm/aaaa
            return `<div class="flex flex-col"><span class="font-mono font-bold text-gray-600">${h}:${min}</span><span class="text-gray-400 text-[10px]">${d}/${m}/${y}</span></div>`;
        } catch (e) {
            return fechaString;
        }
    }

    function mostrarResultados(transacciones) {
        tablaTransacciones.innerHTML = '';

        if (!transacciones || transacciones.length === 0) {
            tablaTransacciones.innerHTML = `<tr><td colspan="13" class="text-center py-10 text-gray-500 italic">No se encontraron resultados.</td></tr>`;
            return;
        }

        transacciones.forEach(trx => {
            const tr = document.createElement('tr');
            tr.className = 'hover:brightness-95 transition-all text-gray-800 font-medium border-b border-gray-100 last:border-0';

            // Colores
            if (trx.tipo_transaccion === 'Compra') {
                tr.style.backgroundColor = '#c3e8f1'; 
            } else if (trx.tipo_transaccion === 'Venta') {
                tr.style.backgroundColor = '#dbf599'; 
            } else {
                tr.style.backgroundColor = '#ffffff';
            }

            // Botón VER DETALLE
            const btnMostrar = document.createElement('button');
            btnMostrar.innerHTML = `
                <svg class="w-5 h-5 text-gray-600 hover:text-cyan-700 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                </svg>
            `;
            btnMostrar.className = 'flex items-center justify-center p-1.5 bg-white/50 rounded-full hover:bg-white shadow-sm border border-transparent hover:border-cyan-300 mx-auto';
            btnMostrar.title = "Ver detalle";
            
            btnMostrar.addEventListener('click', (e) => {
                e.stopPropagation();
                window.location.href = `detalle-tr?id=${trx.id}`;
            });

            // Badge Estado
            let estadoClass = "bg-gray-100 text-gray-600";
            if(String(trx.estado).toLowerCase() === 'vigente') estadoClass = "bg-green-100 text-green-700 border border-green-200";
            if(String(trx.estado).toLowerCase() === 'anulado') estadoClass = "bg-red-100 text-red-700 border border-red-200";

            tr.innerHTML = `
                <td class="px-4 py-3 whitespace-nowrap">${formatearFechaHora(trx.fecha)}</td>
                <td class="px-4 py-3 font-mono text-xs font-bold text-gray-600">${limpiarTexto(trx.id)}</td>
                <td class="px-4 py-3 font-semibold text-xs truncate max-w-[140px]" title="${limpiarTexto(trx.cliente)}">${limpiarTexto(trx.cliente)}</td>
                <td class="px-4 py-3 text-xs uppercase font-bold text-gray-500">${limpiarTexto(trx.tipo_doc)}</td>
                <td class="px-4 py-3 font-mono text-xs">${limpiarTexto(trx.n_doc)}</td>
                <td class="px-4 py-3 text-xs text-gray-500 max-w-[100px] truncate" title="${limpiarTexto(trx.n_nota)}">${limpiarTexto(trx.n_nota)}</td>
                <td class="px-4 py-3 text-center font-bold uppercase text-xs tracking-wider">${limpiarTexto(trx.tipo_transaccion)}</td>
                <td class="px-4 py-3 text-center font-black text-slate-700 text-xs">${limpiarTexto(trx.divisa)}</td>
                <td class="px-4 py-3 text-right font-mono text-sm">${formatearNumero(trx.monto)}</td>
                <td class="px-4 py-3 text-right font-mono text-xs text-gray-600">${formatearNumero(trx.tasa_cambio)}</td>
                <td class="px-4 py-3 text-right font-bold font-mono text-slate-800 text-sm">${formatearNumero(trx.total)}</td>
                <td class="px-4 py-3 text-center">
                    <span class="px-2 py-0.5 rounded text-[10px] uppercase font-bold ${estadoClass}">${limpiarTexto(trx.estado)}</span>
                </td>
                <td class="px-4 py-3 text-center mostrar-btn-cell"></td>
            `;

            tr.querySelector('.mostrar-btn-cell').appendChild(btnMostrar);
            tablaTransacciones.appendChild(tr);
        });
    }

    // --- EVENTOS ---
    if (borrarFiltrosBtn) {
        borrarFiltrosBtn.addEventListener('click', () => {
            Object.values(filtros).forEach(input => {
                if(!input) return;
                if(input.type === 'checkbox') input.checked = false;
                else input.value = '';
            });
            if(filtros.mostrar) filtros.mostrar.value = '25';
            obtenerTransacciones();
        });
    }

    Object.values(filtros).forEach(input => {
        if(input) {
            input.addEventListener('input', obtenerTransacciones);
            input.addEventListener('change', obtenerTransacciones);
        }
    });

    // Cargar inicial
    obtenerTransacciones();
});