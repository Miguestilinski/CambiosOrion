let editableCurrencies = {};
let editMode = true;

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
    setupCatalogButtons(); 
});

function initializeEditPage() {
    // Evita llamadas duplicadas con una variable global
    if (!editableCurrenciesLoaded) {
        editableCurrenciesLoaded = true; // Marca como cargado para evitar duplicar la llamada
        loadCurrenciesForEdit();
    }
    console.log('Inicializando la Página');

    setActiveLink('#nav-menu');
    setActiveLink('#session-menu');
}

let editableCurrenciesLoaded = false;

function setupEditEventListeners() {
    const saveButton = document.getElementById('save-button');

    if (saveButton) {
        saveButton.addEventListener('click', saveEditedCurrencies);
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
            if (data && Array.isArray(data)) {
                fillEditCurrencyTable(data);
            } else {
                console.error("No se cargaron datos válidos desde la API.");
            }
        })
        .catch(error => {
            console.error('Error al obtener las divisas:', error);
        });
}

function fillEditCurrencyTable(divisas) {
    console.log('Llenando la Tabla');
    const tableBody = document.querySelector('#currency-list');
    if (!tableBody) {
        console.error('Tabla de edición no encontrada.');
        return;
    }

    // Limpiar solo si es necesario evitar múltiples llamadas
    if (Object.keys(editableCurrencies).length) return;

    tableBody.innerHTML = ''; // Limpiar tabla sólo una vez

    divisas.forEach(divisa => {
        if (divisa.nombre === 'CLP') return; // Excluir la divisa CLP

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
            compra: parseFloat(formattedCompra) || 0,
            venta: parseFloat(formattedVenta) || 0,
            icono_circular: divisa.icono_circular,
            icono_cuadrado: divisa.icono_circular.replace('circular', 'cuadrado'),
        };
    });

    setupEditInputs();
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

            if (editableCurrencies[currency]) {
                editableCurrencies[currency][field] = isNaN(newValue) ? 0 : newValue;
            }
        });
    });
}

function saveEditedCurrencies() {
    console.log('Guardando la Tabla');
    const changesToSave = Object.values(editableCurrencies).filter(divisa =>
        divisa.compra !== undefined || divisa.venta !== undefined
    );

    if (!changesToSave.length) {
        alert("No se encontraron cambios para guardar.");
        return;
    }

    fetch('https://cambiosorion.cl/data/divisas_api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changesToSave),
    })
        .then(response => {
            if (!response.ok) throw new Error('No se guardaron los cambios.');
            return response.json();
        })
        .then(data => {
            alert("Cambios guardados exitosamente.");
            console.log(data);
        })
        .catch(error => {
            alert("Error al guardar cambios.");
            console.error(error);
        });
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
