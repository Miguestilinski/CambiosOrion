document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form-nuevo-egreso");
  const cajaSelect = document.getElementById("caja");
  const clienteInput = document.getElementById("cliente");
  const cuentaInput = document.getElementById("cuenta");
  const divisaInput = document.querySelector(".divisa-nombre");
  const montoInput = document.getElementById("monto-egreso");
  const inputTipoHidden = document.getElementById("tipo-transaccion");
  
  const resultadoClientes = document.getElementById("resultado-clientes");
  const resultadoCuentas = document.getElementById("resultado-cuentas");
  const divisaSugerencias = document.querySelector(".divisa-sugerencias");
  
  const deudaActualText = document.getElementById("deuda-actual");
  const deudaFuturaText = document.getElementById("deuda-futura");
  const radiosTipo = document.querySelectorAll('input[name="tipo_radio"]');

  let usuarioSesionId = null;
  const btnSubmit = document.querySelector("button[type='submit']");

  if(btnSubmit) {
      btnSubmit.disabled = true;
      btnSubmit.classList.add("opacity-50", "cursor-not-allowed");
  }

  // 1. Obtener Sesión
  async function obtenerSesionActiva() {
      try {
          const res = await fetch("https://cambiosorion.cl/data/session_status.php", { credentials: 'include' });
          const session = await res.json();
          
          if (session.isAuthenticated && session.equipo_id) {
              usuarioSesionId = session.equipo_id;
              if(btnSubmit) {
                  btnSubmit.disabled = false;
                  btnSubmit.classList.remove("opacity-50", "cursor-not-allowed");
              }
          } else {
              mostrarAlerta("Sesión requerida. Inicie sesión nuevamente.");
          }
      } catch (error) { console.error(error); }
  }
  obtenerSesionActiva();

  // 2. Cargar Cajas
  async function cargarCajas() {
    try {
      const res = await fetch("[https://cambiosorion.cl/data/nuevo-egr.php?buscar_cajas=1](https://cambiosorion.cl/data/nuevo-egr.php?buscar_cajas=1)");
      const cajas = await res.json();
      cajaSelect.innerHTML = ''; 
      cajas.forEach(c => {
        const opt = document.createElement("option");
        opt.value = c.id; opt.textContent = c.nombre;
        cajaSelect.appendChild(opt);
      });
      if (cajas.length > 0) cajaSelect.selectedIndex = 0;
    } catch (error) { console.error(error); }
  }
  cargarCajas();

  radiosTipo.forEach(radio => {
      radio.addEventListener('change', (e) => { if(e.target.checked) inputTipoHidden.value = e.target.value; });
  });

  // 3. Lógica Montos (EGRESO: Suma a la deuda/saldo del cliente)
  montoInput.addEventListener('input', (e) => {
      let val = e.target.value.replace(/\D/g, '');
      if(val) e.target.value = new Intl.NumberFormat('es-CL').format(parseInt(val));
      actualizarCalculos(val);
  });

  function actualizarCalculos(montoRaw) {
      const saldoActual = parseFloat(cuentaInput.dataset.deuda || 0);
      const monto = parseFloat(montoRaw || 0);
      const nombreDivisa = cuentaInput.dataset.nombreDivisa || '';
      
      // EGRESO: Le damos dinero, por lo tanto nos debe más (o nuestro saldo baja)
      // Depende de la perspectiva "me_deben". Si es positiva (me deben), ahora me deben mas.
      const nuevoSaldo = saldoActual + monto; 
      
      // Color: Rojo si aumenta deuda
      const colorClass = "text-yellow-400";
      
      if(deudaFuturaText) {
          deudaFuturaText.innerHTML = `Proyección: <span class="${colorClass} font-bold">${nuevoSaldo.toLocaleString('es-CL')}</span> ${nombreDivisa}`;
      }
  }

  // 4. Buscadores (Misma lógica, apunta a nuevo-egr.php)
  // A. Cliente
  let clienteTimeout;
  clienteInput.addEventListener("input", () => {
    clearTimeout(clienteTimeout);
    const query = clienteInput.value.trim();
    if (query.length < 2) { resultadoClientes.classList.add("hidden"); return; }
    clienteTimeout = setTimeout(async () => {
      try {
        const res = await fetch(`https://cambiosorion.cl/data/nuevo-egr.php?buscar_cliente=${encodeURIComponent(query)}`);
        const clientes = await res.json();
        resultadoClientes.innerHTML = "";
        clientes.forEach(c => {
            const li = document.createElement("li");
            li.textContent = c.nombre;
            li.className = "p-3 hover:bg-gray-100 cursor-pointer text-sm text-gray-800 border-b border-gray-100";
            li.addEventListener("click", () => {
              clienteInput.value = c.nombre;
              clienteInput.dataset.id = c.id;
              resultadoClientes.classList.add("hidden");
            });
            resultadoClientes.appendChild(li);
        });
        resultadoClientes.classList.remove("hidden");
      } catch (error) {}
    }, 300);
  });

  // B. Cuenta
  let cuentaTimeout;
  cuentaInput.addEventListener("input", () => {
      clearTimeout(cuentaTimeout);
      const query = cuentaInput.value.trim();
      if(query.length < 1) { resultadoCuentas.classList.add("hidden"); return; }
      cuentaTimeout = setTimeout(async () => {
         const clienteId = clienteInput.dataset.id || "";
         let url = `https://cambiosorion.cl/data/nuevo-egr.php?todas_cuentas=1`; 
         if(clienteId) url += `&cliente_id=${clienteId}`;
         try {
             const res = await fetch(url);
             const todas = await res.json();
             const filtradas = todas.filter(c => (c.nombre_cliente+" "+c.nombre_divisa).toLowerCase().includes(query.toLowerCase()));
             renderizarCuentas(filtradas);
         } catch(e) {}
      }, 300);
  });

  function renderizarCuentas(cuentas) {
    resultadoCuentas.innerHTML = "";
    if (cuentas.length === 0) resultadoCuentas.innerHTML = "<li class='p-3 text-sm text-gray-500'>No hay cuentas</li>";
    else {
      cuentas.forEach(c => {
        const li = document.createElement("li");
        li.textContent = `${c.nombre_cliente || 'General'} - ${c.nombre_divisa}`;
        li.className = "p-3 hover:bg-gray-100 cursor-pointer text-sm text-gray-800 border-b border-gray-100 flex justify-between";
        const saldoSpan = document.createElement("span");
        saldoSpan.className = "text-gray-500";
        saldoSpan.textContent = `$${parseInt(c.me_deben).toLocaleString()}`;
        li.appendChild(saldoSpan);
        li.addEventListener("click", () => {
          cuentaInput.value = `${c.nombre_cliente} - ${c.nombre_divisa}`;
          cuentaInput.dataset.id = c.id;
          cuentaInput.dataset.deuda = c.me_deben;
          cuentaInput.dataset.nombreDivisa = c.codigo_divisa;
          if(c.nombre_divisa && divisaInput) divisaInput.value = c.nombre_divisa; // Auto-divisa
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
      if(montoInput.value) montoInput.dispatchEvent(new Event('input'));
  }

  // C. Divisa (Con Iconos)
  if(divisaInput && divisaSugerencias) {
      divisaInput.addEventListener("input", async (e) => {
          const query = e.target.value.trim();
          if(query.length < 1) { divisaSugerencias.classList.add("hidden"); return; }
          try {
              const res = await fetch(`https://cambiosorion.cl/data/nuevo-egr.php?buscar_divisa=${encodeURIComponent(query)}`);
              const divisas = await res.json();
              divisaSugerencias.innerHTML = "";
              divisas.forEach(d => {
                  const li = document.createElement("li");
                  li.className = "p-2 hover:bg-gray-100 cursor-pointer text-sm text-gray-800 border-b border-gray-100 flex items-center gap-3";
                  let iconHtml = d.icono ? `<img src="${d.icono}" class="w-6 h-6 object-contain rounded-full">` : `<div class="w-6 h-6 bg-gray-200 rounded-full"></div>`;
                  li.innerHTML = `${iconHtml}<span>${d.nombre}</span>`;
                  li.addEventListener("click", () => {
                      divisaInput.value = d.nombre;
                      divisaInput.dataset.id = d.id; 
                      divisaSugerencias.classList.add("hidden");
                  });
                  divisaSugerencias.appendChild(li);
              });
              divisaSugerencias.classList.remove("hidden");
          } catch(e) {}
      });
  }

  document.addEventListener("click", (e) => {
      if (!clienteInput.contains(e.target) && !resultadoClientes.contains(e.target)) resultadoClientes.classList.add("hidden");
      if (!cuentaInput.contains(e.target) && !resultadoCuentas.contains(e.target)) resultadoCuentas.classList.add("hidden");
      if (divisaInput && !divisaInput.contains(e.target) && !divisaSugerencias.contains(e.target)) divisaSugerencias.classList.add("hidden");
  });

  // 5. Submit
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!usuarioSesionId) return mostrarAlerta("No hay sesión de cajero activa.");
    
    const montoRaw = parseFloat(montoInput.value.replace(/\./g, '').replace(/,/g, '.'));
    const divisaId = divisaInput ? divisaInput.dataset.id : null;

    if (!cajaSelect.value) return mostrarAlerta("Seleccione una caja.");
    if (!divisaId) return mostrarAlerta("Seleccione una divisa.");
    if (isNaN(montoRaw) || montoRaw <= 0) return mostrarAlerta("Ingrese un monto válido.");

    const payload = {
      operacion_id: 0, 
      tipo_egreso: inputTipoHidden.value,
      cliente_id: clienteInput.dataset.id || null,
      caja_id: cajaSelect.value,
      cuenta_id: cuentaInput.dataset.id || null,
      divisa_id: divisaId,
      monto: montoRaw,
      usuario_id: usuarioSesionId // Nota: Aunque no lo insertamos en BD, lo enviamos por si acaso lógica futura lo requiere
    };

    try {
      const res = await fetch("[https://cambiosorion.cl/data/nuevo-egr.php](https://cambiosorion.cl/data/nuevo-egr.php)", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      const data = await res.json();
      if (data.success) {
        document.getElementById("modal-exitoso").classList.remove("hidden");
        form.reset();
        // Reset visual
        clienteInput.dataset.id = ""; cuentaInput.dataset.id = ""; divisaInput.dataset.id = "";
        actualizarInfoDeuda(0, "");
      } else {
        mostrarAlerta(data.error || data.message, "Error al Registrar");
      }
    } catch (error) {
      mostrarAlerta("Error de conexión.");
    }
  });

  function mostrarAlerta(mensaje, titulo = "Atención") {
      const modal = document.getElementById("modal-alerta");
      document.getElementById("modal-titulo").textContent = titulo;
      document.getElementById("modal-mensaje").textContent = mensaje;
      modal.classList.remove("hidden");
      document.getElementById("cerrar-modal").onclick = () => modal.classList.add("hidden");
  }
});