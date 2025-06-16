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
            const ths = thead.querySelectorAll('th');
            if (ths.length === 9) {
                const nuevaColumna = document.createElement('th');
                nuevaColumna.className = 'px-4 py-2';
                nuevaColumna.textContent = 'Seleccionar';
                thead.appendChild(nuevaColumna);
            }
            if (selectAllRow) selectAllRow.classList.remove('hidden');
        } else {
            completarPendientesBtn.textContent = 'Completar Traspasos Pendientes';
            contenedorAcciones.classList.add('hidden');
            checkboxes.forEach(cb => cb.classList.add('hidden'));
            botonesIndividuales.forEach(btn => btn.classList.add('hidden'));
            if (selectAllRow) selectAllRow.classList.add('hidden');
        }

        tabla.querySelectorAll('.checkbox-completar').forEach(cb => cb.checked = false);
        totalesPorDivisa = {};
        actualizarTotales();
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

        const filaSelectTodos = document.createElement('tr');
        filaSelectTodos.id = 'fila-select-todos';
        filaSelectTodos.className = 'bg-gray-700 hidden';
        filaSelectTodos.innerHTML = '<td colspan="9" class="px-4 py-2"><label class="text-white"><input type="checkbox" id="checkbox-select-todos" class="mr-2">Seleccionar todos los traspasos pendientes</label></td>';
        tabla.appendChild(filaSelectTodos);

        document.getElementById('checkbox-select-todos').addEventListener('change', (e) => {
            const checked = e.target.checked;
            tabla.querySelectorAll('.checkbox-completar input[type="checkbox"]').forEach(cb => {
                cb.checked = checked;
                cb.dispatchEvent(new Event('change'));
            });
        });

        traspasos.forEach(tp => {
            const tr = document.createElement('tr');
            tr.className = 'bg-white border-b border-gray-700 text-gray-700';

            const btnMostrar = document.createElement('button');
            btnMostrar.textContent = 'Mostrar';
            btnMostrar.className = 'text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-sm px-3 py-1';
            btnMostrar.addEventListener('click', () => {
                window.location.href = `detalle-tp?id=${tp.id}`;
            });

            const esPendiente = tp.estado.toLowerCase() === 'Pendiente';

            tr.innerHTML = `
                <td class="px-4 py-2">
                    <input type="checkbox" class="check-pendiente hidden" data-id="${tp.id}" data-monto="${tp.monto}" data-divisa="${tp.divisa}">
                    ${limpiarTexto(tp.id)}
                </td>
                <td class="px-4 py-2">${limpiarTexto(tp.fecha)}</td>
                <td class="px-4 py-2">${limpiarTexto(tp.transaccion_id)}</td>
                <td class="px-4 py-2">${limpiarTexto(tp.origen)}</td>
                <td class="px-4 py-2">${limpiarTexto(tp.destino)}</td>
                <td class="px-4 py-2">${limpiarTexto(tp.divisa)}</td>
                <td class="px-4 py-2">${formatearNumero(tp.monto)}</td>
                <td class="px-4 py-2">${limpiarTexto(tp.estado)}</td>
                <td class="px-4 py-2 acciones-cell"></td>
            `;

            const accionesCell = tr.querySelector('.acciones-cell');

            if (esPendiente) {
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.className = 'checkbox-completar hidden mr-2';
                const tdCheckbox = document.createElement('td');
                tdCheckbox.appendChild(checkbox);
                tr.appendChild(tdCheckbox);

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

                const btnCompletar = document.createElement('button');
                btnCompletar.textContent = 'Completar';
                btnCompletar.className = 'btn-completar-individual hidden bg-green-600 text-white px-3 py-1 rounded';
                btnCompletar.addEventListener('click', () => {
                    completarTraspasos([tp.id]);
                });

                accionesCell.appendChild(checkbox);
                accionesCell.appendChild(btnCompletar);
            } else {
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