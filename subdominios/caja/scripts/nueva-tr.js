document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("form-nueva-tr");
  const montoInput = document.getElementById("monto");
  const tasaInput = document.getElementById("tasa");
  const totalSpan = document.getElementById("total-transaccion");
  const cancelarBtn = document.getElementById("cancelar-transaccion");

  function actualizarTotal() {
    const monto = parseFloat(montoInput.value) || 0;
    const tasa = parseFloat(tasaInput.value) || 0;
    const total = monto * tasa;
    totalSpan.textContent = total.toFixed(2);
  }

  montoInput.addEventListener("input", actualizarTotal);
  tasaInput.addEventListener("input", actualizarTotal);

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const datos = {
      tipo_transaccion: document.getElementById("tipo-transaccion").value,
      tipo_documento: document.getElementById("tipo-documento").value,
      cliente: document.getElementById("cliente").value,
      email: document.getElementById("email").value,
      divisa: document.getElementById("divisa").value,
      tasa: parseFloat(tasaInput.value) || 0,
      monto: parseFloat(montoInput.value) || 0,
    };

    fetch("https://cambiosorion.cl/data/nueva-tr.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(datos),
    })
      .then((res) => res.json())
      .then((respuesta) => {
        if (respuesta.exito) {
          alert("✅ Transacción registrada correctamente");
          form.reset();
          totalSpan.textContent = "0.00";
        } else {
          alert("❌ Error: " + respuesta.mensaje);
        }
      })
      .catch((error) => {
        console.error("Error al enviar:", error);
        alert("❌ Error al enviar los datos");
      });
  });

  cancelarBtn.addEventListener("click", function () {
    if (confirm("¿Seguro que quieres cancelar la transacción?")) {
      form.reset();
      totalSpan.textContent = "0.00";
    }
  });
});
