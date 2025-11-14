document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const arqueoId = params.get("id");

    const infoContenedor = document.getElementById("info-arqueo");
    const detalleContenedor = document.getElementById("detalle-divisas-arqueo");
    const volverBtn = document.getElementById("volver-historial");
    const prevBtn = document.getElementById("btn-dia-anterior");
    const nextBtn = document.getElementById("btn-dia-siguiente");

    if (!arqueoId) {
        infoContenedor.innerHTML = "<p>ID de arqueo no proporcionado.</p>";
        return;
    }

    if (volverBtn) {
        volverBtn.addEventListener('click', () => {
            window.location.href = 'https://tesoreria.cambiosorion.cl/historial-inv';
        });
    }

    // --- Helpers de formato ---
    const formatearFecha = (timestamp) => {
        if (!timestamp) return ''; 
        const fecha = new Date(timestamp);
        if (isNaN(fecha.getTime())) return timestamp;
        const hh = String(fecha.getHours()).padStart(2, '0');
        const min = String(fecha.getMinutes()).padStart(2, '0');
        const dd = String(fecha.getDate()).padStart(2, '0');
        const mm = String(fecha.getMonth() + 1).padStart(2, '0');
        const yyyy = fecha.getFullYear();
        return `${hh}:${min} ${dd}/${mm}/${yyyy}`;
    };

    const formatNumber = (num, simbolo = '') => {
        const n = parseFloat(num);
        if (isNaN(n)) return num;
        
        const formatOptions = {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        };
        
        let formatted = n.toLocaleString('es-CL', formatOptions);
        
        if (n > 0) formatted = `+${formatted}`;
        if (n === 0) formatted = "0";

        return `${simbolo} ${formatted}`;
    };

    const formatPMP = (num) => {
        const n = parseFloat(num);
        if (isNaN(n) || n === 0) return 'N/A';
        return n.toLocaleString('es-CL', {
            style: 'currency', 
            currency: 'CLP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        });
    };

    // --- Función de Carga ---
    function cargarDetalle(id) {
        infoContenedor.innerHTML = "Cargando...";
        detalleContenedor.innerHTML = "";
        prevBtn.disabled = true;
        nextBtn.disabled = true;

        fetch(`https://cambiosorion.cl/data/detalle-arqueo.php?id=${id}`)
            .then(res => res.text())
            .then(text => {
                console.log("Respuesta cruda detalle:", text);
                const data = JSON.parse(text);

                if (data.error) {
                    infoContenedor.innerHTML = `<p>${data.error}</p>`;
                    return;
                }

                // 1. Poblar Info Maestra
                const arq = data.arqueo;
                const infoHTML = `
                    <div><span class="font-semibold text-gray-300">Fecha:</span> ${formatearFecha(arq.fecha)}</div>
                    <div><span class="font-semibold text-gray-300">Caja:</span> ${arq.nombre_caja}</div>
                    <div><span class="font-semibold text-gray-300">Usuario:</span> ${arq.nombre_usuario}</div>
                    <div><span class="font-semibold text-gray-300">Observación:</span> ${arq.observacion || 'Ninguna'}</div>
                `;
                infoContenedor.innerHTML = infoHTML;

                // 2. Poblar Tabla de Detalle
                const detalles = data.detalles || [];
                if (detalles.length === 0) {
                    detalleContenedor.innerHTML = '<p class="text-white p-4 bg-gray-800 rounded">No se guardaron detalles para este arqueo.</p>';
                } else {
                    const tablaHTML = `
                        <table class="w-full text-sm text-left text-white bg-gray-800">
                            <thead class="text-xs uppercase bg-gray-800 text-white">
                                <tr>
                                    <th class="px-4 py-2">Icono</th>
                                    <th class="px-4 py-2">Divisa</th>
                                    <th class="px-4 py-2">Total Sistema</th>
                                    <th class="px-4 py-2">Total Arqueo</th>
                                    <th class="px-4 py-2">Diferencia</th>
                                    <th class="px-4 py-2">PMP Histórico</th>
                                </tr>
                            </thead>
                            <tbody>
                            ${detalles.map(d => {
                                const dif = parseFloat(d.diferencia);
                                let difClase = 'text-green-600';
                                if (dif !== 0) difClase = 'text-red-600 font-bold';

                                return `
                                <tr class="border-b bg-white border-gray-700 text-gray-700">
                                    <td class="px-4 py-2">
                                        ${d.icono ? `<img src="${d.icono}" alt="${d.nombre_divisa}" class="w-6 h-6 rounded-full border border-gray-400">` : ''}
                                    </td>
                                    <td class="px-4 py-2">${d.nombre_divisa} (${d.divisa_id})</td>
                                    <td class="px-4 py-2">${formatNumber(d.total_sistema, d.simbolo)}</td>
                                    <td class="px-4 py-2">${formatNumber(d.total_arqueo, d.simbolo)}</td>
                                    <td class="px-4 py-2 ${difClase}">${formatNumber(dif, d.simbolo)}</td>
                                    <td class="px-4 py-2">${formatPMP(d.pmp_historico)}</td>
                                </tr>
                                `;
                            }).join("")}
                            </tbody>
                        </table>
                    `;
                    detalleContenedor.innerHTML = tablaHTML;
                }

                // 3. Configurar Navegación
                const nav = data.navegacion;
                if (nav.prev_id) {
                    prevBtn.disabled = false;
                    prevBtn.onclick = () => {
                        // Actualizar URL y recargar datos
                        window.history.pushState({}, '', `?id=${nav.prev_id}`);
                        cargarDetalle(nav.prev_id);
                    };
                } else {
                    prevBtn.disabled = true;
                }

                if (nav.next_id) {
                    nextBtn.disabled = false;
                    nextBtn.onclick = () => {
                        window.history.pushState({}, '', `?id=${nav.next_id}`);
                        cargarDetalle(nav.next_id);
                    };
                } else {
                    nextBtn.disabled = true;
                }

            })
            .catch(err => {
                console.error(err);
                infoContenedor.innerHTML = "<p>Error al cargar el detalle del arqueo.</p>";
            });
    }

    // Carga inicial
    cargarDetalle(arqueoId);
});