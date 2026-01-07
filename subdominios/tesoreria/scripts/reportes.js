import { 
    initSystem, 
    formatearNumero, 
    mostrarModalError 
} from './index.js';

document.addEventListener('DOMContentLoaded', () => {
    initSystem('reportes');

    // Referencias
    const tipoReporteSelect = document.getElementById('tipo-reporte');
    const radiosPeriodo = document.querySelectorAll('input[name="filtro-periodo"]');
    
    // Contenedores inputs
    const wrappers = {
        dia: document.getElementById('wrapper-dia'),
        mes: document.getElementById('wrapper-mes'),
        trimestre: document.getElementById('wrapper-trimestre'),
        año: document.getElementById('wrapper-año')
    };

    // Inputs valores
    const inputs = {
        dia: document.getElementById('dia'),
        mes: document.getElementById('mes'),
        anioMes: document.getElementById('año-mes'),
        trimestre: document.getElementById('trimestre'),
        anioTrim: document.getElementById('año-trim'),
        anio: document.getElementById('año')
    };

    const tablaReporte = document.getElementById('tabla-reporte');
    const labelPeriodo = document.getElementById('label-periodo');

    // Instancias Chart.js
    let chartCompras = null;
    let chartVentas = null;

    // --- 1. CONFIGURACIÓN INICIAL ---
    
    // Setear valores por defecto (Hoy)
    const hoy = new Date();
    inputs.dia.valueAsDate = hoy;
    inputs.mes.value = String(hoy.getMonth() + 1).padStart(2, '0');
    inputs.anioMes.value = hoy.getFullYear();
    inputs.trimestre.value = Math.floor(hoy.getMonth() / 3) + 1;
    inputs.anioTrim.value = hoy.getFullYear();
    inputs.anio.value = hoy.getFullYear();

    // --- 2. LÓGICA VISUAL ---

    function actualizarInputsPeriodo() {
        const seleccionado = document.querySelector('input[name="filtro-periodo"]:checked').value;
        
        // Ocultar todos
        Object.values(wrappers).forEach(w => w.classList.add('hidden'));
        
        // Mostrar seleccionado
        if (wrappers[seleccionado]) {
            wrappers[seleccionado].classList.remove('hidden');
            wrappers[seleccionado].classList.add('flex'); // Asegurar display flex si es necesario
        }

        cargarDatos();
    }

    radiosPeriodo.forEach(radio => {
        radio.addEventListener('change', actualizarInputsPeriodo);
    });

    // Listeners para recarga automática
    [tipoReporteSelect, ...Object.values(inputs)].forEach(el => {
        el.addEventListener('change', cargarDatos);
        if(el.type === 'number') el.addEventListener('input', cargarDatos);
    });

    // --- 3. CARGA DE DATOS ---

    function cargarDatos() {
        const tipo = tipoReporteSelect.value; // Operaciones, Ingresos, etc.
        const periodo = document.querySelector('input[name="filtro-periodo"]:checked').value;
        
        const params = new URLSearchParams();
        params.set('tipo', tipo);
        params.set('periodo', periodo);

        // Agregar params específicos según periodo
        if (periodo === 'dia') params.set('dia', inputs.dia.value);
        if (periodo === 'mes') {
            params.set('mes', inputs.mes.value);
            params.set('año', inputs.anioMes.value);
        }
        if (periodo === 'trimestre') {
            params.set('trimestre', inputs.trimestre.value);
            params.set('año', inputs.anioTrim.value);
        }
        if (periodo === 'año') params.set('año', inputs.anio.value);

        // Actualizar label
        labelPeriodo.textContent = `${periodo.toUpperCase()} - ${tipo}`;

        // Loading
        tablaReporte.innerHTML = `<tr><td colspan="4" class="text-center py-10"><div class="animate-spin h-8 w-8 border-4 border-amber-500 rounded-full border-t-transparent mx-auto"></div></td></tr>`;

        fetch(`https://cambiosorion.cl/data/reportes.php?${params.toString()}`)
            .then(res => res.json())
            .then(data => {
                // data estructura esperada: { posiciones_divisas: [], compras_divisas: [], ventas_divisas: [] }
                renderizarTabla(data.posiciones_divisas || []);
                renderizarGraficos(data.compras_divisas || [], data.ventas_divisas || []);
            })
            .catch(error => {
                console.error('Error:', error);
                tablaReporte.innerHTML = `<tr><td colspan="4" class="text-center text-red-400 py-4">Error al cargar reporte.</td></tr>`;
            });
    }

    // --- 4. RENDERIZADO TABLA ---

    function renderizarTabla(datos) {
        tablaReporte.innerHTML = '';

        if (datos.length === 0) {
            tablaReporte.innerHTML = `<tr><td colspan="4" class="text-center text-slate-500 py-10 italic">Sin movimientos en este periodo.</td></tr>`;
            return;
        }

        datos.forEach(row => {
            const tr = document.createElement('tr');
            tr.className = "hover:bg-white/5 border-b border-white/5 transition";

            const nombreDivisa = row.nombre || row.divisa_id;
            const icono = row.icono || 'https://cambiosorion.cl/orionapp/icons/default.png';
            
            tr.innerHTML = `
                <td class="px-4 py-3 flex items-center gap-3">
                    <img src="${icono}" class="w-6 h-6 rounded-full border border-slate-600 bg-slate-800 p-0.5" onerror="this.src='https://cambiosorion.cl/orionapp/icons/default.png'">
                    <span class="font-bold text-white text-xs">${nombreDivisa}</span>
                </td>
                <td class="px-4 py-3 text-right font-mono text-slate-300 text-xs">${formatearNumero(row.cantidad)}</td>
                <td class="px-4 py-3 text-right font-mono text-slate-500 text-xs">$${formatearNumero(row.promedio)}</td>
                <td class="px-4 py-3 text-right font-bold font-mono text-amber-400 text-sm">$${formatearNumero(row.monto_total)}</td>
            `;
            tablaReporte.appendChild(tr);
        });
    }

    // --- 5. RENDERIZADO GRÁFICOS (Chart.js) ---

    function renderizarGraficos(compras, ventas) {
        // Destruir anteriores si existen
        if (chartCompras) chartCompras.destroy();
        if (chartVentas) chartVentas.destroy();

        // Configuración Común Dark Mode
        Chart.defaults.color = '#94a3b8'; // Slate-400
        Chart.defaults.borderColor = '#334155'; // Slate-700 (grid lines)

        // Crear Gráfico Compras
        chartCompras = createChart('grafico-compras', compras, 'Compras', ['#0ea5e9', '#38bdf8', '#7dd3fc', '#bae6fd']); // Sky Blue Palette
        
        // Crear Gráfico Ventas
        chartVentas = createChart('grafico-ventas', ventas, 'Ventas', ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0']); // Emerald Palette
    }

    function createChart(canvasId, data, label, colors) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        const labels = data.map(d => d.nombre || d.divisa_id);
        const values = data.map(d => parseFloat(d.monto_total) || 0);

        return new Chart(ctx, {
            type: 'doughnut', // Gráfico de Dona se ve moderno
            data: {
                labels: labels,
                datasets: [{
                    label: `${label} (CLP)`,
                    data: values,
                    backgroundColor: colors,
                    borderColor: '#0f172a', // Slate-900 (border matches bg)
                    borderWidth: 2,
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            color: '#e2e8f0', // White text
                            font: { size: 10 }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        titleColor: '#f59e0b', // Amber title
                        bodyColor: '#fff',
                        borderColor: '#334155',
                        borderWidth: 1,
                        callbacks: {
                            label: function(context) {
                                let label = context.label || '';
                                if (label) { label += ': '; }
                                if (context.parsed !== null) {
                                    label += '$' + formatearNumero(context.parsed);
                                }
                                return label;
                            }
                        }
                    }
                },
                layout: {
                    padding: 10
                }
            }
        });
    }

    // Inicializar
    actualizarInputsPeriodo();
});