const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
const DATA_DIR = path.join(app.getPath('userData'), 'projects');
const BACKUP_DIR = path.join(app.getPath('userData'), 'backups');
const INDEX_FILE = path.join(DATA_DIR, 'projects-index.json');
const LLM_CONFIG_FILE = path.join(app.getPath('userData'), 'llm-config.json');

function loadLLMConfig() {
  try {
    if (fs.existsSync(LLM_CONFIG_FILE)) return JSON.parse(fs.readFileSync(LLM_CONFIG_FILE, 'utf-8'));
  } catch (e) { console.error(e); }
  return { endpoint: 'https://api.openai.com/v1', apiKey: '', model: 'gpt-4o', temperature: 0.8, maxTokens: 2048 };
}

function saveLLMConfig(config) {
  try {
    fs.writeFileSync(LLM_CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
    return true;
  } catch (e) { console.error(e); return false; }
}

async function aiCall(messages, options = {}) {
  const config = loadLLMConfig();
  if (!config.apiKey && !config.endpoint.includes('localhost') && !config.endpoint.includes('127.0.0.1')) {
    throw new Error('请先配置LLM API密钥');
  }
  const body = {
    model: config.model,
    messages,
    temperature: options.temperature ?? config.temperature,
    max_tokens: options.maxTokens ?? config.maxTokens,
    stream: false
  };
  const headers = { 'Content-Type': 'application/json' };
  if (config.apiKey) headers['Authorization'] = `Bearer ${config.apiKey}`;

  const url = config.endpoint.replace(/\/+$/, '') + '/chat/completions';
  const resp = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`LLM API 错误 (${resp.status}): ${errText.slice(0, 200)}`);
  }
  const json = await resp.json();
  return json.choices?.[0]?.message?.content || '';
}

async function aiCallStream(messages, event, options = {}) {
  const config = loadLLMConfig();
  if (!config.apiKey && !config.endpoint.includes('localhost') && !config.endpoint.includes('127.0.0.1')) {
    event.sender.send('ai-stream-error', '请先配置LLM API密钥');
    return;
  }
  const body = {
    model: config.model,
    messages,
    temperature: options.temperature ?? config.temperature,
    max_tokens: options.maxTokens ?? config.maxTokens,
    stream: true
  };
  const headers = { 'Content-Type': 'application/json' };
  if (config.apiKey) headers['Authorization'] = `Bearer ${config.apiKey}`;

  const url = config.endpoint.replace(/\/+$/, '') + '/chat/completions';
  try {
    const resp = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
    if (!resp.ok) {
      const errText = await resp.text();
      event.sender.send('ai-stream-error', `LLM API 错误 (${resp.status}): ${errText.slice(0, 200)}`);
      return;
    }
    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;
        const data = trimmed.slice(6);
        if (data === '[DONE]') { event.sender.send('ai-stream-done'); return; }
        try {
          const json = JSON.parse(data);
          const content = json.choices?.[0]?.delta?.content;
          if (content) event.sender.send('ai-stream-chunk', content);
        } catch (e) { /* skip malformed JSON */ }
      }
    }
    event.sender.send('ai-stream-done');
  } catch (e) {
    event.sender.send('ai-stream-error', e.message);
  }
}

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadIndex() {
  ensureDir();
  try {
    if (fs.existsSync(INDEX_FILE)) return JSON.parse(fs.readFileSync(INDEX_FILE, 'utf-8'));
  } catch (e) { console.error(e); }
  return [];
}

function saveIndex(list) {
  ensureDir();
  fs.writeFileSync(INDEX_FILE, JSON.stringify(list, null, 2), 'utf-8');
}

function loadProject(projectId) {
  const file = path.join(DATA_DIR, projectId + '.json');
  try {
    if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch (e) { console.error(e); }
  return null;
}

function saveProject(projectId, data) {
  ensureDir();
  const file = path.join(DATA_DIR, projectId + '.json');
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
  return true;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    title: '世界生成器',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  mainWindow.setMenuBarVisibility(false);
  mainWindow.on('close', (e) => {
    if (!mainWindow.isDestroyed()) {
      mainWindow.webContents.send('will-close');
    }
  });
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

ipcMain.handle('list-projects', () => {
  const list = loadIndex();
  list.forEach(p => {
    const file = path.join(DATA_DIR, p.id + '.json');
    try { if (fs.existsSync(file)) { const stat = fs.statSync(file); p.lastModified = stat.mtime.toISOString(); } }
    catch (e) { p.lastModified = p.createdAt; }
  });
  list.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
  return list;
});

ipcMain.handle('create-project', (_, name) => {
  const id = 'proj_' + Date.now();
  const now = new Date().toISOString();
  const projectData = {
    project: { name: name || '未命名世界', genre: '', synopsis: '', tags: [], createdAt: now },
    references: [], worldview: { origin: '', nature: '', culture: '', originDetail: '', natureDetail: '', cultureDetail: '' },
    locations: [], locationCategories: [], locationTagTree: [],
    timeline: [], characters: [], factions: [], items: [], itemCategories: [], itemInventory: { gridWidth: 8, gridHeight: 6, slots: [] },
    powerSystem: { name: '', description: '', source: '', levels: [], rules: '' },
    realismFantasy: {
      dimensions: [
        { id: 'physics', name: '物理法则', realismLevel: 50, description: '', fantasyElement: '', realismElement: '' },
        { id: 'magic', name: '魔法体系', realismLevel: 50, description: '', fantasyElement: '', realismElement: '' },
        { id: 'biology', name: '生物生态', realismLevel: 50, description: '', fantasyElement: '', realismElement: '' },
        { id: 'society', name: '社会结构', realismLevel: 50, description: '', fantasyElement: '', realismElement: '' },
        { id: 'tech', name: '科技水平', realismLevel: 50, description: '', fantasyElement: '', realismElement: '' },
        { id: 'race', name: '种族多样性', realismLevel: 50, description: '', fantasyElement: '', realismElement: '' },
        { id: 'deity', name: '神明存在', realismLevel: 50, description: '', fantasyElement: '', realismElement: '' },
        { id: 'history', name: '历史真实性', realismLevel: 50, description: '', fantasyElement: '', realismElement: '' },
        { id: 'economy', name: '经济体系', realismLevel: 50, description: '', fantasyElement: '', realismElement: '' },
        { id: 'culture', name: '文化习俗', realismLevel: 50, description: '', fantasyElement: '', realismElement: '' }
      ],
      globalNotes: '',
      customRules: []
    },
    storylines: [], outline: [], statusTable: [],
    characterRelations: [],
    constitution: [],
    worldMap: { seed: 0, genCount: 12, territories: [], locationMarkers: [], nextId: 1 },
    rules: { style: '', taboos: '', consistency: '' }
  };
  saveProject(id, projectData);
  const list = loadIndex();
  list.push({ id, name: name || '未命名世界', createdAt: now, lastModified: now });
  saveIndex(list);
  return { id, name: name || '未命名世界', data: projectData };
});

ipcMain.handle('open-project', (_, projectId) => {
  const data = loadProject(projectId);
  if (data) {
    const list = loadIndex();
    const entry = list.find(p => p.id === projectId);
    if (entry) {
      entry.lastModified = new Date().toISOString();
      saveIndex(list);
    }
  }
  return data;
});

ipcMain.handle('save-project', (_, projectId, data) => {
  const ok = saveProject(projectId, data);
  if (ok) {
    const list = loadIndex();
    const entry = list.find(p => p.id === projectId);
    if (entry) {
      entry.lastModified = new Date().toISOString();
      if (entry.name !== data.project.name) entry.name = data.project.name;
      saveIndex(list);
    }
  }
  return ok;
});

ipcMain.handle('delete-project', (_, projectId) => {
  const file = path.join(DATA_DIR, projectId + '.json');
  try { if (fs.existsSync(file)) fs.unlinkSync(file); } catch (e) { return false; }
  const list = loadIndex().filter(p => p.id !== projectId);
  saveIndex(list);
  return true;
});

ipcMain.handle('export-project', async (_, projectId) => {
  const data = loadProject(projectId);
  if (!data) return false;
  const result = await dialog.showSaveDialog(mainWindow, {
    title: '导出项目',
    defaultPath: (data.project?.name || 'world') + '.json',
    filters: [{ name: 'JSON', extensions: ['json'] }]
  });
  if (!result.canceled && result.filePath) {
    fs.writeFileSync(result.filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  }
  return false;
});

ipcMain.handle('import-project', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: '导入项目',
    filters: [{ name: 'JSON', extensions: ['json'] }],
    properties: ['openFile']
  });
  if (!result.canceled && result.filePaths.length > 0) {
    try {
      const raw = fs.readFileSync(result.filePaths[0], 'utf-8');
      const imported = JSON.parse(raw);
      const id = 'proj_' + Date.now();
      const now = new Date().toISOString();
      imported.project = imported.project || { name: '导入的项目', createdAt: now };
      saveProject(id, imported);
      const list = loadIndex();
      list.push({ id, name: imported.project.name || '导入的项目', createdAt: now, lastModified: now });
      saveIndex(list);
      return { id, name: imported.project.name || '导入的项目', data: imported };
    } catch (e) { return null; }
  }
  return null;
});

ipcMain.handle('rename-project', (_, projectId, newName) => {
  const list = loadIndex();
  const entry = list.find(p => p.id === projectId);
  if (entry) { entry.name = newName; saveIndex(list); return true; }
  return false;
});

// ============ LLM CONFIG ============
ipcMain.handle('get-llm-config', () => loadLLMConfig());
ipcMain.handle('set-llm-config', (_, config) => saveLLMConfig(config));

// ============ AI GENERATION HANDLERS ============
function buildProjectContext(data) {
  const p = data.project || {};
  const w = data.worldview || {};
  const locs = (data.locations || []).map(l => l.name).join('、');
  const chars = (data.characters || []).map(c => c.name).join('、');
  const factions = (data.factions || []).map(f => f.name).join('、');
  return `【世界观名称】${p.name}\n【类型】${p.genre}\n【简介】${p.synopsis}\n【世界起源】${w.origin} - ${w.originDetail}\n【自然法则】${w.nature} - ${w.natureDetail}\n【文化社会】${w.culture} - ${w.cultureDetail}\n【已有地点】${locs}\n【已有角色】${chars}\n【已有势力】${factions}`;
}

ipcMain.handle('ai-generate', async (_, messages) => {
  try { return { success: true, content: await aiCall(messages) }; }
  catch (e) { return { success: false, error: e.message }; }
});

ipcMain.handle('ai-generate-stream', async (event, messages) => {
  await aiCallStream(messages, event);
});

// --- 世界观生成 ---
ipcMain.handle('ai-generate-worldview', async (_, data) => {
  const ctx = buildProjectContext(data);
  return await aiCall([
    { role: 'system', content: '你是一个世界构建助手，帮助创作者构建幻想世界的世界观。请用中文回复，内容专业有深度。' },
    { role: 'user', content: `请为以下世界观项目生成完整的设定：\n${ctx}\n\n请生成：1.世界起源 2.自然法则 3.文化社会。每项用【标题】标记，描述详细。` }
  ]);
});

ipcMain.handle('ai-generate-synopsis', async (_, data) => {
  const ctx = buildProjectContext(data);
  return await aiCall([
    { role: 'system', content: '你是世界构建助手，用中文回复。' },
    { role: 'user', content: `请为这个世界观写一段精彩的简介（200字左右）：\n${ctx}` }
  ]);
});

// --- 真实与幻想 ---
ipcMain.handle('ai-suggest-dimensions', async (_, data) => {
  const ctx = buildProjectContext(data);
  const dims = (data.realismFantasy?.dimensions || []).map(d => `${d.name}(当前真实度:${d.realismLevel}%)`).join('\n');
  return await aiCall([
    { role: 'system', content: '你是世界构建助手，用中文回复。输出JSON格式。' },
    { role: 'user', content: `请根据世界观设定，为以下维度建议真实度(0-100，0=纯幻想，100=纯真实)，并给出幻想元素和真实元素描述：\n${ctx}\n\n当前维度:\n${dims}\n\n请以JSON格式返回：{"dimensions":[{"id":"维度id","realismLevel":数字,"fantasyElement":"幻想元素","realismElement":"真实元素","description":"说明"}]}` }
  ]);
});

// --- 地点生成 ---
ipcMain.handle('ai-generate-location', async (_, data) => {
  const ctx = buildProjectContext(data);
  return await aiCall([
    { role: 'system', content: '你是世界构建助手，用中文回复。输出JSON格式。' },
    { role: 'user', content: `请根据世界观生成一个有趣的地点。\n${ctx}\n\n返回JSON：{"name":"地点名","description":"描述","category":"分类","tags":["标签1","标签2"],"relatedCharacters":[],"events":["关联事件"]}` }
  ]);
});

// --- 角色生成 ---
ipcMain.handle('ai-generate-character', async (_, data) => {
  const ctx = buildProjectContext(data);
  return await aiCall([
    { role: 'system', content: '你是世界构建助手，用中文回复。输出JSON格式。' },
    { role: 'user', content: `请根据世界观生成一个角色。\n${ctx}\n\n返回JSON：{"name":"姓名","role":"角色定位","race":"种族","gender":"性别","age":"年龄","faction":"所属势力","description":"背景描述","skills":["技能"],"equipment":["装备"],"attributes":{${CHAR_DIMS.map(d=>`"${d}":数字`).join(',')}}}` }
  ]);
});

const CHAR_DIMS = ['力量','敏捷','体质','智力','智慧','魅力','感知','意志','幸运','耐力','速度','灵巧','魔力','精神力','生命力','创造力','记忆力','判断力','统率力','亲和力','直觉','韧性','潜能'];

// --- 势力生成 ---
ipcMain.handle('ai-generate-faction', async (_, data) => {
  const ctx = buildProjectContext(data);
  return await aiCall([
    { role: 'system', content: '你是世界构建助手，用中文回复。输出JSON格式。' },
    { role: 'user', content: `请根据世界观生成一个势力。\n${ctx}\n\n返回JSON：{"name":"势力名","type":"类型","description":"描述","leader":"领袖","memberCount":"规模","locations":["关联地点"]}` }
  ]);
});

// --- 道具生成 ---
ipcMain.handle('ai-generate-item', async (_, data) => {
  const ctx = buildProjectContext(data);
  return await aiCall([
    { role: 'system', content: '你是世界构建助手，用中文回复。输出JSON格式。' },
    { role: 'user', content: `请根据世界观生成一个有趣的道具/物品。\n${ctx}\n\n返回JSON：{"name":"道具名","icon":"emoji图标","category":"分类","description":"描述","rarity":"稀有度","gridW":占用宽度(1-4),"gridH":占用高度(1-4)}` }
  ]);
});

// --- 时间线 ---
ipcMain.handle('ai-generate-timeline-events', async (_, data) => {
  const ctx = buildProjectContext(data);
  return await aiCall([
    { role: 'system', content: '你是世界构建助手，用中文回复。输出JSON格式。' },
    { role: 'user', content: `请根据世界观生成5个重要历史事件。\n${ctx}\n\n返回JSON数组：[{"time":"时间","title":"标题","description":"描述"}]` }
  ]);
});

// --- 力量体系 ---
ipcMain.handle('ai-generate-power-system', async (_, data) => {
  const ctx = buildProjectContext(data);
  return await aiCall([
    { role: 'system', content: '你是世界构建助手，用中文回复。输出JSON格式。' },
    { role: 'user', content: `请根据世界观设计一个力量/魔法体系。\n${ctx}\n\n返回JSON：{"name":"体系名","description":"描述","source":"力量来源","levels":[{"name":"等级名","desc":"描述"}],"rules":"规则说明"}` }
  ]);
});

// --- 规则 ---
ipcMain.handle('ai-suggest-rules', async (_, data) => {
  const ctx = buildProjectContext(data);
  return await aiCall([
    { role: 'system', content: '你是世界构建助手，用中文回复。' },
    { role: 'user', content: `请为这个世界观建议创作风格指南和禁忌事项。\n${ctx}\n\n返回格式：\n【风格建议】...\n【禁忌事项】...\n【一致性建议】...` }
  ]);
});

// --- 一致性检查 ---
ipcMain.handle('ai-consistency-check', async (_, data) => {
  const ctx = buildProjectContext(data);
  const full = JSON.stringify({
    worldview: data.worldview,
    locations: (data.locations||[]).slice(0, 10),
    characters: (data.characters||[]).slice(0, 10),
    factions: data.factions,
    timeline: (data.timeline||[]).slice(0, 10),
    powerSystem: data.powerSystem,
    realismFantasy: data.realismFantasy
  }, null, 2);
  return await aiCall([
    { role: 'system', content: '你是世界构建助手，用中文回复。检查世界观的一致性。' },
    { role: 'user', content: `请检查以下世界观设定的一致性，找出矛盾、漏洞或可以改进的地方：\n${full.slice(0, 6000)}` }
  ]);
});

// --- 角色关系生成 ---
ipcMain.handle('ai-generate-relations', async (_, data) => {
  const chars = (data.characters || []).map(c => `${c.name}(${c.role||''},${c.faction||''})`).join('、');
  const ctx = buildProjectContext(data);
  return await aiCall([
    { role: 'system', content: '你是世界构建助手，用中文回复。输出JSON格式。' },
    { role: 'user', content: `请分析以下角色，生成他们之间的关系。\n${ctx}\n已有角色：${chars}\n\n返回JSON数组：[{"source":"角色名A","target":"角色名B","type":"关系类型(friend/enemy/family/lover/mentor/rival/ally/colleague)","description":"关系描述"}]` }
  ]);
});

// --- 世界宪法生成 ---
ipcMain.handle('ai-generate-constitution', async (_, data) => {
  const ctx = buildProjectContext(data);
  return await aiCall([
    { role: 'system', content: '你是世界构建助手，用中文回复。输出JSON格式。' },
    { role: 'user', content: `请为这个世界观设计"世界宪法"——即世界运行的基本法则和规则。\n${ctx}\n\n返回JSON数组：[{"category":"分类(如:物理法则/魔法规则/社会制度/禁忌/自然规律)","title":"规则标题","content":"规则详细描述"}]` }
  ]);
});

// --- 大纲/章节生成 ---
ipcMain.handle('ai-generate-outline', async (_, data) => {
  const ctx = buildProjectContext(data);
  return await aiCall([
    { role: 'system', content: '你是世界构建助手，用中文回复。输出JSON格式。' },
    { role: 'user', content: `请为这个世界观设计小说大纲（分卷/章/幕结构）。\n${ctx}\n\n返回JSON：{"volumes":[{"title":"卷名","summary":"卷简介","chapters":[{"title":"章名","summary":"章节简介","scenes":[{"title":"幕名","summary":"幕描述"}]}]}]}` }
  ]);
});

// ============ BACKUP SYSTEM ============
function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

ipcMain.handle('list-backups', (_, projectId) => {
  ensureBackupDir();
  try {
    const files = fs.readdirSync(BACKUP_DIR).filter(f => f.startsWith(projectId + '_') && f.endsWith('.json'));
    return files.map(f => {
      const stat = fs.statSync(path.join(BACKUP_DIR, f));
      const name = f.replace(projectId + '_', '').replace('.json', '');
      return { id: f, name, timestamp: stat.mtime.toISOString(), size: stat.size };
    }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  } catch (e) { return []; }
});

ipcMain.handle('create-backup', (_, projectId, data) => {
  ensureBackupDir();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${projectId}_${timestamp}.json`;
  fs.writeFileSync(path.join(BACKUP_DIR, filename), JSON.stringify(data, null, 2), 'utf-8');
  return { id: filename, timestamp };
});

ipcMain.handle('restore-backup', (_, backupId, projectId) => {
  const file = path.join(BACKUP_DIR, backupId);
  if (!fs.existsSync(file)) return null;
  const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
  saveProject(projectId, data);
  return data;
});

ipcMain.handle('delete-backup', (_, backupId) => {
  const file = path.join(BACKUP_DIR, backupId);
  try { if (fs.existsSync(file)) fs.unlinkSync(file); return true; } catch (e) { return false; }
});

// ============ ZIP EXPORT/IMPORT ============
ipcMain.handle('export-project-zip', async (_, projectId) => {
  const data = loadProject(projectId);
  if (!data) return false;
  const result = await dialog.showSaveDialog(mainWindow, {
    title: '导出项目（ZIP）',
    defaultPath: (data.project?.name || 'world') + '.zip',
    filters: [{ name: 'ZIP 压缩包', extensions: ['zip'] }]
  });
  if (!result.canceled && result.filePath) {
    try {
      const { JSZip } = require('./node_modules/jszip/dist/jszip.min.js') || {};
      if (typeof JSZip === 'function') {
        const zip = new JSZip();
        zip.file('project.json', JSON.stringify(data, null, 2));
        zip.file('manifest.json', JSON.stringify({
          name: data.project?.name || 'world',
          exportedAt: new Date().toISOString(),
          version: '1.0',
          type: 'storyforge-world'
        }, null, 2));
        const buffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
        fs.writeFileSync(result.filePath, buffer);
      } else {
        fs.writeFileSync(result.filePath, JSON.stringify(data, null, 2), 'utf-8');
      }
      return true;
    } catch (e) {
      fs.writeFileSync(result.filePath, JSON.stringify(data, null, 2), 'utf-8');
      return true;
    }
  }
  return false;
});

ipcMain.handle('import-project-zip', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: '导入项目（ZIP）',
    filters: [{ name: '项目文件', extensions: ['zip', 'json'] }],
    properties: ['openFile']
  });
  if (!result.canceled && result.filePaths.length > 0) {
    try {
      const filePath = result.filePaths[0];
      let imported;
      if (filePath.endsWith('.zip')) {
        try {
          const { JSZip } = require('./node_modules/jszip/dist/jszip.min.js') || {};
          if (typeof JSZip === 'function') {
            const zipData = fs.readFileSync(filePath);
            const zip = await JSZip.loadAsync(zipData);
            const projectFile = zip.file('project.json');
            if (projectFile) {
              imported = JSON.parse(await projectFile.async('string'));
            } else {
              const firstFile = Object.values(zip.files).find(f => !f.dir && f.name.endsWith('.json'));
              if (firstFile) imported = JSON.parse(await firstFile.async('string'));
            }
          }
        } catch (e) { /* fallback to raw JSON */ }
      }
      if (!imported) {
        const raw = fs.readFileSync(filePath, 'utf-8');
        imported = JSON.parse(raw);
      }
      const id = 'proj_' + Date.now();
      const now = new Date().toISOString();
      imported.project = imported.project || { name: '导入的项目', createdAt: now };
      saveProject(id, imported);
      const list = loadIndex();
      list.push({ id, name: imported.project.name || '导入的项目', createdAt: now, lastModified: now });
      saveIndex(list);
      return { id, name: imported.project.name || '导入的项目', data: imported };
    } catch (e) { return null; }
  }
  return null;
});