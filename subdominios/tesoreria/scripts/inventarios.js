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

    function cargarCajas() {
        fetch("https://cambiosorion.cl/data/inventarios.php?action=cajas")
            .then(res => res.json())
            .then(cajas => {
                const cajaSelect = document.getElementById("caja");
                cajaSelect.innerHTML = "";

                cajas.forEach(caja => {
                    const option = document.createElement("option");
                    option.value = caja.id;
                    option.textContent = caja.nombre;
                    cajaSelect.appendChild(option);
                });

                const tesoreria = cajas.find(c => c.nombre.toLowerCase() === "tesoreria");
                if (tesoreria) {
                    cajaSelect.value = tesoreria.id;
                }

                // Cargar divisas e inventarios para la caja seleccionada (Tesorería o la que sea)
                cargarDivisas();
                cargarInventarios();
            })
            .catch(error => console.error("Error al cargar cajas:", error));
    }

    function cargarDivisas() {
        fetch("https://cambiosorion.cl/data/inventarios.php")
            .then(res => res.text())
            .then(text => {
                try {
                    const data = JSON.parse(text);
                    divisaInput.innerHTML = `<option value="">Seleccionar</option>`;

                    if (Array.isArray(data)) {
                        data.forEach(divisa => {
                            const opt = document.createElement("option");
                            opt.value = divisa.id;
                            opt.textContent = divisa.nombre;
                            divisaInput.appendChild(opt);
                        });
                    } else {
                        console.warn("No es un array de divisas:", data);
                    }
                } catch(e) {
                    console.error("Error parseando JSON divisas:", e);
                }
            })
            .catch(error => console.error("Error al cargar divisas:", error));
    }

    function cargarInventarios() {
        const params = new URLSearchParams();
        if (cajaInput.value) params.set("caja", cajaInput.value);
        if (divisaInput.value) params.set("divisa", divisaInput.value);
        if (buscarInput.value) params.set("buscar", buscarInput.value);
        if (mostrarRegistros.value) params.set("limite", mostrarRegistros.value);

        fetch(`https://cambiosorion.cl/data/inventarios.php?${params.toString()}`)
            .then(res => res.text())
            .then(text => {
                try {
                    const inventarios = JSON.parse(text);
                    tablaInventarios.innerHTML = "";

                    if (Array.isArray(inventarios)) {
                        inventarios.forEach(inv => {
                            const tr = document.createElement("tr");
                            tr.classList.add("border-b", "bg-white", "border-gray-700", "text-gray-700");

                            const btnMostrar = document.createElement("button");
                            btnMostrar.textContent = "Mostrar";
                            btnMostrar.className = "text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-sm px-3 py-1";
                            btnMostrar.addEventListener("click", () => {
                                window.location.href = `https://cambiosorion.cl/data/detalle-inv?id=${inv.id}`;
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
                    } else {
                        console.warn("No es un array de inventarios:", inventarios);
                    }
                } catch(e) {
                    console.error("Error parseando JSON inventarios:", e);
                }
            })
            .catch(error => console.error("Error al cargar inventarios:", error));
    }

    // Cuando cambie la caja, recargar inventarios (y quizás divisas)
    cajaInput.addEventListener("input", () => {
        cargarDivisas();
        cargarInventarios();
    });

    divisaInput.addEventListener("input", cargarInventarios);
    buscarInput.addEventListener("input", cargarInventarios);
    mostrarRegistros.addEventListener("input", cargarInventarios);

    cargarCajas();
});