import { initSystem } from './index.js';

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Inicializar sistema
    await initSystem('divisas');

    // Referencias DOM
    const mostrarRegistros = document.getElementById('mostrar-registros');
    const buscarInput = document.getElementById('buscar');
    const paisInput = document.getElementById('pais');
    const tipoInput = document.getElementById('tipo');
    
    const tablaBody = document.getElementById('tabla-body');
    const nuevaDivisaBtn = document.getElementById('nueva-divisa');
    const borrarFiltrosBtn = document.getElementById('borrar-filtros');

    const conteoTexto = document.getElementById('conteo-texto');
    const totalBadge = document.getElementById('total-badge');
    const paginacionContainer = document.getElementById('paginacion-container');
    
    let paginaActual = 1;

    // Navegación
    if (nuevaDivisaBtn) {
        nuevaDivisaBtn.addEventListener('click', () => {
            window.location.href = 'https://tesoreria.cambiosorion.cl/nueva-div';
        });
    }

    // --- FUNCIÓN PRINCIPAL DE CARGA ---
    function obtenerDivisas() {
        const limit = mostrarRegistros.value;
        const params = new URLSearchParams();
        
        params.set('page', paginaActual);
        params.set('limit', limit);
        if(buscarInput.value) params.set('buscar', buscarInput.value);
        if(paisInput.value) params.set('pais', paisInput.value);
        if(tipoInput.value) params.set('tipo', tipoInput.value);

        // Feedback de carga
        tablaBody.innerHTML = `
            <tr class="animate-pulse">
                <td colspan="7" class="px-6 py-8 text-center text-slate-500">
                    <div class="flex justify-center items-center gap-2">
                        <svg class="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                        Cargando datos...
                    </div>
                </td>
            </tr>`;

        fetch(`https://cambiosorion.cl/data/divisas-int.php?${params.toString()}`)
            .then(res => res.json())
            .then(data => {
                if (data.error) throw new Error(data.error);
                renderTabla(data.data);
                renderPaginacion(data.page, data.totalPages);
                conteoTexto.textContent = `Mostrando ${data.data.length} de ${data.total} registros`;
                totalBadge.textContent = data.total;
            })
            .catch(err => {
                console.error(err);
                tablaBody.innerHTML = `<tr><td colspan="7" class="px-6 py-4 text-center text-red-400">Error cargando datos.</td></tr>`;
                mostrarModal({ tipo: 'error', titulo: "Error", mensaje: "No se pudieron cargar las divisas." });
            });
    }

    // --- RENDERIZADO ---
    function renderTabla(divisas) {
        tablaBody.innerHTML = '';

        if (divisas.length === 0) {
            tablaBody.innerHTML = `<tr><td colspan="7" class="px-6 py-8 text-center text-slate-500 italic">No se encontraron divisas con estos filtros.</td></tr>`;
            return;
        }

        divisas.forEach(divisa => {
            const tr = document.createElement('tr');
            tr.className = "bg-slate-900 border-b border-slate-800 hover:bg-slate-800 transition";

            // Icono
            let iconoHtml = `<div class="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500 text-xs">?</div>`;
            if(divisa.icono) {
                iconoHtml = `<img src="${divisa.icono}" alt="${divisa.codigo}" class="w-8 h-8 rounded-full border border-slate-600 object-cover bg-slate-800">`;
            }

            // Estado
            const estadoActivo = divisa.estado == 1;
            const estadoBadge = estadoActivo 
                ? `<span class="bg-green-900/40 text-green-300 text-xs font-bold px-2.5 py-0.5 rounded border border-green-500/30">Activa</span>` 
                : `<span class="bg-red-900/40 text-red-300 text-xs font-bold px-2.5 py-0.5 rounded border border-red-500/30">Inactiva</span>`;

            tr.innerHTML = `
                <td class="px-6 py-4">${iconoHtml}</td>
                <td class="px-6 py-4">
                    <div class="flex items-center gap-2">
                        <span class="font-bold text-amber-500 text-sm font-mono bg-amber-900/20 px-1.5 rounded border border-amber-500/20">${divisa.codigo}</span>
                        <span class="text-slate-400 font-mono">${divisa.simbolo}</span>
                    </div>
                </td>
                <td class="px-6 py-4 font-medium text-white">${divisa.nombre}</td>
                <td class="px-6 py-4 text-slate-300">${divisa.pais}</td>
                <td class="px-6 py-4 text-slate-400 capitalize">${divisa.tipo_divisa}</td>
                <td class="px-6 py-4 text-center">${estadoBadge}</td>
                <td class="px-6 py-4 text-center">
                    <button class="text-slate-400 hover:text-white transition" onclick="alert('Funcionalidad de edición pendiente')">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                    </button>
                </td>
            `;
            tablaBody.appendChild(tr);
        });
    }

    function renderPaginacion(pagina, totalPaginas) {
        paginacionContainer.innerHTML = '';
        if(totalPaginas <= 1) return;

        const crearBtn = (texto, disabled, onClick) => {
            const btn = document.createElement('button');
            btn.innerHTML = texto; // Permitir HTML para flechas
            btn.disabled = disabled;
            btn.className = `px-3 py-1.5 text-xs font-medium rounded-lg border transition ${disabled ? 'bg-slate-800 text-slate-600 border-slate-700 cursor-not-allowed' : 'bg-slate-800 text-slate-300 border-slate-600 hover:bg-slate-700 hover:text-white hover:border-amber-500'}`;
            if(!disabled) btn.addEventListener('click', onClick);
            return btn;
        };

        paginacionContainer.appendChild(crearBtn('<', pagina === 1, () => cambioPagina(pagina - 1)));
        
        const span = document.createElement('span');
        span.className = "text-xs font-bold text-slate-400 px-2";
        span.textContent = `${pagina} / ${totalPaginas}`;
        paginacionContainer.appendChild(span);
        
        paginacionContainer.appendChild(crearBtn('>', pagina === totalPaginas, () => cambioPagina(pagina + 1)));
    }

    function cambioPagina(p) {
        paginaActual = p;
        obtenerDivisas();
    }

    // --- FILTROS ---
    const inputs = [buscarInput, paisInput, tipoInput, mostrarRegistros];
    inputs.forEach(input => {
        input.addEventListener('input', () => {
            paginaActual = 1;
            obtenerDivisas();
        });
    });

    if (borrarFiltrosBtn) {
        borrarFiltrosBtn.addEventListener('click', () => {
            buscarInput.value = '';
            paisInput.value = '';
            tipoInput.value = '';
            mostrarRegistros.value = '25';
            paginaActual = 1;
            obtenerDivisas();
        });
    }

    // --- MODAL GENERICO ---
    function mostrarModal({ tipo = 'info', titulo, mensaje, textoConfirmar = "Aceptar", textoCancelar = null, onConfirmar, onCancelar }) {
        const modal = document.getElementById("modal-generico");
        const iconoDiv = document.getElementById("modal-generico-icono");
        const btnConfirmar = document.getElementById("modal-generico-confirmar");
        const btnCancelar = document.getElementById("modal-generico-cancelar");

        const iconos = {
            'exito': `<div class="p-3 rounded-full bg-green-900/30 border border-green-500/30"><svg class="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg></div>`,
            'error': `<div class="p-3 rounded-full bg-red-900/30 border border-red-500/30"><svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></div>`,
            'info': ''
        };

        if(iconoDiv) iconoDiv.innerHTML = iconos[tipo] || '';
        document.getElementById("modal-generico-titulo").textContent = titulo;
        document.getElementById("modal-generico-mensaje").textContent = mensaje;
        
        btnConfirmar.textContent = textoConfirmar;
        if (textoCancelar) {
            btnCancelar.classList.remove("hidden");
            btnCancelar.textContent = textoCancelar;
        } else {
            btnCancelar.classList.add("hidden");
        }
        modal.classList.remove("hidden");

        const newConfirm = btnConfirmar.cloneNode(true);
        const newCancel = btnCancelar.cloneNode(true);
        btnConfirmar.parentNode.replaceChild(newConfirm, btnConfirmar);
        btnCancelar.parentNode.replaceChild(newCancel, btnCancelar);

        newConfirm.onclick = () => { modal.classList.add("hidden"); if (onConfirmar) onConfirmar(); };
        newCancel.onclick = () => { modal.classList.add("hidden"); if (onCancelar) onCancelar(); };
    }

    // Carga inicial
    obtenerDivisas();
});