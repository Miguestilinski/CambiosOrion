import { initCajaHeader } from './header.js';

document.addEventListener('DOMContentLoaded', async() => {
    
    const sessionData = await initCajaHeader('inventario');
    
    let currentCajaId = null;

    if (sessionData && sessionData.caja_id) {
        currentCajaId = sessionData.caja_id;
        console.log("Caja ID detectada:", currentCajaId);
    } else {
        console.warn("No se detectó caja en la sesión.");
    }

    const tablaInventarios = document.getElementById("tabla-inventario");
    const borrarFiltrosBtn = document.getElementById("borrar-filtros");
    const exportarBtn = document.getElementById("exportar");
    
    const filtros = {
        divisa: document.getElementById("divisa-input"),
        buscar: document.getElementById("buscar"),
        mostrar: document.getElementById("mostrar-registros")
    };

    cargarDivisas();
    obtenerInventarios();

    function cargarDivisas() {
        fetch('https://cambiosorion.cl/data/divisas_api.php')
            .then(res => res.json())
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
            .catch(err => console.error(err));
    }

    function obtenerInventarios() {
        const cajaIdParam = currentCajaId ? currentCajaId : 0;
        const params = new URLSearchParams();
        
        params.set('caja', cajaIdParam);
        
        if (filtros.divisa.value) params.set('divisa', filtros.divisa.value.trim());
        if (filtros.buscar.value) params.set('buscar', filtros.buscar.value.trim());
        if (filtros.mostrar.value) params.set('limite', filtros.mostrar.value);

        if(tablaInventarios) {
            tablaInventarios.innerHTML = `<tr><td colspan="6" class="text-center py-10"><div class="animate-spin h-8 w-8 border-4 border-cyan-500 rounded-full border-t-transparent mx-auto"></div></td></tr>`;
        }

        fetch(`https://cambiosorion.cl/data/inv-caja.php?${params.toString()}`, { credentials: "include" })
            .then(response => response.json())
            .then(data => {
                if (data.success === false) {
                    if(tablaInventarios) tablaInventarios.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-red-500">${data.error}</td></tr>`;
                } else {
                    mostrarResultados(data);
                }
            })
            .catch(error => {
                console.error(error);
                if(tablaInventarios) tablaInventarios.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-red-500">Error de conexión.</td></tr>`;
            });
    }

    function mostrarResultados(inventarios) {
        if(!tablaInventarios) return;
        tablaInventarios.innerHTML = '';

        if (!inventarios || inventarios.length === 0) {
            tablaInventarios.innerHTML = `<tr><td colspan="6" class="text-center py-10 text-gray-500 italic">No hay registros.</td></tr>`;
            return;
        }

        inventarios.forEach(inv => {
            const tr = document.createElement("tr");
            tr.className = "hover:brightness-95 transition-all text-gray-800 font-medium border-b border-gray-100 last:border-0 bg-white";

            const cantidad = parseFloat(inv.cantidad) || 0;
            const pmp = parseFloat(inv.pmp) || 0;
            const totalCLP = cantidad * pmp;
            const icono = inv.icono || 'https://cambiosorion.cl/orionapp/icons/default.png';
            
            // CORRECCION VISUAL: Mostrar Nombre (ej: Dolar) y Codigo (ej: USD)
            const nombreMostrar = inv.nombre_divisa || inv.divisa_codigo;
            
            let estadoHtml = '';
            if (cantidad > 0) estadoHtml = `<span class="px-2 py-1 rounded text-[10px] font-bold uppercase bg-green-100 text-green-700 border border-green-200">Disponible</span>`;
            else if (cantidad < 0) estadoHtml = `<span class="px-2 py-1 rounded text-[10px] font-bold uppercase bg-red-100 text-red-700 border border-red-200">Negativo</span>`;
            else estadoHtml = `<span class="px-2 py-1 rounded text-[10px] font-bold uppercase bg-gray-100 text-gray-500 border border-gray-200">Sin Stock</span>`;

            const btnVer = document.createElement('button');
            btnVer.innerHTML = `<svg class="w-5 h-5 text-gray-400 hover:text-cyan-600 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>`;
            
            // Enlace corregido enviando el ID correcto
            btnVer.onclick = () => {
                window.location.href = `detalle-div.html?id=${inv.divisa_codigo}&caja_id=${currentCajaId}`;
            };

            tr.innerHTML = `
                <td class="px-4 py-3 flex items-center gap-3">
                    <img src="${icono}" class="w-8 h-8 rounded-full border border-gray-200 object-contain bg-white p-0.5 shadow-sm">
                    <div class="flex flex-col">
                        <span class="font-bold text-gray-700 text-sm">${nombreMostrar}</span>
                        <span class="text-[10px] text-gray-400 font-mono">${inv.divisa_codigo}</span>
                    </div>
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
            if (!currentCajaId) {
                alert("No se ha detectado una caja activa.");
                return;
            }
            const divisaVal = filtros.divisa.value;
            const buscarVal = filtros.buscar.value;
            const url = `https://cambiosorion.cl/data/exportar_inventario.php?caja_id=${currentCajaId}&divisa=${divisaVal}&buscar=${buscarVal}`;
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