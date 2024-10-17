// Aquí puedes añadir las tasas de conversión
const exchangeRates = {
    "USD": {
        "CLP": 850,
        "EUR": 0.85
    },
    "CLP": {
        "USD": 0.0012,
        "EUR": 0.001
    },
    "EUR": {
        "USD": 1.18,
        "CLP": 1000
    }
};

function convert() {
    const amount1 = document.getElementById("amount1").value;
    const currency1 = document.getElementById("currency1").value;
    const currency2 = document.getElementById("currency2").value;

    if (amount1 && exchangeRates[currency1] && exchangeRates[currency1][currency2]) {
        const rate = exchangeRates[currency1][currency2];
        const result = amount1 * rate;
        document.getElementById("amount2").value = result.toFixed(2);
    } else {
        document.getElementById("amount2").value = "0.00";
    }
}
