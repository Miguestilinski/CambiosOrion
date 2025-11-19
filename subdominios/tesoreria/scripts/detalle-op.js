document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    const dashboardContainer = document.getElementById("dashboard-container");
    let info = null; 
    let detallesGlobal = [];
    let pagosGlobal = [];
    // Cache para cuentas contables
    let cuentasCache = []; 

    if (!id) {
        dashboardContainer.innerHTML = "<p class='text-white p-6'>ID de operación no proporcionado.</p>";
        return;
    }

    // --- 1. HELPERS VISUALES Y DE FORMATO ---
    const formatNumber = (num) => {
        const n = parseFloat(num);
        return isNaN(n) ? num : n.toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    };

    const formatCurrency = (amount) => "$" + formatNumber(amount);

    function formatToCLP(value) {
        if (value === null || value === undefined || value === "") return "";
        const number = parseFloat(value);
        if (isNaN(number)) return "";
        return "$" + number.toLocaleString("es-CL", {
            minimumFractionDigits: number % 1 === 0 ? 0 : 2,
            maximumFractionDigits: 2
        });
    }

    const formatDate = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString.replace(/-/g, "/")); // Compatibilidad Safari/Firefox
        if (isNaN(date)) return dateString;
        
        const d = String(date.getDate()).padStart(2, '0');
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const y = date.getFullYear();
        const h = String(date.getHours()).padStart(2, '0');
        const min = String(date.getMinutes()).padStart(2, '0');
        
        return `${h}:${min} ${d}/${m}/${y}`;
    };

    const getBadgeColor = (estado) => {
        const est = (estado || '').toLowerCase();
        if (est === 'vigente') return 'bg-blue-900 text-blue-200 border border-blue-700';
        if (est === 'pagado') return 'bg-green-900 text-green-200 border border-green-700';
        if (est === 'abonado') return 'bg-orange-900 text-orange-200 border border-orange-700';
        if (est === 'anulado') return 'bg-red-900 text-red-200 border border-red-700';
        return 'bg-gray-800 text-gray-400 border border-gray-600';
    };

    const getDivisaElement = (urlIcono, nombreDivisa) => {
        if (urlIcono && urlIcono.trim() !== "") {
            return `<img src="${urlIcono}" alt="${nombreDivisa}" class="w-6 h-6 object-contain mr-2 inline-block">`;
        }
        return `<span class="text-xl mr-2">💵</span>`;
    };

    // --- 2. CARGA DE DATOS ---
    fetch(`https://cambiosorion.cl/data/detalle-op.php?id=${id}`)
        .then(async res => {
            const text = await res.text();
            try { 
                return JSON.parse(text); 
            } catch (e) { 
                // Esto imprimirá en consola lo que realmente devolvió el PHP (ej: el error fatal HTML)
                console.error("Respuesta cruda del servidor:", text); 
                throw new Error("Respuesta no válida del servidor"); 
            }
        })   
        .then(data => {
            if (data.error) {
                dashboardContainer.innerHTML = `<p class="text-red-400 p-6">${data.error}</p>`;
                return;
            }
            info = data.operacion;
            detallesGlobal = data.detalles || [];
            pagosGlobal = data.pagos || [];
            renderDashboard(data);
        })
        .catch(err => {
            console.error(err);
            dashboardContainer.innerHTML = "<p class='text-red-400 p-6'>Error al cargar la operación.</p>";
        });


    // --- 3. RENDERIZADO DEL DASHBOARD (Propuesta A: Hero Unificado) ---
    function renderDashboard(data) {
        const op = data.operacion;
        const detalles = data.detalles || [];
        const pagos = data.pagos || [];

        const getCurrencyInfo = (nombre, id) => { /* ... (Mismo helper interno, usa datos BD si existen en data) ... */ return {code: "UNK", symbol: "$"}; }; // Nota: En tu código real ya estás usando los datos directos, así que la lógica de abajo usa los datos preparados.

        // --- LÓGICA FINANCIERA (Sin cambios) ---
        const esVenta = op.tipo_transaccion === "Venta"; 
        const totalCLP = parseFloat(op.total);

        let listaCliente = [];
        let listaOrion = [];
        let progresoGlobalCliente = 0;
        let progresoGlobalOrion = 0;

        const getPagado = (origen, divisaId) => {
            return pagos.filter(p => p.origen === origen && p.divisa_id === divisaId).reduce((sum, p) => sum + parseFloat(p.monto), 0);
        };

        if (esVenta) {
            // VENTA
            const pagadoClp = getPagado('cliente', 'D47');
            listaCliente.push({ id: 'D47', nombre: 'Peso Chileno', icono: '', codigo: 'CLP', simbolo: '$', meta: totalCLP, pagado: pagadoClp });
            progresoGlobalCliente = totalCLP > 0 ? (pagadoClp / totalCLP) : 0;

            let totalPonderacion = 0; let sumaProgreso = 0;
            detalles.forEach(d => {
                const meta = parseFloat(d.monto);
                const pagado = getPagado('orion', d.divisa_id);
                const pesoLinea = parseFloat(d.subtotal);
                listaOrion.push({ id: d.divisa_id, nombre: d.divisa, icono: d.divisa_icono, codigo: d.divisa_codigo, simbolo: d.divisa_simbolo, meta: meta, pagado: pagado });
                sumaProgreso += (meta > 0 ? (pagado/meta) : 0) * pesoLinea;
                totalPonderacion += pesoLinea;
            });
            progresoGlobalOrion = totalPonderacion > 0 ? (sumaProgreso / totalPonderacion) : 0;
        } else {
            // COMPRA
            let totalPonderacion = 0; let sumaProgreso = 0;
            detalles.forEach(d => {
                const meta = parseFloat(d.monto);
                const pagado = getPagado('cliente', d.divisa_id);
                const pesoLinea = parseFloat(d.subtotal);
                listaCliente.push({ id: d.divisa_id, nombre: d.divisa, icono: d.divisa_icono, codigo: d.divisa_codigo, simbolo: d.divisa_simbolo, meta: meta, pagado: pagado });
                sumaProgreso += (meta > 0 ? (pagado/meta) : 0) * pesoLinea;
                totalPonderacion += pesoLinea;
            });
            progresoGlobalCliente = totalPonderacion > 0 ? (sumaProgreso / totalPonderacion) : 0;

            const pagadoClp = getPagado('orion', 'D47');
            listaOrion.push({ id: 'D47', nombre: 'Peso Chileno', icono: '', codigo: 'CLP', simbolo: '$', meta: totalCLP, pagado: pagadoClp });
            progresoGlobalOrion = totalCLP > 0 ? (pagadoClp / totalCLP) : 0;
        }

        const pctClienteBarra = Math.min(100, progresoGlobalCliente * 100);
        const pctOrionBarra = Math.min(100, progresoGlobalOrion * 100);
        
        let estadoReal = "Vigente";
        if (pctClienteBarra > 1 || pctOrionBarra > 1) estadoReal = "Abonado";
        if (pctClienteBarra > 99.9 && pctOrionBarra > 99.9) estadoReal = "Pagado";
        if (op.estado === "Anulado") estadoReal = "Anulado";

        const badgeClass = getBadgeColor(estadoReal);
        const pendienteCliente = listaCliente.find(x => (x.meta - x.pagado) > 1);
        const pendienteOrion = listaOrion.find(x => (x.meta - x.pagado) > 1);

        const fin = {
            estadoCalculado: estadoReal, esVenta: esVenta,
            cliente: { meta: listaCliente.reduce((a,b)=>a+b.meta,0), pagado: listaCliente.reduce((a,b)=>a+b.pagado,0), divisaId: pendienteCliente ? pendienteCliente.id : (listaCliente[0]?.id || 'D47'), listo: pctClienteBarra > 99.9, metaReal: pendienteCliente ? pendienteCliente.meta : 0, pagadoReal: pendienteCliente ? pendienteCliente.pagado : 0 },
            orion: { meta: listaOrion.reduce((a,b)=>a+b.meta,0), pagado: listaOrion.reduce((a,b)=>a+b.pagado,0), divisaId: pendienteOrion ? pendienteOrion.id : (listaOrion[0]?.id || 'D47'), listo: pctOrionBarra > 99.9, metaReal: pendienteOrion ? pendienteOrion.meta : 0, pagadoReal: pendienteOrion ? pendienteOrion.pagado : 0 }
        };

        // Helper Visual
        const renderCurrencyList = (lista, alignRight = false) => {
            return lista.map(item => {
                const icon = item.id === 'D47' 
                    ? `<img src="https://cambiosorion.cl/orionapp/node_modules/circle-flags/flags/cl.svg" class="w-6 h-6 object-contain drop-shadow-md inline-block" onerror="this.style.display='none'">` 
                    : getDivisaElement(item.icono, item.nombre);
                
                return `
                    <div class="flex items-center gap-3 ${alignRight ? 'flex-row-reverse text-right' : 'text-left'}">
                        ${icon}
                        <div class="flex flex-col">
                            <span class="text-2xl md:text-3xl font-bold text-white leading-none tracking-tight whitespace-nowrap">
                                <span class="text-gray-500 text-sm font-normal mr-0.5">${item.simbolo}</span>${formatNumber(item.meta)} <span class="text-md text-blue-400 font-bold">${item.codigo}</span>
                            </span>
                            <div class="text-xs text-gray-400 font-mono mt-1 bg-gray-900/50 px-2 py-0.5 rounded inline-block ${alignRight ? 'ml-auto' : 'mr-auto'}">
                                Pagado: ${formatNumber(item.pagado)}
                            </div>
                        </div>
                    </div>`;
            }).join('');
        };

        let html = `
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 pb-6 border-b border-gray-700">
                <div>
                    <div class="flex items-center gap-3 mb-1">
                        <span class="text-blue-400 text-sm uppercase tracking-wider font-bold">Operación</span>
                        <span class="px-2 py-0.5 rounded text-sm font-bold uppercase bg-gray-800 border border-gray-600 text-gray-300">${op.tipo_transaccion}</span>
                    </div>
                    <div class="flex items-center gap-4">
                        <h1 class="text-4xl font-bold text-white tracking-tight">#${op.id}</h1>
                        <span class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${badgeClass}">${estadoReal}</span>
                    </div>
                </div>
                <div class="flex flex-wrap gap-2">
                     <button id="btn-emitir-sii" class="bg-blue-700 hover:bg-blue-600 text-white px-4 py-2 rounded shadow-md flex items-center gap-2 text-sm transition border-b-2 border-blue-900"><span>📄</span> Ver Documento</button>
                     ${op.estado !== 'Anulado' ? `<button id="btn-anular" class="bg-transparent hover:bg-red-900/30 text-red-400 border border-red-900 px-4 py-2 rounded shadow flex items-center gap-2 text-sm transition">Anular</button>` : ''}
                     <button id="btn-imprimir" class="bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-600 px-4 py-2 rounded shadow flex items-center gap-2 text-sm transition"><span>🖨️</span> Imprimir</button>
                     <button id="btn-pdf" class="bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-600 px-4 py-2 rounded shadow flex items-center gap-2 text-sm transition">Exportar</button>
                </div>
            </div>

            <div class="w-full mb-8">
                <div class="bg-gray-800 rounded-xl p-8 shadow-2xl border border-gray-700 relative overflow-hidden">
                    <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600"></div>
                    
                    <div class="flex justify-between items-start mb-6 border-b border-gray-700 pb-4">
                        <h4 class="text-sm font-bold text-gray-300 uppercase tracking-widest flex items-center gap-2">
                            Estado de Intercambio
                        </h4>
                        <div class="text-right">
                            <p class="text-[10px] text-gray-500 uppercase font-bold">Valor Total</p>
                            <p class="text-lg font-mono text-blue-300 font-bold">${formatCurrency(totalCLP)} CLP</p>
                        </div>
                    </div>
                    
                    <div class="flex justify-between items-end mb-6 px-2 relative">
                        
                        <div class="text-left w-1/2 border-r border-gray-700/50 pr-8">
                            <div class="text-blue-400 text-sm font-bold uppercase mb-3">Cliente Entrega</div>
                            <div class="flex flex-wrap gap-x-6 gap-y-4 justify-start items-center">
                                ${renderCurrencyList(listaCliente, false)}
                            </div>
                        </div>

                        <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                            <span class="bg-gray-900 text-gray-500 font-black text-xs px-3 py-2 rounded-full border border-gray-700 shadow-xl">VS</span>
                        </div>

                        <div class="text-right w-1/2 pl-8">
                            <div class="text-purple-400 text-sm font-bold uppercase mb-3">Orion Entrega</div>
                            <div class="flex flex-wrap gap-x-6 gap-y-4 justify-end items-center">
                                ${renderCurrencyList(listaOrion, true)}
                            </div>
                        </div>
                    </div>

                    <div class="relative h-8 w-full flex rounded-full overflow-hidden bg-gray-900 shadow-inner border border-gray-600">
                        <div class="w-1/2 flex justify-start border-r border-gray-700 relative bg-gray-900/50">
                             <div style="width: ${pctClienteBarra}%" class="bg-gradient-to-r from-blue-800 to-blue-500 h-full shadow-[0_0_20px_rgba(59,130,246,0.6)] transition-all duration-1000 ease-out relative flex items-center justify-end pr-3">
                                 ${pctClienteBarra > 5 ? `<span class="text-xs font-bold text-white drop-shadow-md">${Math.round(pctClienteBarra)}%</span>` : ''}
                             </div>
                        </div>
                        
                        <div class="w-1/2 flex justify-end border-l border-gray-700 relative bg-gray-900/50">
                             <div style="width: ${pctOrionBarra}%" class="bg-gradient-to-l from-purple-800 to-purple-500 h-full shadow-[0_0_20px_rgba(168,85,247,0.6)] transition-all duration-1000 ease-out relative flex items-center justify-start pl-3">
                                 ${pctOrionBarra > 5 ? `<span class="text-xs font-bold text-white drop-shadow-md">${Math.round(pctOrionBarra)}%</span>` : ''}
                             </div>
                        </div>

                        <div class="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white/10 -translate-x-1/2 z-20"></div>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div class="bg-gray-800 rounded-xl border border-gray-700 p-5 flex flex-col shadow-md">
                    <h3 class="text-white font-bold border-b border-gray-600 pb-3 mb-4 text-sm uppercase flex items-center gap-2">
                        <span class="w-1 h-4 bg-blue-500 rounded-full"></span> Información
                    </h3>
                    <div class="grid grid-cols-2 gap-y-4 text-sm flex-1 content-start">
                        <div class="text-gray-500">Fecha:</div> <div class="text-white text-right font-medium">${formatDate(op.fecha)}</div>
                        <div class="text-gray-500">Cliente:</div> <div class="text-white text-right font-medium truncate text-blue-200" title="${op.nombre_cliente}">${op.nombre_cliente}</div>
                        <div class="text-gray-500">Vendedor:</div> <div class="text-white text-right text-gray-300">${op.vendedor || '—'}</div>
                        <div class="text-gray-500">Caja:</div> <div class="text-white text-right text-gray-300">${op.caja || '—'}</div>
                        <div class="text-gray-500">Doc SII:</div> <div class="text-white text-right text-blue-400 font-mono">${op.numero_documento || 'N/A'}</div>
                    </div>
                    ${op.observaciones ? `<div class="pt-4 border-t border-gray-700 mt-4"><p class="text-xs text-gray-500 uppercase mb-1 font-bold">Observaciones</p><p class="text-sm text-gray-300 italic bg-gray-900/50 p-2 rounded">"${op.observaciones}"</p></div>` : ''}
                </div>

                <div class="lg:col-span-2 bg-gray-900 rounded-xl border border-gray-700 overflow-hidden flex flex-col shadow-lg">
                    <div class="p-4 border-b border-gray-800 bg-gray-900 flex justify-between items-center">
                        <h3 class="text-gray-100 font-bold text-sm uppercase tracking-wide">Detalle de Divisas</h3>
                    </div>
                    <div class="overflow-x-auto flex-1 bg-gray-900">
                        <table class="w-full text-sm text-left text-gray-300">
                            <thead class="text-xs text-gray-400 uppercase bg-gray-800 border-b border-gray-700">
                                <tr><th class="px-4 py-3">Divisa</th><th class="px-4 py-3 text-right">Monto</th><th class="px-4 py-3 text-right">Tasa</th><th class="px-4 py-3 text-right">Subtotal</th></tr>
                            </thead>
                            <tbody class="divide-y divide-gray-800">
                                ${detalles.map(d => `<tr class="hover:bg-gray-800 transition"><td class="px-4 py-3 font-medium text-white flex items-center">${getDivisaElement(d.divisa_icono, d.divisa)}${d.divisa}</td><td class="px-4 py-3 text-right font-mono text-gray-300">${formatNumber(d.monto)}</td><td class="px-4 py-3 text-right font-mono text-gray-500">${formatNumber(d.tasa_cambio)}</td><td class="px-4 py-3 text-right font-bold text-white font-mono">${formatCurrency(d.subtotal)}</td></tr>`).join('')}
                            </tbody>
                        </table>
                    </div>
                    <div class="bg-black/20 p-4 flex justify-between items-center border-t border-gray-800">
                        <span class="text-gray-500 text-xs uppercase font-bold">Total Calculado</span>
                        <span class="text-xl font-bold text-blue-400">${formatCurrency(totalCLP)}</span>
                    </div>
                </div>
            </div>

            <div class="rounded-xl border border-gray-700 bg-transparent overflow-hidden mb-10">
                <div class="p-5 border-b border-gray-700 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-800">
                    <h2 class="text-lg font-bold text-white flex items-center gap-2">Gestión de Pagos</h2>
                    ${fin.estadoCalculado !== 'Pagado' && op.estado !== 'Anulado' ? `
                    <div class="flex gap-2">
                        <button id="btn-full-cliente" class="px-3 py-1.5 text-sm font-bold text-blue-200 bg-blue-900/50 border border-blue-800 rounded hover:bg-blue-800 transition" ${fin.cliente.listo ? 'disabled class="opacity-50 cursor-not-allowed"' : ''}>Pagar Todo Cliente</button>
                        <button id="btn-full-orion" class="px-3 py-1.5 text-sm font-bold text-purple-200 bg-purple-900/50 border border-purple-800 rounded hover:bg-purple-800 transition" ${fin.orion.listo ? 'disabled class="opacity-50 cursor-not-allowed"' : ''}>Pagar Todo Orion</button>
                    </div>` : ''}
                </div>
                <div class="p-6 bg-gray-900/80">
                    <div id="form-container" class="${(fin.estadoCalculado === 'Pagado' || op.estado === 'Anulado') ? 'hidden' : ''}">
                        <form id="form-pago" class="bg-gray-800 rounded-xl p-5 border border-gray-700 mb-8 shadow-md">
                            <div class="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                                <div class="md:col-span-3">
                                    <label class="block text-xs text-gray-400 mb-2 font-bold">¿QUIÉN PAGA?</label>
                                    <div class="grid grid-cols-2 gap-2">
                                        <div class="origen-option cursor-pointer border border-gray-600 rounded-lg p-3 text-center hover:border-blue-500 transition group bg-gray-700" data-value="cliente">
                                            <span class="block text-2xl mb-1">👤</span><span class="text-xs text-gray-300 font-bold">Cliente</span>
                                        </div>
                                        <div class="origen-option cursor-pointer border border-gray-600 rounded-lg p-3 text-center hover:border-purple-500 transition group bg-gray-700" data-value="orion">
                                            <span class="block text-2xl mb-1">🏢</span><span class="text-xs text-gray-300 font-bold">Orion</span>
                                        </div>
                                    </div>
                                    <input type="hidden" id="origen-pago">
                                </div>
                                <div class="md:col-span-3">
                                    <label class="block text-xs text-gray-400 mb-1 font-bold">DIVISA</label>
                                    <select id="divisa-select" class="w-full bg-gray-900 border border-gray-600 text-white text-sm rounded-lg p-2.5"><option value="">Seleccione...</option></select>
                                </div>
                                <div class="md:col-span-2">
                                    <label class="block text-xs text-gray-400 mb-1 font-bold">MÉTODO</label>
                                    <select id="tipo-pago" class="w-full bg-gray-900 border border-gray-600 text-white text-sm rounded-lg p-2.5">
                                        <option value="efectivo">Efectivo</option><option value="cuenta">Cuenta</option><option value="transferencia">Transferencia</option><option value="tarjeta">Tarjeta</option>
                                    </select>
                                </div>
                                <div class="md:col-span-2">
                                    <label class="block text-xs text-gray-400 mb-1 font-bold">MONTO</label>
                                    <input type="text" id="input-pago" class="w-full bg-gray-900 border border-gray-600 text-white text-sm rounded-lg p-2.5 pl-4 font-mono" placeholder="0">
                                </div>
                                <div class="md:col-span-2">
                                    <button type="button" id="btn-registrar-pago" class="w-full bg-green-700 hover:bg-green-600 text-white font-bold py-2.5 rounded-lg shadow-md transition">REGISTRAR</button>
                                </div>
                            </div>
                            <div id="input-cuenta" class="mt-4"></div>
                        </form>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div id="tabla-pagos-cliente">${renderTablaPagos("Pagos Recibidos (Cliente)", pagos.filter(p => p.origen === 'cliente'), "cliente", "blue")}</div>
                        <div id="tabla-pagos-orion">${renderTablaPagos("Pagos Realizados (Orion)", pagos.filter(p => p.origen === 'orion'), "orion", "purple")}</div>
                    </div>
                </div>
            </div>
        `;

        dashboardContainer.innerHTML = html;
        attachLogic(data, fin);
    }

    function attachLogic(data, restante) {
        const op = data.operacion;
        const detalles = data.detalles || [];
        
        const origenInput = document.getElementById('origen-pago');
        const divisaSelect = document.getElementById('divisa-select');
        const tipoPagoSelect = document.getElementById('tipo-pago');
        const inputPago = document.getElementById('input-pago');
        const inputCuentaContainer = document.getElementById('input-cuenta');
        const btnRegistrar = document.getElementById('btn-registrar-pago');
        const origenOptions = document.querySelectorAll('.origen-option');

        // --- SMART FLOW LOGIC (Cerebro) ---

        // 1. Selector Quién Paga
        origenOptions.forEach(opt => {
            opt.addEventListener('click', () => {
                origenOptions.forEach(o => {
                    o.classList.remove('bg-blue-600', 'border-blue-500', 'bg-purple-600', 'border-purple-500', 'text-white');
                    o.classList.add('bg-gray-700', 'border-gray-600');
                    o.querySelector('span.text-xs').classList.remove('text-white');
                    o.querySelector('span.text-xs').classList.add('text-gray-300');
                });
                
                const val = opt.dataset.value;
                origenInput.value = val;
                
                opt.classList.remove('bg-gray-700', 'border-gray-600');
                opt.querySelector('span.text-xs').classList.remove('text-gray-300');
                opt.querySelector('span.text-xs').classList.add('text-white');

                if(val === 'cliente') opt.classList.add('bg-blue-600', 'border-blue-500');
                else opt.classList.add('bg-purple-600', 'border-purple-500');

                cargarDivisas(op.id, op.tipo_transaccion, val);
            });
        });

        // 2. Regla de Transferencia y Divisas
        divisaSelect.addEventListener('change', () => {
            const divisaId = divisaSelect.value;
            const esCLP = divisaId === "D47";
            
            // Si NO es CLP, deshabilitar transferencia y tarjeta
            Array.from(tipoPagoSelect.options).forEach(opt => {
                if (opt.value === 'transferencia' || opt.value === 'tarjeta') {
                    if (esCLP) {
                        opt.disabled = false; opt.hidden = false;
                    } else {
                        opt.disabled = true; opt.hidden = true;
                    }
                }
            });

            // Resetear si la opción seleccionada ya no es válida
            if (!esCLP && (tipoPagoSelect.value === 'transferencia' || tipoPagoSelect.value === 'tarjeta')) {
                tipoPagoSelect.value = 'efectivo';
            }

            // Disparar recarga de cuentas si es necesario
            if (tipoPagoSelect.value === "cuenta" || tipoPagoSelect.value === "transferencia") {
                 tipoPagoSelect.dispatchEvent(new Event("change"));
            }
            
            // Sugerir Monto
            let sugerido = 0;
            if (divisaId === "D47") { 
                const pagosCLP = pagosGlobal.filter(p => p.divisa_id === "D47" && p.origen === origenInput.value).reduce((sum, p) => sum + parseFloat(p.monto), 0);
                sugerido = Math.max(0, parseFloat(op.total) - pagosCLP);
            } else {
                const detalle = detalles.find(d => d.divisa_id === divisaId);
                if (detalle) {
                    const pagosDivisa = pagosGlobal.filter(p => p.divisa_id === divisaId && p.origen === origenInput.value).reduce((sum, p) => sum + parseFloat(p.monto), 0);
                    sugerido = Math.max(0, parseFloat(detalle.monto) - pagosDivisa);
                }
            }
            inputPago.placeholder = formatToCLP(sugerido);
            inputPago.dataset.sugerido = sugerido;
            
            // Auto-Focus al Monto para agilizar
            if(divisaId) setTimeout(() => inputPago.focus(), 100);
        });

        // 3. Pre-Selección Inteligente (Smart Defaults)
        setTimeout(() => {
            if(op.estado !== "Pagado" && op.estado !== "Anulado") {
                let defaultPayer = "";
                // Si Venta -> Paga Cliente (predeterminado)
                if (op.tipo_transaccion === "Venta") defaultPayer = "cliente";
                // Si Compra -> Paga Orion (predeterminado)
                else if (op.tipo_transaccion === "Compra") defaultPayer = "orion";
                
                if (defaultPayer) {
                    const btn = document.querySelector(`.origen-option[data-value="${defaultPayer}"]`);
                    if(btn) btn.click();
                }
            }
        }, 100);

        // 4. Lógica de Cuentas (Buscador y Select)
        tipoPagoSelect.addEventListener('change', async () => {
            const tipo = tipoPagoSelect.value;
            const divisaId = divisaSelect.value;
            const origen = origenInput.value;
            inputCuentaContainer.innerHTML = "";

            if (!tipo || !divisaId || !origen) return;

            if (tipo === "cuenta") {
                // CASO CUENTA: Buscador Inteligente (Datalist)
                let url = `https://cambiosorion.cl/data/cuentas.php?activa=1&divisa_id=${divisaId}`;
                // Si paga Orion, buscamos nuestras cuentas administrativas
                if (origen === "orion") url += `&tipo_cuenta=administrativa`; 
                // Si paga Cliente, traemos todas (porque puede ser un tercero), pero ordenaremos
                
                try {
                    inputCuentaContainer.innerHTML = "<p class='text-xs text-gray-400'>Cargando listado...</p>";
                    const res = await fetch(url);
                    const cuentasRes = await res.json();
                    let lista = Array.isArray(cuentasRes) ? cuentasRes : (cuentasRes.data || []);
                    
                    // Ordenamiento Inteligente: Cuentas del cliente actual primero
                    if (origen === "cliente") {
                         lista.sort((a, b) => {
                             const aEsCliente = (a.cliente_id == op.cliente_id) ? 1 : 0;
                             const bEsCliente = (b.cliente_id == op.cliente_id) ? 1 : 0;
                             return bEsCliente - aEsCliente;
                         });
                    }

                    if (lista.length > 0) {
                        // Usamos Datalist para búsqueda rápida
                        inputCuentaContainer.innerHTML = `
                            <label class="block text-xs text-gray-400 mb-1 font-bold ml-1">Cuenta Origen (Escriba para buscar)</label>
                            <input list="cuentas-list" id="input-cuenta-search" class="w-full bg-gray-900 border border-gray-600 text-white text-sm rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500" placeholder="Buscar cuenta...">
                            <datalist id="cuentas-list">
                                ${lista.map(c => `<option data-value="${c.id}" value="${c.nombre || (c.banco + ' ' + c.numero)}">${c.banco ? c.banco + ' - ' : ''}${c.numero || ''}</option>`).join('')}
                            </datalist>
                            <input type="hidden" id="select-cuenta-real">
                        `;
                        
                        // Logic para capturar el ID real del datalist
                        const inputSearch = document.getElementById('input-cuenta-search');
                        const hiddenInput = document.getElementById('select-cuenta-real');
                        
                        inputSearch.addEventListener('change', function() {
                             const option = document.querySelector(`#cuentas-list option[value='${this.value}']`);
                             if (option) {
                                 hiddenInput.value = option.getAttribute('data-value');
                             } else {
                                 hiddenInput.value = "";
                             }
                        });
                        
                    } else inputCuentaContainer.innerHTML = `<p class="text-xs text-yellow-500">⚠️ No hay cuentas contables disponibles para esta divisa.</p>`;

                } catch (e) { inputCuentaContainer.innerHTML = "<p class='text-xs text-red-500'>Error cargando cuentas</p>"; }

            } else if (tipo === "transferencia" || tipo === "tarjeta") {
                // CASO TRANSFERENCIA: Select Normal (pocas opciones)
                let url = `https://cambiosorion.cl/data/cuentas.php?activa=1&divisa_id=D47&tipo_cuenta=administrativa`;
                try {
                    inputCuentaContainer.innerHTML = "<p class='text-xs text-gray-400'>Cargando bancos...</p>";
                    const res = await fetch(url);
                    const result = await res.json();
                    const lista = result.data || []; 
                    if (lista.length > 0) {
                        inputCuentaContainer.innerHTML = `
                            <label class="block text-xs text-gray-400 mb-1 font-bold ml-1">Cuenta Bancaria Destino (Orion)</label>
                            <select id="select-cuenta-real" class="w-full bg-gray-900 border border-gray-600 text-white text-sm rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500">
                                <option value="">Seleccione banco...</option>
                                ${lista.map(c => `<option value="${c.id}">${c.banco} - ${c.tipo_cuenta} (${c.numero})</option>`).join('')}
                            </select>`;
                            
                        // Auto-selección si hay solo una cuenta bancaria (Ej: Solo tenemos Santander)
                        if (lista.length === 1) {
                            const select = document.getElementById('select-cuenta-real');
                            select.value = lista[0].id;
                        }
                    } else inputCuentaContainer.innerHTML = `<p class="text-xs text-yellow-500">⚠️ No hay cuentas bancarias configuradas.</p>`;
                } catch (e) { inputCuentaContainer.innerHTML = "<p class='text-xs text-red-500'>Error cargando bancos</p>"; }
            }
        });

        inputPago.addEventListener("input", (e) => {
            const onlyNumbers = inputPago.value.replace(/[^0-9]/g, "");
            let numero = parseFloat(onlyNumbers);
            inputPago.value = numero ? formatToCLP(numero) : "";
        });

        btnRegistrar.addEventListener('click', () => {
            const origen = origenInput.value;
            const divisa = divisaSelect.value;
            const tipo = tipoPagoSelect.value;
            const rawMonto = inputPago.value.replace(/[^0-9]/g, "");
            const monto = parseFloat(rawMonto);
            const cuentaInput = document.getElementById('select-cuenta-real');
            const cuentaId = cuentaInput ? cuentaInput.value : null;

            // Validaciones Robustas
            if (!origen) return mostrarModal({ titulo: "❌ Error", mensaje: "Debe seleccionar quién paga." });
            if (!divisa) return mostrarModal({ titulo: "❌ Error", mensaje: "Debe seleccionar una divisa." });
            if (!tipo) return mostrarModal({ titulo: "❌ Error", mensaje: "Debe seleccionar un método de pago." });
            if (!monto || monto <= 0) return mostrarModal({ titulo: "❌ Error", mensaje: "El monto debe ser mayor a 0." });
            
            // Validación especifica de cuenta
            if ((tipo === 'cuenta' || tipo === 'transferencia') && !cuentaId) {
                return mostrarModal({ titulo: "❌ Error", mensaje: "Para este método debe seleccionar una cuenta válida." });
            }

            let nuevoEstado = "Abonado";
            if (Math.abs(monto - restante) < 10) nuevoEstado = "Pagado"; // Tolerancia de 10 pesos por redondeo

            const payload = {
                id: op.id, estado: nuevoEstado, pagos: monto, caja_id: 99, tipo_pago: tipo, divisa: divisa, origen: origen, cliente_id: op.cliente_id, cuenta_id: cuentaId
            };

            fetch(`https://cambiosorion.cl/data/detalle-op.php`, {
                method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
            }).then(res => res.json()).then(res => {
                if (res.success) mostrarModalPagoExitoso();
                else mostrarModal({ titulo: "❌ Error", mensaje: res.message });
            }).catch(e => mostrarModal({ titulo: "❌ Error", mensaje: "Error de conexión con el servidor." }));
        });

        // Botones Header
        const btnPdf = document.getElementById('btn-pdf');
        if(btnPdf) btnPdf.addEventListener('click', () => op.numero_documento ? window.open(`https://cambiosorion.cl/documentos/${op.numero_documento}.pdf`, "_blank") : mostrarModal({ titulo: "❌ Error", mensaje: "No hay documento emitido para esta operación." }));
        const btnImprimir = document.getElementById('btn-imprimir');
        if(btnImprimir) btnImprimir.addEventListener('click', () => window.print());
        const btnAnular = document.getElementById('btn-anular');
        if(btnAnular) btnAnular.addEventListener('click', () => mostrarModal({ titulo: "⚠️ Confirmar Anulación", mensaje: "¿Estás seguro de anular esta operación? Se revertirán los movimientos de inventario.", textoConfirmar: "Sí, Anular", textoCancelar: "Cancelar", onConfirmar: () => fetch(`https://cambiosorion.cl/data/detalle-op.php`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: op.id }) }).then(r => r.json()).then(r => r.success ? location.reload() : alert(r.message)) }));
    }

    async function cargarDivisas(operacionId, tipoOperacion, quienPaga) {
        const divisaSelect = document.getElementById("divisa-select");
        divisaSelect.innerHTML = '<option value="">Cargando...</option>';
        try {
            const res = await fetch(`https://cambiosorion.cl/data/detalle-op.php?buscar_divisas=1&operacion_id=${operacionId}`);
            const divisas = await res.json();
            divisaSelect.innerHTML = '<option value="">Seleccione...</option>';

            const tipoOperacionLower = tipoOperacion.toLowerCase();
            const quienPagaLower = quienPaga.toLowerCase();

            // FILTRO LÓGICO (N-1)
            const divisasFiltradas = divisas.filter(divisa => {
                const esCLP = divisa.id === "D47";
                // Si es Compra y paga Orion -> Paga en CLP (Normalmente)
                if (tipoOperacionLower === "compra" && quienPagaLower === "orion") return esCLP;
                // Si es Compra y paga Cliente -> Entrega Divisa
                if (tipoOperacionLower === "compra" && quienPagaLower === "cliente") return !esCLP;
                // Si es Venta y paga Orion -> Entrega Divisa
                if (tipoOperacionLower === "venta" && quienPagaLower === "orion") return !esCLP;
                // Si es Venta y paga Cliente -> Paga en CLP
                if (tipoOperacionLower === "venta" && quienPagaLower === "cliente") return esCLP;
                return false;
            });

            // Si el filtro deja vacío (ej: arbitrajes complejos), mostramos todas para no bloquear
            const listaFinal = divisasFiltradas.length > 0 ? divisasFiltradas : divisas;

            listaFinal.forEach(d => {
                const opt = document.createElement("option");
                opt.value = d.id;
                opt.textContent = d.nombre;
                divisaSelect.appendChild(opt);
            });
            
            // AUTO-SELECCION (Cero Clicks)
            if(listaFinal.length === 1) {
                divisaSelect.value = listaFinal[0].id;
                divisaSelect.dispatchEvent(new Event('change'));
            }
            
        } catch (e) { divisaSelect.innerHTML = '<option>Error carga</option>'; }
    }

    function renderTablaPagos(titulo, lista, origen, color = "gray") {
        const headerColor = color === "blue" ? "bg-blue-900/20 text-blue-200 border-blue-500/30" : color === "purple" ? "bg-purple-900/20 text-purple-200 border-purple-500/30" : "bg-gray-800 text-gray-400";
        if (lista.length === 0) return `<div class="bg-gray-800/50 rounded-xl p-6 border border-gray-700 text-center shadow-inner"><h4 class="text-xs font-bold text-gray-500 uppercase mb-2 tracking-widest">${titulo}</h4><p class="text-sm text-gray-400 italic">No hay registros.</p></div>`;
        return `
        <div class="bg-gray-900 rounded-xl border border-gray-700 overflow-hidden shadow-md">
            <div class="px-4 py-3 border-b border-gray-700 ${headerColor}">
                 <h4 class="text-xs font-bold uppercase tracking-widest">${titulo}</h4>
            </div>
            <table class="w-full text-sm text-left text-gray-300">
                <tbody class="divide-y divide-gray-800">
                ${lista.map(p => `
                    <tr class="hover:bg-gray-800 transition">
                        <td class="px-4 py-3">
                            <div class="text-xs text-gray-500 mb-1">${formatDate(p.fecha)}</div> <div class="font-medium text-white flex items-center">
                                ${getDivisaElement(p.divisa_icono, p.divisa)}
                                ${formatCurrency(p.monto)}
                            </div>
                        </td>
                        <td class="px-4 py-3 text-right">
                             <div class="text-[10px] font-bold uppercase border border-gray-600 rounded px-1.5 py-0.5 inline-block text-gray-400 mb-1">${p.tipo}</div>
                             ${p.cuenta_nombre ? `<div class="text-xs text-blue-300 truncate max-w-[120px]" title="${p.cuenta_nombre}">${p.cuenta_nombre}</div>` : ''}
                        </td>
                        <td class="px-4 py-3 text-right">
                             <button class="text-red-500 hover:text-white hover:bg-red-600 transition p-1.5 rounded-lg" onclick="eliminarPago(${p.id}, '${origen}')">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                             </button>
                        </td>
                    </tr>
                `).join('')}
                </tbody>
            </table>
        </div>`;
    }

    window.mostrarModal = ({ titulo, mensaje, textoConfirmar = "Aceptar", textoCancelar = null, onConfirmar, onCancelar }) => {
      const modal = document.getElementById("modal-generico");
      document.getElementById("modal-generico-titulo").textContent = titulo;
      document.getElementById("modal-generico-mensaje").textContent = mensaje;
      const btnConfirmar = document.getElementById("modal-generico-confirmar");
      const btnCancelar = document.getElementById("modal-generico-cancelar");
      btnConfirmar.textContent = textoConfirmar;
      if (textoCancelar) { btnCancelar.classList.remove("hidden"); btnCancelar.textContent = textoCancelar; } else { btnCancelar.classList.add("hidden"); }
      modal.classList.remove("hidden");
      const newConfirm = btnConfirmar.cloneNode(true); const newCancel = btnCancelar.cloneNode(true);
      btnConfirmar.parentNode.replaceChild(newConfirm, btnConfirmar); btnCancelar.parentNode.replaceChild(newCancel, btnCancelar);
      newConfirm.onclick = () => { modal.classList.add("hidden"); if (onConfirmar) onConfirmar(); };
      newCancel.onclick = () => { modal.classList.add("hidden"); if (onCancelar) onCancelar(); };
    }

    window.mostrarModalPagoExitoso = () => {
        const modal = document.getElementById("modal-pago-exitoso");
        modal.classList.remove("hidden");
        document.getElementById("nuevo-pago").onclick = () => location.reload();
        document.getElementById("volver").onclick = () => window.location.href = "https://tesoreria.cambiosorion.cl/operaciones";
    }

    window.eliminarPago = (id, origen) => {
        mostrarModal({
            titulo: "⚠️ Eliminar Pago", mensaje: "¿Estás seguro que deseas eliminar este pago? Se ajustará el inventario.", textoConfirmar: "Eliminar", textoCancelar: "Cancelar",
            onConfirmar: () => {
                fetch(`https://cambiosorion.cl/data/detalle-op.php`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: id, origen: origen }) })
                .then(res => res.json()).then(res => { if(res.success) mostrarModal({ titulo: "✅ Eliminado", mensaje: "Pago eliminado correctamente", onConfirmar: () => location.reload() }); else mostrarModal({ titulo: "❌ Error", mensaje: res.message }); });
            }
        });
    };
});