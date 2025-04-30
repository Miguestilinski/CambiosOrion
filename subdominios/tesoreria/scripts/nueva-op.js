let clienteSeleccionado = null;
let advertenciaMostrada = false;

// Autocompletado cliente
const clienteInput = document.getElementById("cliente");
const resultadoClientes = document.getElementById("resultado-clientes");

clienteInput.addEventListener("input", async (e) => {
  const query = e.target.value.trim();
  if (query.length < 2) {
    resultadoClientes.classList.add("hidden");
    return;
  }

  try {
    const res = await fetch(`https://cambiosorion.cl/data/nueva-op.php?buscar_cliente=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error("Error al buscar cliente");
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
      });
      resultadoClientes.appendChild(li);
    });
    resultadoClientes.classList.remove("hidden");
  } catch (error) {
    console.error(error);
    alert("Hubo un problema buscando clientes.");
  }
});

document.addEventListener("click", (e) => {
  if (!clienteInput.contains(e.target) && !resultadoClientes.contains(e.target)) {
    resultadoClientes.classList.add("hidden");
  }
});

// Manejo de divisas
let divisaIndex = 0;
const divisaContainer = document.getElementById("divisas-container");
const totalSpan = document.getElementById("total-operacion");

document.getElementById("agregar-divisa").addEventListener("click", () => {
  const divisasActuales = document.querySelectorAll(".divisa-item:not(.hidden)").length;

  if (divisasActuales === 1 && !advertenciaMostrada) {
    // Mostrar modal
    document.getElementById("modal-multiples-divisas").classList.remove("hidden");

    // Configurar botones
    document.getElementById("confirmar-multiples-divisas").onclick = () => {
      advertenciaMostrada = true;
      document.getElementById("modal-multiples-divisas").classList.add("hidden");
      agregarDivisa();
    };

    document.getElementById("cancelar-multiples-divisas").onclick = () => {
      document.getElementById("modal-multiples-divisas").classList.add("hidden");
    };

  } else {
    agregarDivisa();
  }
});

function agregarDivisa() {
    const plantilla = document.querySelector(".divisa-item");
    const nuevaDivisa = plantilla.cloneNode(true);
    nuevaDivisa.classList.remove("hidden");

    // Limpiar valores
    nuevaDivisa.querySelector(".divisa-nombre").value = "";
    nuevaDivisa.querySelector(".divisa-monto").value = "";
    nuevaDivisa.querySelector(".divisa-tasa").value = "";
    nuevaDivisa.querySelector(".divisa-subtotal").textContent = "Subtotal: $0.00";

    // Añadir eventos
    const montoInput = nuevaDivisa.querySelector(".divisa-monto");
    const tasaInput = nuevaDivisa.querySelector(".divisa-tasa");
    const subtotalSpan = nuevaDivisa.querySelector(".divisa-subtotal");

    function calcularSubtotal() {
        const monto = parseInt(montoInput.value) || 0; // Elimina decimales del monto
        let tasa = tasaInput.value.trim(); // Tomamos el valor de la tasa
    
        // Validar la tasa de cambio
        if (tasa.match(/^\d+$/)) {
            tasa = parseInt(tasa); // Si no tiene decimales, tratamos como entero
        } else if (tasa.match(/^0\.\d+$/)) {
            tasa = parseFloat(tasa); // Si tiene decimales (como 0.256), lo tratamos como float
        } else {
            tasa = 0; // Si la tasa no es válida, la consideramos como 0
        }
    
        // Calcular el subtotal como un valor entero
        const subtotal = Math.round(monto * tasa);  // Redondeamos a entero
    
        // Formatear el subtotal con separadores de miles
        const subtotalFormateado = new Intl.NumberFormat('es-CL').format(subtotal);
    
        subtotalSpan.textContent = `Subtotal: $${subtotalFormateado}`;
        calcularTotal();
    }    

    montoInput.addEventListener("input", (e) => {
        // Asegurarse de que el valor sea un número entero sin decimales
        e.target.value = e.target.value.replace(/[^0-9]/g, ''); // Elimina cualquier carácter no numérico
    
        calcularSubtotal();
    });
    
    tasaInput.addEventListener("input", (e) => {
        let value = e.target.value;
        
        // Permitir números enteros y decimales (con punto)
        if (value.match(/^(\d+(\.\d{0,2})?)?$/)) { 
            e.target.value = value; // Si es válido, lo dejamos tal cual
        } else {
            e.target.value = value.slice(0, -1); // Eliminar el último carácter si no es válido
        }
    
        calcularSubtotal();
    });    

    nuevaDivisa.querySelector(".eliminar-divisa").addEventListener("click", () => {
        nuevaDivisa.remove();
        calcularTotal();
    });

    // Autocompletar divisa
    const divisaInput = nuevaDivisa.querySelector(".divisa-nombre");
    const sugerenciasUl = nuevaDivisa.querySelector(".divisa-sugerencias");

    divisaInput.addEventListener("input", async (e) => {
        const query = e.target.value.trim();
        if (query.length < 1) {
        sugerenciasUl.classList.add("hidden");
        return;
        }
        try {
        const res = await fetch(`https://cambiosorion.cl/data/nueva-op.php?buscar_divisa=${encodeURIComponent(query)}`);
        const divisas = await res.json();
        sugerenciasUl.innerHTML = "";
        divisas.forEach((divisa) => {
            const li = document.createElement("li");
            li.textContent = divisa.nombre;
            li.classList.add("px-2", "py-1", "hover:bg-gray-200", "cursor-pointer");
            li.addEventListener("click", () => {
            divisaInput.value = divisa.nombre;
            sugerenciasUl.classList.add("hidden");
            });
            sugerenciasUl.appendChild(li);
        });
        sugerenciasUl.classList.remove("hidden");
        } catch (err) {
        console.error(err);
        }
    });

    document.addEventListener("click", (e) => {
        if (!divisaInput.contains(e.target) && !sugerenciasUl.contains(e.target)) {
        sugerenciasUl.classList.add("hidden");
        }
    });

    document.getElementById("divisas-container").appendChild(nuevaDivisa);
}

function calcularTotal() {
    let total = 0;

    // Iterar sobre cada divisa y sumar el subtotal de cada una
    document.querySelectorAll(".divisa-item").forEach(item => {
        const subtotalText = item.querySelector(".divisa-subtotal").textContent.replace(/[^0-9]/g, "");  // Solo números

        // Asegurarse de que el subtotal es un número entero
        const subtotal = parseInt(subtotalText) || 0; // Convertimos a entero
        
        total += subtotal;
    });

    // Formatear el total con separadores de miles
    const totalFormateado = new Intl.NumberFormat('es-CL').format(total);

    // Mostrar el total en el DOM
    document.getElementById("total-operacion").textContent = `${totalFormateado}`;
}

// Inicializar con una divisa por defecto
agregarDivisa();

document.querySelector("button[type='submit']").addEventListener("click", async (e) => {
  e.preventDefault(); // Evita el comportamiento por defecto del formulario

  if (!clienteSeleccionado) {
    alert("Selecciona un cliente válido.");
    return;
  }

  const tipoTransaccion = document.getElementById("tipo-transaccion").value;
  const tipoDocumento = document.getElementById("tipo-documento").value;
  const observaciones = document.getElementById("observaciones").value;
  const fecha = new Date().toISOString().slice(0, 10); // Fecha actual en formato YYYY-MM-DD

  // Generar datos de prueba para número de documento y número de nota
  const numeroDocumento = "DOC-" + Math.floor(100000 + Math.random() * 900000); // ejemplo: DOC-123456
  const numeroNota = "NOTA-" + Math.floor(1000 + Math.random() * 9000); // ejemplo: NOTA-3456

  let totalOperacion = 0;
  let divisas = [];

  document.querySelectorAll(".divisa-item:not(.hidden)").forEach((item) => {
    const nombre = item.querySelector(".divisa-nombre").value.trim();
    const monto = parseInt(item.querySelector(".divisa-monto").value) || 0;
    const tasa = parseFloat(item.querySelector(".divisa-tasa").value) || 0;
    const subtotal = Math.round(monto * tasa);

    if (nombre && monto > 0 && tasa > 0) {
      divisas.push({ nombre, monto, tasa, subtotal });
      totalOperacion += subtotal;
    }
  });

  const payload = {
    fecha,
    cliente_id: clienteSeleccionado.id,
    tipo_transaccion: tipoTransaccion,
    tipo_documento: tipoDocumento,
    numero_documento: numeroDocumento,
    numero_nota: numeroNota,
    estado: "pendiente",
    observaciones,
    total: totalOperacion,
    divisas
  };

  // Verifica los valores recopilados
  console.log("Verificación de campos:");
  console.log("Cliente seleccionado:", clienteSeleccionado);
  console.log("Tipo de transacción:", tipoTransaccion);
  console.log("Tipo de documento:", tipoDocumento);
  console.log("Observaciones:", observaciones);
  console.log("Fecha:", fecha);
  console.log("Número de documento:", numeroDocumento);
  console.log("Número de nota:", numeroNota);
  console.log("Total operación:", totalOperacion);
  console.log("Divisas:", divisas);

  try {
    const res = await fetch("https://cambiosorion.cl/data/nueva-op.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const result = await res.json();
    if (result.error) {
      alert("Error al crear operación: " + result.error);
    } else {
      alert("Operación creada con éxito.");
      window.location.href = "https://tesoreria.cambiosorion.cl/operaciones";
    }
  } catch (err) {
    console.error(err);
    alert("Ocurrió un error al enviar los datos.");
  }
});

document.getElementById("cancelar-operacion").addEventListener("click", () => {
  window.location.href = "https://tesoreria.cambiosorion.cl/operaciones";
});


