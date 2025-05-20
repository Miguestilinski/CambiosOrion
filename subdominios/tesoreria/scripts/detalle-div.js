// detalle-div.js

import { obtenerDetalleDivisa, actualizarDivisa } from './api-divisa.js';

let divisaOriginal = null;

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');

    if (!id) {
        console.error("ID de divisa no proporcionado.");
        return;
    }

    const divisa = await obtenerDetalleDivisa(id);

    if (divisa) {
        divisaOriginal = divisa;
        mostrarDetalle(divisa);
    }

    configurarBotones(id);
});

function mostrarDetalle(divisa) {
    const contenedor = document.getElementById('info-divisa');
    contenedor.innerHTML = `
        <div><strong>Nombre:</strong> <span id="nombre-divisa">${divisa.nombre}</span></div>
        <div><strong>Símbolo:</strong> <span id="simbolo-divisa">${divisa.simbolo}</span></div>
        <div><strong>Código:</strong> <span id="codigo-divisa">${divisa.codigo}</span></div>
        <div><strong>País:</strong> <span id="pais-divisa">${divisa.pais}</span></div>
        <div><strong>Estado:</strong> <span id="estado-divisa">${divisa.estado}</span></div>
    `;
}

function configurarBotones(id) {
    const btnEditar = document.getElementById('btn-editar');
    const btnGuardar = document.getElementById('btn-guardar');
    const btnCancelar = document.getElementById('btn-cancelar');
    const acciones = document.getElementById('acciones-edicion');
    const info = document.getElementById('info-divisa');

    btnEditar.addEventListener('click', () => {
        if (!divisaOriginal) return;

        acciones.classList.remove('hidden');
        btnEditar.classList.add('hidden');

        info.innerHTML = `
            <div>
                <label class="block mb-1 text-white">Nombre:</label>
                <input type="text" id="input-nombre" class="w-full p-2 rounded bg-gray-700 text-white border border-gray-600" value="${divisaOriginal.nombre}">
            </div>
            <div>
                <label class="block mb-1 text-white">Símbolo:</label>
                <input type="text" id="input-simbolo" class="w-full p-2 rounded bg-gray-700 text-white border border-gray-600" value="${divisaOriginal.simbolo}">
            </div>
            <div>
                <label class="block mb-1 text-white">Estado:</label>
                <select id="input-estado" class="w-full p-2 rounded bg-gray-700 text-white border border-gray-600">
                    <option value="Activo" ${divisaOriginal.estado === 'Activo' ? 'selected' : ''}>Activo</option>
                    <option value="Inactivo" ${divisaOriginal.estado === 'Inactivo' ? 'selected' : ''}>Inactivo</option>
                </select>
            </div>
        `;
    });

    btnCancelar.addEventListener('click', () => {
        acciones.classList.add('hidden');
        btnEditar.classList.remove('hidden');
        mostrarDetalle(divisaOriginal);
    });

    btnGuardar.addEventListener('click', async () => {
        const nombre = document.getElementById('input-nombre').value.trim();
        const simbolo = document.getElementById('input-simbolo').value.trim();
        const estado = document.getElementById('input-estado').value;

        if (!nombre || !simbolo) {
            alert("Nombre y símbolo son obligatorios.");
            return;
        }

        const respuesta = await actualizarDivisa({
            id,
            nombre,
            simbolo,
            estado
        });

        if (respuesta.success) {
            divisaOriginal = { ...divisaOriginal, nombre, simbolo, estado };
            mostrarDetalle(divisaOriginal);
            acciones.classList.add('hidden');
            btnEditar.classList.remove('hidden');
        } else {
            alert(respuesta.error || "Error al actualizar la divisa.");
        }
    });
}
