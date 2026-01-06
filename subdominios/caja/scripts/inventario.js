document.addEventListener("DOMContentLoaded", async () => {
    getSession();
    cargarSidebar();

    const mostrarRegistros = document.getElementById("mostrar-registros");
    const buscarInput = document.getElementById("buscar");
    const cajaInput = document.getElementById("caja");
    const divisaInput = document.getElementById("divisa-input");
    const divisaList = document.getElementById("divisa-list");
    const divisaHidden = document.getElementById("divisa");
    const tablaInventarios = document.querySelector("table tbody");
    const exportarBtn = document.getElementById("exportar");

    let divisas = [];

    function cargarSidebar() {
        fetch('sidebar.html')
            .then(response => response.text())
            .then(html => {
                const container = document.getElementById('sidebar-container');
                if (container) {
                    container.innerHTML = html;
                    activarLinkSidebar('transacciones');
                }
            });
    }

    function activarLinkSidebar(pagina) {
        setTimeout(() => {
            const links = document.querySelectorAll('#sidebar-nav a');
            links.forEach(link => {
                link.classList.remove('bg-cyan-50', 'text-cyan-800', 'border-l-4', 'border-cyan-600', 'shadow-sm', 'font-bold');
                link.classList.add('text-gray-600', 'border-transparent');
                const icon = link.querySelector('svg');
                if(icon) { icon.classList.remove('text-cyan-600'); icon.classList.add('text-gray-400'); }

                if (link.dataset.page === pagina) {
                    link.classList.remove('text-gray-600', 'border-transparent');
                    link.classList.add('bg-cyan-50', 'text-cyan-800', 'border-l-4', 'border-cyan-600', 'shadow-sm', 'font-bold');
                    if(icon) { icon.classList.remove('text-gray-400'); icon.classList.add('text-cyan-600'); }
                }
            });
        }, 100);
    }

    async function getSession() {
        try {
            const res = await fetch("https://cambiosorion.cl/data/session_status_admin.php", { credentials: "include" });
            if (!res.ok) throw new Error("Error sesión");
            const data = await res.json();
            
            if (!data.isAuthenticated || !data.equipo_id) {
                window.location.href = 'https://admin.cambiosorion.cl/login';
                return;
            }

            const headerName = document.getElementById('header-user-name');
            const headerEmail = document.getElementById('dropdown-user-email');
            
            if (headerName) headerName.textContent = data.nombre ? data.nombre.split(' ')[0] : 'Admin';
            if (headerEmail) headerEmail.textContent = data.correo;

        } catch (error) {
            console.error("Error sesión:", error);
        }
    }

    // Cargar divisas según la caja de sesión
    function cargarDivisas() {
        fetch(`https://cambiosorion.cl/data/inventarios.php?action=divisas&caja=${cajaIdSesion}`)
            .then(res => res.text())
            .then(text => {
                try {
                    const data = JSON.parse(text);
                    if (Array.isArray(data)) {
                        divisas = data;
                        mostrarOpciones("");
                    } else {
                        console.warn("Respuesta no válida:", data);
                    }
                } catch (e) {
                    console.error("Respuesta no es JSON válido:", text);
                }
            })
            .catch(error => console.error("Error al cargar divisas:", error));
    }

    function mostrarOpciones(filtro) {
        const filtroMinusculas = filtro.toLowerCase().trim();

        if (filtroMinusculas.length === 0) {
            divisaList.classList.add("hidden");
            divisaList.innerHTML = "";
            return;
        }

        const filtradas = divisas.filter(d => d.nombre && d.nombre.toLowerCase().includes(filtroMinusculas));
        divisaList.innerHTML = "";

        if (filtradas.length === 0) {
            divisaList.classList.add("hidden");
            return;
        }

        filtradas.slice(0, 4).forEach(d => {
            const li = document.createElement("li");
            li.textContent = d.nombre;
            li.dataset.id = d.id;
            li.className = "px-2 py-1 hover:bg-blue-600 hover:text-white cursor-pointer";

            li.addEventListener("click", () => {
                divisaInput.value = d.nombre;
                divisaHidden.value = d.id;
                divisaList.classList.add("hidden");
                cargarInventarios();
            });

            divisaList.appendChild(li);
        });

        divisaList.classList.remove("hidden");
    }

    // Eventos
    divisaInput.addEventListener("input", () => {
        mostrarOpciones(divisaInput.value);
        divisaHidden.value = "";
    });

    document.addEventListener("click", (e) => {
        if (!divisaInput.contains(e.target) && !divisaList.contains(e.target)) {
            divisaList.classList.add("hidden");
        }
    });

    buscarInput.addEventListener("input", cargarInventarios);
    mostrarRegistros.addEventListener("input", cargarInventarios);

    function cargarInventarios() {
        const params = new URLSearchParams();
        if (cajaIdSesion) params.set("caja", cajaIdSesion);
        if (divisaHidden.value) params.set("divisa", divisaHidden.value);
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

                            tr.querySelector(".mostrar-btn-cell").appendChild(btnMostrar);
                            tablaInventarios.appendChild(tr);
                        });
                    } else {
                        console.warn("No es un array de inventarios:", inventarios);
                    }
                } catch (e) {
                    console.error("Error parseando JSON inventarios:", e);
                }
            })
            .catch(error => console.error("Error al cargar inventarios:", error));
    }

    divisaInput.addEventListener("input", cargarInventarios);
    buscarInput.addEventListener("input", cargarInventarios);
    mostrarRegistros.addEventListener("input", cargarInventarios);

    cargarDivisas();
});
