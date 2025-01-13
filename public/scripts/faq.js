// faq.js
document.addEventListener("DOMContentLoaded", () => {
    const faqData = [
        {
            question: "¿Cómo puedo registrarme?",
            answer: "Puedes registrarte haciendo clic en el botón 'Registrarse' en la esquina superior derecha y siguiendo las instrucciones."
        },
        {
            question: "¿Cómo restablezco mi contraseña?",
            answer: "Haz clic en '¿Olvidaste tu contraseña?' en la página de inicio de sesión y sigue los pasos para restablecerla."
        },
        {
            question: "¿Qué métodos de pago aceptan?",
            answer: "Aceptamos tarjetas de crédito, débito y pagos por PayPal."
        },
    ];

    const faqContainer = document.getElementById("faq-accordion");

    faqData.forEach((faq, index) => {
        const faqItem = document.createElement("div");
        faqItem.classList.add("accordion-item", "mb-4", "border", "border-gray-300", "rounded");

        faqItem.innerHTML = `
            <button
                type="button"
                class="accordion-header flex justify-between items-center p-4 w-full text-left bg-white text-gray-800 border-b focus:outline-none"
                data-index="${index}"
            >
                <span>${faq.question}</span>
                <svg class="w-4 h-4 transform transition-transform" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                </svg>
            </button>
            <div class="accordion-body hidden p-4 text-sm text-gray-600">
                ${faq.answer}
            </div>
        `;

        faqContainer.appendChild(faqItem);
    });

    // Add toggle functionality
    faqContainer.addEventListener("click", (e) => {
        const button = e.target.closest(".accordion-header");
        if (button) {
            const body = button.nextElementSibling;
            body.classList.toggle("hidden");
            button.querySelector("svg").classList.toggle("rotate-180");
        }
    });
});
