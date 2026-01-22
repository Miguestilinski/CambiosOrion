import { initCajaHeader } from './header.js';

document.addEventListener('DOMContentLoaded', async () => {
    
    const sessionData = await initCajaHeader('transacciones');
    
    if (!sessionData || !sessionData.caja_id) {
        mostrarError("Error", "Sin caja asignada.");
        document.getElementById('btn-guardar').disabled = true;
    }

    const inputs = {
        cliente: document.getElementById('cliente-input'),
        clienteId: document.getElementById('cliente_id'),
        email: document.getElementById('email'),
        tipoDoc: document.getElementById('tipo_documento'),
        // numero_documento eliminado
        nota: document.getElementById('numero_nota'),
        tipoTrx: document.getElementById('tipo_transaccion'), 
        divisaId: document.getElementById('divisa_id'), 
        monto: document.getElementById('monto'),
        tasa: document.getElementById('tasa_cambio'),
        total: document.getElementById('total'),
        metodo: document.getElementById('metodo_pago')
    };

    const ui = {
        resCliente: document.getElementById('resultados-cliente'),
        btnCompra: document.getElementById('btn-compra'),
        btnVenta: document.getElementById('btn-venta'),
        btnGuardar: document.getElementById('btn-guardar'),
        modalExito: document.getElementById('modal-exito'),
        modalError: document.getElementById('modal-error'),
        divisaTrigger: document.getElementById('divisa-trigger'),
        divisaDropdown: document.getElementById('divisa-dropdown'),
        divisaIconContainer: document.getElementById('divisa-icon-container'),
        divisaTextSelected: document.getElementById('divisa-text-selected'),
        loadingTasa: document.getElementById('loading-tasa')
    };

    let lastTrxId = null;

    // SVG Placeholder (Círculo con ?)
    const svgPlaceholder = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;

    // --- CARGAR DIVISAS DESDE NUEVA-TR.PHP (Para asegurar Iconos) ---
    cargarDivisasCustom();

    function cargarDivisasCustom() {
        // Usamos la acción 'get_divisas' del PHP local
        fetch('https://cambiosorion.cl/data/nueva-tr.php?action=get_divisas')
            .then(res => res.json())
            .then(data => {
                ui.divisaDropdown.innerHTML = ''; 
                if (Array.isArray(data)) {
                    data.forEach(d => {
                        const item = document.createElement('div');
                        item.className = "flex items-center gap-3 px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-gray-100 last:border-0 transition-colors";
                        
                        // Creación de imagen con fallback
                        const img = document.createElement('img');
                        img.className = "w-full h-full object-contain rounded-full";
                        img.src = d.icono;
                        // Si falla la carga, ocultamos imagen e inyectamos SVG
                        img.onerror = function() {
                            this.style.display = 'none';
                            this.parentElement.innerHTML = svgPlaceholder;
                            this.parentElement.classList.add('text-gray-300');
                        };

                        const iconWrapper = document.createElement('div');
                        iconWrapper.className = "w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center p-0.5 shrink-0";
                        iconWrapper.appendChild(img);

                        const textWrapper = document.createElement('div');
                        textWrapper.className = "flex flex-col";
                        textWrapper.innerHTML = `
                            <span class="text-sm font-bold text-slate-700">${d.nombre}</span>
                            <span class="text-[10px] text-slate-400 font-mono">${d.codigo || ''}</span>
                        `;

                        item.appendChild(iconWrapper);
                        item.appendChild(textWrapper);

                        item.onclick = () => {
                            inputs.divisaId.value = d.id; // ID real
                            
                            // Actualizar Trigger
                            ui.divisaIconContainer.innerHTML = '';
                            const selectedImg = img.cloneNode(true);
                            // Re-bind error para el clon
                            selectedImg.onerror = function() {
                                this.style.display = 'none';
                                this.parentElement.innerHTML = svgPlaceholder;
                            };
                            ui.divisaIconContainer.appendChild(selectedImg);
                            ui.divisaIconContainer.classList.remove('text-gray-300'); // Quitar estilo placeholder si aplica

                            ui.divisaTextSelected.textContent = d.nombre;
                            ui.divisaTextSelected.classList.add('text-slate-800');
                            ui.divisaTextSelected.classList.remove('text-slate-500');
                            
                            ui.divisaDropdown.classList.add('hidden');

                            // BUSCAR TASA AUTOMÁTICA
                            obtenerTasaAutomatica();
                        };
                        ui.divisaDropdown.appendChild(item);
                    });
                }
            })
            .catch(err => console.error("Error cargando divisas", err));
    }

    // --- OBTENER TASA AUTOMÁTICA ---
    async function obtenerTasaAutomatica() {
        const divisa = inputs.divisaId.value;
        const tipo = inputs.tipoTrx.value; // Compra o Venta

        if (!divisa) return;

        ui.loadingTasa.classList.remove('hidden');
        
        try {
            const res = await fetch(`https://cambiosorion.cl/data/nueva-tr.php?action=get_tasa&divisa=${encodeURIComponent(divisa)}&tipo=${tipo}`);
            const data = await res.json();

            if (data.tasa) {
                inputs.tasa.value = data.tasa;
                calcularTotal();
                
                // Efecto visual
                inputs.tasa.classList.add('bg-cyan-50', 'text-cyan-700');
                setTimeout(() => inputs.tasa.classList.remove('bg-cyan-50', 'text-cyan-700'), 500);
            } else {
                inputs.tasa.value = "";
            }
        } catch (e) {
            console.error(e);
        } finally {
            ui.loadingTasa.classList.add('hidden');
        }
    }

    // Toggle Dropdown Divisa
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

    // --- TIPO TRANSACCION ---
    ui.btnCompra.onclick = () => setTipo('Compra');
    ui.btnVenta.onclick = () => setTipo('Venta');

    function setTipo(t) {
        inputs.tipoTrx.value = t;
        const activeClass = t === 'Compra' 
            ? "bg-emerald-50 text-emerald-700 border-emerald-200 shadow-inner" 
            : "bg-cyan-50 text-cyan-700 border-cyan-200 shadow-inner";
        const inactiveClass = "text-slate-400 hover:text-slate-600";

        if(t === 'Compra') {
            ui.btnCompra.className = `py-4 text-sm font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-emerald-200 rounded-l-xl ${activeClass}`;
            ui.btnVenta.className = `py-4 text-sm font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${inactiveClass}`;
            ui.btnGuardar.className = "w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 mt-auto";
        } else {
            ui.btnVenta.className = `py-4 text-sm font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-cyan-200 rounded-r-xl ${activeClass}`;
            ui.btnCompra.className = `py-4 text-sm font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${inactiveClass}`;
            ui.btnGuardar.className = "w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-cyan-600/20 transition-all flex items-center justify-center gap-2 mt-auto";
        }
        
        obtenerTasaAutomatica();
    }
    setTipo('Venta');

    // --- CALCULADORA ---
    inputs.monto.addEventListener('input', formatAndCalc);
    inputs.tasa.addEventListener('input', formatAndCalc);

    function formatAndCalc(e) {
        let val = e.target.value.replace(/[^0-9.,]/g, '');
        e.target.value = val;
        calcularTotal();
    }

    function calcularTotal() {
        const montoRaw = inputs.monto.value.replace(/\./g, '').replace(',', '.');
        const tasaRaw = inputs.tasa.value.replace(/\./g, '').replace(',', '.');
        
        const monto = parseFloat(montoRaw) || 0;
        const tasa = parseFloat(tasaRaw) || 0;
        const total = Math.round(monto * tasa);

        inputs.total.value = total > 0 ? "$ " + total.toLocaleString('es-CL') : "$ 0";
    }

    // --- BUSCADOR CLIENTES ---
    inputs.cliente.addEventListener('input', async (e) => {
        const q = e.target.value;
        if (q.length < 2) { ui.resCliente.classList.add('hidden'); return; }

        try {
            const res = await fetch(`https://cambiosorion.cl/data/nueva-tr.php?action=search_client&q=${encodeURIComponent(q)}`);
            const data = await res.json();
            ui.resCliente.innerHTML = '';
            
            if (data.length > 0) {
                ui.resCliente.classList.remove('hidden');
                data.forEach(c => {
                    const div = document.createElement('div');
                    div.className = "px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-gray-100 flex justify-between items-center";
                    div.innerHTML = `
                        <span class="font-bold text-slate-700 text-sm">${c.razon_social}</span>
                        <span class="text-xs text-slate-400 font-mono bg-slate-100 px-2 py-0.5 rounded">${c.rut || 'S/RUT'}</span>
                    `;
                    div.onclick = () => {
                        inputs.cliente.value = c.razon_social;
                        inputs.clienteId.value = c.id;
                        if(c.email) inputs.email.value = c.email;
                        ui.resCliente.classList.add('hidden');
                    };
                    ui.resCliente.appendChild(div);
                });
            } else {
                ui.resCliente.classList.add('hidden');
            }
        } catch (err) { console.error(err); }
    });

    // --- SUBMIT ---
    document.getElementById('form-nueva-tr').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!inputs.divisaId.value) { alert("Seleccione una divisa"); return; }
        
        const monto = parseFloat(inputs.monto.value.replace(/\./g, '').replace(',', '.'));
        if (!monto || monto <= 0) { alert("Monto inválido"); return; }

        ui.btnGuardar.disabled = true;
        ui.btnGuardar.innerHTML = "Procesando...";

        const totalRaw = inputs.total.value.replace('$', '').replace(/\./g, '').trim();

        const payload = {
            action: 'create',
            caja_id: sessionData.caja_id,
            vendedor_id: sessionData.equipo_id,
            cliente_id: inputs.clienteId.value || null,
            nombre_cliente_manual: inputs.cliente.value,
            email: inputs.email.value,
            tipo_transaccion: inputs.tipoTrx.value,
            tipo_documento: inputs.tipoDoc.value,
            // numero_documento eliminado
            numero_nota: inputs.nota.value,
            divisa_id: inputs.divisaId.value,
            monto: monto,
            tasa_cambio: parseFloat(inputs.tasa.value.replace(/\./g, '').replace(',', '.')),
            total: parseInt(totalRaw),
            metodo_pago: inputs.metodo.value
        };

        try {
            const res = await fetch('https://cambiosorion.cl/data/nueva-tr.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (data.success) {
                lastTrxId = data.id;
                ui.modalExito.classList.remove('hidden');
            } else {
                throw new Error(data.error);
            }
        } catch (err) {
            mostrarError("Error", err.message);
            ui.btnGuardar.disabled = false;
            ui.btnGuardar.textContent = "Confirmar Transacción";
        }
    });

    function mostrarError(t, m) {
        document.getElementById('modal-error-titulo').textContent = t;
        document.getElementById('modal-error-mensaje').textContent = m;
        ui.modalError.classList.remove('hidden');
        document.getElementById('modal-error-confirmar').onclick = () => ui.modalError.classList.add('hidden');
    }

    document.getElementById('btn-nueva').onclick = () => location.reload();
    document.getElementById('btn-ver-detalle').onclick = () => {
        if (lastTrxId) window.location.href = `detalle-tr.html?id=${lastTrxId}`;
    };
});