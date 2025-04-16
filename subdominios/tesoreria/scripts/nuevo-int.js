document.getElementById("form-nuevo-int").addEventListener("submit", async (e) => {
    e.preventDefault();
  
    const nombre = document.getElementById("nombre").value.trim();
    const rol = document.getElementById("rol").value.trim();
    const email = document.getElementById("email").value.trim();
    const telefono = document.getElementById("telefono").value.trim();
  
    if (!nombre || !rol || !email) {
      alert("Por favor completa todos los campos obligatorios.");
      return;
    }
  
    const body = {
      nombre,
      rol,
      email,
      telefono
    };
  
    try {
      const res = await fetch("https://cambiosorion.cl/data/nuevo-int.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
  
      const textResponse = await res.text();
      console.log("Respuesta cruda del servidor:", textResponse);
      
      const data = JSON.parse(textResponse);
  
      if (data.success) {
        alert("Integrante agregado correctamente.");
        window.location.reload(); // o redirige a una lista de integrantes
      } else {
        alert(data.error || "Error al agregar integrante.");
      }
  
    } catch (error) {
      console.error("Error de conexión:", error);
      alert("No se pudo conectar con el servidor.");
    }
  });
  
  // Botón cancelar
  document.getElementById("cancelar").addEventListener("click", () => {
    window.history.back(); // O bien puedes redirigir a otra página específica
  });
  