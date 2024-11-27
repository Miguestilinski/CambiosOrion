import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getDatabase, ref, onValue, set } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyBiGcvDMop_Hn34S4FREinSx3fMViNeaSQ",
    authDomain: "cambiosorion1035.firebaseapp.com",
    databaseURL: "https://cambiosorion1035-default-rtdb.firebaseio.com",
    projectId: "cambiosorion1035",
    storageBucket: "cambiosorion1035.appspot.com",
    messagingSenderId: "200079092450",
    appId: "1:200079092450:web:9443f0d49831483532ccbb",
    measurementId: "G-XL1LBMP2GW"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const dbRef = ref(database, 'Divisas');
const auth = getAuth(app);

let divisasData = {}; // Aquí guardaremos los datos de las divisas para su posterior uso.

// Verificar el estado de autenticación
onAuthStateChanged(auth, (user) => {
    if (user) {
        const userId = user.uid;
        const userRoleRef = ref(database, `users/${userId}/role`);

        onValue(userRoleRef, (snapshot) => {
            const role = snapshot.val();

            if (role === 'admin') {
                loadData();
            } else {
                window.location.href = 'catalogo.html';
            }
        }, { onlyOnce: true });
    } else {
        window.location.href = 'catalogo.html';
    }
});

// Función para cargar los datos de divisas
function loadData() {
    onValue(dbRef, (snapshot) => {
        divisasData = snapshot.val(); // Guardamos los datos de las divisas aquí
        const list = document.getElementById("currency-list");
        list.innerHTML = '';

        const divisasOrdenadas = [
            "USD", "EUR", "ARS", "BRL", "PEN", "COP", 
            "UYU", "BOB", "CAD", "GBP", "JPY", "GNY", 
            "SEK", "AUD", "MXN", "NZD", "CHF", "DKK", 
            "ORO 100"
        ];

        divisasOrdenadas.forEach((key) => {
            const row = document.createElement("tr");
            if (divisasData[key]) {
                const { icono, compra, venta } = divisasData[key];

                row.innerHTML = `
                    <td class="icono"><img src="${icono}" alt="${key} icon"></td>
                    <td class="nombre">${key}</td>
                    <td><input type="number" step="0.01" value="${compra}" data-key="${key}" data-type="compra"></td>
                    <td><input type="number" step="0.01" value="${venta}" data-key="${key}" data-type="venta"></td>
                `;
            }

            list.appendChild(row);
        });
    });
}

// Guardar cambios en la base de datos
document.getElementById('save-button').addEventListener('click', () => {
    const inputs = document.querySelectorAll('input[type="number"]');

    inputs.forEach((input) => {
        const key = input.getAttribute('data-key');
        const type = input.getAttribute('data-type');
        const value = parseFloat(input.value);

        if (divisasData[key] && value !== divisasData[key][type]) {
            divisasData[key][type] = value; // Actualizamos el valor en divisasData

            // Actualizar la base de datos
            set(ref(database, `Divisas/${key}`), divisasData[key])
                .then(() => {
                    console.log(`Valor de ${type} para ${key} actualizado exitosamente.`);
                })
                .catch((error) => {
                    console.error(`Error actualizando ${type} para ${key}: `, error);
                });
        }
    });
});

// Abrir el catálogo en una nueva ventana
document.getElementById('catalog-button-normal').addEventListener('click', () => {
    window.open('catalogo.html', '_blank', 'width=1080,height=1920');
});

// Abrir el catálogo destacado en una nueva ventana
document.getElementById('catalog-button-destacadas').addEventListener('click', () => {
    window.open('destacadas.html', '_blank', 'width=1080,height=1920');
});