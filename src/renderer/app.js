let allTasks = [];
let currentFilter = 'all';

const taskListEl = document.getElementById('task-list');
const addForm = document.getElementById('add-form');
const newTitleInput = document.getElementById('new-title');
const btnPin = document.getElementById('btn-pin');
const btnCollapse = document.getElementById('btn-collapse');
const btnHide = document.getElementById('btn-hide');
const collapsedBar = document.getElementById('collapsed-bar');
const appEl = document.getElementById('app');

function updateCounts() {
  document.getElementById('count-all').textContent = allTasks.length;
  document.getElementById('count-todo').textContent = allTasks.filter((t) => t.status === 'todo').length;
  document.getElementById('count-continue').textContent = allTasks.filter((t) => t.status === 'continue').length;
  document.getElementById('count-done').textContent = allTasks.filter((t) => t.status === 'done').length;
}

function renderTasks() {
  updateCounts();
  const filtered = currentFilter === 'all'
    ? allTasks
    : allTasks.filter((t) => t.status === currentFilter);

  taskListEl.innerHTML = '';
  if (filtered.length === 0) {
    taskListEl.innerHTML = '<div style="text-align:center;color:#6b7280;font-size:12px;margin-top:24px;">暂无任务</div>';
    return;
  }

  for (const task of filtered) {
    const card = document.createElement('div');
    card.className = `task-card status-${task.status}`;

    const top = document.createElement('div');
    top.className = 'task-top';

    const title = document.createElement('div');
    title.className = 'task-title';
    title.textContent = task.title;

    const badge = document.createElement('span');
    badge.className = 'badge';
    badge.textContent = task.source || 'manual';

    top.appendChild(title);
    top.appendChild(badge);
    card.appendChild(top);

    if (task.note) {
      const note = document.createElement('div');
      note.className = 'task-note';
      note.textContent = task.note;
      card.appendChild(note);
    }

    const meta = document.createElement('div');
    meta.className = 'task-meta';

    const timeSpan = document.createElement('span');
    timeSpan.textContent = new Date(task.updatedAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

    const actions = document.createElement('div');
    actions.className = 'task-actions';

    const btnTodo = document.createElement('button');
    btnTodo.className = 'mini-btn';
    btnTodo.textContent = '未完成';
    btnTodo.onclick = () => setStatus(task.id, 'todo');

    const btnCont = document.createElement('button');
    btnCont.className = 'mini-btn';
    btnCont.textContent = '需继续';
    btnCont.onclick = () => setStatus(task.id, 'continue');

    const btnDone = document.createElement('button');
    btnDone.className = 'mini-btn';
    btnDone.textContent = '已完成';
    btnDone.onclick = () => setStatus(task.id, 'done');

    const btnDel = document.createElement('button');
    btnDel.className = 'mini-btn del';
    btnDel.textContent = '删';
    btnDel.onclick = () => removeTask(task.id);

    actions.append(btnTodo, btnCont, btnDone, btnDel);
    meta.append(timeSpan, actions);
    card.appendChild(meta);

    taskListEl.appendChild(card);
  }
}

async function refresh() {
  allTasks = await window.notebookAPI.listTasks();
  renderTasks();
}

async function setStatus(id, status) {
  await window.notebookAPI.updateTask(id, { status, source: 'manual' });
  await refresh();
}

async function removeTask(id) {
  await window.notebookAPI.deleteTask(id);
  await refresh();
}

addForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = newTitleInput.value.trim();
  if (!title) return;
  await window.notebookAPI.addTask({ title, status: 'todo', source: 'manual' });
  newTitleInput.value = '';
  await refresh();
});

document.querySelectorAll('.filter-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    renderTasks();
  });
});

btnPin.addEventListener('click', async () => {
  const pinned = await window.notebookAPI.togglePin();
  btnPin.classList.toggle('active', pinned);
});

async function handleCollapse() {
  const collapsed = await window.notebookAPI.toggleCollapse();
  appEl.classList.toggle('hidden', collapsed);
  collapsedBar.classList.toggle('hidden', !collapsed);
}

btnCollapse.addEventListener('click', handleCollapse);
collapsedBar.addEventListener('click', handleCollapse);
btnHide.addEventListener('click', () => window.notebookAPI.hideWindow());

window.notebookAPI.onTasksUpdated((tasks) => {
  allTasks = tasks;
  renderTasks();
});

refresh();
