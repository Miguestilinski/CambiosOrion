let guestActions, userActions;

document.addEventListener('DOMContentLoaded', function() {
    checkSession();
    setupEventListeners();
    initializePage();
});

// --- HELPER PARA CARACTERES ---
function fixEncoding(str) {
    if (!str) return "";
    try {
        return decodeURIComponent(escape(str));
    } catch (e) {
        return str;
    }
}

function setupEventListeners() {
    const logoutButtonMobile = document.getElementById('logout-button-mobile');
    const logoutButtonMenu = document.getElementById('logout-button');

    if (logoutButtonMobile) logoutButtonMobile.addEventListener('click', logout);
    if (logoutButtonMenu) logoutButtonMenu.addEventListener('click', logout);

    const navMenuButton = document.getElementById('nav-menu-button');
    const mobileMenu = document.getElementById('nav-mobile-menu');
    
    if (navMenuButton && mobileMenu) {
        navMenuButton.addEventListener('click', (e) => {
            e.stopPropagation();
            mobileMenu.classList.toggle('hidden');
        });
        document.addEventListener('click', (e) => {
            if (!navMenuButton.contains(e.target) && !mobileMenu.contains(e.target)) {
                mobileMenu.classList.add('hidden');
            }
        });
    }

    const profileBtn = document.getElementById('profile-menu-button');
    const dropdown = document.getElementById('dropdownInformation');
    if (profileBtn && dropdown) {
        profileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('hidden');
        });
        document.addEventListener('click', (e) => {
            if (!profileBtn.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.classList.add('hidden');
            }
        });
    }
}

function checkSession() {
    fetch('https://cambiosorion.cl/data/session_status_clientes.php', {
            method: 'GET',
            credentials: 'include'
        })
        .then(response => response.json())
        .then(data => {
            if (data.isAuthenticated) {
                showUserUI(data);
            } else {
                showGuestUI();
            }
        })
        .catch(error => console.error('Error sesión:', error));
}

function showUserUI(data) {
    const userActions = document.getElementById('user-actions');
    const guestActions = document.getElementById('guest-actions');
    
    if (userActions) userActions.style.display = 'block';
    if (guestActions) guestActions.style.display = 'none';

    // 1. CORRECCIÓN DE NOMBRE
    const nombreFixed = fixEncoding(data.nombre);

    // Header (Botón)
    const headerName = document.getElementById('header-user-name');
    if (headerName) headerName.textContent = nombreFixed.split(' ')[0];

    // Dropdown (Info Completa)
    const dropdownInfo = document.getElementById('dropdownInformation');
    if (dropdownInfo) {
        const nameEl = dropdownInfo.querySelector('.px-4 > p.text-sm');
        if (nameEl) nameEl.textContent = data.correo;
        
        // Aquí corregimos para que el dropdown use nombreFixed y no data.nombre directo
        const userInfoContainer = dropdownInfo.querySelector('.px-4.py-3');
        if(userInfoContainer) {
             userInfoContainer.innerHTML = `
                <p class="text-xs text-gray-400 uppercase font-bold tracking-wider">Conectado como</p>
                <div class="font-bold text-white text-base truncate">${nombreFixed}</div>
                <div class="text-xs text-gray-400 truncate">${data.correo}</div>
            `;
        }
    }
}

function showGuestUI() {
    const userActions = document.getElementById('user-actions');
    const guestActions = document.getElementById('guest-actions');
    if (userActions) userActions.style.display = 'none';
    if (guestActions) guestActions.style.display = 'block';
}

function logout() {
    fetch('https://cambiosorion.cl/data/cerrar_sesion.php', { method: 'POST' })
    .then(() => window.location.href = 'https://cambiosorion.cl/login');
}

function initializePage() {
    // setActiveLink logic if needed
}