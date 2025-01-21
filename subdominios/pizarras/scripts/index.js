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
            openPopupWindow('normal', 'Pizarra Normal', 1080, 1920);
        });
    }

    if (catalogButtonDestacadas) {
        catalogButtonDestacadas.addEventListener('click', () => {
            openPopupWindow('destacadas', 'Pizarra Destacadas', 1080, 1920);
        });
    }
}

/**
 * Función para abrir una ventana emergente personalizada.
 * @param {string} url - La URL que se abrirá en el pop-up.
 * @param {string} title - El título de la ventana.
 * @param {number} width - El ancho del pop-up.
 * @param {number} height - El alto del pop-up.
 */
function openPopupWindow(url, title, width, height) {
    const left = (screen.width - width) / 2; // Centrar la ventana horizontalmente
    const top = (screen.height - height) / 2; // Centrar la ventana verticalmente

    window.open(
        url,
        title,
        `width=${width},height=${height},top=${top},left=${left},resizable=yes,scrollbars=yes`
    );
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

let isFetchingCurrencies = false;

function loadCurrenciesForEdit() {
    if (isFetchingCurrencies) return;
    isFetchingCurrencies = true;

    const targetUrl = './data/divisas_api.php?_=' + new Date().getTime();
    
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
        })
        .finally(() => {
            isFetchingCurrencies = false;
        });
}

function fillEditCurrencyTable(divisas) {
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

        // Comprobar si la divisa ya está en editableCurrencies
        if (editableCurrencies[divisa.nombre]) {
            console.log(`Divisa duplicada detectada: ${divisa.nombre}`);
            return; // Evitar duplicar divisas
        }

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

// Prevenir que el evento de scroll modifique los datos
document.querySelector('#currency-list')?.addEventListener('scroll', (e) => {
    e.stopImmediatePropagation();
});

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
    const changesToSave = Object.values(editableCurrencies).filter(divisa =>
        divisa.compra !== undefined || divisa.venta !== undefined
    );

    if (!changesToSave.length) {
        alert("No se encontraron cambios para guardar.");
        return;
    }

    const currentTimestamp = new Date().toISOString();

    // Enviar cambios al servidor asegurando no enviar campos vacíos
    const validChanges = changesToSave.map(divisa => ({
        nombre: divisa.nombre,
        compra: parseFloat(divisa.compra) || 0,
        venta: parseFloat(divisa.venta) || 0,
        fecha_actualizacion: currentTimestamp,
    }));

    // Enviar cada divisa individualmente usando el método PUT
    validChanges.forEach(divisa => {
        fetch('./data/divisas_api.php', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(divisa),
        })
            .then(response => {
                if (!response.ok) throw new Error('No se guardaron los cambios para la divisa: ' + divisa.nombre);
                return response.json();
            })
            .then(data => {
                console.log("Actualización exitosa para", divisa.nombre, ":", data);
            })
            .catch(error => {
                console.log("Error al guardar cambios.");
                console.error(error);
            });
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
