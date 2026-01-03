document.addEventListener('DOMContentLoaded', () => {
    // 1. Lógica de Sesión ADMIN (Copiada y adaptada de index-admin.js)
    getSession();

    // 2. Referencias al menú móvil (Si existen en index.html)
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

// Función para obtener sesión de ADMIN
async function getSession() {
    try {
        const res = await fetch("https://cambiosorion.cl/data/session_status_admin.php", {
            credentials: "include"
        });
        if (!res.ok) throw new Error("No se pudo obtener la sesión.");
        
        const data = await res.json();
        
        // Si no es admin autenticado, mandar al login
        if (!data.isAuthenticated || !data.equipo_id) {
            window.location.href = 'https://admin.cambiosorion.cl/login';
            return;
        }

        const nombre = data.nombre || 'Usuario';
        const primerNombre = nombre.split(' ')[0];

        // Referencias del DOM (Header)
        const headerName = document.getElementById('header-user-name');
        const headerEmail = document.getElementById('dropdown-user-email');
        const userActions = document.getElementById('user-actions');
        const guestActions = document.getElementById('guest-actions');

        // Poblar datos
        if (headerName) headerName.textContent = primerNombre;
        if (headerEmail) headerEmail.textContent = data.correo;

        // Forzar visualización de UI de usuario (por si header.js la ocultó)
        if (userActions) userActions.classList.remove('hidden');
        if (userActions) userActions.style.display = 'block'; // Asegurar display block
        if (guestActions) guestActions.classList.add('hidden');

    } catch (error) {
        console.error("Error obteniendo la sesión de admin:", error);
        window.location.href = 'https://admin.cambiosorion.cl/login';
    }
}

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