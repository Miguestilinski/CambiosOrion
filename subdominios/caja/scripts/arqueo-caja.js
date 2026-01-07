let caja_id = null;
let equipo_id = null;
let usuarioSesion = null;
let divisasBase = [];

document.addEventListener("DOMContentLoaded", function() {
    getSession();
    cargarSidebar();
    
    // Botón Guardar Parcial Manual
    const btnParcial = document.getElementById("guardar-parcial");
    if (btnParcial) {
        btnParcial.addEventListener("click", () => {
            guardarParcialLocal();
            // Feedback visual temporal en el botón
            const originalText = btnParcial.innerHTML;
            btnParcial.innerHTML = `<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> Guardado`;
            setTimeout(() => { btnParcial.innerHTML = originalText; }, 2000);
        });
    }
});

// --- SIDEBAR & HEADER ---
function cargarSidebar() {
    fetch('sidebar.html')
        .then(response => response.text())
        .then(html => {
            const container = document.getElementById('sidebar-container');
            if (container) {
                container.innerHTML = html;
                activarLinkSidebar('arqueo-caja');
            }
        });
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

// --- 1. OBTENER SESIÓN (Corregido a session_status_caja.php) ---
async function getSession() {
    try {
        // CAMBIO: Usamos el endpoint correcto para caja
        const res = await fetch("https://cambiosorion.cl/data/session_status_caja.php", { credentials: "include" });
        if (!res.ok) throw new Error("No se pudo obtener la sesión.");

        const data = await res.json();
        
        // Validación básica de sesión
        if (!data.isAuthenticated || !data.caja_id) {
            window.location.href = 'https://admin.cambiosorion.cl/login';
            return;
        }

        usuarioSesion = data;
        caja_id = usuarioSesion.caja_id;
        equipo_id = usuarioSesion.equipo_id || usuarioSesion.usuario_id; // Ajustar según lo que devuelva tu PHP

        const headerName = document.getElementById('header-user-name');
        const headerEmail = document.getElementById('dropdown-user-email');
        if (headerName) headerName.textContent = data.nombre ? data.nombre.split(' ')[0] : 'Cajero';
        if (headerEmail) headerEmail.textContent = data.correo || '';

        // Una vez tenemos el ID, cargamos los datos
        await cargarDatosArqueo(caja_id);

    } catch (error) {
        console.error("Error al obtener la sesión:", error);
    }
}

// --- 2. CARGAR DATOS (Desde arqueo-caja.php) ---
async function cargarDatosArqueo(cajaId) {
    const tablaCuerpo = document.getElementById("tabla-arqueo-body");
    if (tablaCuerpo) {
        tablaCuerpo.innerHTML = '<tr><td colspan="5" class="text-center py-10"><div class="animate-spin h-8 w-8 border-4 border-cyan-500 rounded-full border-t-transparent mx-auto"></div></td></tr>';
    }

    try {
        // CAMBIO: Llamamos a arqueo-caja.php en lugar de inventario_caja.php
        const res = await fetch(`https://cambiosorion.cl/data/arqueo-caja.php?caja_id=${cajaId}`, {
            credentials: "include"
        });
        
        if (!res.ok) throw new Error("Error al cargar datos de arqueo");
        
        const data = await res.json();
        
        // arqueo-caja.php devuelve un objeto { caja_id: ..., divisas: [...] }
        divisasBase = Array.isArray(data.divisas) ? data.divisas : []; 
        
        renderizarTablaArqueo(divisasBase);

        // Restaurar parcial si existe y es de hoy
        const claveParcial = `arqueo_parcial_caja_${cajaId}`;
        const parcialGuardado = localStorage.getItem(claveParcial);
        if (parcialGuardado) {
            const datos = JSON.parse(parcialGuardado);
            const hoy = new Date().toISOString().split("T")[0];
            if (datos.fecha === hoy) {
                restaurarParcial(datos.divisas);
            } else {
                localStorage.removeItem(claveParcial); // Borrar si es de otro día
            }
        }

    } catch (error) {
        console.error(error);
        if (tablaCuerpo) {
            tablaCuerpo.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-red-500">Error al cargar datos.</td></tr>';
        }
    }
}

function renderizarTablaArqueo(divisas) {
    const tablaCuerpo = document.getElementById("tabla-arqueo-body");
    if (!tablaCuerpo) return;
    tablaCuerpo.innerHTML = "";

    if (divisas.length === 0) {
        tablaCuerpo.innerHTML = '<tr><td colspan="5" class="text-center text-gray-500 py-10 italic">No hay divisas asignadas a esta caja.</td></tr>';
        return;
    }

    divisas.forEach((divisa) => {
        // Mapeo de campos según arqueo-caja.php
        const saldoSistema = parseFloat(divisa.total_sistema) || 0;
        const nombreDivisa = divisa.nombre; // arqueo-caja.php devuelve 'nombre'
        const codigoDivisa = divisa.codigo;
        const icono = divisa.icono || 'https://cambiosorion.cl/orionapp/icons/default.png';
        // Identificador único para el input (usamos nombre o codigo)
        const idDivisa = divisa.id; 

        const tr = document.createElement("tr");
        tr.className = "hover:bg-gray-50 border-b border-gray-100 transition group bg-white";

        tr.innerHTML = `
            <td class="px-6 py-4 flex items-center gap-3">
                <img src="${icono}" class="w-8 h-8 rounded-full border border-gray-200 p-0.5 bg-white shadow-sm object-contain">
                <div class="flex flex-col">
                    <span class="font-bold text-gray-700 text-sm">${nombreDivisa}</span>
                    <span class="text-[10px] text-gray-400 uppercase font-bold">${codigoDivisa}</span>
                </div>
            </td>
            <td class="px-6 py-4 text-right bg-gray-50/50 border-l border-gray-100">
                <span class="font-mono text-gray-600 font-medium text-sm">
                    ${saldoSistema.toLocaleString('es-CL', { minimumFractionDigits: 2 })}
                </span>
                <input type="hidden" class="saldo-sistema" value="${saldoSistema}">
            </td>
            <td class="px-6 py-4 border-l border-gray-100">
                <div class="relative">
                    <input type="number" step="0.01" 
                        class="input-fisico block w-full text-right font-mono font-bold text-gray-800 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition px-3 py-2 bg-white shadow-sm"
                        data-id="${idDivisa}"
                        data-divisa="${nombreDivisa}"
                        placeholder="0.00">
                </div>
            </td>
            <td class="px-6 py-4 text-right border-l border-gray-100">
                <span class="diferencia font-mono font-bold text-gray-400 text-sm">-</span>
            </td>
            <td class="px-6 py-4 text-center">
                <span class="estado-icon flex justify-center">
                    <div class="w-2 h-2 rounded-full bg-gray-300"></div>
                </span>
            </td>
        `;

        tablaCuerpo.appendChild(tr);
    });

    // Listeners para recálculo
    const inputs = document.querySelectorAll(".input-fisico");
    inputs.forEach(input => {
        input.addEventListener("input", () => {
            calcularFila(input);
            guardarParcialLocal();
            verificarAlertasGlobales();
        });
        
        input.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                const inputsArr = Array.from(inputs);
                const nextIndex = inputsArr.indexOf(input) + 1;
                if (nextIndex < inputsArr.length) {
                    inputsArr[nextIndex].focus();
                }
            }
        });
    });
}

function calcularFila(input) {
    const row = input.closest("tr");
    const saldoSistema = parseFloat(row.querySelector(".saldo-sistema").value) || 0;
    
    const valorInput = input.value;
    const saldoFisico = valorInput === "" ? 0 : parseFloat(valorInput);
    
    const diferencia = saldoFisico - saldoSistema;
    const diffElem = row.querySelector(".diferencia");
    const iconElem = row.querySelector(".estado-icon");

    if (valorInput === "") {
        diffElem.textContent = "-";
        diffElem.className = "diferencia font-mono font-bold text-gray-400 text-sm";
        iconElem.innerHTML = `<div class="w-2 h-2 rounded-full bg-gray-300"></div>`;
        input.classList.remove("border-red-500", "bg-red-50", "text-red-900", "focus:ring-red-500", "focus:border-red-500");
        input.classList.remove("border-green-500", "bg-green-50", "text-green-900", "focus:ring-green-500", "focus:border-green-500");
        input.classList.add("border-gray-300");
        return;
    }

    const diffText = (diferencia > 0 ? "+" : "") + diferencia.toLocaleString('es-CL', { minimumFractionDigits: 2 });
    diffElem.textContent = diffText;

    const esCuadrado = Math.abs(diferencia) < 0.001;

    if (esCuadrado) {
        diffElem.className = "diferencia font-mono font-bold text-green-600 text-sm";
        iconElem.innerHTML = `<svg class="w-6 h-6 text-green-500 bg-green-100 rounded-full p-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`;
        
        input.classList.remove("border-gray-300", "border-red-500", "bg-red-50", "text-red-900", "focus:ring-red-500", "focus:border-red-500");
        input.classList.add("border-green-500", "bg-green-50", "text-green-900", "focus:ring-green-500", "focus:border-green-500");
    } else {
        diffElem.className = "diferencia font-mono font-bold text-red-600 text-sm";
        iconElem.innerHTML = `<svg class="w-6 h-6 text-red-500 bg-red-100 rounded-full p-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>`;
        
        input.classList.remove("border-gray-300", "border-green-500", "bg-green-50", "text-green-900", "focus:ring-green-500", "focus:border-green-500");
        input.classList.add("border-red-500", "bg-red-50", "text-red-900", "focus:ring-red-500", "focus:border-red-500");
    }
}

function verificarAlertasGlobales() {
    const alertaDiv = document.getElementById('alerta-diferencia');
    let hayDiferencias = false;
    
    document.querySelectorAll(".input-fisico").forEach(input => {
        if (input.value !== "") {
            const row = input.closest("tr");
            const saldoSistema = parseFloat(row.querySelector(".saldo-sistema").value) || 0;
            const saldoFisico = parseFloat(input.value);
            if (Math.abs(saldoFisico - saldoSistema) > 0.001) {
                hayDiferencias = true;
            }
        }
    });

    if (alertaDiv) {
        if (hayDiferencias) {
            alertaDiv.classList.remove('hidden');
        } else {
            alertaDiv.classList.add('hidden');
        }
    }
}

function restaurarParcial(datosGuardados) {
    const inputs = document.querySelectorAll(".input-fisico");
    inputs.forEach(input => {
        // Buscamos por ID de divisa si está disponible, o por nombre como fallback
        const idDivisa = input.dataset.id;
        const nombreDivisa = input.dataset.divisa;
        
        const dato = datosGuardados.find(d => 
            (d.divisa_id && d.divisa_id == idDivisa) || 
            (d.divisa && d.divisa === nombreDivisa)
        );

        if (dato) {
            input.value = dato.cantidad || dato.total_arqueo; // Compatibilidad con lo que guardamos en LocalStorage
            calcularFila(input);
        }
    });
    verificarAlertasGlobales();
}

function guardarParcialLocal() {
    if (!caja_id) return;
    
    const datos = [];
    document.querySelectorAll(".input-fisico").forEach(input => {
        if (input.value !== "") {
            datos.push({
                divisa_id: input.dataset.id,
                divisa: input.dataset.divisa,
                cantidad: input.value
            });
        }
    });

    const payload = {
        fecha: new Date().toISOString().split("T")[0],
        divisas: datos
    };

    localStorage.setItem(`arqueo_parcial_caja_${caja_id}`, JSON.stringify(payload));
}

// GUARDAR FINAL
const btnGuardarDom = document.getElementById("guardar-arqueo-btn");
if (btnGuardarDom) {
    btnGuardarDom.addEventListener("click", async () => {
        if (!caja_id || !usuarioSesion) {
            mostrarModalError({ titulo: "Error", mensaje: "Sesión no válida." });
            return;
        }

        const originalText = btnGuardarDom.innerHTML;
        btnGuardarDom.disabled = true;
        btnGuardarDom.innerHTML = '<div class="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent mr-2"></div> Guardando...';

        const detalles = [];
        document.querySelectorAll("#tabla-arqueo-body tr").forEach(row => {
            const input = row.querySelector(".input-fisico");
            const saldoSistema = parseFloat(row.querySelector(".saldo-sistema").value) || 0;
            const saldoFisico = input.value === "" ? 0 : parseFloat(input.value);
            
            detalles.push({
                divisa_id: input.dataset.id,
                divisa: input.dataset.divisa, // Opcional, para debug
                total_sistema: saldoSistema,
                total_arqueo: saldoFisico,
                // Nota: Tu PHP espera 'denominaciones_json' y 'es_fraccionable', 
                // si no los mandamos usa defaults. Podríamos agregar info si la tuviéramos.
            });
        });

        const payload = {
            caja_id: caja_id,
            equipo_id: usuarioSesion.equipo_id || usuarioSesion.usuario_id,
            divisas: detalles,
            observacion: document.getElementById("observaciones-arqueo")?.value || ""
        };

        try {
            // Se envía al endpoint que procesa el guardado
            const res = await fetch("https://cambiosorion.cl/data/arqueo-caja.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const respuesta = await res.json();

            if (respuesta.mensaje || respuesta.arqueo_id) { // Tu PHP devuelve 'mensaje' y 'arqueo_id' en éxito
                localStorage.removeItem(`arqueo_parcial_caja_${caja_id}`);
                mostrarModalExitoso();
            } else if (respuesta.error) {
                throw new Error(respuesta.error);
            } else {
                throw new Error("Error desconocido al guardar.");
            }

        } catch (error) {
            mostrarModalError({ titulo: "Error al guardar", mensaje: error.message });
        } finally {
            btnGuardarDom.disabled = false;
            btnGuardarDom.innerHTML = originalText;
        }
    });
}

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
  if(modal) {
      modal.classList.remove("hidden");
      const btnVolver = document.getElementById("volver");
      if(btnVolver) {
          btnVolver.onclick = () => {
            modal.classList.add("hidden");
            location.reload();
          };
      }
  }
}