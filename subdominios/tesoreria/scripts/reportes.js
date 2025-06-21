document.addEventListener("DOMContentLoaded", () => {
    let graficoUtilidad = null;

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

        // Primero ocultar todos
        [diaWrapper, mesWrapper, añoWrapper, trimestreWrapper].forEach(w => w.classList.add("hidden"));

        // Mostrar los activos
        activos.forEach(w => w.classList.remove("hidden"));
    }

    async function cargarGraficoUtilidad() {
        const periodo = getPeriodoSeleccionado();
        const dia = document.getElementById("dia").value;
        const mes = document.getElementById("mes").value;
        const trimestre = document.getElementById("trimestre")?.value || "";
        const año = document.getElementById("año").value;
        const nPeriodos = nPeriodosInput.value;

        const params = new URLSearchParams({
        periodo,
        dia,
        mes,
        trimestre,
        año,
        n_periodos: nPeriodos
        });

        const res = await fetch(`https://cambiosorion.cl/data/reportes.php?${params.toString()}`);
        const data = await res.json();

        const labels = data.map(d => d.label);
        const utilidades = data.map(d => d.utilidad);

        const canvas = document.getElementById("grafico-utilidad");
        canvas.setAttribute("height", "300");
        const ctx = canvas.getContext("2d");

        if (graficoUtilidad !== null) {
            graficoUtilidad.destroy();
        }

        graficoUtilidad = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
            label: 'Utilidad (CLP)',
            data: utilidades,
            backgroundColor: 'rgba(59, 130, 246, 0.7)',
            borderColor: 'rgba(59, 130, 246, 1)',
            borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false, // Está bien, pero el height debe ser explícito
            scales: {
            y: {
                beginAtZero: true
            }
            }
        }
        });
    }

    periodoRadios.forEach(radio => {
        radio.addEventListener("change", () => {
        actualizarVisibilidadInputs();
        cargarGraficoUtilidad();
        });
    });

    ["dia", "mes", "trimestre", "año", "n-periodos"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener("change", cargarGraficoUtilidad);
    });

    actualizarVisibilidadInputs();
    cargarGraficoUtilidad();
});
