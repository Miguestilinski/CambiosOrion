let editableCurrencies = {};
let editMode = false;

document.addEventListener('DOMContentLoaded', () => {
    initializeEditPage();

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
    const saveButton = document.getElementById('save-button');
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
            fillEditCurrencyTable(data);
        })
        .catch(error => {
            console.error('Error al obtener las divisas:', error);
        });
}

function fillEditCurrencyTable(divisas) {
    // Verificar que la tabla exista en el DOM
    const tableBody = document.querySelector('#currency-list'); // Cambié aquí el ID

    if (tableBody) {
        // Limpiar la tabla antes de llenarla
        tableBody.innerHTML = '';

        // Llenar la tabla con los datos recibidos
        divisas.forEach(divisa => {
            // Formatear los valores para eliminar ceros innecesarios
            const formattedCompra = removeTrailingZeros(divisa.compra);
            const formattedVenta = removeTrailingZeros(divisa.venta);

            const row = document.createElement('tr');
            row.innerHTML = `
                <td><img src="${divisa.icono_circular}" alt="${divisa.nombre}"></td>
                <td>${divisa.nombre}</td>
                <td><input type="number" class="edit-input" data-currency="${divisa.nombre}" data-field="compra" value="${formattedCompra}" step="any" min="0"></td>
                <td><input type="number" class="edit-input" data-currency="${divisa.nombre}" data-field="venta" value="${formattedVenta}" step="any" min="0"></td>
            `;
            tableBody.appendChild(row);
        });

        // Configurar los eventos para los inputs editables
        setupEditInputs();
    } else {
        console.error('Tabla de edición no encontrada.');
    }
}

// Función para eliminar ceros innecesarios de los decimales
function removeTrailingZeros(value) {
    if (value === null || value === undefined) return '';
    // Convertir a número flotante y luego a string para eliminar ceros finales
    const floatValue = parseFloat(value);
    return floatValue.toString();
}

function setupEditInputs() {
    const editInputs = document.querySelectorAll('.edit-input');

    editInputs.forEach(input => {
        input.addEventListener('input', event => {
            const { currency, field } = event.target.dataset;
            const newValue = parseFloat(event.target.value);

            if (editableCurrencies[currency]) {
                editableCurrencies[currency][field] = newValue;
            } else {
                editableCurrencies[currency] = {
                    nombre: currency,
                    [field]: newValue
                };
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
