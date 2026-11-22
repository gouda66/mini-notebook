const { app, BrowserWindow, ipcMain, screen, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs');
const store = require('./store');

let mainWindow = null;
let isPinned = true;
let isCollapsed = false;

const SIDEBAR_WIDTH = 360;
const COLLAPSED_WIDTH = 36;

function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenW, height: screenH, y: workY } = primaryDisplay.workArea;

  mainWindow = new BrowserWindow({
    width: SIDEBAR_WIDTH,
    height: screenH,
    x: screenW - SIDEBAR_WIDTH,
    y: workY,
    frame: false,
    transparent: false,
    alwaysOnTop: isPinned,
    skipTaskbar: false,
    resizable: true,
    backgroundColor: '#14161b',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  store.ensureDataFile();
  let watchTimer = null;
  fs.watch(store.DATA_FILE, () => {
    clearTimeout(watchTimer);
    watchTimer = setTimeout(() => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('tasks:updated', store.listTasks());
      }
    }, 100);
  });
}

app.whenReady().then(() => {
  createWindow();

  globalShortcut.register('Alt+N', () => {
    if (!mainWindow) return;
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

ipcMain.handle('tasks:list', () => store.listTasks());
ipcMain.handle('tasks:add', (_e, payload) => store.addTask(payload));
ipcMain.handle('tasks:update', (_e, { id, patch }) => store.updateTask(id, patch));
ipcMain.handle('tasks:delete', (_e, id) => store.deleteTask(id));

ipcMain.handle('window:togglePin', () => {
  isPinned = !isPinned;
  if (mainWindow) mainWindow.setAlwaysOnTop(isPinned);
  return isPinned;
});

ipcMain.handle('window:toggleCollapse', () => {
  if (!mainWindow) return isCollapsed;
  const { width: screenW, height: screenH, y: workY } = screen.getPrimaryDisplay().workArea;
  isCollapsed = !isCollapsed;
  const targetW = isCollapsed ? COLLAPSED_WIDTH : SIDEBAR_WIDTH;
  mainWindow.setBounds({
    x: screenW - targetW,
    y: workY,
    width: targetW,
    height: screenH,
  });
  return isCollapsed;
});

ipcMain.on('window:hide', () => {
  if (mainWindow) mainWindow.hide();
});
