import { initPizarrasHeader } from './header.js';

let editableCurrencies = {};
let isFetchingCurrencies = false;

document.addEventListener('DOMContentLoaded', async() => {
    // 1. Inicializar Header Global (Maneja la sesión y validación de usuario)
    await initPizarrasHeader('tasas');

    // 2. Inicializar carga de datos
    loadCurrenciesForEdit();

    // 3. Configurar BOTONES de guardar
    const saveButtons = document.querySelectorAll('.save-action-btn');
    saveButtons.forEach(btn => {
        btn.addEventListener('click', saveEditedCurrencies);
    });

    // 4. Configurar botón del modal
    const modalBtn = document.getElementById('modal-close-btn');
    if (modalBtn) {
        modalBtn.addEventListener('click', hideStatusModal);
    }

    // 5. Configurar menú móvil
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

window.openPopupWindow = function(url, title, width, height) {
    const left = (screen.width - width) / 2;
    const top = (screen.height - height) / 2;
    window.open(url, title, `width=${width},height=${height},top=${top},left=${left},resizable=yes,scrollbars=yes`);
};

function loadCurrenciesForEdit() {
    if (isFetchingCurrencies) return;
    isFetchingCurrencies = true;

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

// === LÓGICA DE FORMATEO ===

// Convierte 1042.5 -> "1.042,5" para mostrar
function formatNumberCL(value) {
    if (value === null || value === undefined) return '';
    // Convierte a string y reemplaza punto decimal por coma
    let str = parseFloat(value).toString();
    str = str.replace('.', ',');
    
    // Separa enteros y decimales
    let parts = str.split(',');
    // Agrega puntos de mil a la parte entera
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    
    return parts.join(',');
}

function fillEditCurrencyTable(divisas) {
    const tableBody = document.querySelector('#currency-list');
    if (!tableBody) return;

    tableBody.innerHTML = ''; 
    editableCurrencies = {};  

    divisas.forEach(divisa => {
        if (divisa.nombre === 'CLP') return; 

        // Formato inicial para mostrar (con puntos y comas)
        const formattedCompra = formatNumberCL(divisa.compra);
        const formattedVenta = formatNumberCL(divisa.venta);

        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td class="py-4">
                <img src="${divisa.icono_circular}" alt="${divisa.nombre}" class="w-10 h-10 object-contain mx-auto drop-shadow-md hover:scale-110 transition-transform">
            </td>
            <td class="font-medium text-slate-200">${divisa.nombre}</td>
            <td class="p-2">
                <input type="text" inputmode="decimal"
                       class="glass-input edit-input" 
                       data-currency="${divisa.nombre}" 
                       data-field="compra" 
                       value="${formattedCompra}">
            </td>
            <td class="p-2">
                <input type="text" inputmode="decimal"
                       class="glass-input edit-input" 
                       data-currency="${divisa.nombre}" 
                       data-field="venta" 
                       value="${formattedVenta}">
            </td>
        `;
        tableBody.appendChild(row);

        // Guardamos los valores numéricos reales en memoria
        editableCurrencies[divisa.nombre] = {
            nombre: divisa.nombre,
            compra: parseFloat(divisa.compra) || 0,
            venta: parseFloat(divisa.venta) || 0,
            icono_circular: divisa.icono_circular
        };
    });

    setupEditInputs();
}

function setupEditInputs() {
    const editInputs = document.querySelectorAll('.edit-input');
    editInputs.forEach(input => {
        input.addEventListener('input', handleCurrencyInput);
    });
}

// Maneja la escritura: Formatea visualmente y guarda el número real
function handleCurrencyInput(e) {
    const input = e.target;
    let value = input.value;

    // 1. Limpiar: Permitir solo números y coma
    // Eliminamos todo lo que no sea dígito o coma
    value = value.replace(/[^0-9,]/g, '');

    // 2. Control de Comas: Solo permitir una coma
    const parts = value.split(',');
    if (parts.length > 2) {
        // Si hay más de una coma, tomamos la primera parte como entero y el resto lo unimos
        value = parts[0] + ',' + parts.slice(1).join('');
    }

    // 3. Formatear la parte entera (agregar puntos)
    // Quitamos puntos previos para reformatear
    let integerPart = parts[0].replace(/\./g, '');
    
    // Si empieza con 0 y tiene más dígitos, quitamos el 0 (ej: 05 -> 5), salvo que sea "0,"
    if (integerPart.length > 1 && integerPart.startsWith('0')) {
        integerPart = integerPart.substring(1);
    }
    if (integerPart === '') integerPart = ''; // Permitir vacío mientras escribe

    // Aplicar puntos de mil
    if (integerPart !== '') {
        integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }

    // 4. Reconstruir el valor
    let newValue = integerPart;
    if (value.includes(',')) {
        // Si el usuario escribió coma, la agregamos (con sus decimales si los tiene)
        newValue += ',' + (parts[1] ? parts[1] : '');
    }

    // 5. Actualizar el input solo si cambió (para no entorpecer el cursor más de lo necesario)
    if (newValue !== input.value) {
        input.value = newValue;
    }

    // 6. Actualizar el objeto de datos con el valor numérico real
    updateCurrencyData(input);
}

function updateCurrencyData(input) {
    const { currency, field } = input.dataset;
    // Para guardar: quitar puntos, cambiar coma por punto
    let cleanVal = input.value.replace(/\./g, '').replace(',', '.');
    let numVal = parseFloat(cleanVal);

    if (editableCurrencies[currency]) {
        editableCurrencies[currency][field] = isNaN(numVal) ? 0 : numVal;
    }
}

function saveEditedCurrencies() {
    const changesToSave = Object.values(editableCurrencies);
    
    if (!changesToSave.length) {
        showStatusModal('error', 'Sin datos', 'No hay información cargada para guardar.');
        return;
    }

    const saveButtons = document.querySelectorAll('.save-action-btn');
    const originalTexts = [];
    
    saveButtons.forEach((btn, index) => {
        originalTexts[index] = btn.innerHTML;
        btn.innerHTML = `<svg class="animate-spin -ml-1 mr-2 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Guardando...`;
        btn.disabled = true;
    });

    const currentTimestamp = new Date().toLocaleString('en-US', { timeZone: 'America/Santiago' });

    const validChanges = changesToSave.map(divisa => ({
        nombre: divisa.nombre,
        compra: parseFloat(divisa.compra) || 0,
        venta: parseFloat(divisa.venta) || 0,
        fecha_actualizacion: currentTimestamp,
    }));

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
        showStatusModal('success', '¡Guardado!', 'Los precios han sido actualizados correctamente en todas las pizarras.');
    })
    .catch(error => {
        console.error("Error guardando:", error);
        showStatusModal('error', 'Error al guardar', 'Hubo un problema al conectar con el servidor. Inténtalo de nuevo.');
    })
    .finally(() => {
        saveButtons.forEach((btn, index) => {
            btn.innerHTML = originalTexts[index] || 'Guardar Cambios';
            btn.disabled = false;
        });
    });
}

function showStatusModal(type, title, message) {
    const modal = document.getElementById('status-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    const modalIconBg = document.getElementById('modal-icon-bg');
    const modalIcon = document.getElementById('modal-icon');
    const modalBtn = document.getElementById('modal-close-btn');

    if(!modal) return;

    modalTitle.textContent = title;
    modalMessage.textContent = message;

    if (type === 'success') {
        modalIconBg.className = "mx-auto flex items-center justify-center h-16 w-16 rounded-full mb-4 bg-green-900/30 border border-green-500/30";
        modalIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>';
        modalIcon.classList.remove('text-red-500');
        modalIcon.classList.add('text-green-500');
        modalBtn.className = "w-full inline-flex justify-center rounded-xl shadow-lg px-4 py-3 text-base font-bold text-white bg-green-600 hover:bg-green-700 focus:outline-none transition-transform hover:scale-105";
    } else {
        modalIconBg.className = "mx-auto flex items-center justify-center h-16 w-16 rounded-full mb-4 bg-red-900/30 border border-red-500/30";
        modalIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>';
        modalIcon.classList.remove('text-green-500');
        modalIcon.classList.add('text-red-500');
        modalBtn.className = "w-full inline-flex justify-center rounded-xl shadow-lg px-4 py-3 text-base font-bold text-white bg-red-600 hover:bg-red-700 focus:outline-none transition-transform hover:scale-105";
    }

    modal.classList.remove('hidden');
}

function hideStatusModal() {
    const modal = document.getElementById('status-modal');
    if(modal) modal.classList.add('hidden');
}