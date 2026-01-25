import { initPizarrasHeader } from './header.js'; 

document.addEventListener('DOMContentLoaded', async () => {
    
    try { await initPizarrasHeader('estructura'); } catch (e) { console.warn(e); }

    const listDestacadas = document.getElementById('list-destacadas');
    const listNormales = document.getElementById('list-normales');
    const listStories = document.getElementById('list-stories');
    
    const modalAdd = document.getElementById('modal-add');
    const btnAdd = document.getElementById('btn-add-currency');
    const btnCloseAdd = document.getElementById('close-modal');
    const listCandidates = document.getElementById('list-candidates');
    const searchCandidate = document.getElementById('search-candidate');

    const modalDelete = document.getElementById('modal-delete');
    const btnCancelDelete = document.getElementById('cancel-delete');
    const btnConfirmDelete = document.getElementById('confirm-delete');
    
    let deleteTargetId = null; 

    // --- CARGA INICIAL ---
    loadBoard();

    // --- CONFIGURACIÓN DRAG & DROP ---
    
    const sortableOptions = {
        group: 'shared', 
        animation: 150,
        ghostClass: 'sortable-ghost',
        dragClass: 'sortable-drag',
        handle: '.drag-handle',
        onEnd: function () { saveOrder(); }
    };

    // 1. LISTA GENERAL (ORIGEN - Clonadora)
    new Sortable(listNormales, {
        ...sortableOptions,
        pull: 'clone', // CLAVE: Al sacar, clona. Se mantiene en ambos lados.
        put: false     // No puedes arrastrar cosas "hacia" general, ya están ahí.
    });

    // 2. DEFINICIÓN DE LA FUNCIÓN QUE FALTABA
    const setupTargetList = (element) => {
        new Sortable(element, {
            ...sortableOptions,
            pull: false, // No se sacan arrastrando (se borran con botón)
            put: true,   // Acepta items de General
            onAdd: function (evt) {
                // Evitar duplicados visuales en la misma lista
                const id = evt.item.dataset.id;
                const items = element.querySelectorAll(`.currency-card[data-id="${id}"]`);
                if (items.length > 1) {
                    evt.item.remove(); // Ya estaba, borramos el nuevo clon
                } else {
                    saveOrder();
                }
            },
            onUpdate: function () { saveOrder(); } // Reordenamiento interno
        });
    };

    // 3. APLICAR A LAS LISTAS DE DESTINO
    setupTargetList(listDestacadas);
    setupTargetList(listStories);

    // --- FUNCIONES ---

    async function loadBoard() {
        try {
            const res = await fetch('https://cambiosorion.cl/data/editor-pizarras.php?action=get_board');
            if (!res.ok) throw new Error("Error en servidor");
            const data = await res.json();
            
            renderList(listNormales, data.normales, 'normal');
            renderList(listDestacadas, data.destacadas, 'destacada');
            renderList(listStories, data.stories, 'stories');
            
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
            
            let actionBtn = '';
            // Protección para no borrar CLP
            const esCLP = (item.nombre === 'CLP' || item.id == 99);

            if (!esCLP) {
                if (context === 'destacada') {
                    actionBtn = `<button class="btn-remove opacity-0 group-hover:opacity-100 transition text-amber-500 hover:bg-amber-500/10 p-2 rounded-lg" title="Quitar"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>`;
                } else if (context === 'stories') {
                    actionBtn = `<button class="btn-remove opacity-0 group-hover:opacity-100 transition text-pink-500 hover:bg-pink-500/10 p-2 rounded-lg" title="Quitar"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>`;
                } else {
                    actionBtn = `<button class="btn-delete-global opacity-0 group-hover:opacity-100 transition text-red-500 hover:bg-red-500/10 p-2 rounded-lg" title="Eliminar"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>`;
                }
            } else {
                actionBtn = `<div class="p-2 opacity-30 cursor-not-allowed"><svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg></div>`;
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
                        <span>$${parseFloat(item.compra)}</span> / <span>$${parseFloat(item.venta)}</span>
                    </div>
                </div>
                ${actionBtn}
            `;

            // Eventos seguros
            const btnRemove = el.querySelector('.btn-remove');
            if (btnRemove) {
                btnRemove.onclick = () => { el.remove(); saveOrder(); };
            }
            const btnDelete = el.querySelector('.btn-delete-global');
            if (btnDelete) {
                btnDelete.onclick = () => { deleteTargetId = item.id; document.getElementById('modal-delete').classList.remove('hidden'); };
            }

            container.appendChild(el);
        });
    }

    async function saveOrder() {
        const normales = Array.from(listNormales.querySelectorAll('.currency-card')).map(el => el.dataset.id);
        const destacadas = Array.from(listDestacadas.querySelectorAll('.currency-card')).map(el => el.dataset.id);
        const stories = Array.from(listStories.querySelectorAll('.currency-card')).map(el => el.dataset.id);

        try {
            await fetch('https://cambiosorion.cl/data/editor-pizarras.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'update_order',
                    normales: normales,
                    destacadas: destacadas,
                    stories: stories
                })
            });
            updateCounters();
        } catch (err) { console.error("Error guardando:", err); }
    }

    // --- AGREGAR DIVISA ---
    btnAdd.onclick = async () => {
        modalAdd.classList.remove('hidden');
        listCandidates.innerHTML = '<div class="text-center py-4 text-slate-400">Cargando...</div>';
        try {
            const res = await fetch('https://cambiosorion.cl/data/editor-pizarras.php?action=get_candidates');
            const data = await res.json();
            renderCandidates(data);
        } catch (err) { listCandidates.innerHTML = '<div class="text-center text-red-400">Error</div>'; }
    };

    function renderCandidates(candidates) {
        listCandidates.innerHTML = '';
        if (!candidates || candidates.length === 0) {
            listCandidates.innerHTML = '<div class="text-center text-slate-500 py-4 text-sm">No hay divisas disponibles.</div>';
            return;
        }
        candidates.forEach(c => {
            const el = document.createElement('div');
            el.className = "flex items-center gap-3 p-3 hover:bg-slate-800 rounded-lg cursor-pointer border border-transparent hover:border-slate-700 transition candidate-item shrink-0";
            el.innerHTML = `
                <div class="w-8 h-8 rounded-full bg-slate-950 flex items-center justify-center overflow-hidden shrink-0">
                    <img src="${c.icono}" class="w-full h-full object-cover">
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

    // --- ELIMINAR ---\
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
        } catch (err) { alert("Error al eliminar"); }
        finally { btnConfirmDelete.disabled = false; }
    };

    btnCloseAdd.onclick = () => modalAdd.classList.add('hidden');
    btnCancelDelete.onclick = () => modalDelete.classList.add('hidden');
    
    function updateCounters() {
        document.getElementById('count-destacadas').textContent = listDestacadas.querySelectorAll('.currency-card').length;
        document.getElementById('count-normales').textContent = listNormales.querySelectorAll('.currency-card').length;
        document.getElementById('count-stories').textContent = listStories.querySelectorAll('.currency-card').length;
    }
});