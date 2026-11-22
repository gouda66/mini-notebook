const store = require('./store');

const [, , cmd, ...args] = process.argv;

function parseFlag(flagName) {
  const idx = args.indexOf(flagName);
  if (idx !== -1 && idx + 1 < args.length) {
    return args[idx + 1];
  }
  return undefined;
}

if (cmd === 'list') {
  const status = parseFlag('--status');
  console.log(JSON.stringify(store.listTasks(status), null, 2));
} else if (cmd === 'add') {
  const title = args[0];
  const note = parseFlag('--note') || '';
  const source = parseFlag('--source') || 'cli';
  const task = store.addTask({ title, status: 'todo', note, source });
  console.log('已添加:', task);
} else if (cmd === 'done') {
  const target = args[0];
  const note = parseFlag('--note');
  const source = parseFlag('--source') || 'cli';
  const task = store.updateTask(target, { status: 'done', note, source }) ||
    store.addTask({ title: target, status: 'done', note: note || '验收通过', source });
  console.log('已完成:', task);
} else if (cmd === 'continue') {
  const target = args[0];
  const note = parseFlag('--note');
  const source = parseFlag('--source') || 'cli';
  const task = store.updateTask(target, { status: 'continue', note, source }) ||
    store.addTask({ title: target, status: 'continue', note: note || '需继续实现', source });
  console.log('需继续:', task);
} else {
  console.log('用法: node src/cli.js <list|add|done|continue> <任务ID或标题> [--note 备注] [--source 来源]');
}
