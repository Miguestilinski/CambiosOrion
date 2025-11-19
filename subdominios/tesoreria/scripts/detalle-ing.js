document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const ingresoId = params.get("id");
    
    const infoContenedor = document.getElementById("info-ingreso");
    const pagosContenedor = document.getElementById("detalle-pagos-ingreso");
    const anularBtn = document.getElementById("anular-ingreso");
    const imprimirBtn = document.getElementById("imprimir");

    if (!ingresoId) {
        infoContenedor.innerHTML = "<p class='text-white p-4 bg-red-900/20 border border-red-500 rounded'>ID de ingreso no proporcionado.</p>";
        return;
    }

    const formatearFecha = (timestamp) => {
        if (!timestamp) return ''; 
        const date = new Date(timestamp.replace(/-/g, "/"));
        if (isNaN(date)) return timestamp;
        const d = String(date.getDate()).padStart(2, '0');
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const y = date.getFullYear();
        const h = String(date.getHours()).padStart(2, '0');
        const min = String(date.getMinutes()).padStart(2, '0');
        return `${h}:${min} ${d}/${m}/${y}`;
    };

    const formatNumber = (num) => {
        const n = parseFloat(num);
        return isNaN(n) ? num : n.toLocaleString('es-CL', {minimumFractionDigits: 1, maximumFractionDigits: 1});
    };

    const getBadgeColor = (estado) => {
        const est = (estado || '').toLowerCase();
        if (est === 'vigente') return 'bg-green-900 text-green-300 border border-green-700';
        if (est === 'anulado') return 'bg-red-900 text-red-300 border border-red-700';
        if (est === 'cerrado') return 'bg-gray-700 text-gray-300 border border-gray-600';
        return 'bg-blue-900 text-blue-300 border border-blue-700';
    };

    const getDivisaElement = (urlIcono, nombreDivisa) => {
        if (urlIcono && urlIcono.trim() !== "") {
            return `<img src="${urlIcono}" alt="${nombreDivisa}" class="w-10 h-10 object-contain drop-shadow-sm">`;
        }
        return `<svg class="w-10 h-10 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;
    };

    function cargarDetalleIngreso() {
        fetch(`https://cambiosorion.cl/data/detalle-ing.php?id=${ingresoId}`)
            .then(async res => {
                const text = await res.text();
                try { return JSON.parse(text); } catch (e) { 
                    console.error("Server Error:", text);
                    throw new Error("Respuesta no válida del servidor"); 
                }
            })    
            .then(data => {
                if (data.error) {
                    infoContenedor.innerHTML = `<p class="text-red-400 p-4 bg-red-900/20 border border-red-800 rounded">${data.error}</p>`;
                    return;
                }

                const ing = data.ingreso;
                const esCuenta = ing.tipo_ingreso === 'Cuenta';
                const divisaIcon = getDivisaElement(ing.icono_divisa, ing.nombre_divisa);
                const badgeClass = getBadgeColor(ing.estado);

                // --- 1. Construcción del HTML ---
                let html = `
                <div class="flex flex-col gap-6">
                    
                    <!-- CABECERA -->
                    <div class="flex justify-between items-start">
                        <div>
                           <span class="text-gray-400 text-xs uppercase tracking-wider font-bold">ID Ingreso</span>
                           <h2 class="text-3xl font-bold text-white">#${ing.id}</h2>
                        </div>
                        <span class="px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wide ${badgeClass}">
                            ${ing.estado || 'Desconocido'}
                        </span>
                    </div>

                    <!-- TARJETA PRINCIPAL (Hero Verde) -->
                    <div class="bg-gray-800/80 border border-gray-700 rounded-xl p-6 flex items-center justify-between shadow-lg relative overflow-hidden">
                         <div class="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
                        <div class="flex items-center gap-4">
                            <div class="bg-white/5 p-2 rounded-full border border-white/10">
                                ${divisaIcon}
                            </div>
                            <div>
                                <p class="text-green-400 text-sm font-bold uppercase tracking-wide">Monto Ingreso</p>
                                <p class="text-4xl font-bold text-white tracking-tight flex items-baseline gap-2"> 
                                    <span class="text-xl text-gray-400 font-normal">${ing.simbolo_divisa || ''}</span>
                                    ${formatNumber(ing.monto)}
                                </p>
                                <p class="text-sm text-gray-500">${ing.nombre_divisa}</p>
                            </div>
                        </div>
                    </div>

                    <!-- GRID DE DETALLES -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        <!-- Datos Operativos (Izquierda) -->
                        <div class="bg-gray-800 p-5 rounded-xl border border-gray-700 space-y-4 shadow-md">
                            <h3 class="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2 border-b border-gray-700 pb-2">Datos Operativos</h3>
                            
                            <div class="flex justify-between">
                                <span class="text-gray-500 text-sm">Tipo:</span>
                                <span class="text-white font-medium bg-gray-900 px-2 py-0.5 rounded text-xs uppercase">${ing.tipo_ingreso}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-500 text-sm">Caja Destino:</span>
                                <span class="text-white font-medium">${ing.nombre_caja || '—'}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-500 text-sm">Cajero:</span>
                                <span class="text-white font-medium">${ing.nombre_cajero || '—'}</span>
                            </div>
                             <div class="flex justify-between">
                                <span class="text-gray-500 text-sm">Fecha:</span>
                                <span class="text-white font-medium text-right">${formatearFecha(ing.fecha)}</span>
                            </div>
                        </div>

                        <!-- Origen y Cuentas (Derecha) -->
                        <div class="bg-gray-800 p-5 rounded-xl border border-gray-700 space-y-4 shadow-md">
                            <h3 class="text-blue-400 text-xs font-bold uppercase tracking-widest mb-2 border-b border-gray-700 pb-2">Origen del Dinero</h3>
                            
                            <div class="flex justify-between">
                                <span class="text-gray-500 text-sm">Cliente Origen:</span>
                                <span class="text-white font-medium text-right truncate w-1/2" title="${ing.nombre_cliente}">${ing.nombre_cliente || '—'}</span>
                            </div>
                `;

                if (esCuenta) {
                    html += `
                        <div class="flex justify-between">
                            <span class="text-gray-500 text-sm">Cuenta Origen (Cliente):</span>
                            <span class="text-white font-medium text-right truncate w-1/2" title="${ing.nombre_cuenta_origen}">${ing.nombre_cuenta_origen || '—'}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-500 text-sm">Cuenta Destino (Nuestra):</span>
                            <span class="text-white font-medium text-right truncate w-1/2" title="${ing.nombre_cuenta_destino}">${ing.nombre_cuenta_destino || '—'}</span>
                        </div>
                    `;
                } else {
                    html += `
                         <div class="flex justify-between">
                            <span class="text-gray-500 text-sm">Cuenta Destino:</span>
                            <span class="text-white font-medium text-right truncate w-1/2" title="${ing.nombre_cuenta_destino}">${ing.nombre_cuenta_destino || '—'}</span>
                        </div>
                        <div class="mt-2 text-xs text-gray-500 italic text-right">
                            * Ingreso en efectivo a Caja/Tesorería
                        </div>
                    `;
                }

                html += `
                        </div>
                    </div>

                    ${ing.detalle ? `
                    <div class="bg-gray-800 p-4 rounded-xl border border-gray-700">
                        <span class="text-gray-400 text-xs uppercase font-bold block mb-1">Observaciones</span>
                        <p class="text-gray-300 italic text-sm bg-gray-900/50 p-2 rounded">${ing.detalle}</p>
                    </div>
                    ` : ''}
                    
                </div>
                `;

                infoContenedor.innerHTML = html;

                // --- 2. Tabla de Pagos ---
                const pagos = data.pagos || [];
                if (pagos.length === 0) {
                     pagosContenedor.innerHTML = `
                        <div class="w-full p-8 text-center bg-gray-800 rounded-lg border border-gray-700">
                            <p class="text-gray-500 text-sm italic">Este ingreso no tiene movimientos asociados adicionales.</p>
                        </div>
                    `;
                } else {
                    const tablaHTML = `
                        <table class="w-full text-sm text-left text-gray-300 bg-gray-800">
                            <thead class="text-xs uppercase bg-gray-900 text-gray-400 border-b border-gray-700">
                                <tr>
                                    <th class="px-4 py-3">Fecha</th>
                                    <th class="px-4 py-3">Forma</th>
                                    <th class="px-4 py-3 text-right">Monto</th>
                                    <th class="px-4 py-3">Detalle</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-700">
                            ${pagos.map(p => `
                                <tr class="hover:bg-gray-700 transition">
                                    <td class="px-4 py-3">${formatearFecha(p.fecha)}</td>
                                    <td class="px-4 py-3">${p.forma_pago || ''}</td>
                                    <td class="px-4 py-3 text-right font-mono text-green-400 font-bold">${formatNumber(p.monto)}</td>
                                    <td class="px-4 py-3 text-gray-400 italic">${p.detalle || '-'}</td>
                                </tr>
                            `).join("")}
                            </tbody>
                        </table>
                    `;
                    pagosContenedor.innerHTML = tablaHTML;
                }

                // Estado de Botones
                if (ing.estado === 'Anulado' || ing.estado === 'Cerrado') {
                    anularBtn.disabled = true;
                    anularBtn.classList.add("opacity-50", "cursor-not-allowed");
                    anularBtn.innerHTML = ing.estado === 'Cerrado' ? "Cerrado" : "<span>🚫</span> Anulado";
                }

            })
            .catch(err => {
                console.error(err);
                infoContenedor.innerHTML = "<p class='text-red-400 p-4 border border-red-800 rounded'>Error de conexión.</p>";
            });
    }

    imprimirBtn.addEventListener("click", () => window.print());

    anularBtn.addEventListener("click", () => {
        mostrarModal({
            titulo: "⚠️ Confirmar Anulación",
            mensaje: "¿Estás seguro que deseas anular este ingreso? Esto revertirá el saldo en caja/cuenta.",
            textoConfirmar: "Sí, Anular",
            textoCancelar: "Volver",
            onConfirmar: () => {
                fetch(`https://cambiosorion.cl/data/detalle-ing.php`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: ingresoId, action: "anular" })
                })
                .then(res => res.json())
                .then(response => {
                    if (response.success) {
                        mostrarModal({ titulo: "✅ Éxito", mensaje: "Ingreso anulado correctamente.", onConfirmar: () => location.reload() });
                    } else {
                        mostrarModal({ titulo: "❌ Error", mensaje: response.message });
                    }
                })
                .catch(() => mostrarModal({ titulo: "❌ Error", mensaje: "Error de conexión." }));
            }
        });
    });

    function mostrarModal({ titulo, mensaje, textoConfirmar = "Aceptar", textoCancelar = null, onConfirmar, onCancelar }) {
      const modal = document.getElementById("modal-generico");
      document.getElementById("modal-generico-titulo").textContent = titulo;
      document.getElementById("modal-generico-mensaje").textContent = mensaje;
      const btnConfirmar = document.getElementById("modal-generico-confirmar");
      const btnCancelar = document.getElementById("modal-generico-cancelar");

      btnConfirmar.textContent = textoConfirmar;
      btnCancelar.classList.toggle("hidden", !textoCancelar);
      if (textoCancelar) btnCancelar.textContent = textoCancelar;

      modal.classList.remove("hidden");

      const newConfirm = btnConfirmar.cloneNode(true);
      const newCancel = btnCancelar.cloneNode(true);
      btnConfirmar.parentNode.replaceChild(newConfirm, btnConfirmar);
      btnCancelar.parentNode.replaceChild(newCancel, btnCancelar);

      newConfirm.onclick = () => { modal.classList.add("hidden"); if (onConfirmar) onConfirmar(); };
      newCancel.onclick = () => { modal.classList.add("hidden"); if (onCancelar) onCancelar(); };
    }

    cargarDetalleIngreso();
});