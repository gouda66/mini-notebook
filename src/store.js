const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

const DATA_DIR = path.join(os.homedir(), '.mini-notebook');
const DATA_FILE = path.join(DATA_DIR, 'tasks.json');

const VALID_STATUSES = ['todo', 'done', 'continue'];

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    const initial = {
      tasks: [
        {
          id: crypto.randomUUID().slice(0, 8),
          title: '配置 AI Agent (Claude / Codex) 接入 MCP',
          status: 'todo',
          note: '将 mini-notebook 的 mcp-server.js 配置到 Agent 的 MCP 设置中',
          source: 'system',
          project: 'mini-notebook',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2), 'utf8');
  }
}

function readData() {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed.tasks) ? parsed : { tasks: [] };
  } catch {
    return { tasks: [] };
  }
}

function writeData(data) {
  ensureDataFile();
  const tmpFile = DATA_FILE + '.tmp';
  fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tmpFile, DATA_FILE);
}

function listTasks(filterStatus = null) {
  const { tasks } = readData();
  if (filterStatus && VALID_STATUSES.includes(filterStatus)) {
    return tasks.filter((t) => t.status === filterStatus);
  }
  return tasks;
}

function addTask({ title, status = 'todo', note = '', source = 'manual', project = '' }) {
  if (!title || !title.trim()) {
    throw new Error('任务标题不能为空');
  }
  const safeStatus = VALID_STATUSES.includes(status) ? status : 'todo';
  const data = readData();
  const now = new Date().toISOString();
  const task = {
    id: crypto.randomUUID().slice(0, 8),
    title: title.trim(),
    status: safeStatus,
    note: note.trim(),
    source: source.trim() || 'manual',
    project: project.trim(),
    createdAt: now,
    updatedAt: now,
  };
  data.tasks.unshift(task);
  writeData(data);
  return task;
}

function findTaskIndex(tasks, idOrTitle) {
  if (!idOrTitle) return -1;
  const key = idOrTitle.trim();
  let idx = tasks.findIndex((t) => t.id === key);
  if (idx !== -1) return idx;
  idx = tasks.findIndex((t) => t.title.toLowerCase() === key.toLowerCase());
  if (idx !== -1) return idx;
  return tasks.findIndex((t) => t.title.toLowerCase().includes(key.toLowerCase()));
}

function updateTask(idOrTitle, { status, note, source, title }) {
  const data = readData();
  const idx = findTaskIndex(data.tasks, idOrTitle);
  if (idx === -1) {
    return null;
  }
  const task = data.tasks[idx];
  if (status && VALID_STATUSES.includes(status)) {
    task.status = status;
  }
  if (typeof note === 'string') {
    task.note = note.trim();
  }
  if (typeof title === 'string' && title.trim()) {
    task.title = title.trim();
  }
  if (typeof source === 'string' && source.trim()) {
    task.source = source.trim();
  }
  task.updatedAt = new Date().toISOString();
  writeData(data);
  return task;
}

function deleteTask(idOrTitle) {
  const data = readData();
  const idx = findTaskIndex(data.tasks, idOrTitle);
  if (idx === -1) return false;
  data.tasks.splice(idx, 1);
  writeData(data);
  return true;
}

module.exports = {
  DATA_DIR,
  DATA_FILE,
  VALID_STATUSES,
  ensureDataFile,
  listTasks,
  addTask,
  updateTask,
  deleteTask,
};
