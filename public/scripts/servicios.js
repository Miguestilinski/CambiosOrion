// Obtener los botones y menús
const menuToggle = document.getElementById('menu-toggle');
const sessionToggle = document.getElementById('session-toggle');
const navMenu = document.getElementById('nav-menu');
const sessionMenu = document.getElementById('session-menu');

// Función para alternar la visibilidad del menú de navegación
menuToggle.addEventListener('click', function() {
    // Alternar la visibilidad del menú de navegación
    navMenu.classList.toggle('hidden');
    
    // Si el menú de sesión está abierto, cerrarlo
    if (!sessionMenu.classList.contains('hidden')) {
        sessionMenu.classList.add('hidden');
    }
});

// Función para alternar la visibilidad del menú de sesión
sessionToggle.addEventListener('click', function() {
    // Alternar la visibilidad del menú de sesión
    sessionMenu.classList.toggle('hidden');
    
    // Si el menú de navegación está abierto, cerrarlo
    if (!navMenu.classList.contains('hidden')) {
        navMenu.classList.add('hidden');
    }
});

// Función para marcar la opción activa en el menú de navegación y sesión
function setActiveLink(menuId) {
    const links = document.querySelectorAll(`${menuId} a`);
    const currentPath = window.location.pathname; // Obtener la ruta actual

    links.forEach(link => {
        // Si la URL del enlace coincide con la URL actual, marca como seleccionado
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('selected');
        } else {
            link.classList.remove('selected');
        }
    });
}

// Marcar la opción activa al cargar la página
window.addEventListener('DOMContentLoaded', function() {
    // Aplicar la clase 'selected' en el menú de navegación
    setActiveLink('#nav-menu');

    // Aplicar la clase 'selected' en el menú de sesión
    setActiveLink('#session-menu');
});
