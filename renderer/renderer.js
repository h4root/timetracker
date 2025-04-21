const { ipcRenderer } = window;

const input = document.getElementById('appInput');
const addBtn = document.getElementById('addAppBtn');
const appList = document.getElementById('appList');
const statsList = document.getElementById('statsList');

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h}ч ${m}м ${s}с`;
}

function renderAppList(apps) {
  appList.innerHTML = '';
  apps.forEach(app => {
    const li = document.createElement('li');
    li.textContent = app;
    appList.appendChild(li);
  });
}

function renderTimeStats(stats) {
  statsList.innerHTML = '';
  for (const [app, time] of Object.entries(stats)) {
    const li = document.createElement('li');
    li.textContent = `${app} — ${formatTime(time)}`;
    statsList.appendChild(li);
  }
}

// Добавление нового приложения
addBtn.addEventListener('click', async () => {
  const name = input.value.trim();
  if (!name) return;

  const updated = await ipcRenderer.invoke('add-app', name);
  renderAppList(updated);
  input.value = '';
});

// Начальная загрузка
(async () => {
  const apps = await ipcRenderer.invoke('get-apps');
  renderAppList(apps);

  const stats = await ipcRenderer.invoke('get-time-stats');
  renderTimeStats(stats);
})();

// Обновление времени каждые 5 секунд
setInterval(async () => {
  const stats = await ipcRenderer.invoke('get-time-stats');
  renderTimeStats(stats);
}, 5000);
