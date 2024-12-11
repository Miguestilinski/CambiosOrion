class HeaderManager {
    constructor() {
      this.guestActions = document.getElementById('guest-actions');
      this.userActions = document.getElementById('user-actions');
  
      // Observador para manejar cambios en el DOM
      this.observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' && mutation.target.id) {
            console.log(`Cambio detectado en ${mutation.target.id}:`, mutation);
          }
        });
      });
  
      this.setupObserver();
      this.init();
    }
  
    // Configurar el observador
    setupObserver() {
      this.observer.observe(document.body, {
        attributes: true,
        attributeFilter: ['class', 'style'],
        subtree: true,
      });
    }
  
    // Lógica de inicialización
    init() {
      setTimeout(() => {
        this.checkSession();
        this.setupEventListeners();
        this.initializePage();
      }, 100);
    }
  
    // Comprueba la sesión
    checkSession() {
      const isLoggedIn = localStorage.getItem('sessionActive');
      console.log('Sesión activa:', isLoggedIn);
  
      if (isLoggedIn) {
        console.log("Sesión activa, mostrando vista de usuario.");
        this.renderUI(true);
      } else {
        console.log("Sesión no activa, mostrando vista de invitado.");
        this.renderUI(false);
      }
    }
  
    // Cambia dinámicamente la UI
    renderUI(isLoggedIn) {
      if (!this.guestActions || !this.userActions) {
        console.error('No se encontraron guestActions o userActions en el DOM');
        return;
      }
  
      if (isLoggedIn) {
        console.log('Mostrando vista de usuario');
        this.guestActions.classList.add('hidden');
        this.userActions.classList.remove('hidden');
      } else {
        console.log('Mostrando vista de invitado');
        this.guestActions.classList.remove('hidden');
        this.userActions.classList.add('hidden');
      }
    }
  
    // Configurar los eventos de clic para logout y navegación
    setupEventListeners() {
      const logoutButton = document.getElementById('logout-button');
      if (logoutButton) {
        logoutButton.addEventListener('click', () => this.logout());
      }
  
      const navMenuButton = document.getElementById('nav-menu-button');
      const sessionMenuButton = document.getElementById('session-menu-button');
      const navMobileMenu = document.getElementById('nav-mobile-menu');
      const sessionMobileMenu = document.getElementById('session-mobile-menu');
  
      if (navMenuButton && sessionMenuButton && navMobileMenu && sessionMobileMenu) {
        navMenuButton.addEventListener('click', () => {
          this.toggleMenu(navMobileMenu);
          if (sessionMobileMenu && sessionMobileMenu.style.display === 'block') {
            this.closeMenu(sessionMobileMenu);
          }
        });
  
        sessionMenuButton.addEventListener('click', () => {
          this.toggleMenu(sessionMobileMenu);
          if (navMobileMenu && navMobileMenu.style.display === 'block') {
            this.closeMenu(navMobileMenu);
          }
        });
      }
    }
  
    // Funcionalidad logout
    logout() {
      console.log("Cerrando sesión...");
      localStorage.removeItem('sessionActive');
      this.checkSession();
    }
  
    // Alternar visibilidad de menús
    toggleMenu(menu) {
      if (menu) {
        menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
      }
    }
  
    closeMenu(menu) {
      if (menu) {
        menu.style.display = 'none';
      }
    }
  
    initializePage() {
      this.setActiveLink('#nav-menu');
      this.setActiveLink('#session-menu');
    }
  
    // Marca los enlaces activos
    setActiveLink(menuId) {
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
  }
  
  // Iniciar el administrador de encabezado
  document.addEventListener('DOMContentLoaded', () => {
    new HeaderManager();
  });
  