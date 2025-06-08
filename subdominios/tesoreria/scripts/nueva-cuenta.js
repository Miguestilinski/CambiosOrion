const clienteInput = document.getElementById("cliente");
const resultadoClientes = document.getElementById("resultado-clientes");
const divisaInput = document.getElementById("divisa");
const divisaSugerencias = document.getElementById("divisa-sugerencias");
const cancelarBtn = document.getElementById('cancelar');
const nombreCuentaInput = document.getElementById("nombre-cuenta");

let clienteSeleccionado = null;
let divisaSeleccionada = null;

// Función para actualizar el nombre de cuenta según cliente y divisa
function actualizarNombreCuenta() {
  if (clienteSeleccionado && divisaSeleccionada) {
    nombreCuentaInput.value = `${clienteSeleccionado.nombre} ${divisaSeleccionada.nombre}`;
    nombreCuentaInput.disabled = true;  // Se deshabilita porque se genera automáticamente
  } else {
    nombreCuentaInput.disabled = false; // Se habilita para que el usuario pueda escribir
    if (!clienteSeleccionado) {
      // Solo se borra si no hay cliente (opcional)
      // Si quieres que mantenga lo que usuario escribió, comentar la línea siguiente:
      // nombreCuentaInput.value = "";
    }
  }
}

// Redirigir al hacer clic en "Nueva Operacion"
if (cancelarBtn) {
  cancelarBtn.addEventListener('click', () => {
      window.location.href = 'https://tesoreria.cambiosorion.cl/cuentas';
  });
}

// Buscar cliente
clienteInput.addEventListener("input", async (e) => {
  const query = e.target.value.trim();
  clienteSeleccionado = null;
  actualizarNombreCuenta();
  if (query.length < 2) {
    resultadoClientes.classList.add("hidden");
    return;
  }

  const res = await fetch(
    `https://cambiosorion.cl/data/nueva-cuenta.php?buscar_cliente=${encodeURIComponent(query)}`
  );

  // Verificar si la respuesta es exitosa
  if (!res.ok) {
    console.error('Error al buscar cliente', res.statusText);
    alert("Hubo un problema con la conexión al servidor. Intenta nuevamente.");
    return;
  }

  try {
    const clientes = await res.json();
    resultadoClientes.innerHTML = "";
    clientes.forEach((cliente) => {
      const li = document.createElement("li");
      li.textContent = cliente.nombre;
      li.classList.add("px-2", "py-1", "hover:bg-gray-200", "cursor-pointer");
      li.addEventListener("click", () => {
        clienteInput.value = cliente.nombre;
        clienteSeleccionado = cliente;
        resultadoClientes.classList.add("hidden");
        actualizarNombreCuenta();
      });
      resultadoClientes.appendChild(li);
    });
    resultadoClientes.classList.remove("hidden");
  } catch (error) {
    console.error("Error al procesar la respuesta de los clientes", error);
    const text = await res.text();
    console.error("Respuesta del servidor:", text);
    alert("Error al procesar la respuesta del servidor. Intenta nuevamente.");
  }
});

// Buscar divisa
divisaInput.addEventListener("input", async (e) => {
  const query = e.target.value.trim();
  divisaSeleccionada = null;
  actualizarNombreCuenta();
  if (query.length < 1) {
    divisaSugerencias.classList.add("hidden");
    return;
  }

  const res = await fetch(
    `https://cambiosorion.cl/data/nueva-cuenta.php?buscar_divisa=${encodeURIComponent(query)}`
  );

  // Verificar si la respuesta es exitosa
  if (!res.ok) {
    console.error('Error al buscar divisa', res.statusText);
    alert("Hubo un problema con la conexión al servidor. Intenta nuevamente.");
    return;
  }

  try {
    const divisas = await res.json();
    divisaSugerencias.innerHTML = "";
    divisas.forEach((divisa) => {
      const li = document.createElement("li");
      li.textContent = divisa.nombre;
      li.classList.add("px-2", "py-1", "hover:bg-gray-200", "cursor-pointer");
      li.addEventListener("click", () => {
        divisaInput.value = divisa.nombre;
        divisaSeleccionada = divisa;
        console.log(`ID de divisas_interna seleccionado: ${divisa.id}`);
        console.log(`Valor asignado a divisa_id: ${divisa.id}`);
        divisaSugerencias.classList.add("hidden");
        actualizarNombreCuenta();
      });      
      divisaSugerencias.appendChild(li);
    });
    divisaSugerencias.classList.remove("hidden");
  } catch (error) {
    console.error("Error al procesar la respuesta de las divisas", error);
    const text = await res.text();
    console.error("Respuesta del servidor:", text);
    alert("Error al procesar la respuesta del servidor. Intenta nuevamente.");
  }
});

// Cerrar dropdown al clickear fuera
document.addEventListener("click", (e) => {
  if (!clienteInput.contains(e.target) && !resultadoClientes.contains(e.target)) {
    resultadoClientes.classList.add("hidden");
  }
  if (!divisaInput.contains(e.target) && !divisaSugerencias.contains(e.target)) {
    divisaSugerencias.classList.add("hidden");
  }
});

// Enviar formulario
document.getElementById("form-nueva-cuenta").addEventListener("submit", async (e) => {
  e.preventDefault();

    // Validar divisa siempre
  if (!divisaSeleccionada) {
    alert("Debes seleccionar una divisa.");
    return;
  }

  // Validar nombre cuenta
  const nombreCuenta = nombreCuentaInput.value.trim();
  if (nombreCuenta.length === 0) {
    alert("Debes ingresar un nombre para la cuenta.");
    return;
  }

  // Preparamos el cuerpo del request
  const body = {
    nombre_cuenta: nombreCuenta,
    divisa_id: divisaSeleccionada.id,
  };

  // Si hay cliente seleccionado, enviamos también el cliente_id
  if (clienteSeleccionado) {
    body.cliente_id = clienteSeleccionado.id;
  }

  try {
    console.log("Datos enviados:", body);
    const res = await fetch("https://cambiosorion.cl/data/nueva-cuenta.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    // Verificar si la respuesta es exitosa
    if (!res.ok) {
      const errorText = await res.text();
      console.error('Error de respuesta del servidor:', errorText);
      alert("Hubo un problema con la conexión al servidor.");
      return;
    }

    const textResponse = await res.text();
    console.log("Respuesta cruda del servidor:", textResponse);    

    const data = JSON.parse(textResponse);
    if (data.success) {
      window.location.href = "https://tesoreria.cambiosorion.cl/cuentas";
    }
     else {
      alert(data.error || "Error al crear la cuenta.");
    }

  } catch (error) {
    console.error("Error de conexión:", error);
  
    let errorMessage = "Error de conexión con el servidor.";
    
    if (error.response) { 
      try {
        const text = await error.response.text();
        console.error("Respuesta del servidor:", text);
        errorMessage += `\nDetalle: ${text}`;
      } catch (textError) {
        console.error("No se pudo leer la respuesta del servidor.");
      }
    }
  
    alert(errorMessage);
  }  
});
