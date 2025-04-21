const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const activeWin = require('active-win');
const Store = require('./store');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.on('ready', () => {
  createWindow();

  setInterval(async () => {
    try {
      const window = await activeWin();
      if (window) {
        const currentApp = window.owner.name;
        const currentTitle = window.title;
        const activities = Store.get('activities') || [];
        activities.push({ app: currentApp, title: currentTitle, time: new Date() });
        Store.set('activities', activities);
      }
    } catch (error) {
      console.error('Error fetching active window:', error);
    }
  }, 5000);
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
  if (mainWindow === null) createWindow();
});

// IPC handler to send activity data to the renderer process
ipcMain.handle('get-activities', async () => {
  const activities = Store.get('activities') || [];
  const whitelist = Store.get('whitelist') || [];
  if (activities.length === 0) return { activities: [], allApps: [] };

  // Group activities by app and calculate total time
  const appTimes = {};
  const allApps = new Set(); // Собираем все приложения для выпадающего списка
  for (let i = 0; i < activities.length; i++) {
    const activity = activities[i];
    const appName = activity.app;
    const time = new Date(activity.time);

    allApps.add(appName); // Добавляем приложение в список всех приложений

    if (!appTimes[appName]) {
      appTimes[appName] = { totalTime: 0, lastTime: time };
    }

    if (i > 0) {
      const prevActivity = activities[i - 1];
      const prevTime = new Date(prevActivity.time);
      const timeDiff = (time - prevTime) / 1000; // Time difference in seconds
      if (prevActivity.app === appName && timeDiff < 10) {
        appTimes[appName].totalTime += timeDiff;
      }
    }
    appTimes[appName].lastTime = time;
  }

  // Filter by whitelist and convert to array for the frontend
  const filteredActivities = Object.keys(appTimes)
    .filter(app => whitelist.includes(app))
    .map(app => ({
      app,
      totalTime: Math.round(appTimes[app].totalTime),
    }));

  return { activities: filteredActivities, allApps: Array.from(allApps) };
});

// IPC handler to get the whitelist
ipcMain.handle('get-whitelist', async () => {
  return Store.get('whitelist') || [];
});

// IPC handler to add an app to the whitelist
ipcMain.handle('add-to-whitelist', async (event, appName) => {
  const whitelist = Store.get('whitelist') || [];
  if (!whitelist.includes(appName)) {
    whitelist.push(appName);
    Store.set('whitelist', whitelist);
  }
  return whitelist;
});

// IPC handler to remove an app from the whitelist
ipcMain.handle('remove-from-whitelist', async (event, appName) => {
  const whitelist = Store.get('whitelist') || [];
  const updatedWhitelist = whitelist.filter(app => app !== appName);
  Store.set('whitelist', updatedWhitelist);
  return updatedWhitelist;
});