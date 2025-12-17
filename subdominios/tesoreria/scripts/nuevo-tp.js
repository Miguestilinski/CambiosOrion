document.addEventListener("DOMContentLoaded", () => {
    // Inputs
    const form = document.getElementById("form-nuevo-traspaso");
    const origenSelect = document.getElementById("origen");
    const destinoSelect = document.getElementById("destino");
    const divisaInput = document.getElementById("divisa-input");
    const divisaSugerencias = document.getElementById("divisa-sugerencias");
    const montoInput = document.getElementById("monto");
    const observacionesInput = document.getElementById("observaciones");
    const btnSubmit = document.querySelector("button[type='submit']");

    let usuarioSesionId = null;
    let usuarioCajaId = null;

    // --- 1. Inicialización y Sesión ---
    if(btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.classList.add("opacity-50", "cursor-not-allowed");
    }

    async function init() {
        try {
            // Obtener sesión
            const res = await fetch("https://cambiosorion.cl/data/session_status.php", { credentials: 'include' });
            const session = await res.json();

            if (session.isAuthenticated && session.equipo_id) {
                usuarioSesionId = session.equipo_id;
                usuarioCajaId = session.caja_id; // ID de la caja del usuario logueado
                
                if(btnSubmit) {
                    btnSubmit.disabled = false;
                    btnSubmit.classList.remove("opacity-50", "cursor-not-allowed");
                }
                
                // Cargar datos
                await cargarCajas();
            } else {
                mostrarAlerta("No hay sesión activa. Inicie sesión para continuar.");
            }
        } catch (error) {
            console.error(error);
            mostrarAlerta("Error de conexión al verificar sesión.");
        }
    }
    init();

    // --- 2. Cargar Cajas (Origen y Destino) ---
    async function cargarCajas() {
        try {
            const res = await fetch("https://cambiosorion.cl/data/nuevo-tp.php?buscar_cajas=1");
            const cajas = await res.json();

            origenSelect.innerHTML = '<option value="">Seleccione Origen</option>';
            destinoSelect.innerHTML = '<option value="">Seleccione Destino</option>';

            cajas.forEach(c => {
                // Llenar Origen
                const optO = document.createElement("option");
                optO.value = c.id;
                optO.textContent = c.nombre;
                origenSelect.appendChild(optO);

                // Llenar Destino
                const optD = document.createElement("option");
                optD.value = c.id;
                optD.textContent = c.nombre;
                destinoSelect.appendChild(optD);
            });

            // Auto-seleccionar caja de origen si el usuario tiene una asignada
            if (usuarioCajaId) {
                origenSelect.value = usuarioCajaId;
            } else if (cajas.length > 0) {
                // Si es admin sin caja fija, selecciona Tesorería por defecto
                origenSelect.selectedIndex = 1; 
            }

        } catch (error) {
            console.error("Error cargando cajas:", error);
        }
    }

    // --- 3. Buscador de Divisas ---
    divisaInput.addEventListener("input", async (e) => {
        const query = e.target.value.trim();
        if (query.length < 1) {
            divisaSugerencias.classList.add("hidden");
            return;
        }

        try {
            const res = await fetch(`https://cambiosorion.cl/data/nuevo-tp.php?buscar_divisa=${encodeURIComponent(query)}`);
            const divisas = await res.json();

            divisaSugerencias.innerHTML = "";
            if (divisas.length === 0) {
                divisaSugerencias.innerHTML = "<li class='p-3 text-sm text-gray-500'>No hay resultados</li>";
            } else {
                divisas.forEach(d => {
                    const li = document.createElement("li");
                    li.className = "p-2 hover:bg-gray-100 cursor-pointer text-sm text-gray-800 flex items-center gap-3 border-b border-gray-100";
                    
                    let iconHtml = d.icono ? `<img src="${d.icono}" class="w-6 h-6 object-contain rounded-full">` : `<div class="w-6 h-6 rounded-full bg-gray-200"></div>`;
                    
                    li.innerHTML = `${iconHtml} <span class="font-medium">${d.nombre}</span>`;
                    
                    li.addEventListener("click", () => {
                        divisaInput.value = d.nombre;
                        divisaInput.dataset.id = d.id;
                        divisaSugerencias.classList.add("hidden");
                    });
                    divisaSugerencias.appendChild(li);
                });
            }
            divisaSugerencias.classList.remove("hidden");
        } catch (e) { console.error(e); }
    });

    // Formato de Monto (Miles)
    montoInput.addEventListener('input', (e) => {
        let val = e.target.value.replace(/\D/g, '');
        if (val) e.target.value = new Intl.NumberFormat('es-CL').format(parseInt(val));
    });

    // Cerrar sugerencias al hacer clic fuera
    document.addEventListener("click", (e) => {
        if (!divisaInput.contains(e.target) && !divisaSugerencias.contains(e.target)) {
            divisaSugerencias.classList.add("hidden");
        }
    });

    // --- 4. Enviar Formulario ---
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        if (!usuarioSesionId) return mostrarAlerta("Sesión no válida.");

        const origenId = origenSelect.value;
        const destinoId = destinoSelect.value;
        const divisaId = divisaInput.dataset.id;
        const montoRaw = parseFloat(montoInput.value.replace(/\./g, '').replace(/,/g, '.'));

        // Validaciones
        if (!origenId) return mostrarAlerta("Seleccione la caja de origen.");
        if (!destinoId) return mostrarAlerta("Seleccione la caja de destino.");
        if (origenId === destinoId) return mostrarAlerta("El origen y el destino no pueden ser la misma caja.");
        if (!divisaId) return mostrarAlerta("Seleccione una divisa válida de la lista.");
        if (isNaN(montoRaw) || montoRaw <= 0) return mostrarAlerta("Ingrese un monto válido mayor a 0.");

        const payload = {
            origen_id: origenId,
            destino_id: destinoId,
            divisa_id: divisaId,
            monto: montoRaw,
            observaciones: observacionesInput.value,
            usuario_id: usuarioSesionId
        };

        try {
            const res = await fetch("https://cambiosorion.cl/data/nuevo-tp.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (data.success) {
                document.getElementById("modal-exitoso").classList.remove("hidden");
                form.reset();
                divisaInput.dataset.id = "";
            } else {
                mostrarAlerta(data.error || "Error al procesar el traspaso.");
            }
        } catch (error) {
            mostrarAlerta("Error de conexión con el servidor.");
        }
    });

    function mostrarAlerta(msg) {
        const modal = document.getElementById("modal-alerta");
        document.getElementById("modal-mensaje").textContent = msg;
        modal.classList.remove("hidden");
        document.getElementById("cerrar-modal").onclick = () => modal.classList.add("hidden");
    }
});