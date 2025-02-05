window.seleccionarDivisa = function(divisa) {
    document.getElementById('titulo-divisa').textContent = `Arqueo de ${divisa}`;
    document.getElementById('tabla-arqueo').classList.remove('hidden');
    document.getElementById('detalle').classList.remove('hidden');

    // Remover fondo de cualquier divisa seleccionada previamente
    document.querySelectorAll('#divisas-lista div').forEach(el => el.classList.remove('bg-gray-700'));

    // Agregar fondo a la divisa seleccionada
    const divisaSeleccionada = [...document.querySelectorAll('#divisas-lista div')]
        .find(el => el.textContent.includes(divisa));
    if (divisaSeleccionada) {
        divisaSeleccionada.classList.add('bg-gray-700');
    }

    // Simulación de datos
    const totalSistema = 5000;
    const billetes = [100, 50, 20, 10, 5, 1];
    
    document.getElementById('total-sistema').textContent = `$${totalSistema}`;
    const tbody = document.getElementById('tbody-arqueo');
    tbody.innerHTML = `
        <tr class="bg-white text-gray-700">
            <td class="p-3" id="total-sistema" rowspan="2">$${totalSistema}</td>
            <td class="p-3">$${billetes[0]}</td>
            <td class="p-3">
                <input type="number" class="w-16 p-1 bg-white border border-gray-600 text-gray-700 text-center" oninput="calcularTotal()">
            </td>
        </tr>
    `;

    billetes.slice(1).forEach(valor => {
        tbody.innerHTML += `
            <tr class="bg-white text-gray-700">
                <td class="p-3">$${valor}</td>
                <td class="p-3">
                    <input type="number" class="w-16 p-1 bg-white border border-gray-600 text-gray-700 text-center" oninput="calcularTotal()">
                </td>
            </tr>
        `;
    });
}

window.calcularTotal = function() {
    let totalArqueo = 0;
    const inputs = document.querySelectorAll('#tbody-arqueo input');
    const billetes = [100, 50, 20, 10, 5, 1];
    
    inputs.forEach((input, index) => {
        totalArqueo += (parseInt(input.value) || 0) * billetes[index];
    });
    
    document.getElementById('total-arqueo').textContent = `$${totalArqueo}`;
    const totalSistema = parseInt(document.getElementById('total-sistema').textContent.replace('$', ''));
    document.getElementById('diferencia-caja').textContent = `$${totalArqueo - totalSistema}`;
}