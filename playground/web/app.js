document.getElementById('reminders').addEventListener('submit', event => {
  event.preventDefault();
  const values = new FormData(event.currentTarget);
  document.getElementById('save-status').textContent = `Reminder recorded for ${values.get('season')} (this page only; nothing sent).`;
});
