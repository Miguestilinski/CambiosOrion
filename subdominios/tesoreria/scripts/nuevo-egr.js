import { initSystem } from './index.js';

document.addEventListener("DOMContentLoaded", async () => {
    // 1. Init System
    const sessionData = await initSystem('egresos'); 
    if (!sessionData || !sessionData.isAuthenticated) return;
    const usuarioSesionId = sessionData.equipo_id || sessionData.id;

    // --- REFERENCIAS DOM ---
    const form = document.getElementById("form-nuevo-egreso");
    
    // Configuración (Izquierda)
    const cajaSelect = document.getElementById("caja");
    const clienteInput = document.getElementById("cliente");
    const clienteIdInput = document.getElementById("cliente-id");
    const listaClientes = document.getElementById("lista-clientes");
    
    // Toggle Botones
    const btnEfectivo = document.getElementById("btn-efectivo");
    const btnCuenta = document.getElementById("btn-cuenta");
    const tipoTransaccionInput = document.getElementById("tipo-transaccion"); // hidden
    const contenedorCuenta = document.getElementById("contenedor-cuenta");
    const buscarCuentaInput = document.getElementById("buscar-cuenta");
    const cuentaIdInput = document.getElementById("cuenta-id");
    const listaCuentas = document.getElementById("lista-cuentas");

    // Detalle (Derecha)
    const divisaTrigger = document.getElementById("divisa-trigger");
    const divisaIconSelected = document.getElementById("divisa-icon-selected");
    const divisaTextSelected = document.getElementById("divisa-text-selected");
    const listaDivisas = document.getElementById("lista-divisas");
    const divisaIdInput = document.getElementById("divisa-id");

    const montoInput = document.getElementById("monto");
    const obsInput = document.getElementById("observaciones");
    const limpiarBtn = document.getElementById("limpiar");

    // Cache
    let clientesCache = [];
    let divisasCache = [];
    let cuentasCache = [];

    // --- INICIALIZACIÓN ---
    async function cargarDatos() {
        try {
            // 1. Cajas (Tesorería primero)
            const resCajas = await fetch("https://cambiosorion.cl/data/nuevo-egr.php?buscar_cajas=1");
            const cajas = await resCajas.json();
            cajaSelect.innerHTML = '<option value="">Seleccione Caja</option>';
            cajas.forEach(c => {
                const opt = document.createElement("option");
                opt.value = c.id;
                opt.textContent = c.nombre;
                cajaSelect.appendChild(opt);
            });
            // Default
            if(sessionData.caja_id && sessionData.caja_id != 0) cajaSelect.value = sessionData.caja_id;
            else if(cajas.length > 0) cajaSelect.value = cajas[0].id;

            // 2. Divisas
            const resDiv = await fetch("https://cambiosorion.cl/data/nuevo-egr.php?buscar_divisas=1");
            divisasCache = await resDiv.json();
            renderizarDropdownDivisas(divisasCache);
            seleccionarDivisaPorDefecto();

            // 3. Clientes (Cacheamos los primeros o buscamos dinamicamente)
            // Para clientes, mejor buscar dinámicamente si son muchos, pero cargaremos una base pequeña si existe.
            // En este ejemplo, usaremos búsqueda en tiempo real mejor simulada con el input.

            // 4. Cuentas
            const resCuentas = await fetch("https://cambiosorion.cl/data/nuevo-egr.php?buscar_cuentas=1");
            const dataCuentas = await resCuentas.json();
            
            // VALIDACIÓN: Asegurarse de que sea un array antes de asignar
            if (Array.isArray(dataCuentas)) {
                cuentasCache = dataCuentas;
            } else {
                console.warn("Error cargando cuentas:", dataCuentas);
                cuentasCache = []; // Array vacío para evitar el crash
            }

        } catch (e) { console.error("Error cargando datos", e); }
    }
    cargarDatos();

    // --- LOGICA TOGGLE (Efectivo/Cuenta) ---
    // Usamos Rojo para Efectivo (Egreso directo) y Gris/Rojo para Cuenta
    function setTipoTransaccion(tipo) {
        tipoTransaccionInput.value = tipo;
        if (tipo === 'efectivo') {
            btnEfectivo.className = "py-2.5 px-4 rounded-lg text-sm font-bold transition-all duration-200 bg-red-600 text-white shadow-lg";
            btnCuenta.className = "py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 text-slate-400 hover:text-white hover:bg-white/5";
            contenedorCuenta.classList.add("hidden");
            buscarCuentaInput.value = "";
            cuentaIdInput.value = "";
        } else {
            btnCuenta.className = "py-2.5 px-4 rounded-lg text-sm font-bold transition-all duration-200 bg-red-600 text-white shadow-lg";
            btnEfectivo.className = "py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 text-slate-400 hover:text-white hover:bg-white/5";
            contenedorCuenta.classList.remove("hidden");
        }
    }
    btnEfectivo.addEventListener('click', () => setTipoTransaccion('efectivo'));
    btnCuenta.addEventListener('click', () => setTipoTransaccion('cuenta'));

    // --- BÚSQUEDA CLIENTES ---
    let timeoutBusqueda;
    clienteInput.addEventListener('input', () => {
        clearTimeout(timeoutBusqueda);
        const val = clienteInput.value.trim();
        listaClientes.innerHTML = '';
        if(val.length < 2) { listaClientes.classList.add('hidden'); return; }

        timeoutBusqueda = setTimeout(async () => {
            try {
                const res = await fetch(`https://cambiosorion.cl/data/nuevo-egr.php?buscar_clientes=${encodeURIComponent(val)}`);
                const clientes = await res.json();
                
                listaClientes.innerHTML = '';
                if(clientes.length > 0) {
                    listaClientes.classList.remove('hidden');
                    clientes.forEach(c => {
                        const div = document.createElement('div');
                        div.className = 'dropdown-item flex-col items-start';
                        div.innerHTML = `
                            <span class="font-bold text-white text-xs">${c.razon_social}</span>
                            <span class="text-[10px] text-slate-400 font-mono">${c.rut}</span>
                        `;
                        div.onclick = () => {
                            clienteInput.value = c.razon_social;
                            clienteIdInput.value = c.id;
                            listaClientes.classList.add('hidden');
                        };
                        listaClientes.appendChild(div);
                    });
                } else {
                    listaClientes.classList.add('hidden');
                }
            } catch(e) { console.error(e); }
        }, 300);
    });

    // --- DROPDOWN DIVISAS ---
    function renderizarDropdownDivisas(lista) {
        listaDivisas.innerHTML = '';
        const searchContainer = document.createElement('div');
        searchContainer.className = "p-2 sticky top-0 bg-slate-900 border-b border-slate-700";
        const searchInput = document.createElement('input');
        searchInput.type = "text";
        searchInput.placeholder = "Filtrar...";
        searchInput.className = "w-full bg-slate-800 text-xs text-white rounded p-1.5 border border-slate-600 focus:border-amber-500 outline-none";
        
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const items = listaDivisas.querySelectorAll('.divisa-item');
            items.forEach(item => {
                const txt = item.textContent.toLowerCase();
                item.style.display = txt.includes(term) ? 'flex' : 'none';
            });
        });
        
        searchContainer.appendChild(searchInput);
        listaDivisas.appendChild(searchContainer);

        lista.forEach(d => {
            const item = document.createElement('div');
            item.className = "dropdown-item divisa-item group";
            item.innerHTML = `
                <img src="${d.icono || 'https://cambiosorion.cl/orionapp/icons/flag_placeholder.png'}" class="w-5 h-5 rounded-full object-cover mr-3 border border-slate-600">
                <span class="flex-1 font-medium group-hover:text-white">${d.nombre}</span>
                <span class="text-xs font-mono text-slate-500 group-hover:text-amber-400">${d.codigo}</span>
            `;
            item.onclick = () => seleccionarDivisa(d);
            listaDivisas.appendChild(item);
        });
    }

    function seleccionarDivisa(d) {
        divisaIdInput.value = d.id;
        divisaTextSelected.textContent = `${d.nombre} (${d.codigo})`;
        divisaTextSelected.className = "font-bold text-white";
        divisaIconSelected.src = d.icono || '';
        divisaIconSelected.classList.remove('hidden');
        listaDivisas.classList.add('hidden');
    }

    function seleccionarDivisaPorDefecto() {
        const clp = divisasCache.find(d => d.codigo === 'CLP');
        if(clp) seleccionarDivisa(clp);
    }

    divisaTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        listaDivisas.classList.toggle('hidden');
        if(!listaDivisas.classList.contains('hidden')) {
            const input = listaDivisas.querySelector('input');
            if(input) input.focus();
        }
    });

    // --- AUTOCOMPLETE CUENTAS ---
    buscarCuentaInput.addEventListener('input', () => {
        const val = buscarCuentaInput.value.toLowerCase();
        listaCuentas.innerHTML = '';
        if(!val) { listaCuentas.classList.add('hidden'); return; }

        const filtrados = cuentasCache.filter(c => 
            c.nombre.toLowerCase().includes(val) || 
            (c.cliente && c.cliente.toLowerCase().includes(val))
        );

        if(filtrados.length > 0) {
            listaCuentas.classList.remove('hidden');
            filtrados.forEach(c => {
                const div = document.createElement('div');
                div.className = 'dropdown-item flex-col items-start';
                div.innerHTML = `
                    <span class="font-bold text-white text-xs">${c.nombre}</span>
                    <span class="text-[10px] text-slate-400">${c.cliente || 'Interna'} - ${c.divisa}</span>
                `;
                div.onclick = () => {
                    buscarCuentaInput.value = c.nombre;
                    cuentaIdInput.value = c.id;
                    listaCuentas.classList.add('hidden');
                };
                listaCuentas.appendChild(div);
            });
        } else { listaCuentas.classList.add('hidden'); }
    });

    // Cierres Globales
    document.addEventListener('click', (e) => {
        if (!divisaTrigger.contains(e.target) && !listaDivisas.contains(e.target)) listaDivisas.classList.add('hidden');
        if (!clienteInput.contains(e.target)) listaClientes.classList.add('hidden');
        if (!buscarCuentaInput.contains(e.target)) listaCuentas.classList.add('hidden');
    });

    // --- LIMPIAR ---
    limpiarBtn.addEventListener('click', () => {
        form.reset();
        setTipoTransaccion('efectivo');
        clienteIdInput.value = "";
        cuentaIdInput.value = "";
        divisaIdInput.value = "";
        divisaIconSelected.classList.add('hidden');
        divisaTextSelected.textContent = "Seleccione Divisa...";
        seleccionarDivisaPorDefecto();
    });

    // --- SUBMIT ---
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const tipoTx = tipoTransaccionInput.value;
        const monto = parseFloat(montoInput.value);

        if(!cajaSelect.value) return mostrarModal({ tipo: 'error', titulo: "Falta Caja", mensaje: "Seleccione caja de origen." });
        if(!clienteIdInput.value) return mostrarModal({ tipo: 'error', titulo: "Falta Cliente", mensaje: "Busque y seleccione un cliente." });
        if(!divisaIdInput.value) return mostrarModal({ tipo: 'error', titulo: "Falta Divisa", mensaje: "Seleccione una divisa." });
        if(isNaN(monto) || monto <= 0) return mostrarModal({ tipo: 'error', titulo: "Monto Inválido", mensaje: "Ingrese un monto mayor a 0." });
        
        if(tipoTx === 'cuenta' && !cuentaIdInput.value) {
            return mostrarModal({ tipo: 'error', titulo: "Falta Cuenta", mensaje: "Seleccione una cuenta contable." });
        }

        const payload = {
            caja_id: cajaSelect.value,
            cliente_id: clienteIdInput.value,
            divisa_id: divisaIdInput.value,
            monto: monto,
            observaciones: obsInput.value.trim(),
            usuario_id: usuarioSesionId,
            es_cuenta: (tipoTx === 'cuenta'),
            cuenta_id: (tipoTx === 'cuenta' ? cuentaIdInput.value : null)
        };

        try {
            const res = await fetch("https://cambiosorion.cl/data/nuevo-egr.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (data.success) {
                mostrarModal({ 
                    tipo: 'exito', 
                    titulo: "Egreso Registrado", 
                    mensaje: "Operación realizada correctamente.", 
                    onConfirmar: () => location.reload() 
                });
            } else {
                mostrarModal({ tipo: 'error', titulo: "Error", mensaje: data.error || "Error al procesar." });
            }
        } catch(err) {
            mostrarModal({ tipo: 'error', titulo: "Error Conexión", mensaje: "Fallo de comunicación." });
        }
    });

    function mostrarModal({ tipo = 'info', titulo, mensaje, onConfirmar }) {
        const modal = document.getElementById("modal-generico");
        const iconoDiv = document.getElementById("modal-generico-icono");
        const btnConfirmar = document.getElementById("modal-generico-confirmar");

        const iconos = {
            'exito': `<div class="p-3 rounded-full bg-green-900/30 border border-green-500/30"><svg class="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg></div>`,
            'error': `<div class="p-3 rounded-full bg-red-900/30 border border-red-500/30"><svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></div>`
        };

        iconoDiv.innerHTML = iconos[tipo] || '';
        document.getElementById("modal-generico-titulo").textContent = titulo;
        document.getElementById("modal-generico-mensaje").textContent = mensaje;
        
        modal.classList.remove("hidden");
        const newBtn = btnConfirmar.cloneNode(true);
        btnConfirmar.parentNode.replaceChild(newBtn, btnConfirmar);
        newBtn.onclick = () => { modal.classList.add("hidden"); if(onConfirmar) onConfirmar(); };
    }
});