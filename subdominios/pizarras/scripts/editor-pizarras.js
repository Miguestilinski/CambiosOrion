import { initPizarrasHeader } from './header.js'; 

document.addEventListener('DOMContentLoaded', async () => {
    
    try { await initPizarrasHeader('editor'); } catch (e) { console.warn(e); }

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

    // --- ELEMENTOS MÓVIL ---
    const tabButtons = document.querySelectorAll('.tab-btn');
    const mobileCols = document.querySelectorAll('.mobile-col');
    
    const ctxMenu = document.getElementById('mobile-context-menu');
    const ctxSheet = document.getElementById('ctx-sheet');
    const ctxBackdrop = document.getElementById('ctx-backdrop');
    const btnCtxClose = document.getElementById('btn-ctx-close');

    // Toggles del menú
    const toggleDestacada = document.getElementById('toggle-destacada');
    const toggleStories = document.getElementById('toggle-stories');
    const btnCtxRemove = document.getElementById('btn-ctx-remove');
    const divCtxGeneral = document.getElementById('ctx-options-general');
    const divCtxRemove = document.getElementById('ctx-options-remove');
    
    let deleteTargetId = null; 
    let currentCtxItem = null;

    // --- CARGA INICIAL ---
    loadBoard();
    initMobileTabs();

    // --- CONFIGURACIÓN DRAG & DROP ---
    
    const baseOptions = {
        animation: 150,
        ghostClass: 'sortable-ghost',
        dragClass: 'sortable-drag',
        handle: '.drag-handle',
        onEnd: function () { saveOrder(); }
    };

    // 1. LISTA GENERAL (ORIGEN - Clonadora)
    new Sortable(listNormales, {
        ...baseOptions,
        group: {
            name: 'shared',
            pull: 'clone', // ¡AQUÍ ESTABA EL DETALLE! Debe ir dentro de group
            put: false     // No acepta devoluciones
        },
        sort: true
    });

    // 2. LISTAS DE DESTINO (Receptoras)
    const setupTargetList = (element) => {
        new Sortable(element, {
            ...baseOptions,
            group: {
                name: 'shared',
                pull: false, // No se sacan arrastrando (se borran con botón)
                put: true    // Aceptan items
            },
            onAdd: function (evt) {
                // Evitar duplicados visuales: si ya existe el ID, borramos el clon
                const id = evt.item.dataset.id;
                const items = element.querySelectorAll(`.currency-card[data-id="${id}"]`);
                if (items.length > 1) {
                    evt.item.remove(); 
                } else {
                    saveOrder();
                }
            },
            onUpdate: function () { saveOrder(); }
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
            // Agregamos cursor-pointer para indicar click en móvil
            el.className = "currency-card bg-slate-800/80 hover:bg-slate-700 transition p-3 rounded-lg border border-white/5 flex items-center gap-3 group relative select-none shrink-0 cursor-pointer lg:cursor-default";
            el.dataset.id = item.id; 
            // Guardamos datos crudos para usarlos en el modal móvil
            el.dataset.json = JSON.stringify(item); 
            
            let actionBtn = '';
            // Protección para no borrar CLP
            const esCLP = (item.nombre === 'CLP' || item.id == 99);

            // Botones de escritorio (solo visibles en LG gracias a CSS o comportamiento)
            // En móvil usaremos el Modal, pero dejaremos los botones por si acaso, 
            // aunque el click en la tarjeta tendrá prioridad en móvil.
            if (!esCLP) {
                if (context === 'destacada') {
                    actionBtn = `<button class="btn-remove hidden lg:block opacity-0 group-hover:opacity-100 transition text-amber-500 hover:bg-amber-500/10 p-2 rounded-lg" title="Quitar"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>`;
                } else if (context === 'stories') {
                    actionBtn = `<button class="btn-remove hidden lg:block opacity-0 group-hover:opacity-100 transition text-pink-500 hover:bg-pink-500/10 p-2 rounded-lg" title="Quitar"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>`;
                } else {
                    actionBtn = `<button class="btn-delete-global hidden lg:block opacity-0 group-hover:opacity-100 transition text-red-500 hover:bg-red-500/10 p-2 rounded-lg" title="Eliminar"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>`;
                }
            } else {
                actionBtn = `<div class="p-2 opacity-30 cursor-not-allowed hidden lg:block"><svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg></div>`;
            }

            el.innerHTML = `
                <div class="drag-handle cursor-grab text-slate-500 hover:text-white p-2 rounded hover:bg-white/5 touch-none">
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

            // EVENTOS DE CLICK
            // En móvil, click en la tarjeta abre el menú. En escritorio, no hace nada (solo los botones).
            el.addEventListener('click', (e) => {
                // Si es click en botón o handle, ignoramos
                if (e.target.closest('button') || e.target.closest('.drag-handle')) return;
                
                // Solo activamos en pantallas móbiles (< 1024px)
                if (window.innerWidth < 1024) {
                    openMobileMenu(item, context);
                }
            });

            // Eventos botones escritorio
            const btnRemove = el.querySelector('.btn-remove');
            if (btnRemove) btnRemove.onclick = (e) => { e.stopPropagation(); el.remove(); saveOrder(); };
            
            const btnDelete = el.querySelector('.btn-delete-global');
            if (btnDelete) btnDelete.onclick = (e) => { e.stopPropagation(); deleteTargetId = item.id; document.getElementById('modal-delete').classList.remove('hidden'); };

            container.appendChild(el);
        });
    }

    // --- LÓGICA TABS MÓVIL ---
    function initMobileTabs() {
        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                // 1. Activar botón visualmente
                tabButtons.forEach(b => {
                    b.classList.remove('text-indigo-400', 'border-indigo-500');
                    b.classList.add('text-slate-400', 'border-transparent');
                });
                btn.classList.add('text-indigo-400', 'border-indigo-500');
                btn.classList.remove('text-slate-400', 'border-transparent');

                // 2. Mostrar columna correspondiente
                const targetId = btn.dataset.target;
                mobileCols.forEach(col => {
                    if (col.id === targetId) {
                        col.classList.remove('hidden');
                        col.classList.add('flex');
                    } else {
                        col.classList.add('hidden');
                        col.classList.remove('flex');
                    }
                });
            });
        });
        
        // Activar la primera pestaña por defecto
        if(tabButtons.length > 0) tabButtons[0].click();
    }

    // --- LÓGICA MENÚ CONTEXTUAL MÓVIL ---
    function openMobileMenu(item, context) {
        currentCtxItem = item;
        
        // 1. Rellenar datos
        document.getElementById('ctx-img').src = item.icono_circular;
        document.getElementById('ctx-name').textContent = item.nombre;
        
        // 2. Configurar vistas según contexto
        if (context === 'normal') {
            divCtxGeneral.classList.remove('hidden');
            divCtxRemove.classList.add('hidden');
            
            // Verificar estados actuales
            const isInDestacadas = !!listDestacadas.querySelector(`.currency-card[data-id="${item.id}"]`);
            const isInStories = !!listStories.querySelector(`.currency-card[data-id="${item.id}"]`);
            
            toggleDestacada.checked = isInDestacadas;
            toggleStories.checked = isInStories;

        } else {
            // Si estamos en Destacadas o Stories, mostramos botón de borrar
            divCtxGeneral.classList.add('hidden');
            divCtxRemove.classList.remove('hidden');
            
            const btnText = document.querySelector('#btn-ctx-remove');
            btnText.innerHTML = `
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                Quitar de ${context === 'destacada' ? 'Destacadas' : 'Stories'}
            `;
            
            // Asignar acción de borrado específica
            btnCtxRemove.onclick = () => {
                const list = context === 'destacada' ? listDestacadas : listStories;
                const card = list.querySelector(`.currency-card[data-id="${item.id}"]`);
                if (card) {
                    card.remove();
                    saveOrder();
                    closeMobileMenu();
                }
            };
        }

        // 3. Mostrar menú con animación
        ctxMenu.classList.remove('hidden');
        // Pequeño timeout para permitir transición CSS
        setTimeout(() => {
            ctxBackdrop.classList.remove('opacity-0');
            ctxSheet.classList.remove('translate-y-full');
        }, 10);
    }

    function closeMobileMenu() {
        ctxBackdrop.classList.add('opacity-0');
        ctxSheet.classList.add('translate-y-full');
        setTimeout(() => {
            ctxMenu.classList.add('hidden');
        }, 300);
    }

    // Eventos del menú móvil
    btnCtxClose.onclick = closeMobileMenu;
    ctxBackdrop.onclick = closeMobileMenu;

    // Manejadores de Toggles (General -> Otras listas)
    const handleToggle = (checkbox, targetList) => {
        if (!currentCtxItem) return;
        
        if (checkbox.checked) {
            // AGREGAR: Clonamos visualmente creando una nueva card
            // Nota: Podríamos usar renderList para una sola card, pero es complejo.
            // Truco: Forzamos una recarga rápida o clonamos manualmente.
            // Vamos a clonar manualmente usando el JSON guardado
            const dummyContainer = document.createElement('div');
            renderList(dummyContainer, [currentCtxItem], targetList === listDestacadas ? 'destacada' : 'stories');
            const newCard = dummyContainer.firstElementChild;
            targetList.appendChild(newCard);
        } else {
            // QUITAR
            const card = targetList.querySelector(`.currency-card[data-id="${currentCtxItem.id}"]`);
            if (card) card.remove();
        }
        saveOrder();
    };

    toggleDestacada.onchange = () => handleToggle(toggleDestacada, listDestacadas);
    toggleStories.onchange = () => handleToggle(toggleStories, listStories);

    // --- GUARDADO ---
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
        
        // Actualizar badges en tabs (punto de color si hay items)
        document.getElementById('badge-normales').classList.toggle('hidden', listNormales.children.length === 0);
        document.getElementById('badge-destacadas').classList.toggle('hidden', listDestacadas.children.length === 0);
        document.getElementById('badge-stories').classList.toggle('hidden', listStories.children.length === 0);
    }
});