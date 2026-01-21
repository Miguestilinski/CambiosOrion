import { initSystem } from './index.js';

document.addEventListener("DOMContentLoaded", async () => {
    // 1. Init System
    const sessionData = await initSystem('traspasos'); 
    if (!sessionData || !sessionData.isAuthenticated) return;
    const usuarioSesionId = sessionData.equipo_id || sessionData.id;

    // --- REFERENCIAS DOM ---
    const form = document.getElementById("form-nuevo-traspaso");
    
    // Selectores
    const origenSelect = document.getElementById("origen");
    const destinoSelect = document.getElementById("destino");
    
    // Divisa Custom
    const divisaTrigger = document.getElementById("divisa-trigger");
    const divisaIconSelected = document.getElementById("divisa-icon-selected");
    const divisaTextSelected = document.getElementById("divisa-text-selected");
    const listaDivisas = document.getElementById("lista-divisas");
    const divisaIdInput = document.getElementById("divisa-id");

    const montoInput = document.getElementById("monto");
    const obsInput = document.getElementById("observaciones");
    const limpiarBtn = document.getElementById("limpiar");

    let divisasCache = [];

    // --- INICIALIZACIÓN ---
    async function cargarDatos() {
        try {
            // 1. Cajas (Tesorería primero)
            const resCajas = await fetch("https://cambiosorion.cl/data/nuevo-tp.php?buscar_cajas=1");
            const cajas = await resCajas.json();
            
            // Llenar ambos selects
            const llenarSelect = (select) => {
                select.innerHTML = '<option value="">Seleccione Caja</option>';
                if(Array.isArray(cajas)) {
                    cajas.forEach(c => {
                        const opt = document.createElement("option");
                        opt.value = c.id;
                        opt.textContent = c.nombre;
                        select.appendChild(opt);
                    });
                }
            };

            llenarSelect(origenSelect);
            llenarSelect(destinoSelect);

            // Pre-seleccionar caja usuario en Origen
            if(sessionData.caja_id && sessionData.caja_id != 0) origenSelect.value = sessionData.caja_id;
            else if(cajas.length > 0) origenSelect.value = cajas[0].id;

            // 2. Divisas
            const resDiv = await fetch("https://cambiosorion.cl/data/nuevo-tp.php?buscar_divisas=1");
            const dataDiv = await resDiv.json();
            if(Array.isArray(dataDiv)) {
                divisasCache = dataDiv;
                renderizarDropdownDivisas(divisasCache);
                seleccionarDivisaPorDefecto();
            }

        } catch (e) { console.error("Error cargando datos", e); }
    }
    cargarDatos();

    // --- SMART DROPDOWN DIVISAS ---
    function renderizarDropdownDivisas(lista) {
        listaDivisas.innerHTML = '';
        
        // Buscador interno
        const searchContainer = document.createElement('div');
        searchContainer.className = "p-2 sticky top-0 bg-slate-900 border-b border-slate-700 z-50";
        const searchInput = document.createElement('input');
        searchInput.type = "text";
        searchInput.placeholder = "Filtrar...";
        searchInput.className = "w-full bg-slate-800 text-xs text-white rounded p-1.5 border border-slate-600 focus:border-amber-500 outline-none";
        
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const items = listaDivisas.querySelectorAll('.divisa-item');
            items.forEach(item => {
                const txt = item.textContent.toLowerCase();
                item.style.display = txt.includes(term) ? 'flex' : 'none';
            });
        });
        searchContainer.appendChild(searchInput);
        listaDivisas.appendChild(searchContainer);

        lista.forEach(d => {
            const item = document.createElement('div');
            item.className = "dropdown-item divisa-item group";
            item.innerHTML = `
                <img src="${d.icono || 'https://cambiosorion.cl/orionapp/icons/flag_placeholder.png'}" class="w-5 h-5 rounded-full object-cover mr-3 border border-slate-600">
                <span class="flex-1 font-medium group-hover:text-white">${d.nombre}</span>
                <span class="text-xs font-mono text-slate-500 group-hover:text-amber-400">${d.codigo}</span>
            `;
            item.onclick = () => seleccionarDivisa(d);
            listaDivisas.appendChild(item);
        });
    }

    function seleccionarDivisa(d) {
        divisaIdInput.value = d.id;
        divisaTextSelected.textContent = `${d.nombre} (${d.codigo})`;
        divisaTextSelected.className = "font-bold text-white";
        divisaIconSelected.src = d.icono || '';
        divisaIconSelected.classList.remove('hidden');
        listaDivisas.classList.add('hidden');
    }

    function seleccionarDivisaPorDefecto() {
        const clp = divisasCache.find(d => d.codigo === 'CLP');
        if(clp) seleccionarDivisa(clp);
    }

    function toggleDropdownSmart(trigger, dropdown) {
        if (dropdown.classList.contains('hidden')) {
            dropdown.classList.remove('hidden');
            const rect = trigger.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            if (spaceBelow < 260) {
                dropdown.classList.add('bottom-full', 'mb-2');
                dropdown.classList.remove('mt-2');
            } else {
                dropdown.classList.remove('bottom-full', 'mb-2');
                dropdown.classList.add('mt-2');
            }
            // Focus
            const input = dropdown.querySelector('input');
            if(input) setTimeout(() => input.focus(), 50);
        } else {
            dropdown.classList.add('hidden');
        }
    }

    divisaTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleDropdownSmart(divisaTrigger, listaDivisas);
    });

    document.addEventListener('click', (e) => {
        if (!divisaTrigger.contains(e.target) && !listaDivisas.contains(e.target)) listaDivisas.classList.add('hidden');
    });

    // --- LIMPIAR ---
    limpiarBtn.addEventListener('click', () => {
        form.reset();
        divisaIdInput.value = "";
        divisaIconSelected.classList.add('hidden');
        divisaTextSelected.textContent = "Seleccione Divisa...";
        divisaTextSelected.className = "font-medium text-slate-400";
        seleccionarDivisaPorDefecto();
        // Restore default origin
        if(sessionData.caja_id && sessionData.caja_id != 0) origenSelect.value = sessionData.caja_id;
    });

    // --- SUBMIT ---
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const monto = parseFloat(montoInput.value);

        // Validaciones
        if(!origenSelect.value) return mostrarModal({ tipo: 'error', titulo: "Falta Origen", mensaje: "Seleccione caja de origen." });
        if(!destinoSelect.value) return mostrarModal({ tipo: 'error', titulo: "Falta Destino", mensaje: "Seleccione caja de destino." });
        
        if (origenSelect.value === destinoSelect.value) {
            return mostrarModal({ tipo: 'error', titulo: "Error Lógico", mensaje: "La caja de origen y destino no pueden ser la misma." });
        }

        if(!divisaIdInput.value) return mostrarModal({ tipo: 'error', titulo: "Falta Divisa", mensaje: "Seleccione la divisa a transferir." });
        if(isNaN(monto) || monto <= 0) return mostrarModal({ tipo: 'error', titulo: "Monto Inválido", mensaje: "Ingrese un monto mayor a 0." });

        const payload = {
            origen_id: origenSelect.value,
            destino_id: destinoSelect.value,
            divisa_id: divisaIdInput.value,
            monto: monto,
            observaciones: obsInput.value.trim(),
            usuario_id: usuarioSesionId
        };

        try {
            const res = await fetch("https://cambiosorion.cl/data/nuevo-tp.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (data.success) {
                mostrarModal({ 
                    tipo: 'exito', 
                    titulo: "Traspaso Creado", 
                    mensaje: "El traspaso ha sido registrado exitosamente.", 
                    onConfirmar: () => location.reload() 
                });
            } else {
                mostrarModal({ tipo: 'error', titulo: "Error", mensaje: data.error || "No se pudo procesar el traspaso." });
            }
        } catch(err) {
            mostrarModal({ tipo: 'error', titulo: "Error Conexión", mensaje: "Fallo de comunicación con el servidor." });
        }
    });

    function mostrarModal({ tipo = 'info', titulo, mensaje, onConfirmar }) {
        const modal = document.getElementById("modal-generico");
        const iconoDiv = document.getElementById("modal-generico-icono");
        const btnConfirmar = document.getElementById("modal-generico-confirmar");

        const iconos = {
            'exito': `<div class="p-3 rounded-full bg-green-900/30 border border-green-500/30"><svg class="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg></div>`,
            'error': `<div class="p-3 rounded-full bg-red-900/30 border border-red-500/30"><svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></div>`
        };

        iconoDiv.innerHTML = iconos[tipo] || '';
        document.getElementById("modal-generico-titulo").textContent = titulo;
        document.getElementById("modal-generico-mensaje").textContent = mensaje;
        
        modal.classList.remove("hidden");
        const newBtn = btnConfirmar.cloneNode(true);
        btnConfirmar.parentNode.replaceChild(newBtn, btnConfirmar);
        newBtn.onclick = () => { modal.classList.add("hidden"); if(onConfirmar) onConfirmar(); };
    }
});