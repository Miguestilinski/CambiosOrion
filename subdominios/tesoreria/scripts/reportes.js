document.addEventListener("DOMContentLoaded", () => {
    let graficoUtilidad = null;
    let graficoCompras = null;
    let graficoVentas = null;

    const periodoRadios = Array.from(document.querySelectorAll('input[name="filtro-periodo"]'));
    const diaWrapper = document.getElementById("dia").closest("div");
    const mesWrapper = document.getElementById("mes").closest("div");
    const añoWrapper = document.getElementById("año").closest("div");
    const trimestreWrapper = document.getElementById("trimestre-wrapper");
    const nPeriodosInput = document.getElementById("n-periodos");

    const inputsPorPeriodo = {
        dia: [diaWrapper, mesWrapper, añoWrapper],
        mes: [mesWrapper, añoWrapper],
        trimestre: [trimestreWrapper, añoWrapper],
        año: [añoWrapper]
    };

    function getPeriodoSeleccionado() {
        const seleccionado = periodoRadios.find(radio => radio.checked);
        return seleccionado ? seleccionado.value : "dia";
    }

    function actualizarVisibilidadInputs() {
        const seleccionado = getPeriodoSeleccionado();
        const activos = inputsPorPeriodo[seleccionado];

        [diaWrapper, mesWrapper, añoWrapper, trimestreWrapper].forEach(w => w.classList.add("hidden"));
        activos.forEach(w => w.classList.remove("hidden"));
    }

    async function cargarReportes() {
        const tipo = document.getElementById("tipo-reporte").value;
        const periodo = getPeriodoSeleccionado();
        const dia = document.getElementById("dia").value;
        const mes = document.getElementById("mes").value;
        const trimestre = document.getElementById("trimestre")?.value || "";
        const año = document.getElementById("año").value;
        const nPeriodos = nPeriodosInput.value;

        console.log(`Pidiendo reporte: tipo=${tipo}, periodo=${periodo}, dia=${dia}, mes=${mes}, trimestre=${trimestre}, año=${año}, n_periodos=${nPeriodos}`);

        const params = new URLSearchParams({ tipo, periodo, dia, mes, trimestre, año, n_periodos: nPeriodos });
        const res = await fetch(`https://cambiosorion.cl/data/reportes.php?${params.toString()}`);
        const data = await res.json();

        console.log("Data recibida:", data);

        renderGraficoUtilidad(data.utilidad_por_periodo);
        renderTablaPosiciones(data.posiciones_divisas);
        renderGraficoYTabla("compras", data.compras_divisas);
        renderGraficoYTabla("ventas", data.ventas_divisas);
    }

    function renderGraficoUtilidad(datos) {
        const canvas = document.getElementById("grafico-utilidad");
        const container = canvas.parentElement;
        const dpr = window.devicePixelRatio || 1;
        canvas.style.width = container.clientWidth + "px";
        canvas.style.height = container.clientHeight + "px";
        canvas.width = container.clientWidth * dpr;
        canvas.height = container.clientHeight * dpr;

        const ctx = canvas.getContext("2d");

        if (graficoUtilidad !== null) graficoUtilidad.destroy();

        graficoUtilidad = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: datos.map(d => d.label),
                datasets: [{
                    label: 'Utilidad (CLP)',
                    data: datos.map(d => d.utilidad),
                    backgroundColor: 'rgba(59, 130, 246, 0.7)',
                    borderColor: 'rgba(59, 130, 246, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }

    function renderTablaPosiciones(posiciones) {
        const contenedor = document.getElementById("tabla-posiciones");

        if (!posiciones.length) {
            contenedor.innerHTML = `<tr><td colspan="8" class="text-center py-4">Sin datos disponibles</td></tr>`;
            return;
        }

        contenedor.innerHTML = ""; // Limpiar contenido anterior

        posiciones.forEach(p => {
            const tr = document.createElement("tr");
            tr.className = "border-b bg-white border-gray-700 text-gray-700";

            const iconoHTML = p.icono
                ? `<img src="${p.icono}" alt="${p.nombre}" class="w-6 h-6 rounded-full border border-gray-400" />`
                : "";

            tr.innerHTML = `
                <td class="px-4 py-2 flex items-center gap-2">${iconoHTML}<span>${p.nombre}</span></td>
                <td class="px-4 py-2">${Number(p.cantidad).toLocaleString("es-CL")}</td>
                <td class="px-4 py-2">${Number(p.pmp).toLocaleString("es-CL")}</td>
                <td class="px-4 py-2">${Number(p.valor_clp).toLocaleString("es-CL")}</td>
                <td class="px-4 py-2">${Number(p.cantidad).toLocaleString("es-CL")}</td>
                <td class="px-4 py-2">${Number(p.pmp).toLocaleString("es-CL")}</td>
                <td class="px-4 py-2">${Number(p.valor_clp).toLocaleString("es-CL")}</td>
                <td class="px-4 py-2">0</td>
            `;

            contenedor.appendChild(tr);
        });
    }

    function renderGraficoYTabla(tipo, datos) {
        const tabla = document.getElementById(`tabla-${tipo}`);

        if (datos.length === 0) {
            tabla.innerHTML = `<tr><td colspan="6" class="text-center py-4">Sin datos disponibles</td></tr>`;
            return;
        }

        tabla.innerHTML = ""; // Limpiar contenido previo

        datos.forEach(d => {
            const iconoHTML = d.icono
                ? `<img src="${d.icono}" alt="${d.nombre}" class="w-6 h-6 rounded-full border border-gray-400" />`
                : "";

            const tr = document.createElement("tr");
            tr.className = "border-b bg-white border-gray-700 text-gray-700";

            tr.innerHTML = `
                <td class="px-4 py-2 flex items-center gap-2">${iconoHTML}<span>${d.nombre}</span></td>
                <td class="px-4 py-2">${Number(d.cantidad).toLocaleString("es-CL")}</td>
                <td class="px-4 py-2">${Number(d.promedio).toLocaleString("es-CL")}</td>
                <td class="px-4 py-2">${Number(d.cantidad * d.promedio).toLocaleString("es-CL")}</td>
                <td class="px-4 py-2">-</td>
                <td class="px-4 py-2">-</td>
            `;

            tabla.appendChild(tr);
        });

        const canvas = document.getElementById(`grafico-${tipo}`);
        const ctx = canvas.getContext("2d");

        // Ajustar tamaño del canvas para hacerlo más pequeño
        canvas.width = 50; 
        canvas.height = 50;

        const chart = tipo === "compras" ? graficoCompras : graficoVentas;
        if (chart) chart.destroy();

        const nuevoChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: datos.map(d => d.nombre), // Mostrar nombre en la leyenda
                datasets: [{
                    label: `${tipo === 'compras' ? 'Compras' : 'Ventas'} (CLP)`,
                    data: datos.map(d => d.cantidad * d.promedio),
                    backgroundColor: datos.map((_, i) =>
                        `hsl(${(i * 50) % 360}, 70%, 60%)`
                    ),
                    borderColor: 'white',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'right', // Opcional, para mejorar estética
                        labels: {
                            boxWidth: 12,
                            padding: 10,
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                const label = context.label || '';
                                const value = context.raw;
                                const total = context.dataset.data.reduce((sum, val) => sum + val, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: ${value.toLocaleString()} CLP (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });

        if (tipo === "compras") graficoCompras = nuevoChart;
        if (tipo === "ventas") graficoVentas = nuevoChart;
    }

    periodoRadios.forEach(radio => {
        radio.addEventListener("change", () => {
            actualizarVisibilidadInputs();
            cargarReportes();
        });
    });

    ["dia", "mes", "trimestre", "año", "n-periodos", "tipo-reporte"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener("change", cargarReportes);
    });

    actualizarVisibilidadInputs();
    cargarReportes();
});
