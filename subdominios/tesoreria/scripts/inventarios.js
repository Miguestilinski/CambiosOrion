document.addEventListener("DOMContentLoaded", () => {
    const mostrarRegistros = document.getElementById("mostrar-registros");
    const buscarInput = document.getElementById("buscar");
    const cajaInput = document.getElementById("caja");
    const divisaInput = document.getElementById("divisa");
    const tablaInventarios = document.querySelector("table tbody");
    const exportarBtn = document.getElementById("exportar");

    if (exportarBtn) {
        exportarBtn.addEventListener("click", () => {
            window.location.href = "https://cambiosorion.cl/data/exportar_inventarios_excel.php";
        });
    }

    function cargarDivisas() {
        fetch("https://cambiosorion.cl/data/inventarios.php")
            .then(res => res.text())  // Leer respuesta como texto
            .then(text => {
                try {
                    const data = JSON.parse(text);
                    divisaInput.innerHTML = `<option value="">Seleccionar</option>`;
                    data.forEach(divisa => {
                        const opt = document.createElement("option");
                        opt.value = divisa.id;
                        opt.textContent = divisa.nombre;
                        divisaInput.appendChild(opt);
                    });
                } catch(e) {
                    console.error("Error parseando JSON divisas:", e);
                }
            })
            .catch(error => console.error("Error al cargar divisas:", error));
    }

    Number(inv.cantidad).toLocaleString("es-CL", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

    function cargarInventarios() {
        const params = new URLSearchParams();
        if(cajaInput.value) params.set("caja", cajaInput.value);
        if(divisaInput.value) params.set("divisa", divisaInput.value);
        if(buscarInput.value) params.set("buscar", buscarInput.value);
        if(mostrarRegistros.value) params.set("limite", mostrarRegistros.value);

        fetch(`https://cambiosorion.cl/data/inventarios.php?${params.toString()}`)
            .then(res => res.text())  // Leer respuesta como texto
            .then(text => {
                try {
                    const inventarios = JSON.parse(text);
                    tablaInventarios.innerHTML = "";

                    inventarios.forEach(inv => {
                        const tr = document.createElement("tr");
                        tr.classList.add("border-b", "bg-white", "border-gray-700", "text-gray-700");

                        const btnMostrar = document.createElement("button");
                        btnMostrar.textContent = "Mostrar";
                        btnMostrar.className = "text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-sm px-3 py-1";
                        btnMostrar.addEventListener("click", () => {
                            window.location.href = `https://cambiosorion.cl/data/detalle-inv.php?id=${inv.id}`;
                        });

                        tr.innerHTML = `
                            <td class="px-4 py-2">${inv.nombre_caja}</td>
                            <td class="px-4 py-2">
                                <img src="${inv.icono}" alt="Icono" class="w-6 h-6 rounded-full border border-gray-400" />
                            </td>
                            <td class="px-4 py-2">${inv.divisa}</td>
                            <td class="px-4 py-2">${Number(inv.cantidad).toLocaleString("es-CL")}</td>
                            <td class="px-4 py-2">${Number(inv.pmp).toLocaleString("es-CL")}</td>
                            <td class="px-4 py-2 mostrar-btn-cell"></td>
                        `;

                        tr.querySelector('.mostrar-btn-cell').appendChild(btnMostrar);
                        tablaInventarios.appendChild(tr);
                    });
                } catch(e) {
                    console.error("Error parseando JSON inventarios:", e);
                }
            })
            .catch(error => console.error("Error al cargar inventarios:", error));
    }

    [cajaInput, divisaInput, buscarInput, mostrarRegistros].forEach(el => {
        el.addEventListener("input", cargarInventarios);
    });

    cargarDivisas();
    cargarInventarios();
});
