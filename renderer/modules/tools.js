// ============================================================
// 世界生成器 — 工具 (地图/规则/备份)
// 依赖: core/state.js, core/utils.js, core/modal.js
// ============================================================

// --- WORLD MAP ---
function renderMap() {
  return `<div class="card"><h3>🗺️ 世界地图</h3><p class="text-sm text-muted mb-16">在地图上可视化地点和势力范围</p>
    <div class="map-container"><canvas id="world-map-canvas" width="800" height="500"></canvas></div>
    <div class="form-group mt-16"><label>地图备注</label><textarea id="map-notes" rows="3" onchange="updateMapNotes(this.value)" style="width:100%;padding:8px 12px;background:var(--white);border:1px solid var(--border);border-radius:var(--radius-sm);font-size:14px;font-family:var(--font-body);resize:vertical">${esc((state.data.mapNotes||''))}</textarea></div></div>`;
}

function setupMap() { drawWorldMap(); }

function drawWorldMap() {
  const canvas = $('#world-map-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0,0,w,h);
  ctx.fillStyle = '#f7f6f3'; ctx.fillRect(0,0,w,h);
  ctx.fillStyle = '#000000'; ctx.font = '16px "Microsoft YaHei",sans-serif'; ctx.textAlign = 'center'; ctx.fillText('世界地图预览',w/2,h/2-30);
  ctx.font = '13px "Microsoft YaHei",sans-serif'; ctx.fillStyle = '#777169'; ctx.fillText('地点和势力范围将在此显示',w/2,h/2+10);
  const locs = state.data.locations||[];
  if (locs.length>0) {
    const margin = 60;
    locs.forEach((l,i) => {
      const x = margin + Math.random()*(w-2*margin);
      const y = margin + Math.random()*(h-2*margin);
      ctx.beginPath(); ctx.arc(x,y,8,0,Math.PI*2);
      ctx.fillStyle = '#000000'; ctx.fill();
      ctx.fillStyle = '#000000'; ctx.font = '12px "Microsoft YaHei",sans-serif'; ctx.textAlign = 'center'; ctx.fillText(l.name.slice(0,5),x,y+18);
    });
  }
}

function updateMapNotes(value) { state.data.mapNotes = value; autoSave(); }

// --- RULES ---
function renderRules() {
  const rules = state.data.rules || { style: '', taboos: '', consistency: '', genre: '' };
  return `<div class="card"><h3>✏️ 创作规则</h3>
    <div class="ai-section-actions"><button class="btn btn-ai btn-sm" onclick="aiGenRules()">🤖 AI 生成规则</button></div>
    <div id="ai-rules-result"></div>
    <div class="form-group"><label>风格要求</label><textarea id="rules-style" rows="3" onchange="updateRules('style',this.value)">${esc(rules.style||'')}</textarea></div>
    <div class="form-group"><label>避讳/禁忌</label><textarea id="rules-taboos" rows="3" onchange="updateRules('taboos',this.value)">${esc(rules.taboos||'')}</textarea></div>
    <div class="form-group"><label>一致性要求</label><textarea id="rules-consistency" rows="3" onchange="updateRules('consistency',this.value)">${esc(rules.consistency||'')}</textarea></div>
    <div class="form-group"><label>类型规范</label><textarea id="rules-genre" rows="3" onchange="updateRules('genre',this.value)">${esc(rules.genre||'')}</textarea></div></div>`;
}

function setupRules() {}
function updateRules(key,value) { if (!state.data.rules) state.data.rules={}; state.data.rules[key]=value; autoSave(); }
async function aiGenRules() { const el=$('#ai-rules-result'); const text=await runAI(window.api.aiGenerateRules(state.data),el); if (text) { const json=tryParseJSON(text); if (json) { if (!state.data.rules) state.data.rules={}; if (json.style) state.data.rules.style=json.style; if (json.taboos) state.data.rules.taboos=json.taboos; if (json.consistency) state.data.rules.consistency=json.consistency; if (json.genre) state.data.rules.genre=json.genre; autoSave(); renderTabContent(); } } }

// --- BACKUP ---
function renderBackups() {
  const backups = state.data.backups || [];
  return `<div class="card"><h3>💾 备份管理</h3><p class="text-sm text-muted mb-16">创建项目快照，随时恢复</p>
    <div class="flex-gap mb-16"><button class="btn btn-sm btn-primary" onclick="createBackup()">📸 创建快照</button><button class="btn btn-sm btn-outline" onclick="exportProject()">📤 导出 ZIP</button></div>
    <div class="backups-list">${backups.length===0?'<div class="empty-state"><div class="icon">💾</div><p>暂无备份</p></div>':backups.map((b,i)=>`<div class="backup-item"><div><strong>${esc(b.name||'快照 '+fmtDate(b.createdAt))}</strong><div class="meta">${fmtDate(b.createdAt)}</div></div><div class="flex-gap"><button class="btn btn-xs btn-outline" onclick="restoreBackup(${i})">恢复</button><button class="btn btn-xs btn-danger" onclick="deleteBackup(${i})">删除</button></div></div>`).join('')}</div></div>`;
}

function setupBackups() {}
function createBackup() {
  if (!state.data.backups) state.data.backups = [];
  const snapshot = JSON.parse(JSON.stringify(state.data));
  delete snapshot.backups;
  state.data.backups.push({ name: state.data.project.name + ' - ' + new Date().toLocaleString('zh-CN'), createdAt: new Date().toISOString(), data: snapshot });
  autoSave(); renderTabContent();
}

async function restoreBackup(i) {
  if (!await customConfirm('恢复到此快照？当前数据将被覆盖！')) return;
  const backup = state.data.backups[i];
  if (backup && backup.data) {
    state.data.project = backup.data.project;
    delete backup.data.backups;
    Object.keys(backup.data).forEach(k => { if (k !== 'project' && k !== 'backups') state.data[k] = backup.data[k]; });
    autoSave(); renderTabContent();
  }
}

async function deleteBackup(i) {
  if (!await customConfirm('删除此备份？')) return;
  state.data.backups.splice(i, 1);
  autoSave(); renderTabContent();
}

function exportProject() {
  const data = JSON.stringify(state.data, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `world-backup-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}