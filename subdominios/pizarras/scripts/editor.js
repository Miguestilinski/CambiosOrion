let editableCurrencies = {};
let isFetchingCurrencies = false;

document.addEventListener('DOMContentLoaded', () => {
    // 1. Inicializar carga de datos
    loadCurrenciesForEdit();

    // 2. Configurar botón de guardar
    const saveButton = document.getElementById('save-button');
    if (saveButton) {
        saveButton.addEventListener('click', saveEditedCurrencies);
    }

    // 3. Configurar menú móvil (reutilizable)
    const navBtn = document.getElementById('nav-menu-button');
    const mobileMenu = document.getElementById('nav-mobile-menu');
    if(navBtn && mobileMenu) {
        navBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            mobileMenu.classList.toggle('hidden');
        });
        document.addEventListener('click', (e) => {
             if (!mobileMenu.contains(e.target) && !navBtn.contains(e.target)) {
                mobileMenu.classList.add('hidden');
            }
        });
    }
});

function loadCurrenciesForEdit() {
    if (isFetchingCurrencies) return;
    isFetchingCurrencies = true;

    // Cache buster para evitar datos viejos
    const targetUrl = 'https://cambiosorion.cl/data/divisas_api.php?_=' + new Date().getTime();
    
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
        .catch(error => console.error('Error al obtener las divisas:', error))
        .finally(() => {
            isFetchingCurrencies = false;
        });
}

function fillEditCurrencyTable(divisas) {
    const tableBody = document.querySelector('#currency-list');
    if (!tableBody) return;

    tableBody.innerHTML = ''; // Limpiar tabla
    editableCurrencies = {};  // Reiniciar objeto local

    divisas.forEach(divisa => {
        if (divisa.nombre === 'CLP') return; 

        // Formatear valores para quitar ceros innecesarios (ej: 950.00 -> 950)
        const formattedCompra = removeTrailingZeros(divisa.compra);
        const formattedVenta = removeTrailingZeros(divisa.venta);

        const row = document.createElement('tr');
        
        // AQUÍ: Se agregan las clases de tamaño a la imagen y glass-input a los inputs
        row.innerHTML = `
            <td class="py-4">
                <img src="${divisa.icono_circular}" alt="${divisa.nombre}" class="w-10 h-10 object-contain mx-auto drop-shadow-md hover:scale-110 transition-transform">
            </td>
            <td class="font-medium text-slate-200">${divisa.nombre}</td>
            <td class="p-2">
                <input type="number" 
                       class="glass-input edit-input" 
                       data-currency="${divisa.nombre}" 
                       data-field="compra" 
                       value="${formattedCompra}" 
                       step="any" min="0">
            </td>
            <td class="p-2">
                <input type="number" 
                       class="glass-input edit-input" 
                       data-currency="${divisa.nombre}" 
                       data-field="venta" 
                       value="${formattedVenta}" 
                       step="any" min="0">
            </td>
        `;
        tableBody.appendChild(row);

        // Guardar referencia en memoria
        editableCurrencies[divisa.nombre] = {
            nombre: divisa.nombre,
            compra: parseFloat(formattedCompra) || 0,
            venta: parseFloat(formattedVenta) || 0,
            icono_circular: divisa.icono_circular
        };
    });

    setupEditInputs();
}

function removeTrailingZeros(value) {
    if (value === null || value === undefined) return '';
    return parseFloat(value).toString();
}

function setupEditInputs() {
    const editInputs = document.querySelectorAll('.edit-input');
    editInputs.forEach(input => {
        input.addEventListener('input', event => {
            const { currency, field } = event.target.dataset;
            const newValue = parseFloat(event.target.value);

            if (editableCurrencies[currency]) {
                editableCurrencies[currency][field] = isNaN(newValue) ? 0 : newValue;
            }
        });
    });
}

function saveEditedCurrencies() {
    const changesToSave = Object.values(editableCurrencies);
    
    if (!changesToSave.length) {
        alert("No hay datos para guardar.");
        return;
    }

    const saveBtn = document.getElementById('save-button');
    const originalBtnText = saveBtn ? saveBtn.innerHTML : '';
    
    // Feedback visual de carga
    if(saveBtn) {
        saveBtn.innerHTML = `<svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Guardando...`;
        saveBtn.disabled = true;
    }

    const currentTimestamp = new Date().toLocaleString('en-US', { timeZone: 'America/Santiago' });

    const validChanges = changesToSave.map(divisa => ({
        nombre: divisa.nombre,
        compra: parseFloat(divisa.compra) || 0,
        venta: parseFloat(divisa.venta) || 0,
        fecha_actualizacion: currentTimestamp,
    }));

    // Promise.all para esperar a que todas las peticiones terminen
    Promise.all(validChanges.map(divisa => {
        return fetch('https://cambiosorion.cl/data/divisas_api.php', {
            method: 'PUT',
            mode: 'cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(divisa),
        }).then(res => {
            if (!res.ok) throw new Error(divisa.nombre);
            return res.json();
        });
    }))
    .then(() => {
        alert("✅ Precios actualizados correctamente.");
    })
    .catch(error => {
        console.error("Error guardando:", error);
        alert("⚠️ Hubo un error al guardar algunas divisas.");
    })
    .finally(() => {
        if(saveBtn) {
            saveBtn.innerHTML = originalBtnText;
            saveBtn.disabled = false;
        }
    });
}