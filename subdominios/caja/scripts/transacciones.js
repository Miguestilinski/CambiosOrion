document.addEventListener('DOMContentLoaded', () => {   
    const nuevaTransaccionBtn = document.getElementById('nueva-tr');

// Redirigir al hacer clic en "Nueva Transaccion"
   if (nuevaTransaccionBtn) {
    nuevaTransaccionBtn.addEventListener('click', () => {
        window.location.href = 'https://caja.cambiosorion.cl/nueva-tr';
    });
}

});