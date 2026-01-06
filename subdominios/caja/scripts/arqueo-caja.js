let caja_id = null;
let equipo_id = null;
let usuarioSesion = null;
let divisasBase = [];

document.addEventListener("DOMContentLoaded", function() {
    // 1. Cargar estructura
    getSession();
    cargarSidebar();
    
    // Configurar otros botones aquí si es necesario
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

async function getSession() {
    try {
        const res = await fetch("https://cambiosorion.cl/data/session_status_admin.php", {
            credentials: "include",
        });
        if (!res.ok) throw new Error("No se pudo obtener la sesión.");

        const data = await res.json();
        
        if (!data.isAuthenticated || !data.equipo_id) {
            window.location.href = 'https://admin.cambiosorion.cl/login';
            return;
        }

        usuarioSesion = data;
        caja_id = usuarioSesion.caja_id;
        equipo_id = usuarioSesion.equipo_id;

        // Poblar Header
        const headerName = document.getElementById('header-user-name');
        const headerEmail = document.getElementById('dropdown-user-email');
        if (headerName) headerName.textContent = data.nombre ? data.nombre.split(' ')[0] : 'Admin';
        if (headerEmail) headerEmail.textContent = data.correo;

        console.log("Caja ID desde sesión:", caja_id);

        // Lógica de restauración parcial
        const claveParcial = `arqueo_parcial_caja_${caja_id}`;
        const parcialGuardado = localStorage.getItem(claveParcial);
        if (parcialGuardado) {
            const dataStorage = JSON.parse(parcialGuardado);
            const hoy = new Date().toISOString().split("T")[0];
            if (dataStorage.fecha === hoy && Array.isArray(dataStorage.divisas)) {
                console.log("Restaurando arqueo parcial guardado:", dataStorage);
                // Asegúrate que esta función exista en tu código base o global scope
                if(typeof restaurarParcial === 'function') restaurarParcial(dataStorage.divisas);
            } else {
                localStorage.removeItem(claveParcial); // Expirado
            }
        }

        await cargarDivisas(caja_id);

    } catch (error) {
        console.error("Error al obtener la sesión:", error);
    }
}

async function cargarDivisas(cajaId) {
    const tablaCuerpo = document.getElementById("tabla-arqueo-body"); // Asegúrate de tener este ID en tu HTML
    if (tablaCuerpo) {
        tablaCuerpo.innerHTML = '<tr><td colspan="5" class="text-center py-8"><div class="animate-spin h-8 w-8 border-4 border-cyan-500 rounded-full border-t-transparent mx-auto"></div></td></tr>';
    }

    try {
        // Obtenemos el inventario actual de la caja para comparar (Sistema vs Físico)
        const res = await fetch(`https://cambiosorion.cl/data/inventario_caja.php?caja_id=${cajaId}&limit=100`, {
            credentials: "include"
        });
        
        if (!res.ok) throw new Error("Error al cargar inventario");
        
        const data = await res.json();
        
        // Guardamos en variable global para cálculos
        divisasBase = Array.isArray(data) ? data : []; 
        
        renderizarTablaArqueo(divisasBase);

        // Si hay datos guardados en localStorage, los aplicamos ahora
        const claveParcial = `arqueo_parcial_caja_${cajaId}`;
        const parcialGuardado = localStorage.getItem(claveParcial);
        if (parcialGuardado) {
            const datos = JSON.parse(parcialGuardado);
            if (datos.fecha === new Date().toISOString().split("T")[0]) {
                restaurarParcial(datos.divisas);
            }
        }

    } catch (error) {
        console.error(error);
        if (tablaCuerpo) {
            tablaCuerpo.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-red-500">Error al cargar divisas.</td></tr>';
        }
    }
}

function renderizarTablaArqueo(divisas) {
    const tablaCuerpo = document.getElementById("tabla-arqueo-body");
    const totalSistemaElem = document.getElementById("total-sistema-clp"); // Span para total
    const totalFisicoElem = document.getElementById("total-fisico-clp");   // Span para total
    const totalDifElem = document.getElementById("total-diferencia-clp");  // Span para total

    if (!tablaCuerpo) return;
    tablaCuerpo.innerHTML = "";

    if (divisas.length === 0) {
        tablaCuerpo.innerHTML = '<tr><td colspan="5" class="text-center text-gray-500 py-4">No hay divisas asignadas a esta caja.</td></tr>';
        return;
    }

    divisas.forEach((divisa, index) => {
        const saldoSistema = parseFloat(divisa.cantidad) || 0;
        
        const tr = document.createElement("tr");
        tr.className = "hover:bg-gray-50 border-b border-gray-100 transition group";

        tr.innerHTML = `
            <td class="px-4 py-3 flex items-center gap-3">
                <img src="${divisa.icono || 'https://cambiosorion.cl/orionapp/icons/default.png'}" class="w-6 h-6 rounded-full border border-gray-200">
                <span class="font-bold text-gray-700">${divisa.divisa}</span>
            </td>
            <td class="px-4 py-3 text-right">
                <span class="font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded border border-gray-200 block w-full">
                    ${saldoSistema.toLocaleString('es-CL', { minimumFractionDigits: 2 })}
                </span>
                <input type="hidden" class="saldo-sistema" value="${saldoSistema}">
            </td>
            <td class="px-4 py-3">
                <input type="number" step="0.01" 
                    class="input-fisico w-full text-right font-mono font-bold text-gray-800 border-gray-300 rounded focus:ring-cyan-500 focus:border-cyan-500 transition px-3 py-1 bg-white"
                    data-index="${index}" 
                    data-divisa="${divisa.divisa}"
                    placeholder="0.00">
            </td>
            <td class="px-4 py-3 text-right">
                <span class="diferencia font-mono font-bold text-gray-400">0.00</span>
            </td>
            <td class="px-4 py-3 text-center">
                <span class="estado-icon text-gray-300">-</span>
            </td>
        `;

        tablaCuerpo.appendChild(tr);
    });

    // Agregar Listeners a los inputs generados
    const inputs = document.querySelectorAll(".input-fisico");
    inputs.forEach(input => {
        input.addEventListener("input", () => {
            calcularFila(input);
            guardarParcialLocal();
        });
        // Calcular inicial (por si es restauración)
        // calcularFila(input); 
    });
}

function calcularFila(input) {
    const row = input.closest("tr");
    const saldoSistema = parseFloat(row.querySelector(".saldo-sistema").value) || 0;
    const saldoFisico = parseFloat(input.value) || 0;
    const diferencia = saldoFisico - saldoSistema;
    
    const diffElem = row.querySelector(".diferencia");
    const iconElem = row.querySelector(".estado-icon");

    // Formatear diferencia
    diffElem.textContent = diferencia.toLocaleString('es-CL', { minimumFractionDigits: 2 });

    // Estilos visuales
    if (diferencia === 0) {
        diffElem.className = "diferencia font-mono font-bold text-green-600";
        iconElem.innerHTML = `<svg class="w-5 h-5 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`;
        input.classList.remove("border-red-500", "bg-red-50");
        input.classList.add("border-green-500", "bg-green-50");
    } else {
        diffElem.className = "diferencia font-mono font-bold text-red-600";
        iconElem.innerHTML = `<svg class="w-5 h-5 text-red-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>`;
        input.classList.add("border-red-500", "bg-red-50");
        input.classList.remove("border-green-500", "bg-green-50");
    }
}

function restaurarParcial(datosGuardados) {
    const inputs = document.querySelectorAll(".input-fisico");
    inputs.forEach(input => {
        const divisaNombre = input.dataset.divisa;
        const dato = datosGuardados.find(d => d.divisa === divisaNombre);
        if (dato) {
            input.value = dato.cantidad;
            calcularFila(input); // Recalcular visuales
        }
    });
}

function guardarParcialLocal() {
    if (!caja_id) return;
    
    const datos = [];
    document.querySelectorAll(".input-fisico").forEach(input => {
        if (input.value !== "") {
            datos.push({
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

// Función principal para ENVIAR el arqueo al servidor
async function guardarArqueo() {
    if (!caja_id || !usuarioSesion) {
        mostrarModalError({ titulo: "Error", mensaje: "Sesión no válida." });
        return;
    }

    const btnGuardar = document.getElementById("guardar-arqueo-btn"); // Asegúrate de tener este botón
    const textoOriginal = btnGuardar ? btnGuardar.innerHTML : "Guardar";
    
    if (btnGuardar) {
        btnGuardar.disabled = true;
        btnGuardar.innerHTML = '<svg class="animate-spin h-5 w-5 mr-2 inline" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Guardando...';
    }

    // Recopilar datos
    const detalles = [];
    let hayDiferencias = false;

    document.querySelectorAll("tr.group").forEach(row => {
        const input = row.querySelector(".input-fisico");
        const saldoSistema = parseFloat(row.querySelector(".saldo-sistema").value) || 0;
        const saldoFisico = parseFloat(input.value) || 0; // Si está vacío cuenta como 0 en arqueo final
        
        if (Math.abs(saldoFisico - saldoSistema) > 0.001) {
            hayDiferencias = true;
        }

        detalles.push({
            divisa: input.dataset.divisa,
            sistema: saldoSistema,
            fisico: saldoFisico,
            diferencia: saldoFisico - saldoSistema
        });
    });

    const payload = {
        caja_id: caja_id,
        usuario_id: usuarioSesion.equipo_id,
        detalles: detalles,
        observaciones: document.getElementById("observaciones-arqueo")?.value || ""
    };

    try {
        const res = await fetch("https://cambiosorion.cl/data/guardar_arqueo.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const respuesta = await res.json();

        if (respuesta.exito) {
            localStorage.removeItem(`arqueo_parcial_caja_${caja_id}`); // Limpiar parcial
            mostrarModalExitoso();
        } else {
            throw new Error(respuesta.mensaje || "Error al guardar en base de datos.");
        }

    } catch (error) {
        mostrarModalError({ titulo: "Error al guardar", mensaje: error.message });
    } finally {
        if (btnGuardar) {
            btnGuardar.disabled = false;
            btnGuardar.innerHTML = textoOriginal;
        }
    }
}

// Vincular botón guardar si existe en el DOM
const btnGuardarDom = document.getElementById("guardar-arqueo-btn");
if (btnGuardarDom) {
    btnGuardarDom.addEventListener("click", guardarArqueo);
}
// (Por ejemplo: cargarDivisas, mostrarModalError, mostrarModalExitoso, etc.)

function mostrarModalError({ titulo, mensaje, textoConfirmar = "Aceptar", textoCancelar = null, onConfirmar, onCancelar }) {
  const modal = document.getElementById("modal-error");
  const tituloElem = document.getElementById("modal-error-titulo");
  const mensajeElem = document.getElementById("modal-error-mensaje");
  const btnConfirmar = document.getElementById("modal-error-confirmar");
  const btnCancelar = document.getElementById("modal-error-cancelar");

  tituloElem.textContent = titulo;
  mensajeElem.textContent = mensaje;
  btnConfirmar.textContent = textoConfirmar;

  if (textoCancelar) {
    btnCancelar.classList.remove("hidden");
    btnCancelar.textContent = textoCancelar;
  } else {
    btnCancelar.classList.add("hidden");
  }

  modal.classList.remove("hidden");

  btnConfirmar.onclick = () => {
    modal.classList.add("hidden");
    if (onConfirmar) onConfirmar();
  };

  btnCancelar.onclick = () => {
    modal.classList.add("hidden");
    if (onCancelar) onCancelar();
  };
}

function mostrarModalExitoso() {
  const modal = document.getElementById("modal-exitoso");
  modal.classList.remove("hidden");

  document.getElementById("volver").onclick = () => {
    modal.classList.add("hidden");
    location.reload();
  };
}
