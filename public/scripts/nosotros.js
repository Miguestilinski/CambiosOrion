document.addEventListener("DOMContentLoaded", async function () {
    const placeId = "ChIJVc2tm-bFYpYRaDgA0qs7CvM";
    const apiKey = "AIzaSyDNWdnOEsPOqlKvBHcg2AN7YY5AGlZ5fcM";

    const reviewsContainer = document.getElementById("reviews-container");
    const ratingContainer = document.getElementById("rating-container");
    const googleReviewLink = document.getElementById("google-review-link");

    async function fetchPlaceDetails() {
        const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,rating,user_ratings_total,reviews&key=${apiKey}`;
        try {
            const response = await fetch(url);
            const data = await response.json();

            if (data.result) {
                // Mostrar calificación global
                const { rating, user_ratings_total, reviews } = data.result;
                ratingContainer.innerHTML = `
                    <div>
                        <h3 class="text-4xl font-bold">${rating.toFixed(1)}</h3>
                        <p class="text-gray-500">de ${user_ratings_total} reseñas</p>
                        <div class="stars">${renderStars(rating)}</div>
                    </div>
                `;

                // Renderizar reseñas en carrusel
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

    function timeSince(date) {
        const now = new Date();
        const diffInMs = now - date;
        const days = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
        return days;
    }

    fetchPlaceDetails();
});
