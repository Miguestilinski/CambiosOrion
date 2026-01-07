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
            if (!caja_id) return; // Prevenir acción si no hay caja
            guardarParcialLocal();
            
            // Feedback visual temporal
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

// --- 1. OBTENER SESIÓN ---
async function getSession() {
    try {
        // CORRECCIÓN: Usamos session_status_admin.php que sí existe
        const res = await fetch("https://cambiosorion.cl/data/session_status_admin.php", { credentials: "include" });
        if (!res.ok) throw new Error("No se pudo obtener la sesión.");

        const data = await res.json();
        
        // Validación básica de autenticación
        if (!data.isAuthenticated) {
            window.location.href = 'https://admin.cambiosorion.cl/login';
            return;
        }

        usuarioSesion = data;
        // Asignamos IDs (caja_id puede ser null si es Socio/Admin sin caja)
        caja_id = usuarioSesion.caja_id; 
        equipo_id = usuarioSesion.equipo_id || usuarioSesion.id;

        // Actualizar UI del Header
        const headerName = document.getElementById('header-user-name');
        const headerEmail = document.getElementById('dropdown-user-email');
        if (headerName) headerName.textContent = data.nombre ? data.nombre.split(' ')[0] : 'Usuario';
        if (headerEmail) headerEmail.textContent = data.correo || '';

        // --- VALIDACIÓN CRÍTICA: ¿Tiene caja asignada? ---
        if (!caja_id) {
            console.warn("Usuario sin caja asignada (ej. Socio o Admin general). No se puede realizar arqueo.");
            mostrarMensajeSinCaja();
            return; 
        }

        // Si tiene caja, cargamos los datos
        await cargarDatosArqueo(caja_id);

    } catch (error) {
        console.error("Error al obtener la sesión:", error);
    }
}

function mostrarMensajeSinCaja() {
    const tablaCuerpo = document.getElementById("tabla-arqueo-body");
    const btnGuardar = document.getElementById("guardar-arqueo-btn");
    const btnParcial = document.getElementById("guardar-parcial");

    if (tablaCuerpo) {
        tablaCuerpo.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-12">
                    <div class="flex flex-col items-center justify-center text-gray-400">
                        <svg class="w-12 h-12 mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                        <p class="text-lg font-medium text-gray-600">Este usuario no tiene una caja asignada.</p>
                        <p class="text-sm mt-1">Solo los cajeros con caja activa pueden realizar arqueos.</p>
                    </div>
                </td>
            </tr>
        `;
    }
    
    // Deshabilitar botones para evitar errores
    if (btnGuardar) {
        btnGuardar.disabled = true;
        btnGuardar.classList.add('opacity-50', 'cursor-not-allowed');
    }
    if (btnParcial) {
        btnParcial.disabled = true;
        btnParcial.classList.add('opacity-50', 'cursor-not-allowed');
    }
}

// --- 2. CARGAR DATOS ---
async function cargarDatosArqueo(cajaId) {
    const tablaCuerpo = document.getElementById("tabla-arqueo-body");
    if (tablaCuerpo) {
        tablaCuerpo.innerHTML = '<tr><td colspan="5" class="text-center py-10"><div class="animate-spin h-8 w-8 border-4 border-cyan-500 rounded-full border-t-transparent mx-auto"></div></td></tr>';
    }

    try {
        const res = await fetch(`https://cambiosorion.cl/data/arqueo-caja.php?caja_id=${cajaId}`, {
            credentials: "include"
        });
        
        if (!res.ok) throw new Error("Error al cargar datos de arqueo");
        
        const data = await res.json();
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        divisasBase = Array.isArray(data.divisas) ? data.divisas : []; 
        renderizarTablaArqueo(divisasBase);

        // Restaurar parcial si existe y es de hoy
        const claveParcial = `arqueo_parcial_caja_${cajaId}`;
        const parcialGuardado = localStorage.getItem(claveParcial);
        if (parcialGuardado) {
            try {
                const datos = JSON.parse(parcialGuardado);
                const hoy = new Date().toISOString().split("T")[0];
                if (datos.fecha === hoy) {
                    restaurarParcial(datos.divisas);
                } else {
                    localStorage.removeItem(claveParcial);
                }
            } catch (e) {
                console.error("Error al leer parcial local", e);
            }
        }

    } catch (error) {
        console.error(error);
        if (tablaCuerpo) {
            tablaCuerpo.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-red-500 font-medium">Error: ${error.message}</td></tr>`;
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
        const saldoSistema = parseFloat(divisa.total_sistema) || 0;
        const nombreDivisa = divisa.nombre;
        const codigoDivisa = divisa.codigo;
        const icono = divisa.icono || 'https://cambiosorion.cl/orionapp/icons/default.png';
        const idDivisa = divisa.id; 

        const tr = document.createElement("tr");
        tr.className = "hover:bg-gray-50 border-b border-gray-100 transition group bg-white";

        tr.innerHTML = `
            <td class="px-6 py-4 flex items-center gap-3">
                <img src="${icono}" class="w-8 h-8 rounded-full border border-gray-200 p-0.5 bg-white shadow-sm object-contain" onerror="this.src='https://cambiosorion.cl/orionapp/icons/default.png'">
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
        const idDivisa = input.dataset.id;
        const nombreDivisa = input.dataset.divisa;
        
        const dato = datosGuardados.find(d => 
            (d.divisa_id && d.divisa_id == idDivisa) || 
            (d.divisa && d.divisa === nombreDivisa)
        );

        if (dato) {
            input.value = dato.cantidad || dato.total_arqueo; 
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
            mostrarModalError({ titulo: "No autorizado", mensaje: "Su usuario no tiene una caja asignada." });
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
                divisa: input.dataset.divisa, 
                total_sistema: saldoSistema,
                total_arqueo: saldoFisico,
            });
        });

        const payload = {
            caja_id: caja_id,
            equipo_id: usuarioSesion.equipo_id || usuarioSesion.id,
            divisas: detalles,
            observacion: document.getElementById("observaciones-arqueo")?.value || ""
        };

        try {
            const res = await fetch("https://cambiosorion.cl/data/arqueo-caja.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const respuesta = await res.json();

            if (respuesta.mensaje || respuesta.arqueo_id) {
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