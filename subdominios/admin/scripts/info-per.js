document.addEventListener('DOMContentLoaded', () => {
    const userTypeElement = document.getElementById('user-type');
    const userNameElement = document.getElementById('user-name-dashboard');
    const roleTypeElement = document.getElementById('role-type');
    const rutElement = document.getElementById('rut');
    const editButton = document.getElementById('edit-button');
    const saveButton = document.getElementById('save_changes');

    const editableFields = [
        { id: 'correo', viewId: 'email-view', inputId: 'email' },
        { id: 'telefono', viewId: 'telefono-view', inputId: 'telefono' },
        { id: 'direccion', viewId: 'direccion-view', inputId: 'direccion' },
        { id: 'estado_civil', viewId: 'estado_civil-view', inputId: 'estado_civil' },
        { id: 'fecha_nacimiento', viewId: 'fecha_nacimiento-view', inputId: 'fecha_nacimiento' },
        { id: 'banco', viewId: 'banco-view', inputId: 'banco' },
        { id: 'tipo_cuenta', viewId: 'tipo_cuenta-view', inputId: 'tipo_cuenta' },
        { id: 'numero_cuenta', viewId: 'numero_cuenta-view', inputId: 'numero_cuenta' }
    ];

    let isEditing = false;
    let equipoId = null;
    let currentUser = null;

    async function getSession() {
        try {
            const res = await fetch("https://cambiosorion.cl/data/session_status.php", {
                credentials: "include"
            });
            if (!res.ok) throw new Error("No se pudo obtener la sesión.");
            const data = await res.json();
            equipoId = data.equipo_id;
            if (!equipoId) throw new Error("No se encontró equipo_id en sesión");
            getUserData();
        } catch (error) {
            console.error("Error obteniendo la sesión:", error);
            window.location.href = 'https://cambiosorion.cl/sin-acceso';
        }
    }

    function getUserData() {
        fetch(`https://cambiosorion.cl/data/info-per.php?equipo_id=${equipoId}`, {
            method: 'GET',
            credentials: 'include'
        })
            .then(res => res.json())
            .then(data => {
                if (!data.success) {
                    window.location.href = 'https://cambiosorion.cl/sin-acceso';
                    return;
                }

                const user = data.user;
                currentUser = user;
                fillUserData(user);

                // Ya no diferenciamos clientes, es siempre administrativo
                userTypeElement.textContent = "Administrativo";
                roleTypeElement.textContent = capitalizeFirstLetter(user.rol || "Otro");

                // Mostrar siempre el RUT
                rutElement.textContent = user.rut || "RUT no disponible";

                userNameElement.textContent = user.nombre || "Usuario desconocido";
            })
            .catch(error => console.error('Error al cargar los datos del usuario:', error));
    }

    function fillUserData(user) {
        editableFields.forEach(field => {
            const view = document.getElementById(field.viewId);
            const input = document.getElementById(field.inputId);

            const value = user[field.id] || '';
            const defaultPlaceholders = {
                correo: 'Ej: correo@dominio.cl',
                telefono: 'Ej: +56 9 1234 5678',
                direccion: 'Ej: Agustinas 1035',
                estado_civil: 'Ej: Soltero, Casado',
                fecha_nacimiento: 'Selecciona una fecha',
                banco: 'Nombre del banco',
                tipo_cuenta: 'Corriente, Vista, etc.',
                numero_cuenta: 'Ej: 1234567890'
            };

            if (view) {
                view.textContent = value || '—';
            }

            if (input) {
                input.classList.add('hidden');

                // Para selects: seleccionar la opción correcta
                if (input.tagName === 'SELECT') {
                    input.value = value;
                } else {
                    input.placeholder = value || defaultPlaceholders[field.id] || '';
                }
            }
        });
    }

    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    editButton.addEventListener('click', () => {
        isEditing = !isEditing;

        const passwordGroup = document.getElementById('password-group');
        passwordGroup.classList.toggle('hidden', !isEditing);

        editableFields.forEach(field => {
            const view = document.getElementById(field.viewId);
            const input = document.getElementById(field.inputId);

            if (view && input) {
                if (isEditing) {
                    if (input.tagName === 'SELECT') {
                        input.value = currentUser[field.id] || '';
                    } else {
                        input.value = view.textContent === '—' ? '' : view.textContent;
                    }
                    view.classList.add('hidden');
                    input.classList.remove('hidden');
                } else {
                    input.classList.add('hidden');
                    view.classList.remove('hidden');
                }
            }
        });

        // Cambiar texto del botón
        editButton.textContent = isEditing ? 'Cancelar' : 'Editar Datos';
        // Mostrar u ocultar botón de guardar
        saveButton.classList.toggle('hidden', !isEditing);
    });

    saveButton.addEventListener('click', async (e) => {
        e.preventDefault();

        const dataToSend = {
            equipo_id: equipoId
        };

        editableFields.forEach(field => {
            const input = document.getElementById(field.inputId);
            if (input) {
                dataToSend[field.id] = input.value.trim();
            }
        });

        const password = document.getElementById('password').value.trim();
        const confirmPassword = document.getElementById('confirm-password').value.trim();

        if (password && password === confirmPassword) {
            dataToSend.password = password;
        } else if (password !== confirmPassword) {
            mostrarModalError({
                titulo: "❌ Error",
                mensaje: "Las contraseñas no coinciden."
            });
            return;
        }

        try {
            const res = await fetch('https://cambiosorion.cl/data/info-per.php', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(dataToSend)
            });

            const raw = await res.text();
            console.log('Respuesta cruda del backend:', raw);

            let data;

            try {
                data = JSON.parse(raw);
            } catch (err) {
                mostrarModalError({
                    titulo: "❌ Error",
                    mensaje: "La respuesta del servidor no es un JSON válido. Revisa la consola para más detalles."
                });
                return;
            }

            if (data.success) {
                mostrarModalExitoso();
                isEditing = false;
                editButton.textContent = 'Editar Datos';
                saveButton.classList.add('hidden');
                getUserData();
            } else {
                mostrarModalError({
                    titulo: "❌ Error",
                    mensaje: `Error al guardar los cambios: ${data.message}`
                });
            }
        } catch (error) {
            console.error('Error al guardar los cambios:', error);
            mostrarModalError({
                titulo: "❌ Error",
                mensaje: "Ocurrió un al intentar guardar los cambios."
            });
        }
    });

    getSession();
});

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

  document.getElementById("volver").onclick = () => {
    modal.classList.add("hidden");
  };
}