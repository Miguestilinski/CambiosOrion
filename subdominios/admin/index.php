<?php
require_once 'https://cambiosorion.cl/data/check_session.php';
verificarAccesoAdmin(); // Verifica si el usuario tiene acceso
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Portal Admin</title>
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
                <li><a href="https://admin.cambiosorion.cl/" class="block px-4 py-2 hover:bg-gray-100">Portal Admin</a></li>
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
                <li class="selected"><a href="https://admin.cambiosorion.cl/">Portal Admin</a></li>
                <li><a href="https://pizarras.cambiosorion.cl/">Pizarras</a></li>
                <li><a href="https://intranet.cambiosorion.cl/">Intranet</a></li>
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
                <h2>Mi Perfil</h2>
            </div>
            <ul class="menu">
                <li class="menu-item mt-2 mb-2 rounded-lg active" data-section="info-personal">Datos Personales</li>
                <li class="menu-item mt-2 mb-2 rounded-lg" data-section="liquidaciones">Liquidaciones</li>
                <li class="menu-item mt-2 mb-2 rounded-lg" data-section="anticipos">Anticipos</li>
                <li class="menu-item mt-2 mb-2 rounded-lg" data-section="vacaciones">Vacaciones</li>
                <li class="menu-item mt-2 mb-2 rounded-lg" data-section="documentos">Documentos</li>
                <li class="menu-item mt-2 mb-2 rounded-lg" data-section="licencias-medicas">Licencias Medicas</li>
            </ul>
        </aside>
        <main id="dashboard-content" class="dashboard-content">
            <section id="info-personal" class="content-section active">
                <!-- Título de la sección -->
                <h1 class="mb-2 text-2xl font-medium leading-none text-white">Datos Personales</h1>
            
                <!-- Tipo de Usuario -->
                <h2 id="user-type" class="mb-4 text-md font-semibold leading-none text-white">Tipo Usuario</h2>
            
                <!-- Nombre del Usuario -->
                <div class="text-center">
                    <div id="user-name-dashboard" class="text-3xl font-bold text-white"></div>
                </div>
            
                <!-- Persona/Empresa o Rol -->
                <div class="text-center mb-4">
                    <p id="role-type" class="text-lg font-medium text-white">Rol</p>
                </div>
            
                <form id="personal-info-form" class="grid gap-4 mb-4 sm:grid-cols-2">
                    <!-- RUT (Visible solo para Clientes) -->
                    <div id="rut-group" class="hidden flex">
                        <label for="rut" class="block mb-2 mr-2 text-lg font-medium text-white">RUT:</label>
                        <div id="rut" class="ml-2 text-lg font-medium text-white"></div>
                    </div>
            
                    <!-- Correo -->
                    <div>
                        <label for="email" class="block text-lg font-medium text-white">Correo:</label>
                        <input type="email" id="email" name="email" placeholder="Ingresa tu correo" readonly class="bg-gray-50 border border-gray-300 text-white text-sm rounded-lg block w-full p-2.5">
                    </div>

                    <div id="password-group" class="flex mt-4">
                        <!-- Contraseña -->
                        <div id="new_pass" class="w-1/2 pr-4">
                            <label for="password" class="block mb-2 text-lg font-medium text-white">Nueva Contraseña:</label>
                            <input type="password" id="password" name="password" placeholder="•••••••••" class="bg-gray-50 border border-gray-300 text-white text-sm rounded-lg block w-full p-2.5">
                        </div>
                
                        <!-- Confirmar Contraseña -->
                        <div id="confirm_pass" class="w-1/2 pl-4">
                            <label for="confirm-password" class="block mb-2 text-lg font-medium text-white">Confirmar Contraseña:</label>
                            <input type="password" id="confirm-password" name="confirm-password" placeholder="•••••••••" class="bg-gray-50 border border-gray-300 text-white text-sm rounded-lg block w-full p-2.5">
                        </div>
                    </div>

                    <!-- Botón Guardar Cambios -->
                    <div class="sm:col-span-2">
                        <button id="save_changes" type="submit" class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center">
                            Guardar Cambios
                        </button>
                    </div>
                </form>
            </section>         
            <section id="liquidaciones" class="content-section">
                <h1 class="mb-2 text-2xl font-medium leading-none text-white">Liquidaciones</h1>
                <p class="mb-6 text-md text-white">Consulta tu historial de liquidaciones.</p>
            </section>                                        
            <section id="anticipos" class="content-section">
                <h1 class="mb-2 text-2xl font-medium leading-none text-white">Adelantos</h1>
                <p class="mb-6 text-md text-white">Consulta tu sueldo restante para un anticipo.</p>
            </section>
            <section id="vacaciones" class="content-section">
                <div class="container max-w-2xl mx-4 my-6 p-8 bg-white text-gray-900 rounded-xl shadow-md">
                    <h1 class="text-xl font-bold">Calculadora de Vacaciones</h1>
            
                    <!-- Información del trabajador -->
                    <div id="worker-info" class="my-4">
                        <p><strong>Fecha de ingreso:</strong> <span id="fecha-ingreso"></span></p>
                        <p><strong>Meses trabajados:</strong> <span id="meses-trabajados"></span></p>
                        <p><strong>Días disponibles:</strong> <span id="dias-disponibles"></span></p>
                        <p><strong>Días usados:</strong> <span id="dias-usados"></span></p>
                    </div>
            
                    <!-- Simulador -->
                    <div id="simulator" class="my-4">
                        <h2 class="text-lg font-bold">Simulador de Vacaciones</h2>
                        <label for="start-date">Fecha de salida:</label>
                        <input type="date" id="start-date" class="border p-1 rounded">
                    
                        <label for="end-date">Fecha de regreso:</label>
                        <input type="date" id="end-date" class="border p-1 rounded">
                    
                        <button id="simulate" class="bg-green-500 text-white px-4 py-2 rounded">Calcular</button>
                        <p id="simulation-result" class="mt-2"></p>
                    </div>
            
                    <!-- Calendario -->
                    <div id="calendar" class="my-4">
                        <h2 class="text-lg font-bold">Calendario</h2>
                        <div id="calendar-container" class="grid grid-cols-7 gap-2"></div>
                        <button id="save-dates" class="mt-4 bg-blue-500 text-white px-4 py-2 rounded">Guardar Días Seleccionados</button>
                    </div>
                </div>
            </section>
            <section id="documentos" class="content-section">
                <h1 class="mb-2 text-2xl font-medium leading-none text-white">Documentos</h1>
                <p class="mb-6 text-md text-white">Consulta tus documentos legales de la empresa.</p>
            </section>
            <section id="licencias-medicas" class="content-section">
                <h1 class="mb-2 text-2xl font-medium leading-none text-white">Licencias Medicas</h1>
                <p class="mb-6 text-md text-white">Sube aquí tus licencias médicas.</p>
            </section>
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
                <div class="contact-info">
                    <!-- Dirección -->
                    <div class="contact-item">
                        <a href="https://maps.app.goo.gl/6fQ31ySCJWSButxQ9" target="_blank">
                            <img src="https://cambiosorion.cl/orionapp/icons/location-white.png" alt="Icono de ubicación" class="icon">
                        </a>
                        <div>
                            <a href="https://maps.app.goo.gl/6fQ31ySCJWSButxQ9" target="_blank"><p>Agustinas 1035 Of 13, Santiago</p></a>
                            <small>Lunes a Viernes 09:00 a 17:00 hrs</small>
                        </div>
                    </div> 
                    <!-- Teléfono -->
                    <div class="contact-item">
                        <img src="https://cambiosorion.cl/orionapp/icons/phone-white.png" alt="Icono de teléfono" class="icon">
                        <div>
                            <p>+56 9 7184 6048</p>
                        </div>
                    </div>
                    <!-- Correo -->
                    <div class="contact-item">
                        <img src="https://cambiosorion.cl/orionapp/icons/email-white.png" alt="Icono de correo" class="icon">
                        <div>
                            <p>contacto@cambiosorion.cl</p>
                        </div>
                    </div>
                </div>
            </div>
            <!-- Redes Sociales -->
        <!-- Redes Sociales -->
            <div class="social-media flex gap-4">
                <a href="https://wa.me/+56971846048?text=Hola,%20necesito%20consultar%20con%20un%20ejecutivo." target="_blank"><img src="https://cambiosorion.cl/orionapp/icons/whatsapp-white.png" alt="WhatsApp" class="icon"></a>
                <a href="https://www.facebook.com/CambiosOrion" target="_blank"><img src="https://cambiosorion.cl/orionapp/icons/facebook-white.png" alt="Facebook" class="icon"></a>
                <a href="https://www.instagram.com/CambiosOrion.cl" target="_blank"><img src="https://cambiosorion.cl/orionapp/icons/instagram-white.png" alt="Instagram" class="icon"></a>
                <a href="https://www.tiktok.com/@cambios.orion" target="_blank"><img src="https://cambiosorion.cl/orionapp/icons/tik-tok-white.png" alt="TikTok" class="icon"></a>
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
