// faq.js
document.addEventListener("DOMContentLoaded", () => {
    const faqData = [
        {
            question: "¿Por qué Cambios Orion es la mejor opción en Santiago Centro?",
            answer: "Somos líderes en tecnología financiera. A diferencia de las casas tradicionales, en Orion puedes cotizar en tiempo real, congelar tu tasa online y asegurar tu precio antes de llegar a nuestra oficina en Agustinas 1035. Combinamos la mejor tasa del mercado con seguridad total."
        },
        {
            question: "¿Es seguro cambiar grandes sumas de dinero en Orion?",
            answer: "Absolutamente. Nuestra oficina en Agustinas 1035 (Oficina 13) es un espacio privado y seguro. Además, aceptamos y realizamos transferencias bancarias para que no tengas que transitar con efectivo por el centro de Santiago. Tu seguridad es nuestra prioridad."
        },
        {
            question: "¿Qué métodos de pago aceptan?",
            answer: "Para tu comodidad y seguridad, aceptamos efectivo (pesos chilenos y divisas extranjeras) y transferencias bancarias inmediatas. Esto nos permite ofrecer un servicio más rápido y seguro que la competencia."
        },
        {
            question: "¿Cuáles son los horarios de atención?",
            answer: "Atendemos de lunes a viernes de 09:00 a 18:00 hrs y sábados de 10:00 a 14:00 hrs. Recuerda que nuestra web funciona 24/7 para cotizaciones y reservas."
        },
        {
            question: "¿Cómo funciona el sistema de Reserva Online?",
            answer: "Es nuestra herramienta estrella. Cotizas en la web, haces clic en 'Reservar' y congelas el precio por 2 horas. Recibes un QR, vienes a caja preferencial y te respetamos el precio exacto, sin importar si el mercado subió o bajó en ese lapso."
        },
        {
            question: "¿Hay límites en el monto de cambio?",
            answer: "No hay límites operacionales, pero por normativas de cumplimiento (Compliance), para operaciones superiores a $5.000 USD solicitamos documentación simple de origen de fondos. Esto garantiza que operamos bajo los más altos estándares legales."
        },
        {
            question: "¿Realizan envíos de dinero o remesas?",
            answer: "Sí, gestionamos remesas internacionales y operaciones con divisas digitales (USDT) con la misma seguridad y transparencia que nuestro cambio físico."
        },
        {
            question: "¿Qué significa que estén en modo 'Comprador' o 'Vendedor'?",
            answer: "Significa transparencia total. A veces tenemos exceso de stock de una divisa y mejoramos el precio para venderla rápido (Oferta). Nuestro sistema te avisa para que aproveches esas oportunidades únicas."
        },
    ];

    const faqContainer = document.getElementById("faq-accordion");


    faqData.forEach((faq, index) => {
        const faqItem = document.createElement("div");
        faqItem.classList.add("accordion-item", "mb-4", "border", "border-gray-300", "rounded-xl");

        faqItem.innerHTML = `
            <button
                type="button"
                class="accordion-header rounded-xl flex justify-between items-center p-4 w-full text-left bg-white text-gray-800 border-b focus:outline-none"
                data-index="${index}"
            >
                <span>${faq.question}</span>
                <svg class="w-4 h-4 transform transition-transform" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                </svg>
            </button>
            <div class="accordion-body hidden p-4 text-sm text-white">
                ${faq.answer}
            </div>
        `;

        faqContainer.appendChild(faqItem);
    });

    // Add toggle functionality
    faqContainer.addEventListener("click", (e) => {
        const button = e.target.closest(".accordion-header");
        if (button) {
            const faqItem = button.parentElement; 
            const body = button.nextElementSibling; // El cuerpo del acordeón
            const isHidden = body.classList.contains("hidden");

            // Reset styles for todos los acordeones
            faqContainer.querySelectorAll(".accordion-item").forEach(item => {
                button.classList.remove("rounded-t-xl");
                button.classList.add("rounded-xl");
                const itemBody = item.querySelector(".accordion-body");
                itemBody.classList.add("hidden");
                const itemHeader = item.querySelector(".accordion-header svg");
                itemHeader.classList.remove("rotate-180");
            });

            // Aplicar estilos al acordeón activo
            if (isHidden) {
                button.classList.remove("rounded-xl");
                button.classList.add("rounded-t-xl");
                body.classList.remove("hidden");
                button.querySelector("svg").classList.add("rotate-180");
            }
        }
    });
});