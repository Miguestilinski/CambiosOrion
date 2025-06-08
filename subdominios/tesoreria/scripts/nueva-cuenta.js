const clienteInput = document.getElementById("cliente");
const resultadoClientes = document.getElementById("resultado-clientes");
const divisaInput = document.getElementById("divisa");
const divisaSugerencias = document.getElementById("divisa-sugerencias");
const cancelarBtn = document.getElementById('cancelar');
const nombreCuentaInput = document.getElementById("nombre-cuenta");
const esAdministrativaCheckbox = document.getElementById("es-administrativa");
const mensajeFuncionario = document.getElementById("mensaje-funcionario");

let clienteSeleccionado = null;
let divisaSeleccionada = null;

// Función para actualizar el nombre de cuenta según cliente y divisa
function actualizarNombreCuenta() {
  if (clienteSeleccionado && divisaSeleccionada) {
    // Usa código de divisa, no nombre
    nombreCuentaInput.value = `${clienteSeleccionado.nombre} ${divisaSeleccionada.codigo}`;
    // nombreCuentaInput.disabled = true;  // Comentar o eliminar para que siempre se pueda editar
  } else {
    nombreCuentaInput.disabled = false; // Siempre habilitado
    // Si quieres que mantenga lo que usuario escribió cuando no hay cliente, no limpiar aquí
    // nombreCuentaInput.value = "";
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
    mostrarModalError({
      titulo: "❌ Error de conexión",
      mensaje: `No se pudo obtener la lista de clientes: ${res.statusText}`,
      textoConfirmar: "Entendido"
    });
    return;
  }

  try {
    const clientes = await res.json();
    resultadoClientes.innerHTML = "";
    clientes.forEach((cliente) => {
      const li = document.createElement("li");
      li.textContent = cliente.nombre;
      li.classList.add("px-2", "py-1", "hover:bg-gray-200", "cursor-pointer");
      li.addEventListener("click", async () => {
        clienteInput.value = cliente.nombre;
        clienteSeleccionado = cliente;
        resultadoClientes.classList.add("hidden");
        actualizarNombreCuenta();
        // Verificar si es funcionario consultando al servidor
        const esFuncionario = await verificarFuncionario(cliente.rut);
        if (esFuncionario) {
          mensajeFuncionario.classList.remove("hidden");
        } else {
          mensajeFuncionario.classList.add("hidden");
        }
      });
      resultadoClientes.appendChild(li);
    });
    resultadoClientes.classList.remove("hidden");
  } catch (error) {
    console.error("Error al procesar la respuesta de los clientes", error);
    const text = await res.text();
    console.error("Respuesta del servidor:", text);
    mostrarModalError({
      titulo: "❌ Error inesperado",
      mensaje: `Ocurrió un error al procesar los datos del servidor.`,
      textoConfirmar: "Entendido"
    });
  }
});

async function verificarFuncionario(rut) {
  try {
    const res = await fetch(`https://cambiosorion.cl/data/nueva-cuenta.php?rut=${encodeURIComponent(rut)}`);
    const data = await res.json();
    return data.es_funcionario === true; // Suponiendo que retorna { es_funcionario: true }
  } catch (error) {
    console.error("Error al verificar funcionario:", error);
    return false;
  }
}

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
    mostrarModalError({
      titulo: "❌ Error de conexión",
      mensaje: `No se pudo obtener la lista de divisas: ${res.statusText}`,
      textoConfirmar: "Ok"
    });
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
    mostrarModalError({
      titulo: "❌ Error inesperado",
      mensaje: "Ocurrió un problema al procesar la información del servidor.",
      textoConfirmar: "Cerrar"
    });
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

function determinarTipoCuenta() {
  const tieneCliente = clienteSeleccionado !== null;
  const esFuncionario = mensajeFuncionario && !mensajeFuncionario.classList.contains("hidden");

  if (!tieneCliente) {
    return "administrativa"; // Si no hay cliente seleccionado => administrativa
  }

  if (tieneCliente && esFuncionario) {
    return "funcionario";
  }

  if (tieneCliente && !esFuncionario) {
    return "cliente";
  }

  return "general"; // Solo nombre y divisa, sin cliente (en desuso si administrativa ya lo cubre)
}

// Enviar formulario
document.getElementById("form-nueva-cuenta").addEventListener("submit", async (e) => {
  e.preventDefault();

    // Validar divisa siempre
  if (!divisaSeleccionada) {
    mostrarModalError({
      titulo: "❌ Error",
      mensaje: "Debes seleccionar una divisa.",
      textoConfirmar: "Cerrar"
    });
    return;
  }

  // Validar nombre cuenta
  const nombreCuenta = nombreCuentaInput.value.trim();
  if (nombreCuenta.length === 0) {
    mostrarModalError({
      titulo: "❌ Error",
      mensaje: "Debes ingresar un nombre para la cuenta.",
      textoConfirmar: "Cerrar"
    });
    return;
  }

  // Si hay cliente seleccionado, enviamos también el cliente_id
  if (clienteSeleccionado) {
    body.cliente_id = clienteSeleccionado.id;
  }

  const tipoCuenta = determinarTipoCuenta();

  // Preparamos el cuerpo del request
  const body = {
    cliente_id: clienteSeleccionado ? clienteSeleccionado.id : null,
    divisa_id: divisaSeleccionada ? divisaSeleccionada.id : null,
    nombre_cuenta: nombreCuentaInput.value.trim(),
    tipo_cuenta: tipoCuenta,
  };

  try {
    console.log("Datos enviados:", body);
    const res = await fetch("https://cambiosorion.cl/data/nueva-cuenta.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const textResponse = await res.text();
    console.log("Respuesta cruda del servidor:", textResponse);   

    // Verificar si la respuesta es exitosa
    if (!res.ok) {
      const errorText = await res.text();
      console.error('Error de respuesta del servidor:', errorText);
      mostrarModalError({
        titulo: "❌ Error inesperado",
        mensaje: "Hubo un problema con la conexión al servidor.",
        textoConfirmar: "Cerrar"
      });
      return;
    } 

    const data = JSON.parse(textResponse);

    if (data.success) {
      mostrarModalExitoso();
    } else if (data.warning && data.continue_possible) {
        mostrarModalAdvertencia({
          mensaje: data.warning,
          textoConfirmar: "Crear",
          textoCancelar: "Cancelar",
          onConfirmar: async () => {
            // Hacer segundo request con fuerza para crear la cuenta igual
            try {
              const res2 = await fetch("https://cambiosorion.cl/data/nueva-cuenta.php?forzar=1", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data.body),
              });
              const text2 = await res2.text();
              console.log("Respuesta cruda del segundo intento:", text2);
              const response2 = JSON.parse(text2);
              if (response2.success) {
                mostrarModalExitoso();
              } else {
                mostrarModalError({
                  titulo: "❌ Error",
                  mensaje: response2.error || "No se pudo crear la cuenta.",
                  textoConfirmar: "Cerrar"
                });
              }
            } catch (err) {
              mostrarModalError({
                titulo: "❌ Error",
                mensaje: "No se pudo completar la creación forzada.",
                textoConfirmar: "Cerrar"
              });
            }
          }
        });
      } else {
      mostrarModalError({
        titulo: "❌ Error",
        mensaje: `Error al crear la cuenta: ${data.error || data.message || 'desconocido'}`,
        textoConfirmar: "Cerrar"
      });
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

    mostrarModalError({
      titulo: "❌ Error",
      mensaje: `Error al crear la cuenta: ${errorMessage}`,
      textoConfirmar: "Cerrar"
    });
  }  
});

function mostrarModalAdvertencia({mensaje, textoConfirmar = "Aceptar", textoCancelar = null, onConfirmar, onCancelar }) {
  const modal = document.getElementById("modal-advertencia");
  const mensajeElem = document.getElementById("modal-advertencia-mensaje");
  const btnConfirmar = document.getElementById("advertencia-confirmar");
  const btnCancelar = document.getElementById("advertencia-cancelar");

  mensajeElem.textContent = mensaje;
  btnConfirmar.textContent = textoConfirmar;

  if (textoCancelar) {
    btnCancelar.classList.remove("hidden");
    btnCancelar.textContent = textoCancelar;
  } else {
    btnCancelar.classList.add("hidden");
  }

  modal.classList.remove("hidden");

  // Remover handlers anteriores
  btnConfirmar.onclick = () => {
    modal.classList.add("hidden");
    if (onConfirmar) onConfirmar();
  };

  btnCancelar.onclick = () => {
    modal.classList.add("hidden");
    if (onCancelar) onCancelar();
  };
}

function mostrarModalError({ titulo, mensaje, textoConfirmar = "Aceptar", textoCancelar = null, onConfirmar, onCancelar }) {
  const modal = document.getElementById("modal-error");
  const tituloElem = document.getElementById("modal-error-titulo");
  const mensajeElem = document.getElementById("modal-error-mensaje");
  const btnConfirmar = document.getElementById("modal-error-confirmar");
  const btnCancelar = document.getElementById("modal-error-cancelar");

  tituloElem.textContent = titulo;
  mensajeElem.textContent = mensaje;
  btnConfirmar.textContent = textoConfirmar;

  if (textoCancelar) {
    btnCancelar.classList.remove("hidden");
    btnCancelar.textContent = textoCancelar;
  } else {
    btnCancelar.classList.add("hidden");
  }

  modal.classList.remove("hidden");

  // Remover handlers anteriores
  btnConfirmar.onclick = () => {
    modal.classList.add("hidden");
    if (onConfirmar) onConfirmar();
  };

  btnCancelar.onclick = () => {
    modal.classList.add("hidden");
    if (onCancelar) onCancelar();
  };
}

function mostrarModalExitoso() {
  const modal = document.getElementById("modal-exitoso");
  modal.classList.remove("hidden");

  document.getElementById("nueva-cuenta").onclick = () => {
    modal.classList.add("hidden");
    document.getElementById("form-nueva-cuenta").reset();
    // Resetear también estado adicional si es necesario
  };

  document.getElementById("volver").onclick = () => {
    window.location.href = "https://tesoreia.cambiosorion.cl/cuentas";
  };
}