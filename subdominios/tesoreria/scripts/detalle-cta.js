import { 
    initSystem, 
    limpiarTexto, 
    formatearNumero, 
    formatearFechaHora, 
    mostrarModalError,
    mostrarModalExitoso
} from './index.js';

document.addEventListener('DOMContentLoaded', async () => {
    await initSystem('cuentas');

    // Referencias Inputs
    const inputs = {
        nombre: document.getElementById('nombre'),
        banco: document.getElementById('banco'),
        tipo: document.getElementById('tipo'),
        numero: document.getElementById('numero'),
        rut: document.getElementById('rut'),
        email: document.getElementById('email'),
        activa: document.getElementById('activa'),
        porCobrar: document.getElementById('por-cobrar'),
        porPagar: document.getElementById('por-pagar'),
        divisaInput: document.getElementById('divisa-input'),
        divisaId: document.getElementById('divisa-id'),
        divisaLista: document.getElementById('divisa-lista')
    };

    // Referencias Info
    const lblSaldo = document.getElementById('saldo-actual');
    const lblDivisaBadge = document.getElementById('divisa-badge');
    
    // Referencias Tabla
    const tablaOps = document.getElementById('tabla-operaciones');
    const inputFiltroOps = document.getElementById('filtrar-ops');

    // Botones
    const btnGuardar = document.getElementById('guardar-cambios');
    const btnVolver = document.getElementById('volver-lista');

    // Estado local
    let operacionesData = [];

    // Obtener ID
    const params = new URLSearchParams(window.location.search);
    const cuentaId = params.get('id');

    if (!cuentaId) {
        mostrarModalError({ titulo: "Error", mensaje: "ID de cuenta no especificado." });
        return;
    }

    if (btnVolver) {
        btnVolver.addEventListener('click', () => {
            window.location.href = 'https://tesoreria.cambiosorion.cl/cuentas';
        });
    }

    // --- CARGAR DATOS ---
    function cargarCuenta() {
        fetch(`https://cambiosorion.cl/data/detalle-cta.php?id=${cuentaId}`)
            .then(res => res.json())
            .then(data => {
                if (data.error) throw new Error(data.error);

                const cta = data.cuenta;
                
                // Llenar inputs
                inputs.nombre.value = limpiarTexto(cta.nombre);
                inputs.banco.value = limpiarTexto(cta.banco);
                inputs.tipo.value = limpiarTexto(cta.tipo_cuenta);
                inputs.numero.value = limpiarTexto(cta.numero_cuenta);
                inputs.rut.value = limpiarTexto(cta.rut_titular);
                inputs.email.value = limpiarTexto(cta.email_titular);
                
                inputs.activa.value = cta.activa == 1 ? "1" : "0";
                inputs.porCobrar.checked = cta.por_cobrar == 1;
                inputs.porPagar.checked = cta.por_pagar == 1;

                // Divisa
                inputs.divisaId.value = cta.divisa_id || '';
                inputs.divisaInput.value = cta.nombre_divisa || '';
                lblDivisaBadge.textContent = cta.nombre_divisa || 'Sin divisa';

                // Saldo
                lblSaldo.textContent = '$' + formatearNumero(cta.saldo);

                // Operaciones
                operacionesData = data.operaciones || [];
                renderizarOperaciones(operacionesData);
            })
            .catch(err => {
                console.error(err);
                mostrarModalError({ titulo: "Error", mensaje: "No se pudo cargar la cuenta." });
            });
    }

    // --- BUSCADOR DIVISAS ---
    if (inputs.divisaInput) {
        inputs.divisaInput.addEventListener('input', async (e) => {
            const term = e.target.value.trim();
            if (term.length < 1) {
                inputs.divisaLista.classList.add('hidden');
                return;
            }

            try {
                const res = await fetch(`https://cambiosorion.cl/data/detalle-cta.php?buscar_divisa=${encodeURIComponent(term)}`);
                const divisas = await res.json();
                
                inputs.divisaLista.innerHTML = '';
                if (divisas.length > 0) {
                    divisas.forEach(d => {
                        const li = document.createElement('li');
                        li.className = "px-4 py-2 hover:bg-slate-700 cursor-pointer text-sm text-slate-300 transition flex items-center gap-2";
                        
                        // Icono si existe
                        const img = d.icono ? `<img src="${d.icono}" class="w-4 h-4 rounded-full">` : '';
                        li.innerHTML = `${img} <span>${d.nombre}</span>`;
                        
                        li.onclick = () => {
                            inputs.divisaInput.value = d.nombre;
                            inputs.divisaId.value = d.id;
                            inputs.divisaLista.classList.add('hidden');
                            lblDivisaBadge.textContent = d.nombre;
                        };
                        inputs.divisaLista.appendChild(li);
                    });
                    inputs.divisaLista.classList.remove('hidden');
                } else {
                    inputs.divisaLista.classList.add('hidden');
                }
            } catch (err) {
                console.error("Error buscando divisas", err);
            }
        });

        // Cerrar lista al hacer click fuera
        document.addEventListener('click', (e) => {
            if (!inputs.divisaInput.contains(e.target) && !inputs.divisaLista.contains(e.target)) {
                inputs.divisaLista.classList.add('hidden');
            }
        });
    }

    // --- GUARDAR CAMBIOS ---
    if (btnGuardar) {
        btnGuardar.addEventListener('click', () => {
            const payload = {
                id: cuentaId,
                nombre: inputs.nombre.value,
                banco: inputs.banco.value,
                tipo_cuenta: inputs.tipo.value,
                numero_cuenta: inputs.numero.value,
                rut_titular: inputs.rut.value,
                email_titular: inputs.email.value,
                divisa_id: inputs.divisaId.value,
                activa: inputs.activa.value === "1",
                por_cobrar: inputs.porCobrar.checked,
                por_pagar: inputs.porPagar.checked
            };

            fetch("https://cambiosorion.cl/data/detalle-cta.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    mostrarModalExitoso({ titulo: "Guardado", mensaje: "Cuenta actualizada correctamente." });
                } else {
                    throw new Error(data.error || "Error al guardar.");
                }
            })
            .catch(err => {
                mostrarModalError({ titulo: "Error", mensaje: err.message });
            });
        });
    }

    // --- RENDERIZAR OPERACIONES ---
    function renderizarOperaciones(lista) {
        tablaOps.innerHTML = '';

        if (lista.length === 0) {
            tablaOps.innerHTML = `<tr><td colspan="5" class="text-center text-slate-500 py-10 italic">Sin movimientos recientes.</td></tr>`;
            return;
        }

        lista.forEach(op => {
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-white/5 transition-all border-b border-white/5 last:border-0 text-slate-300';

            // Estilos
            let montoClass = "text-white";
            // Si es Ingreso (+) o Egreso (-)
            // Esto depende de tu lógica de negocio, por ahora neutro

            tr.innerHTML = `
                <td class="px-6 py-3 whitespace-nowrap text-xs">${formatearFechaHora(op.fecha)}</td>
                <td class="px-6 py-3 font-mono text-xs font-bold text-slate-500">#${op.id}</td>
                <td class="px-6 py-3 text-sm text-white truncate max-w-[200px]" title="${limpiarTexto(op.nombre_cliente)}">
                    ${limpiarTexto(op.nombre_cliente || 'Operación general')}
                </td>
                <td class="px-6 py-3 text-center text-xs font-bold text-amber-400 uppercase tracking-wide">${limpiarTexto(op.tipo_transaccion)}</td>
                <td class="px-6 py-3 text-right font-mono font-bold ${montoClass} text-sm">${formatearNumero(op.monto)}</td>
            `;
            tablaOps.appendChild(tr);
        });
    }

    // --- FILTRO LOCAL ---
    if (inputFiltroOps) {
        inputFiltroOps.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase().trim();
            if (!term) {
                renderizarOperaciones(operacionesData);
                return;
            }

            const filtrados = operacionesData.filter(op => 
                String(op.id).includes(term) ||
                (op.nombre_cliente && op.nombre_cliente.toLowerCase().includes(term)) ||
                (op.tipo_transaccion && op.tipo_transaccion.toLowerCase().includes(term))
            );
            renderizarOperaciones(filtrados);
        });
    }

    cargarCuenta();
});