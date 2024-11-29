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
            toggleMenu(navMobileMenu);
            event.stopPropagation();
        });

        sessionMenuButton.addEventListener('click', (event) => {
            toggleMenu(sessionMobileMenu);
            event.stopPropagation();
        });

        document.addEventListener('click', () => {
            closeMenu(navMobileMenu);
            closeMenu(sessionMobileMenu);
        });
    }

    setupEditEventListeners();
    setupCatalogButtons(); // Añadido para configurar los botones de catálogo
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

function setupCatalogButtons() {
    const catalogButtonNormal = document.getElementById('catalog-button-normal');
    const catalogButtonDestacadas = document.getElementById('catalog-button-destacadas');

    if (catalogButtonNormal) {
        catalogButtonNormal.addEventListener('click', () => {
            window.open('catalogo.html', '_blank');
        });
    }

    if (catalogButtonDestacadas) {
        catalogButtonDestacadas.addEventListener('click', () => {
            window.open('destacadas.html', '_blank');
        });
    }
}

function toggleMenu(menu) {
    if (menu) {
        menu.classList.toggle('visible');
    }
}

function closeMenu(menu) {
    if (menu && menu.classList.contains('visible')) {
        menu.classList.remove('visible');
    }
}

function loadCurrenciesForEdit() {
    const targetUrl = 'https://cambiosorion.cl/data/divisas_api.php';
    fetch(targetUrl)
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            return response.json();
        })
        .then(data => {
            fillEditCurrencyTable(data);
        })
        .catch(error => {
            console.error('Error al obtener las divisas:', error);
        });
}

function fillEditCurrencyTable(divisas) {
    const tableBody = document.querySelector('#currency-list');

    if (tableBody) {
        tableBody.innerHTML = '';

        divisas.forEach(divisa => {
            if (divisa.nombre === 'CLP') return;

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

            editableCurrencies[divisa.nombre] = {
                nombre: divisa.nombre,
                compra: divisa.compra,
                venta: divisa.venta,
                icono_circular: divisa.icono_circular,
                icono_cuadrado: divisa.icono_cuadrado || divisa.icono_circular.replace('circular', 'cuadrado'),
            };
        });

        setupEditInputs();
    } else {
        console.error('Tabla de edición no encontrada.');
    }
}

function removeTrailingZeros(value) {
    if (value === null || value === undefined) return '';
    const floatValue = parseFloat(value);
    return floatValue.toString();
}

function setupEditInputs() {
    const editInputs = document.querySelectorAll('.edit-input');

    editInputs.forEach(input => {
        input.addEventListener('input', event => {
            const { currency, field } = event.target.dataset;
            const newValue = parseFloat(event.target.value);

            if (!currency || !field) {
                console.error("Falta información del dataset:", event.target.dataset);
                return;
            }

            if (!editableCurrencies[currency]) {
                console.error(`No se encontró la divisa ${currency} en editableCurrencies.`);
                return;
            }

            editableCurrencies[currency][field] = isNaN(newValue) ? null : newValue;
        });
    });
}

async function saveEditedCurrencies() {
    const data = Object.values(editableCurrencies);

    if (!data.length) {
        console.error("No hay datos para guardar.");
        alert("No hay datos para guardar.");
        return;
    }

    const isValidData = data.every(divisa =>
        divisa.nombre &&
        divisa.compra !== null &&
        divisa.venta !== null &&
        divisa.icono_circular &&
        divisa.icono_cuadrado
    );

    if (!isValidData) {
        console.error("Algunos datos están incompletos:", data);
        alert("Hay datos incompletos. Por favor, verifica las divisas.");
        return;
    }

    try {
        const response = await fetch('https://cambiosorion.cl/data/divisas_api.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorDetails = await response.json();
            throw new Error(errorDetails.error || `HTTP error! Status: ${response.status}`);
        }

        const result = await response.json();
        console.log("Cambios guardados:", result.message);
    } catch (error) {
        console.error("Error al guardar los cambios:", error);
        alert(`Error al guardar los cambios: ${error.message}`);
    }
}

function cancelEdit() {
    if (confirm('¿Estás seguro de que deseas cancelar los cambios?')) {
        loadCurrenciesForEdit();
        editableCurrencies = {};
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
