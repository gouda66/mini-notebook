const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('notebookAPI', {
  listTasks: () => ipcRenderer.invoke('tasks:list'),
  addTask: (payload) => ipcRenderer.invoke('tasks:add', payload),
  updateTask: (id, patch) => ipcRenderer.invoke('tasks:update', { id, patch }),
  deleteTask: (id) => ipcRenderer.invoke('tasks:delete', id),
  togglePin: () => ipcRenderer.invoke('window:togglePin'),
  toggleCollapse: () => ipcRenderer.invoke('window:toggleCollapse'),
  hideWindow: () => ipcRenderer.send('window:hide'),
  onTasksUpdated: (cb) => ipcRenderer.on('tasks:updated', (_e, tasks) => cb(tasks)),
});
