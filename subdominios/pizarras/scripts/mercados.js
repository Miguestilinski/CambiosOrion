// /var/www/html/pizarras/scripts/mercados.js
import { initPizarrasHeader } from './header.js';

document.addEventListener('DOMContentLoaded', async() => {
    // 1. Inicializar Header Global
    await initPizarrasHeader('mercados');

    // 2. Configurar menú móvil (lógica local)
    const navBtn = document.getElementById('nav-menu-button');
    if(navBtn) {
        navBtn.addEventListener('click', (e) => {
            const menu = document.getElementById('nav-mobile-menu'); 
            if(menu) menu.classList.toggle('hidden');
        });
    }

    // 3. Cargar Widgets de TradingView
    loadTradingViewWidgets();

    console.log("Orion Markets Dashboard: Online");
});

function loadTradingViewWidgets() {
    // Configuración base común para los mini-gráficos
    const commonConfig = {
        "width": "100%",
        "height": "100%",
        "locale": "es",
        "dateRange": "1D",
        "colorTheme": "dark",
        "isTransparent": true,
        "autosize": true,
        "largeChartUrl": ""
    };

    // URL del script para los gráficos individuales
    const miniChartScript = "https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js";

    // 1. Cargar Gráficos Individuales
    loadWidget("widget-usd", miniChartScript, { ...commonConfig, "symbol": "FX_IDC:USDCLP" });
    loadWidget("widget-eur", miniChartScript, { ...commonConfig, "symbol": "FX_IDC:EURCLP" });
    loadWidget("widget-gold", miniChartScript, { ...commonConfig, "symbol": "OANDA:XAUUSD" });
    loadWidget("widget-copper", miniChartScript, { ...commonConfig, "symbol": "COMEX:HG1!" });
    loadWidget("widget-oil", miniChartScript, { ...commonConfig, "symbol": "TVC:USOIL" });
    loadWidget("widget-dxy", miniChartScript, { ...commonConfig, "symbol": "TVC:DXY" });

    // 2. Cargar Cinta Ticker (Footer)
    const tickerScript = "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js";
    loadWidget("widget-ticker", tickerScript, {
        "symbols": [
            { "proName": "FOREXCOM:SPXUSD", "title": "S&P 500" },
            { "proName": "FOREXCOM:NSXUSD", "title": "US 100" },
            { "proName": "FX_IDC:USDCLP", "title": "USD/CLP" },
            { "proName": "BITSTAMP:BTCUSD", "title": "Bitcoin" },
            { "proName": "BINANCE:ETHUSD", "title": "Ethereum" }
        ],
        "showSymbolLogo": true,
        "colorTheme": "dark",
        "isTransparent": true,
        "displayMode": "adaptive",
        "locale": "es"
    });
}

// Función auxiliar para inyectar scripts
function loadWidget(containerId, scriptSrc, config) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Crear el div interno que requiere TradingView
    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container__widget h-full w-full';
    container.appendChild(widgetDiv);

    // Crear el script
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = scriptSrc;
    script.async = true;
    script.innerHTML = JSON.stringify(config); // Aquí el JSON se convierte a texto válido

    container.appendChild(script);
}