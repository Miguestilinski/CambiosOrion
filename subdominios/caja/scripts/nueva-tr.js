import { initCajaHeader } from './header.js';

let usuarioSesion = null;
let clienteSeleccionado = null;

document.addEventListener('DOMContentLoaded', async() => {

    await initCajaHeader('index');

    cargarDivisas();

    // 2. Referencias del DOM
    const clienteInput = document.getElementById("cliente");
    const resultadoClientes = document.getElementById("resultado-clientes");
    const montoInput = document.getElementById("monto");
    const tasaInput = document.getElementById("tasa");
    const totalInput = document.getElementById("total");
    const btnCrear = document.getElementById("crear-transaccion");
    const form = document.getElementById("form-nueva-tr");

    // --- LÓGICA DE BÚSQUEDA DE CLIENTES ---
    if (clienteInput && resultadoClientes) {
        clienteInput.addEventListener("input", async (e) => {
            const query = e.target.value.trim();
            
            // Limpiar selección si el usuario edita el texto
            if (clienteSeleccionado && clienteSeleccionado.nombre !== query) {
                clienteSeleccionado = null;
            }

            if (query.length < 2) {
                resultadoClientes.classList.add("hidden");
                resultadoClientes.innerHTML = "";
                return;
            }

            try {
                const res = await fetch(`https://cambiosorion.cl/data/nueva-tr.php?buscar_cliente=${encodeURIComponent(query)}`);
                const clientes = await res.json();
                
                resultadoClientes.innerHTML = "";
                
                if (clientes.length > 0) {
                    clientes.forEach((cliente) => {
                        const li = document.createElement("li");
                        li.textContent = `${cliente.nombre} (${cliente.rut || 'S/R'})`;
                        li.className = "px-4 py-2 hover:bg-cyan-50 cursor-pointer text-sm text-gray-700 border-b border-gray-100 last:border-0";
                        
                        li.addEventListener("click", () => {
                            clienteInput.value = cliente.nombre;
                            clienteSeleccionado = cliente;
                            resultadoClientes.classList.add("hidden");
                        });
                        resultadoClientes.appendChild(li);
                    });
                    resultadoClientes.classList.remove("hidden");
                } else {
                    resultadoClientes.classList.add("hidden");
                }
            } catch (error) {
                console.error("Error buscando clientes:", error);
            }
        });

        // Ocultar resultados al hacer clic fuera
        document.addEventListener("click", (e) => {
            if (!clienteInput.contains(e.target) && !resultadoClientes.contains(e.target)) {
                resultadoClientes.classList.add("hidden");
            }
        });
    }

    // --- CÁLCULOS MATEMÁTICOS ---
    function calcularTotal() {
        const monto = parseFloat(montoInput.value) || 0;
        const tasa = parseFloat(tasaInput.value) || 0;
        const total = monto * tasa;
        totalInput.value = Math.round(total); // Redondear a entero (CLP suele no usar decimales)
    }

    if (montoInput) montoInput.addEventListener("input", calcularTotal);
    if (tasaInput) tasaInput.addEventListener("input", calcularTotal);

    // --- ENVÍO DEL FORMULARIO ---
    if (btnCrear) {
        btnCrear.addEventListener("click", async () => {
            if (!validarFormulario()) return;

            const payload = {
                tipo_transaccion: document.getElementById("tipo_transaccion").value,
                cliente_id: clienteSeleccionado ? clienteSeleccionado.id : null,
                nombre_cliente_manual: !clienteSeleccionado ? clienteInput.value : null, // Por si es cliente nuevo/casual
                divisa: document.getElementById("divisa").value,
                monto: document.getElementById("monto").value,
                tasa_cambio: document.getElementById("tasa").value,
                total: document.getElementById("total").value,
                forma_pago: document.getElementById("forma_pago").value,
                tipo_documento: document.getElementById("tipo_documento").value,
                numero_documento: document.getElementById("numero_documento").value,
                caja_id: usuarioSesion.caja_id,
                usuario_id: usuarioSesion.equipo_id
            };

            // Deshabilitar botón
            const originalText = btnCrear.innerHTML;
            btnCrear.disabled = true;
            btnCrear.innerHTML = `<svg class="animate-spin h-5 w-5 mr-2 inline" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Procesando...`;

            try {
                const res = await fetch("https://cambiosorion.cl/data/nueva-tr.php", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });

                const data = await res.json();

                if (data.exito) {
                    mostrarModalExitoso();
                } else {
                    mostrarModalError({ titulo: "Error", mensaje: data.mensaje || "No se pudo crear la transacción." });
                }
            } catch (error) {
                console.error(error);
                mostrarModalError({ titulo: "Error de conexión", mensaje: "Ocurrió un problema al conectar con el servidor." });
            } finally {
                btnCrear.disabled = false;
                btnCrear.innerHTML = originalText;
            }
        });
    }

    function validarFormulario() {
        if (!usuarioSesion || !usuarioSesion.caja_id) {
            mostrarModalError({ titulo: "Error de Sesión", mensaje: "No tienes una caja asignada para operar." });
            return false;
        }
        if (!montoInput.value || parseFloat(montoInput.value) <= 0) {
            mostrarModalError({ titulo: "Datos incompletos", mensaje: "Ingresa un monto válido." });
            return false;
        }
        if (!tasaInput.value || parseFloat(tasaInput.value) <= 0) {
            mostrarModalError({ titulo: "Datos incompletos", mensaje: "Ingresa una tasa de cambio válida." });
            return false;
        }
        if (clienteInput.value.trim() === "") {
            mostrarModalError({ titulo: "Datos incompletos", mensaje: "Debes ingresar un cliente." });
            return false;
        }
        return true;
    }
});

// --- FUNCIONES ESTRUCTURALES (Sidebar/Header) ---

function cargarSidebar() {
    fetch('sidebar.html')
        .then(response => response.text())
        .then(html => {
            const container = document.getElementById('sidebar-container');
            if (container) {
                container.innerHTML = html;
                activarLinkSidebar('nueva-tr');
            }
        })
        .catch(err => console.error("Error cargando sidebar", err));
}

function activarLinkSidebar(pagina) {
    setTimeout(() => {
        const links = document.querySelectorAll('#sidebar-nav a');
        links.forEach(link => {
            link.classList.remove('bg-cyan-50', 'text-cyan-800', 'border-l-4', 'border-cyan-600', 'shadow-sm', 'font-bold');
            link.classList.add('text-gray-600', 'border-transparent');
            
            const icon = link.querySelector('svg');
            if(icon) { icon.classList.remove('text-cyan-600'); icon.classList.add('text-gray-400'); }

            if (link.dataset.page === pagina) {
                link.classList.remove('text-gray-600', 'border-transparent');
                link.classList.add('bg-cyan-50', 'text-cyan-800', 'border-l-4', 'border-cyan-600', 'shadow-sm', 'font-bold');
                if(icon) { icon.classList.remove('text-gray-400'); icon.classList.add('text-cyan-600'); }
            }
        });
    }, 100);
}

async function getSession() {
    try {
        const res = await fetch("https://cambiosorion.cl/data/session_status_admin.php", { credentials: "include" });
        if (!res.ok) throw new Error("Error sesión");
        const data = await res.json();
        
        if (!data.isAuthenticated || !data.equipo_id) {
            window.location.href = 'https://admin.cambiosorion.cl/login';
            return;
        }

        usuarioSesion = data;

        // Header Info
        const headerName = document.getElementById('header-user-name');
        const headerEmail = document.getElementById('dropdown-user-email');
        if (headerName) headerName.textContent = data.nombre ? data.nombre.split(' ')[0] : 'Admin';
        if (headerEmail) headerEmail.textContent = data.correo;

        // Validar Caja
        if (!usuarioSesion.caja_id) {
            mostrarModalError({ 
                titulo: "Sin Caja Asignada", 
                mensaje: "Tu usuario no tiene una caja abierta o asignada. No podrás realizar transacciones.",
                textoConfirmar: "Volver al Inicio",
                onConfirmar: () => window.location.href = "https://admin.cambiosorion.cl/"
            });
        }

    } catch (error) {
        console.error("Error sesión:", error);
    }
}

// --- FUNCIONES DE CARGA DE DATOS ---

async function cargarDivisas() {
    try {
        // Ajusta la URL a tu endpoint real de divisas
        const res = await fetch("https://cambiosorion.cl/data/divisas_api.php"); 
        const divisas = await res.json();
        
        const selectDivisa = document.getElementById("divisa");
        if (selectDivisa) {
            selectDivisa.innerHTML = ""; // Limpiar
            divisas.forEach(d => {
                const option = document.createElement("option");
                option.value = d.nombre; // o d.id
                option.textContent = d.nombre;
                selectDivisa.appendChild(option);
            });
        }
    } catch (error) {
        console.error("Error cargando divisas:", error);
    }
}

// --- MODALES ---

function mostrarModalError({ titulo, mensaje, textoConfirmar = "Aceptar", textoCancelar = null, onConfirmar, onCancelar }) {
  const modal = document.getElementById("modal-error");
  const tituloElem = document.getElementById("modal-error-titulo");
  const mensajeElem = document.getElementById("modal-error-mensaje");
  const btnConfirmar = document.getElementById("modal-error-confirmar");
  const btnCancelar = document.getElementById("modal-error-cancelar");

  if(tituloElem) tituloElem.textContent = titulo;
  if(mensajeElem) mensajeElem.textContent = mensaje;
  if(btnConfirmar) btnConfirmar.textContent = textoConfirmar;

  if (textoCancelar && btnCancelar) {
    btnCancelar.classList.remove("hidden");
    btnCancelar.textContent = textoCancelar;
  } else if(btnCancelar) {
    btnCancelar.classList.add("hidden");
  }

  if(modal) modal.classList.remove("hidden");

  if(btnConfirmar) {
      btnConfirmar.onclick = () => {
        modal.classList.add("hidden");
        if (onConfirmar) onConfirmar();
      };
  }

  if(btnCancelar) {
      btnCancelar.onclick = () => {
        modal.classList.add("hidden");
        if (onCancelar) onCancelar();
      };
  }
}

function mostrarModalExitoso() {
  const modal = document.getElementById("modal-exitoso");
  if(modal) modal.classList.remove("hidden");

  const btnNueva = document.getElementById("nueva-transaccion"); // Botón "Nueva Transacción" dentro del modal
  if (btnNueva) {
      btnNueva.onclick = () => {
        modal.classList.add("hidden");
        document.getElementById("form-nueva-tr").reset();
        document.getElementById("resultado-clientes").classList.add("hidden");
        clienteSeleccionado = null;
      };
  }

  const btnVolver = document.getElementById("volver");
  if(btnVolver) {
      btnVolver.onclick = () => {
        window.location.href = "transacciones";
      };
  }
}