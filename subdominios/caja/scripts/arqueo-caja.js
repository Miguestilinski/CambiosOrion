function seleccionarDivisa(divisa) {
    document.getElementById('titulo-divisa').textContent = `Arqueo de ${divisa}`;
    document.getElementById('tabla-arqueo').classList.remove('hidden');
    document.getElementById('resumen').classList.remove('hidden');
    
    // Simulación de datos
    const totalSistema = 5000;
    const billetes = [100, 50, 20, 10, 5, 1];
    
    document.getElementById('total-sistema').textContent = `$${totalSistema}`;
    const tbody = document.getElementById('tbody-arqueo');
    tbody.innerHTML = `
        <tr class="bg-gray-600">
            <td class="p-3" id="total-sistema">$${totalSistema}</td>
            <td class="p-3"></td>
            <td class="p-3"></td>
        </tr>
    `;
    
    billetes.forEach(valor => {
        tbody.innerHTML += `
            <tr class="bg-gray-700">
                <td class="p-3"></td>
                <td class="p-3">$${valor}</td>
                <td class="p-3">
                    <input type="number" class="w-16 p-1 bg-gray-800 border border-gray-600 text-white text-center" oninput="calcularTotal()">
                </td>
            </tr>
        `;
    });
}

function calcularTotal() {
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