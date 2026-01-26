// /var/www/html/pizarras/scripts/mercados.js
import { initPizarrasHeader } from './header.js';

document.addEventListener('DOMContentLoaded', async() => {
    // 1. Inicializar Header Global
    await initPizarrasHeader('mercados');

    // 2. Configurar menú móvil (lógica local básica si no la provee el header)
    const navBtn = document.getElementById('nav-menu-button');
    if(navBtn) {
        navBtn.addEventListener('click', (e) => {
            // Buscamos el contenedor del menú móvil que inyecta el header.js
            // Usualmente tiene id 'nav-mobile-menu' o clase similar
            const menu = document.getElementById('nav-mobile-menu'); 
            if(menu) menu.classList.toggle('hidden');
        });
    }

    console.log("Orion Markets Dashboard: Online");
});