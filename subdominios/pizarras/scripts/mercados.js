// /var/www/html/pizarras/scripts/mercados.js
import { initPizarrasHeader } from './header.js';

document.addEventListener('DOMContentLoaded', async() => {
    // 1. Inicializar Header Global (Maneja la sesión y validación de usuario)
    // Usamos 'mercados' como identificador por si en el futuro quieres lógica específica
    await initPizarrasHeader('mercados');

    // 2. Configurar menú móvil (copiado de tasas.js)
    const navBtn = document.getElementById('nav-menu-button');
    const mobileMenu = document.getElementById('nav-mobile-menu'); // Asegúrate que el header.js lo inyecte o exista en DOM
    
    // Nota: El header.js suele encargarse de mucho, pero si el botón es local:
    if(navBtn) {
        navBtn.addEventListener('click', (e) => {
            // Lógica simple para abrir menú si existe en tu layout móvil
            const menu = document.querySelector('.mobile-menu-container'); 
            if(menu) menu.classList.toggle('hidden');
        });
    }

    console.log("Orion Markets Dashboard: Online 🟢");
});