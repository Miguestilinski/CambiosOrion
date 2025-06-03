document.addEventListener('DOMContentLoaded', () => {
    const nuevaCajaBtn = document.getElementById('nueva-caja');

     // Redirigir al hacer clic en "Nueva Caja"
    if (nuevaCajaBtn) {
        nuevaCajaBtn.addEventListener('click', () => {
            window.location.href = 'https://tesoreria.cambiosorion.cl/nueva-caja';
        });
    }
});