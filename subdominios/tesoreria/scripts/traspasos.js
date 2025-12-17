let usuarioSesion = null;
let caja_id = null;
let modoCompletar = false;
let totalesSeleccionados = {};

document.addEventListener('DOMContentLoaded', async () => {
    const tabla = document.getElementById('tabla-transacciones');
    const resumenDiv = document.getElementById('resumen-completado');
    const resumenTotales = document.getElementById('resumen-totales');
    const btnNuevo = document.getElementById('nuevo-tp');
    const btnModo = document.getElementById('activar-completado');

    // Filtros
    const filtros = {
        numero: document.getElementById("numero"),
        fecha: document.getElementById("fecha"),
        origen: document.getElementById("origen"),
        destino: document.getElementById("destino"),
        divisa: document.getElementById("divisa"),
        monto: document.getElementById("monto"),
        estado: document.getElementById("estado"),
        limit: document.getElementById("mostrar-registros")
    };

    // 1. Obtener Sesión
    try {
        const res = await fetch("https://cambiosorion.cl/data/session_status.php", { credentials: "include" });
        usuarioSesion = await res.json();
        if (usuarioSesion && usuarioSesion.caja_id) {
            caja_id = usuarioSesion.caja_id;
            cargarTraspasos();
        } else {
            console.warn("Sin sesión de caja activa");
            cargarTraspasos(); // Intentar cargar igual (quizás es admin global)
        }
    } catch (e) { console.error("Error sesión", e); }

    // 2. Eventos Filtros
    Object.values(filtros).forEach(input => {
        input.addEventListener('input', () => { clearTimeout(window.tFil); window.tFil = setTimeout(cargarTraspasos, 500); });
        input.addEventListener('change', cargarTraspasos);
    });

    if(btnNuevo) btnNuevo.onclick = () => window.location.href = 'nuevo-tp'; // O la URL correcta cuando la crees
    
    // 3. Toggle Modo Completar
    if(btnModo) {
        btnModo.onclick = () => {
            modoCompletar = !modoCompletar;
            btnModo.textContent = modoCompletar ? "Cancelar Gestión" : "Gestionar Pendientes";
            btnModo.classList.toggle("bg-gray-700", !modoCompletar);
            btnModo.classList.toggle("bg-red-700", modoCompletar);
            
            resumenDiv.classList.toggle("hidden", !modoCompletar);
            cargarTraspasos(); // Recargar para mostrar/ocultar checkboxes
        };
    }

    // 4. Cargar Datos
    async function cargarTraspasos() {
        const params = new URLSearchParams();
        if(caja_id) params.append("caja_id", caja_id);
        
        for (const [key, el] of Object.entries(filtros)) {
            if(el.value) params.append(key, el.value);
        }
        params.append("mostrar", filtros.limit.value);

        try {
            const res = await fetch(`https://cambiosorion.cl/data/traspasos.php?${params}`);
            const data = await res.json();
            renderTabla(data);
        } catch(e) { console.error(e); }
    }

    // 5. Render
    function renderTabla(data) {
        tabla.innerHTML = '';
        totalesSeleccionados = {};
        actualizarTotalesUI();

        if(!data || data.length === 0) {
            tabla.innerHTML = `<tr><td colspan="9" class="text-center py-8 text-gray-500">No hay registros</td></tr>`;
            return;
        }

        // Fila "Seleccionar Todos" si estamos en modo completar
        if(modoCompletar) {
            const trAll = document.createElement("tr");
            trAll.className = "bg-gray-800 border-b border-gray-700";
            trAll.innerHTML = `
                <td colspan="8" class="px-6 py-3 font-bold text-yellow-500">
                    <label class="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" id="check-all" class="rounded bg-gray-700 border-gray-600 text-yellow-500 focus:ring-yellow-500">
                        Seleccionar todos los pendientes visibles
                    </label>
                </td>
                <td class="px-6 py-3 text-right">
                    <button id="btn-completar-batch" class="bg-green-600 hover:bg-green-500 text-white text-xs font-bold px-3 py-2 rounded">
                        Completar Seleccionados
                    </button>
                </td>
            `;
            tabla.appendChild(trAll);

            setTimeout(() => {
                const checkAll = document.getElementById("check-all");
                const btnBatch = document.getElementById("btn-completar-batch");
                
                checkAll.addEventListener("change", (e) => {
                    document.querySelectorAll(".check-tp").forEach(ck => {
                        ck.checked = e.target.checked;
                        ck.dispatchEvent(new Event('change'));
                    });
                });

                btnBatch.addEventListener("click", () => {
                    const ids = Array.from(document.querySelectorAll(".check-tp:checked")).map(c => c.value);
                    if(ids.length > 0) procesarCompletado(ids);
                    else mostrarModal("Selecciona al menos uno.");
                });
            }, 0);
        }

        data.forEach(t => {
            const tr = document.createElement("tr");
            tr.className = "bg-gray-800 hover:bg-gray-700 transition border-b border-gray-700";
            
            const esPendiente = t.estado === "Pendiente";
            const badgeColor = esPendiente ? "bg-yellow-900 text-yellow-300 border-yellow-700" : 
                               (t.estado === "Pagado" || t.estado === "Completado") ? "bg-green-900 text-green-300 border-green-700" : 
                               "bg-red-900 text-red-300 border-red-700";

            // Checkbox logic
            let checkHtml = "";
            if(modoCompletar && esPendiente) {
                checkHtml = `<input type="checkbox" class="check-tp rounded bg-gray-700 border-gray-600 text-yellow-500 focus:ring-yellow-500" value="${t.id}" data-monto="${t.monto}" data-divisa="${t.divisa}">`;
            } else if (modoCompletar) {
                checkHtml = `<span class="text-gray-600">-</span>`;
            } else {
                checkHtml = `<span class="font-mono text-gray-500">#${t.id}</span>`;
            }

            tr.innerHTML = `
                <td class="px-6 py-4 font-medium text-white whitespace-nowrap flex items-center gap-3">
                    ${checkHtml} 
                    ${!modoCompletar ? '' : `<span class="font-mono text-xs text-gray-500">#${t.id}</span>`}
                </td>
                <td class="px-6 py-4">${t.fecha.substring(0, 16)}</td>
                <td class="px-6 py-4 text-gray-300">${t.origen}</td>
                <td class="px-6 py-4 text-center text-gray-500">➝</td>
                <td class="px-6 py-4 text-white">${t.destino}</td>
                <td class="px-6 py-4 text-yellow-400 font-bold">${t.divisa}</td>
                <td class="px-6 py-4 text-right font-mono text-white">${parseFloat(t.monto).toLocaleString("es-CL")}</td>
                <td class="px-6 py-4 text-center">
                    <span class="px-2 py-1 text-xs font-bold rounded border ${badgeColor}">${t.estado}</span>
                </td>
                <td class="px-6 py-4 text-right">
                    ${(esPendiente && !modoCompletar) ? 
                        `<button class="btn-completar-uno bg-green-700 hover:bg-green-600 text-white px-2 py-1 rounded text-xs" data-id="${t.id}">Completar</button>` 
                        : ''}
                </td>
            `;

            tabla.appendChild(tr);

            // Listener para sumar totales al marcar checkbox
            if(modoCompletar && esPendiente) {
                const ck = tr.querySelector(".check-tp");
                ck.addEventListener("change", (e) => {
                    const m = parseFloat(t.monto);
                    const d = t.divisa;
                    if(e.target.checked) {
                        totalesSeleccionados[d] = (totalesSeleccionados[d] || 0) + m;
                    } else {
                        totalesSeleccionados[d] = (totalesSeleccionados[d] || 0) - m;
                        if(totalesSeleccionados[d] <= 0) delete totalesSeleccionados[d];
                    }
                    actualizarTotalesUI();
                });
            }
            
            // Listener completar individual
            const btnOne = tr.querySelector(".btn-completar-uno");
            if(btnOne) btnOne.onclick = () => procesarCompletado([t.id]);
        });
    }

    function actualizarTotalesUI() {
        const txt = Object.entries(totalesSeleccionados)
            .map(([div, mont]) => `<span class="bg-gray-900 px-2 py-1 rounded border border-gray-600 mr-2">${div}: ${mont.toLocaleString("es-CL")}</span>`)
            .join("");
        resumenTotales.innerHTML = txt || "Ninguno seleccionado";
    }

    async function procesarCompletado(ids) {
        if(!confirm(`¿Completar ${ids.length} traspaso(s)? Esto moverá el inventario.`)) return;

        try {
            const res = await fetch("https://cambiosorion.cl/data/traspasos.php", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ids: ids })
            });
            const data = await res.json();
            
            if(data.exito) {
                mostrarModal("✅ Operación exitosa", "Traspasos completados.");
                cargarTraspasos();
            } else {
                mostrarModal("❌ Error", data.mensaje);
            }
        } catch(e) { mostrarModal("Error de conexión"); }
    }

    function mostrarModal(titulo, msg) {
        document.getElementById("modal-titulo").textContent = titulo;
        document.getElementById("modal-mensaje").textContent = msg || "";
        const m = document.getElementById("modal-generico");
        m.classList.remove("hidden");
        document.getElementById("modal-confirmar").onclick = () => m.classList.add("hidden");
    }
});