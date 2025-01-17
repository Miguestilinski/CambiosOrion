document.addEventListener('DOMContentLoaded', async () => {
  const calendarContainer = document.getElementById('calendar-container');
  const saveButton = document.getElementById('save-dates');
  const simulationResult = document.getElementById('simulation-result');

  try {
    // Fetch información inicial del trabajador desde la sesión
    const workerInfo = await fetchWorkerInfo();
    displayWorkerInfo(workerInfo);

    // Render calendario
    const calendarDates = await generateCalendar(new Date(), workerInfo.dias_disponibles);
    renderCalendar(calendarDates);

    // Guardar días seleccionados
    saveButton.addEventListener('click', async () => {
      const selectedDates = Array.from(calendarContainer.querySelectorAll('.selected')).map(el => el.dataset.date);
      if (selectedDates.length === 0) {
        alert('Selecciona al menos un día.');
        return;
      }
      const response = await saveSelectedDates(selectedDates);
      alert(response.success ? 'Días guardados con éxito.' : response.message || 'Error al guardar días.');
    });

    // Simulación de días tomados
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
        : `Error: ${result.message || 'No se pudo realizar la simulación.'}`;
    });
  } catch (error) {
    console.error('Error inicializando la aplicación:', error);
    alert('Hubo un problema inicializando la aplicación. Inténtalo nuevamente.');
  }

  async function fetchWorkerInfo() {
    const response = await fetch('https://cambiosorion.cl/data/vacaciones.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accion: 'obtenerDias' })
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.message || 'Error al obtener información del trabajador.');
    return data.data;
  }

  async function saveSelectedDates(dates) {
    const response = await fetch('https://cambiosorion.cl/data/vacaciones.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accion: 'registrarDiasTomados', fechas: dates })
    });
    return response.json();
  }

  async function simulateVacationDays(startDate, endDate) {
    const response = await fetch('https://cambiosorion.cl/data/vacaciones.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accion: 'simularDias', fecha_inicio: startDate, fecha_fin: endDate })
    });
    return response.json();
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
    const response = await fetch('https://cambiosorion.cl/data/vacaciones.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accion: 'generarCalendario', fecha_actual: currentDate, dias_disponibles: availableDays })
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.message || 'Error al generar calendario.');
    return data.dates;
  }
});
