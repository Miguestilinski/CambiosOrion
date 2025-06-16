let usuarioSesion = null;
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

    try {
        const res = await fetch("https://cambiosorion.cl/data/session_status.php", {
            credentials: "include"
        });
        if (!res.ok) throw new Error("No se pudo obtener la sesión.");
        const data = await res.json();
        usuarioSesion = data;
        console.log("Usuario autenticado:", usuarioSesion);

        if (usuarioSesion && usuarioSesion.caja_id !== undefined) {
            filtros.caja_id.value = usuarioSesion.caja_id;
            obtenerTraspasos();
        }
    } catch (error) {
        console.error("Error obteniendo la sesión:", error);
    }

    if (nuevoTraspasoBtn) {
        nuevoTraspasoBtn.addEventListener('click', () => {
            window.location.href = 'https://caja.cambiosorion.cl/nuevo-tp';
        });
    }
    if (completarPendientesBtn) {
        completarPendientesBtn.addEventListener('click', () => {
            modoCompletarPendientes = !modoCompletarPendientes;
            actualizarModoCompletar();
        });
    }

    function actualizarModoCompletar() {
        const thead = tabla.closest('table').querySelector('thead');
        const checkboxes = tabla.querySelectorAll('.checkbox-completar');
        const botonesIndividuales = tabla.querySelectorAll('.btn-completar-individual');
        const selectAllRow = document.getElementById('fila-select-todos');

        if (modoCompletarPendientes) {
            completarPendientesBtn.textContent = 'Cancelar';
            contenedorAcciones.classList.remove('hidden');
            checkboxes.forEach(cb => cb.classList.remove('hidden'));
            botonesIndividuales.forEach(btn => btn.classList.remove('hidden'));
            const filaEncabezado = thead.querySelector('tr');
            if (filaEncabezado && filaEncabezado.children.length === 9) {
                const nuevaColumna = document.createElement('th');
                nuevaColumna.className = 'px-4 py-2';
                nuevaColumna.textContent = '';
                filaEncabezado.insertBefore(nuevaColumna, filaEncabezado.firstElementChild);
            }
            if (selectAllRow) selectAllRow.classList.remove('hidden');
        } else {
            completarPendientesBtn.textContent = 'Completar Traspasos Pendientes';
            contenedorAcciones.classList.add('hidden');
            checkboxes.forEach(cb => cb.classList.add('hidden'));
            botonesIndividuales.forEach(btn => btn.classList.add('hidden'));
            const filaEncabezado = thead.querySelector('tr');
            const ths = filaEncabezado ? filaEncabezado.querySelectorAll('th') : [];
            if (ths.length > 0 && ths[0].textContent.trim() === '') {
                filaEncabezado.removeChild(ths[0]);
            }
            if (selectAllRow) selectAllRow.classList.add('hidden');
        }

        tabla.querySelectorAll('.checkbox-completar').forEach(cb => cb.checked = false);
        totalesPorDivisa = {};
        actualizarTotales();
        obtenerTraspasos();
    }

    function actualizarTotales() {
        const totalHtml = Object.entries(totalesPorDivisa).map(([divisa, monto]) => {
            return `<span class="block">${divisa}: ${formatearNumero(monto)}</span>`;
        }).join('');
        resumenTotales.innerHTML = totalHtml;
    }

    function obtenerTraspasos() {
        const params = new URLSearchParams();

        for (const [clave, input] of Object.entries(filtros)) {
            let valor = input.value;
            if (typeof valor === 'string') {
                valor = valor.trim();
            } else if (valor === null || valor === undefined) {
                valor = '';
            } else {
                valor = String(valor);
            }
            params.set(clave, valor);
        }

        fetch(`https://cambiosorion.cl/data/traspasos.php?${params.toString()}`)
            .then(response => response.text()) // cambia a .text() en lugar de .json()
            .then(rawText => {
                //console.log("Respuesta cruda del servidor:");
                //console.log(rawText);

                try {
                    const data = JSON.parse(rawText);
                    //console.log('Traspasos recibidos:', data);
                    mostrarResultados(data);
                } catch (e) {
                    console.error("Error al parsear JSON:", e);
                }
            })
            .catch(error => console.error('Error al obtener traspasos:', error));

    }

    function limpiarTexto(valor) {
        return valor === null || valor === undefined ? '' : valor;
    }

    function formatearNumero(numero) {
        if (!numero) return '';
        return Number(numero).toLocaleString('es-CL');
    }

    function mostrarResultados(traspasos) {
        tabla.innerHTML = '';

        if (traspasos.length === 0) {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td colspan="9" class="text-center text-white py-4 bg-gray-800">No se encontraron traspasos</td>`;
            tabla.appendChild(tr);
            return;
        }

        // Eliminar fila previa si existe
        const filaSelectTodosExistente = document.getElementById('fila-select-todos');
        if (filaSelectTodosExistente) filaSelectTodosExistente.remove();

        // Solo crear si el modo está activo
        if (modoCompletarPendientes) {
            const filaSelectTodos = document.createElement('tr');
            filaSelectTodos.id = 'fila-select-todos';
            filaSelectTodos.className = 'bg-gray-700';
            filaSelectTodos.innerHTML = `
                <td colspan="7" class="px-4 py-2 text-white">
                    <label class="flex items-center">
                        <input type="checkbox" id="checkbox-select-todos" class="rounded mr-2">
                        Seleccionar todos los traspasos pendientes
                    </label>
                </td>
                <td colspan="3" class="px-4 py-2 text-right">
                    <button id="btn-completar-masivo" class="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-1.5 rounded">
                        Completar Traspasos Seleccionados
                    </button>
                </td>
            `;
            tabla.appendChild(filaSelectTodos);

            // Agrega evento después de insertar en el DOM
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
                            alert('No hay traspasos seleccionados para completar.');
                            return;
                        }
                        completarTraspasos(ids);
                    });
                }
            }, 0);
        }

        traspasos.forEach(tp => {
            const tr = document.createElement('tr');
            tr.className = 'bg-white border-b border-gray-700 text-gray-700';

            const esPendiente = (tp.estado || '').toLowerCase() === 'pendiente';

            // Crear celda del checkbox (solo visible si modoCompletarPendientes está activo)
            if (modoCompletarPendientes && esPendiente) {
                const tdCheckbox = document.createElement('td');
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.className = 'checkbox-completar ml-4 rounded';
                checkbox.setAttribute('data-id', tp.id);
                checkbox.setAttribute('data-monto', tp.monto);
                checkbox.setAttribute('data-divisa', tp.divisa);
                tdCheckbox.appendChild(checkbox);

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

                tr.appendChild(tdCheckbox);
            } else if (modoCompletarPendientes && !esPendiente) {
                // Mantener alineación con celda vacía si modo está activo pero no es pendiente
                const tdVacio = document.createElement('td');
                tr.appendChild(tdVacio);
            }

            // Celdas de datos
            const celdas = [
                limpiarTexto(tp.id),
                limpiarTexto(tp.fecha),
                limpiarTexto(tp.transaccion_id),
                limpiarTexto(tp.origen),
                limpiarTexto(tp.destino),
                limpiarTexto(tp.divisa),
                formatearNumero(tp.monto),
                limpiarTexto(tp.estado)
            ];

            celdas.forEach(texto => {
                const td = document.createElement('td');
                td.className = 'px-4 py-2';
                td.textContent = texto;
                tr.appendChild(td);
            });

            // Última celda (acciones)
            const tdAcciones = document.createElement('td');
            tdAcciones.className = 'px-4 py-2 acciones-cell';
            tr.appendChild(tdAcciones);

            // Botón de acción según estado
            const accionesCell = tr.querySelector('.acciones-cell');

            if (esPendiente) {
                if (modoCompletarPendientes) {
                    const btnCompletar = document.createElement('button');
                    btnCompletar.textContent = 'Completar';
                    btnCompletar.className = 'btn-completar-individual bg-green-600 text-white px-3 py-1 rounded';
                    btnCompletar.addEventListener('click', () => {
                        completarTraspasos([tp.id]);
                    });
                    accionesCell.appendChild(btnCompletar);
                } else {
                    const btnCompletar = document.createElement('button');
                    btnCompletar.textContent = 'Completar';
                    btnCompletar.className = 'bg-green-600 text-white px-3 py-1 rounded';
                    btnCompletar.addEventListener('click', () => {
                        completarTraspasos([tp.id]);
                    });
                    accionesCell.appendChild(btnCompletar);
                }
            } else {
                const btnMostrar = document.createElement('button');
                btnMostrar.textContent = 'Mostrar';
                btnMostrar.className = 'text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-sm px-3 py-1';
                btnMostrar.addEventListener('click', () => {
                    window.location.href = `detalle-tp?id=${tp.id}`;
                });
                accionesCell.appendChild(btnMostrar);
            }

            tabla.appendChild(tr);
        });
    }

    function completarTraspasos(ids) {
        // Aquí va la lógica de envío al servidor para completar los traspasos por ID
        console.log('Completar traspasos:', ids);
        // Ejemplo POST a completar-traspasos.php
    }

    // Event listeners para filtros visibles
    Object.entries(filtros).forEach(([clave, input]) => {
        if (clave !== "caja_id") {
            input.addEventListener('input', obtenerTraspasos);
            input.addEventListener('change', obtenerTraspasos);
        }
    });
});