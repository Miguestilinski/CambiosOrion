document.addEventListener("DOMContentLoaded", async () => {
    function generarPeriodos() {
        const select = document.getElementById("periodo");
        const hoy = new Date();
        const periodos = [];

        for (let i = -2; i <= 1; i++) {
            const fecha = new Date(hoy.getFullYear(), hoy.getMonth() + i, 1);
            const mes = String(fecha.getMonth() + 1).padStart(2, "0");
            const anio = fecha.getFullYear();
            const value = `${mes}-${anio}`;
            periodos.push(value);
        }

        periodos.forEach((p) => {
            const option = document.createElement("option");
            option.value = p;
            option.textContent = p;
            select.appendChild(option);
        });
    }

    generarPeriodos();

    const select = document.getElementById("integrante");
    const montoInput = document.getElementById("monto");
    let integrantes = [];

    try {
    const res = await fetch("https://cambiosorion.cl/data/nueva-rem.php");
    const data = await res.json();

    if (data.success && Array.isArray(data.integrantes)) {
        integrantes = data.integrantes;

        data.integrantes.forEach((int) => {
        const option = document.createElement("option");
        option.value = int.id;
        option.textContent = int.nombre;
        select.appendChild(option);
        });
    } else {
        alert("No se pudieron cargar los integrantes.");
    }
    } catch (error) {
    console.error("Error al cargar integrantes:", error);
    alert("Error al conectar con el servidor.");
    }

    select.addEventListener("change", () => {
    const selectedId = select.value;
    const integrante = integrantes.find((i) => i.id === selectedId);
    if (integrante) {
        montoInput.value = integrante.sueldo_liquido;
    }
    });

    // Enviar formulario
    document.getElementById("form-nueva-remuneracion").addEventListener("submit", async (e) => {
    e.preventDefault();

    const periodo = document.getElementById("periodo").value.trim();
    const integranteId = document.getElementById("integrante").value;
    const monto = document.getElementById("monto").value.trim();
    const estado = document.getElementById("estado").value;

    if (!periodo || !integranteId || !monto || !estado) {
        alert("Por favor completa todos los campos.");
        return;
    }

    const body = { periodo, integranteId, monto, estado };

    try {
        const res = await fetch("https://cambiosorion.cl/data/nueva-rem.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
        });

        const text = await res.text();
        console.log("Respuesta cruda:", text);
        const data = JSON.parse(text);

        if (data.success) {
        alert("Remuneración guardada correctamente.");
        window.location.reload();
        } else {
        alert(data.error || "Error al guardar remuneración.");
        }
    } catch (err) {
        console.error("Error al conectar:", err);
        alert("Error de conexión.");
    }
    });

    document.getElementById("cancelar-remuneracion").addEventListener("click", () => {
        window.history.back();
    });

});
