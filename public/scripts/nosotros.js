document.addEventListener("DOMContentLoaded", async function () {
    // Variables de los menús
    const navMenuButton = document.getElementById('nav-menu-button');
    const sessionMenuButton = document.getElementById('session-menu-button');
    const navMobileMenu = document.getElementById('nav-mobile-menu');
    const sessionMobileMenu = document.getElementById('session-mobile-menu');

    // Llamada a la API de Google Maps
    const placeId = "ChIJVc2tm-bFYpYRaDgA0qs7CvM";
    const apiKey = "AIzaSyDNWdnOEsPOqlKvBHcg2AN7YY5AGlZ5fcM";
    const url = `https://maps.googleapis.com/maps/api/place/details/json?placeid=${placeId}&key=${apiKey}`;

    const reviewsContainer = document.getElementById("reviews-container");
    const ratingContainer = document.getElementById("rating-container");
    const googleReviewLink = document.getElementById("google-review-link");

    // Función para inicializar la página
    initializePage();

    // Función para alternar visibilidad de menús
    function toggleMenu(menuToOpen, menuToClose) {
        if (menuToClose) closeMenu(menuToClose);

        if (menuToOpen.classList.contains('hidden')) {
            menuToOpen.classList.remove('hidden');
        } else {
            menuToOpen.classList.add('hidden');
        }
    }

    // Función para cerrar menús
    function closeMenu(menu) {
        if (!menu.classList.contains('hidden')) {
            menu.classList.add('hidden');
        }
    }

    // Función para marcar los enlaces activos
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

    // Inicializa los menús activos
    function initializePage() {
        setActiveLink('#nav-menu');
        setActiveLink('#session-menu');
    }

    // Llamada a la API de Google Places para obtener detalles del lugar
    async function fetchPlaceDetails() {
        const url = `/api/place-details?place_id=${placeId}`;

        try {
            const response = await fetch(url);
            const data = await response.json();

            console.log(data); // Para depurar la respuesta completa

            if (data.result) {
                const { rating, user_ratings_total, reviews } = data.result;

                // Mostrar calificación global
                ratingContainer.innerHTML = `
                    <div>
                        <h3 class="text-4xl font-bold">${rating.toFixed(1)}</h3>
                        <p class="text-gray-500">de ${user_ratings_total} reseñas</p>
                        <div class="stars">${renderStars(rating)}</div>
                    </div>
                `;

                // Mostrar reseñas si existen
                if (reviews && reviews.length) {
                    reviews.forEach(review => {
                        const reviewElement = document.createElement("div");
                        reviewElement.classList.add("review-card");
                        reviewElement.innerHTML = `
                            <div class="flex items-center">
                                <img src="${review.profile_photo_url}" alt="${review.author_name}" class="w-10 h-10 rounded-full mr-3">
                                <div>
                                    <p class="font-semibold">${review.author_name}</p>
                                    <p class="text-sm text-gray-400">${timeSince(new Date(review.time * 1000))} días atrás</p>
                                </div>
                            </div>
                            <div class="mt-2">
                                <div class="stars">${renderStars(review.rating)}</div>
                                <p class="text-gray-700 truncate">${review.text}</p>
                            </div>
                        `;
                        reviewsContainer.appendChild(reviewElement);
                    });
                }
            }
        } catch (error) {
            console.error("Error al obtener detalles del lugar:", error);
        }
    }

    // Función para representar las estrellas
    function renderStars(rating) {
        const fullStars = Math.floor(rating);
        const halfStar = rating % 1 >= 0.5;
        let starsHTML = "";

        for (let i = 0; i < fullStars; i++) {
            starsHTML += "⭐";
        }
        if (halfStar) {
            starsHTML += "⭐";
        }
        for (let i = fullStars + halfStar; i < 5; i++) {
            starsHTML += "☆";
        }

        return `<span class="text-yellow-500">${starsHTML}</span>`;
    }

    // Función para calcular el tiempo desde la fecha de la reseña
    function timeSince(date) {
        const now = new Date();
        const diffInMs = now - date;
        const days = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
        return days;
    }

    // Llamadas de eventos para el menú móvil
    if (navMenuButton && sessionMenuButton && navMobileMenu && sessionMobileMenu) {
        navMenuButton.addEventListener('click', () => {
            toggleMenu(navMobileMenu);
            if (sessionMobileMenu && sessionMobileMenu.style && sessionMobileMenu.style.display === 'block') {
                sessionMobileMenu.style.display = 'none';
            }            
        });

        sessionMenuButton.addEventListener('click', () => {
            toggleMenu(sessionMobileMenu);
            if (navMobileMenu && navMobileMenu.style.display === 'block') {
                navMobileMenu.style.display = 'none';
            }
        });
    }

    // Llamar a la función para obtener los detalles del lugar
    fetchPlaceDetails();
});

// Redefinir la función para alternar menús
function toggleMenu(menu) {
    if (menu) {
        menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
    }
}

// Función para inicializar la página
function initializePage() {
    setActiveLink('#nav-menu');
    setActiveLink('#session-menu');
}
