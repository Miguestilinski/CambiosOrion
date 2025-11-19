document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const ingresoId = params.get("id");
    
    const infoContenedor = document.getElementById("info-ingreso");
    const pagosContenedor = document.getElementById("detalle-pagos-ingreso");
    const anularBtn = document.getElementById("anular-ingreso");
    const imprimirBtn = document.getElementById("imprimir");

    if (!ingresoId) {
        infoContenedor.innerHTML = "<p class='text-white'>ID de ingreso no proporcionado.</p>";
        return;
    }

    // --- Helpers de Formato ---
    const formatearFecha = (timestamp) => {
        if (!timestamp) return ''; 
        const fecha = new Date(timestamp);
        return isNaN(fecha.getTime()) ? timestamp : fecha.toLocaleString('es-CL');
    };

    const formatNumber = (num) => {
        const n = parseFloat(num);
        return isNaN(n) ? num : n.toLocaleString('es-CL', {minimumFractionDigits: 1, maximumFractionDigits: 1});
    };

    // --- Helper Visuales ---
    const getBadgeColor = (estado) => {
        const est = (estado || '').toLowerCase();
        if (est === 'vigente') return 'bg-green-900 text-green-300 border border-green-700';
        if (est === 'anulado') return 'bg-red-900 text-red-300 border border-red-700';
        if (est === 'cerrado') return 'bg-gray-700 text-gray-300 border border-gray-600';
        return 'bg-blue-900 text-blue-300';
    };

    // Función para mostrar icono desde DB o fallback genérico
    const getDivisaElement = (urlIcono, nombreDivisa) => {
        // 1. Si hay URL en la base de datos, mostramos la imagen
        if (urlIcono && urlIcono.trim() !== "") {
            return `<img src="${urlIcono}" alt="${nombreDivisa}" class="w-10 h-10 object-contain drop-shadow-sm">`;
        }
        
        // 2. Fallback: SVG genérico de billete si no hay icono en BD
        return `<svg class="w-10 h-10 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;
    };

    function cargarDetalleIngreso() {
        fetch(`https://cambiosorion.cl/data/detalle-ing.php?id=${ingresoId}`)
            .then(async res => {
                const text = await res.text();
                try { return JSON.parse(text); } catch (e) { throw new Error("Respuesta no válida del servidor"); }
            })    
            .then(data => {
                if (data.error) {
                    infoContenedor.innerHTML = `<p class="text-red-400">${data.error}</p>`;
                    return;
                }

                const ing = data.ingreso;
                const esCuenta = ing.tipo_ingreso === 'Cuenta';
                
                // Aquí usamos la nueva función pasando la URL que viene de la BD
                const divisaIcon = getDivisaElement(ing.icono_divisa, ing.nombre_divisa);
                const badgeClass = getBadgeColor(ing.estado);

                // --- CONSTRUCCIÓN DEL HTML ---
                let html = `
                <div class="flex flex-col gap-6">
                    
                    <div class="flex justify-between items-start">
                        <div>
                           <span class="text-gray-400 text-xs uppercase tracking-wider">ID Operación</span>
                           <h2 class="text-3xl font-bold text-white">#${ing.id}</h2>
                        </div>
                        <span class="px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wide ${badgeClass}">
                            ${ing.estado || 'Desconocido'}
                        </span>
                    </div>

                    <div class="bg-gray-700/50 border border-gray-600 rounded-xl p-6 flex items-center justify-between shadow-lg">
                        <div class="flex items-center gap-4">
                            <div class="bg-white/10 p-2 rounded-full">
                                ${divisaIcon}
                            </div>
                            <div>
                                <p class="text-gray-400 text-sm">Monto Ingresado</p>
                                <p class="text-3xl font-bold text-white tracking-tight">${formatNumber(ing.monto)} <span class="text-lg text-yellow-500 font-normal">${ing.simbolo_divisa || ''}</span></p>
                                <p class="text-sm text-gray-300">${ing.nombre_divisa}</p>
                            </div>
                        </div>
                        <div class="text-right hidden sm:block">
                            <p class="text-gray-400 text-xs uppercase">Por Pagar</p>
                            <p class="text-xl font-semibold text-white">${formatNumber(ing.monto)}</p>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        <div class="bg-gray-800 p-4 rounded-lg border border-gray-700 space-y-3">
                            <h3 class="text-yellow-500 text-xs font-bold uppercase tracking-widest mb-2 border-b border-gray-700 pb-2">Información Operativa</h3>
                            
                            <div class="flex justify-between">
                                <span class="text-gray-400 text-sm">Tipo Ingreso:</span>
                                <span class="text-white font-medium">${ing.tipo_ingreso}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-400 text-sm">Caja:</span>
                                <span class="text-white font-medium">${ing.nombre_caja || '—'}</span>
                            </div>
                             <div class="flex justify-between">
                                <span class="text-gray-400 text-sm">Cajero:</span>
                                <span class="text-white font-medium">${ing.nombre_cajero || '—'}</span>
                            </div>
                             <div class="flex justify-between">
                                <span class="text-gray-400 text-sm">Fecha:</span>
                                <span class="text-white font-medium text-right">${formatearFecha(ing.fecha)}</span>
                            </div>
                        </div>

                        <div class="bg-gray-800 p-4 rounded-lg border border-gray-700 space-y-3">
                            <h3 class="text-blue-400 text-xs font-bold uppercase tracking-widest mb-2 border-b border-gray-700 pb-2">Contraparte y Cuentas</h3>
                            
                            <div class="flex justify-between">
                                <span class="text-gray-400 text-sm">Cliente:</span>
                                <span class="text-white font-medium text-right truncate w-1/2">${ing.nombre_cliente || '—'}</span>
                            </div>
                `;

                if (esCuenta) {
                    html += `
                        <div class="flex justify-between">
                            <span class="text-gray-400 text-sm">Cuenta Origen:</span>
                            <span class="text-white font-medium text-right truncate w-1/2" title="${ing.nombre_cuenta_origen}">${ing.nombre_cuenta_origen || '—'}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-400 text-sm">Cuenta Destino:</span>
                            <span class="text-white font-medium text-right truncate w-1/2" title="${ing.nombre_cuenta_destino}">${ing.nombre_cuenta_destino || '—'}</span>
                        </div>
                    `;
                } else {
                    html += `
                        <div class="flex justify-between">
                            <span class="text-gray-400 text-sm">Cuenta Destino:</span>
                            <span class="text-white font-medium text-right truncate w-1/2" title="${ing.nombre_cuenta_destino}">${ing.nombre_cuenta_destino || '—'}</span>
                        </div>
                        <div class="mt-2 text-xs text-gray-500 italic text-right">
                            * Ingreso en efectivo sin cuenta de origen
                        </div>
                    `;
                }

                html += `
                        </div>
                    </div>

                    ${ing.detalle ? `
                    <div class="bg-gray-800 p-4 rounded-lg border border-gray-700">
                        <span class="text-gray-400 text-xs uppercase font-bold">Observaciones / Detalle:</span>
                        <p class="text-white mt-1 italic text-sm">${ing.detalle}</p>
                    </div>
                    ` : ''}
                    
                </div>
                `;

                infoContenedor.innerHTML = html;

                // --- Tabla de Pagos ---
                const pagos = data.pagos || [];
                if (pagos.length === 0) {
                    pagosContenedor.innerHTML = `
                        <div class="w-full p-6 text-center bg-gray-800 rounded-lg border-2 border-gray-600">
                            <p class="text-gray-400 text-sm">No se han registrado pagos parciales para este ingreso.</p>
                        </div>
                    `;
                } else {
                    const tablaHTML = `
                        <table class="w-full text-sm text-left text-white bg-gray-800 rounded-lg overflow-hidden">
                            <thead class="text-xs uppercase bg-yellow-700 text-white">
                                <tr>
                                    <th class="px-4 py-3">Fecha</th>
                                    <th class="px-4 py-3">Forma Pago</th>
                                    <th class="px-4 py-3">Monto</th>
                                    <th class="px-4 py-3">Detalle</th>
                                </tr>
                            </thead>
                            <tbody>
                            ${pagos.map(p => `
                                <tr class="border-b bg-gray-700 border-gray-600 hover:bg-gray-600 transition">
                                    <td class="px-4 py-3">${formatearFecha(p.fecha)}</td>
                                    <td class="px-4 py-3">${p.forma_pago || ''}</td>
                                    <td class="px-4 py-3 font-bold text-yellow-400">${formatNumber(p.monto)}</td>
                                    <td class="px-4 py-3">${p.detalle || ''}</td>
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
                    if(ing.estado === 'Cerrado') anularBtn.textContent = "Cerrado"; 
                    if(ing.estado === 'Anulado') anularBtn.textContent = "Anulado";
                }

            })
            .catch(err => {
                console.error(err);
                infoContenedor.innerHTML = "<p>Error de conexión.</p>";
            });
    }

    imprimirBtn.addEventListener("click", () => window.print());

    anularBtn.addEventListener("click", () => {
        mostrarModal({
            titulo: "⚠️ Anular Ingreso",
            mensaje: "¿Confirmas que deseas anular esta operación? Esta acción es irreversible.",
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