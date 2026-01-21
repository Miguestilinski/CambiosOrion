import { initCajaHeader } from './header.js';

document.addEventListener('DOMContentLoaded', async() => {
    await initCajaHeader('index');
    
    // Variables y Elementos DOM
    let usuarioSesion = null;
    const tablaInventarios = document.getElementById("tabla-inventario");
    const borrarFiltrosBtn = document.getElementById("borrar-filtros");
    const exportarBtn = document.getElementById("exportar");
    
    // Objeto Filtros
    const filtros = {
        divisa: document.getElementById("divisa-input"),
        buscar: document.getElementById("buscar"),
        mostrar: document.getElementById("mostrar-registros")
    };

    function cargarSidebar() {
        fetch('sidebar.html')
            .then(response => response.text())
            .then(html => {
                const container = document.getElementById('sidebar-container');
                if (container) {
                    container.innerHTML = html;
                    activarLinkSidebar('inventario');
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

            usuarioSesion = data;

            const headerName = document.getElementById('header-user-name');
            const headerEmail = document.getElementById('dropdown-user-email');
            
            if (headerName) headerName.textContent = data.nombre ? data.nombre.split(' ')[0] : 'Admin';
            if (headerEmail) headerEmail.textContent = data.correo;

            // Iniciar carga de datos
            cargarDivisas();
            obtenerInventarios();

        } catch (error) {
            console.error("Error sesión:", error);
        }
    }

    // --- CARGAR LISTA DIVISAS (Para Datalist) ---
    function cargarDivisas() {
        fetch('https://cambiosorion.cl/data/divisas_api.php')
            .then(response => response.json())
            .then(data => {
                const dataList = document.getElementById('divisa-list');
                if (dataList && Array.isArray(data)) {
                    dataList.innerHTML = '';
                    data.forEach(divisa => {
                        const option = document.createElement('option');
                        option.value = divisa.nombre;
                        dataList.appendChild(option);
                    });
                }
            })
            .catch(err => console.error("Error cargando lista divisas:", err));
    }

    // --- LÓGICA PRINCIPAL DE DATOS ---
    function obtenerInventarios() {
        if (!usuarioSesion || !usuarioSesion.caja_id) return;

        const params = new URLSearchParams();
        params.set('caja_id', usuarioSesion.caja_id);
        
        if (filtros.divisa.value) params.set('divisa', filtros.divisa.value.trim());
        if (filtros.buscar.value) params.set('buscar', filtros.buscar.value.trim());
        if (filtros.mostrar.value) params.set('limit', filtros.mostrar.value);

        tablaInventarios.innerHTML = `<tr><td colspan="6" class="text-center py-10"><div class="animate-spin h-8 w-8 border-4 border-cyan-500 rounded-full border-t-transparent mx-auto"></div></td></tr>`;

        fetch(`https://cambiosorion.cl/data/inventario_caja.php?${params.toString()}`, { credentials: "include" })
            .then(response => response.json())
            .then(data => {
                mostrarResultados(data);
            })
            .catch(error => {
                console.error("Error al cargar inventarios:", error);
                tablaInventarios.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-red-500">Error al cargar datos.</td></tr>`;
            });
    }

    function mostrarResultados(inventarios) {
        tablaInventarios.innerHTML = '';

        if (!inventarios || inventarios.length === 0) {
            tablaInventarios.innerHTML = `<tr><td colspan="6" class="text-center py-10 text-gray-500 italic">No hay registros en el inventario.</td></tr>`;
            return;
        }

        inventarios.forEach(inv => {
            const tr = document.createElement("tr");
            tr.className = "hover:brightness-95 transition-all text-gray-800 font-medium border-b border-gray-100 last:border-0 bg-white";

            const cantidad = parseFloat(inv.cantidad) || 0;
            const pmp = parseFloat(inv.pmp) || 0;
            const totalCLP = cantidad * pmp;

            // Icono
            const icono = inv.icono || 'https://cambiosorion.cl/orionapp/icons/default.png';
            
            // Estado visual
            let estadoHtml = '';
            if (cantidad > 0) {
                estadoHtml = `<span class="px-2 py-1 rounded text-[10px] font-bold uppercase bg-green-100 text-green-700 border border-green-200">Disponible</span>`;
            } else if (cantidad < 0) {
                estadoHtml = `<span class="px-2 py-1 rounded text-[10px] font-bold uppercase bg-red-100 text-red-700 border border-red-200">Negativo</span>`;
            } else {
                estadoHtml = `<span class="px-2 py-1 rounded text-[10px] font-bold uppercase bg-gray-100 text-gray-500 border border-gray-200">Sin Stock</span>`;
            }

            const btnVer = document.createElement('button');
            btnVer.innerHTML = `<svg class="w-5 h-5 text-gray-400 hover:text-cyan-600 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>`;
            btnVer.onclick = () => window.location.href = `transacciones?divisa=${inv.divisa}`;
            btnVer.title = "Ver movimientos";

            tr.innerHTML = `
                <td class="px-4 py-3 flex items-center gap-3">
                    <img src="${icono}" alt="${inv.divisa}" class="w-8 h-8 rounded-full border border-gray-200 object-contain bg-white p-0.5 shadow-sm">
                    <span class="font-bold text-gray-700">${inv.divisa}</span>
                </td>
                <td class="px-4 py-3 text-right font-mono text-sm ${cantidad < 0 ? 'text-red-600 font-bold' : ''}">
                    ${cantidad.toLocaleString("es-CL", { minimumFractionDigits: 2 })}
                </td>
                <td class="px-4 py-3 text-right font-mono text-xs text-gray-600">
                    $${pmp.toLocaleString("es-CL", { minimumFractionDigits: 0 })}
                </td>
                <td class="px-4 py-3 text-right font-bold font-mono text-slate-800 text-sm">
                    $${totalCLP.toLocaleString("es-CL", { minimumFractionDigits: 0 })}
                </td>
                <td class="px-4 py-3 text-center">${estadoHtml}</td>
                <td class="px-4 py-3 text-center mostrar-btn-cell"></td>
            `;

            tr.querySelector('.mostrar-btn-cell').appendChild(btnVer);
            tablaInventarios.appendChild(tr);
        });
    }

    // --- EVENTOS ---
    if (borrarFiltrosBtn) {
        borrarFiltrosBtn.addEventListener('click', () => {
            filtros.divisa.value = '';
            filtros.buscar.value = '';
            filtros.mostrar.value = '25';
            obtenerInventarios();
        });
    }

    if (exportarBtn) {
        exportarBtn.addEventListener("click", () => {
            if (!usuarioSesion || !usuarioSesion.caja_id) return;
            const url = `https://cambiosorion.cl/data/exportar_inventario.php?caja_id=${usuarioSesion.caja_id}&divisa=${filtros.divisa.value}&buscar=${filtros.buscar.value}`;
            window.open(url, '_blank');
        });
    }

    Object.values(filtros).forEach(input => {
        if(input) {
            input.addEventListener('input', obtenerInventarios);
            input.addEventListener('change', obtenerInventarios);
        }
    });
});