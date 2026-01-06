// Variable global para almacenar datos de sesión
let usuarioSesion = null;

// --- 1. ACTUALIZACIÓN DE getSession (Para disparar la carga de datos) ---
async function getSession() {
    try {
        const res = await fetch("https://cambiosorion.cl/data/session_status_admin.php", { credentials: "include" });
        if (!res.ok) throw new Error("Error sesión");
        const data = await res.json();
        
        if (!data.isAuthenticated || !data.equipo_id) {
            window.location.href = 'https://admin.cambiosorion.cl/login';
            return;
        }

        // Guardamos sesión globalmente
        usuarioSesion = data;

        const headerName = document.getElementById('header-user-name');
        const headerEmail = document.getElementById('dropdown-user-email');
        
        if (headerName) headerName.textContent = data.nombre ? data.nombre.split(' ')[0] : 'Admin';
        if (headerEmail) headerEmail.textContent = data.correo;

        // UNA VEZ TENEMOS LA CAJA, CARGAMOS LOS DATOS
        cargarDivisas();
        cargarInventarios();

    } catch (error) {
        console.error("Error sesión:", error);
    }
}

// --- 2. CARGAR LISTA DE DIVISAS (Para el input con datalist) ---
function cargarDivisas() {
    fetch('https://cambiosorion.cl/data/divisas_api.php')
        .then(response => response.json())
        .then(data => {
            const dataList = document.getElementById('divisa-list');
            if (dataList) {
                dataList.innerHTML = '';
                // Agregamos opción "Todas"
                // dataList.innerHTML = '<option value="Todas">'; 
                
                data.forEach(divisa => {
                    const option = document.createElement('option');
                    option.value = divisa.nombre; // Ej: USD
                    dataList.appendChild(option);
                });
            }
        })
        .catch(err => console.error("Error cargando lista divisas:", err));
}

// --- 3. CARGAR INVENTARIO (Datos de la tabla) ---
function cargarInventarios() {
    if (!usuarioSesion || !usuarioSesion.caja_id) return;

    const divisaInput = document.getElementById("divisa-input");
    const buscarInput = document.getElementById("buscar");
    const mostrarRegistros = document.getElementById("mostrar-registros");
    const tablaInventarios = document.querySelector("table tbody");

    const params = new URLSearchParams();
    params.set('caja_id', usuarioSesion.caja_id);
    
    if (divisaInput && divisaInput.value) params.set('divisa', divisaInput.value);
    if (buscarInput && buscarInput.value) params.set('buscar', buscarInput.value);
    if (mostrarRegistros) params.set('limit', mostrarRegistros.value);

    // Spinner
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

// --- 4. RENDERIZAR TABLA ---
function mostrarResultados(inventarios) {
    const tablaInventarios = document.querySelector("table tbody");
    tablaInventarios.innerHTML = '';

    if (!inventarios || inventarios.length === 0) {
        tablaInventarios.innerHTML = `<tr><td colspan="6" class="text-center py-10 text-gray-500 italic">No hay registros en el inventario.</td></tr>`;
        return;
    }

    inventarios.forEach(inv => {
        const tr = document.createElement("tr");
        tr.className = "hover:bg-gray-50 border-b border-gray-100 transition text-gray-800 font-medium";

        // Formateo de números
        const cantidad = parseFloat(inv.cantidad) || 0;
        const pmp = parseFloat(inv.pmp) || 0; // Precio Medio Ponderado
        const totalCLP = cantidad * pmp;

        // Estilo condicional para saldo negativo (si aplica)
        const saldoClass = cantidad < 0 ? "text-red-600" : "text-slate-800";

        // Icono de divisa (si viene del backend, sino default)
        const icono = inv.icono || 'https://cambiosorion.cl/orionapp/icons/default.png';

        tr.innerHTML = `
            <td class="px-4 py-3 flex items-center gap-3">
                <img src="${icono}" alt="${inv.divisa}" class="w-8 h-8 rounded-full border border-gray-200 object-contain bg-white">
                <span class="font-bold text-gray-700">${inv.divisa}</span>
            </td>
            <td class="px-4 py-3 text-right font-mono text-sm ${saldoClass}">
                ${cantidad.toLocaleString("es-CL", { minimumFractionDigits: 2 })}
            </td>
            <td class="px-4 py-3 text-right font-mono text-xs text-gray-600">
                $${pmp.toLocaleString("es-CL", { minimumFractionDigits: 0 })}
            </td>
            <td class="px-4 py-3 text-right font-bold font-mono text-slate-900 text-sm">
                $${totalCLP.toLocaleString("es-CL", { minimumFractionDigits: 0 })}
            </td>
            <td class="px-4 py-3 text-center">
                <span class="px-2 py-1 rounded text-[10px] font-bold uppercase bg-green-100 text-green-700 border border-green-200">
                    Disponible
                </span>
            </td>
            <td class="px-4 py-3 text-center">
                <button class="text-gray-400 hover:text-cyan-600 transition" onclick="window.location.href='transacciones?divisa=${inv.divisa}'" title="Ver movimientos">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                </button>
            </td>
        `;

        tablaInventarios.appendChild(tr);
    });
}

// --- 5. EXPORTAR (Botón) ---
const exportarBtn = document.getElementById("exportar");
if (exportarBtn) {
    exportarBtn.addEventListener("click", () => {
        if (!usuarioSesion || !usuarioSesion.caja_id) return;
        
        // Redirigir para descargar Excel
        const divisaVal = document.getElementById("divisa-input")?.value || "";
        const url = `https://cambiosorion.cl/data/exportar_inventario.php?caja_id=${usuarioSesion.caja_id}&divisa=${divisaVal}`;
        window.open(url, '_blank');
    });
}