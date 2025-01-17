document.addEventListener('DOMContentLoaded', async () => {
  const userId = 1; // ID del trabajador (obtenido de la sesión)
  const calendarContainer = document.getElementById('calendar-container');
  const saveButton = document.getElementById('save-dates');
  const simulationResult = document.getElementById('simulation-result');

  // Fetch información inicial
  const workerInfo = await fetchWorkerInfo(userId);
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
    const response = await saveSelectedDates(userId, selectedDates);
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
    const result = await simulateVacationDays(userId, startDate, endDate);
    simulationResult.textContent = result.success
      ? `Días tomados: ${result.dias_tomados}`
      : `Error: ${result.error}`;
  });

  async function fetchWorkerInfo(userId) {
    const response = await fetch(`https://cambiosorion.cl/data/get_worker_info.php?id=${userId}`);
    return response.json();
  }

  async function saveSelectedDates(userId, dates) {
    const response = await fetch('https://cambiosorion.cl/data/save_dates.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, dates }),
    });
    return response.json();
  }

  async function simulateVacationDays(userId, startDate, endDate) {
    const response = await fetch('https://cambiosorion.cl/data/simulate_vacation_days.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, startDate, endDate }),
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
    const response = await fetch('https://cambiosorion.cl/data/generate_calendar.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentDate, availableDays }),
    });
    return response.json();
  }
});
