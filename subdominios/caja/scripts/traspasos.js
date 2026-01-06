let usuarioSesion = null;
let caja_id = null;
let modoCompletarPendientes = false;
let totalesPorDivisa = {};

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Inicialización Estructural
    getSession();
    cargarSidebar();

    // 2. Referencias del DOM
    const nuevoTraspasoBtn = document.getElementById('nuevo-tp');
    const completarPendientesBtn = document.getElementById('activar-completado');
    const confirmarCompletadoBtn = document.getElementById('confirmar-completado');
    const tabla = document.getElementById('tabla-transacciones');
    const resumenTotales = document.getElementById('resumen-totales'); // Contenedor general de resumen
    const listaResumenGlobal = document.getElementById('lista-resumen-global'); // UL para totales generales
    const contenedorAcciones = document.getElementById('resumen-completado'); // Panel inferior de acciones
    const listaResumenSeleccion = document.getElementById('lista-resumen'); // UL para selección actual

    // 3. Filtros
    const filtros = {
        numero: document.getElementById("numero"),
        fecha: document.getElementById("fecha"),
        transaccion: document.getElementById("transaccion"),
        origen: document.getElementById("origen"),
        destino: document.getElementById("destino"),
        divisa: document.getElementById("divisa"),
        monto: document.getElementById("monto"),
        estado: document.getElementById("estado"),
        mostrar: document.getElementById("mostrar-registros"),
        buscar: document.getElementById("buscar"),
        caja_id: { value: "" } // Se llena dinámicamente con la sesión
    };

    // --- FUNCIONES DE ESTRUCTURA (Sidebar y Header) ---
    function cargarSidebar() {
        fetch('sidebar.html')
            .then(response => response.text())
            .then(html => {
                const container = document.getElementById('sidebar-container');
                if (container) {
                    container.innerHTML = html;
                    activarLinkSidebar('traspasos-caja');
                }
            })
            .catch(error => console.error("Error cargando sidebar:", error));
    }

    function activarLinkSidebar(pagina) {
        setTimeout(() => {
            const links = document.querySelectorAll('#sidebar-nav a');
            links.forEach(link => {
                // Resetear estilos
                link.classList.remove('bg-cyan-50', 'text-cyan-800', 'border-l-4', 'border-cyan-600', 'shadow-sm', 'font-bold');
                link.classList.add('text-gray-600', 'border-transparent');
                
                const icon = link.querySelector('svg');
                if(icon) { icon.classList.remove('text-cyan-600'); icon.classList.add('text-gray-400'); }

                // Activar actual
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
            if (!res.ok) throw new Error("No se pudo obtener la sesión.");
            
            const data = await res.json();
            
            if (!data.isAuthenticated || !data.equipo_id) {
                window.location.href = 'https://admin.cambiosorion.cl/login';
                return;
            }

            usuarioSesion = data;
            
            // Poblar Header
            const headerName = document.getElementById('header-user-name');
            const headerEmail = document.getElementById('dropdown-user-email');
            
            if (headerName) headerName.textContent = data.nombre ? data.nombre.split(' ')[0] : 'Admin';
            if (headerEmail) headerEmail.textContent = data.correo;

            // Lógica específica: Asignar ID de caja y cargar datos
            if (usuarioSesion && usuarioSesion.caja_id) {
                filtros.caja_id.value = usuarioSesion.caja_id;
                
                // Si es tesorería (ej: 99) o Admin, mostramos herramientas extra
                if (usuarioSesion.caja_id == 99 || usuarioSesion.rol === 'Admin') { 
                    const accionCompletar = document.getElementById('accion-completar');
                    if(accionCompletar) accionCompletar.classList.remove('hidden');
                }
                
                obtenerTraspasos();
            }

        } catch (error) {
            console.error("Error sesión:", error);
        }
    }

    // --- LÓGICA DE NEGOCIO ---

    if (nuevoTraspasoBtn) {
        nuevoTraspasoBtn.addEventListener('click', () => {
            window.location.href = 'nuevo-traspaso'; 
        });
    }

    // Alternar modo "Completar Pendientes"
    if (completarPendientesBtn) {
        completarPendientesBtn.addEventListener('click', () => {
            modoCompletarPendientes = !modoCompletarPendientes;
            
            if (modoCompletarPendientes) {
                // Activar Modo
                completarPendientesBtn.textContent = "Cancelar Completado";
                completarPendientesBtn.classList.replace("bg-indigo-600", "bg-red-600");
                completarPendientesBtn.classList.replace("hover:bg-indigo-700", "hover:bg-red-700");
                
                filtros.estado.value = "pendiente"; 
                filtros.estado.disabled = true; // Bloquear filtro estado
                
                if(resumenTotales) resumenTotales.classList.remove('hidden');
                if(contenedorAcciones) contenedorAcciones.classList.remove('hidden');
            } else {
                // Desactivar Modo
                completarPendientesBtn.textContent = "Completar Pendientes";
                completarPendientesBtn.classList.replace("bg-red-600", "bg-indigo-600");
                completarPendientesBtn.classList.replace("hover:bg-red-700", "hover:bg-indigo-700");
                
                filtros.estado.value = "";
                filtros.estado.disabled = false;
                
                if(resumenTotales) resumenTotales.classList.add('hidden');
                if(contenedorAcciones) contenedorAcciones.classList.add('hidden');
            }
            obtenerTraspasos();
        });
    }

    function obtenerTraspasos() {
        const params = new URLSearchParams();
        
        for (const [clave, input] of Object.entries(filtros)) {
            if(input && input.value) {
                params.set(clave, input.value);
            }
        }

        fetch(`https://cambiosorion.cl/data/traspasos_caja.php?${params.toString()}`)
            .then(response => response.json())
            .then(data => {
                mostrarResultados(data);
                if (modoCompletarPendientes) {
                    calcularTotales(data);
                }
            })
            .catch(error => console.error('Error al obtener traspasos:', error));
    }

    function mostrarResultados(traspasos) {
        tabla.innerHTML = '';

        if (!traspasos || traspasos.length === 0) {
            tabla.innerHTML = `<tr><td colspan="9" class="text-center py-4 text-gray-500">No se encontraron traspasos.</td></tr>`;
            return;
        }

        traspasos.forEach(trx => {
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-gray-50 border-b border-gray-100 transition';

            // Checkbox condicional
            let checkboxCell = '';
            if (modoCompletarPendientes) {
                checkboxCell = `
                    <td class="px-4 py-3 text-center">
                        <input type="checkbox" class="traspaso-check w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 cursor-pointer" 
                               value="${trx.id}" data-monto="${trx.monto}" data-divisa="${trx.divisa}">
                    </td>`;
            } else {
                checkboxCell = `<td class="px-4 py-3"></td>`;
            }

            // Badges de estado
            let estadoClass = "bg-gray-100 text-gray-600";
            if (trx.estado === 'completado') estadoClass = "bg-green-100 text-green-700";
            if (trx.estado === 'pendiente') estadoClass = "bg-yellow-100 text-yellow-700";
            if (trx.estado === 'anulado') estadoClass = "bg-red-100 text-red-700";

            tr.innerHTML = `
                ${checkboxCell}
                <td class="px-4 py-3 whitespace-nowrap text-xs text-gray-500">${trx.fecha}</td>
                <td class="px-4 py-3 font-mono text-xs font-bold text-gray-700">#${trx.id}</td>
                <td class="px-4 py-3 font-semibold text-gray-700">${trx.tipo_transaccion}</td>
                <td class="px-4 py-3 text-gray-600 text-xs uppercase">${trx.caja_origen}</td>
                <td class="px-4 py-3 text-gray-600 text-xs uppercase">${trx.caja_destino}</td>
                <td class="px-4 py-3 text-center font-bold text-gray-800">${trx.divisa}</td>
                <td class="px-4 py-3 text-right font-mono font-bold text-gray-900">${parseFloat(trx.monto).toLocaleString('es-CL')}</td>
                <td class="px-4 py-3 text-center">
                    <span class="px-2 py-1 rounded text-xs font-bold uppercase ${estadoClass}">${trx.estado}</span>
                </td>
            `;
            tabla.appendChild(tr);
        });

        // Re-asignar listeners a los nuevos checkboxes
        if (modoCompletarPendientes) {
            document.querySelectorAll('.traspaso-check').forEach(chk => {
                chk.addEventListener('change', actualizarResumenSeleccion);
            });
        }
    }

    // Calcula totales de todos los datos visibles (Pendientes)
    function calcularTotales(data) {
        totalesPorDivisa = {};
        
        data.forEach(trx => {
            if (!totalesPorDivisa[trx.divisa]) {
                totalesPorDivisa[trx.divisa] = 0;
            }
            totalesPorDivisa[trx.divisa] += parseFloat(trx.monto);
        });
        
        renderizarResumen();
    }

    // Muestra los totales disponibles en el panel superior
    function renderizarResumen() {
        if (!listaResumenGlobal) return;
        listaResumenGlobal.innerHTML = '';

        for (const [divisa, total] of Object.entries(totalesPorDivisa)) {
            const li = document.createElement('li');
            li.className = "flex justify-between items-center text-sm border-b border-gray-100 last:border-0 py-1";
            li.innerHTML = `<span class="font-bold text-gray-600">${divisa}:</span> <span class="font-mono text-gray-800">${total.toLocaleString('es-CL')}</span>`;
            listaResumenGlobal.appendChild(li);
        }
    }

    // Calcula y muestra lo que el usuario ha seleccionado manualmente
    function actualizarResumenSeleccion() {
        const seleccionados = document.querySelectorAll('.traspaso-check:checked');
        let totalSeleccionado = {};

        seleccionados.forEach(chk => {
            const divisa = chk.dataset.divisa;
            const monto = parseFloat(chk.dataset.monto);
            if (!totalSeleccionado[divisa]) totalSeleccionado[divisa] = 0;
            totalSeleccionado[divisa] += monto;
        });

        if (listaResumenSeleccion) {
            listaResumenSeleccion.innerHTML = '';
            
            if (Object.keys(totalSeleccionado).length === 0) {
                listaResumenSeleccion.innerHTML = '<li class="text-gray-400 text-xs italic text-center py-2">Ninguno seleccionado</li>';
                return;
            }

            for (const [divisa, total] of Object.entries(totalSeleccionado)) {
                const li = document.createElement('li');
                li.className = "flex justify-between text-sm py-1";
                li.innerHTML = `<span class="font-bold text-indigo-700">${divisa}:</span> <span class="font-bold">${total.toLocaleString('es-CL')}</span>`;
                listaResumenSeleccion.appendChild(li);
            }
        }
    }

    // Acción del botón "Confirmar"
    if (confirmarCompletadoBtn) {
        confirmarCompletadoBtn.addEventListener('click', () => {
            const ids = Array.from(document.querySelectorAll('.traspaso-check:checked')).map(cb => cb.value);
            
            if (ids.length === 0) {
                mostrarModalError({ titulo: "Sin selección", mensaje: "Selecciona al menos un traspaso para completar." });
                return;
            }

            // Llamada al backend para actualizar estados
            fetch('https://cambiosorion.cl/data/completar_traspasos.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: ids })
            })
            .then(res => res.json())
            .then(data => {
                if (data.exito) {
                    mostrarModalExitoso();
                } else {
                    mostrarModalError({ titulo: "Error", mensaje: data.mensaje || "No se pudieron actualizar los traspasos." });
                }
            })
            .catch(err => {
                console.error(err);
                mostrarModalError({ titulo: "Error de red", mensaje: "No se pudo conectar con el servidor." });
            });
        });
    }

    // Listeners de filtros
    Object.entries(filtros).forEach(([clave, input]) => {
        if (clave !== "caja_id" && input) {
            input.addEventListener('input', obtenerTraspasos);
            input.addEventListener('change', obtenerTraspasos);
        }
    });
});

// --- MODALES ---

function mostrarModalError({ titulo, mensaje, textoConfirmar = "Aceptar", textoCancelar = null, onConfirmar, onCancelar }) {
  const modal = document.getElementById("modal-error");
  if(!modal) return;
  
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

  modal.classList.remove("hidden");

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
  if(!modal) return;
  
  modal.classList.remove("hidden");

  const btnVolver = document.getElementById("volver");
  if(btnVolver) {
      btnVolver.onclick = () => {
        modal.classList.add("hidden");
        location.reload();
      };
  }
}