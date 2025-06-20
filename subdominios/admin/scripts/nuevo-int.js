document.getElementById("form-nuevo-int").addEventListener("submit", async (e) => {
  e.preventDefault();

  const nombre = document.getElementById("nombre").value.trim();
  const rut = document.getElementById("rut").value.trim();
  const estadoCivil = document.getElementById("estadoCivil").value.trim();
  const fechaNacimiento = document.getElementById("fechaNacimiento").value;
  const direccion = document.getElementById("direccion").value.trim();
  const telefono = document.getElementById("telefono").value.trim();
  const email = document.getElementById("email").value.trim();

  const fechaIngreso = document.getElementById("fechaIngreso").value;
  const rol = document.getElementById("rol").value;
  const tipoContrato = document.getElementById("tipoContrato").value.trim();
  const sueldoLiquido = document.getElementById("sueldoLiquido").value.trim();

  const banco = document.getElementById("banco").value.trim();
  const tipoCuenta = document.getElementById("tipoCuenta").value.trim();
  const numeroCuenta = document.getElementById("numeroCuenta").value.trim();

  // Validación básica
  if (!nombre || !rut || !estadoCivil || !fechaNacimiento || !direccion || !fechaIngreso || !rol || !tipoContrato || !sueldoLiquido || !banco || !tipoCuenta || !numeroCuenta || !email) {
    alert("Por favor completa todos los campos obligatorios.");
    return;
  }

  const body = {
    nombre,
    rut,
    estadoCivil,
    fechaNacimiento,
    direccion,
    telefono,
    email,
    fechaIngreso,
    rol,
    tipoContrato,
    sueldoLiquido,
    banco,
    tipoCuenta,
    numeroCuenta
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
