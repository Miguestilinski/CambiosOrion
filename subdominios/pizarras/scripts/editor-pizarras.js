// Ajusta el nombre de la función de importación según tu archivo header.js
import { initPizarrasHeader } from './header.js'; 

document.addEventListener('DOMContentLoaded', async () => {
    
    // 1. Inicializar Header (Sesión, Menús, etc.)
    // Si tu init espera un ID de página activa, pónselo. Si no, déjalo vacío.
    try {
        await initPizarrasHeader(); 
    } catch (e) {
        console.warn("Header init warning:", e);
    }

    // --- VARIABLES ---
    const listDestacadas = document.getElementById('list-destacadas');
    const listNormales = document.getElementById('list-normales');
    
    const modalAdd = document.getElementById('modal-add');
    const btnAdd = document.getElementById('btn-add-currency');
    const btnCloseAdd = document.getElementById('close-modal');
    const listCandidates = document.getElementById('list-candidates');
    const searchCandidate = document.getElementById('search-candidate');

    const modalDelete = document.getElementById('modal-delete');
    const btnCancelDelete = document.getElementById('cancel-delete');
    const btnConfirmDelete = document.getElementById('confirm-delete');
    let deleteTargetId = null; // ID numérico de la tabla divisas (pizarra)

    // --- INICIALIZACIÓN ---
    loadBoard();

    // Configurar Drag & Drop
    [listDestacadas, listNormales].forEach(list => {
        new Sortable(list, {
            group: 'shared',
            animation: 150,
            ghostClass: 'sortable-ghost',
            dragClass: 'sortable-drag',
            handle: '.drag-handle',
            onEnd: function (evt) {
                saveOrder();
            }
        });
    });

    // --- FUNCIONES ---

    async function loadBoard() {
        try {
            const res = await fetch('https://cambiosorion.cl/data/editor-pizarras.php?action=get_board');
            const data = await res.json();
            
            // Renderizamos usando el ID numérico de la tabla 'divisas' para identificar el elemento
            renderList(listDestacadas, data.destacadas);
            renderList(listNormales, data.normales);
            
            updateCounters();
        } catch (err) {
            console.error(err);
        }
    }

    function renderList(container, items) {
        container.innerHTML = '';
        if (!items || items.length === 0) {
            container.innerHTML = `<div class="text-center text-slate-500 py-10 border-2 border-dashed border-slate-700/50 rounded-lg text-xs select-none">Sin elementos</div>`;
            return;
        }

        items.forEach(item => {
            const el = document.createElement('div');
            el.className = "currency-card bg-slate-800/80 hover:bg-slate-700 transition p-3 rounded-lg border border-white/5 flex items-center gap-3 group relative select-none";
            el.dataset.id = item.id; // Este es el ID numérico de tabla 'divisas'
            
            el.innerHTML = `
                <div class="drag-handle cursor-grab text-slate-500 hover:text-white p-2 rounded hover:bg-white/5">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16"></path></svg>
                </div>
                <div class="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center overflow-hidden border border-slate-600 shrink-0">
                    <img src="${item.icono_circular}" class="w-full h-full object-cover" onerror="this.style.display='none'">
                </div>
                <div class="flex-1 min-w-0">
                    <h4 class="font-bold text-sm text-white truncate">${item.nombre}</h4> <div class="flex gap-2 text-[10px] text-slate-400 font-mono">
                        <span>$${parseFloat(item.compra)}</span> / <span>$${parseFloat(item.venta)}</span>
                    </div>
                </div>
                <button class="btn-delete opacity-0 group-hover:opacity-100 transition text-red-500 hover:bg-red-500/10 p-2 rounded-lg" title="Quitar">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
            `;

            el.querySelector('.btn-delete').onclick = () => {
                deleteTargetId = item.id;
                modalDelete.classList.remove('hidden');
            };

            container.appendChild(el);
        });
    }

    async function saveOrder() {
        const normales = Array.from(listNormales.querySelectorAll('.currency-card')).map(el => el.dataset.id);
        const destacadas = Array.from(listDestacadas.querySelectorAll('.currency-card')).map(el => el.dataset.id);

        try {
            await fetch('https://cambiosorion.cl/data/editor-pizarras.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'update_order',
                    normales: normales,
                    destacadas: destacadas
                })
            });
            updateCounters();
        } catch (err) {
            console.error("Error guardando orden:", err);
        }
    }

    // --- AGREGAR DIVISA ---
    btnAdd.onclick = async () => {
        modalAdd.classList.remove('hidden');
        searchCandidate.value = '';
        listCandidates.innerHTML = '<div class="text-center py-4 text-slate-400"><div class="animate-spin h-6 w-6 border-2 border-indigo-500 rounded-full border-t-transparent mx-auto"></div></div>';
        
        try {
            const res = await fetch('https://cambiosorion.cl/data/editor-pizarras.php?action=get_candidates');
            const candidates = await res.json();
            renderCandidates(candidates);
        } catch (err) {
            listCandidates.innerHTML = '<div class="text-center text-red-400">Error al cargar listado</div>';
        }
    };

    function renderCandidates(candidates) {
        listCandidates.innerHTML = '';
        if (candidates.length === 0) {
            listCandidates.innerHTML = '<div class="text-center text-slate-500 py-4">Todas las divisas activas ya están en la pizarra.</div>';
            return;
        }

        candidates.forEach(c => {
            const el = document.createElement('div');
            el.className = "flex items-center gap-3 p-3 hover:bg-slate-800 rounded-lg cursor-pointer border border-transparent hover:border-slate-700 transition candidate-item";
            // IMPORTANTE: c.codigo es el ISO (USD, EUR) que usaremos para insertar en divisas.nombre
            el.innerHTML = `
                <div class="w-8 h-8 rounded-full bg-slate-950 flex items-center justify-center overflow-hidden shrink-0">
                    <img src="${c.icono}" class="w-full h-full object-cover" onerror="this.style.display='none'">
                </div>
                <div class="flex-1 min-w-0">
                    <h4 class="font-bold text-white text-sm truncate">${c.nombre}</h4>
                    <span class="text-xs text-slate-500 font-mono">${c.codigo}</span>
                </div>
                <button class="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded text-xs font-bold shrink-0">Agregar</button>
            `;
            // Al hacer click enviamos el CÓDIGO ISO
            el.onclick = () => addCurrency(c.codigo);
            listCandidates.appendChild(el);
        });
    }

    searchCandidate.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        document.querySelectorAll('.candidate-item').forEach(el => {
            const text = el.innerText.toLowerCase();
            el.style.display = text.includes(term) ? 'flex' : 'none';
        });
    });

    async function addCurrency(codigoIso) {
        try {
            const res = await fetch('https://cambiosorion.cl/data/editor-pizarras.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'add', codigo: codigoIso })
            });
            const data = await res.json();
            
            if (data.success) {
                modalAdd.classList.add('hidden');
                loadBoard();
            } else {
                alert("Error: " + (data.error || "No se pudo agregar"));
            }
        } catch (err) {
            console.error(err);
        }
    }

    // --- ELIMINAR ---
    btnConfirmDelete.onclick = async () => {
        if (!deleteTargetId) return;
        btnConfirmDelete.disabled = true;
        try {
            await fetch('https://cambiosorion.cl/data/editor-pizarras.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'delete', id: deleteTargetId })
            });
            modalDelete.classList.add('hidden');
            loadBoard();
        } catch (err) {
            alert("Error al eliminar");
        } finally {
            btnConfirmDelete.disabled = false;
        }
    };

    btnCloseAdd.onclick = () => modalAdd.classList.add('hidden');
    btnCancelDelete.onclick = () => modalDelete.classList.add('hidden');
    
    function updateCounters() {
        document.getElementById('count-destacadas').textContent = listDestacadas.querySelectorAll('.currency-card').length;
        document.getElementById('count-normales').textContent = listNormales.querySelectorAll('.currency-card').length;
    }
});