document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const egresoId = params.get("id");
    
    const infoContenedor = document.getElementById("info-egreso");
    const pagosContenedor = document.getElementById("detalle-pagos-egreso");
    const anularBtn = document.getElementById("anular-egreso");
    const imprimirBtn = document.getElementById("imprimir");

    if (!egresoId) {
        infoContenedor.innerHTML = "<p class='text-white p-4 border border-red-500 bg-red-900/20 rounded'>ID no proporcionado.</p>";
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
        return 'bg-gray-700 text-gray-300 border border-gray-600';
    };

    const getDivisaElement = (urlIcono, nombreDivisa) => {
        if (urlIcono && urlIcono.trim() !== "") {
            return `<img src="${urlIcono}" alt="${nombreDivisa}" class="w-10 h-10 object-contain drop-shadow-sm">`;
        }
        // Icono genérico rojo/amarillo
        return `<svg class="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;
    };

    function cargarDetalleEgreso() {
        fetch(`https://cambiosorion.cl/data/detalle-egr.php?id=${egresoId}`)
            .then(async res => {
                const text = await res.text();
                try { return JSON.parse(text); } catch (e) { 
                    console.error("Server Error:", text);
                    throw new Error("Respuesta del servidor inválida."); 
                }
            })    
            .then(data => {
                if (data.error) {
                    infoContenedor.innerHTML = `<p class="text-red-400 p-4 border border-red-800 bg-red-900/20 rounded">${data.error}</p>`;
                    return;
                }

                const egr = data.egreso;
                const esCuenta = egr.tipo_egreso === 'Cuenta';
                const divisaIcon = getDivisaElement(egr.icono_divisa, egr.nombre_divisa);
                const badgeClass = getBadgeColor(egr.estado);

                // --- HTML Principal ---
                let html = `
                <div class="flex flex-col gap-6">
                    
                    <!-- CABECERA -->
                    <div class="flex justify-between items-start">
                        <div>
                           <span class="text-gray-400 text-xs uppercase tracking-wider font-bold">ID Egreso</span>
                           <h2 class="text-3xl font-bold text-white">#${egr.id}</h2>
                        </div>
                        <span class="px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wide ${badgeClass}">
                            ${egr.estado || 'Desconocido'}
                        </span>
                    </div>

                    <!-- HERO CARD (Rojo) -->
                    <div class="bg-gray-800/80 border border-gray-700 rounded-xl p-6 flex items-center justify-between shadow-lg relative overflow-hidden">
                         <div class="absolute top-0 left-0 w-1 h-full bg-red-600"></div>
                        <div class="flex items-center gap-4">
                            <div class="bg-white/5 p-2 rounded-full border border-white/10">
                                ${divisaIcon}
                            </div>
                            <div>
                                <p class="text-red-400 text-sm font-bold uppercase tracking-wide">Monto Egresado</p>
                                <p class="text-4xl font-bold text-white tracking-tight flex items-baseline gap-2"> 
                                    <span class="text-xl text-gray-400 font-normal">${egr.simbolo_divisa || ''}</span>
                                    ${formatNumber(egr.monto)}
                                </p>
                                <p class="text-sm text-gray-500">${egr.nombre_divisa}</p>
                            </div>
                        </div>
                    </div>

                    <!-- GRID DE DATOS -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        <!-- Lado Izquierdo: Operativo -->
                        <div class="bg-gray-800 p-5 rounded-xl border border-gray-700 space-y-4 shadow-md">
                            <h3 class="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2 border-b border-gray-700 pb-2">Datos Operativos</h3>
                            
                            <div class="flex justify-between">
                                <span class="text-gray-500 text-sm">Tipo:</span>
                                <span class="text-white font-medium bg-gray-900 px-2 py-0.5 rounded text-xs uppercase">${egr.tipo_egreso}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-500 text-sm">Caja Origen:</span>
                                <span class="text-white font-medium">${egr.nombre_caja || '—'}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-500 text-sm">Cajero Responsable:</span>
                                <span class="text-white font-medium">${egr.nombre_cajero || 'Sistema'}</span>
                            </div>
                             <div class="flex justify-between">
                                <span class="text-gray-500 text-sm">Fecha:</span>
                                <span class="text-white font-medium text-right">${formatearFecha(egr.fecha)}</span>
                            </div>
                        </div>

                        <!-- Lado Derecho: Destino -->
                        <div class="bg-gray-800 p-5 rounded-xl border border-gray-700 space-y-4 shadow-md">
                            <h3 class="text-blue-400 text-xs font-bold uppercase tracking-widest mb-2 border-b border-gray-700 pb-2">Destino del Dinero</h3>
                            
                            <div class="flex justify-between">
                                <span class="text-gray-500 text-sm">Cliente Receptor:</span>
                                <span class="text-white font-medium text-right truncate w-1/2">${egr.nombre_cliente || '—'}</span>
                            </div>
                `;

                if (esCuenta) {
                    html += `
                        <div class="flex justify-between">
                            <span class="text-gray-500 text-sm">Cuenta Origen (Nuestra):</span>
                            <span class="text-gray-400 italic text-right">Caja ${egr.nombre_caja}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-500 text-sm">Cuenta Destino (Cliente):</span>
                            <span class="text-white font-medium text-right truncate w-1/2" title="${egr.nombre_cuenta_destino}">${egr.nombre_cuenta_destino || '—'}</span>
                        </div>
                    `;
                } else {
                    html += `
                        <div class="mt-2 text-xs text-gray-500 italic text-right">
                            * Entrega de efectivo por ventanilla
                        </div>
                    `;
                }

                html += `
                        </div>
                    </div>

                    ${egr.detalle ? `
                    <div class="bg-gray-800 p-4 rounded-xl border border-gray-700">
                        <span class="text-gray-400 text-xs uppercase font-bold block mb-1">Observaciones</span>
                        <p class="text-gray-300 italic text-sm bg-gray-900/50 p-2 rounded">${egr.detalle}</p>
                    </div>
                    ` : ''}
                    
                </div>
                `;

                infoContenedor.innerHTML = html;

                // --- 2. Tabla (Simulada o real si hay desglose) ---
                const pagos = data.pagos || [];
                const tablaHTML = `
                    <table class="w-full text-sm text-left text-gray-300 bg-gray-800">
                        <thead class="text-xs uppercase bg-gray-900 text-gray-400 border-b border-gray-700">
                            <tr>
                                <th class="px-4 py-3">Fecha</th>
                                <th class="px-4 py-3">Forma</th>
                                <th class="px-4 py-3 text-right">Monto Salida</th>
                                <th class="px-4 py-3">Detalle</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-700">
                        ${pagos.map(p => `
                            <tr class="hover:bg-gray-700 transition">
                                <td class="px-4 py-3">${formatearFecha(p.fecha)}</td>
                                <td class="px-4 py-3">${p.forma_pago || ''}</td>
                                <td class="px-4 py-3 text-right font-mono text-red-400 font-bold">-${formatNumber(p.monto)}</td>
                                <td class="px-4 py-3 text-gray-400 italic">${p.detalle || '-'}</td>
                            </tr>
                        `).join("")}
                        </tbody>
                    </table>
                `;
                pagosContenedor.innerHTML = tablaHTML;

                // Botones
                if (egr.estado === 'Anulado') {
                    anularBtn.disabled = true;
                    anularBtn.classList.add("opacity-50", "cursor-not-allowed");
                    anularBtn.innerHTML = "Anulado";
                }

            })
            .catch(err => {
                console.error(err);
                infoContenedor.innerHTML = "<p class='text-red-400'>Error de conexión.</p>";
            });
    }

    imprimirBtn.addEventListener("click", () => window.print());

    anularBtn.addEventListener("click", () => {
        mostrarModal({
            titulo: "⚠️ Anular Egreso",
            mensaje: "¿Confirmas que deseas anular? Esto devolverá el dinero a la caja.",
            textoConfirmar: "Sí, Anular",
            textoCancelar: "Volver",
            onConfirmar: () => {
                fetch(`https://cambiosorion.cl/data/detalle-egr.php`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: egresoId, action: "anular" })
                })
                .then(res => res.json())
                .then(response => {
                    if (response.success) {
                        mostrarModal({ titulo: "✅ Éxito", mensaje: "Anulado correctamente.", onConfirmar: () => location.reload() });
                    } else {
                        mostrarModal({ titulo: "❌ Error", mensaje: response.message });
                    }
                })
                .catch(() => mostrarModal({ titulo: "❌ Error", mensaje: "Error de red." }));
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

    cargarDetalleEgreso();
});