import { initSystem } from './index.js';

document.addEventListener("DOMContentLoaded", async () => {
    // 1. Inicializar sistema (Sidebar y Header)
    // Usamos 'divisas' para iluminar el link si existe en sidebar
    await initSystem('divisas');

    const form = document.getElementById("form-nueva-divisa");
    const iconoSelector = document.getElementById("icono-selector");
    const urlIconoInput = document.getElementById("url-icono");
    const iconoPreview = document.getElementById("icono-preview");
    const iconoPlaceholder = document.getElementById("icono-placeholder");
    const iconoNombre = document.getElementById("icono-nombre");
    const fraccionableCheckbox = document.getElementById("fraccionable");
    const seccionDenominacion = document.getElementById("seccion-denominacion");
    const cancelarBtn = document.getElementById("cancelar");

    // Navegación
    if(cancelarBtn) {
        cancelarBtn.addEventListener("click", () => {
            // Ajusta la URL de retorno según tu estructura
            window.history.back();
        });
    }

    // Toggle Denominaciones
    fraccionableCheckbox.addEventListener("change", () => {
        if(fraccionableCheckbox.checked) {
            seccionDenominacion.classList.remove("hidden");
        } else {
            seccionDenominacion.classList.add("hidden");
        }
    });

    // Cargar Iconos (Banderas)
    async function cargarIconos() {
        try {
            const res = await fetch("https://cambiosorion.cl/data/nueva-div.php");
            const iconos = await res.json();

            if (!Array.isArray(iconos)) throw new Error("Formato de iconos inválido");

            iconoSelector.innerHTML = "";
            iconos.forEach(({ codigo, url }) => {
                const img = document.createElement("img");
                img.src = url;
                img.alt = codigo;
                img.title = codigo;
                img.className = "w-8 h-8 rounded-full border border-slate-600 hover:border-amber-500 cursor-pointer transition transform hover:scale-110 object-cover bg-slate-800";
                
                img.addEventListener("click", () => {
                    // Resetear estilos anteriores
                    document.querySelectorAll("#icono-selector img").forEach(i => {
                        i.classList.remove("ring-2", "ring-amber-500", "scale-110");
                    });
                    
                    // Activar actual
                    img.classList.add("ring-2", "ring-amber-500", "scale-110");
                    
                    // Setear valores
                    urlIconoInput.value = url;
                    iconoPreview.src = url;
                    iconoPreview.classList.remove("hidden");
                    iconoPlaceholder.classList.add("hidden");
                    iconoNombre.textContent = codigo;
                });

                iconoSelector.appendChild(img);
            });

        } catch (e) {
            console.error(e);
            iconoSelector.innerHTML = "<p class='col-span-8 text-xs text-red-400 text-center'>Error cargando iconos.</p>";
        }
    }
    cargarIconos();

    // Submit Formulario
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const data = {
            nombre: document.getElementById("nombre").value.trim(),
            tipo_divisa: document.getElementById("tipo-divisa").value,
            pais: document.getElementById("pais").value.trim(),
            codigo: document.getElementById("codigo").value.trim().toUpperCase(),
            simbolo: document.getElementById("simbolo").value.trim(),
            url_icono: urlIconoInput.value,
            fraccionable: fraccionableCheckbox.checked ? 1 : 0,
            denominacion: document.getElementById("denominacion").value.trim()
        };

        if(!data.codigo || !data.simbolo) return mostrarModal({ tipo: 'error', titulo: "Faltan Datos", mensaje: "Código y Símbolo son obligatorios." });

        try {
            const res = await fetch("https://cambiosorion.cl/data/nueva-div.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            const result = await res.json();

            if (result.success) {
                mostrarModal({ 
                    tipo: 'exito', 
                    titulo: "Divisa Creada", 
                    mensaje: "La nueva divisa se ha registrado correctamente.",
                    onConfirmar: () => {
                        form.reset();
                        urlIconoInput.value = "";
                        iconoPreview.classList.add("hidden");
                        iconoPlaceholder.classList.remove("hidden");
                        iconoNombre.textContent = "Ninguno";
                        document.querySelectorAll("#icono-selector img").forEach(i => i.classList.remove("ring-2", "ring-amber-500"));
                    }
                });
            } else {
                mostrarModal({ tipo: 'error', titulo: "Error", mensaje: result.error || "No se pudo guardar." });
            }

        } catch (err) {
            console.error(err);
            mostrarModal({ tipo: 'error', titulo: "Error de Conexión", mensaje: "No se pudo conectar con el servidor." });
        }
    });

    // --- SISTEMA MODALES UNIFICADO (SVG) ---
    function mostrarModal({ tipo = 'info', titulo, mensaje, textoConfirmar = "Aceptar", textoCancelar = null, onConfirmar, onCancelar }) {
        const modal = document.getElementById("modal-generico");
        const iconoDiv = document.getElementById("modal-generico-icono");
        const btnConfirmar = document.getElementById("modal-generico-confirmar");
        const btnCancelar = document.getElementById("modal-generico-cancelar");

        const iconos = {
            'exito': `<div class="p-3 rounded-full bg-green-900/30 border border-green-500/30"><svg class="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg></div>`,
            'error': `<div class="p-3 rounded-full bg-red-900/30 border border-red-500/30"><svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></div>`,
            'info': ''
        };

        if(iconoDiv) iconoDiv.innerHTML = iconos[tipo] || '';

        document.getElementById("modal-generico-titulo").textContent = titulo;
        document.getElementById("modal-generico-mensaje").textContent = mensaje;
        
        btnConfirmar.textContent = textoConfirmar;
        
        if (textoCancelar) {
            btnCancelar.classList.remove("hidden");
            btnCancelar.textContent = textoCancelar;
        } else {
            btnCancelar.classList.add("hidden");
        }

        modal.classList.remove("hidden");

        const newConfirm = btnConfirmar.cloneNode(true);
        const newCancel = btnCancelar.cloneNode(true);
        btnConfirmar.parentNode.replaceChild(newConfirm, btnConfirmar);
        btnCancelar.parentNode.replaceChild(newCancel, btnCancelar);

        newConfirm.onclick = () => { modal.classList.add("hidden"); if (onConfirmar) onConfirmar(); };
        newCancel.onclick = () => { modal.classList.add("hidden"); if (onCancelar) onCancelar(); };
    }
});