document.addEventListener('DOMContentLoaded', () => {
    // 1. Obtener Sesión ADMIN
    getSession();

    // 2. Elementos
    const nuevaTransaccionBtn = document.getElementById('nueva-tr');
    const tablaTransacciones = document.getElementById('tabla-transacciones');
    const borrarFiltrosBtn = document.getElementById('borrar-filtros');
    const contadorRegistros = document.getElementById('contador-registros');

    // 3. Mapeo de Filtros (IDs coinciden con los inputs en el HTML)
    const filtros = {
        fechaInicio: document.getElementById("fecha-inicio"),
        fechaFin: document.getElementById("fecha-fin"),
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

    // --- SESIÓN ---
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
            console.error(error);
        }
    }

    // --- DATOS ---
    function obtenerTransacciones() {
        const params = new URLSearchParams();

        for (const [clave, input] of Object.entries(filtros)) {
            if (input && input.value) {
                params.set(clave, input.value.trim());
            }
        }

        // Feedback de carga
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

    // --- UTILIDADES ---
    function limpiarTexto(valor) { return valor === null || valor === undefined ? '' : valor; }

    function formatearNumero(numero) {
        if (numero === null || numero === undefined || numero === '') return '';
        return Number(numero).toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    }

    function formatearFechaHora(fechaString) {
        if (!fechaString) return '';
        // Asumiendo formato SQL: YYYY-MM-DD HH:MM:SS
        try {
            const [datePart, timePart] = fechaString.split(' ');
            const [y, m, d] = datePart.split('-');
            const [h, min] = timePart.split(':');
            return `<span class="font-mono text-xs font-bold text-gray-500">${h}:${min}</span> <span class="text-xs">${d}/${m}/${y}</span>`;
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

            // Colores de fila
            if (trx.tipo_transaccion === 'Compra') {
                tr.style.backgroundColor = '#c3e8f1'; 
            } else if (trx.tipo_transaccion === 'Venta') {
                tr.style.backgroundColor = '#dbf599'; 
            } else {
                tr.style.backgroundColor = '#ffffff';
            }

            // Botón VER DETALLE (Mostrar)
            const btnMostrar = document.createElement('button');
            btnMostrar.innerHTML = `
                <svg class="w-5 h-5 text-gray-600 hover:text-cyan-700 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                </svg>
            `;
            btnMostrar.className = 'flex items-center justify-center p-1.5 bg-white/50 rounded-full hover:bg-white shadow-sm border border-transparent hover:border-cyan-300 mx-auto';
            btnMostrar.title = "Ver detalle";
            
            // Redirección
            btnMostrar.addEventListener('click', (e) => {
                e.stopPropagation();
                window.location.href = `detalle-tr?id=${trx.id}`;
            });

            // Badge Estado
            let estadoClass = "bg-gray-100 text-gray-600";
            if(String(trx.estado).toLowerCase() === 'vigente') estadoClass = "bg-green-100 text-green-700 border border-green-200";
            if(String(trx.estado).toLowerCase() === 'anulado') estadoClass = "bg-red-100 text-red-700 border border-red-200";

            tr.innerHTML = `
                <td class="px-2 py-2 whitespace-nowrap text-center">${formatearFechaHora(trx.fecha)}</td>
                <td class="px-2 py-2 font-mono text-xs font-bold text-gray-600">${limpiarTexto(trx.id)}</td>
                <td class="px-2 py-2 font-semibold text-xs truncate max-w-[120px]" title="${limpiarTexto(trx.cliente)}">${limpiarTexto(trx.cliente)}</td>
                <td class="px-2 py-2 text-xs uppercase font-bold text-gray-500">${limpiarTexto(trx.tipo_doc)}</td>
                <td class="px-2 py-2 font-mono text-xs">${limpiarTexto(trx.n_doc)}</td>
                <td class="px-2 py-2 text-xs text-gray-500 max-w-[100px] truncate">${limpiarTexto(trx.n_nota)}</td>
                <td class="px-2 py-2 text-center font-bold uppercase text-xs tracking-wider">${limpiarTexto(trx.tipo_transaccion)}</td>
                <td class="px-2 py-2 text-center font-black text-slate-700 text-xs">${limpiarTexto(trx.divisa)}</td>
                <td class="px-2 py-2 text-right font-mono text-sm">${formatearNumero(trx.monto)}</td>
                <td class="px-2 py-2 text-right font-mono text-xs text-gray-600">${formatearNumero(trx.tasa_cambio)}</td>
                <td class="px-2 py-2 text-right font-bold font-mono text-slate-800 text-sm">${formatearNumero(trx.total)}</td>
                <td class="px-2 py-2 text-center">
                    <span class="px-2 py-0.5 rounded text-[10px] uppercase font-bold ${estadoClass}">${limpiarTexto(trx.estado)}</span>
                </td>
                <td class="px-2 py-2 text-center mostrar-btn-cell"></td>
            `;

            tr.querySelector('.mostrar-btn-cell').appendChild(btnMostrar);
            tablaTransacciones.appendChild(tr);
        });
    }

    // --- EVENTOS ---
    if (borrarFiltrosBtn) {
        borrarFiltrosBtn.addEventListener('click', () => {
            Object.values(filtros).forEach(input => {
                if (input) input.value = '';
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