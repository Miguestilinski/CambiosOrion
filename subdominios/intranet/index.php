<?php
$url = 'https://cambiosorion.cl/data/check_session.php';
$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
curl_close($ch);

if ($response) {
    eval("?>$response<?>");
} else {
    die('No se pudo cargar el archivo remoto.');
}

verificarAccesoAdmin();
?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sistema Caja</title>
    <link rel="stylesheet" href="https://cambiosorion.cl/orionapp/public/styles/header.css">
    <link rel="stylesheet" href="https://cambiosorion.cl/orionapp/public/styles/footer.css">
    <link rel="stylesheet" href="./styles/index.css">
    <link href="https://cambiosorion.cl/orionapp/public/styles/output.css" rel="stylesheet">
    <link rel="icon" href="https://cambiosorion.cl/orionapp/icons/favicon.png" type="image/png">
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">  
</head>
<body>
    <script type="module" src="https://cdnjs.cloudflare.com/ajax/libs/fetch/3.6.2/fetch.min.js" crossorigin="anonymous"></script>
    <header>
        <!-- Logo y Nombre -->
        <div class="header-logo">
            <a href="index">
                <img src="https://cambiosorion.cl/orionapp/assets/LogoOrion-silver.png" alt="Logo Cambios Orion" class="logo">
            </a>
            <a href="index">
                <img src="https://cambiosorion.cl/orionapp/assets/NombreOrion-white.png" alt="Nombre Cambios Orion" class="nombre">
            </a>
        </div>
    
        <!-- Botones para versión móvil -->
        <div class="mobile-buttons">
            <button class="menu-button" id="nav-menu-button">
                <img src="https://cambiosorion.cl/orionapp/icons/menu-white.svg" alt="Menú">
            </button>
            <button class="menu-button" id="session-menu-button">
                <img src="https://cambiosorion.cl/orionapp/icons/profile-white.png" alt="Sesión">
            </button>
        </div>
    
        <!-- Menús desplegables para móvil -->
        <div id="nav-mobile-menu" class="mobile-menu hidden bg-white divide-y divide-gray-100 rounded-lg shadow w-44">
            <ul class="py-2 text-sm text-gray-700">
                <li><a href="index" class="block px-4 py-2 hover:bg-gray-100">Admin</a></li>
            </ul>
            <ul class="py-2 text-sm text-gray-700">
                <li><a href="https://pizarras.cambiosorion.cl/" class="block px-4 py-2 hover:bg-gray-100">Pizarras</a></li>
            </ul>
            <ul class="py-2 text-sm text-gray-700">
                <li><a href="https://intranet.cambiosorion.cl/" class="block px-4 py-2 hover:bg-gray-100">Intranet</a></li>
            </ul>
            <ul class="py-2 text-sm text-gray-700">
                <li><a href="https://cambiosorion.cl/webmail" class="block px-4 py-2 hover:bg-gray-100">Correo</a></li>
            </ul>
        </div>
    
        <div class="mobile-menu hidden bg-white rounded-lg shadow w-44" id="session-mobile-menu">
            <div id="guest-actions-mobile" class="divide-y divide-gray-100" style="display:none;">
                <ul class="py-2 text-sm text-gray-700">
                    <li><a href="https://admin.cambiosorion.cl/login" class="block px-4 py-2 hover:bg-gray-100">Iniciar Sesión</a></li>
                </ul>
            </div>
            <div id="user-actions-mobile" class="divide-y divide-gray-100" style="display:none;">
                <div class="px-2 py-2 text-sm text-gray-900">
                    <div id="user-name">Nombre del usuario</div>
                    <div id="user-email" class="mail font-medium truncate">Correo del usuario</div>
                </div>
                <ul class="py-2 text-sm text-gray-700" id="menu-admin-mobile" style="display: none;">
                    <li><a href="https://admin.cambiosorion.cl/" class="block px-4 py-2 hover:bg-gray-100">Portal Admin</a></li>
                    <li><a href="https://cambiosorion.cl/webmail" class="block px-4 py-2 hover:bg-gray-100">Correo</a></li>
                </ul>
                <ul class="py-2 text-sm text-gray-700">
                    <li><a href="#" class="block px-4 py-2 hover:bg-gray-100" id="logout-button-mobile">Cerrar sesión</a></li>
                </ul>
            </div>
        </div>
    
        <!-- Menú de navegación para escritorio -->
        <nav>
            <ul>
                <li class="selected"><a href="https://intranet.cambiosorion.cl/">Sist. Cajas</a></li>
                <li><a href="https://intranet.cambiosorion.cl/tesoreria">Sist. Tesorería</a></li>
                <li><a href="https://admin.cambiosorion.cl/">Portal Admin</a></li>
                <li><a href="https://pizarras.cambiosorion.cl/">Pizarras</a></li>
                <li><a href="https://cambiosorion.cl/webmail">Correo</a></li>
            </ul>
        </nav>
    
        <!-- Acciones para escritorio -->
        <div class="header-actions">
            <!-- User actions -->
            <div id="user-actions" style="display:none;">
                <button id="profile-menu-button" class="text-white bg-transparent hover:bg-gray-200 focus:outline-none">
                    <img src="https://cambiosorion.cl/orionapp/icons/profile-white.png" alt="Profile">
                </button>
                <!-- Menú desplegable -->
                <div id="dropdownInformation" class="hidden bg-white divide-y divide-gray-100 rounded-lg shadow w-44">
                    <div class="px-4 py-3 text-sm text-gray-900">
                        <div id="user-name">Nombre del usuario</div>
                        <div id="user-email" class="mail font-medium truncate">Correo del usuario</div>
                    </div>
                    <ul class="py-2 text-sm text-gray-700" id="menu-admin" style="display: none;">
                        <li><a href="https://admin.cambiosorion.cl/" class="block px-4 py-2 hover:bg-gray-100">Portal Admin</a></li>
                        <li><a href="https://cambiosorion.cl/webmail" class="block px-4 py-2 hover:bg-gray-100">Correo</a></li>
                    </ul>
                    <ul class="py-2 text-sm text-gray-700">
                        <li><a href="#" class="block px-4 py-2 hover:bg-gray-100" id="logout-button">Cerrar sesión</a></li>
                    </ul>
                </div>
            </div>

            <!-- Guest actions -->
            <div id="guest-actions" style="display:none;">
                <a href="https://admin.cambiosorion.cl/login">Iniciar sesión</a>
            </div>
        </div>
    </header>

    <div class="header-divider"></div>
    <div class="main-content">
        <aside id="sidebar" class="sidebar">
            <div class="sidebar-header">
                <h2>Herramientas</h2>
            </div>
            <ul class="menu">
                <li class="menu-item mt-2 mb-2 rounded-lg active" data-section="transacciones">Ver Transacciones</li>
                <li class="menu-item mt-2 mb-2 rounded-lg" data-section="transaccioness-uaf">Transacciones UAF</li>
                <li class="menu-item mt-2 mb-2 rounded-lg" data-section="libros-contables">Libros Contables</li>
                <li class="menu-item mt-2 mb-2 rounded-lg" data-section="facrturas-electr">Facturas Electrónicas</li>
                <li class="menu-item mt-2 mb-2 rounded-lg" data-section="tasas-sucursal">Tasas de Cambio por Sucursal</li>
                <li class="menu-item mt-2 mb-2 rounded-lg" data-section="tasas-caja">Tasas de Cambio por Caja</li>
                <li class="menu-item mt-2 mb-2 rounded-lg" data-section="transferencias">Transferencias</li>
                <li class="menu-item mt-2 mb-2 rounded-lg" data-section="traspasos">Traspasos</li>
                <li class="menu-item mt-2 mb-2 rounded-lg" data-section="ingresos">Ingresos</li>
                <li class="menu-item mt-2 mb-2 rounded-lg" data-section="egresos">Egresos/Retiros</li>
                <li class="menu-item mt-2 mb-2 rounded-lg" data-section="arqueo-caja">Arqueo de Caja</li>
                <li class="menu-item mt-2 mb-2 rounded-lg" data-section="inventario">Inventarios</li>
                <li class="menu-item mt-2 mb-2 rounded-lg" data-section="invent-cons">Inventarios Consolidados</li>
                <li class="menu-item mt-2 mb-2 rounded-lg" data-section="invent-hist">Inventarios Históricos</li>
                <li class="menu-item mt-2 mb-2 rounded-lg" data-section="reportes">Reportes</li>
                <li class="menu-item mt-2 mb-2 rounded-lg" data-section="divisas">Divisas</li>
                <li class="menu-item mt-2 mb-2 rounded-lg" data-section="asign-cajeros">Asignar Cajeros</li>
                <li class="menu-item mt-2 mb-2 rounded-lg" data-section="fichas-clientes">Fichas Clientes</li>
                <li class="menu-item mt-2 mb-2 rounded-lg" data-section="sucursales">Sucursales</li>
                <li class="menu-item mt-2 mb-2 rounded-lg" data-section="config">Configuración</li>
                <li class="menu-item mt-2 mb-2 rounded-lg" data-section="usuarios">Usuarios</li>
            </ul>
        </aside>
        <main id="dashboard-content" class="dashboard-content">
            <section id="transacciones" class="content-section active">
                <h1 class="mb-2 text-2xl font-medium leading-none text-white">Ver Transaccciones</h1>
                <p class="mb-6 text-md text-white">Consulta tu información personal.</p>
            </section>         
            <section id="transaccciones-uaf" class="content-section">
                <h1 class="mb-2 text-2xl font-medium leading-none text-white">Transaccciones UAF</h1>
                <p class="mb-6 text-md text-white">Consulta tu historial de liquidaciones.</p>
            </section>                                        
            <section id="libros-contables" class="content-section">
                <h1 class="mb-2 text-2xl font-medium leading-none text-white">Libros Contables</h1>
                <p class="mb-6 text-md text-white">Consulta tu sueldo restante para un anticipo.</p>
            </section>
            <section id="facrturas-electr" class="content-section">
                <h1 class="mb-2 text-2xl font-medium leading-none text-white">Descarga de Facturas Electrónicas</h1>
                <p class="mb-6 text-md text-white">Consulta tus documentos legales de la empresa.</p>
            </section>
            <section id="tasas-sucursal" class="content-section">
                <h1 class="mb-2 text-2xl font-medium leading-none text-white">Tasas de Cambio por Sucursal</h1>
                <p class="mb-6 text-md text-white">Sube aquí tus licencias médicas.</p>
            </section>
            <section id="tasas-caja" class="content-section">
                <h1 class="mb-2 text-2xl font-medium leading-none text-white">Tasas de Cambio por Caja</h1>
                <p class="mb-6 text-md text-white">Sube aquí tus licencias médicas.</p>
            </section>
            <section id="transferencias" class="content-section">
                <h1 class="mb-2 text-2xl font-medium leading-none text-white">Transferencias</h1>
                <p class="mb-6 text-md text-white">Sube aquí tus licencias médicas.</p>
            </section>
            <section id="ingresos" class="content-section">
                <h1 class="mb-2 text-2xl font-medium leading-none text-white">Ingresos</h1>
                <p class="mb-6 text-md text-white">Sube aquí tus licencias médicas.</p>
            </section>
            <section id="egresos" class="content-section">
                <h1 class="mb-2 text-2xl font-medium leading-none text-white">Egresos/Retiros</h1>
                <p class="mb-6 text-md text-white">Sube aquí tus licencias médicas.</p>
            </section>
            <section id="arqueo-caja" class="content-section">
                <h1 class="mb-2 text-2xl font-medium leading-none text-white">Arqueo de Caja</h1>
                <p class="mb-6 text-md text-white">Sube aquí tus licencias médicas.</p>
            </section>
            <section id="inventario" class="content-section">
                <h1 class="mb-2 text-2xl font-medium leading-none text-white">Inventarios</h1>
                <p class="mb-6 text-md text-white">Sube aquí tus licencias médicas.</p>
            </section>
            <section id="invent-cons" class="content-section">
                <h1 class="mb-2 text-2xl font-medium leading-none text-white">Inventarios Consolidados</h1>
                <p class="mb-6 text-md text-white">Sube aquí tus licencias médicas.</p>
            </section>
            <section id="invent-hist" class="content-section">
                <h1 class="mb-2 text-2xl font-medium leading-none text-white">Inventarios Históricos</h1>
                <p class="mb-6 text-md text-white">Sube aquí tus licencias médicas.</p>
            </section>
            <section id="reportes" class="content-section">
                <h1 class="mb-2 text-2xl font-medium leading-none text-white">Reportes</h1>
                <p class="mb-6 text-md text-white">Sube aquí tus licencias médicas.</p>
            </section>
            <section id="divisas" class="content-section">
                <h1 class="mb-2 text-2xl font-medium leading-none text-white">Divisas</h1>
                <p class="mb-6 text-md text-white">Sube aquí tus licencias médicas.</p>
            </section>
            <section id="asign-cajeros" class="content-section">
                <h1 class="mb-2 text-2xl font-medium leading-none text-white">Asignar Cajeros</h1>
                <p class="mb-6 text-md text-white">Sube aquí tus licencias médicas.</p>
            </section>
            <section id="fichas-clientes" class="content-section">
                <h1 class="mb-2 text-2xl font-medium leading-none text-white">Fichas Clientes</h1>
                <p class="mb-6 text-md text-white">Consulta tus días disponibles para vacaiones.</p>
            </section>
            <section id="sucursales" class="content-section">
                <h1 class="mb-2 text-2xl font-medium leading-none text-white">Sucursales</h1>
                <p class="mb-6 text-md text-white">Sube aquí tus licencias médicas.</p>
            </section>
            <section id="config" class="content-section">
                <h1 class="mb-2 text-2xl font-medium leading-none text-white">Configuraciones</h1>
                <p class="mb-6 text-md text-white">Sube aquí tus licencias médicas.</p>
            </section>
            <section id="usuarios" class="content-section">
                <h1 class="mb-2 text-2xl font-medium leading-none text-white">Usuarios</h1>
                <p class="mb-6 text-md text-white">Sube aquí tus licencias médicas.</p>
            </section>
        </main>
    </main>
    </div> 

    <footer>
        <div class="footer-container">
            <!-- Sección del logo -->
            <div class="footer-logo">
                <img src="https://cambiosorion.cl/orionapp/assets/LogoOrion-silver.png" alt="Logo Orion" class="logo">
                <img src="https://cambiosorion.cl/orionapp/assets/NombreOrion-white.png" alt="Nombre Orion" class="nombre">
            </div>
            <!-- Mapa de navegación -->
            <div class="footer-navigation flex justify-between">
                <div class="nav-section">
                    <h3 href="https://admin.cambiosorion.cl/" class="font-bold text-lg">Admin</h3>
                    <ul class="list-none p-0">
                        <li><a href="https://admin.cambiosorion.cl/#vacaciones" class="block py-1">Vacaciones</a></li>
                        <li><a href="https://admin.cambiosorion.cl/" class="block py-1">Adelantos</a></li>
                    </ul>
                </div>
                <div class="nav-section">
                    <h3 href="https://pizarras.cambiosorion.cl/" class="font-bold text-lg">Pizarras</h3>
                    <ul class="list-none p-0">
                        <li><a href="https://pizarras.cambiosorion.cl/normal" class="block py-1">Normal</a></li>
                        <li><a href="https://pizarras.cambiosorion.cl/destacadas" class="block py-1">Destacadas</a></li>
                    </ul>
                </div>
                <div class="nav-section">
                    <h3 class="font-bold text-lg">Intranet</h3>
                    <ul class="list-none p-0">
                        <li><a href="https://intranet.cambiosorion.cl/" class="block py-1">Sist. Cajas</a></li>
                        <li><a href="https://intranet.cambiosorion.cl/tesorería" class="block py-1">Sist. Tesorería</a></li>
                    </ul>
                </div>
            </div>
            <!-- Información de contacto -->
            <div class="footer-contact flex flex-wrap justify-between">
            </div>         
        </div>
        <div class="footer-bottom text-xs text-center p-4">
            © 2025 Cambios Orion. Todos los derechos reservados.
        </div>
    </footer>

    <script src="https://cambiosorion.cl/orionapp/node_modules/flowbite/dist/flowbite.min.js"></script>
    <script type="module" src="https://cambiosorion.cl/orionapp/public/scripts/header.js" crossorigin="anonymous"></script>
    <script type="module" src="./scripts/index.js"></script>
</body>
</html>
