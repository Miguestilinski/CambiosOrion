import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";

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

// Obtener el elemento del pop-up
const offlinePopup = document.getElementById('offline-popup');

// Función para mostrar el pop-up si no hay conexión
function updateOnlineStatus() {
    if (!navigator.onLine) {
        offlinePopup.style.display = 'block';
    } else {
        offlinePopup.style.display = 'none';
    }
}

// Escuchar cambios en el estado de la conexión
window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);
updateOnlineStatus();

// Agregar el audio para la alerta
const priceAlert = new Audio('/orionapp/sounds/alert.mp3');

// Objeto para almacenar los precios anteriores
let preciosAnteriores = {};

// Escuchar los cambios en Firebase
onValue(dbRef, (snapshot) => {
    if (!snapshot.exists()) {
        console.error("No data available in Firebase for 'Divisas'");
        return;
    }

    const data = snapshot.val();
    const list = document.getElementById("currency-list");

    // Limpiar la lista anterior
    list.innerHTML = '';

    const divisasOrdenadas = [
        "USD", "EUR", "ARS", "BRL", "PEN", "COP",
        "UYU", "BOB", "CAD", "GBP", "JPY", "GNY",
        "SEK", "AUD", "MXN", "NZD", "CHF", "DKK",
        "ORO 100"
    ];

    let cambiosDetectados = false;

    divisasOrdenadas.forEach((key) => {
        const row = document.createElement("tr");

        if (data[key]) {
            const { icono, compra, venta } = data[key];

            // Comparar con los precios anteriores
            if (preciosAnteriores[key]) {
                const { compra: compraAnterior, venta: ventaAnterior } = preciosAnteriores[key];
                if (compraAnterior !== compra || ventaAnterior !== venta) {
                    cambiosDetectados = true; // Se detectaron cambios
                }
            }

            // Guardar los precios actuales
            preciosAnteriores[key] = { compra, venta };

            row.innerHTML = `
                <td class="icono"><img src="${icono}" alt="${key} icon"></td>
                <td class="nombre">${key}</td>
                <td class="compra compra-${key}">${compra}</td>
                <td class="venta venta-${key}">${venta}</td>
            `;
        }

        list.appendChild(row);
    });

    // Si se detectaron cambios, reproducir el sonido
    if (cambiosDetectados) {
        priceAlert.play().catch(error => {
            console.error("Error reproduciendo el sonido de alerta:", error);
        });
    }
}, (error) => {
    console.error("Error retrieving data from Firebase:", error);
});
