// Simulación de datos
const liquidaciones = [
    { nombre: 'Juan Pérez', mes: '2024-01', documento: 'juan_enero.pdf' },
    { nombre: 'Ana Díaz', mes: '2024-01', documento: 'ana_enero.pdf' },
    { nombre: 'Luis Gómez', mes: '2024-02', documento: 'luis_febrero.pdf' },
    { nombre: 'Carla Soto', mes: '2024-02', documento: 'carla_febrero.pdf' },
];

const selectMes = document.getElementById('mes-select');
const tablaCuerpo = document.getElementById('liquidaciones-body');

selectMes.addEventListener('change', () => {
    const mesSeleccionado = selectMes.value;
    tablaCuerpo.innerHTML = ''; // Limpiar tabla

    if (mesSeleccionado === '') return;

    const filtradas = liquidaciones.filter(l => l.mes === mesSeleccionado);

    if (filtradas.length === 0) {
        tablaCuerpo.innerHTML = '<tr><td colspan="3" class="px-4 py-2 text-center text-white">No hay documentos para este mes.</td></tr>';
        return;
    }

    filtradas.forEach(liq => {
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td class="px-4 py-2">${liq.nombre}</td>
            <td class="px-4 py-2">${formatearMes(liq.mes)}</td>
            <td class="px-4 py-2">
                <a href="/documentos/liquidaciones/${liq.documento}" target="_blank" class="text-blue-400 underline hover:text-blue-200">Ver Documento</a>
            </td>
        `;
        tablaCuerpo.appendChild(fila);
    });
});

// Helper: convierte "2024-01" a "Enero 2024"
function formatearMes(fecha) {
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                   'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const [anio, mes] = fecha.split('-');
    return `${meses[parseInt(mes) - 1]} ${anio}`;
}
