document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const tpId = params.get("id");
    
    const infoContenedor = document.getElementById("info-traspaso");
    const anularBtn = document.getElementById("anular-tp");
    const imprimirBtn = document.getElementById("imprimir");

    if (!tpId) {
        infoContenedor.innerHTML = "<p class='text-white p-4 bg-red-900/20 border border-red-500 rounded'>ID de traspaso no proporcionado.</p>";
        return;
    }

    const formatearFecha = (timestamp) => {
        if (!timestamp) return ''; 
        const date = new Date(timestamp.replace(/-/g, "/"));
        if (isNaN(date)) return timestamp;
        return date.toLocaleString('es-CL', { 
            hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' 
        });
    };

    const formatNumber = (num) => {
        const n = parseFloat(num);
        return isNaN(n) ? num : n.toLocaleString('es-CL', {minimumFractionDigits: 0, maximumFractionDigits: 2});
    };

    const getBadgeColor = (estado) => {
        const est = (estado || '').toLowerCase();
        if (est === 'pendiente') return 'bg-yellow-900 text-yellow-300 border border-yellow-700';
        if (est === 'pagado' || est === 'completado') return 'bg-green-900 text-green-300 border border-green-700';
        if (est === 'anulado') return 'bg-red-900 text-red-300 border border-red-700';
        return 'bg-gray-700 text-gray-300 border border-gray-600';
    };

    const getDivisaElement = (urlIcono, nombreDivisa) => {
        if (urlIcono && urlIcono.trim() !== "") {
            return `<img src="${urlIcono}" alt="${nombreDivisa}" class="w-10 h-10 object-contain drop-shadow-sm bg-white rounded-full p-0.5">`;
        }
        return `<span class="text-3xl">💱</span>`;
    };

    function cargarDetalle() {
        fetch(`https://cambiosorion.cl/data/detalle-tp.php?id=${tpId}`)
            .then(async res => {
                const text = await res.text();
                try { return JSON.parse(text); } catch (e) { throw new Error("Error en respuesta del servidor."); }
            })    
            .then(data => {
                if (data.error) {
                    infoContenedor.innerHTML = `<p class="text-red-400 p-4 bg-red-900/20 border border-red-800 rounded">${data.error}</p>`;
                    return;
                }

                const tp = data.traspaso;
                const divisaIcon = getDivisaElement(tp.icono, tp.divisa);
                const badgeClass = getBadgeColor(tp.estado);

                let html = `
                <div class="flex flex-col gap-6">
                    
                    <div class="flex justify-between items-start">
                        <div>
                           <span class="text-gray-400 text-xs uppercase tracking-wider font-bold">ID Transacción</span>
                           <h2 class="text-3xl font-bold text-white">#${tp.id}</h2>
                        </div>
                        <span class="px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wide ${badgeClass}">
                            ${tp.estado || 'Desconocido'}
                        </span>
                    </div>

                    <div class="bg-gray-800/80 border border-blue-600/30 rounded-xl p-6 flex items-center justify-between shadow-lg relative overflow-hidden">
                         <div class="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                        <div class="flex items-center gap-4">
                            <div class="bg-white/5 p-2 rounded-full border border-white/10">
                                ${divisaIcon}
                            </div>
                            <div>
                                <p class="text-blue-400 text-sm font-bold uppercase tracking-wide">Monto Transferido</p>
                                <p class="text-4xl font-bold text-white tracking-tight flex items-baseline gap-2"> 
                                    <span class="text-xl text-gray-400 font-normal">${tp.simbolo || ''}</span>
                                    ${formatNumber(tp.monto)}
                                </p>
                                <p class="text-sm text-gray-500">${tp.divisa}</p>
                            </div>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                        
                        <div class="hidden md:flex absolute inset-0 items-center justify-center pointer-events-none">
                            <div class="bg-gray-900 p-2 rounded-full border border-gray-700 z-10">
                                <span class="text-2xl text-gray-500">➡️</span>
                            </div>
                        </div>

                        <div class="bg-gray-800 p-5 rounded-xl border border-gray-700 space-y-4 shadow-md">
                            <h3 class="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2 border-b border-gray-700 pb-2">Salida (Origen)</h3>
                            
                            <div class="flex justify-between items-center">
                                <span class="text-gray-500 text-sm">Caja:</span>
                                <span class="text-white font-bold text-lg">${tp.origen}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-500 text-sm">Responsable:</span>
                                <span class="text-white font-medium">${tp.usuario || 'Sistema'}</span>
                            </div>
                             <div class="flex justify-between">
                                <span class="text-gray-500 text-sm">Fecha Creación:</span>
                                <span class="text-white font-medium text-right">${formatearFecha(tp.fecha)}</span>
                            </div>
                        </div>

                        <div class="bg-gray-800 p-5 rounded-xl border border-gray-700 space-y-4 shadow-md">
                            <h3 class="text-green-500 text-xs font-bold uppercase tracking-widest mb-2 border-b border-gray-700 pb-2">Entrada (Destino)</h3>
                            
                            <div class="flex justify-between items-center">
                                <span class="text-gray-500 text-sm">Caja:</span>
                                <span class="text-white font-bold text-lg">${tp.destino}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-500 text-sm">Estado Recepción:</span>
                                <span class="${tp.estado === 'Pagado' ? 'text-green-400' : 'text-yellow-400'} font-medium">
                                    ${tp.estado === 'Pagado' ? 'Confirmado' : 'Pendiente Confirmación'}
                                </span>
                            </div>
                        </div>
                    </div>

                    ${tp.observaciones ? `
                    <div class="bg-gray-800 p-4 rounded-xl border border-gray-700">
                        <span class="text-gray-400 text-xs uppercase font-bold block mb-1">Observaciones</span>
                        <p class="text-gray-300 italic text-sm bg-gray-900/50 p-2 rounded">${tp.observaciones}</p>
                    </div>
                    ` : ''}
                </div>
                `;

                infoContenedor.innerHTML = html;

                // Lógica de botones
                if (tp.estado === 'Anulado') {
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
            titulo: "⚠️ Anular Traspaso",
            mensaje: "¿Seguro que deseas anular este movimiento? Si ya fue completado, se revertirá el saldo en ambas cajas.",
            textoConfirmar: "Sí, Anular",
            textoCancelar: "Cancelar",
            onConfirmar: () => {
                fetch(`https://cambiosorion.cl/data/detalle-tp.php`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: tpId, action: "anular" })
                })
                .then(res => res.json())
                .then(response => {
                    if (response.success) {
                        mostrarModal({ 
                            titulo: "✅ Éxito", 
                            mensaje: "Traspaso anulado correctamente.", 
                            onConfirmar: () => location.reload() 
                        });
                    } else {
                        mostrarModal({ titulo: "❌ Error", mensaje: response.message || "No se pudo anular." });
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

    cargarDetalle();
});