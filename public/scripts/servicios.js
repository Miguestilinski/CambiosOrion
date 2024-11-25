function initializePage() {
    setActiveLink('#nav-menu');
    setActiveLink('#session-menu');
}

document.addEventListener('DOMContentLoaded', () => {
    initializePage();

    const navMenuButton = document.getElementById('nav-menu-button');
    const sessionMenuButton = document.getElementById('session-menu-button');
    const navMobileMenu = document.getElementById('nav-mobile-menu');
    const sessionMobileMenu = document.getElementById('session-mobile-menu');

    if (navMenuButton && sessionMenuButton && navMobileMenu && sessionMobileMenu) {
        navMenuButton.addEventListener('click', (event) => {
            toggleMenu(navMobileMenu); // Solo se pasa un menú
            event.stopPropagation();
        });

        sessionMenuButton.addEventListener('click', (event) => {
            toggleMenu(sessionMobileMenu); // Solo se pasa un menú
            event.stopPropagation();
        });

        // Si se hace clic en cualquier lugar fuera de los menús, los cierra
        document.addEventListener('click', (event) => {
            if (!event.target.closest('.mobile-buttons')) {
                closeMenu(navMobileMenu);
                closeMenu(sessionMobileMenu);
            }
        });
    }
});

// Alterna la visibilidad del menú
function toggleMenu(menuToOpen) {
    // Alternamos la clase 'hidden' para mostrar o esconder el menú
    if (menuToOpen.classList.contains('hidden')) {
        menuToOpen.classList.remove('hidden'); // Mostrar el menú
    } else {
        menuToOpen.classList.add('hidden'); // Ocultar el menú
    }
}

function closeMenu(menu) {
    if (!menu.classList.contains('hidden')) {
        menu.classList.add('hidden'); // Asegúrate de ocultar el menú
    }
}

// Marcar el enlace activo en el menú
function setActiveLink(menuId) {
    const links = document.querySelectorAll(`${menuId} a`);
    const currentPath = window.location.pathname;
    links.forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('selected');
        } else {
            link.classList.remove('selected');
        }
    });
}
