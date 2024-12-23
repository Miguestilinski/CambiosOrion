// JavaScript for Dashboard functionality
document.addEventListener('DOMContentLoaded', () => {
    const menuItems = document.querySelectorAll('.menu-item');
    const sections = document.querySelectorAll('.content-section');

    const userType = 'Cliente'; // O 'Administrativo'
    const isClient = userType === 'Cliente';
  
    menuItems.forEach(item => {
      item.addEventListener('click', () => {
        // Remove active class from all menu items and sections
        menuItems.forEach(menu => menu.classList.remove('active'));
        sections.forEach(section => section.classList.remove('active'));
  
        // Add active class to the clicked menu item and the corresponding section
        item.classList.add('active');
        const sectionId = item.getAttribute('data-section');
        document.getElementById(sectionId).classList.add('active');
      });
    });


    document.getElementById('user-type').textContent = userType;

    if (isClient) {
        document.getElementById('rut-group').classList.remove('hidden');
        document.getElementById('email').removeAttribute('readonly');
        document.getElementById('additional-info').textContent = 'Persona';
    } else {
        document.getElementById('additional-info').textContent = 'Rol del Usuario';
    }
  });
  