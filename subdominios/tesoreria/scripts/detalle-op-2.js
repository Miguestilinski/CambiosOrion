document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    const dashboardContainer = document.getElementById("dashboard-container");

    if (!id) {
        dashboardContainer.innerHTML = "<p class='text-white p-6'>ID de operación no proporcionado.</p>";
        return;
    }

    // --- Helpers Visuales ---
    const formatNumber = (num) => {
        const n = parseFloat(num);
        return isNaN(n) ? num : n.toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    };

    const formatCurrency = (amount) => "$" + formatNumber(amount);

    const getBadgeColor = (estado) => {
        const est = (estado || '').toLowerCase();
        if (est === 'vigente') return 'bg-blue-900 text-blue-300 border border-blue-700';
        if (est === 'pagado') return 'bg-green-900 text-green-300 border border-green-700';
        if (est === 'abonado') return 'bg-orange-900 text-orange-300 border border-orange-700';
        if (est === 'anulado') return 'bg-red-900 text-red-300 border border-red-700';
        return 'bg-gray-700 text-gray-300';
    };

    const getDivisaElement = (urlIcono, nombreDivisa) => {
        if (urlIcono && urlIcono.trim() !== "") {
            return `<img src="${urlIcono}" alt="${nombreDivisa}" class="w-6 h-6 object-contain mr-2">`;
        }
        return `<span class="text-xl mr-2">💵</span>`;
    };

    // --- Carga de Datos ---
    fetch(`https://cambiosorion.cl/data/detalle-op.php?id=${id}`)
        .then(async res => {
            const text = await res.text();
            try { return JSON.parse(text); } catch (e) { throw new Error("Respuesta no válida del servidor"); }
        })
        .then(data => {
            if (data.error) {
                dashboardContainer.innerHTML = `<p class="text-red-400 p-6">${data.error}</p>`;
                return;
            }
            renderDashboard(data);
        })
        .catch(err => {
            console.error(err);
            dashboardContainer.innerHTML = "<p class='text-red-400 p-6'>Error al cargar la operación.</p>";
        });


    // --- Renderizado Principal ---
    function renderDashboard(data) {
        const op = data.operacion;
        const detalles = data.detalles || [];
        const pagos = data.pagos || [];

        // Cálculos Financieros
        const total = parseFloat(op.total);
        
        // Calcular lo pagado realmente basado en el array de pagos, filtrando por la divisa de liquidación si es necesario
        // O usar el monto_pagado que viene del PHP si ya está sumado
        const pagado = parseFloat(op.monto_pagado || 0); 
        const restante = Math.max(0, total - pagado);
        const porcentajePagado = total > 0 ? Math.min(100, (pagado / total) * 100) : 0;
        
        const badgeClass = getBadgeColor(op.estado);

        // Construcción del HTML
        let html = `
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <div class="flex items-center gap-3 mb-1">
                        <span class="text-gray-400 text-xs uppercase tracking-wider">Operación</span>
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase border bg-gray-800 text-gray-400 border-gray-600">${op.tipo_transaccion}</span>
                    </div>
                    <div class="flex items-center gap-3">
                        <h1 class="text-3xl font-bold text-white">#${op.id}</h1>
                        <span class="px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wide ${badgeClass}">${op.estado}</span>
                    </div>
                </div>
                
                <div class="flex flex-wrap gap-2">
                    ${op.estado !== 'Anulado' ? `
                        <button id="btn-emitir-sii" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded shadow flex items-center gap-2 text-sm transition">
                            <span>📄</span> ${op.numero_documento ? 'Ver Documento' : 'Emitir SII'}
                        </button>
                        <button id="btn-anular" class="bg-red-900/80 hover:bg-red-800 text-red-200 border border-red-700 px-4 py-2 rounded shadow flex items-center gap-2 text-sm transition">
                            <span>🚫</span> Anular
                        </button>
                    ` : ''}
                    <button id="btn-imprimir" class="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded shadow flex items-center gap-2 text-sm transition">
                        <span>🖨️</span> Imprimir
                    </button>
                     <button id="btn-pdf" class="bg-blue-700 hover:bg-blue-600 text-white px-4 py-2 rounded shadow flex items-center gap-2 text-sm transition">
                        <span>⬇️</span> PDF
                    </button>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div class="bg-gray-800 border border-gray-700 rounded-xl p-5 shadow-lg relative overflow-hidden">
                    <div class="absolute top-0 right-0 p-4 opacity-10 text-6xl">💰</div>
                    <p class="text-gray-400 text-xs uppercase font-bold tracking-wider mb-1">Total Operación</p>
                    <p class="text-3xl font-bold text-white">${formatCurrency(total)}</p>
                </div>

                <div class="bg-gray-800 border border-gray-700 rounded-xl p-5 shadow-lg">
                    <p class="text-gray-400 text-xs uppercase font-bold tracking-wider mb-1">Total Pagado</p>
                    <p class="text-3xl font-bold text-green-400">${formatCurrency(pagado)}</p>
                    <div class="w-full bg-gray-700 h-1.5 rounded-full mt-3">
                        <div class="bg-green-500 h-1.5 rounded-full" style="width: ${porcentajePagado}%"></div>
                    </div>
                </div>

                <div class="bg-gray-800 border border-gray-700 rounded-xl p-5 shadow-lg">
                     <p class="text-gray-400 text-xs uppercase font-bold tracking-wider mb-1">Restante por Pagar</p>
                     <p class="text-3xl font-bold ${restante > 0 ? 'text-yellow-400' : 'text-gray-500'}">${formatCurrency(restante)}</p>
                     <p class="text-xs text-gray-500 mt-1">${restante === 0 ? 'Operación saldada' : 'Pendiente de pago'}</p>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                
                <div class="bg-gray-800 rounded-xl border border-gray-700 p-5 space-y-4">
                    <h3 class="text-white font-bold border-b border-gray-700 pb-2 text-sm uppercase">Información General</h3>
                    
                    <div class="grid grid-cols-2 gap-y-4 text-sm">
                        <div class="text-gray-400">Fecha:</div>
                        <div class="text-white text-right font-medium">${op.fecha}</div>

                        <div class="text-gray-400">Cliente:</div>
                        <div class="text-white text-right font-medium truncate" title="${op.nombre_cliente}">${op.nombre_cliente}</div>

                        <div class="text-gray-400">Vendedor:</div>
                        <div class="text-white text-right text-gray-300">${op.vendedor || '—'}</div>

                        <div class="text-gray-400">Caja:</div>
                        <div class="text-white text-right text-gray-300">${op.caja || '—'}</div>
                        
                        <div class="text-gray-400">Documento:</div>
                        <div class="text-white text-right text-blue-400">${op.numero_documento || 'Sin emitir'}</div>
                    </div>
                    
                    ${op.observaciones ? `
                    <div class="pt-2 border-t border-gray-700 mt-2">
                        <p class="text-xs text-gray-500 uppercase mb-1">Observaciones</p>
                        <p class="text-sm text-gray-300 italic">"${op.observaciones}"</p>
                    </div>` : ''}
                </div>

                <div class="lg:col-span-2 bg-gray-800 rounded-xl border border-gray-700 overflow-hidden flex flex-col">
                    <div class="p-4 border-b border-gray-700 bg-gray-800/50 flex justify-between items-center">
                        <h3 class="text-white font-bold text-sm uppercase">Detalle de Divisas</h3>
                    </div>
                    <div class="overflow-x-auto flex-1">
                        <table class="w-full text-sm text-left text-gray-300">
                            <thead class="text-xs text-gray-400 uppercase bg-gray-900/50">
                                <tr>
                                    <th class="px-4 py-3">Divisa</th>
                                    <th class="px-4 py-3 text-right">Monto</th>
                                    <th class="px-4 py-3 text-right">Tasa</th>
                                    <th class="px-4 py-3 text-right">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-700">
                                ${detalles.map(d => `
                                <tr class="hover:bg-gray-700/50 transition">
                                    <td class="px-4 py-3 font-medium text-white flex items-center">
                                        ${getDivisaElement(d.divisa_icono, d.divisa)}
                                        ${d.divisa}
                                    </td>
                                    <td class="px-4 py-3 text-right font-mono">${formatNumber(d.monto)}</td>
                                    <td class="px-4 py-3 text-right font-mono text-gray-400">${formatNumber(d.tasa_cambio)}</td>
                                    <td class="px-4 py-3 text-right font-bold text-white font-mono">${formatCurrency(d.subtotal)}</td>
                                </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                    <div class="bg-gray-900/80 p-4 flex justify-between items-center border-t border-gray-700">
                        <span class="text-gray-400 text-sm">Total Calculado</span>
                        <span class="text-xl font-bold text-white">${formatCurrency(total)}</span>
                    </div>
                </div>
            </div>

            <div class="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden mb-10">
                <div class="p-5 border-b border-gray-700 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-900/30">
                    <h2 class="text-lg font-bold text-white flex items-center gap-2">
                        <span>💳</span> Gestión de Pagos
                    </h2>
                    
                    ${op.estado !== 'Pagado' && op.estado !== 'Anulado' ? `
                    <div class="flex gap-2">
                        <button id="btn-full-cliente" class="px-3 py-1.5 text-xs font-medium text-blue-200 bg-blue-900/50 border border-blue-700 rounded hover:bg-blue-800 transition">
                            Pago Total Cliente
                        </button>
                        <button id="btn-full-orion" class="px-3 py-1.5 text-xs font-medium text-purple-200 bg-purple-900/50 border border-purple-700 rounded hover:bg-purple-800 transition">
                            Pago Total Orion
                        </button>
                    </div>
                    ` : ''}
                </div>

                <div class="p-5">
                    ${op.estado !== 'Pagado' && op.estado !== 'Anulado' ? `
                    <form id="form-pago" class="bg-gray-700/30 rounded-lg p-4 border border-gray-600 mb-6">
                        <div class="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                            
                            <div class="md:col-span-3">
                                <label class="block text-xs text-gray-400 mb-2 uppercase font-bold">¿Quién paga?</label>
                                <div class="grid grid-cols-2 gap-2">
                                    <div class="origen-option cursor-pointer border border-gray-600 rounded p-2 text-center hover:bg-gray-600 transition" data-value="cliente">
                                        <span class="block text-xl">👤</span>
                                        <span class="text-xs text-white">Cliente</span>
                                    </div>
                                    <div class="origen-option cursor-pointer border border-gray-600 rounded p-2 text-center hover:bg-gray-600 transition" data-value="orion">
                                        <span class="block text-xl">🏢</span>
                                        <span class="text-xs text-white">Orion</span>
                                    </div>
                                </div>
                                <input type="hidden" id="input-origen">
                            </div>

                            <div class="md:col-span-3">
                                <label class="block text-xs text-gray-400 mb-1">Divisa</label>
                                <select id="select-divisa" class="w-full bg-gray-800 border border-gray-600 text-white text-sm rounded p-2">
                                    <option value="">Seleccione...</option>
                                </select>
                            </div>

                            <div class="md:col-span-2">
                                <label class="block text-xs text-gray-400 mb-1">Método</label>
                                <select id="select-metodo" class="w-full bg-gray-800 border border-gray-600 text-white text-sm rounded p-2">
                                    <option value="efectivo">Efectivo</option>
                                    <option value="cuenta">Cuenta</option>
                                    <option value="transferencia">Transferencia</option>
                                    <option value="tarjeta">Tarjeta</option>
                                </select>
                            </div>

                            <div class="md:col-span-2">
                                <label class="block text-xs text-gray-400 mb-1">Monto</label>
                                <input type="text" id="input-monto" class="w-full bg-gray-800 border border-gray-600 text-white text-sm rounded p-2" placeholder="$0">
                            </div>

                            <div class="md:col-span-2">
                                <button type="button" id="btn-registrar" class="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-2 rounded shadow transition">
                                    Registrar
                                </button>
                            </div>
                        </div>
                        <div id="contenedor-cuenta" class="mt-3 hidden"></div>
                    </form>
                    ` : ''}

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        ${renderTablaPagos("Pagos Recibidos (Cliente)", pagos.filter(p => p.origen === 'cliente'))}
                        ${renderTablaPagos("Pagos Realizados (Orion)", pagos.filter(p => p.origen === 'orion'))}
                    </div>
                </div>
            </div>
        `;

        dashboardContainer.innerHTML = html;

        // --- EVENT LISTENERS (Post-Render) ---
        
        // 1. Selectores Origen
        const origenOpts = document.querySelectorAll('.origen-option');
        const inputOrigen = document.getElementById('input-origen');
        const divisaSelect = document.getElementById('select-divisa');

        origenOpts.forEach(opt => {
            opt.addEventListener('click', () => {
                // Reset visual
                origenOpts.forEach(o => o.classList.remove('bg-blue-600', 'border-blue-500', 'bg-purple-600', 'border-purple-500'));
                
                const val = opt.dataset.value;
                inputOrigen.value = val;
                
                // Estilo activo
                if(val === 'cliente') opt.classList.add('bg-blue-600', 'border-blue-500');
                else opt.classList.add('bg-purple-600', 'border-purple-500');

                // Cargar Divisas Dinámicamente
                cargarDivisasLogicas(op.id, op.tipo_transaccion, val);
            });
        });

        // 2. Botón Registrar
        const btnRegistrar = document.getElementById('btn-registrar');
        if(btnRegistrar) {
            btnRegistrar.addEventListener('click', () => {
                procesarPagoManual(op, restante);
            });
        }

        // 3. Acciones Globales
        setupGlobalActions(op, restante, data);
        
        // 4. Formateador de Monto
        const inputMonto = document.getElementById('input-monto');
        if(inputMonto) {
            inputMonto.addEventListener('input', (e) => {
                // Lógica simple para mantener solo números y formatear visualmente si quieres
                // Por simplicidad aquí dejamos el input raw o aplicamos tu formatToCLP
            });
        }

        // 5. Cambio de método de pago (mostrar cuentas)
        const selectMetodo = document.getElementById('select-metodo');
        if(selectMetodo) {
            selectMetodo.addEventListener('change', async () => {
                 const metodo = selectMetodo.value;
                 const divisaId = divisaSelect.value;
                 const origen = inputOrigen.value;
                 const contenedorCuenta = document.getElementById('contenedor-cuenta');
                 
                 contenedorCuenta.innerHTML = "";
                 contenedorCuenta.classList.add('hidden');

                 if((metodo === 'cuenta' || metodo === 'transferencia' || metodo === 'tarjeta') && divisaId) {
                     contenedorCuenta.classList.remove('hidden');
                     contenedorCuenta.innerHTML = "<p class='text-xs text-gray-400'>Cargando cuentas...</p>";
                     
                     // Lógica de fetch cuentas (simplificada para el ejemplo)
                     let url = `https://cambiosorion.cl/data/cuentas.php?activa=1&divisa_id=${divisaId}`;
                     if (origen === "cliente" && metodo === "cuenta") url += `&cliente_id=${op.cliente_id}`;
                     else url += `&tipo_cuenta=administrativa`; // Para transferencias/tarjetas a cuentas Orion

                     try {
                         const res = await fetch(url);
                         const cuentas = await res.json(); // Asumiendo que devuelve array directo o {data: []}
                         const lista = Array.isArray(cuentas) ? cuentas : (cuentas.data || []);
                         
                         if(lista.length > 0) {
                             contenedorCuenta.innerHTML = `
                                <label class="block text-xs text-gray-400 mb-1">Seleccione Cuenta</label>
                                <select id="select-cuenta-real" class="w-full bg-gray-800 border border-gray-600 text-white text-sm rounded p-2">
                                    ${lista.map(c => `<option value="${c.id}">${c.nombre || (c.banco + ' ' + c.numero)}</option>`).join('')}
                                </select>
                             `;
                         } else {
                             contenedorCuenta.innerHTML = "<p class='text-xs text-yellow-500'>No hay cuentas disponibles.</p>";
                         }
                     } catch(e) { console.error(e); }
                 }
            });
        }
    }

    // --- Funciones Auxiliares de Renderizado ---

    function renderTablaPagos(titulo, listaPagos) {
        if (listaPagos.length === 0) {
            return `
            <div class="bg-gray-900/50 rounded-lg p-4 border border-gray-700 text-center">
                <h4 class="text-xs font-bold text-gray-500 uppercase mb-2">${titulo}</h4>
                <p class="text-sm text-gray-600 italic">No hay registros.</p>
            </div>`;
        }
        return `
        <div class="bg-gray-900/50 rounded-lg border border-gray-700 overflow-hidden">
            <div class="bg-gray-800 px-4 py-2 border-b border-gray-700">
                 <h4 class="text-xs font-bold text-gray-400 uppercase">${titulo}</h4>
            </div>
            <table class="w-full text-sm text-left text-gray-300">
                <tbody class="divide-y divide-gray-700">
                ${listaPagos.map(p => `
                    <tr>
                        <td class="px-3 py-2">
                            <div class="text-xs text-gray-500">${p.fecha}</div>
                            <div class="font-medium text-white flex items-center">
                                ${getDivisaElement(p.divisa_icono, p.divisa)}
                                ${formatCurrency(p.monto)}
                            </div>
                        </td>
                        <td class="px-3 py-2 text-right">
                             <div class="text-xs uppercase border border-gray-600 rounded px-1 inline-block">${p.tipo}</div>
                             ${p.cuenta_nombre ? `<div class="text-xs text-gray-500 mt-1 truncate max-w-[100px]" title="${p.cuenta_nombre}">${p.cuenta_nombre}</div>` : ''}
                        </td>
                        <td class="px-3 py-2 text-right">
                             <button class="text-red-500 hover:text-red-300 text-xs font-bold" onclick="eliminarPago(${p.id}, '${p.origen}')">✕</button>
                        </td>
                    </tr>
                `).join('')}
                </tbody>
            </table>
        </div>`;
    }

    // --- Lógica de Negocio (Simplificada) ---

    async function cargarDivisasLogicas(opId, tipoOp, quienPaga) {
        const select = document.getElementById('select-divisa');
        select.innerHTML = "<option>Cargando...</option>";
        
        try {
            const res = await fetch(`https://cambiosorion.cl/data/detalle-op.php?buscar_divisas=1&operacion_id=${opId}`);
            const divisas = await res.json();
            select.innerHTML = '<option value="">Seleccione...</option>';

            // Filtro lógico (mismo que tenías)
            const esCLP = (id) => id === 'D47';
            const filtered = divisas.filter(d => {
                 if (tipoOp === "Compra" && quienPaga === "orion") return esCLP(d.id);
                 if (tipoOp === "Compra" && quienPaga === "cliente") return !esCLP(d.id);
                 if (tipoOp === "Venta" && quienPaga === "orion") return !esCLP(d.id);
                 if (tipoOp === "Venta" && quienPaga === "cliente") return esCLP(d.id);
                 return false;
            });

            filtered.forEach(d => {
                const opt = document.createElement('option');
                opt.value = d.id;
                opt.textContent = d.nombre;
                select.appendChild(opt);
            });
        } catch(e) { select.innerHTML = "<option>Error</option>"; }
    }

    function setupGlobalActions(op, restante, fullData) {
        // Anular
        const btnAnular = document.getElementById('btn-anular');
        if(btnAnular) {
            btnAnular.addEventListener('click', () => {
                if(confirm("¿Anular operación? Esto revertirá inventario.")) {
                    enviarAccion({ id: op.id, action: 'anular' }); // Ajustar payload según backend
                }
            });
        }

        // PDF
        const btnPdf = document.getElementById('btn-pdf');
        if(btnPdf) {
            btnPdf.addEventListener('click', () => {
                if(op.numero_documento) window.open(`https://cambiosorion.cl/documentos/${op.numero_documento}.pdf`, '_blank');
                else alert("No hay documento PDF generado.");
            });
        }

        // SII
        const btnSii = document.getElementById('btn-emitir-sii');
        if(btnSii && !op.numero_documento) {
            btnSii.addEventListener('click', () => {
                 if(confirm("¿Emitir boleta/factura al SII?")) {
                     fetch(`https://cambiosorion.cl/data/emitir-doc.php`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ id: op.id }) // Asegúrate de enviar el ID correcto (op.id o op.operacion_id)
                    }).then(() => location.reload());
                 }
            });
        } else if (btnSii) {
             btnSii.addEventListener('click', () => window.open(`https://cambiosorion.cl/documentos/${op.numero_documento}.pdf`, '_blank'));
        }
        
        // Pagos Rápidos
        const btnFullCli = document.getElementById('btn-full-cliente');
        if(btnFullCli) btnFullCli.addEventListener('click', () => registrarPagoCompleto("cliente", fullData, op, restante));
        
        const btnFullOrion = document.getElementById('btn-full-orion');
        if(btnFullOrion) btnFullOrion.addEventListener('click', () => registrarPagoCompleto("orion", fullData, op, restante));

        document.getElementById('btn-imprimir').addEventListener('click', () => window.print());
    }

    // --- Acciones de Envío ---

    function registrarPagoCompleto(origen, data, op, restante) {
        // (Tu lógica original para determinar divisa permitida)
        // Simplificada aquí:
        const esCompra = op.tipo_transaccion === "Compra";
        let divisaPermitida = null;
        
        // Lógica rápida: si es Compra y paga Orion -> D47. Si paga cliente -> Divisa extranjera.
        const detalles = data.detalles || [];
        if (esCompra && origen === "orion") divisaPermitida = "D47";
        else if (esCompra && origen === "cliente") divisaPermitida = detalles.find(d => d.divisa_id !== "D47")?.divisa_id;
        else if (!esCompra && origen === "cliente") divisaPermitida = "D47";
        else if (!esCompra && origen === "orion") divisaPermitida = detalles.find(d => d.divisa_id !== "D47")?.divisa_id;

        if(!divisaPermitida) return alert("No se pudo determinar la divisa automática.");

        const payload = {
            id: op.id,
            estado: "Pagado",
            pagos: restante,
            caja_id: 99,
            tipo_pago: "efectivo",
            divisa: divisaPermitida,
            origen: origen,
            cliente_id: op.cliente_id,
            cuenta_id: null
        };
        enviarPago(payload);
    }

    function procesarPagoManual(op, restante) {
        const origen = document.getElementById('input-origen').value;
        const divisa = document.getElementById('select-divisa').value;
        const metodo = document.getElementById('select-metodo').value;
        const monto = parseFloat(document.getElementById('input-monto').value);
        const cuentaReal = document.getElementById('select-cuenta-real')?.value || null;

        if(!origen || !divisa || !monto) return alert("Complete todos los campos");

        let nuevoEstado = "Abonado";
        // Comparación simple (cuidado con decimales flotantes)
        if (monto >= restante - 0.5) nuevoEstado = "Pagado"; 

        const payload = {
            id: op.id,
            estado: nuevoEstado,
            pagos: monto,
            caja_id: 99, // Ojo: esto debería venir dinámico si manejas múltiples cajas
            tipo_pago: metodo,
            divisa: divisa,
            origen: origen,
            cliente_id: op.cliente_id,
            cuenta_id: cuentaReal
        };
        enviarPago(payload);
    }

    function enviarPago(payload) {
        fetch(`https://cambiosorion.cl/data/detalle-op.php`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        })
        .then(res => res.json())
        .then(res => {
            if (res.success) location.reload();
            else alert("Error: " + res.message);
        })
        .catch(e => alert("Error de conexión"));
    }
    
    // Exponer funcion globalmente para el onclick del HTML string
    window.eliminarPago = (id, origen) => {
        if(confirm("¿Eliminar este pago?")) {
             fetch(`https://cambiosorion.cl/data/detalle-op.php`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: id, origen: origen }) // Solo enviamos ID y origen para borrar
            })
            .then(res => res.json())
            .then(res => {
                if(res.success) location.reload();
                else alert("Error al eliminar");
            });
        }
    };
});