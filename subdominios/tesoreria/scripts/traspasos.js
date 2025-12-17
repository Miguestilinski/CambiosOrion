let usuarioSesion = null;
let caja_id = null;
let modoCompletarPendientes = false;
let totalesPorDivisa = {};

document.addEventListener('DOMContentLoaded', async () => {
    const nuevoTraspasoBtn = document.getElementById('nuevo-tp');
    const completarPendientesBtn = document.getElementById('activar-completado');
    const tabla = document.getElementById('tabla-transacciones');
    const resumenTotales = document.getElementById('resumen-totales');
    const contenedorAcciones = document.getElementById('resumen-completado');

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
        caja_id: { value: "" }
    };

    // 1. Obtener Sesión
    try {
        const res = await fetch("https://cambiosorion.cl/data/session_status.php", {
            credentials: "include"
        });
        if (!res.ok) throw new Error("No se pudo obtener la sesión.");
        const data = await res.json();
        usuarioSesion = data;
        console.log("Usuario autenticado:", usuarioSesion);

        if (usuarioSesion && usuarioSesion.caja_id !== undefined) {
            caja_id = usuarioSesion.caja_id;
            filtros.caja_id.value = usuarioSesion.caja_id;
            obtenerTraspasos();
        } else {
            console.warn("Usuario sin caja asignada o sesión inválida");
            // Intentamos cargar igual por si es admin visualizando todo
            obtenerTraspasos();
        }
    } catch (error) {
        console.error("Error obteniendo la sesión:", error);
    }

    if (nuevoTraspasoBtn) {
        nuevoTraspasoBtn.addEventListener('click', () => {
            // Ajusta esta URL si tu archivo de nuevo traspaso se llama diferente
            window.location.href = 'nuevo-tp'; 
        });
    }
    if (completarPendientesBtn) {
        completarPendientesBtn.addEventListener('click', () => {
            modoCompletarPendientes = !modoCompletarPendientes;
            actualizarModoCompletar();
        });
    }

    function actualizarModoCompletar() {
        // Buscar el thead correctamente
        const tableElem = tabla.closest('table');
        const thead = tableElem ? tableElem.querySelector('thead') : null;
        
        const checkboxes = tabla.querySelectorAll('.checkbox-completar');
        const botonesIndividuales = tabla.querySelectorAll('.btn-completar-individual');
        const selectAllRow = document.getElementById('fila-select-todos');

        if (modoCompletarPendientes) {
            // Activar Modo
            completarPendientesBtn.textContent = 'Cancelar';
            completarPendientesBtn.classList.remove('bg-yellow-600', 'hover:bg-yellow-700', 'focus:ring-yellow-300');
            completarPendientesBtn.classList.add('bg-red-600', 'hover:bg-red-700', 'focus:ring-red-300');

            contenedorAcciones.classList.remove('hidden');
            
            // Agregar columna de checkbox al header si no existe
            if (thead) {
                const filaEncabezado = thead.querySelector('tr');
                // Asumimos que la tabla normal tiene 9 columnas. Si tiene 9, agregamos la 10ma (checkbox)
                if (filaEncabezado && filaEncabezado.children.length === 9) {
                    const nuevaColumna = document.createElement('th');
                    nuevaColumna.className = 'px-4 py-2';
                    nuevaColumna.textContent = ''; // Columna vacía para el checkbox
                    filaEncabezado.insertBefore(nuevaColumna, filaEncabezado.firstElementChild);
                }
            }
            if (selectAllRow) selectAllRow.classList.remove('hidden');

        } else {
            // Desactivar Modo
            completarPendientesBtn.textContent = 'Completar Traspasos Pendientes';
            completarPendientesBtn.classList.remove('bg-red-600', 'hover:bg-red-700', 'focus:ring-red-300');
            completarPendientesBtn.classList.add('bg-yellow-600', 'hover:bg-yellow-700', 'focus:ring-yellow-300');

            contenedorAcciones.classList.add('hidden');

            // Remover columna del header
            if (thead) {
                const filaEncabezado = thead.querySelector('tr');
                if (filaEncabezado && filaEncabezado.children.length > 9) {
                    filaEncabezado.removeChild(filaEncabezado.firstElementChild);
                }
            }
            if (selectAllRow) selectAllRow.classList.add('hidden');
        }
        
        // Recargar tabla para renderizar checkboxes correctamente
        obtenerTraspasos();
    }

    function actualizarTotales() {
        const totalHtml = Object.entries(totalesPorDivisa).map(([divisa, monto]) => {
            return `<span class="block bg-gray-900 px-2 py-1 rounded text-xs mr-2 mb-1">${divisa}: ${formatearNumero(monto)}</span>`;
        }).join('');
        resumenTotales.innerHTML = totalHtml || '<span class="text-xs text-gray-400">Seleccione traspasos...</span>';
    }

    function obtenerTraspasos() {
        const params = new URLSearchParams();

        for (const [clave, input] of Object.entries(filtros)) {
            let valor = input.value;
            if (typeof valor === 'string') valor = valor.trim();
            else if (valor === null || valor === undefined) valor = '';
            else valor = String(valor);
            params.set(clave, valor);
        }

        // IMPORTANTE: credentials: 'include' para asegurar que el backend reciba la cookie si la necesita
        fetch(`https://cambiosorion.cl/data/traspasos.php?${params.toString()}`, {
            credentials: 'include'
        })
            .then(response => response.text())
            .then(rawText => {
                try {
                    const data = JSON.parse(rawText);
                    mostrarResultados(data);
                } catch (e) {
                    console.error("Error al parsear JSON:", e);
                    tabla.innerHTML = `<tr><td colspan="9" class="text-center py-4 text-red-500">Error en datos recibidos</td></tr>`;
                }
            })
            .catch(error => console.error('Error al obtener traspasos:', error));
    }

    function limpiarTexto(valor) {
        return valor === null || valor === undefined ? '' : valor;
    }

    function formatearNumero(numero) {
        if (!numero) return '0';
        return Number(numero).toLocaleString('es-CL');
    }

    function mostrarResultados(traspasos) {
        tabla.innerHTML = '';
        totalesPorDivisa = {}; // Resetear totales al recargar
        actualizarTotales();

        if (!traspasos || traspasos.length === 0) {
            const cols = modoCompletarPendientes ? 10 : 9;
            tabla.innerHTML = `<tr><td colspan="${cols}" class="text-center text-white py-8 bg-gray-800">No se encontraron traspasos</td></tr>`;
            return;
        }

        // Fila "Seleccionar Todos" (Solo si modo activo)
        if (modoCompletarPendientes) {
            const filaSelectTodos = document.createElement('tr');
            filaSelectTodos.id = 'fila-select-todos';
            filaSelectTodos.className = 'bg-gray-700 border-b border-gray-600';
            filaSelectTodos.innerHTML = `
                <td colspan="8" class="px-4 py-2 text-white">
                    <label class="flex items-center cursor-pointer font-bold text-yellow-500">
                        <input type="checkbox" id="checkbox-select-todos" class="rounded mr-2 bg-gray-600 border-gray-500">
                        Seleccionar todos los visibles
                    </label>
                </td>
                <td colspan="2" class="px-4 py-2 text-right">
                    <button id="btn-completar-masivo" class="bg-green-600 hover:bg-green-700 text-white font-bold text-xs px-4 py-2 rounded shadow">
                        CONFIRMAR SELECCIONADOS
                    </button>
                </td>
            `;
            tabla.appendChild(filaSelectTodos);

            setTimeout(() => {
                const selectAllCheckbox = document.getElementById('checkbox-select-todos');
                if (selectAllCheckbox) {
                    selectAllCheckbox.addEventListener('change', (e) => {
                        const checked = e.target.checked;
                        tabla.querySelectorAll('.checkbox-completar').forEach(cb => {
                            cb.checked = checked;
                            cb.dispatchEvent(new Event('change'));
                        });
                    });
                }

                const btnCompletarMasivo = document.getElementById('btn-completar-masivo');
                if (btnCompletarMasivo) {
                    btnCompletarMasivo.addEventListener('click', () => {
                        const seleccionados = Array.from(tabla.querySelectorAll('.checkbox-completar:checked'));
                        const ids = seleccionados.map(cb => cb.dataset.id);
                        if (ids.length === 0) {
                            mostrarModalError({ titulo: "⚠️ Atención", mensaje: "No has seleccionado ningún traspaso." });
                            return;
                        }
                        completarTraspasos(ids);
                    });
                }
            }, 0);
        }

        traspasos.forEach(tp => {
            const tr = document.createElement('tr');
            tr.className = 'bg-white border-b border-gray-700 text-gray-700 hover:bg-gray-50 transition';

            const esPendiente = (tp.estado || '').toLowerCase() === 'pendiente';

            // 1. Columna Checkbox (Solo si modo activo)
            if (modoCompletarPendientes) {
                const tdCheckbox = document.createElement('td');
                tdCheckbox.className = 'px-4 py-2 text-center';
                
                if (esPendiente) {
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.className = 'checkbox-completar rounded bg-gray-200 border-gray-400 cursor-pointer w-5 h-5';
                    checkbox.setAttribute('data-id', tp.id);
                    checkbox.setAttribute('data-monto', tp.monto);
                    checkbox.setAttribute('data-divisa', tp.divisa);
                    
                    checkbox.addEventListener('change', () => {
                        const monto = parseFloat(tp.monto);
                        const divisa = tp.divisa;
                        if (checkbox.checked) {
                            totalesPorDivisa[divisa] = (totalesPorDivisa[divisa] || 0) + monto;
                        } else {
                            totalesPorDivisa[divisa] = (totalesPorDivisa[divisa] || 0) - monto;
                            if (totalesPorDivisa[divisa] <= 0) delete totalesPorDivisa[divisa];
                        }
                        actualizarTotales();
                    });
                    tdCheckbox.appendChild(checkbox);
                }
                tr.appendChild(tdCheckbox);
            }

            // 2. Columnas de Datos
            const campos = [
                tp.id,
                tp.fecha,
                tp.transaccion_id || '-',
                tp.origen,
                tp.destino,
                tp.divisa,
                formatearNumero(tp.monto),
                tp.estado
            ];

            campos.forEach((texto, index) => {
                const td = document.createElement('td');
                td.className = 'px-4 py-2 whitespace-nowrap';
                if(index === 0) td.className += ' font-bold'; // ID en negrita
                if(index === 6) td.className += ' text-right font-mono'; // Monto alineado
                td.textContent = limpiarTexto(texto);
                tr.appendChild(td);
            });

            // 3. Acciones (BOTÓN MODIFICADO)
            const tdAcciones = document.createElement('td');
            tdAcciones.className = 'px-4 py-2 text-center';

            if (esPendiente) {
                const btnCompletar = document.createElement('button');
                btnCompletar.textContent = 'Completar';
                btnCompletar.className = 'bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-bold shadow';
                btnCompletar.addEventListener('click', () => completarTraspasos([tp.id]));
                tdAcciones.appendChild(btnCompletar);
            } else {
                // AQUÍ ESTÁ EL CAMBIO: Botón mostrar con redirección activa
                const btnVer = document.createElement('button');
                btnVer.textContent = 'Mostrar'; 
                btnVer.className = 'text-white bg-blue-700 hover:bg-blue-800 font-medium rounded text-xs px-3 py-1';
                btnVer.addEventListener('click', () => {
                    window.location.href = `detalle-tp?id=${tp.id}`; 
                });
                tdAcciones.appendChild(btnVer);
            }
            tr.appendChild(tdAcciones);
            tabla.appendChild(tr);
        });
    }

    function completarTraspasos(ids) {
        if(!confirm(`¿Estás seguro de completar ${ids.length} traspaso(s)?`)) return;

        fetch('https://cambiosorion.cl/data/traspasos.php?caja_id=' + caja_id, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include', // <--- IMPORTANTE
            body: JSON.stringify({ ids: ids })
        })
        .then(res => res.json())
        .then(data => {
            if (data.exito) {
                mostrarModalExitoso();
            } else {
                mostrarModalError({ titulo: "❌ Error", mensaje: data.mensaje });
            }
        })
        .catch(err => {
            mostrarModalError({ titulo: "❌ Error de Conexión", mensaje: err.message });
        });
    }

    // Listeners filtros
    Object.entries(filtros).forEach(([clave, input]) => {
        if (clave !== "caja_id") {
            input.addEventListener('input', () => {
                clearTimeout(window.searchTimeout);
                window.searchTimeout = setTimeout(obtenerTraspasos, 400); // Debounce
            });
            input.addEventListener('change', obtenerTraspasos);
        }
    });
});

// Funciones Auxiliares para los Modales (sin cambiar tu HTML)
function mostrarModalError({ titulo, mensaje, textoConfirmar = "Aceptar", textoCancelar = null, onConfirmar, onCancelar }) {
  const modal = document.getElementById("modal-error");
  if(!modal) { alert(mensaje); return; }

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

  // Clonar botones para limpiar eventos previos
  const newConfirm = btnConfirmar.cloneNode(true);
  const newCancel = btnCancelar.cloneNode(true);
  btnConfirmar.parentNode.replaceChild(newConfirm, btnConfirmar);
  btnCancelar.parentNode.replaceChild(newCancel, btnCancelar);

  newConfirm.onclick = () => { modal.classList.add("hidden"); if (onConfirmar) onConfirmar(); };
  newCancel.onclick = () => { modal.classList.add("hidden"); if (onCancelar) onCancelar(); };
}

function mostrarModalExitoso() {
  const modal = document.getElementById("modal-exitoso");
  if(!modal) { alert("Operación Exitosa"); window.location.reload(); return; }
  
  modal.classList.remove("hidden");
  const btnVolver = document.getElementById("volver");
  
  // Limpiar eventos previos
  const newVolver = btnVolver.cloneNode(true);
  btnVolver.parentNode.replaceChild(newVolver, btnVolver);
  
  newVolver.onclick = () => {
    modal.classList.add("hidden");
    // Recargar la tabla para ver cambios
    // Podríamos recargar la página completa también: window.location.reload();
    // Pero mejor solo recargar datos:
    const btnRefresh = document.getElementById('nuevo-tp'); // Hack para disparar recarga o llamar funcion si fuera global
    // Como obtenerTraspasos está en scope local, simulamos click en filtro o recargamos:
    window.location.reload(); 
  };
}