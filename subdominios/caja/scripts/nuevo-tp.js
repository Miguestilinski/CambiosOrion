import { initCajaHeader } from './header.js';

document.addEventListener('DOMContentLoaded', async () => {
    
    // 1. Init (Usamos 'traspasos' si tienes esa página en el sidebar, sino 'caja')
    const sessionData = await initCajaHeader('traspasos');
    
    if (!sessionData || !sessionData.caja_id) {
        mostrarErrorModal("Error de Sesión", "Sin caja asignada para operar.");
        document.getElementById('btn-guardar').disabled = true;
        return;
    }

    if (!sessionData.equipo_id) {
        mostrarErrorModal("Error Crítico", "No se pudo identificar al usuario. Recargue la página.");
        document.getElementById('btn-guardar').disabled = true;
        return;
    }

    // Configurar Caja Origen (Es la de la sesión)
    document.getElementById('origen-id').value = sessionData.caja_id;
    document.getElementById('origen-nombre').value = sessionData.caja_nombre || `Caja #${sessionData.caja_id}`;

    // 2. Referencias DOM
    const inputs = {
        destino: document.getElementById('destino-select'),
        obs: document.getElementById('observaciones'),
        divisaId: document.getElementById('divisa_id'),
        monto: document.getElementById('monto')
    };

    const ui = {
        divisaTrigger: document.getElementById('divisa-trigger'),
        divisaDropdown: document.getElementById('divisa-dropdown'),
        divisaIconContainer: document.getElementById('divisa-icon-container'),
        divisaTextSelected: document.getElementById('divisa-text-selected'),
        btnGuardar: document.getElementById('btn-guardar'),
        modalExito: document.getElementById('modal-exito'),
        modalError: document.getElementById('modal-error')
    };

    const svgPlaceholder = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;

    // --- CARGAR DATOS INICIALES ---
    cargarDatos();

    async function cargarDatos() {
        try {
            // 1. Cajas Destino
            const resCajas = await fetch('https://cambiosorion.cl/data/nuevo-tp-caja.php?action=get_cajas');
            const cajas = await resCajas.json();
            
            inputs.destino.innerHTML = '<option value="" disabled selected>Seleccione Caja Destino...</option>';
            cajas.forEach(c => {
                // No mostrar la misma caja de origen como destino
                if (parseInt(c.id) !== parseInt(sessionData.caja_id)) {
                    const opt = document.createElement('option');
                    opt.value = c.id;
                    opt.textContent = c.nombre;
                    inputs.destino.appendChild(opt);
                }
            });

            // 2. Divisas
            const resDiv = await fetch('https://cambiosorion.cl/data/nuevo-tp-caja.php?action=get_divisas');
            const divisas = await resDiv.json();
            renderDivisas(divisas);

        } catch (err) {
            console.error("Error cargando datos:", err);
            mostrarErrorModal("Error de Conexión", "No se pudieron cargar los datos iniciales.");
        }
    }

    function renderDivisas(data) {
        ui.divisaDropdown.innerHTML = ''; 
        if (Array.isArray(data)) {
            data.forEach(d => {
                const item = document.createElement('div');
                item.className = "flex items-center gap-3 px-4 py-3 hover:bg-amber-50 cursor-pointer border-b border-gray-100 last:border-0 transition-colors";
                
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
                    inputs.divisaId.value = d.id_maestro; 
                    
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
    });

    // --- FORMATO MONTO ---
    inputs.monto.addEventListener('input', function(e) {
        let val = this.value.replace(/\D/g, '');
        this.value = val.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    });

    // --- SUBMIT ---
    document.getElementById('form-nuevo-tp').addEventListener('submit', async (e) => {
        e.preventDefault();

        const origenId = parseInt(document.getElementById('origen-id').value);
        const destinoId = parseInt(inputs.destino.value);

        if (!destinoId) { mostrarErrorModal("Faltan Datos", "Seleccione una Caja de Destino"); return; }
        if (!inputs.divisaId.value) { mostrarErrorModal("Faltan Datos", "Seleccione una Divisa"); return; }
        
        const monto = parseFloat(inputs.monto.value.replace(/\./g, ''));
        if (!monto || monto <= 0) { mostrarErrorModal("Monto Inválido", "Ingrese un monto mayor a cero"); return; }

        if (origenId === destinoId) { mostrarErrorModal("Error Lógico", "El destino no puede ser igual al origen."); return; }

        ui.btnGuardar.disabled = true;
        ui.btnGuardar.innerHTML = "Procesando...";

        const payload = {
            action: 'create',
            origen_id: origenId,
            destino_id: destinoId,
            usuario_id: sessionData.equipo_id, 
            divisa_id: inputs.divisaId.value, 
            monto: monto,
            observaciones: inputs.obs.value
        };

        try {
            const res = await fetch('https://cambiosorion.cl/data/nuevo-tp-caja.php', {
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
            ui.btnGuardar.textContent = "CONFIRMAR TRASPASO";
        }
    });

    function mostrarErrorModal(titulo, mensaje) {
        document.getElementById('modal-error-titulo').textContent = titulo;
        document.getElementById('modal-error-mensaje').textContent = mensaje;
        ui.modalError.classList.remove('hidden');
        document.getElementById('modal-error-confirmar').onclick = () => ui.modalError.classList.add('hidden');
    }
});