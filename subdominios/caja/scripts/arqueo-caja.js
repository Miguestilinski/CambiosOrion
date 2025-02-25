document.addEventListener("DOMContentLoaded", function() {
    cargarDivisas();
});

async function cargarDivisas() {
    try {
        let response = await fetch("https://cambiosorion.cl/data/get_divisas_internas.php");
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        
        let divisas = await response.json();
        
        // Filtrar divisas duplicadas (basado en código)
        divisas = divisas.filter((value, index, self) =>
            index === self.findIndex((t) => (
                t.codigo === value.codigo
            ))
        );

        // Ordenar las divisas según la lista proporcionada
        const ordenPreferido = [
            "USD", "EUR", "ARS", "BRL", "PEN", "COP", "UYU", "BOB", "CAD", "GBP", "JPY", "CNY", "SEK", "AUD", "NZD", "CHF", "DKK"
        ];

        // Ordenar divisas basándonos en el orden preferido, luego agregar monedas de oro
        divisas.sort((a, b) => {
            const indexA = ordenPreferido.indexOf(a.codigo);
            const indexB = ordenPreferido.indexOf(b.codigo);

            // Si ambos códigos están en el orden preferido
            if (indexA !== -1 && indexB !== -1) {
                return indexA - indexB;
            }

            // Si uno de los códigos está en el orden preferido y el otro no
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;

            // Si ninguno está en el orden preferido, mantenemos el orden original
            return 0;
        });

        // Crear lista deslizable
        const lista = document.getElementById("divisas-lista");
        lista.innerHTML = ""; // Limpiar la lista

        divisas.forEach(divisa => {
            const div = document.createElement("div");
            div.classList.add("p-3", "bg-gray-600", "rounded-lg", "cursor-pointer", "flex", "justify-between", "items-center");
            div.setAttribute("data-codigo", divisa.codigo);
            div.onclick = () => seleccionarDivisa(divisa);

            div.innerHTML = `
                <div class="flex">
                    <img class="w-6 h-6 mr-2" src="${divisa.icono}" alt="${divisa.pais}">
                    <span class="m">${divisa.codigo} (${divisa.simbolo})</span>
                </div>
                <div class="resumen flex text-sm">
                    <span class="text-sm">Arqueo:</span>
                    <span class="text-md">${divisa.arqueo || 'N/A'}</span>
                </div>
                <div class="resumen flex text-sm">
                    <span class="text-sm">Diferencia:</span>
                    <span class="text-md">${divisa.diferencia || 'N/A'}</span>
                </div>
            `;

            lista.appendChild(div);
        });

        // Agregar barra de desplazamiento
        lista.style.maxHeight = '400px';
        lista.style.overflowY = 'auto';

    } catch (error) {
        console.error("Error al cargar divisas:", error);
    }
}

function seleccionarDivisa(divisa) {
    document.getElementById('titulo-divisa').textContent = `Detalles de ${divisa.nombre} (${divisa.codigo})`;
    document.getElementById('tabla-arqueo').classList.remove('hidden');
    document.getElementById('detalle').classList.remove('hidden');

    // Remover fondo de divisa previamente seleccionada
    document.querySelectorAll('#divisas-lista div').forEach(el => el.classList.remove('bg-gray-700'));
    
    // Agregar fondo a la divisa seleccionada
    const divSeleccionado = document.querySelector(`#divisas-lista div[data-codigo="${divisa.codigo}"]`);
    if (divSeleccionado) divSeleccionado.classList.add('bg-gray-700');

    // Mostrar información relevante
    document.getElementById('total-sistema').textContent = `${divisa.simbolo} ${divisa.denominacion || 'N/A'}`;
}

function generarTablaArqueo(divisa) {

    // Simulación de datos
    const totalSistema = 5000;
    const billetes = [100, 50, 20, 10, 5, 1];

    document.getElementById('total-sistema').textContent = `$${totalSistema}`;
    const tbody = document.getElementById('tbody-arqueo');
    tbody.innerHTML = `
        <tr class="bg-white text-gray-700">
            <td class="p-3" id="total-sistema" rowspan="2">$${totalSistema}</td>
            <td class="p-3">$${billetes[0]}</td>
            <td class="p-3">
                <input type="number" class="w-16 p-1 bg-white border border-gray-600 text-gray-700 text-center" oninput="calcularTotal()">
            </td>
        </tr>
    `;

    billetes.slice(1).forEach(valor => {
        fila.classList.add("bg-white", "text-gray-700");
        fila.innerHTML = `
            <td class="p-3">$${valor}</td>
            <td class="p-3">
                <input type="number" class="w-16 p-1 bg-white border border-gray-600 text-gray-700 text-center" oninput="calcularTotal('${divisa.codigo}')">
            </td>
        `;
        tbody.appendChild(fila);
    });
}

function calcularTotal(codigoDivisa) {
    let totalArqueo = 0;
    const inputs = document.querySelectorAll('#tbody-arqueo input');
    const billetes = [100, 50, 20, 10, 5, 1];
    
    inputs.forEach((input, index) => {
        totalArqueo += (parseInt(input.value) || 0) * billetes[index];
    });
    
    document.getElementById('total-arqueo').textContent = `$${totalArqueo}`;
    const totalSistema = parseInt(document.getElementById('total-sistema').textContent.replace('$', ''));
    const diferencia = totalArqueo - totalSistema;
    
    document.getElementById('diferencia-caja').textContent = `$${diferencia}`;
    document.getElementById(`diferencia-${codigoDivisa}`).textContent = diferencia;
}

document.getElementById("guardar-arqueo").addEventListener("click", function() {
    fetch("https://cambiosorion.cl/data/get_divisas_arqueo.php")
        .then(response => response.json())
        .then(divisas => {
            let todasCero = divisas.every(divisa => parseFloat(document.getElementById(`diferencia-${divisa.codigo}`).textContent) === 0);
            
            if (!todasCero) {
                alert("Aún hay diferencias en las divisas. No se puede guardar la cuadratura.");
                return;
            }
            guardarCuadratura(divisas);
        })
        .catch(error => console.error("Error al verificar diferencias:", error));
});

function guardarCuadratura(divisas) {
    fetch("https://cambiosorion.cl/data/guardar_arqueo.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ divisas: divisas })
    })
    .then(response => response.text())
    .then(data => {
        alert("Cuadratura guardada exitosamente.");
        console.log(data);
    })
    .catch(error => console.error("Error al guardar la cuadratura:", error));
}
