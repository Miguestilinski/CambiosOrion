import { initPizarrasHeader } from './header.js';

document.addEventListener('DOMContentLoaded', async() => {
    // 1. Inicializar Header Global 
    // (Maneja: Sesión Admin, Context Switcher, Menú Móvil, Perfil)
    await initPizarrasHeader('home');

    // Aquí puedes agregar lógica específica del Dashboard de Pizarras si la necesitas en el futuro
});

// Función global para popups (se mantiene igual)
window.openPopupWindow = function(url, title, width, height) {
    const left = (screen.width - width) / 2;
    const top = (screen.height - height) / 2;

    window.open(
        url,
        title,
        `width=${width},height=${height},top=${top},left=${left},resizable=yes,scrollbars=yes`
    );
};