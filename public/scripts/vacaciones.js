document.addEventListener('DOMContentLoaded', async () => {
  const calendarContainer = document.getElementById('calendar-container');
  const saveButton = document.getElementById('save-dates');
  const simulationResult = document.getElementById('simulation-result');

  try {
    // Obtén información de la sesión activa
    const sessionInfo = await fetchSessionInfo();
    if (!sessionInfo.isAuthenticated) {
      alert('Usuario no autenticado. Por favor, inicia sesión.');
      return;
    }

    // Render calendario
    const calendarDates = await generateCalendar(new Date(), sessionInfo.dias_disponibles);
    renderCalendar(calendarDates);

    // Mostrar información del trabajador
    displayWorkerInfo(sessionInfo);

    // Guardar días seleccionados
    saveButton.addEventListener('click', async () => {
      const selectedDates = Array.from(calendarContainer.querySelectorAll('.selected')).map(el => el.dataset.date);
      if (selectedDates.length === 0) {
        alert('Selecciona al menos un día.');
        return;
      }
      const response = await saveSelectedDates(selectedDates);
      alert(response.success ? 'Días guardados con éxito.' : response.error);
    });

    // Simulación
    document.getElementById('simulate').addEventListener('click', async () => {
      const startDate = document.getElementById('start-date').value;
      const endDate = document.getElementById('end-date').value;
      if (!startDate || !endDate) {
        alert('Por favor, introduce fechas válidas.');
        return;
      }
      const result = await simulateVacationDays(startDate, endDate);
      simulationResult.textContent = result.success
        ? `Días tomados: ${result.dias_tomados}`
        : `Error: ${result.error}`;
    });
  } catch (error) {
    console.error('Error al inicializar la aplicación:', error);
    alert('Ocurrió un error al cargar los datos. Intenta nuevamente más tarde.');
  }

  async function fetchSessionInfo() {
    const response = await fetch('https://cambiosorion.cl/data/session_status.php', {
        credentials: 'include',
    });
    if (!response.ok) {
        throw new Error('No se pudo obtener la información de la sesión.');
    }
    return response.json();
  }


  async function saveSelectedDates(dates) {
    const response = await fetch('https://cambiosorion.cl/data/vacaciones.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accion: 'registrarDiasTomados', dates }),
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error('No se pudieron guardar las fechas seleccionadas.');
    }
    return response.json();
  }

  async function simulateVacationDays(startDate, endDate) {
    const response = await fetch('https://cambiosorion.cl/data/vacaciones.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accion: 'simulateVacationDays', startDate, endDate }),
        credentials: 'include',
    });

    if (!response.ok) {
        throw new Error('No se pudo simular los días de vacaciones.');
    }

    const data = await response.json();
    
    // Aquí puedes ajustar para excluir los fines de semana y feriados
    const dias_tomados = calculateWorkingDays(startDate, endDate, data.feriados); // Aquí necesitas una función de días laborales
    if (data.success) {
      simulationResult.textContent = `Días tomados: ${data.dias_tomados}`;
    } else {
        simulationResult.textContent = `Error: ${data.message}`;
    }
    return {
        success: true,
        dias_tomados: dias_tomados
    };
  }

  function calculateWorkingDays(startDate, endDate, feriados) {
    let dias = 0;
    let currentDate = new Date(startDate);
    while (currentDate <= new Date(endDate)) {
        if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6 && !isHoliday(currentDate, feriados)) {
            dias++;
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return dias;
  }

  function isHoliday(date, feriados) {
      return feriados.some(feriado => new Date(feriado.fecha).toDateString() === date.toDateString());
  }

  function displayWorkerInfo(info) {
    document.getElementById('fecha-ingreso').textContent = info.fecha_ingreso;
    document.getElementById('meses-trabajados').textContent = info.meses_trabajados;
    document.getElementById('dias-disponibles').textContent = info.dias_disponibles;
    document.getElementById('dias-usados').textContent = info.dias_usados;
  }

  function renderCalendar(dates) {
    calendarContainer.innerHTML = '';
    dates.forEach(date => {
      const dayElement = document.createElement('div');
      dayElement.className = `p-2 border rounded cursor-pointer ${date.available ? 'bg-white' : 'bg-gray-200'}`;
      dayElement.textContent = date.day;
      if (date.available) {
        dayElement.addEventListener('click', () => dayElement.classList.toggle('selected'));
      }
      dayElement.dataset.date = date.date;
      calendarContainer.appendChild(dayElement);
    });
  }

  async function generateCalendar(currentDate, availableDays) {
    // Verificar que 'availableDays' sea un arreglo
    if (!Array.isArray(availableDays)) {
        console.error("availableDays no es un arreglo válido:", availableDays);
        throw new Error('availableDays no es un arreglo válido.');
    }

    // Enviar la solicitud a la API
    const response = await fetch('https://cambiosorion.cl/data/vacaciones.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accion: 'generateCalendar', currentDate, availableDays }),
        credentials: 'include',
    });

    if (!response.ok) {
        throw new Error('No se pudo generar el calendario.');
      }

    const data = await response.json();
    console.log('Respuesta de la API de vacaciones:', data);

    if (!data || !Array.isArray(data.dates)) {
        console.error('Respuesta inesperada de la API, data.dates no es un arreglo válido:', data);
        throw new Error('La respuesta de fechas no es un arreglo válido.');
    }

    return data.dates;  // Retorna el arreglo de fechas
  }

  // Función para obtener feriados de un año específico
  async function obtenerFeriados() {
    try {
        const response = await fetch('https://api.boostr.cl/holidays.json');
        const data = await response.json();
        console.log('Respuesta de la API de feriados:', data);

        // Asegurarse de que la respuesta contiene el campo 'data' y es un arreglo válido
        if (!data || !Array.isArray(data.data)) {
            throw new Error('La respuesta de feriados no contiene un arreglo válido.');
        }

        // Extraer las fechas de los feriados
        const feriados = data.data.map(feriado => feriado.date);

        // Verificar si se encontraron feriados
        if (feriados.length === 0) {
            throw new Error('No se encontraron feriados.');
        }

        return feriados;
    } catch (error) {
        console.error('Error al obtener los feriados:', error);
        throw new Error('Error al obtener los feriados: ' + error.message);
    }
  }


  // Mostrar los feriados en el HTML
  const mostrarFeriados = (data) => {
      const feriadosContainer = document.getElementById('feriados-container');
      feriadosContainer.innerHTML = ''; // Limpiar la lista de feriados

      data.forEach(feriado => {
          const div = document.createElement('div');
          div.classList.add('feriado-item');
          div.innerHTML = `
              <h4>${feriado.nombre}</h4>
              <p>Fecha: ${feriado.fecha}</p>
              <p>Tipo: ${feriado.tipo}</p>
              <p>Irrenunciable: ${feriado.irrenunciable ? 'Sí' : 'No'}</p>
              <p>Comentarios: ${feriado.comentarios || 'Ninguno'}</p>
          `;
          feriadosContainer.appendChild(div);
      });
  };

  // Llamada inicial para obtener los feriados del año actual (puedes modificar el año)
  const añoActual = new Date().getFullYear();
  obtenerFeriados(añoActual);
});
