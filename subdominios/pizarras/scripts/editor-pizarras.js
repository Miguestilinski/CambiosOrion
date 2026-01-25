import { initPizarrasHeader } from './header.js'; 

document.addEventListener('DOMContentLoaded', async () => {
    
    try { await initPizarrasHeader(); } catch (e) { console.warn(e); }

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
    
    let deleteTargetId = null; 
    let deleteContext = null; // 'normal' o 'destacada'

    // --- CARGA INICIAL ---
    loadBoard();

    // --- CONFIGURACIÓN DRAG & DROP (SortableJS) ---
    
    // 1. Lista NORMALES (Origen Maestro)
    new Sortable(listNormales, {
        group: {
            name: 'shared',
            pull: 'clone', // IMPORTANTE: Al arrastrar, CLONA, no mueve
            put: false     // No acepta items de vuelta (no puedes mover de destacada a normal)
        },
        animation: 150,
        sort: true, // Permite reordenar la lista normal entre sí misma
        ghostClass: 'sortable-ghost',
        dragClass: 'sortable-drag',
        handle: '.drag-handle',
        onEnd: function (evt) {
            if (evt.to === listNormales) saveOrder(); // Guardar si reordenó normales
        }
    });

    // 2. Lista DESTACADAS (Destino)
    new Sortable(listDestacadas, {
        group: 'shared',
        animation: 150,
        ghostClass: 'sortable-ghost',
        dragClass: 'sortable-drag',
        handle: '.drag-handle',
        onAdd: function (evt) {
            // Verificar duplicados al soltar
            const id = evt.item.dataset.id;
            const items = listDestacadas.querySelectorAll(`.currency-card[data-id="${id}"]`);
            if (items.length > 1) {
                // Ya existe, eliminar el clon recién soltado
                evt.item.remove();
            } else {
                // Es nuevo en destacadas
                saveOrder();
            }
        },
        onUpdate: function () {
            saveOrder(); // Reordenamiento interno
        }
    });

    // --- FUNCIONES ---

    async function loadBoard() {
        try {
            const res = await fetch('https://cambiosorion.cl/data/editor-pizarras.php?action=get_board');
            const data = await res.json();
            
            // Renderizar Normales (Maestro: Muestra TODAS las de la tabla divisas)
            renderList(listNormales, data.normales, 'normal');
            
            // Renderizar Destacadas (Solo las que tienen flag destacada=1)
            renderList(listDestacadas, data.destacadas, 'destacada');
            
            updateCounters();
        } catch (err) {
            console.error(err);
        }
    }

    function renderList(container, items, context) {
        container.innerHTML = '';
        if (!items || items.length === 0) {
            container.innerHTML = `<div class="text-center text-slate-500 py-10 border-2 border-dashed border-slate-700/50 rounded-lg text-xs select-none">Lista vacía</div>`;
            return;
        }

        items.forEach(item => {
            const el = document.createElement('div');
            el.className = "currency-card bg-slate-800/80 hover:bg-slate-700 transition p-3 rounded-lg border border-white/5 flex items-center gap-3 group relative select-none shrink-0";
            el.dataset.id = item.id; 
            
            // Botón eliminar difiere según contexto
            let deleteBtn = '';
            if (context === 'destacada') {
                deleteBtn = `<button class="btn-delete opacity-0 group-hover:opacity-100 transition text-amber-500 hover:bg-amber-500/10 p-2 rounded-lg" title="Quitar de Destacadas"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>`;
            } else {
                deleteBtn = `<button class="btn-delete opacity-0 group-hover:opacity-100 transition text-red-500 hover:bg-red-500/10 p-2 rounded-lg" title="Eliminar de Pizarra"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>`;
            }

            el.innerHTML = `
                <div class="drag-handle cursor-grab text-slate-500 hover:text-white p-2 rounded hover:bg-white/5">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16"></path></svg>
                </div>
                <div class="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center overflow-hidden border border-slate-600 shrink-0">
                    <img src="${item.icono_circular}" class="w-full h-full object-cover" onerror="this.style.display='none'">
                </div>
                <div class="flex-1 min-w-0">
                    <h4 class="font-bold text-sm text-white truncate">${item.nombre}</h4>
                    <div class="flex gap-2 text-[10px] text-slate-400 font-mono">
                        <span>C: $${parseFloat(item.compra)}</span> <span>V: $${parseFloat(item.venta)}</span>
                    </div>
                </div>
                ${deleteBtn}
            `;

            el.querySelector('.btn-delete').onclick = () => {
                deleteTargetId = item.id;
                deleteContext = context;
                
                // Si es destacada, no pedimos confirmación modal, es una acción leve.
                // O podemos pedirla. Para fluidez, quitémoslo directo si es destacada.
                if (context === 'destacada') {
                    // Remover visualmente y guardar
                    el.remove();
                    saveOrder();
                } else {
                    // Si es eliminar de pizarra completa, pedir confirmación
                    modalDelete.classList.remove('hidden');
                }
            };

            container.appendChild(el);
        });
    }

    async function saveOrder() {
        const normalesIds = Array.from(listNormales.querySelectorAll('.currency-card')).map(el => el.dataset.id);
        const destacadasIds = Array.from(listDestacadas.querySelectorAll('.currency-card')).map(el => el.dataset.id);

        try {
            await fetch('https://cambiosorion.cl/data/editor-pizarras.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'update_order',
                    normales: normalesIds,
                    destacadas: destacadasIds
                })
            });
            updateCounters();
        } catch (err) {
            console.error("Error guardando orden:", err);
        }
    }

    // --- AGREGAR DIVISA (Desde Modal) ---
    btnAdd.onclick = async () => {
        modalAdd.classList.remove('hidden');
        searchCandidate.value = '';
        listCandidates.innerHTML = '<div class="text-center py-4 text-slate-400">Cargando...</div>';
        
        try {
            const res = await fetch('https://cambiosorion.cl/data/editor-pizarras.php?action=get_candidates');
            const candidates = await res.json();
            renderCandidates(candidates);
        } catch (err) {
            listCandidates.innerHTML = '<div class="text-center text-red-400">Error</div>';
        }
    };

    function renderCandidates(candidates) {
        listCandidates.innerHTML = '';
        if (!candidates || candidates.length === 0) {
            listCandidates.innerHTML = '<div class="text-center text-slate-500 py-4 text-sm">No hay divisas disponibles para agregar.</div>';
            return;
        }

        candidates.forEach(c => {
            const el = document.createElement('div');
            el.className = "flex items-center gap-3 p-3 hover:bg-slate-800 rounded-lg cursor-pointer border border-transparent hover:border-slate-700 transition candidate-item shrink-0";
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
                alert("Error: " + data.error);
            }
        } catch (err) { console.error(err); }
    }

    // --- ELIMINAR ---
    btnConfirmDelete.onclick = async () => {
        if (!deleteTargetId) return;
        btnConfirmDelete.disabled = true;
        try {
            // Acción delete = Borrar fila de BD
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