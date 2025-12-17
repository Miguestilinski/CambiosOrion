document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const egresoId = params.get("id");
    
    const infoContenedor = document.getElementById("info-egreso");
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
        return date.toLocaleString('es-CL', { hour12: false });
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
        return `<span class="text-2xl">💵</span>`;
    };

    function cargarDetalle() {
        fetch(`https://cambiosorion.cl/data/detalle-egr-util.php?id=${egresoId}`)
            .then(async res => {
                const text = await res.text();
                try { return JSON.parse(text); } catch (e) { throw new Error("Respuesta inválida del servidor"); }
            })    
            .then(data => {
                if (data.error) {
                    infoContenedor.innerHTML = `<p class="text-red-400 p-4 border border-red-800 bg-red-900/20 rounded">${data.error}</p>`;
                    return;
                }

                const egr = data.egreso;
                const divisaIcon = getDivisaElement(egr.icono_divisa, egr.nombre_divisa);
                const badgeClass = getBadgeColor(egr.estado);
                const esCuenta = egr.tipo_egreso === 'Cuenta';

                // Renderizado HTML
                let html = `
                <div class="flex flex-col gap-6">
                    
                    <div class="flex justify-between items-start">
                        <div>
                           <span class="text-gray-400 text-xs uppercase tracking-wider font-bold">ID Transacción</span>
                           <h2 class="text-3xl font-bold text-white">#${egr.id}</h2>
                        </div>
                        <span class="px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wide ${badgeClass}">
                            ${egr.estado || 'Desconocido'}
                        </span>
                    </div>

                    <div class="bg-gray-800/80 border border-yellow-600/30 rounded-xl p-6 flex items-center justify-between shadow-lg relative overflow-hidden">
                         <div class="absolute top-0 left-0 w-1 h-full bg-yellow-500"></div>
                        <div class="flex items-center gap-4">
                            <div class="bg-white/5 p-2 rounded-full border border-white/10">
                                ${divisaIcon}
                            </div>
                            <div>
                                <p class="text-yellow-500 text-sm font-bold uppercase tracking-wide">Monto Retirado</p>
                                <p class="text-4xl font-bold text-white tracking-tight flex items-baseline gap-2"> 
                                    <span class="text-xl text-gray-400 font-normal">${egr.simbolo_divisa || ''}</span>
                                    ${formatNumber(egr.monto)}
                                </p>
                                <p class="text-sm text-gray-500">${egr.nombre_divisa}</p>
                            </div>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        <div class="bg-gray-800 p-5 rounded-xl border border-gray-700 space-y-4 shadow-md">
                            <h3 class="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2 border-b border-gray-700 pb-2">Datos de Origen</h3>
                            
                            <div class="flex justify-between">
                                <span class="text-gray-500 text-sm">Caja:</span>
                                <span class="text-white font-medium">${egr.nombre_caja}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-500 text-sm">Responsable:</span>
                                <span class="text-white font-medium">${egr.nombre_cajero}</span>
                            </div>
                             <div class="flex justify-between">
                                <span class="text-gray-500 text-sm">Fecha:</span>
                                <span class="text-white font-medium text-right">${formatearFecha(egr.fecha)}</span>
                            </div>
                             <div class="flex justify-between">
                                <span class="text-gray-500 text-sm">Forma:</span>
                                <span class="text-white font-medium bg-gray-900 px-2 py-0.5 rounded text-xs uppercase border border-gray-600">${egr.tipo_egreso}</span>
                            </div>
                        </div>

                        <div class="bg-gray-800 p-5 rounded-xl border border-gray-700 space-y-4 shadow-md">
                            <h3 class="text-yellow-500 text-xs font-bold uppercase tracking-widest mb-2 border-b border-gray-700 pb-2">Destino / Concepto</h3>
                            
                            <div class="flex flex-col gap-1">
                                <span class="text-gray-500 text-sm">Concepto o Beneficiario:</span>
                                <span class="text-xl text-white font-bold">${egr.item_utilidad || '—'}</span>
                            </div>
                `;

                if (esCuenta) {
                    html += `
                        <div class="mt-4 pt-3 border-t border-gray-700">
                             <span class="text-gray-500 text-xs uppercase block mb-1">Cuenta Destino</span>
                             <div class="flex items-center gap-2">
                                <span class="text-2xl">💳</span>
                                <div>
                                    <p class="text-white font-medium text-sm">${egr.nombre_cuenta_destino || 'Cuenta Desconocida'}</p>
                                    <p class="text-gray-500 text-xs">${egr.moneda_cuenta || ''}</p>
                                </div>
                             </div>
                        </div>
                    `;
                }

                html += `
                        </div>
                    </div>

                    ${egr.detalle ? `
                    <div class="bg-gray-800 p-4 rounded-xl border border-gray-700">
                        <span class="text-gray-400 text-xs uppercase font-bold block mb-1">Observaciones</span>
                        <p class="text-gray-300 italic text-sm bg-gray-900/50 p-2 rounded border-l-2 border-yellow-600">${egr.detalle}</p>
                    </div>
                    ` : ''}
                </div>
                `;

                infoContenedor.innerHTML = html;

                // Estado botón anular
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
            titulo: "⚠️ Anular Retiro",
            mensaje: "¿Confirmas anular este retiro? El dinero volverá a la caja de origen.",
            textoConfirmar: "Anular Definitivamente",
            textoCancelar: "Volver",
            onConfirmar: () => {
                fetch(`https://cambiosorion.cl/data/detalle-egr-util.php`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: egresoId, action: "anular" })
                })
                .then(res => res.json())
                .then(r => {
                    if (r.success) location.reload();
                    else mostrarModal({ titulo: "❌ Error", mensaje: r.message });
                });
            }
        });
    });

    // Función auxiliar para modales
    function mostrarModal({ titulo, mensaje, textoConfirmar, textoCancelar, onConfirmar, onCancelar }) {
      const modal = document.getElementById("modal-generico");
      document.getElementById("modal-generico-titulo").textContent = titulo;
      document.getElementById("modal-generico-mensaje").textContent = mensaje;
      const btnConfirmar = document.getElementById("modal-generico-confirmar");
      const btnCancelar = document.getElementById("modal-generico-cancelar");

      btnConfirmar.textContent = textoConfirmar || "Aceptar";
      btnCancelar.classList.toggle("hidden", !textoCancelar);
      if (textoCancelar) btnCancelar.textContent = textoCancelar;

      modal.classList.remove("hidden");

      // Clonar para limpiar eventos anteriores
      const newConfirm = btnConfirmar.cloneNode(true);
      const newCancel = btnCancelar.cloneNode(true);
      btnConfirmar.parentNode.replaceChild(newConfirm, btnConfirmar);
      btnCancelar.parentNode.replaceChild(newCancel, btnCancelar);

      newConfirm.onclick = () => { modal.classList.add("hidden"); if (onConfirmar) onConfirmar(); };
      newCancel.onclick = () => { modal.classList.add("hidden"); if (onCancelar) onCancelar(); };
    }

    cargarDetalle();
});