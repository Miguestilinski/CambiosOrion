document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    const dashboardContainer = document.getElementById("dashboard-container");
    let info = null; 
    let detallesGlobal = [];
    let pagosGlobal = [];

    if (!id) {
        dashboardContainer.innerHTML = "<p class='text-white p-6'>ID de operación no proporcionado.</p>";
        return;
    }

    // --- 1. HELPERS VISUALES ---
    const formatNumber = (num) => {
        const n = parseFloat(num);
        return isNaN(n) ? num : n.toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
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
            return `<img src="${urlIcono}" alt="${nombreDivisa}" class="w-5 h-5 object-contain inline-block mr-1">`;
        }
        return `<span class="text-lg mr-1">💵</span>`;
    };

    function formatToCLP(value) {
        if (value === null || value === undefined || value === "") return "";
        const number = parseFloat(value);
        if (isNaN(number)) return "";
        return "$" + number.toLocaleString("es-CL", {
            minimumFractionDigits: number % 1 === 0 ? 0 : 2,
            maximumFractionDigits: 2
        });
    }

    // --- 2. CARGA DE DATOS ---
    fetch(`https://cambiosorion.cl/data/detalle-op.php?id=${id}`)
        .then(async res => {
            const text = await res.text();
            try { return JSON.parse(text); } catch (e) { throw new Error("Respuesta del servidor inválida"); }
        })    
        .then(data => {
            if (data.error) {
                dashboardContainer.innerHTML = `<p class="text-red-400 p-6">${data.error}</p>`;
                return;
            }
            info = data.operacion;
            detallesGlobal = data.detalles || [];
            pagosGlobal = data.pagos || [];
            
            // Calculamos el estado financiero real antes de renderizar
            const financiero = calcularEstadoFinanciero(info, detallesGlobal, pagosGlobal);
            
            renderDashboard(data, financiero);
        })
        .catch(err => {
            console.error(err);
            dashboardContainer.innerHTML = "<p class='text-red-400 p-6'>Error de conexión.</p>";
        });

    // --- 3. LÓGICA FINANCIERA ESTRICTA (El Nuevo Cerebro) ---
    function calcularEstadoFinanciero(op, detalles, pagos) {
        const esVenta = op.tipo_transaccion === "Venta"; 
        // VENTA: Cliente Compra Divisas (Recibe Divisa, Debe entregar CLP)
        // COMPRA: Cliente Vende Divisas (Recibe CLP, Debe entregar Divisa)

        let metaCliente = 0;
        let divisaClienteId = ""; 
        let metaOrion = 0;
        let divisaOrionId = "";
        let divisaExtranjeraInfo = detalles[0] || { divisa: 'Divisa', divisa_id: 'EXT', divisa_icono: '' };

        // Sumamos el monto total extranjero (en caso de múltiples líneas de la misma divisa)
        // Nota: Si hay múltiples divisas distintas, esto simplifica tomando la primera como referencia visual principal, 
        // pero idealmente la lógica debería iterar. Asumimos operación estándar 1 divisa vs CLP.
        const totalExtranjero = detalles.reduce((sum, d) => sum + parseFloat(d.monto), 0);

        if (esVenta) {
            // Cliente paga CLP (Total Operación)
            metaCliente = parseFloat(op.total);
            divisaClienteId = "D47"; // ID Peso Chileno
            
            // Orion entrega Divisa Extranjera
            metaOrion = totalExtranjero;
            divisaOrionId = divisaExtranjeraInfo.divisa_id;
        } else {
            // Cliente entrega Divisa Extranjera
            metaCliente = totalExtranjero;
            divisaClienteId = divisaExtranjeraInfo.divisa_id;

            // Orion paga CLP
            metaOrion = parseFloat(op.total);
            divisaOrionId = "D47";
        }

        // Calcular Pagos Realizados (Filtrando estrictamente por moneda)
        const pagadoCliente = pagos
            .filter(p => p.origen === 'cliente' && p.divisa_id === divisaClienteId)
            .reduce((sum, p) => sum + parseFloat(p.monto), 0);

        const pagadoOrion = pagos
            .filter(p => p.origen === 'orion' && p.divisa_id === divisaOrionId)
            .reduce((sum, p) => sum + parseFloat(p.monto), 0);

        // Porcentajes
        const pctCliente = metaCliente > 0 ? Math.min(100, (pagadoCliente / metaCliente) * 100) : (pagadoCliente > 0 ? 100 : 0);
        const pctOrion = metaOrion > 0 ? Math.min(100, (pagadoOrion / metaOrion) * 100) : (pagadoOrion > 0 ? 100 : 0);

        // Determinar Estado Lógico Estricto
        const margen = 1.0; // Tolerancia pequeña por decimales
        const clienteListo = (metaCliente - pagadoCliente) < margen;
        const orionListo = (metaOrion - pagadoOrion) < margen;

        let estadoLogico = "Vigente";

        if (pagadoCliente > 0) {
            estadoLogico = "Abonado";
        }
        
        if (clienteListo && orionListo) {
            estadoLogico = "Pagado";
        }

        if (op.estado === "Anulado") estadoLogico = "Anulado";

        return {
            cliente: { meta: metaCliente, pagado: pagadoCliente, pct: pctCliente, divisaId: divisaClienteId, listo: clienteListo },
            orion: { meta: metaOrion, pagado: pagadoOrion, pct: pctOrion, divisaId: divisaOrionId, listo: orionListo },
            estadoCalculado: estadoLogico,
            esVenta: esVenta,
            divisaExtranjeraInfo: divisaExtranjeraInfo
        };
    }

    // --- 4. RENDERIZADO ---
    function renderDashboard(data, fin) {
        const op = data.operacion;
        const detalles = data.detalles || [];
        const pagos = data.pagos || [];
        const badgeClass = getBadgeColor(fin.estadoCalculado);

        // Iconos para el Versus
        const iconCLP = `<img src="https://cambiosorion.cl/orionapp/icons/chile.svg" class="w-6 h-6 inline mr-1 object-contain" onerror="this.style.display='none'">`; 
        const iconExt = getDivisaElement(fin.divisaExtranjeraInfo.divisa_icono, fin.divisaExtranjeraInfo.divisa); // Usa el helper existente que ya maneja tamaños

        // Configuración visual de cada lado
        const ladoCliente = {
            titulo: "Cliente Entrega",
            icono: fin.esVenta ? iconCLP : iconExt,
            simbolo: fin.esVenta ? "$" : "", // Solo ponemos signo $ si es CLP
            meta: fin.cliente.meta,
            pagado: fin.cliente.pagado,
            pct: fin.cliente.pct,
            colorBarra: fin.cliente.listo ? "bg-green-500" : (fin.cliente.pagado > 0 ? "bg-orange-500" : "bg-gray-600"),
            textoEstado: fin.cliente.listo ? "Completado" : (fin.cliente.pagado > 0 ? "Abonando" : "Pendiente")
        };

        const ladoOrion = {
            titulo: "Orion Entrega",
            icono: !fin.esVenta ? iconCLP : iconExt,
            simbolo: !fin.esVenta ? "$" : "",
            meta: fin.orion.meta,
            pagado: fin.orion.pagado,
            pct: fin.orion.pct,
            colorBarra: fin.orion.listo ? "bg-green-500" : (fin.orion.pagado > 0 ? "bg-blue-500" : "bg-gray-600"),
            textoEstado: fin.orion.listo ? "Entregado" : (fin.orion.pagado > 0 ? "Parcial" : "Pendiente")
        };

        let html = `
            <!-- CABECERA -->
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 pb-6 border-b border-gray-700">
                <div>
                    <div class="flex items-center gap-3 mb-1">
                        <span class="text-blue-400 text-xs uppercase tracking-wider font-bold">Operación</span>
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-gray-800 border border-gray-600 text-gray-300">${op.tipo_transaccion}</span>
                    </div>
                    <div class="flex items-center gap-4">
                        <h1 class="text-4xl font-bold text-white tracking-tight">#${op.id}</h1>
                        <span class="px-4 py-1 rounded-full text-sm font-bold uppercase tracking-wide ${badgeClass}">${fin.estadoCalculado}</span>
                    </div>
                </div>
                <div class="flex flex-wrap gap-2">
                     <button id="btn-emitir-sii" class="bg-blue-700 hover:bg-blue-600 text-white px-4 py-2 rounded shadow-md flex items-center gap-2 text-sm transition border-b-2 border-blue-900">📄 Documento</button>
                     ${op.estado !== 'Anulado' ? `<button id="btn-anular" class="text-red-400 border border-red-900/50 hover:bg-red-900/20 px-4 py-2 rounded shadow text-sm transition">🚫 Anular</button>` : ''}
                     <button id="btn-imprimir" class="bg-gray-800 border border-gray-600 text-gray-300 px-4 py-2 rounded hover:bg-gray-700 transition">🖨️</button>
                </div>
            </div>

            <!-- VERSUS HERO SECTION -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                
                <!-- LADO CLIENTE -->
                <div class="bg-gray-900 border border-gray-700 rounded-xl p-6 shadow-lg relative overflow-hidden">
                    <div class="flex justify-between items-start mb-4">
                        <div class="flex items-center gap-3">
                            <div class="p-3 bg-gray-800 rounded-lg text-2xl">👤</div>
                            <div>
                                <p class="text-gray-400 text-xs uppercase font-bold">${ladoCliente.titulo}</p>
                                <p class="text-white font-bold text-lg truncate w-40" title="${op.nombre_cliente}">${op.nombre_cliente}</p>
                            </div>
                        </div>
                        <div class="text-right">
                            <p class="text-gray-500 text-xs uppercase font-bold">Debe</p>
                            <div class="flex items-center justify-end gap-1">
                                ${ladoCliente.icono}
                                <span class="text-2xl font-bold text-white">${ladoCliente.simbolo}${formatNumber(ladoCliente.meta)}</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Barra Progreso Cliente -->
                    <div class="relative pt-2">
                        <div class="flex mb-2 items-center justify-between text-xs">
                            <span class="font-bold uppercase text-gray-300">${ladoCliente.textoEstado}</span>
                            <span class="text-white font-mono">${formatNumber(ladoCliente.pagado)} / ${formatNumber(ladoCliente.meta)}</span>
                        </div>
                        <div class="overflow-hidden h-3 mb-1 text-xs flex rounded-full bg-gray-800 border border-gray-700">
                            <div style="width:${ladoCliente.pct}%" class="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${ladoCliente.colorBarra} transition-all duration-700 ease-out"></div>
                        </div>
                    </div>
                </div>

                <!-- LADO ORION -->
                <div class="bg-gray-900 border border-gray-700 rounded-xl p-6 shadow-lg relative overflow-hidden">
                    <div class="flex justify-between items-start mb-4">
                        <div class="flex items-center gap-3">
                            <div class="p-3 bg-gray-800 rounded-lg text-2xl">🏢</div>
                            <div>
                                <p class="text-gray-400 text-xs uppercase font-bold">${ladoOrion.titulo}</p>
                                <p class="text-white font-bold text-lg">Tesoreria</p>
                            </div>
                        </div>
                        <div class="text-right">
                            <p class="text-gray-500 text-xs uppercase font-bold">Debe</p>
                            <div class="flex items-center justify-end gap-1">
                                ${ladoOrion.icono}
                                <span class="text-2xl font-bold text-white">${ladoOrion.simbolo}${formatNumber(ladoOrion.meta)}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Barra Progreso Orion -->
                    <div class="relative pt-2">
                        <div class="flex mb-2 items-center justify-between text-xs">
                            <span class="font-bold uppercase text-gray-300">${ladoOrion.textoEstado}</span>
                            <span class="text-white font-mono">${formatNumber(ladoOrion.pagado)} / ${formatNumber(ladoOrion.meta)}</span>
                        </div>
                        <div class="overflow-hidden h-3 mb-1 text-xs flex rounded-full bg-gray-800 border border-gray-700">
                            <div style="width:${ladoOrion.pct}%" class="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${ladoOrion.colorBarra} transition-all duration-700 ease-out"></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- GRID CENTRAL -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <!-- INFO GENERAL -->
                <div class="bg-gray-800 rounded-xl border border-gray-700 p-5 flex flex-col shadow-md">
                    <h3 class="text-white font-bold border-b border-gray-600 pb-3 mb-4 text-sm uppercase">Información</h3>
                    <div class="grid grid-cols-2 gap-y-4 text-sm">
                        <div class="text-gray-500">Fecha:</div> <div class="text-white text-right">${op.fecha}</div>
                        <div class="text-gray-500">Vendedor:</div> <div class="text-white text-right">${op.vendedor || '—'}</div>
                        <div class="text-gray-500">Caja:</div> <div class="text-white text-right">${op.caja || '—'}</div>
                        <div class="text-gray-500">Doc SII:</div> <div class="text-blue-400 text-right">${op.numero_documento || 'N/A'}</div>
                    </div>
                    ${op.observaciones ? `<div class="mt-4 p-2 bg-gray-900/50 rounded text-xs text-gray-300 italic">"${op.observaciones}"</div>` : ''}
                </div>

                <!-- TABLA DIVISAS -->
                <div class="lg:col-span-2 bg-gray-900 rounded-xl border border-gray-700 overflow-hidden flex flex-col shadow-lg">
                    <div class="p-4 border-b border-gray-800 bg-gray-900"><h3 class="text-gray-100 font-bold text-sm uppercase">Detalle Divisas</h3></div>
                    <div class="overflow-x-auto flex-1 bg-gray-900">
                        <table class="w-full text-sm text-left text-gray-300">
                            <thead class="text-xs text-gray-400 uppercase bg-gray-800 border-b border-gray-700">
                                <tr><th class="px-4 py-3">Divisa</th><th class="px-4 py-3 text-right">Monto</th><th class="px-4 py-3 text-right">Tasa</th><th class="px-4 py-3 text-right">Subtotal</th></tr>
                            </thead>
                            <tbody class="divide-y divide-gray-800">
                                ${detalles.map(d => `<tr><td class="px-4 py-3 flex items-center gap-2">${getDivisaElement(d.divisa_icono, d.divisa)}${d.divisa}</td><td class="px-4 py-3 text-right">${formatNumber(d.monto)}</td><td class="px-4 py-3 text-right">${formatNumber(d.tasa_cambio)}</td><td class="px-4 py-3 text-right text-white font-bold">$${formatNumber(d.subtotal)}</td></tr>`).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- SECCIÓN DE PAGOS -->
            <div class="rounded-xl border border-gray-700 bg-transparent overflow-hidden mb-10">
                <div class="p-5 border-b border-gray-700 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-800">
                    <h2 class="text-lg font-bold text-white flex items-center gap-2"><span class="text-blue-400">💳</span> Gestión de Pagos</h2>
                    ${fin.estadoCalculado !== 'Pagado' && op.estado !== 'Anulado' ? `
                    <div class="flex gap-2">
                        <button id="btn-full-cliente" class="px-3 py-1.5 text-xs font-bold text-blue-200 bg-blue-900/50 border border-blue-800 rounded hover:bg-blue-800 transition" ${fin.cliente.listo ? 'disabled class="opacity-50 cursor-not-allowed"' : ''}>Pagar Todo Cliente</button>
                        <button id="btn-full-orion" class="px-3 py-1.5 text-xs font-bold text-purple-200 bg-purple-900/50 border border-purple-800 rounded hover:bg-purple-800 transition" ${fin.orion.listo ? 'disabled class="opacity-50 cursor-not-allowed"' : ''}>Pagar Todo Orion</button>
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

    function attachLogic(data, fin) {
        const op = data.operacion;
        const detalles = data.detalles || [];
        
        const origenInput = document.getElementById('origen-pago');
        const divisaSelect = document.getElementById('divisa-select');
        const tipoPagoSelect = document.getElementById('tipo-pago');
        const inputPago = document.getElementById('input-pago');
        const inputCuentaContainer = document.getElementById('input-cuenta');
        const btnRegistrar = document.getElementById('btn-registrar-pago');
        
        // Pre-selección automática
        setTimeout(() => {
            let defaultPayer = "";
            if (op.tipo_transaccion === "Venta" && !fin.cliente.listo) defaultPayer = "cliente";
            else if (op.tipo_transaccion === "Compra" && !fin.orion.listo) defaultPayer = "orion";
            
            if (defaultPayer) document.querySelector(`.origen-option[data-value="${defaultPayer}"]`)?.click();
        }, 50);

        // Lógica botones origen
        document.querySelectorAll('.origen-option').forEach(opt => {
            opt.addEventListener('click', () => {
                document.querySelectorAll('.origen-option').forEach(o => {
                    o.className = "origen-option cursor-pointer border border-gray-600 rounded-lg p-3 text-center hover:border-blue-500 transition group bg-gray-700";
                    o.querySelector('span.text-xs').className = "text-xs text-gray-300 font-bold";
                });
                
                const val = opt.dataset.value;
                origenInput.value = val;
                
                opt.classList.remove('bg-gray-700', 'border-gray-600');
                opt.querySelector('span.text-xs').classList.replace('text-gray-300', 'text-white');
                
                if(val === 'cliente') opt.classList.add('bg-blue-600', 'border-blue-500');
                else opt.classList.add('bg-purple-600', 'border-purple-500');

                cargarDivisasLogicas(data, val);
            });
        });

        // Detectar cambio divisa para validaciones
        divisaSelect.addEventListener('change', () => {
            const esCLP = divisaSelect.value === "D47";
            Array.from(tipoPagoSelect.options).forEach(opt => {
                if(opt.value === 'transferencia' || opt.value === 'tarjeta') {
                    opt.disabled = !esCLP; opt.hidden = !esCLP;
                }
            });
            if(!esCLP && (tipoPagoSelect.value === 'transferencia' || tipoPagoSelect.value === 'tarjeta')) tipoPagoSelect.value = 'efectivo';
            
            if(tipoPagoSelect.value === "cuenta" || tipoPagoSelect.value === "transferencia") {
                tipoPagoSelect.dispatchEvent(new Event("change"));
            }

            // Sugerir Monto Restante Inteligente
            let restante = 0;
            const origen = origenInput.value;
            
            // Solo sugerir si la divisa seleccionada es la de la deuda principal
            if (origen === 'cliente' && divisaSelect.value === fin.cliente.divisaId) {
                restante = Math.max(0, fin.cliente.meta - fin.cliente.pagado);
            } else if (origen === 'orion' && divisaSelect.value === fin.orion.divisaId) {
                restante = Math.max(0, fin.orion.meta - fin.orion.pagado);
            }

            if(restante > 0) inputPago.value = formatNumber(restante);
            else inputPago.value = "";
            
            // Foco automático
            if(divisaSelect.value) inputPago.focus();
        });

        // Lógica Registrar
        btnRegistrar.addEventListener('click', () => {
            const origen = origenInput.value;
            const montoStr = inputPago.value.replace(/\./g, '').replace(',', '.'); // Limpiar formato CL
            const monto = parseFloat(montoStr);
            
            if(!origen || !divisaSelect.value || !monto) return alert("Faltan datos");

            // PRE-CALCULAR EL ESTADO QUE TENDRÁ DESPUÉS DE ESTE PAGO
            // Si este pago hace que el lado actual se complete...
            const ladoActual = origen === 'cliente' ? fin.cliente : fin.orion;
            const ladoOtro = origen === 'cliente' ? fin.orion : fin.cliente;
            
            const pagadoFuturo = ladoActual.pagado + monto;
            const listoFuturo = (ladoActual.meta - pagadoFuturo) < 1.0; // Tolerancia

            let nuevoEstado = "Abonado";
            if (listoFuturo && ladoOtro.listo) {
                nuevoEstado = "Pagado";
            }

            const payload = {
                id: op.id, estado: nuevoEstado, pagos: monto, 
                caja_id: 99, tipo_pago: tipoPagoSelect.value, 
                divisa: divisaSelect.value, origen: origen, cliente_id: op.cliente_id,
                cuenta_id: document.getElementById('select-cuenta-real')?.value || null
            };

            fetch(`https://cambiosorion.cl/data/detalle-op.php`, {
                method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
            }).then(r => r.json()).then(r => {
                if(r.success) location.reload(); else alert(r.message);
            });
        });
        
        // Listeners de Cuentas y Tipo Pago
        tipoPagoSelect.addEventListener('change', async () => {
            const tipo = tipoPagoSelect.value;
            const divisaId = divisaSelect.value;
            const origen = origenInput.value;
            inputCuentaContainer.innerHTML = "";

            if (!tipo || !divisaId || !origen) return;

            if (tipo === "cuenta") {
                let url = `https://cambiosorion.cl/data/cuentas.php?activa=1&divisa_id=${divisaId}`;
                if (origen === "orion") url += `&tipo_cuenta=administrativa`; 

                try {
                    inputCuentaContainer.innerHTML = "<p class='text-xs text-gray-400'>Cargando cuentas...</p>";
                    const res = await fetch(url);
                    const cuentasRes = await res.json();
                    let lista = Array.isArray(cuentasRes) ? cuentasRes : (cuentasRes.data || []);
                    
                    if (origen === "cliente") {
                         lista.sort((a, b) => (b.cliente_id == op.cliente_id) - (a.cliente_id == op.cliente_id));
                    }

                    if (lista.length > 0) {
                        inputCuentaContainer.innerHTML = `
                            <label class="block text-xs text-gray-400 mb-1 font-bold ml-1">Cuenta Origen (Buscar)</label>
                            <input list="cuentas-list" id="input-cuenta-search" class="w-full bg-gray-900 border border-gray-600 text-white text-sm rounded-lg p-2.5" placeholder="Escriba para buscar...">
                            <datalist id="cuentas-list">${lista.map(c => `<option data-value="${c.id}" value="${c.nombre || (c.banco + ' ' + c.numero)}">${c.banco ? c.banco + ' - ' : ''}${c.numero || ''}</option>`).join('')}</datalist>
                            <input type="hidden" id="select-cuenta-real">`;
                        
                        document.getElementById('input-cuenta-search').addEventListener('change', function() {
                             const option = document.querySelector(`#cuentas-list option[value='${this.value}']`);
                             document.getElementById('select-cuenta-real').value = option ? option.getAttribute('data-value') : "";
                        });
                    } else inputCuentaContainer.innerHTML = `<p class="text-xs text-yellow-500">⚠️ Sin cuentas.</p>`;
                } catch (e) { inputCuentaContainer.innerHTML = "<p class='text-xs text-red-500'>Error.</p>"; }

            } else if (tipo === "transferencia" || tipo === "tarjeta") {
                let url = `https://cambiosorion.cl/data/cuentas.php?activa=1&divisa_id=D47&tipo_cuenta=administrativa`;
                try {
                    const res = await fetch(url);
                    const result = await res.json();
                    const lista = result.data || []; 
                    if (lista.length > 0) {
                        inputCuentaContainer.innerHTML = `
                            <label class="block text-xs text-gray-400 mb-1 font-bold ml-1">Cuenta Bancaria Orion</label>
                            <select id="select-cuenta-real" class="w-full bg-gray-900 border border-gray-600 text-white text-sm rounded-lg p-2.5">
                                <option value="">Seleccione banco...</option>
                                ${lista.map(c => `<option value="${c.id}">${c.banco} - ${c.tipo_cuenta} (${c.numero})</option>`).join('')}
                            </select>`;
                        if(lista.length === 1) document.getElementById('select-cuenta-real').value = lista[0].id;
                    } else inputCuentaContainer.innerHTML = `<p class="text-xs text-yellow-500">⚠️ Sin bancos.</p>`;
                } catch (e) {}
            }
        });
        
        // Listeners Header
        const btnPdf = document.getElementById('btn-pdf');
        if(btnPdf) btnPdf.addEventListener('click', () => op.numero_documento ? window.open(`https://cambiosorion.cl/documentos/${op.numero_documento}.pdf`, "_blank") : alert("No hay documento"));
        const btnAnular = document.getElementById('btn-anular');
        if(btnAnular) btnAnular.addEventListener('click', () => { if(confirm("¿Anular?")) fetch(`https://cambiosorion.cl/data/detalle-op.php`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: op.id }) }).then(r => r.json()).then(r => location.reload()); });
        
        // Pago Completo
        const btnFullCli = document.getElementById('btn-full-cliente');
        const btnFullOrion = document.getElementById('btn-full-orion');
        if(btnFullCli) btnFullCli.addEventListener('click', () => registrarPagoCompleto('cliente', fin, op));
        if(btnFullOrion) btnFullOrion.addEventListener('click', () => registrarPagoCompleto('orion', fin, op));

        // Input Format
        inputPago.addEventListener('input', (e) => {
             let val = e.target.value.replace(/\D/g, '');
             if(val) e.target.value = new Intl.NumberFormat('es-CL').format(parseInt(val));
        });
    }

    function cargarDivisasLogicas(data, quienPaga) {
        const select = document.getElementById("divisa-select");
        select.innerHTML = '<option value="">Seleccione...</option>';
        const esVenta = data.operacion.tipo_transaccion === "Venta";
        const debePagarCLP = (esVenta && quienPaga === 'cliente') || (!esVenta && quienPaga === 'orion');

        if (debePagarCLP) {
            const opt = document.createElement('option');
            opt.value = "D47"; opt.text = "Peso Chileno";
            select.appendChild(opt);
        } else {
            data.detalles.forEach(d => {
                const opt = document.createElement('option');
                opt.value = d.divisa_id; opt.text = d.divisa;
                select.appendChild(opt);
            });
        }
        // Auto-select si solo hay 1
        if(select.options.length === 2) {
            select.selectedIndex = 1;
            select.dispatchEvent(new Event('change'));
        }
    }
    
    function registrarPagoCompleto(origen, fin, op) {
        const lado = origen === 'cliente' ? fin.cliente : fin.orion;
        const restante = Math.max(0, lado.meta - lado.pagado);
        if(restante <= 0) return alert("No hay deuda pendiente");
        
        // Calcular estado futuro
        const ladoOtro = origen === 'cliente' ? fin.orion : fin.cliente;
        let nuevoEstado = "Abonado";
        if(ladoOtro.listo) nuevoEstado = "Pagado";

        const payload = {
            id: op.id, estado: nuevoEstado, pagos: restante, 
            caja_id: 99, tipo_pago: "efectivo", 
            divisa: lado.divisaId, origen: origen, cliente_id: op.cliente_id, cuenta_id: null
        };
        
        fetch(`https://cambiosorion.cl/data/detalle-op.php`, {
            method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
        }).then(r => r.json()).then(r => location.reload());
    }

    function renderTablaPagos(titulo, lista, origen, color) {
        const headerClass = color === "blue" ? "bg-blue-900/20 text-blue-200 border-blue-800" : "bg-purple-900/20 text-purple-200 border-purple-800";
        if (lista.length === 0) return `<div class="bg-gray-800/50 rounded-xl p-6 border border-gray-700 text-center italic text-gray-400 text-sm">Sin pagos registrados</div>`;
        return `
        <div class="bg-gray-900 rounded-xl border border-gray-700 overflow-hidden shadow-md">
            <div class="px-4 py-2 border-b border-gray-700 ${headerClass}"><h4 class="text-xs font-bold uppercase">${titulo}</h4></div>
            <table class="w-full text-sm text-left text-gray-300">
                <tbody class="divide-y divide-gray-800">
                ${lista.map(p => `
                    <tr>
                        <td class="px-4 py-2 flex items-center gap-2">${getDivisaElement(p.divisa_icono, p.divisa)} ${formatNumber(p.monto)}</td>
                        <td class="px-4 py-2 text-right"><span class="text-[10px] uppercase border border-gray-600 rounded px-1">${p.tipo}</span></td>
                        <td class="px-4 py-2 text-right"><button class="text-red-500 hover:text-white" onclick="eliminarPago(${p.id}, '${origen}')">✕</button></td>
                    </tr>`).join('')}
                </tbody>
            </table>
        </div>`;
    }
    
    window.eliminarPago = (id, origen) => {
        if(confirm("¿Eliminar pago?")) {
            fetch(`https://cambiosorion.cl/data/detalle-op.php`, { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({id, origen}) })
            .then(r=>r.json()).then(r => { if(r.success) location.reload(); else alert(r.message); });
        }
    };
});