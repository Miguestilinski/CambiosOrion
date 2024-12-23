// JavaScript for Dashboard functionality
document.addEventListener('DOMContentLoaded', () => {
    const menuItems = document.querySelectorAll('.menu-item');
    const sections = document.querySelectorAll('.content-section');

    const userType = "Cliente"; // Cambiar según el usuario actual ("Cliente" o "Administrativo")
    const roleGroup = document.getElementById("role-group");
    const rutGroup = document.getElementById("rut-group");
  
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

    if (userType === "Administrativo") {
        roleGroup.style.display = "block";
    } else if (userType === "Cliente") {
        rutGroup.style.display = "block";
    }
  });
  