import { initCajaHeader } from './header.js';

document.addEventListener('DOMContentLoaded', async () => {
    
    // 1. Init
    const sessionData = await initCajaHeader('ingresos');
    
    if (!sessionData || !sessionData.caja_id) {
        mostrarErrorModal("Error de Sesión", "Sin caja asignada para operar.");
        document.getElementById('btn-guardar').disabled = true;
    }

    // 2. Referencias DOM
    const inputs = {
        tipo: document.getElementById('tipo-ingreso'),
        cliente: document.getElementById('cliente-input'),
        clienteId: document.getElementById('cliente_id'),
        obs: document.getElementById('observaciones'),
        divisaId: document.getElementById('divisa_id'),
        monto: document.getElementById('monto')
    };

    const ui = {
        resCliente: document.getElementById('resultados-cliente'),
        divisaTrigger: document.getElementById('divisa-trigger'),
        divisaDropdown: document.getElementById('divisa-dropdown'),
        divisaIconContainer: document.getElementById('divisa-icon-container'),
        divisaTextSelected: document.getElementById('divisa-text-selected'),
        btnGuardar: document.getElementById('btn-guardar'),
        modalExito: document.getElementById('modal-exito'),
        modalError: document.getElementById('modal-error')
    };

    const svgPlaceholder = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;

    // --- CARGAR DIVISAS ---
    cargarDivisasCustom();

    function cargarDivisasCustom() {
        fetch('https://cambiosorion.cl/data/nuevo-ing-caja.php?action=get_divisas')
            .then(res => res.json())
            .then(data => {
                ui.divisaDropdown.innerHTML = ''; 
                if (Array.isArray(data)) {
                    data.forEach(d => {
                        const item = document.createElement('div');
                        item.className = "flex items-center gap-3 px-4 py-3 hover:bg-emerald-50 cursor-pointer border-b border-gray-100 last:border-0 transition-colors";
                        
                        const img = document.createElement('img');
                        img.className = "w-full h-full object-contain rounded-full";
                        img.src = d.icono_final; 
                        img.onerror = function() {
                            this.style.display = 'none';
                            this.parentElement.innerHTML = svgPlaceholder;
                            this.parentElement.classList.add('text-gray-300');
                        };

                        const iconWrapper = document.createElement('div');
                        iconWrapper.className = "w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center p-0.5 shrink-0";
                        if(!d.icono_final) {
                            iconWrapper.innerHTML = svgPlaceholder;
                            iconWrapper.classList.add('text-gray-300');
                        } else {
                            iconWrapper.appendChild(img);
                        }

                        const textWrapper = document.createElement('div');
                        textWrapper.className = "flex flex-col";
                        textWrapper.innerHTML = `
                            <span class="text-sm font-bold text-slate-700">${d.nombre_real}</span>
                            <span class="text-[10px] text-slate-400 font-mono">${d.codigo_iso}</span>
                        `;

                        item.appendChild(iconWrapper);
                        item.appendChild(textWrapper);

                        item.onclick = () => {
                            inputs.divisaId.value = d.id_maestro; // D99
                            
                            ui.divisaIconContainer.innerHTML = '';
                            const selectedIcon = iconWrapper.cloneNode(true);
                            if(selectedIcon.querySelector('img')) {
                                selectedIcon.querySelector('img').onerror = function() {
                                    this.style.display = 'none';
                                    this.parentElement.innerHTML = svgPlaceholder;
                                };
                            }
                            selectedIcon.className = "w-full h-full flex items-center justify-center";
                            ui.divisaIconContainer.appendChild(selectedIcon);
                            ui.divisaIconContainer.classList.remove('text-gray-300');

                            ui.divisaTextSelected.textContent = d.nombre_real;
                            ui.divisaTextSelected.className = "text-slate-800 font-bold";
                            
                            ui.divisaDropdown.classList.add('hidden');
                        };
                        ui.divisaDropdown.appendChild(item);
                    });
                }
            })
            .catch(err => console.error(err));
    }

    // --- DROPDOWN EVENTS ---
    ui.divisaTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        ui.divisaDropdown.classList.toggle('hidden');
    });
    document.addEventListener('click', (e) => {
        if (!ui.divisaTrigger.contains(e.target) && !ui.divisaDropdown.contains(e.target)) {
            ui.divisaDropdown.classList.add('hidden');
        }
        if (!inputs.cliente.contains(e.target) && !ui.resCliente.contains(e.target)) {
            ui.resCliente.classList.add('hidden');
        }
    });

    // --- FORMATO MONTO ---
    inputs.monto.addEventListener('input', function(e) {
        let val = this.value.replace(/\D/g, '');
        this.value = val.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    });

    // --- BUSCADOR CLIENTE ---
    inputs.cliente.addEventListener('input', async (e) => {
        const q = e.target.value;
        if (q.length < 2) { ui.resCliente.classList.add('hidden'); return; }
        try {
            const res = await fetch(`https://cambiosorion.cl/data/nuevo-ing-caja.php?action=search_client&q=${encodeURIComponent(q)}`);
            const data = await res.json();
            ui.resCliente.innerHTML = '';
            if (data.length > 0) {
                ui.resCliente.classList.remove('hidden');
                data.forEach(c => {
                    const div = document.createElement('div');
                    div.className = "px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-gray-100 flex justify-between items-center";
                    div.innerHTML = `<span class="font-bold text-slate-700 text-sm">${c.razon_social}</span><span class="text-xs text-slate-400 font-mono bg-slate-100 px-2 py-0.5 rounded">${c.rut || 'S/RUT'}</span>`;
                    div.onclick = () => {
                        inputs.cliente.value = c.razon_social;
                        inputs.clienteId.value = c.id;
                        ui.resCliente.classList.add('hidden');
                    };
                    ui.resCliente.appendChild(div);
                });
            } else { ui.resCliente.classList.add('hidden'); }
        } catch (err) { console.error(err); }
    });

    // --- SUBMIT ---
    document.getElementById('form-nuevo-ing').addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!inputs.divisaId.value) { mostrarErrorModal("Faltan Datos", "Seleccione una Divisa"); return; }
        
        const monto = parseFloat(inputs.monto.value.replace(/\./g, ''));
        if (!monto || monto <= 0) { mostrarErrorModal("Monto Inválido", "Ingrese un monto mayor a cero"); return; }

        ui.btnGuardar.disabled = true;
        ui.btnGuardar.innerHTML = "Guardando...";

        const payload = {
            action: 'create',
            caja_id: sessionData.caja_id,
            usuario_id: sessionData.id, 
            tipo_ingreso: inputs.tipo.value, // Efectivo / Cuenta
            cliente_id: inputs.clienteId.value || null,
            // Importante: No existe 'nombre_cliente_manual' en la tabla, solo cliente_id.
            // Si el cliente no existe, observaciones es el lugar para poner info extra.
            observaciones: inputs.obs.value,
            divisa_id: inputs.divisaId.value, // D99
            monto: monto
        };

        try {
            const res = await fetch('https://cambiosorion.cl/data/nuevo-ing-caja.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (data.success) {
                ui.modalExito.classList.remove('hidden');
            } else {
                throw new Error(data.error);
            }
        } catch (err) {
            mostrarErrorModal("Error del Servidor", err.message);
            ui.btnGuardar.disabled = false;
            ui.btnGuardar.textContent = "CONFIRMAR INGRESO";
        }
    });

    function mostrarErrorModal(titulo, mensaje) {
        document.getElementById('modal-error-titulo').textContent = titulo;
        document.getElementById('modal-error-mensaje').textContent = mensaje;
        ui.modalError.classList.remove('hidden');
        document.getElementById('modal-error-confirmar').onclick = () => ui.modalError.classList.add('hidden');
    }
});