document.getElementById('calculate').addEventListener('click', () => {
    const startDate = document.getElementById('start-date').value;
    const daysOff = parseInt(document.getElementById('days-off').value);
  
    if (!startDate || isNaN(daysOff) || daysOff <= 0) {
      alert('Por favor, introduce datos válidos.');
      return;
    }
  
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(start.getDate() + daysOff);
  
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('end-date').textContent = end.toLocaleDateString('es-ES', options);
    document.getElementById('result').classList.remove('hidden');
  });
  