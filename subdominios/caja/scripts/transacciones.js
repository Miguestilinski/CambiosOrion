document.addEventListener('DOMContentLoaded', () => {   
    const nuevaTransaccionBtn = document.getElementById('nueva-tr');

// Redirigir al hacer clic en "Nueva Transaccion"
   if (nuevaTransaccionBtn) {
    nuevaTransaccionnBtn.addEventListener('click', () => {
        window.location.href = 'https://tesoreria.cambiosorion.cl/nueva-tr';
    });
}

});