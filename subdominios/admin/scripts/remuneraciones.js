document.addEventListener('DOMContentLoaded', () => {   
    const nuevaRemuneracionBtn = document.getElementById('nueva-rem');

// Redirigir al hacer clic en "Nueva Remuneracion"
   if (nuevaRemuneracionBtn) {
    nuevaRemuneracionBtn.addEventListener('click', () => {
        window.location.href = 'https://admin.cambiosorion.cl/nueva-rem';
    });
}

});