// faq.js
document.addEventListener("DOMContentLoaded", () => {
    const faqData = [
        {
            question: "¿Qué métodos de pago aceptan?",
            answer: "Aceptamos efectivo y transferencias bancarias."
        },
        {
            question: "¿Cuáles son los horarios de atención de Orion?",
            answer: "Nuestra sucursal está abierta de lunes a viernes de 9:00 a.m. a 5:00 p.m. Consulta los horarios específicos en línea."
        },
        {
            question: "¿Cómo puedo contactar al servicio al cliente?",
            answer: "Puedes escribirnos a nuestro correo electrónico, a través de whatsapp o llamarnos al número de atención disponible en nuestro sitio web. Responderemos dentro del horario de atención."
        },
        {
            question: "¿Hay límites en el monto de cambio de divisas?",
            answer: "Sí, para montos mayores a $5.000 USD o equivalentes, es posible que se requiera documentación adicional."
        },
        {
            question: "¿Cómo se calculan los tipos de cambio?",
            answer: "Los tipos de cambio se actualizan en tiempo real y se basan en el mercado internacional de divisas. Puedes consultar el tipo actual antes de realizar tu operación."
        },
    ];

    const faqContainer = document.getElementById("faq-accordion");


    faqData.forEach((faq, index) => {
        const faqItem = document.createElement("div");
        faqItem.classList.add("accordion-item", "mb-4", "border", "border-gray-300", "rounded-xl");

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
            <div class="accordion-body rounded-b-xl hidden p-4 text-sm text-white bg-gray-50">
                ${faq.answer}
            </div>
        `;

        faqContainer.appendChild(faqItem);
    });

    // Add toggle functionality
    faqContainer.addEventListener("click", (e) => {
        const button = e.target.closest(".accordion-header");
        if (button) {
            const faqItem = button.parentElement; // El contenedor principal del acordeón
            const body = button.nextElementSibling; // El cuerpo del acordeón
            const isHidden = body.classList.contains("hidden"); // Verifica si está oculto

            // Reset styles for todos los acordeones
            faqContainer.querySelectorAll(".accordion-item").forEach(item => {
                item.classList.remove("rounded-t-xl");
                item.classList.add("rounded-xl");
                const itemBody = item.querySelector(".accordion-body");
                itemBody.classList.add("hidden");
                itemBody.classList.remove("rounded-b-xl"); // Quitar bordes inferiores redondeados
                const itemHeader = item.querySelector(".accordion-header svg");
                itemHeader.classList.remove("rotate-180");
            });

            // Aplicar estilos al acordeón activo
            if (isHidden) {
                faqItem.classList.remove("rounded-xl");
                faqItem.classList.add("rounded-t-xl");
                body.classList.remove("hidden");
                body.classList.add("rounded-b-xl"); // Añadir bordes inferiores redondeados al cuerpo
                button.querySelector("svg").classList.add("rotate-180");
            }
        }
    });
});