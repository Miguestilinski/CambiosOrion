// Mostrar/ocultar formulario de alerta
const alertaBtn = document.querySelector('a[href="https://cambiosorion.cl/alerta"]');
const alertaSection = document.getElementById("alerta-section");

alertaBtn.addEventListener("click", (e) => {
  e.preventDefault(); // Evita navegación
  alertaSection.classList.toggle("hidden");
  alertaSection.scrollIntoView({ behavior: "smooth" });
});

// Guardar alerta
document.getElementById("guardar-alerta").addEventListener("click", async () => {
  const divisa = document.getElementById("alerta-divisa").value;
  const tipoPrecio = document.getElementById("alerta-tipo-precio").value;
  const condicion = document.getElementById("alerta-condicion").value;
  const valor = parseFloat(document.getElementById("alerta-valor").value);
  const nombre = document.getElementById("alerta-nombre").value.trim();
  const email = document.getElementById("alerta-email").value.trim();

  const statusText = document.getElementById("alerta-status");

  if (!valor || !nombre || !email) {
    statusText.textContent = "❌ Debes completar todos los campos.";
    statusText.style.color = "red";
    return;
  }

  const response = await fetch("/data/alerta.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      divisa,
      tipoPrecio,
      condicion,
      valor,
      nombre,
      email
    })
  });

  const result = await response.json();
  if (result.success) {
    statusText.textContent = "✅ Alerta guardada, recibirás un correo cuando se cumpla.";
    statusText.style.color = "green";
    document.getElementById("alerta-valor").value = "";
  } else {
    statusText.textContent = "❌ Hubo un error, intenta más tarde.";
    statusText.style.color = "red";
  }
});
