let editableCurrencies = {};
let editMode = false;

document.addEventListener('DOMContentLoaded', () => {
    initializeEditPage();

    const isAuthenticated = localStorage.getItem('userAuthenticated') === 'true';
    console.log('Estado de la sesión (Edición):', isAuthenticated);
    toggleSessionActions(isAuthenticated);

    const navMenuButton = document.getElementById('nav-menu-button');
    const sessionMenuButton = document.getElementById('session-menu-button');
    const navMobileMenu = document.getElementById('nav-mobile-menu');
    const sessionMobileMenu = document.getElementById('session-mobile-menu');


    if (navMenuButton && sessionMenuButton && navMobileMenu && sessionMobileMenu) {
        navMenuButton.addEventListener('click', (event) => {
            toggleMenu(navMobileMenu); // Cambié la llamada para solo pasar un menú
            event.stopPropagation();
        });

        sessionMenuButton.addEventListener('click', (event) => {
            toggleMenu(sessionMobileMenu); // Cambié la llamada para solo pasar un menú
            event.stopPropagation();
        });

        document.addEventListener('click', () => {
            closeMenu(navMobileMenu);
            closeMenu(sessionMobileMenu);
        });
    }

    setupEditEventListeners();
});

function initializeEditPage() {
    loadCurrenciesForEdit();
    setActiveLink('#nav-menu');
    setActiveLink('#session-menu');
}

function setupEditEventListeners() {
    const saveButton = document.getElementById('save-currencies-button');
    const cancelButton = document.getElementById('cancel-edit-button');

    if (saveButton) {
        saveButton.addEventListener('click', saveEditedCurrencies);
    }

    if (cancelButton) {
        cancelButton.addEventListener('click', cancelEdit);
    }
}

function loadCurrenciesForEdit() {
    const proxyUrl = 'https://corsproxy.io/?';
    const targetUrl = 'https://cambiosorion.cl/data/obtener_divisas.php';
    fetch(proxyUrl + targetUrl)
        .then(response => response.json())
        .then(data => {
            fillEditCurrencyTable(data);  // Llamar a la función para llenar la tabla
        })
        .catch(error => {
            console.error('Error al obtener las divisas:', error);
        });
}

function fillEditCurrencyTable(divisas) {
    console.log('Datos de divisas recibidos:', divisas);

    // Verificar que la tabla exista en el DOM
    const tableBody = document.querySelector('#editCurrencyTable tbody');

    if (tableBody) {
        // Limpiar la tabla antes de llenarla
        tableBody.innerHTML = '';

        // Llenar la tabla con los datos recibidos
        divisas.forEach(divisa => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${divisa.nombre}</td>
                <td>${divisa.compra}</td>
                <td>${divisa.venta}</td>
                <td>${divisa.tasa}</td>
                <td><img src="${divisa.icono_circular}" alt="${divisa.nombre}"></td>
                <td><img src="${divisa.icono_cuadrado}" alt="${divisa.nombre}"></td>
            `;
            tableBody.appendChild(row);
        });
    } else {
        console.error('Tabla de edición no encontrada.');
    }
}

window.onload = function() {
    console.log('Página cargada, comenzando a cargar divisas...');
    loadCurrenciesForEdit();
};

function setupEditInputs() {
    const editInputs = document.querySelectorAll('.edit-input');

    editInputs.forEach(input => {
        input.addEventListener('input', event => {
            const { currency, field } = event.target.dataset;
            const newValue = parseFloat(event.target.value);

            if (editableCurrencies[currency]) {
                editableCurrencies[currency][field] = newValue;
            }
        });
    });
}

function saveEditedCurrencies() {
    const proxyUrl = 'https://corsproxy.io/?';
    const targetUrl = 'https://cambiosorion.cl/data/divisas_api.php';

    const body = JSON.stringify(Object.values(editableCurrencies));

    fetch(proxyUrl + targetUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body
    })
        .then(response => response.json())
        .then(data => {
            console.log('Cambios guardados:', data);
            alert('Los cambios se han guardado correctamente.');
            loadCurrenciesForEdit();
        })
        .catch(error => {
            console.error('Error al guardar los cambios:', error);
            alert('Ocurrió un error al guardar los cambios.');
        });
}

function cancelEdit() {
    if (confirm('¿Estás seguro de que deseas cancelar los cambios?')) {
        loadCurrenciesForEdit();
    }
}

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

function toggleSessionActions(isAuthenticated) {
    const userActions = document.getElementById('user-actions');
    const guestActions = document.getElementById('guest-actions');

    if (!userActions || !guestActions) {
        console.warn('No se encontraron elementos de sesión en el DOM.');
        return; // Detener ejecución si faltan elementos
    }

    if (isAuthenticated) {
        userActions.style.display = 'block';
        guestActions.style.display = 'none';
    } else {
        guestActions.style.display = 'block';
        userActions.style.display = 'none';
    }
}
