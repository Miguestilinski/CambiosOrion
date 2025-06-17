let caja_id = null;
let usuarioSesion = null;

document.addEventListener("DOMContentLoaded", function() {
    obtenerSesion();
});

async function obtenerSesion() {
    try {
        const res = await fetch("https://cambiosorion.cl/data/session_status.php", {
            credentials: "include",
        });
        if (!res.ok) throw new Error("No se pudo obtener la sesión.");

        const data = await res.json();
        usuarioSesion = data;
        caja_id = usuarioSesion.caja_id;

        console.log("Caja ID desde sesión:", caja_id);
        await cargarDivisas(caja_id);
    } catch (error) {
        console.error("Error al obtener la sesión:", error);
    }
}

async function cargarDivisas(cajaId) {
    try {
        let response = await fetch(`https://cambiosorion.cl/data/arqueo-caja.php?caja_id=${cajaId}`);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        
        let data = await response.json();
        let divisas = data.divisas;
        
        // Filtrar divisas duplicadas (basado en código)
        divisas = divisas.filter((value, index, self) =>
            index === self.findIndex((t) => (
                t.codigo === value.codigo
            ))
        );

        // Filtrar divisas según su tipo
        divisas = divisas.filter(divisa => {
            return divisa.tipo_divisa !== 'otra'; // Excluimos divisas tipo 'otra'
        });

        // Ordenar las divisas según la lista proporcionada
        const ordenPreferido = [
            "CLP", "USD", "EUR", "ARS", "BRL", "PEN", "COP", "UYU", "BOB", "CAD", "GBP", "JPY", "CNY", 
            "SEK", "AUD", "MXN", "NZD", "CHF", "DKK", "NOK", "WON", "DOP", "DKH", "PYG", "CRC", "BSD", 
        ];

        // Ordenar divisas basándonos en el orden preferido
        divisas.sort((a, b) => {
            const indexA = ordenPreferido.indexOf(a.codigo);
            const indexB = ordenPreferido.indexOf(b.codigo);

            if (indexA !== -1 && indexB !== -1) {
                return indexA - indexB;
            }

            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;

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

            let displayText = "";
            if (divisa.tipo_divisa === "divisa") {
                displayText = `${divisa.codigo}`; // Mostrar código para divisas normales
            } else if (divisa.tipo_divisa === "moneda") {
                displayText = divisa.nombre; // Mostrar nombre para monedas de oro o plata
            } else {
                // No mostrar nada para el tipo "otra" ya que no debe aparecer
                return; 
            }

            div.innerHTML = `
                <div class="flex">
                    <img class="w-6 h-6 mr-2" src="${divisa.icono}" alt="${divisa.pais}">
                    <span class="m">${displayText}</span>
                </div>
                <div class="resumen flex text-sm">
                    <span class="text-sm">Arqueo:</span>
                    <span class="text-md" id="arqueo-${divisa.codigo}">${formatoNumero(divisa.arqueo || 0)}</span>
                </div>
                <div class="resumen flex text-sm">
                    <span class="text-sm">Diferencia:</span>
                    <span class="text-md" id="diferencia-${divisa.codigo}">${formatoNumero(divisa.diferencia || 0)}</span>
                </div>
            `;

            lista.appendChild(div);
        });

        // Agregar barra de desplazamiento
        lista.style.maxHeight = '31rem';
        lista.style.overflowY = 'auto';

    } catch (error) {
        console.error("Error al cargar divisas:", error);
    }
}

function seleccionarDivisa(divisa) {
    document.getElementById('titulo-divisa').textContent = `Detalles de ${divisa.nombre} (${divisa.codigo})`;
    document.getElementById('tabla-arqueo').classList.remove('hidden');
    document.getElementById('detalle').classList.remove('hidden');

    // Restaurar todas las divisas a su color original
    document.querySelectorAll('#divisas-lista > div').forEach(el => {
        el.classList.remove('bg-gray-800'); // Quitar selección previa
        el.classList.add('bg-gray-600'); // Restaurar color original
    });

    // Aplicar fondo oscuro solo a la divisa seleccionada
    const divSeleccionado = document.querySelector(`#divisas-lista > div[data-codigo="${divisa.codigo}"]`);
    if (divSeleccionado) {
        divSeleccionado.classList.remove('bg-gray-600'); // Quitar el color original
        divSeleccionado.classList.add('bg-gray-800'); // Aplicar color de selección
    }

    // Generar tabla de arqueo con los datos de la divisa seleccionada
    generarTablaArqueo(divisa);
}

function generarTablaArqueo(divisa) {
    const tbody = document.getElementById('tbody-arqueo');
    tbody.innerHTML = ""; // Limpiar la tabla antes de generarla

    // Simulación de un total sistema (debe configurarse dinámicamente)
    const sistemaTotal = divisa.total_sistema || 0;
    document.getElementById('tabla-arqueo').classList.remove('hidden'); // Mostrar tabla
    document.getElementById('titulo-divisa').textContent = `Arqueo de ${divisa.nombre}`;

    // Asegurar que divisa.denominacion existe y es una cadena válida
    let denominaciones = [];
    if (divisa.denominacion && typeof divisa.denominacion === "string") {
        denominaciones = divisa.denominacion.split(",").map(num => parseFloat(num.trim()));
        denominaciones.sort((a, b) => b - a); // Ordenar de mayor a menor
    }

    const cantidadesGuardadas = JSON.parse(localStorage.getItem(divisa.codigo)) || {};

    if (divisa.fraccionable && denominaciones.length > 0) {
        denominaciones.forEach((denominacion, index) => {
            let filaTotal = document.createElement("tr");
            filaTotal.classList.add("bg-white", "text-gray-700");

            let claveDenominacion = denominacion.toFixed(2); // Asegurar formato consistente
            let cantidadGuardada = cantidadesGuardadas[claveDenominacion] || 0;
            
            filaTotal.innerHTML = `
                <td class="p-3 text-center">${index === 0 ? `${divisa.simbolo} ${formatoNumero(sistemaTotal)}` : ''}</td>
                <td class="p-3 text-center">${formatoNumero(denominacion)}</td>
                <td class="p-3 text-center">
                    <input type="number" class="w-16 p-1 bg-white border border-gray-600 text-gray-700 text-center"
                        oninput="calcularTotal('${divisa.codigo}', '${divisa.simbolo}')"
                        value="${cantidadGuardada}" min="0">
                </td>
            `;
            
            tbody.appendChild(filaTotal);
        });

    } else {
        // Si la divisa NO es fraccionable, solo mostrar una fila con denominación 1
        let fila = document.createElement("tr");
        fila.classList.add("bg-white", "text-gray-700");

        let cantidadGuardada = cantidadesGuardadas[1] || 0;

        fila.innerHTML = `
            <td class="p-3 text-center" id="total-sistema">${divisa.simbolo} ${formatoNumero(sistemaTotal)}</td>
            <td class="p-3 text-center">1</td>
            <td class="p-3 text-center">
                <input type="number" class="w-16 p-1 bg-white border border-gray-600 text-gray-700 text-center"
                       oninput="calcularTotal('${divisa.codigo}', '${divisa.simbolo}')"
                       value="${cantidadGuardada}" min="0">
            </td>
        `;
        tbody.appendChild(fila);
    }

    // Recuperar las cantidades guardadas para la divisa seleccionada
    document.querySelectorAll('#tbody-arqueo tr').forEach((fila, index) => {
        const input = fila.querySelector('input');
        if (input) {
            const denominacion = parseFloat(fila.cells[1].textContent.trim());
            const claveDenominacion = denominacion.toFixed(2); // Asegura formato consistente
            input.value = cantidadesGuardadas[claveDenominacion] || 0;
        }
    });
    
    calcularTotal(divisa.codigo, divisa.simbolo);
}

function formatoNumero(valor) {
    return Number(valor).toLocaleString("es-CL");
}

function calcularTotal(codigoDivisa, simboloDivisa) {
    let totalArqueo = 0;
    const inputs = document.querySelectorAll('#tbody-arqueo input');
    const filas = document.querySelectorAll('#tbody-arqueo tr');

    let cantidades = {};

    // Calcular el total de arqueo
    filas.forEach((fila, index) => {
        let denominacion = parseFloat(fila.cells[1].textContent.trim()) || 1;
        let claveDenominacion = denominacion.toFixed(2); // Consistencia en localStorage
        let cantidad = parseInt(inputs[index].value) || 0;

        totalArqueo += cantidad * denominacion;
        cantidades[claveDenominacion] = cantidad; // Guardar con clave estandarizada
    });

    // Mostrar el total del arqueo
    document.getElementById('total-arqueo').textContent = `${simboloDivisa} ${formatoNumero(totalArqueo)}`;

    // Obtener el total del sistema
    const totalSistemaElem = document.getElementById('total-sistema');
    if (!totalSistemaElem) return; // Evita el error si el elemento no existe
    const totalSistema = parseFloat(totalSistemaElem.textContent.replace(simboloDivisa, "").trim()) || 0;
    
    // Calcular la diferencia
    let diferencia = totalArqueo - totalSistema;
    if (totalArqueo === 0 && totalSistema !== 0) {
        diferencia = -totalSistema; // La diferencia será el valor negativo de Total Sistema
    }

    // Mostrar la diferencia
    document.getElementById('diferencia-caja').textContent = `${simboloDivisa} ${formatoNumero(diferencia.toFixed(2))}`;
    document.getElementById('diferencia-caja').classList.remove("text-gray-700", "text-green-600", "text-red-600");
    document.getElementById('diferencia-caja').classList.add(diferencia === 0 ? "text-green-600" : "text-red-600");

    localStorage.setItem(codigoDivisa, JSON.stringify(cantidades));
}

function actualizarListaDivisas(codigoDivisa, totalArqueo, diferencia) {
    const divisas = document.querySelectorAll("#divisas-lista > div");
    divisas.forEach(divisa => {
        if (divisa.getAttribute("data-codigo") === codigoDivisa) {
            const arqueoElement = divisa.querySelector(".resumen > span:nth-child(2)");
            const diferenciaElement = divisa.querySelector(".resumen > span:last-child");
            
            // Verificamos que los elementos existan antes de actualizar
            if (arqueoElement && diferenciaElement) {
                // Actualizar solo el contenido de arqueo y diferencia
                arqueoElement.textContent = `Arqueo: ${simboloDivisa} ${formatoNumero(totalArqueo)}`;
                diferenciaElement.textContent = `Diferencia: ${simboloDivisa} ${formatoNumero(diferencia)}`;
            }
        }
    });
}

document.getElementById("guardar-arqueo").addEventListener("click", function() {
    fetch("https://cambiosorion.cl/data/arqueo-caja.php")
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
    fetch("https://cambiosorion.cl/data/arqueo-caja.php", {
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
