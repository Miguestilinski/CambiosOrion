let editableCurrencies = {};
let editMode = false;

document.addEventListener('DOMContentLoaded', () => {
    initializeEditPage();

    const isAuthenticated = localStorage.getItem('userAuthenticated') === 'true';
    console.log('Estado de la sesión (Edición):', isAuthenticated);

    toggleSessionActions(isAuthenticated);

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
    const targetUrl = 'https://cambiosorion.cl/data/divisas_api.php';

    fetch(proxyUrl + targetUrl)
        .then(response => response.json())
        .then(data => {
            const responseData = data.contents ? JSON.parse(data.contents) : data;

            if (!Array.isArray(responseData)) {
                console.error("Formato de datos inesperado:", responseData);
                return;
            }

            editableCurrencies = responseData.reduce((acc, currency) => {
                acc[currency.nombre] = {
                    compra: parseFloat(currency.compra),
                    venta: parseFloat(currency.venta),
                    tasa: parseFloat(currency.tasa),
                    icono_circular: currency.icono_circular,
                    icono_cuadrado: currency.icono_cuadrado
                };
                return acc;
            }, {});

            fillEditCurrencyTable();
        })
        .catch(error => console.error('Error al cargar las divisas para edición:', error));
}

function fillEditCurrencyTable() {
    const editTable = document.getElementById('edit-currency-table');

    if (!editTable) {
        console.error('Tabla de edición no encontrada.');
        return;
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
    const profileMenuButton = document.getElementById('profile-menu-button');

    if (userActions && guestActions && profileMenuButton) {
        if (isAuthenticated) {
            console.log("Usuario autenticado, mostrando acciones");
            userActions.style.display = 'block';
            guestActions.style.display = 'none';

            profileMenuButton.addEventListener('click', () => {
                const profileMenu = document.getElementById('profile-menu');
                if (profileMenu) {
                    profileMenu.classList.toggle('hidden');
                }
            });
        } else {
            console.log("Usuario no autenticado");
            guestActions.style.display = 'block';
            userActions.style.display = 'none';
        }

        localStorage.setItem('userAuthenticated', isAuthenticated ? 'true' : 'false');
    } else {
        console.warn("No se encontraron elementos de sesión en el DOM.");
    }
}
