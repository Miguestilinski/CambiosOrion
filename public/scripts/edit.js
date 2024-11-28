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
    fetch('http://cambiosorion.cl/data/divisas_api.php')
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al cargar las divisas');
            }
            return response.json();
        })
        .then(data => {
            console.log('Datos de divisas recibidos:', data);
            if (Array.isArray(data) && data.length > 0) {
                data.forEach(currency => {
                    editableCurrencies[currency.nombre] = {
                        compra: currency.compra,
                        venta: currency.venta,
                        tasa: currency.tasa,
                        iconoCircular: currency.icono_circular,
                        iconoCuadrado: currency.icono_cuadrado
                    };
                });
                fillEditCurrencyTable();
            } else {
                console.warn('No hay datos de divisas para mostrar.');
            }
        })
        .catch(error => {
            console.error('Error al cargar las divisas:', error);
        });
}

function fillEditCurrencyTable() {
    const editTable = document.getElementById('edit-currency-table');

    if (!editTable) {
        console.error('Tabla de edición no encontrada.');
        return; // Detener ejecución si no hay tabla
    }

    editTable.innerHTML = '';

    Object.keys(editableCurrencies).forEach(currencyName => {
        const currency = editableCurrencies[currencyName];
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${currencyName}</td>
            <td><input type="number" value="${currency.compra}" class="edit-input" data-currency="${currencyName}" data-field="compra"></td>
            <td><input type="number" value="${currency.venta}" class="edit-input" data-currency="${currencyName}" data-field="venta"></td>
            <td><input type="number" value="${currency.tasa}" class="edit-input" data-currency="${currencyName}" data-field="tasa"></td>
        `;
        editTable.appendChild(row);
    });

    setupEditInputs();
}

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

console.log('edit-currency-table:', document.getElementById('edit-currency-table'));
console.log('user-actions:', document.getElementById('user-actions'));
console.log('guest-actions:', document.getElementById('guest-actions'));
