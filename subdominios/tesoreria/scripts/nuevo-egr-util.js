document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form-nuevo-utilidad");
  const cajaSelect = document.getElementById("caja");
  const conceptoInput = document.getElementById("concepto"); // Tipo Utilidad
  const cuentaInput = document.getElementById("cuenta");
  const divisaInput = document.querySelector(".divisa-nombre");
  const montoInput = document.getElementById("monto-egreso");
  const inputTipoHidden = document.getElementById("tipo-transaccion");
  
  const resultadoConceptos = document.getElementById("resultado-conceptos");
  const resultadoCuentas = document.getElementById("resultado-cuentas");
  const divisaSugerencias = document.querySelector(".divisa-sugerencias");
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
              if(btnSubmit) { btnSubmit.disabled = false; btnSubmit.classList.remove("opacity-50", "cursor-not-allowed"); }
          } else { mostrarAlerta("Sesión requerida."); }
      } catch (error) { console.error(error); }
  }
  obtenerSesionActiva();

  // 2. Cargar Cajas
  async function cargarCajas() {
    try {
      const res = await fetch("https://cambiosorion.cl/data/nuevo-egr-util.php?buscar_cajas=1");
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

  // 3. Montos
  montoInput.addEventListener('input', (e) => {
      let val = e.target.value.replace(/\D/g, '');
      if(val) e.target.value = new Intl.NumberFormat('es-CL').format(parseInt(val));
  });

  // 4. BUSCADORES

  // --- Buscador Tipo Utilidad ---
  let conceptoTimeout;
  conceptoInput.addEventListener("input", () => {
    clearTimeout(conceptoTimeout);
    const query = conceptoInput.value.trim();
    if (query.length === 0) { resultadoConceptos.classList.add("hidden"); return; }

    conceptoTimeout = setTimeout(async () => {
      try {
        const res = await fetch(`https://cambiosorion.cl/data/nuevo-egr-util.php?buscar_concepto=${encodeURIComponent(query)}`);
        const items = await res.json();
        
        resultadoConceptos.innerHTML = "";
        
        items.forEach(c => {
            const li = document.createElement("li");
            li.textContent = c.nombre;
            li.className = "p-3 hover:bg-gray-100 cursor-pointer text-sm text-gray-800 border-b border-gray-100 font-medium";
            li.addEventListener("click", () => {
              conceptoInput.value = c.nombre;
              resultadoConceptos.classList.add("hidden");
            });
            resultadoConceptos.appendChild(li);
        });

        const existeExacto = items.some(i => i.nombre.toLowerCase() === query.toLowerCase());
        if (!existeExacto && query.length > 0) {
            const liNuevo = document.createElement("li");
            liNuevo.innerHTML = `<span class="text-yellow-600 font-bold">➕ Agregar:</span> "${query}"`;
            liNuevo.className = "p-3 hover:bg-yellow-50 cursor-pointer text-sm text-gray-800 border-t-2 border-gray-100";
            liNuevo.addEventListener("click", () => {
                conceptoInput.value = query;
                resultadoConceptos.classList.add("hidden");
            });
            resultadoConceptos.appendChild(liNuevo);
        }
        resultadoConceptos.classList.remove("hidden");
      } catch (error) {}
    }, 300);
  });

  // --- Buscador Cuentas ---
  if(cuentaInput) {
      cuentaInput.addEventListener("input", async (e) => {
          const query = e.target.value.trim();
          if(query.length < 2) { resultadoCuentas.classList.add("hidden"); return; }
          
          try {
              const res = await fetch(`https://cambiosorion.cl/data/nuevo-egr-util.php?buscar_cuenta=${encodeURIComponent(query)}`);
              const cuentas = await res.json();
              resultadoCuentas.innerHTML = "";
              
              cuentas.forEach(c => {
                  const li = document.createElement("li");
                  li.className = "p-2 hover:bg-gray-100 cursor-pointer text-sm text-gray-800 border-b border-gray-100";
                  li.innerHTML = `<strong>${c.nombre_cuenta}</strong> <span class="text-xs text-gray-500">(${c.moneda})</span>`;
                  li.addEventListener("click", () => {
                      cuentaInput.value = c.nombre_cuenta;
                      cuentaInput.dataset.id = c.id; 
                      resultadoCuentas.classList.add("hidden");
                  });
                  resultadoCuentas.appendChild(li);
              });
              resultadoCuentas.classList.remove("hidden");
          } catch(e) {}
      });
  }

  // Buscador Divisas
  if(divisaInput) {
      divisaInput.addEventListener("input", async (e) => {
          const query = e.target.value.trim();
          if(query.length < 1) { divisaSugerencias.classList.add("hidden"); return; }
          try {
              const res = await fetch(`https://cambiosorion.cl/data/nuevo-egr-util.php?buscar_divisa=${encodeURIComponent(query)}`);
              const divisas = await res.json();
              divisaSugerencias.innerHTML = "";
              divisas.forEach(d => {
                  const li = document.createElement("li");
                  li.className = "p-2 hover:bg-gray-100 cursor-pointer text-sm text-gray-800 flex items-center gap-3";
                  let iconHtml = d.icono ? `<img src="${d.icono}" class="w-6 h-6 object-contain rounded-full">` : '';
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

  // Cerrar listas al hacer clic fuera
  document.addEventListener("click", (e) => {
      if (!conceptoInput.contains(e.target) && !resultadoConceptos.contains(e.target)) resultadoConceptos.classList.add("hidden");
      if (divisaInput && !divisaInput.contains(e.target) && !divisaSugerencias.contains(e.target)) divisaSugerencias.classList.add("hidden");
      if (cuentaInput && !cuentaInput.contains(e.target) && !resultadoCuentas.contains(e.target)) resultadoCuentas.classList.add("hidden");
  });

  // 5. Submit
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!usuarioSesionId) return mostrarAlerta("No hay sesión activa.");
    
    const montoRaw = parseFloat(montoInput.value.replace(/\./g, '').replace(/,/g, '.'));
    const divisaId = divisaInput ? divisaInput.dataset.id : null;
    const concepto = conceptoInput.value.trim();

    if (!cajaSelect.value) return mostrarAlerta("Seleccione caja.");
    if (!concepto) return mostrarAlerta("Ingrese un Tipo de Utilidad / Beneficiario.");
    if (!divisaId) return mostrarAlerta("Seleccione divisa.");
    if (isNaN(montoRaw) || montoRaw <= 0) return mostrarAlerta("Monto inválido.");

    const payload = {
      tipo_egreso: inputTipoHidden.value,
      item_utilidad: concepto,
      caja_id: cajaSelect.value,
      cuenta_id: cuentaInput.dataset.id || null, // Se habilita el envío del ID de cuenta
      divisa_id: divisaId,
      monto: montoRaw,
      usuario_id: usuarioSesionId,
      observaciones: document.getElementById("observaciones").value
    };

    try {
      const res = await fetch("https://cambiosorion.cl/data/nuevo-egr-util.php", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (data.success) {
        document.getElementById("modal-exitoso").classList.remove("hidden");
        form.reset();
        divisaInput.dataset.id = "";
        cuentaInput.dataset.id = ""; // Limpiar ID de cuenta
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