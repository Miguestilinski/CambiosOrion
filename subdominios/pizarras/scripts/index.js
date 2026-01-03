document.addEventListener('DOMContentLoaded', () => {
    // Referencias al menú móvil (Si existen en index.html)
    const navMenuButton = document.getElementById('nav-menu-button');
    const navMobileMenu = document.getElementById('nav-mobile-menu');

    if (navMenuButton && navMobileMenu) {
        navMenuButton.addEventListener('click', (event) => {
            navMobileMenu.classList.toggle('hidden');
            event.stopPropagation();
        });

        document.addEventListener('click', (e) => {
            if (!navMobileMenu.contains(e.target) && !navMenuButton.contains(e.target)) {
                navMobileMenu.classList.add('hidden');
            }
        });
    }
});

// Función global para ser llamada desde el onclick del HTML
window.openPopupWindow = function(url, title, width, height) {
    const left = (screen.width - width) / 2;
    const top = (screen.height - height) / 2;

    window.open(
        url,
        title,
        `width=${width},height=${height},top=${top},left=${left},resizable=yes,scrollbars=yes`
    );
};