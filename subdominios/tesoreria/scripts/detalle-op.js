import { initSystem } from './index.js';

document.addEventListener("DOMContentLoaded", async () => {
    // 1. Inicializar sistema estándar (Sidebar, Header, Sesión)
    await initSystem('operaciones');

    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    const dashboardContainer = document.getElementById("dashboard-container");
    
    let info = null; 
    let detallesGlobal = [];
    let pagosGlobal = [];
    let cuentasCache = []; 

    if (!id) {
        dashboardContainer.innerHTML = "<p class='text-white p-6 border border-red-500 bg-red-900/20 rounded-lg'>ID de operación no proporcionado.</p>";
        return;
    }

    // --- HELPERS VISUALES ---
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
        const date = new Date(dateString.replace(/-/g, "/"));
        if (isNaN(date)) return dateString;
        const d = String(date.getDate()).padStart(2, '0');
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const y = date.getFullYear();
        const h = String(date.getHours()).padStart(2, '0');
        const min = String(date.getMinutes()).padStart(2, '0');
        return `${h}:${min} ${d}/${m}/${y}`;
    };

    // Colores de estado adaptados al tema
    const getBadgeColor = (estado) => {
        const est = (estado || '').toLowerCase();
        if (est === 'vigente') return 'bg-blue-900/50 text-blue-200 border border-blue-500/30';
        if (est === 'pagado') return 'bg-green-900/50 text-green-200 border border-green-500/30';
        if (est === 'abonado') return 'bg-amber-900/50 text-amber-200 border border-amber-500/30';
        if (est === 'anulado') return 'bg-red-900/50 text-red-200 border border-red-500/30';
        return 'bg-slate-800 text-slate-400 border border-slate-600';
    };

    const getDivisaElement = (urlIcono, nombreDivisa) => {
        if (urlIcono && urlIcono.trim() !== "") {
            return `<img src="${urlIcono}" alt="${nombreDivisa}" class="w-6 h-6 object-contain mr-2 inline-block drop-shadow-sm">`;
        }
        return `<svg class="w-6 h-6 mr-2 text-slate-400 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>`;
    };

    // --- CARGA DE DATOS ---
    fetch(`https://cambiosorion.cl/data/detalle-op.php?id=${id}`)
        .then(async res => {
            const text = await res.text();
            try { return JSON.parse(text); } 
            catch (e) { console.error("Respuesta cruda:", text); throw new Error("Respuesta no válida del servidor"); }
        })   
        .then(data => {
            if (data.error) {
                dashboardContainer.innerHTML = `<p class="text-red-400 p-6 bg-red-900/10 border border-red-800 rounded-lg">${data.error}</p>`;
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


    // --- RENDER DASHBOARD ---
    function renderDashboard(data) {
        const op = data.operacion;
        const detalles = data.detalles || [];
        const pagos = data.pagos || [];

        // Lógica de Barras de Progreso (Cliente vs Orion)
        // Mantenemos esta lógica intacta porque funciona bien
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
            // VENTA: Cliente paga CLP, Orion entrega Divisa
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
            // COMPRA: Cliente entrega Divisa, Orion paga CLP
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
                                <span class="text-slate-500 text-md font-normal mr-0.5">${item.simbolo}</span>${formatNumber(item.meta)} <span class="text-lg text-amber-500 font-bold">${item.codigo}</span>
                            </span>
                            <div class="text-xs text-slate-400 font-mono mt-1 bg-slate-900/50 px-2 py-0.5 rounded inline-block border border-white/5 ${alignRight ? 'ml-auto' : 'mr-auto'}">
                                Pagado: ${formatNumber(item.pagado)}
                            </div>
                        </div>
                    </div>`;
            }).join('');
        };

        // --- TEMPLATE PRINCIPAL (Con toques Ámbar) ---
        let html = `
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 pb-6 border-b border-white/10">
                <div>
                    <div class="flex items-center gap-3 mb-1">
                        <span class="text-amber-500 text-sm uppercase tracking-wider font-bold">Operación</span>
                        <span class="px-2 py-0.5 rounded text-sm font-bold uppercase bg-slate-800 border border-slate-600 text-slate-300">${op.tipo_transaccion}</span>
                    </div>
                    <div class="flex items-center gap-4">
                        <h1 class="text-4xl font-bold text-white tracking-tight">#${op.id}</h1>
                        <span class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${badgeClass}">${estadoReal}</span>
                    </div>
                </div>
                <div class="flex flex-wrap gap-2">
                     <button id="btn-emitir-sii" class="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg shadow-md flex items-center gap-2 text-sm transition border border-slate-600">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg> 
                        Ver Documento
                    </button>
                     ${op.estado !== 'Anulado' ? `<button id="btn-anular" class="bg-transparent hover:bg-red-900/30 text-red-400 border border-red-900 px-4 py-2 rounded-lg shadow flex items-center gap-2 text-sm transition">Anular</button>` : ''}
                    <button id="btn-imprimir" class="bg-amber-600 hover:bg-amber-500 text-white border border-amber-500 px-4 py-2 rounded-lg shadow-[0_0_10px_rgba(245,158,11,0.2)] flex items-center gap-2 text-sm transition font-bold">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                        Imprimir
                    </button>
                </div>
            </div>

            <div class="w-full mb-8">
                <div class="bg-slate-800 rounded-xl p-8 shadow-2xl border border-white/10 relative overflow-hidden">
                    <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600"></div>
                    
                    <div class="flex justify-between items-start mb-6 border-b border-white/5 pb-4">
                        <h4 class="text-sm font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                            Estado de Intercambio
                        </h4>
                        <div class="text-right">
                            <p class="text-[10px] text-slate-500 uppercase font-bold">Valor Total</p>
                            <p class="text-lg font-mono text-amber-400 font-bold">${formatCurrency(totalCLP)} CLP</p>
                        </div>
                    </div>
                    
                    <div class="flex justify-between items-end mb-6 px-2 relative">
                        <div class="text-left w-1/2 border-r border-white/5 pr-8">
                            <div class="text-blue-400 text-sm font-bold uppercase mb-3">Cliente Entrega</div>
                            <div class="flex flex-wrap gap-x-6 gap-y-4 justify-start items-center">
                                ${renderCurrencyList(listaCliente, false)}
                            </div>
                        </div>

                        <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                            <span class="bg-slate-900 text-slate-500 font-black text-xs px-3 py-2 rounded-full border border-slate-700 shadow-xl">VS</span>
                        </div>

                        <div class="text-right w-1/2 pl-8">
                            <div class="text-purple-400 text-sm font-bold uppercase mb-3">Orion Entrega</div>
                            <div class="flex flex-wrap gap-x-6 gap-y-4 justify-end items-center">
                                ${renderCurrencyList(listaOrion, true)}
                            </div>
                        </div>
                    </div>

                    <div class="relative h-8 w-full flex rounded-full overflow-hidden bg-slate-900 shadow-inner border border-slate-700">
                        <div class="w-1/2 flex justify-start border-r border-slate-700 relative bg-slate-900/50">
                             <div style="width: ${pctClienteBarra}%" class="bg-gradient-to-r from-blue-800 to-blue-500 h-full shadow-[0_0_20px_rgba(59,130,246,0.6)] transition-all duration-1000 ease-out relative flex items-center justify-end pr-3">
                                 ${pctClienteBarra > 5 ? `<span class="text-xs font-bold text-white drop-shadow-md">${Math.round(pctClienteBarra)}%</span>` : ''}
                             </div>
                        </div>
                        
                        <div class="w-1/2 flex justify-end border-l border-slate-700 relative bg-slate-900/50">
                             <div style="width: ${pctOrionBarra}%" class="bg-gradient-to-l from-purple-800 to-purple-500 h-full shadow-[0_0_20px_rgba(168,85,247,0.6)] transition-all duration-1000 ease-out relative flex items-center justify-start pl-3">
                                 ${pctOrionBarra > 5 ? `<span class="text-xs font-bold text-white drop-shadow-md">${Math.round(pctOrionBarra)}%</span>` : ''}
                             </div>
                        </div>

                        <div class="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white/10 -translate-x-1/2 z-20"></div>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div class="bg-slate-800 rounded-xl border border-white/10 p-5 flex flex-col shadow-md">
                    <h3 class="text-white font-bold border-b border-white/10 pb-3 mb-4 text-sm uppercase flex items-center gap-2">
                        <span class="w-1 h-4 bg-amber-500 rounded-full"></span> Información
                    </h3>
                    <div class="grid grid-cols-2 gap-y-4 text-sm flex-1 content-start">
                        <div class="text-slate-500">Fecha:</div> <div class="text-white text-right font-medium">${formatDate(op.fecha)}</div>
                        <div class="text-slate-500">Cliente:</div> <div class="text-white text-right font-medium truncate text-amber-200" title="${op.nombre_cliente}">${op.nombre_cliente}</div>
                        <div class="text-slate-500">Vendedor:</div> <div class="text-white text-right text-slate-300">${op.vendedor || '—'}</div>
                        <div class="text-slate-500">Caja:</div> <div class="text-white text-right text-slate-300">${op.caja || '—'}</div>
                        <div class="text-slate-500">Doc SII:</div> <div class="text-white text-right text-amber-400 font-mono">${op.numero_documento || 'N/A'}</div>
                    </div>
                    ${op.observaciones ? `<div class="pt-4 border-t border-white/10 mt-4"><p class="text-xs text-slate-500 uppercase mb-1 font-bold">Observaciones</p><p class="text-sm text-slate-300 italic bg-slate-900/50 p-2 rounded">"${op.observaciones}"</p></div>` : ''}
                </div>

                <div class="lg:col-span-2 bg-slate-900 rounded-xl border border-white/10 overflow-hidden flex flex-col shadow-lg">
                    <div class="p-4 border-b border-slate-800 bg-slate-900 flex justify-between items-center">
                        <h3 class="text-slate-100 font-bold text-sm uppercase tracking-wide">Detalle de Divisas</h3>
                    </div>
                    <div class="overflow-x-auto flex-1 bg-slate-900 custom-scrollbar">
                        <table class="w-full text-sm text-left text-slate-300">
                            <thead class="text-xs text-slate-400 uppercase bg-slate-800 border-b border-slate-700">
                                <tr><th class="px-4 py-3">Divisa</th><th class="px-4 py-3 text-right">Monto</th><th class="px-4 py-3 text-right">Tasa</th><th class="px-4 py-3 text-right">Subtotal</th></tr>
                            </thead>
                            <tbody class="divide-y divide-slate-800">
                                ${detalles.map(d => `<tr class="hover:bg-slate-800 transition"><td class="px-4 py-3 font-medium text-white flex items-center">${getDivisaElement(d.divisa_icono, d.divisa)}${d.divisa}</td><td class="px-4 py-3 text-right font-mono text-slate-300">${formatNumber(d.monto)}</td><td class="px-4 py-3 text-right font-mono text-slate-500">${formatNumber(d.tasa_cambio)}</td><td class="px-4 py-3 text-right font-bold text-amber-500 font-mono">${formatCurrency(d.subtotal)}</td></tr>`).join('')}
                            </tbody>
                        </table>
                    </div>
                    <div class="bg-black/20 p-4 flex justify-between items-center border-t border-slate-800">
                        <span class="text-slate-500 text-xs uppercase font-bold">Total Calculado</span>
                        <span class="text-xl font-bold text-amber-500">${formatCurrency(totalCLP)}</span>
                    </div>
                </div>
            </div>

            <div class="rounded-xl border border-white/10 bg-transparent overflow-hidden mb-10">
                <div class="p-5 border-b border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-800">
                    <h2 class="text-lg font-bold text-white flex items-center gap-2">Gestión de Pagos</h2>
                    ${fin.estadoCalculado !== 'Pagado' && op.estado !== 'Anulado' ? `
                    <div class="flex gap-2">
                        <button id="btn-full-cliente" class="px-3 py-1.5 text-sm font-bold text-blue-200 bg-blue-900/40 border border-blue-800 rounded hover:bg-blue-800 transition" ${fin.cliente.listo ? 'disabled class="opacity-50 cursor-not-allowed"' : ''}>Pagar Todo Cliente</button>
                        <button id="btn-full-orion" class="px-3 py-1.5 text-sm font-bold text-purple-200 bg-purple-900/40 border border-purple-800 rounded hover:bg-purple-800 transition" ${fin.orion.listo ? 'disabled class="opacity-50 cursor-not-allowed"' : ''}>Pagar Todo Orion</button>
                    </div>` : ''}
                </div>
                <div class="p-6 bg-slate-900/80">
                    <div id="form-container" class="${(fin.estadoCalculado === 'Pagado' || op.estado === 'Anulado') ? 'hidden' : ''}">
                        <form id="form-pago" class="bg-slate-800 rounded-xl p-5 border border-slate-700 mb-8 shadow-lg">
                            <div class="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                                <div class="md:col-span-3">
                                    <label class="block text-xs text-slate-400 mb-2 font-bold">¿QUIÉN PAGA?</label>
                                    <div class="grid grid-cols-2 gap-2">
                                        <div class="origen-option cursor-pointer border border-slate-600 rounded-lg p-3 text-center hover:border-blue-500 transition group bg-slate-700" data-value="cliente">
                                            <svg class="w-8 h-8 mx-auto mb-1 text-slate-400 group-hover:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                                            <span class="text-xs text-slate-300 font-bold">Cliente</span>
                                        </div>
                                        <div class="origen-option cursor-pointer border border-slate-600 rounded-lg p-3 text-center hover:border-purple-500 transition group bg-slate-700" data-value="orion">
                                            <svg class="w-8 h-8 mx-auto mb-1 text-slate-400 group-hover:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                                            <span class="text-xs text-slate-300 font-bold">Orion</span>
                                        </div>
                                    </div>
                                    <input type="hidden" id="origen-pago">
                                </div>
                                <div class="md:col-span-3">
                                    <label class="block text-xs text-slate-400 mb-1 font-bold">DIVISA</label>
                                    <select id="divisa-select" class="w-full bg-slate-900 border border-slate-600 text-white text-sm rounded-lg p-2.5 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"><option value="">Seleccione...</option></select>
                                </div>
                                <div class="md:col-span-2">
                                    <label class="block text-xs text-slate-400 mb-1 font-bold">MÉTODO</label>
                                    <select id="tipo-pago" class="w-full bg-slate-900 border border-slate-600 text-white text-sm rounded-lg p-2.5 focus:border-amber-500 focus:ring-1 focus:ring-amber-500">
                                        <option value="efectivo">Efectivo</option><option value="cuenta">Cuenta</option><option value="transferencia">Transferencia</option><option value="tarjeta">Tarjeta</option>
                                    </select>
                                </div>
                                <div class="md:col-span-2">
                                    <label class="block text-xs text-slate-400 mb-1 font-bold">MONTO</label>
                                    <input type="text" id="input-pago" class="w-full bg-slate-900 border border-slate-600 text-white text-sm rounded-lg p-2.5 pl-4 font-mono focus:border-amber-500 focus:ring-1 focus:ring-amber-500" placeholder="0">
                                </div>
                                <div class="md:col-span-2">
                                    <button type="button" id="btn-registrar-pago" class="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-2.5 rounded-lg shadow-lg shadow-amber-900/20 transition">REGISTRAR</button>
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

        // --- SMART FLOW LOGIC ---

        // 1. Selector Quién Paga (Estilos dinámicos)
        origenOptions.forEach(opt => {
            opt.addEventListener('click', () => {
                origenOptions.forEach(o => {
                    o.classList.remove('bg-blue-600', 'border-blue-500', 'bg-purple-600', 'border-purple-500', 'text-white');
                    o.classList.add('bg-slate-700', 'border-slate-600');
                    o.querySelector('span.text-xs').classList.remove('text-white');
                    o.querySelector('span.text-xs').classList.add('text-slate-300');
                });
                
                const val = opt.dataset.value;
                origenInput.value = val;
                
                opt.classList.remove('bg-slate-700', 'border-slate-600');
                opt.querySelector('span.text-xs').classList.remove('text-slate-300');
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
            
            Array.from(tipoPagoSelect.options).forEach(opt => {
                if (opt.value === 'transferencia' || opt.value === 'tarjeta') {
                    if (esCLP) { opt.disabled = false; opt.hidden = false; } 
                    else { opt.disabled = true; opt.hidden = true; }
                }
            });

            if (!esCLP && (tipoPagoSelect.value === 'transferencia' || tipoPagoSelect.value === 'tarjeta')) {
                tipoPagoSelect.value = 'efectivo';
            }
            if (tipoPagoSelect.value === "cuenta" || tipoPagoSelect.value === "transferencia") {
                 tipoPagoSelect.dispatchEvent(new Event("change"));
            }
            
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
            
            if(divisaId) setTimeout(() => inputPago.focus(), 100);
        });

        // 3. Pre-Selección Inteligente
        setTimeout(() => {
            if(op.estado !== "Pagado" && op.estado !== "Anulado") {
                let defaultPayer = "";
                if (op.tipo_transaccion === "Venta") defaultPayer = "cliente";
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
                let url = `https://cambiosorion.cl/data/cuentas.php?activa=1&divisa_id=${divisaId}`;
                if (origen === "orion") url += `&tipo_cuenta=administrativa`; 
                
                try {
                    inputCuentaContainer.innerHTML = "<p class='text-xs text-slate-400'>Cargando listado...</p>";
                    const res = await fetch(url);
                    const cuentasRes = await res.json();
                    let lista = Array.isArray(cuentasRes) ? cuentasRes : (cuentasRes.data || []);
                    
                    if (origen === "cliente") {
                         lista.sort((a, b) => {
                             const aEsCliente = (a.cliente_id == op.cliente_id) ? 1 : 0;
                             const bEsCliente = (b.cliente_id == op.cliente_id) ? 1 : 0;
                             return bEsCliente - aEsCliente;
                         });
                    }

                    if (lista.length > 0) {
                        inputCuentaContainer.innerHTML = `
                            <label class="block text-xs text-slate-400 mb-1 font-bold ml-1">Cuenta Origen (Escriba para buscar)</label>
                            <input list="cuentas-list" id="input-cuenta-search" class="w-full bg-slate-900 border border-slate-600 text-white text-sm rounded-lg p-2.5 focus:border-amber-500 focus:ring-1 focus:ring-amber-500" placeholder="Buscar cuenta...">
                            <datalist id="cuentas-list">
                                ${lista.map(c => `<option data-value="${c.id}" value="${c.nombre || (c.banco + ' ' + c.numero)}">${c.banco ? c.banco + ' - ' : ''}${c.numero || ''}</option>`).join('')}
                            </datalist>
                            <input type="hidden" id="select-cuenta-real">
                        `;
                        const inputSearch = document.getElementById('input-cuenta-search');
                        const hiddenInput = document.getElementById('select-cuenta-real');
                        inputSearch.addEventListener('change', function() {
                             const option = document.querySelector(`#cuentas-list option[value='${this.value}']`);
                             if (option) hiddenInput.value = option.getAttribute('data-value');
                             else hiddenInput.value = "";
                        });
                    } else inputCuentaContainer.innerHTML = `<p class="text-xs text-amber-500">⚠️ No hay cuentas contables disponibles.</p>`;

                } catch (e) { inputCuentaContainer.innerHTML = "<p class='text-xs text-red-500'>Error cargando cuentas</p>"; }

            } else if (tipo === "transferencia" || tipo === "tarjeta") {
                let url = `https://cambiosorion.cl/data/cuentas.php?activa=1&divisa_id=D47&tipo_cuenta=administrativa`;
                try {
                    inputCuentaContainer.innerHTML = "<p class='text-xs text-slate-400'>Cargando bancos...</p>";
                    const res = await fetch(url);
                    const result = await res.json();
                    const lista = result.data || []; 
                    if (lista.length > 0) {
                        inputCuentaContainer.innerHTML = `
                            <label class="block text-xs text-slate-400 mb-1 font-bold ml-1">Cuenta Bancaria Destino (Orion)</label>
                            <select id="select-cuenta-real" class="w-full bg-slate-900 border border-slate-600 text-white text-sm rounded-lg p-2.5 focus:border-amber-500 focus:ring-1 focus:ring-amber-500">
                                <option value="">Seleccione banco...</option>
                                ${lista.map(c => `<option value="${c.id}">${c.banco} - ${c.tipo_cuenta} (${c.numero})</option>`).join('')}
                            </select>`;
                        if (lista.length === 1) document.getElementById('select-cuenta-real').value = lista[0].id;
                    } else inputCuentaContainer.innerHTML = `<p class="text-xs text-amber-500">⚠️ No hay cuentas bancarias configuradas.</p>`;
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

            if (!origen) return mostrarModal({ tipo: 'error', titulo: "Falta Información", mensaje: "Seleccione quién paga." });
            if (!divisa) return mostrarModal({ tipo: 'error', titulo: "Falta Información", mensaje: "Seleccione una divisa." });
            if (!tipo) return mostrarModal({ tipo: 'error', titulo: "Falta Información", mensaje: "Seleccione un método." });
            if (!monto || monto <= 0) return mostrarModal({ tipo: 'error', titulo: "Monto Inválido", mensaje: "Ingrese un monto mayor a 0." });
            if ((tipo === 'cuenta' || tipo === 'transferencia') && !cuentaId) return mostrarModal({ tipo: 'error', titulo: "Cuenta Requerida", mensaje: "Seleccione una cuenta válida." });

            const payload = {
                id: op.id, pagos: monto, caja_id: 99, tipo_pago: tipo, divisa: divisa, origen: origen, cliente_id: op.cliente_id, cuenta_id: cuentaId
            };

            fetch(`https://cambiosorion.cl/data/detalle-op.php`, {
                method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
            }).then(res => res.json()).then(res => {
                if (res.success) mostrarModalPagoExitoso();
                else mostrarModal({ tipo: 'error', titulo: "Error", mensaje: res.message });
            }).catch(e => mostrarModal({ tipo: 'error', titulo: "Error", mensaje: "Error de conexión." }));
        });

        const btnPdf = document.getElementById('btn-pdf');
        if(btnPdf) btnPdf.addEventListener('click', () => op.numero_documento ? window.open(`https://cambiosorion.cl/documentos/${op.numero_documento}.pdf`, "_blank") : mostrarModal({ titulo: "❌ Error", mensaje: "No hay documento emitido." }));
        
        const btnImprimir = document.getElementById('btn-imprimir');
        if(btnImprimir) btnImprimir.addEventListener('click', () => window.print());
        
        const btnAnular = document.getElementById('btn-anular');
        if(btnAnular) btnAnular.addEventListener('click', () => mostrarModal({ 
            tipo: 'advertencia',
            titulo: "Anular Operación", 
            mensaje: "¿Estás seguro? Se revertirán todos los movimientos y se devolverá el dinero al inventario.", 
            textoConfirmar: "Sí, Anular", 
            textoCancelar: "Cancelar", 
            onConfirmar: () => {
                fetch(`https://cambiosorion.cl/data/detalle-op.php`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: op.id }) })
                .then(r => r.json())
                .then(r => r.success ? location.reload() : mostrarModal({ tipo: 'error', titulo: "No se pudo anular", mensaje: r.message }));
            }
        }));
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

            const divisasFiltradas = divisas.filter(divisa => {
                const esCLP = divisa.id === "D47";
                if (tipoOperacionLower === "compra" && quienPagaLower === "orion") return esCLP;
                if (tipoOperacionLower === "compra" && quienPagaLower === "cliente") return !esCLP;
                if (tipoOperacionLower === "venta" && quienPagaLower === "orion") return !esCLP;
                if (tipoOperacionLower === "venta" && quienPagaLower === "cliente") return esCLP;
                return false;
            });

            const listaFinal = divisasFiltradas.length > 0 ? divisasFiltradas : divisas;

            listaFinal.forEach(d => {
                const opt = document.createElement("option");
                opt.value = d.id;
                opt.textContent = d.nombre;
                divisaSelect.appendChild(opt);
            });
            
            if(listaFinal.length === 1) {
                divisaSelect.value = listaFinal[0].id;
                divisaSelect.dispatchEvent(new Event('change'));
            }
            
        } catch (e) { divisaSelect.innerHTML = '<option>Error carga</option>'; }
    }

    function renderTablaPagos(titulo, lista, origen, color = "gray") {
        const headerColor = color === "blue" ? "bg-blue-900/30 text-blue-200 border-blue-500/30" : color === "purple" ? "bg-purple-900/30 text-purple-200 border-purple-500/30" : "bg-slate-800 text-slate-400";
        if (lista.length === 0) return `<div class="bg-slate-800/50 rounded-xl p-6 border border-slate-700 text-center shadow-inner"><h4 class="text-xs font-bold text-slate-500 uppercase mb-2 tracking-widest">${titulo}</h4><p class="text-sm text-slate-400 italic">No hay registros.</p></div>`;
        return `
        <div class="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden shadow-md">
            <div class="px-4 py-3 border-b border-slate-700 ${headerColor}">
                 <h4 class="text-xs font-bold uppercase tracking-widest">${titulo}</h4>
            </div>
            <table class="w-full text-sm text-left text-slate-300">
                <tbody class="divide-y divide-slate-800">
                ${lista.map(p => `
                    <tr class="hover:bg-slate-800 transition">
                        <td class="px-4 py-3">
                            <div class="text-xs text-slate-500 mb-1">${formatDate(p.fecha)}</div> <div class="font-medium text-white flex items-center">
                                ${getDivisaElement(p.divisa_icono, p.divisa)}
                                ${formatCurrency(p.monto)}
                            </div>
                        </td>
                        <td class="px-4 py-3 text-right">
                             <div class="text-[10px] font-bold uppercase border border-slate-600 rounded px-1.5 py-0.5 inline-block text-slate-400 mb-1">${p.tipo}</div>
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

    window.mostrarModal = ({ titulo, mensaje, tipo = 'info', textoConfirmar = "Aceptar", textoCancelar = null, onConfirmar, onCancelar }) => {
        const modal = document.getElementById("modal-generico");
        const iconoDiv = document.getElementById("modal-generico-icono");
        
        // Definición de Iconos SVG
        const iconos = {
            'exito': `<div class="p-3 rounded-full bg-green-900/30 border border-green-500/30"><svg class="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg></div>`,
            'error': `<div class="p-3 rounded-full bg-red-900/30 border border-red-500/30"><svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></div>`,
            'advertencia': `<div class="p-3 rounded-full bg-amber-900/30 border border-amber-500/30"><svg class="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg></div>`,
            'info': ''
        };

        if(iconoDiv) iconoDiv.innerHTML = iconos[tipo] || '';

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

        // Limpiar eventos anteriores clonando botones
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
            tipo: 'advertencia',
            titulo: "Eliminar Pago", 
            mensaje: "¿Estás seguro que deseas eliminar este pago? El monto será devuelto al inventario correspondiente.", 
            textoConfirmar: "Sí, Eliminar", 
            textoCancelar: "Cancelar",
            onConfirmar: () => {
                fetch(`https://cambiosorion.cl/data/detalle-op.php`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: id, origen: origen }) })
                .then(res => res.json())
                .then(res => { 
                    if(res.success) mostrarModal({ tipo: 'exito', titulo: "Eliminado", mensaje: "El pago ha sido eliminado correctamente.", onConfirmar: () => location.reload() }); 
                    else mostrarModal({ tipo: 'error', titulo: "Error", mensaje: res.message }); 
                });
            }
        });
    };
});