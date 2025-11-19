document.addEventListener("DOMContentLoaded", () => {
  // Referencias DOM
  const form = document.getElementById("form-nuevo-ingreso");
  
  // Inputs principales
  const cajaSelect = document.getElementById("caja");
  const clienteInput = document.getElementById("cliente");
  const cuentaInput = document.getElementById("cuenta");
  const divisaInput = document.querySelector(".divisa-nombre"); // Clase del nuevo HTML
  const montoInput = document.getElementById("monto-ingreso");
  const inputTipoHidden = document.getElementById("tipo-transaccion");
  
  // Listas de sugerencias
  const resultadoClientes = document.getElementById("resultado-clientes");
  const resultadoCuentas = document.getElementById("resultado-cuentas");
  const divisaSugerencias = document.querySelector(".divisa-sugerencias");
  
  // Textos informativos
  const deudaActualText = document.getElementById("deuda-actual");
  const deudaFuturaText = document.getElementById("deuda-futura");
  
  // Radio Buttons
  const radiosTipo = document.querySelectorAll('input[name="tipo_radio"]');

  // --- 1. CONFIGURACIÓN INICIAL ---

  // A. Obtener Sesión Activa (Cajero)
  async function obtenerSesionActiva() {
      try {
          const res = await fetch("https://cambiosorion.cl/data/session_status.php");
          const session = await res.json();
          
          if (session.isAuthenticated && session.equipo_id) {
              usuarioSesionId = session.equipo_id;
              console.log("Cajero identificado ID:", usuarioSesionId);
          } else {
              // Si no hay sesión, podrías redirigir o avisar
              mostrarAlerta("No se ha detectado una sesión activa. Por favor inicie sesión nuevamente.");
          }
      } catch (error) {
          console.error("Error verificando sesión:", error);
      }
  }
  obtenerSesionActiva();

  // B. Cargar Cajas y Pre-seleccionar Tesorería
  async function cargarCajas() {
    try {
      const res = await fetch("https://cambiosorion.cl/data/nuevo-ing.php?buscar_cajas=1");
      const cajas = await res.json();
      
      cajaSelect.innerHTML = ''; 
      
      cajas.forEach(caja => {
        const option = document.createElement("option");
        option.value = caja.id;
        option.textContent = caja.nombre;
        cajaSelect.appendChild(option);
      });

      // Seleccionar la primera opción (Tesorería, gracias al ordenamiento en PHP)
      if (cajas.length > 0) {
          cajaSelect.selectedIndex = 0;
      }

    } catch (error) {
      console.error("Error cajas:", error);
      cajaSelect.innerHTML = '<option value="">Error al cargar</option>';
    }
  }
  cargarCajas();

  // Listener para cambio de Tipo de Operación (Efectivo/Cuenta)
  radiosTipo.forEach(radio => {
      radio.addEventListener('change', (e) => {
          if(e.target.checked) {
              inputTipoHidden.value = e.target.value;
              // Opcional: Puedes limpiar el campo de cuenta si cambia a efectivo, o dejarlo.
          }
      });
  });

  // --- 2. LÓGICA DE MONTOS Y DEUDA ---

  // Formateador de Miles en tiempo real
  montoInput.addEventListener('input', (e) => {
      // 1. Obtener valor limpio (solo números)
      let val = e.target.value.replace(/\D/g, '');
      
      // 2. Formatear visualmente
      if(val) {
          e.target.value = new Intl.NumberFormat('es-CL').format(parseInt(val));
      }
      
      // 3. Calcular nuevo saldo proyectado
      actualizarCalculos(val);
  });

  function actualizarCalculos(montoRaw) {
      const saldoActual = parseFloat(cuentaInput.dataset.deuda || 0); // "me_deben"
      const monto = parseFloat(montoRaw || 0);
      const nombreDivisa = cuentaInput.dataset.nombreDivisa || '';
      
      // Lógica: Si ingresas dinero, la deuda del cliente disminuye (o tu saldo a favor aumenta)
      const nuevoSaldo = saldoActual - monto; 
      
      // Color dinámico: Verde si positivo/cero, Amarillo si negativo (deuda)
      const colorClass = nuevoSaldo >= 0 ? "text-green-400" : "text-yellow-400";
      
      if(deudaFuturaText) {
          deudaFuturaText.innerHTML = `Nuevo saldo: <span class="${colorClass} font-bold">${nuevoSaldo.toLocaleString('es-CL')}</span> ${nombreDivisa}`;
      }
  }

  // --- 3. BUSCADORES DINÁMICOS (CLIENTES, CUENTAS, DIVISAS) ---

  // A. CLIENTES
  let clienteTimeout;
  clienteInput.addEventListener("input", () => {
    clearTimeout(clienteTimeout);
    const query = clienteInput.value.trim();
    if (query.length < 2) {
      resultadoClientes.classList.add("hidden");
      return;
    }
    clienteTimeout = setTimeout(async () => {
      try {
        const res = await fetch(`https://cambiosorion.cl/data/nuevo-ing.php?buscar_cliente=${encodeURIComponent(query)}`);
        const clientes = await res.json();
        
        resultadoClientes.innerHTML = "";
        if (clientes.length === 0) {
          resultadoClientes.innerHTML = "<li class='p-3 text-sm text-gray-500'>No hay resultados</li>";
        } else {
          clientes.forEach(c => {
            const li = document.createElement("li");
            li.textContent = c.nombre;
            li.className = "p-3 hover:bg-gray-100 cursor-pointer text-sm text-gray-800 border-b border-gray-100 last:border-0";
            li.addEventListener("click", () => {
              clienteInput.value = c.nombre;
              clienteInput.dataset.id = c.id;
              resultadoClientes.classList.add("hidden");
              
              // Al cambiar cliente, sugerimos limpiar cuenta para evitar inconsistencias
              cuentaInput.value = "";
              cuentaInput.dataset.id = "";
              divisaInput.value = "";
              divisaInput.readOnly = false;
              divisaInput.classList.remove("bg-gray-700", "cursor-not-allowed");
              actualizarInfoDeuda(0, "");
            });
            resultadoClientes.appendChild(li);
          });
        }
        resultadoClientes.classList.remove("hidden");
      } catch (error) { console.error(error); }
    }, 300);
  });

  // B. CUENTAS
  let cuentaTimeout;
  cuentaInput.addEventListener("input", () => {
      clearTimeout(cuentaTimeout);
      const query = cuentaInput.value.trim();
      if(query.length < 1) {
          resultadoCuentas.classList.add("hidden");
          return;
      }
      cuentaTimeout = setTimeout(async () => {
         // Buscamos cuentas (si hay cliente seleccionado, el PHP puede filtrar)
         const clienteId = clienteInput.dataset.id || "";
         let url = `https://cambiosorion.cl/data/nuevo-ing.php?todas_cuentas=1`; 
         if(clienteId) url += `&cliente_id=${clienteId}`; // Optimización opcional si el backend lo soporta

         // Nota: Como el backend actual devuelve todas, filtramos en JS por query
         try {
             const res = await fetch(url);
             const todas = await res.json();
             const filtradas = todas.filter(c => 
                 (c.nombre_cliente + " " + c.nombre_divisa).toLowerCase().includes(query.toLowerCase())
             );
             renderizarCuentas(filtradas);
         } catch(e) { console.error(e); }
      }, 300);
  });

  // Auto-mostrar cuentas al hacer foco si hay cliente seleccionado
  cuentaInput.addEventListener("focus", async () => {
      const clienteId = clienteInput.dataset.id;
      if(clienteId && cuentaInput.value === "") {
           const res = await fetch(`https://cambiosorion.cl/data/nuevo-ing.php?cliente_id=${clienteId}`);
           const cuentas = await res.json();
           renderizarCuentas(cuentas);
      }
  });

  function renderizarCuentas(cuentas) {
    resultadoCuentas.innerHTML = "";
    if (cuentas.length === 0) {
      resultadoCuentas.innerHTML = "<li class='p-3 text-sm text-gray-500'>No hay cuentas</li>";
    } else {
      cuentas.forEach(c => {
        const li = document.createElement("li");
        li.textContent = `${c.nombre_cliente || 'General'} - ${c.nombre_divisa}`;
        li.className = "p-3 hover:bg-gray-100 cursor-pointer text-sm text-gray-800 border-b border-gray-100 flex justify-between";
        
        // Añadir saldo visualmente
        const saldoSpan = document.createElement("span");
        saldoSpan.className = c.me_deben > 0 ? "text-green-600 font-bold" : "text-gray-500";
        saldoSpan.textContent = `$${parseInt(c.me_deben).toLocaleString()}`;
        li.appendChild(saldoSpan);

        li.addEventListener("click", () => {
          cuentaInput.value = `${c.nombre_cliente || 'General'} - ${c.nombre_divisa}`;
          cuentaInput.dataset.id = c.id;
          cuentaInput.dataset.deuda = c.me_deben;
          cuentaInput.dataset.nombreDivisa = c.codigo_divisa;
          
          // IMPORTANTE: Auto-seleccionar divisa si la cuenta tiene una asociada
          // Asumimos que el backend envía divisa_id o lo inferimos
          if(c.nombre_divisa && divisaInput) {
               divisaInput.value = c.nombre_divisa;
               // Intentar setear el ID de la divisa si viene en el objeto cuenta (Ver nota PHP abajo)
               // Si no viene, el usuario tendrá que buscarla manualmente o el backend la infiere.
               // divisaInput.dataset.id = c.divisa_id; 
               
               // Bloquear para evitar errores
               // divisaInput.readOnly = true;
               // divisaInput.classList.add("bg-gray-700", "cursor-not-allowed");
          }
          
          actualizarInfoDeuda(c.me_deben, c.codigo_divisa);
          resultadoCuentas.classList.add("hidden");
        });
        resultadoCuentas.appendChild(li);
      });
    }
    resultadoCuentas.classList.remove("hidden");
  }

  function actualizarInfoDeuda(monto, divisa) {
      if(deudaActualText) deudaActualText.textContent = `${monto.toLocaleString()} ${divisa}`;
      // Resetear proyección
      if(deudaFuturaText) deudaFuturaText.textContent = "Nuevo saldo: —";
      // Disparar evento input en monto para recalcular si ya había un valor escrito
      if(montoInput.value) montoInput.dispatchEvent(new Event('input'));
  }

  // C. DIVISAS (Buscador)
  if(divisaInput && divisaSugerencias) {
      divisaInput.addEventListener("input", async (e) => {
          const query = e.target.value.trim();
          if(query.length < 1) {
              divisaSugerencias.classList.add("hidden");
              return;
          }
          try {
              const res = await fetch(`https://cambiosorion.cl/data/nuevo-ing.php?buscar_divisa=${encodeURIComponent(query)}`);
              const divisas = await res.json();
              
              divisaSugerencias.innerHTML = "";
              
              if (divisas.length === 0) {
                  divisaSugerencias.innerHTML = "<li class='p-3 text-sm text-gray-500'>No hay resultados</li>";
              } else {
                  divisas.forEach(d => {
                      const li = document.createElement("li");
                      li.className = "p-2 hover:bg-gray-100 cursor-pointer text-sm text-gray-800 border-b border-gray-100 flex items-center gap-3";
                      
                      // Crear elemento de imagen si existe icono
                      let iconHtml = "";
                      if (d.icono) {
                          iconHtml = `<img src="${d.icono}" class="w-6 h-6 object-contain rounded-full bg-gray-50 border border-gray-200" alt="">`;
                      } else {
                          // Fallback: Círculo con inicial
                          iconHtml = `<div class="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">${d.nombre.charAt(0)}</div>`;
                      }

                      li.innerHTML = `
                          ${iconHtml}
                          <span class="font-medium">${d.nombre}</span>
                      `;

                      li.addEventListener("click", () => {
                          divisaInput.value = d.nombre;
                          divisaInput.dataset.id = d.id; 
                          divisaSugerencias.classList.add("hidden");
                      });
                      divisaSugerencias.appendChild(li);
                  });
              }
              divisaSugerencias.classList.remove("hidden");
          } catch(e) { console.error(e); }
      });
  }

  // Cerrar listas al hacer clic fuera
  document.addEventListener("click", (e) => {
      if (!clienteInput.contains(e.target) && !resultadoClientes.contains(e.target)) resultadoClientes.classList.add("hidden");
      if (!cuentaInput.contains(e.target) && !resultadoCuentas.contains(e.target)) resultadoCuentas.classList.add("hidden");
      if (divisaInput && !divisaInput.contains(e.target) && !divisaSugerencias.contains(e.target)) divisaSugerencias.classList.add("hidden");
  });

  // --- 4. ENVÍO DEL FORMULARIO ---
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Limpiar formato de miles antes de enviar
    const montoRaw = parseFloat(montoInput.value.replace(/\./g, '').replace(/,/g, '.'));
    const divisaId = divisaInput ? divisaInput.dataset.id : null;

    // Validaciones Visuales
    if (!cajaSelect.value) return mostrarAlerta("Seleccione una caja de destino.");
    
    // Si es divisa manual, validar ID. Si vino por cuenta, validar que tengamos ID (o nombre al menos)
    // Nota: Si el usuario escribe "Dolar" pero no selecciona de la lista, dataset.id estará vacío.
    // Es recomendable forzar la selección.
    if (!divisaId && divisaInput.value) {
        return mostrarAlerta("Por favor seleccione la divisa de la lista desplegable para asegurar el código correcto.");
    }
    if (!divisaId) return mostrarAlerta("Debe seleccionar una divisa.");;

    if (isNaN(montoRaw) || montoRaw <= 0) return mostrarAlerta("Ingrese un monto válido mayor a 0.");

    // Validar cuenta si el tipo es 'cuenta'
    const cuentaId = cuentaInput.dataset.id;
    if (inputTipoHidden.value === 'cuenta' && !cuentaId) {
        return mostrarAlerta("Para ingresos de tipo 'Cuenta', debe seleccionar una cuenta de origen válida.");
    }

    const payload = {
      operacion_id: 0, // 0 para ingresos directos sin OP previa
      tipo_ingreso: inputTipoHidden.value,
      cliente_id: clienteInput.dataset.id || null,
      caja_id: cajaSelect.value,
      cuenta_id: cuentaId || null,
      divisa_id: divisaId,
      monto: montoRaw,
      usuario_id: usuarioSesionId
    };

    try {
      const res = await fetch("https://cambiosorion.cl/data/nuevo-ing.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      const data = await res.json();
      
      if (data.success) {
        // Mostrar modal de éxito
        document.getElementById("modal-exitoso").classList.remove("hidden");
        
        // Limpiar UI
        form.reset();
        clienteInput.dataset.id = "";
        cuentaInput.dataset.id = "";
        divisaInput.dataset.id = "";
        divisaInput.readOnly = false;
        actualizarInfoDeuda(0, "");
        
      } else {
        mostrarAlerta(data.error || data.message, "Error al Registrar"); // Reemplaza el alert de error del backend
      }
    } catch (error) {
      console.error("Error submit:", error);
      mostrarAlerta(data.error || data.message, "Error de conexión con el servidor.");
    }
  });

  // Helper para mostrar modales en vez de alerts
  function mostrarAlerta(mensaje, titulo = "Atención") {
      const modal = document.getElementById("modal-alerta");
      document.getElementById("modal-titulo").textContent = titulo;
      document.getElementById("modal-mensaje").textContent = mensaje;
      modal.classList.remove("hidden");
      
      // Botón cerrar
      const btnCerrar = document.getElementById("cerrar-modal");
      btnCerrar.onclick = () => modal.classList.add("hidden");
  }

  // Botones del Modal Exitoso
  const btnNuevaOp = document.getElementById("nueva-ingreso"); // ID del botón en tu HTML nuevo-ing.html (chequear ID)
  if(btnNuevaOp) {
      btnNuevaOp.onclick = () => {
          document.getElementById("modal-exitoso").classList.add("hidden");
          // Ya reseteamos el form arriba, listo para nueva op
      };
  }
  
  const btnVolver = document.getElementById("volver");
  if(btnVolver) {
      btnVolver.onclick = () => {
          window.location.href = "ingresos"; // Redirigir al listado
      };
  }
});