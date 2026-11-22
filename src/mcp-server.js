const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { z } = require('zod');
const store = require('./store');

const server = new McpServer({
  name: 'mini-notebook',
  version: '1.0.0',
});

server.tool(
  'list_tasks',
  '列出当前开发进度记事本中的任务，可按状态筛选 (todo=未完成, done=确定已完成, continue=需继续实现)',
  {
    status: z.enum(['todo', 'done', 'continue']).optional().describe('可选：按状态筛选'),
  },
  async ({ status }) => {
    const tasks = store.listTasks(status || null);
    return {
      content: [{ type: 'text', text: JSON.stringify(tasks, null, 2) }],
    };
  }
);

server.tool(
  'add_task',
  '向记事本添加一个新任务',
  {
    title: z.string().describe('任务标题'),
    status: z.enum(['todo', 'done', 'continue']).optional().describe('初始状态，默认 todo'),
    note: z.string().optional().describe('任务备注或验收说明'),
    source: z.string().optional().describe('来源 Agent 名称，如 claude / codex / devin'),
    project: z.string().optional().describe('所属项目名'),
  },
  async ({ title, status, note, source, project }) => {
    const task = store.addTask({
      title,
      status: status || 'todo',
      note: note || '',
      source: source || 'agent',
      project: project || '',
    });
    return {
      content: [{ type: 'text', text: `已添加任务: [${task.id}] ${task.title} (${task.status})` }],
    };
  }
);

server.tool(
  'complete_task',
  '当任务开发完成且验收通过后，调用此工具将任务标记为确定已完成 (done)',
  {
    idOrTitle: z.string().describe('任务 ID 或任务标题（支持模糊匹配）'),
    note: z.string().optional().describe('验收结果说明，例如：单测全部通过'),
    source: z.string().optional().describe('执行验收的 Agent 名称，如 claude / codex / devin'),
  },
  async ({ idOrTitle, note, source }) => {
    let task = store.updateTask(idOrTitle, {
      status: 'done',
      note,
      source: source || 'agent',
    });
    if (!task) {
      task = store.addTask({
        title: idOrTitle,
        status: 'done',
        note: note || '验收通过',
        source: source || 'agent',
      });
      return {
        content: [{ type: 'text', text: `未找到原任务，已新建并标记为已完成: [${task.id}] ${task.title}` }],
      };
    }
    return {
      content: [{ type: 'text', text: `已标记为确定已完成: [${task.id}] ${task.title}` }],
    };
  }
);

server.tool(
  'mark_continue',
  '将任务标记为“需继续实现” (continue)，用于记录尚未完全收尾或需要后续跟进的事项',
  {
    idOrTitle: z.string().describe('任务 ID 或任务标题（支持模糊匹配）'),
    note: z.string().optional().describe('还需继续实现的原因或下一步计划'),
    source: z.string().optional().describe('Agent 名称，如 claude / codex / devin'),
  },
  async ({ idOrTitle, note, source }) => {
    let task = store.updateTask(idOrTitle, {
      status: 'continue',
      note,
      source: source || 'agent',
    });
    if (!task) {
      task = store.addTask({
        title: idOrTitle,
        status: 'continue',
        note: note || '需继续实现',
        source: source || 'agent',
      });
      return {
        content: [{ type: 'text', text: `未找到原任务，已新建并标记为需继续实现: [${task.id}] ${task.title}` }],
      };
    }
    return {
      content: [{ type: 'text', text: `已标记为需继续实现: [${task.id}] ${task.title}` }],
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error('MCP Server 启动失败:', err);
  process.exit(1);
});
