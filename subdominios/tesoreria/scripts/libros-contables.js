import { 
    initSystem, 
    formatearNumero, 
    formatearFechaHora 
} from './index.js';

let datosSimulados = [];
let datosFiltrados = [];
let paginaActual = 1;

document.addEventListener('DOMContentLoaded', () => {
    initSystem('libros-contables');

    // Elementos DOM
    const tablaCuerpo = document.getElementById('tabla-libros');
    const conteoResultados = document.getElementById('conteo-resultados');
    const paginationControls = document.getElementById('pagination-controls');
    const borrarFiltrosBtn = document.getElementById('borrar-filtros');
    
    // Totales
    const totalDebeEl = document.getElementById('total-debe');
    const totalHaberEl = document.getElementById('total-haber');
    const totalSaldoEl = document.getElementById('total-saldo');

    // Filtros
    const filtros = {
        fechaInicio: document.getElementById("fecha-inicio"),
        fechaFin: document.getElementById("fecha-fin"),
        libro: document.getElementById("tipo-libro"),
        asiento: document.getElementById("n-asiento"),
        cuenta: document.getElementById("cuenta"),
        glosa: document.getElementById("glosa"),
        mostrar: document.getElementById("mostrar-registros")
    };

    // 1. Generar Datos Simulados (Mock Data)
    generarDatosMock();

    // 2. Iniciar Renderizado
    aplicarFiltros();

    // --- EVENTOS ---
    borrarFiltrosBtn.addEventListener('click', () => {
        Object.values(filtros).forEach(input => {
            if(!input) return;
            input.value = '';
            if(input._flatpickr) input._flatpickr.clear();
        });
        filtros.libro.value = 'diario';
        filtros.mostrar.value = '25';
        aplicarFiltros();
    });

    Object.values(filtros).forEach(input => {
        if(input) {
            input.addEventListener('input', () => { paginaActual = 1; aplicarFiltros(); });
            input.addEventListener('change', () => { paginaActual = 1; aplicarFiltros(); });
        }
    });

    function aplicarFiltros() {
        // Simular Spinner
        tablaCuerpo.innerHTML = `<tr><td colspan="8" class="text-center py-10"><div class="animate-spin h-8 w-8 border-4 border-amber-500 rounded-full border-t-transparent mx-auto"></div></td></tr>`;

        // Pequeño delay para simular red
        setTimeout(() => {
            filtrarDatos();
            renderizarTabla();
        }, 300);
    }

    function filtrarDatos() {
        const fLibro = filtros.libro.value.toLowerCase();
        const fAsiento = filtros.asiento.value.toLowerCase().trim();
        const fCuenta = filtros.cuenta.value.toLowerCase().trim();
        const fGlosa = filtros.glosa.value.toLowerCase().trim();
        
        datosFiltrados = datosSimulados.filter(item => {
            // Filtro Libro (Obligatorio en simulación)
            // if (item.libro !== fLibro) return false;

            // Filtros Texto
            if (fAsiento && !item.asiento.includes(fAsiento)) return false;
            if (fCuenta && !item.cuenta.toLowerCase().includes(fCuenta)) return false;
            if (fGlosa && !item.glosa.toLowerCase().includes(fGlosa)) return false;

            // Filtro Fechas (Simple string compare YYYY-MM-DD)
            if (filtros.fechaInicio.value && item.fecha < filtros.fechaInicio.value) return false;
            if (filtros.fechaFin.value && item.fecha > filtros.fechaFin.value) return false;

            return true;
        });
    }

    function renderizarTabla() {
        tablaCuerpo.innerHTML = '';
        
        const porPagina = parseInt(filtros.mostrar.value) || 25;
        const totalRegistros = datosFiltrados.length;
        const inicio = (paginaActual - 1) * porPagina;
        const fin = inicio + porPagina;
        
        const datosPagina = datosFiltrados.slice(inicio, fin);

        if (datosPagina.length === 0) {
            tablaCuerpo.innerHTML = `<tr><td colspan="8" class="text-center text-slate-500 py-10 italic">No se encontraron registros contables.</td></tr>`;
            actualizarTotales(0,0,0);
            conteoResultados.textContent = "0 registros";
            paginationControls.innerHTML = "";
            return;
        }

        let sumDebe = 0;
        let sumHaber = 0;

        datosPagina.forEach(row => {
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-white/5 transition-all border-b border-white/5 last:border-0 text-slate-300';

            sumDebe += row.debe;
            sumHaber += row.haber;

            // Estilos condicionales
            const debeClass = row.debe > 0 ? "text-emerald-400 font-bold" : "text-slate-600";
            const haberClass = row.haber > 0 ? "text-red-400 font-bold" : "text-slate-600";

            tr.innerHTML = `
                <td class="px-4 py-3 whitespace-nowrap text-xs">${formatearFechaHora(row.fecha + ' 10:00')}</td>
                <td class="px-4 py-3 font-mono text-xs font-bold text-amber-500">${row.asiento}</td>
                <td class="px-4 py-3 text-xs uppercase text-slate-500 font-bold">${row.tipo}</td>
                <td class="px-4 py-3 font-semibold text-sm text-white">${row.cuenta}</td>
                <td class="px-4 py-3 text-xs text-slate-400 italic max-w-[200px] truncate">${row.glosa}</td>
                <td class="px-4 py-3 text-right font-mono text-xs ${debeClass}">${row.debe > 0 ? formatearNumero(row.debe) : '-'}</td>
                <td class="px-4 py-3 text-right font-mono text-xs ${haberClass}">${row.haber > 0 ? formatearNumero(row.haber) : '-'}</td>
                <td class="px-4 py-3 text-right font-mono text-sm font-bold text-slate-200">${formatearNumero(row.saldo)}</td>
            `;
            tablaCuerpo.appendChild(tr);
        });

        // Totales y Paginación
        actualizarTotales(sumDebe, sumHaber, sumDebe - sumHaber); // Saldo simple para demo
        conteoResultados.textContent = `Total: ${totalRegistros}`;
        renderizarPaginacion(totalRegistros, porPagina);
    }

    function actualizarTotales(d, h, s) {
        totalDebeEl.textContent = formatearNumero(d);
        totalHaberEl.textContent = formatearNumero(h);
        totalSaldoEl.textContent = formatearNumero(s);
    }

    // --- MOCK DATA GENERATOR ---
    function generarDatosMock() {
        const cuentas = ['Caja USD', 'Banco Estado CLP', 'Caja EUR', 'Ingresos x Venta', 'Costos x Compra', 'Capital Social', 'Proveedores'];
        const tipos = ['Ingreso', 'Egreso', 'Traspaso', 'Apertura'];
        const fechaBase = new Date();
        
        for(let i=0; i<150; i++) {
            const fecha = new Date(fechaBase);
            fecha.setDate(fecha.getDate() - Math.floor(Math.random() * 30));
            const fechaStr = fecha.toISOString().split('T')[0];
            
            const esDebe = Math.random() > 0.5;
            const monto = Math.floor(Math.random() * 500000) + 1000;

            datosSimulados.push({
                id: i+1,
                fecha: fechaStr,
                libro: 'diario',
                asiento: (1000 + i).toString(),
                tipo: tipos[Math.floor(Math.random() * tipos.length)],
                cuenta: cuentas[Math.floor(Math.random() * cuentas.length)],
                glosa: `Registro contable simulado operación #${5000+i}`,
                debe: esDebe ? monto : 0,
                haber: !esDebe ? monto : 0,
                saldo: 0 // Se calcularía acumulado real
            });
        }
        // Ordenar por fecha desc
        datosSimulados.sort((a,b) => new Date(b.fecha) - new Date(a.fecha));
        
        // Calcular saldo acumulado simple (solo para visual)
        let saldo = 0;
        for(let i=datosSimulados.length-1; i>=0; i--) {
            saldo += (datosSimulados[i].debe - datosSimulados[i].haber);
            datosSimulados[i].saldo = saldo;
        }
        // Revertir para mostrar más recientes primero
        datosSimulados.reverse();
    }

    // --- PAGINACIÓN (Simplificada) ---
    function renderizarPaginacion(total, porPagina) {
        paginationControls.innerHTML = '';
        const totalPaginas = Math.ceil(total / porPagina);
        if(totalPaginas <= 1) return;

        const crearBtn = (txt, disabled, fn) => {
            const b = document.createElement('button');
            b.textContent = txt;
            b.className = `px-3 py-1 bg-slate-800 border border-slate-600 rounded hover:bg-slate-700 text-white text-xs ${disabled?'opacity-50 cursor-not-allowed':''}`;
            b.disabled = disabled;
            b.onclick = fn;
            return b;
        };

        paginationControls.appendChild(crearBtn('Anterior', paginaActual===1, () => { paginaActual--; aplicarFiltros(); }));
        const span = document.createElement('span');
        span.className = "text-xs font-bold text-slate-400 px-2";
        span.textContent = `${paginaActual} / ${totalPaginas}`;
        paginationControls.appendChild(span);
        paginationControls.appendChild(crearBtn('Siguiente', paginaActual===totalPaginas, () => { paginaActual++; aplicarFiltros(); }));
    }
});