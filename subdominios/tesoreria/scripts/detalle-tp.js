import { 
    initSystem, 
    formatearNumero 
} from './index.js';

document.addEventListener("DOMContentLoaded", async () => {
    // 1. Inicializar sistema estándar (activa sidebar 'traspasos' y header usuario)
    await initSystem('traspasos');

    const params = new URLSearchParams(window.location.search);
    const tpId = params.get("id");
    
    const infoContenedor = document.getElementById("info-traspaso");
    const anularBtn = document.getElementById("anular-tp");
    const imprimirBtn = document.getElementById("imprimir");
    const btnVolver = document.getElementById("volver-lista");

    if (!tpId) {
        infoContenedor.innerHTML = "<p class='text-white p-6 bg-red-900/20 border border-red-800 rounded-lg text-center'>ID de traspaso no proporcionado.</p>";
        return;
    }

    if (btnVolver) {
        btnVolver.addEventListener('click', () => {
            window.history.back(); 
        });
    }

    const formatearFecha = (timestamp) => {
        if (!timestamp) return ''; 
        const date = new Date(timestamp.replace(/-/g, "/"));
        if (isNaN(date)) return timestamp;
        return date.toLocaleString('es-CL', { 
            hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' 
        });
    };

    // Colores de estado (Pendiente = Amarillo/Ambar, Pagado = Verde)
    const getBadgeColor = (estado) => {
        const est = (estado || '').toLowerCase();
        if (est === 'pendiente') return 'bg-amber-900/40 text-amber-300 border border-amber-500/30';
        if (est === 'pagado' || est === 'completado') return 'bg-green-900/40 text-green-300 border border-green-500/30';
        if (est === 'anulado') return 'bg-red-900/40 text-red-300 border border-red-500/30';
        return 'bg-slate-800 text-slate-400 border border-slate-700';
    };

    // SVG en lugar de Emoji para divisa
    const getDivisaElement = (urlIcono, nombreDivisa) => {
        if (urlIcono && urlIcono.trim() !== "") {
            return `<img src="${urlIcono}" alt="${nombreDivisa}" class="w-10 h-10 object-contain drop-shadow-sm bg-white/5 rounded-full p-0.5 border border-white/10">`;
        }
        return `<div class="p-2 bg-slate-700 rounded-full text-slate-400"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div>`;
    };

    function cargarDetalle() {
        fetch(`https://cambiosorion.cl/data/detalle-tp.php?id=${tpId}`)
            .then(async res => {
                const text = await res.text();
                try { return JSON.parse(text); } catch (e) { throw new Error("Error en respuesta del servidor."); }
            })    
            .then(data => {
                if (data.error) {
                    infoContenedor.innerHTML = `<p class="text-red-400 p-6 bg-red-900/10 border border-red-800 rounded-lg text-center">${data.error}</p>`;
                    return;
                }

                const tp = data.traspaso;
                const divisaIcon = getDivisaElement(tp.icono, tp.divisa);
                const badgeClass = getBadgeColor(tp.estado);

                // --- Construcción del HTML con Nuevo Diseño (Glass + Ambar) ---
                let html = `
                <div class="flex flex-col gap-6">
                    
                    <div class="flex justify-between items-start">
                        <div>
                           <span class="text-slate-400 text-xs uppercase tracking-wider font-bold">ID Transacción</span>
                           <h2 class="text-3xl font-bold text-white">#${tp.id}</h2>
                        </div>
                        <span class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${badgeClass}">
                            ${tp.estado || 'Desconocido'}
                        </span>
                    </div>

                    <div class="bg-slate-900/90 backdrop-blur-md rounded-xl shadow-2xl border border-amber-500/20 p-6 relative overflow-hidden flex items-center justify-between">
                         <div class="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
                         
                         <div class="absolute right-0 top-0 p-4 opacity-5 pointer-events-none">
                             <svg class="w-32 h-32 text-amber-500" fill="currentColor" viewBox="0 0 24 24"><path d="M7.01 18c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v3c0 .55.45 1 1 1h3c.55 0 1-.45 1-1v-3zM1 18v3h5v-3H1zM21 2h-3c-.55 0-1 .45-1 1v3c0 .55.45 1 1 1h3c.55 0 1-.45 1-1V3c0-.55-.45-1-1-1zM21 6h-5V3h5v3zM16.99 18c0-.55-.45-1-1-1h-3c-.55 0-1 .45-1 1v3c0 .55.45 1 1 1h3c.55 0 1-.45 1-1v-3zM13 18v3h5v-3h-5zM7.01 2h-3c-.55 0-1 .45-1 1v3c0 .55.45 1 1 1h3c.55 0 1-.45 1-1V3c0-.55-.45-1-1-1zM6 6H1V3h5v3z"/></svg>
                         </div>

                        <div class="flex items-center gap-5 relative z-10">
                            <div class="bg-white/5 p-3 rounded-full border border-white/10 shadow-inner">
                                ${divisaIcon}
                            </div>
                            <div>
                                <p class="text-amber-500 text-xs font-bold uppercase tracking-wide">Monto Transferido</p>
                                <p class="text-4xl font-bold text-white tracking-tight flex items-baseline gap-2 font-mono"> 
                                    <span class="text-xl text-slate-400 font-normal">${tp.simbolo || ''}</span>
                                    ${formatNumber(tp.monto)}
                                </p>
                                <p class="text-sm text-slate-500 font-medium">${tp.divisa}</p>
                            </div>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                        
                        <div class="hidden md:flex absolute inset-0 items-center justify-center pointer-events-none z-20">
                            <div class="bg-slate-900 p-2 rounded-full border border-slate-700 shadow-xl">
                                <svg class="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                            </div>
                        </div>

                        <div class="bg-slate-800/50 backdrop-blur-md p-6 rounded-xl border border-white/5 space-y-4 shadow-lg flex flex-col justify-center">
                            <div class="flex items-center gap-2 border-b border-white/5 pb-3 mb-2">
                                <div class="p-1.5 bg-red-900/30 rounded text-red-400 border border-red-500/20"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg></div>
                                <h3 class="text-slate-400 text-xs font-bold uppercase tracking-widest">Salida (Origen)</h3>
                            </div>
                            
                            <div class="flex justify-between items-center">
                                <span class="text-slate-500 text-sm font-medium">Caja:</span>
                                <span class="text-white font-bold text-lg">${tp.origen}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-slate-500 text-sm font-medium">Responsable:</span>
                                <span class="text-slate-300 font-medium">${tp.usuario || 'Sistema'}</span>
                            </div>
                             <div class="flex justify-between">
                                <span class="text-slate-500 text-sm font-medium">Fecha:</span>
                                <span class="text-slate-300 font-medium text-right">${formatearFecha(tp.fecha)}</span>
                            </div>
                        </div>

                        <div class="bg-slate-800/50 backdrop-blur-md p-6 rounded-xl border border-white/5 space-y-4 shadow-lg flex flex-col justify-center">
                            <div class="flex items-center gap-2 border-b border-white/5 pb-3 mb-2">
                                <div class="p-1.5 bg-green-900/30 rounded text-green-400 border border-green-500/20"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path></svg></div>
                                <h3 class="text-slate-400 text-xs font-bold uppercase tracking-widest">Entrada (Destino)</h3>
                            </div>
                            
                            <div class="flex justify-between items-center">
                                <span class="text-slate-500 text-sm font-medium">Caja:</span>
                                <span class="text-white font-bold text-lg">${tp.destino}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-slate-500 text-sm font-medium">Recepción:</span>
                                <span class="${tp.estado === 'Pagado' ? 'text-green-400' : 'text-amber-400'} font-bold text-sm uppercase">
                                    ${tp.estado === 'Pagado' ? 'Confirmado' : 'Pendiente'}
                                </span>
                            </div>
                        </div>
                    </div>

                    ${tp.observaciones ? `
                    <div class="bg-slate-900/80 backdrop-blur-md p-6 rounded-xl border border-white/10 shadow-lg">
                        <span class="text-slate-400 text-xs uppercase font-bold block mb-2">Observaciones</span>
                        <p class="text-slate-300 italic text-sm bg-slate-950/50 p-3 rounded-lg border border-white/5">${tp.observaciones}</p>
                    </div>
                    ` : ''}
                </div>
                `;

                infoContenedor.innerHTML = html;

                // Lógica de botones
                if (tp.estado === 'Anulado') {
                    if(anularBtn) anularBtn.classList.add('hidden');
                } else {
                    if(anularBtn) anularBtn.classList.remove('hidden');
                }
            })
            .catch(err => {
                console.error(err);
                infoContenedor.innerHTML = "<p class='text-red-400 p-6 text-center'>Error de conexión al cargar detalles.</p>";
            });
    }

    if (imprimirBtn) imprimirBtn.addEventListener("click", () => window.print());

    if (anularBtn) {
        anularBtn.addEventListener("click", () => {
            mostrarModal({
                tipo: 'advertencia',
                titulo: "Anular Traspaso",
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
                                tipo: 'exito',
                                titulo: "Anulado", 
                                mensaje: "Traspaso anulado y saldos revertidos.", 
                                onConfirmar: () => location.reload() 
                            });
                        } else {
                            mostrarModal({ tipo: 'error', titulo: "Error", mensaje: response.message || "No se pudo anular." });
                        }
                    })
                    .catch(() => mostrarModal({ tipo: 'error', titulo: "Error", mensaje: "Error de conexión." }));
                }
            });
        });
    }

    // Modal Genérico (Versión Mejorada con Iconos SVG)
    function mostrarModal({ titulo, mensaje, tipo = 'info', textoConfirmar = "Aceptar", textoCancelar = null, onConfirmar, onCancelar }) {
        const modal = document.getElementById("modal-generico");
        const iconoDiv = document.getElementById("modal-generico-icono");
        
        // Iconos SVG según tipo
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

        const newConfirm = btnConfirmar.cloneNode(true);
        const newCancel = btnCancelar.cloneNode(true);
        btnConfirmar.parentNode.replaceChild(newConfirm, btnConfirmar);
        btnCancelar.parentNode.replaceChild(newCancel, btnCancelar);

        newConfirm.onclick = () => { modal.classList.add("hidden"); if (onConfirmar) onConfirmar(); };
        newCancel.onclick = () => { modal.classList.add("hidden"); if (onCancelar) onCancelar(); };
    }

    cargarDetalle();
});