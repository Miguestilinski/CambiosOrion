import { initCajaHeader } from './header.js';

document.addEventListener('DOMContentLoaded', async () => {
    
    // 1. Inicializar Header
    const sessionData = await initCajaHeader('transacciones');
    
    // Validar Caja
    if (!sessionData || !sessionData.caja_id) {
        mostrarError("Error de Sesión", "No tienes una caja asignada. No puedes realizar transacciones.");
        document.getElementById('btn-guardar').disabled = true;
    }

    // 2. Referencias DOM
    const form = document.getElementById('form-nueva-tr');
    const inputs = {
        cliente: document.getElementById('cliente-input'),
        clienteId: document.getElementById('cliente_id'),
        email: document.getElementById('email'),
        tipoDoc: document.getElementById('tipo_documento'),
        numDoc: document.getElementById('numero_documento'),
        nota: document.getElementById('numero_nota'),
        tipoTrx: document.getElementById('tipo_transaccion'), // Hidden input
        divisa: document.getElementById('divisa_id'),
        monto: document.getElementById('monto'),
        tasa: document.getElementById('tasa_cambio'),
        total: document.getElementById('total'),
        metodo: document.getElementById('metodo_pago')
    };

    const ui = {
        resultadosCliente: document.getElementById('resultados-cliente'),
        btnCompra: document.getElementById('btn-compra'),
        btnVenta: document.getElementById('btn-venta'),
        btnGuardar: document.getElementById('btn-guardar'),
        modalExito: document.getElementById('modal-exito'),
        modalError: document.getElementById('modal-error')
    };

    let lastTrxId = null;

    // 3. Cargar Divisas
    cargarDivisas();

    // 4. Lógica Tipo Transacción (Toggle UI)
    ui.btnCompra.onclick = () => setTipoTransaccion('Compra');
    ui.btnVenta.onclick = () => setTipoTransaccion('Venta');

    function setTipoTransaccion(tipo) {
        inputs.tipoTrx.value = tipo;
        
        if (tipo === 'Compra') {
            // Estilo Compra (Verde)
            ui.btnCompra.className = "py-2 text-sm font-bold rounded-md transition-all bg-white text-emerald-600 shadow-sm border border-gray-200";
            ui.btnVenta.className = "py-2 text-sm font-bold rounded-md transition-all text-slate-500 hover:text-slate-700";
            ui.btnGuardar.className = "w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 group";
        } else {
            // Estilo Venta (Cyan - Default)
            ui.btnVenta.className = "py-2 text-sm font-bold rounded-md transition-all bg-white text-cyan-600 shadow-sm border border-gray-200";
            ui.btnCompra.className = "py-2 text-sm font-bold rounded-md transition-all text-slate-500 hover:text-slate-700";
            ui.btnGuardar.className = "w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-cyan-600/30 transition-all flex items-center justify-center gap-2 group";
        }
        calcularTotal();
    }

    // 5. Cálculos en tiempo real
    inputs.monto.addEventListener('input', formatAndCalc);
    inputs.tasa.addEventListener('input', formatAndCalc);

    function formatAndCalc(e) {
        // Permitir solo números y comas/puntos
        let val = e.target.value.replace(/[^0-9.,]/g, '');
        e.target.value = val;
        calcularTotal();
    }

    function calcularTotal() {
        // Limpieza para cálculo (remover puntos de miles, cambiar coma decimal a punto)
        const montoRaw = inputs.monto.value.replace(/\./g, '').replace(',', '.');
        const tasaRaw = inputs.tasa.value.replace(/\./g, '').replace(',', '.');
        
        const monto = parseFloat(montoRaw) || 0;
        const tasa = parseFloat(tasaRaw) || 0;
        const total = Math.round(monto * tasa); // CLP suele ser entero

        inputs.total.value = total > 0 ? total.toLocaleString('es-CL') : '';
    }

    // 6. Buscador Clientes
    inputs.cliente.addEventListener('input', async (e) => {
        const query = e.target.value;
        if (query.length < 2) {
            ui.resultadosCliente.classList.add('hidden');
            return;
        }

        try {
            const res = await fetch(`https://cambiosorion.cl/data/nueva-tr.php?action=search_client&q=${encodeURIComponent(query)}`);
            const data = await res.json();
            
            ui.resultadosCliente.innerHTML = '';
            if (data.length > 0) {
                ui.resultadosCliente.classList.remove('hidden');
                data.forEach(c => {
                    const div = document.createElement('div');
                    div.className = "px-4 py-2 hover:bg-slate-50 cursor-pointer text-sm border-b border-gray-100 last:border-0";
                    div.innerHTML = `<span class="font-bold text-slate-700">${c.razon_social}</span> <span class="text-slate-400 text-xs">(${c.rut || 'S/RUT'})</span>`;
                    div.onclick = () => seleccionarCliente(c);
                    ui.resultadosCliente.appendChild(div);
                });
            } else {
                ui.resultadosCliente.classList.add('hidden');
            }
        } catch (err) {
            console.error(err);
        }
    });

    function seleccionarCliente(c) {
        inputs.cliente.value = c.razon_social;
        inputs.clienteId.value = c.id;
        if(c.email) inputs.email.value = c.email;
        ui.resultadosCliente.classList.add('hidden');
    }

    // Cerrar buscador al clic fuera
    document.addEventListener('click', (e) => {
        if (!inputs.cliente.contains(e.target) && !ui.resultadosCliente.contains(e.target)) {
            ui.resultadosCliente.classList.add('hidden');
        }
    });

    // 7. Guardar Transacción
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Validaciones básicas
        if (!inputs.divisa.value) { alert("Seleccione una divisa"); return; }
        
        const monto = parseFloat(inputs.monto.value.replace(/\./g, '').replace(',', '.'));
        if (!monto || monto <= 0) { alert("El monto debe ser mayor a 0"); return; }

        ui.btnGuardar.disabled = true;
        ui.btnGuardar.innerHTML = `<svg class="animate-spin h-5 w-5 mr-2 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Procesando...`;

        const payload = {
            action: 'create',
            caja_id: sessionData.caja_id,
            vendedor_id: sessionData.equipo_id,
            cliente_id: inputs.clienteId.value || null,
            nombre_cliente_manual: inputs.cliente.value, // Por si es cliente nuevo/ocasional
            email: inputs.email.value,
            tipo_transaccion: inputs.tipoTrx.value,
            tipo_documento: inputs.tipoDoc.value,
            numero_documento: inputs.numDoc.value,
            numero_nota: inputs.nota.value,
            divisa_id: inputs.divisa.value,
            monto: monto,
            tasa_cambio: parseFloat(inputs.tasa.value.replace(/\./g, '').replace(',', '.')),
            total: parseInt(inputs.total.value.replace(/\./g, '')),
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
                throw new Error(data.error || "Error desconocido");
            }
        } catch (err) {
            mostrarError("Error al guardar", err.message);
            ui.btnGuardar.disabled = false;
            ui.btnGuardar.textContent = "Confirmar Transacción";
        }
    });

    // 8. Utilidades
    function cargarDivisas() {
        fetch('https://cambiosorion.cl/data/divisas_api.php')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    data.forEach(d => {
                        const option = document.createElement('option');
                        option.value = d.nombre; // OJO: Tu sistema usa nombres como ID en algunos lados (USD vs Dolar)
                        option.textContent = `${d.nombre} (${d.codigo})`;
                        inputs.divisa.appendChild(option);
                    });
                }
            });
    }

    function mostrarError(titulo, mensaje) {
        const t = document.getElementById('modal-error-titulo');
        const m = document.getElementById('modal-error-mensaje');
        if (t) t.textContent = titulo;
        if (m) m.textContent = mensaje;
        ui.modalError.classList.remove('hidden');
        document.getElementById('modal-error-confirmar').onclick = () => ui.modalError.classList.add('hidden');
    }

    // Botones Modal Éxito
    document.getElementById('btn-nueva').onclick = () => location.reload();
    document.getElementById('btn-ver-detalle').onclick = () => {
        if (lastTrxId) window.location.href = `detalle-tr.html?id=${lastTrxId}`;
    };
});