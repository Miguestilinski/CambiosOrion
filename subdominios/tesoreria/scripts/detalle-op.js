document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    const dashboardContainer = document.getElementById("dashboard-container");
    let info = null; // Variable global para mantener el estado de la operación

    if (!id) {
        dashboardContainer.innerHTML = "<p class='text-white p-6'>ID de operación no proporcionado.</p>";
        return;
    }

    // --- 1. HELPERS VISUALES Y DE FORMATO (Conservados y Mejorados) ---
    const formatNumber = (num) => {
        const n = parseFloat(num);
        return isNaN(n) ? num : n.toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    };

    const formatCurrency = (amount) => "$" + formatNumber(amount);

    // Helper para formatear input en tiempo real (Lógica original preservada)
    function formatToCLP(value) {
        if (value === null || value === undefined || value === "") return "";
        const number = parseFloat(value);
        if (isNaN(number)) return "";
        return "$" + number.toLocaleString("es-CL", {
            minimumFractionDigits: number % 1 === 0 ? 0 : 2,
            maximumFractionDigits: 2
        });
    }

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
            return `<img src="${urlIcono}" alt="${nombreDivisa}" class="w-6 h-6 object-contain mr-2 inline-block">`;
        }
        return `<span class="text-xl mr-2">💵</span>`;
    };

    // --- 2. CARGA DE DATOS ---
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
            // Guardamos la info globalmente para usarla en las funciones de lógica
            info = data.operacion;
            renderDashboard(data);
        })
        .catch(err => {
            console.error(err);
            dashboardContainer.innerHTML = "<p class='text-red-400 p-6'>Error al cargar la operación.</p>";
        });


    // --- 3. RENDERIZADO DEL DASHBOARD (HTML ESTRUCTURAL) ---
    function renderDashboard(data) {
        const op = data.operacion;
        const detalles = data.detalles || [];
        const pagos = data.pagos || [];

        // Cálculos Financieros
        const total = parseFloat(op.total);
        const pagado = parseFloat(op.monto_pagado || 0); 
        const restante = Math.max(0, total - pagado);
        const porcentajePagado = total > 0 ? Math.min(100, (pagado / total) * 100) : 0;
        const badgeClass = getBadgeColor(op.estado);
        
        // Filtramos pagos para las tablas
        const pagosCliente = pagos.filter(p => p.origen === "cliente");
        const pagosOrion = pagos.filter(p => p.origen === "orion");

        // --- HTML CON PALETA "ORION CLEAN" ---
        let html = `
            <!-- CABECERA: Fondo Transparente para integrarse con la constelación -->
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 pb-6 border-b border-gray-700/50">
                <div>
                    <div class="flex items-center gap-3 mb-1">
                        <span class="text-blue-400 text-xs uppercase tracking-wider font-bold">Operación</span>
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-gray-900 border border-gray-700 text-gray-300">${op.tipo_transaccion}</span>
                    </div>
                    <div class="flex items-center gap-4">
                        <h1 class="text-4xl font-bold text-white tracking-tight drop-shadow-md">#${op.id}</h1>
                        <span class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${badgeClass}">${op.estado}</span>
                    </div>
                </div>
                
                <div class="flex flex-wrap gap-2">
                     <button id="btn-emitir-sii" class="bg-blue-700 hover:bg-blue-600 text-white px-4 py-2 rounded shadow-md flex items-center gap-2 text-sm transition border-b-2 border-blue-900">
                        <span>📄</span> ${op.numero_documento ? 'Ver Documento' : 'Emitir SII'}
                    </button>
                    ${op.estado !== 'Anulado' ? `
                        <button id="btn-anular" class="bg-transparent hover:bg-red-900/30 text-red-400 border border-red-900 px-4 py-2 rounded shadow flex items-center gap-2 text-sm transition">
                            Anular
                        </button>
                    ` : ''}
                    <button id="btn-imprimir" class="bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-600 px-4 py-2 rounded shadow flex items-center gap-2 text-sm transition">
                        <span>🖨️</span> Imprimir
                    </button>
                     <button id="btn-pdf" class="bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-600 px-4 py-2 rounded shadow flex items-center gap-2 text-sm transition">
                        <span>⬇️</span> PDF
                    </button>
                </div>
            </div>

            <!-- HERO CARDS: Alternancia de Fondos (Sólido vs Transparente) -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                
                <!-- 1. TOTAL: Fondo Oscuro Sólido con Acento Azul -->
                <div class="bg-gray-900 border-l-4 border-blue-600 rounded-r-xl p-6 shadow-lg relative overflow-hidden">
                    <div class="absolute right-4 top-4 opacity-20 text-5xl">💰</div>
                    <p class="text-blue-400 text-xs uppercase font-bold tracking-wider mb-2">Total Operación</p>
                    <p class="text-3xl md:text-4xl font-bold text-white">${formatCurrency(total)}</p>
                </div>

                <!-- 2. PAGADO: Fondo Gris Intermedio -->
                <div class="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700/50">
                    <p class="text-gray-400 text-xs uppercase font-bold tracking-wider mb-2">Total Pagado</p>
                    <p class="text-3xl font-bold text-green-400">${formatCurrency(pagado)}</p>
                    <div class="w-full bg-gray-700 h-1.5 rounded-full mt-4">
                        <div class="bg-green-600 h-1.5 rounded-full" style="width: ${porcentajePagado}%"></div>
                    </div>
                </div>

                <!-- 3. POR PAGAR: Fondo Transparente con Borde -->
                <div class="bg-transparent border border-gray-600 rounded-xl p-6 shadow-sm">
                     <p class="text-gray-400 text-xs uppercase font-bold tracking-wider mb-2">Restante por Pagar</p>
                     <p class="text-3xl font-bold ${restante > 0 ? 'text-yellow-400' : 'text-gray-500'}">${formatCurrency(restante)}</p>
                     <p class="text-xs text-gray-500 mt-2 italic border-l-2 border-gray-700 pl-2">${restante === 0 ? 'Operación saldada' : 'Pendiente de pago'}</p>
                </div>
            </div>

            <!-- GRID CENTRAL -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                
                <!-- INFO GENERAL: Fondo Gris Intermedio (Gray-800) -->
                <div class="bg-gray-800 rounded-xl border border-gray-700 p-5 flex flex-col shadow-md">
                    <h3 class="text-white font-bold border-b border-gray-600 pb-3 mb-4 text-sm uppercase flex items-center gap-2">
                        <span class="w-1 h-4 bg-blue-500 rounded-full"></span> Información General
                    </h3>
                    
                    <div class="grid grid-cols-2 gap-y-4 text-sm flex-1 content-start">
                        <div class="text-gray-500">Fecha:</div>
                        <div class="text-white text-right font-medium">${op.fecha}</div>

                        <div class="text-gray-500">Cliente:</div>
                        <div class="text-white text-right font-medium truncate text-blue-200" title="${op.nombre_cliente}">${op.nombre_cliente}</div>

                        <div class="text-gray-500">Vendedor:</div>
                        <div class="text-white text-right text-gray-300">${op.vendedor || '—'}</div>

                        <div class="text-gray-500">Caja:</div>
                        <div class="text-white text-right text-gray-300">${op.caja || '—'}</div>
                        
                        <div class="text-gray-500">Documento SII:</div>
                        <div class="text-white text-right text-blue-400 font-mono">${op.numero_documento || 'N/A'}</div>
                    </div>
                    
                    ${op.observaciones ? `
                    <div class="pt-4 border-t border-gray-700 mt-4">
                        <p class="text-xs text-gray-500 uppercase mb-1 font-bold">Observaciones</p>
                        <p class="text-sm text-gray-300 italic bg-gray-900/50 p-2 rounded">"${op.observaciones}"</p>
                    </div>` : ''}
                </div>

                <!-- TABLA DIVISAS: Fondo Oscuro (Gray-900) para contraste de datos -->
                <div class="lg:col-span-2 bg-gray-900 rounded-xl border border-gray-700 overflow-hidden flex flex-col shadow-lg">
                    <div class="p-4 border-b border-gray-800 bg-gray-900 flex justify-between items-center">
                        <h3 class="text-gray-100 font-bold text-sm uppercase tracking-wide">Detalle de Divisas</h3>
                    </div>
                    <div class="overflow-x-auto flex-1 bg-gray-900">
                        <table class="w-full text-sm text-left text-gray-300">
                            <thead class="text-xs text-gray-400 uppercase bg-gray-800 border-b border-gray-700">
                                <tr>
                                    <th class="px-4 py-3 font-semibold">Divisa</th>
                                    <th class="px-4 py-3 text-right font-semibold">Monto</th>
                                    <th class="px-4 py-3 text-right font-semibold">Tasa</th>
                                    <th class="px-4 py-3 text-right font-semibold">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-800">
                                ${detalles.map(d => `
                                <tr class="hover:bg-gray-800 transition">
                                    <td class="px-4 py-3 font-medium text-white flex items-center">
                                        ${getDivisaElement(d.divisa_icono, d.divisa)}
                                        ${d.divisa}
                                    </td>
                                    <td class="px-4 py-3 text-right font-mono text-gray-300">${formatNumber(d.monto)}</td>
                                    <td class="px-4 py-3 text-right font-mono text-gray-500">${formatNumber(d.tasa_cambio)}</td>
                                    <td class="px-4 py-3 text-right font-bold text-white font-mono">${formatCurrency(d.subtotal)}</td>
                                </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                    <div class="bg-black/20 p-4 flex justify-between items-center border-t border-gray-800">
                        <span class="text-gray-500 text-xs uppercase font-bold">Total Calculado</span>
                        <span class="text-xl font-bold text-blue-400">${formatCurrency(total)}</span>
                    </div>
                </div>
            </div>

            <!-- SECCIÓN DE PAGOS: Fondo Transparente con Contenedor Interno -->
            <div class="rounded-xl border border-gray-700 bg-transparent overflow-hidden mb-10">
                <!-- Header: Gris Intermedio -->
                <div class="p-5 border-b border-gray-700 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-800">
                    <h2 class="text-lg font-bold text-white flex items-center gap-2">
                        Gestión de Pagos
                    </h2>
                    
                    ${op.estado !== 'Pagado' && op.estado !== 'Anulado' ? `
                    <div class="flex gap-2">
                        <button id="btn-full-cliente" class="px-3 py-1.5 text-xs font-bold text-blue-200 bg-blue-900/50 border border-blue-800 rounded hover:bg-blue-800 transition">
                            Pago Total Cliente
                        </button>
                        <button id="btn-full-orion" class="px-3 py-1.5 text-xs font-bold text-purple-200 bg-purple-900/50 border border-purple-800 rounded hover:bg-purple-800 transition">
                            Pago Total Orion
                        </button>
                    </div>
                    ` : ''}
                </div>

                <div class="p-6 bg-gray-900/80">
                    <!-- Formulario -->
                    <div id="form-container" class="${(op.estado === 'Pagado' || op.estado === 'Anulado') ? 'hidden' : ''}">
                        <form id="form-pago" class="bg-gray-800 rounded-xl p-5 border border-gray-700 mb-8 shadow-md">
                            <h4 class="text-gray-400 text-xs font-bold uppercase mb-4 border-b border-gray-700 pb-2">Nuevo Registro</h4>
                            <div class="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                                
                                <div class="md:col-span-3">
                                    <label class="block text-xs text-gray-400 mb-2 uppercase font-bold">¿Quién paga?</label>
                                    <div class="grid grid-cols-2 gap-2">
                                        <div class="origen-option cursor-pointer border border-gray-600 rounded-lg p-3 text-center hover:border-blue-500 transition group bg-gray-700" data-value="cliente">
                                            <span class="block text-2xl mb-1 group-hover:scale-110 transition">👤</span>
                                            <span class="text-xs text-gray-300 font-bold group-hover:text-white">Cliente</span>
                                        </div>
                                        <div class="origen-option cursor-pointer border border-gray-600 rounded-lg p-3 text-center hover:border-purple-500 transition group bg-gray-700" data-value="orion">
                                            <span class="block text-2xl mb-1 group-hover:scale-110 transition">🏢</span>
                                            <span class="text-xs text-gray-300 font-bold group-hover:text-white">Orion</span>
                                        </div>
                                    </div>
                                    <input type="hidden" id="origen-pago">
                                </div>

                                <div class="md:col-span-3">
                                    <label class="block text-xs text-gray-400 mb-1 font-bold ml-1">Divisa</label>
                                    <select id="divisa-select" class="w-full bg-gray-900 border border-gray-600 text-white text-sm rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition">
                                        <option value="">Seleccione...</option>
                                    </select>
                                </div>

                                <div class="md:col-span-2">
                                    <label class="block text-xs text-gray-400 mb-1 font-bold ml-1">Método</label>
                                    <select id="tipo-pago" class="w-full bg-gray-900 border border-gray-600 text-white text-sm rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition">
                                        <option value="">Seleccione...</option>
                                        <option value="efectivo">Efectivo</option>
                                        <option value="cuenta">Cuenta</option>
                                        <option value="transferencia">Transferencia</option>
                                        <option value="tarjeta">Tarjeta</option>
                                    </select>
                                </div>

                                <div class="md:col-span-2">
                                    <label class="block text-xs text-gray-400 mb-1 font-bold ml-1">Monto</label>
                                    <div class="relative">
                                        <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">$</div>
                                        <input type="text" id="input-pago" class="w-full bg-gray-900 border border-gray-600 text-white text-sm rounded-lg p-2.5 pl-6 font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" placeholder="0">
                                    </div>
                                </div>

                                <div class="md:col-span-2">
                                    <button type="button" id="btn-registrar-pago" class="w-full bg-green-700 hover:bg-green-600 text-white font-bold py-2.5 rounded-lg shadow-md transition transform hover:-translate-y-0.5">
                                        Registrar
                                    </button>
                                </div>
                            </div>
                            
                            <div id="input-cuenta" class="mt-4"></div>
                        </form>
                    </div>

                    <!-- Historial Tablas -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div id="tabla-pagos-cliente">${renderTablaPagos("Pagos Recibidos (Cliente)", pagosCliente, "cliente", "blue")}</div>
                        <div id="tabla-pagos-orion">${renderTablaPagos("Pagos Realizados (Orion)", pagosOrion, "orion", "purple")}</div>
                    </div>
                </div>
            </div>
        `;

        dashboardContainer.innerHTML = html;

        // --- 4. INICIALIZACIÓN DE LÓGICA (ATTACH LISTENERS) ---
        // Una vez el HTML existe, conectamos toda la lógica original del archivo de 800 líneas.
        attachLogic(data, restante);
    }


    // --- 5. LÓGICA DE NEGOCIO Y EVENT LISTENERS ---
    function attachLogic(data, restante) {
        const op = data.operacion;
        const detalles = data.detalles || [];

        // A. Botones de Cabecera (PDF, SII, Anular, Imprimir)
        
        // PDF
        const btnPdf = document.getElementById('btn-pdf');
        if (btnPdf) {
            btnPdf.addEventListener('click', () => {
                if (op.numero_documento) {
                    window.open(`https://cambiosorion.cl/documentos/${op.numero_documento}.pdf`, "_blank");
                } else {
                    mostrarModal({ titulo: "❌ Error", mensaje: "No hay documento emitido para exportar PDF" });
                }
            });
        }

        // Imprimir
        const btnImprimir = document.getElementById('btn-imprimir');
        if (btnImprimir) btnImprimir.addEventListener('click', () => window.print());

        // Anular
        const btnAnular = document.getElementById('btn-anular');
        if (btnAnular) {
            btnAnular.addEventListener('click', () => {
                if (op.estado === "Anulado") return;
                
                mostrarModal({
                    titulo: "⚠️ Confirmar Anulación",
                    mensaje: "¿Seguro que deseas anular esta operación? Esto revertirá el inventario.",
                    textoConfirmar: "Sí, Anular",
                    textoCancelar: "Cancelar",
                    onConfirmar: () => {
                        fetch(`https://cambiosorion.cl/data/detalle-op.php`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ id: op.id })
                        })
                        .then(res => res.json())
                        .then(res => {
                            if (res.success) {
                                mostrarModal({ titulo: "✅ Éxito", mensaje: "Operación anulada", onConfirmar: () => location.reload() });
                            } else {
                                mostrarModal({ titulo: "❌ Error", mensaje: "Error al anular: " + res.message });
                            }
                        });
                    }
                });
            });
        }

        // Emitir SII
        const btnSii = document.getElementById('btn-emitir-sii');
        if (btnSii) {
            btnSii.addEventListener('click', () => {
                if (op.numero_documento) {
                    // Si ya existe, abre el PDF
                    window.open(`https://cambiosorion.cl/documentos/${op.numero_documento}.pdf`, "_blank");
                } else {
                    // Si no existe, emite
                    if (op.estado === "Anulado") return;
                    
                    mostrarModal({
                        titulo: "📄 Emitir Documento",
                        mensaje: "¿Deseas emitir el documento al SII?",
                        textoConfirmar: "Emitir",
                        textoCancelar: "Cancelar",
                        onConfirmar: () => {
                            fetch(`https://cambiosorion.cl/data/emitir-doc.php`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ id: op.id })
                            })
                            .then(res => res.json())
                            .then(res => {
                                if (res.success) {
                                    mostrarModal({ titulo: "✅ Éxito", mensaje: "Documento emitido correctamente", onConfirmar: () => location.reload() });
                                } else {
                                    mostrarModal({ titulo: "❌ Error", mensaje: res.message });
                                }
                            });
                        }
                    });
                }
            });
        }


        // B. Lógica del Formulario de Pagos (COMPLEJA)
        const origenInput = document.getElementById('origen-pago');
        const divisaSelect = document.getElementById('divisa-select');
        const tipoPagoSelect = document.getElementById('tipo-pago');
        const inputPago = document.getElementById('input-pago');
        const inputCuentaContainer = document.getElementById('input-cuenta');
        const btnRegistrar = document.getElementById('btn-registrar-pago');
        
        const origenOptions = document.querySelectorAll('.origen-option');

        // 1. Selector "¿Quién Paga?" (Visual + Lógica)
        origenOptions.forEach(opt => {
            opt.addEventListener('click', () => {
                // Reset visual
                origenOptions.forEach(o => o.classList.remove('bg-blue-600', 'border-blue-500', 'text-white', 'bg-purple-600', 'border-purple-500'));
                origenOptions.forEach(o => o.classList.add('text-gray-300'));
                
                const val = opt.dataset.value;
                origenInput.value = val;
                
                // Estilo activo
                opt.classList.remove('text-gray-300');
                opt.classList.add('text-white');
                if(val === 'cliente') opt.classList.add('bg-blue-600', 'border-blue-500');
                else opt.classList.add('bg-purple-600', 'border-purple-500');

                // Cargar Divisas Dinámicamente
                cargarDivisas(op.id, op.tipo_transaccion, val);
            });
        });

        // 2. Selector Divisa (Cambio -> Sugerir Monto)
        divisaSelect.addEventListener('change', () => {
            const divisaId = divisaSelect.value;
            let sugerido = 0;

            if (tipoPagoSelect.value === "cuenta") {
                 // Disparar cambio de tipo para recargar cuentas si cambia divisa
                tipoPagoSelect.dispatchEvent(new Event("change"));
            }

            if (divisaId === "D47") { // Peso Chileno
                // Calcular cuánto se ha pagado en pesos
                const pagosCLP = (data.pagos || [])
                    .filter(p => p.divisa.trim() === "Peso Chileno" || p.divisa_id === "D47" || p.divisa === "D47") // Robustez en chequeo
                    .reduce((sum, p) => sum + parseFloat(p.monto), 0);
                sugerido = Math.max(0, parseFloat(op.total) - pagosCLP);
            } else {
                // Buscar detalle de esa divisa para ver cuánto falta
                const detalle = detalles.find(d => d.divisa_id === divisaId);
                if (detalle) {
                    const pagosDivisa = (data.pagos || [])
                        .filter(p => p.divisa === detalle.divisa || p.divisa_id === divisaId)
                        .reduce((sum, p) => sum + parseFloat(p.monto), 0);
                    sugerido = Math.max(0, parseFloat(detalle.monto) - pagosDivisa);
                }
            }
            // Prellenar input con formato visual
            inputPago.placeholder = formatToCLP(sugerido);
            inputPago.dataset.sugerido = sugerido; // Guardar valor real
        });

        // 3. Selector Tipo Pago (Cambio -> Cargar Cuentas)
        tipoPagoSelect.addEventListener('change', async () => {
            const tipo = tipoPagoSelect.value;
            const divisaId = divisaSelect.value;
            const origen = origenInput.value;
            
            inputCuentaContainer.innerHTML = "";

            if (!tipo || !divisaId || !origen) return;

            if (tipo === "cuenta") {
                // Cargar cuentas contables (Cliente o Administrativa)
                let url = `https://cambiosorion.cl/data/cuentas.php?activa=1&divisa_id=${divisaId}`;
                if (origen === "cliente") url += `&cliente_id=${op.cliente_id}`;
                else url += `&tipo_cuenta=administrativa`;

                try {
                    inputCuentaContainer.innerHTML = "<p class='text-xs text-gray-400'>Cargando cuentas...</p>";
                    const res = await fetch(url);
                    const cuentas = await res.json();
                    const lista = Array.isArray(cuentas) ? cuentas : (cuentas.data || []);

                    if (lista.length > 0) {
                         inputCuentaContainer.innerHTML = `
                            <label class="block text-xs text-gray-400 mb-1">Cuenta Contable</label>
                            <select id="select-cuenta-real" class="w-full bg-gray-800 border border-gray-600 text-white text-sm rounded p-2">
                                <option value="">Seleccione cuenta...</option>
                                ${lista.map(c => `<option value="${c.id}">${c.nombre || (c.banco + ' ' + c.numero)}</option>`).join('')}
                            </select>
                         `;
                    } else {
                        inputCuentaContainer.innerHTML = `<p class="text-xs text-yellow-500">⚠️ No hay cuentas disponibles.</p>`;
                    }
                } catch (e) { inputCuentaContainer.innerHTML = "<p class='text-xs text-red-500'>Error cargando cuentas</p>"; }

            } else if (tipo === "transferencia" || tipo === "tarjeta") {
                // Cargar cuentas bancarias Orion
                let url = `https://cambiosorion.cl/data/cuentas.php?activa=1&divisa_id=${divisaId}&tipo_cuenta=administrativa`;
                try {
                    inputCuentaContainer.innerHTML = "<p class='text-xs text-gray-400'>Cargando cuentas bancarias...</p>";
                    const res = await fetch(url);
                    const result = await res.json();
                    const lista = result.data || []; // Estructura suele ser {success:true, data:[]}

                    if (lista.length > 0) {
                        inputCuentaContainer.innerHTML = `
                            <label class="block text-xs text-gray-400 mb-1">Cuenta Bancaria Orion</label>
                            <select id="select-cuenta-real" class="w-full bg-gray-800 border border-gray-600 text-white text-sm rounded p-2">
                                <option value="">Seleccione cuenta...</option>
                                ${lista.map(c => `<option value="${c.id}">${c.banco} - ${c.tipo_cuenta} (${c.numero})</option>`).join('')}
                            </select>
                        `;
                    } else {
                        inputCuentaContainer.innerHTML = `<p class="text-xs text-yellow-500">⚠️ No hay cuentas bancarias registradas para esta divisa.</p>`;
                    }
                } catch (e) { inputCuentaContainer.innerHTML = "<p class='text-xs text-red-500'>Error cargando bancos</p>"; }
            }
        });

        // 4. Input Monto (Formato en tiempo real)
        inputPago.addEventListener("input", (e) => {
            const onlyNumbers = inputPago.value.replace(/[^0-9]/g, "");
            let numero = parseFloat(onlyNumbers);
            
            // Validación básica contra el restante global (opcional, a veces se permite sobrepago)
            if (!isNaN(numero) && numero > restante) {
                // numero = Math.floor(restante); // Descomentar si quieres forzar el tope
            }
            
            inputPago.value = numero ? formatToCLP(numero) : "";
        });

        // 5. Botón Registrar (Validaciones Finales y Envío)
        btnRegistrar.addEventListener('click', () => {
            const origen = origenInput.value;
            const divisa = divisaSelect.value;
            const tipo = tipoPagoSelect.value;
            const rawMonto = inputPago.value.replace(/[^0-9]/g, "");
            const monto = parseFloat(rawMonto);
            const cuentaSelect = document.getElementById('select-cuenta-real');
            const cuentaId = cuentaSelect ? cuentaSelect.value : null;

            // Validaciones
            if (!origen) return mostrarModal({ titulo: "❌ Error", mensaje: "Selecciona quién paga" });
            if (!divisa) return mostrarModal({ titulo: "❌ Error", mensaje: "Selecciona divisa" });
            if (!tipo) return mostrarModal({ titulo: "❌ Error", mensaje: "Selecciona método de pago" });
            if (!monto || monto <= 0) return mostrarModal({ titulo: "❌ Error", mensaje: "Monto inválido" });
            if ((tipo === 'cuenta' || tipo === 'transferencia') && !cuentaId) return mostrarModal({ titulo: "❌ Error", mensaje: "Selecciona la cuenta" });

            // Validación Lógica de Negocio (Copiada de tu archivo)
            const tipoOp = op.tipo_transaccion; // Compra / Venta
            if (
                (tipoOp === "Compra" && origen === "orion" && divisa !== "D47") ||
                (tipoOp === "Compra" && origen === "cliente" && divisa === "D47") ||
                (tipoOp === "Venta" && origen === "orion" && divisa === "D47") ||
                (tipoOp === "Venta" && origen === "cliente" && divisa !== "D47")
            ) {
                mostrarModal({ 
                    titulo: "❌ Operación Inválida", 
                    mensaje: `Lógica incorrecta para ${tipoOp}. Revisa el origen y la divisa.` 
                });
                return;
            }

            // Determinar Estado
            let nuevoEstado = "Abonado";
            // Margen de error pequeño para decimales
            if (Math.abs(monto - restante) < 1) nuevoEstado = "Pagado"; 

            const payload = {
                id: op.id,
                estado: nuevoEstado,
                pagos: monto,
                caja_id: 99, // Ojo: idealmente dinámico, pero hardcodeado en original a 99
                tipo_pago: tipo,
                divisa: divisa,
                origen: origen,
                cliente_id: op.cliente_id,
                cuenta_id: cuentaId
            };

            // Envío
            fetch(`https://cambiosorion.cl/data/detalle-op.php`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            })
            .then(res => res.json())
            .then(res => {
                if (res.success) {
                    mostrarModalPagoExitoso();
                } else {
                    mostrarModal({ titulo: "❌ Error", mensaje: res.message });
                }
            })
            .catch(e => mostrarModal({ titulo: "❌ Error", mensaje: "Error de conexión" }));
        });


        // C. Botones de Pago Completo (Rápidos)
        const btnFullCli = document.getElementById('btn-full-cliente');
        const btnFullOrion = document.getElementById('btn-full-orion');

        if(btnFullCli) btnFullCli.addEventListener('click', () => registrarPagoCompleto("cliente", data, restante));
        if(btnFullOrion) btnFullOrion.addEventListener('click', () => registrarPagoCompleto("orion", data, restante));


        // D. Botones Eliminar en Tablas (Event Delegation o Attach directo)
        // Como las tablas ya se renderizaron en renderDashboard > renderTablaPagos, solo necesitamos que
        // la función global 'eliminarPago' (definida abajo) funcione.
        
    }

    // --- 6. FUNCIONES DE UTILIDAD (LOGICA PAGOS) ---

    async function cargarDivisas(operacionId, tipoOperacion, quienPaga) {
        const divisaSelect = document.getElementById("divisa-select");
        divisaSelect.innerHTML = '<option value="">Cargando...</option>';

        try {
            const res = await fetch(`https://cambiosorion.cl/data/detalle-op.php?buscar_divisas=1&operacion_id=${operacionId}`);
            const divisas = await res.json();
            divisaSelect.innerHTML = '<option value="">Seleccione...</option>';

            const tipoOperacionLower = tipoOperacion.toLowerCase();
            const quienPagaLower = quienPaga.toLowerCase();

            // Filtro Lógico (Copiado exacto)
            const divisasFiltradas = divisas.filter(divisa => {
                const esCLP = divisa.id === "D47";
                if (tipoOperacionLower === "compra" && quienPagaLower === "orion") return esCLP;
                if (tipoOperacionLower === "compra" && quienPagaLower === "cliente") return !esCLP;
                if (tipoOperacionLower === "venta" && quienPagaLower === "orion") return !esCLP;
                if (tipoOperacionLower === "venta" && quienPagaLower === "cliente") return esCLP;
                return false;
            });

            divisasFiltradas.forEach(d => {
                const opt = document.createElement("option");
                opt.value = d.id;
                opt.textContent = d.nombre;
                divisaSelect.appendChild(opt);
            });
        } catch (e) { divisaSelect.innerHTML = '<option>Error carga</option>'; }
    }

    function registrarPagoCompleto(origen, data, restante) {
        const info = data.operacion;
        const esCompra = info.tipo_transaccion === "Compra";
        const esVenta = info.tipo_transaccion === "Venta";
        let divisaPermitida = null;

        // Lógica Automática Divisa (Copiada)
        if (esCompra && origen === "orion") divisaPermitida = "D47";
        else if (esCompra && origen === "cliente") divisaPermitida = data.detalles.find(d => d.divisa_id !== "D47")?.divisa_id;
        else if (esVenta && origen === "cliente") divisaPermitida = "D47";
        else if (esVenta && origen === "orion") divisaPermitida = data.detalles.find(d => d.divisa_id !== "D47")?.divisa_id;

        if (!divisaPermitida) return mostrarModal({ titulo: "❌ Error", mensaje: "No se pudo determinar divisa automática." });

        const payload = {
            id: info.id,
            estado: "Pagado",
            pagos: restante,
            caja_id: 99,
            tipo_pago: "efectivo",
            divisa: divisaPermitida,
            origen: origen,
            cliente_id: info.cliente_id,
            cuenta_id: null
        };

        fetch(`https://cambiosorion.cl/data/detalle-op.php`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        })
        .then(res => res.json())
        .then(res => {
            if (res.success) mostrarModalPagoExitoso();
            else mostrarModal({ titulo: "❌ Error", mensaje: res.message });
        });
    }

    // Función auxiliar para renderizar las tablas HTML
    function renderTablaPagos(titulo, listaPagos, origen, color = "gray") {
        const headerClass = color === "blue" ? "bg-blue-900/20 text-blue-200 border-blue-800" 
                          : color === "purple" ? "bg-purple-900/20 text-purple-200 border-purple-800" 
                          : "bg-gray-800 text-gray-400";

        if (listaPagos.length === 0) {
            return `
            <div class="bg-gray-800/50 rounded-xl p-6 border border-gray-700 text-center shadow-inner">
                <h4 class="text-xs font-bold text-gray-500 uppercase mb-2 tracking-widest">${titulo}</h4>
                <p class="text-sm text-gray-400 italic">No hay registros.</p>
            </div>`;
        }
        return `
        <div class="bg-gray-900 rounded-xl border border-gray-700 overflow-hidden shadow-md">
            <div class="px-4 py-3 border-b border-gray-700 ${headerClass}">
                 <h4 class="text-xs font-bold uppercase tracking-widest">${titulo}</h4>
            </div>
            <table class="w-full text-sm text-left text-gray-300">
                <tbody class="divide-y divide-gray-800">
                ${listaPagos.map(p => `
                    <tr class="hover:bg-gray-800 transition">
                        <td class="px-4 py-3">
                            <div class="text-xs text-gray-500 mb-1">${p.fecha}</div>
                            <div class="font-medium text-white flex items-center">
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

    // --- 7. FUNCIONES GLOBALES (Para onlick en HTML string) ---
    
    // Modal Generico
    window.mostrarModal = ({ titulo, mensaje, textoConfirmar = "Aceptar", textoCancelar = null, onConfirmar, onCancelar }) => {
      const modal = document.getElementById("modal-generico");
      document.getElementById("modal-generico-titulo").textContent = titulo;
      document.getElementById("modal-generico-mensaje").textContent = mensaje;
      const btnConfirmar = document.getElementById("modal-generico-confirmar");
      const btnCancelar = document.getElementById("modal-generico-cancelar");

      btnConfirmar.textContent = textoConfirmar;
      if (textoCancelar) {
        btnCancelar.classList.remove("hidden");
        btnCancelar.textContent = textoCancelar;
      } else {
        btnCancelar.classList.add("hidden");
      }

      modal.classList.remove("hidden");

      // Clonar botones para limpiar eventos previos
      const newConfirm = btnConfirmar.cloneNode(true);
      const newCancel = btnCancelar.cloneNode(true);
      btnConfirmar.parentNode.replaceChild(newConfirm, btnConfirmar);
      btnCancelar.parentNode.replaceChild(newCancel, btnCancelar);

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
            titulo: "⚠️ Eliminar Pago",
            mensaje: "¿Estás seguro que deseas eliminar este pago? Esto ajustará el inventario.",
            textoConfirmar: "Eliminar",
            textoCancelar: "Cancelar",
            onConfirmar: () => {
                fetch(`https://cambiosorion.cl/data/detalle-op.php`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: id, origen: origen })
                })
                .then(res => res.json())
                .then(res => {
                    if(res.success) {
                         mostrarModal({ titulo: "✅ Eliminado", mensaje: "Pago eliminado correctamente", onConfirmar: () => location.reload() });
                    } else {
                         mostrarModal({ titulo: "❌ Error", mensaje: res.message });
                    }
                });
            }
        });
    };
});