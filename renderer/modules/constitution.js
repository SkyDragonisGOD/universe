// ============================================================
// 世界生成器 — 宪法
// 依赖: core/state.js, core/utils.js, core/ai.js
// ============================================================

function renderConstitution() {
  const con = state.data.constitution || [];
  return `<div class="card"><h3>📜 世界宪法</h3><p class="text-sm text-muted mb-16">定义世界运行的基本法则与规则</p>
    <div class="ai-section-actions"><button class="btn btn-ai btn-sm" onclick="aiGenConstitution()">🤖 AI 生成宪法</button><button class="btn btn-sm btn-primary" onclick="addConstitutionEntry()">+ 添加条目</button></div>
    <div id="ai-constitution-result"></div><div class="constitution-list">${con.length===0?'<div class="empty-state"><div class="icon">📜</div><p>暂无宪法条目</p></div>':con.map((c,i)=>renderConstitutionEntry(c,i)).join('')}</div></div>`;
}
function renderConstitutionEntry(c,i) {
  return `<div class="constitution-entry"><div class="flex-between"><span class="constitution-category">${esc(c.category||'未分类')}</span><button class="btn btn-xs btn-danger" onclick="deleteConstitutionEntry(${i})">×</button></div>
    <input value="${esc(c.title||'')}" placeholder="规则标题" onchange="updateConstitutionEntry(${i},'title',this.value)" style="width:100%;padding:8px 12px;margin:6px 0;background:var(--white);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--black);font-size:15px;font-weight:500;font-family:var(--font-body)">
    <textarea rows="3" placeholder="规则详细描述" onchange="updateConstitutionEntry(${i},'content',this.value)" style="width:100%;padding:8px 12px;background:var(--white);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--black);font-size:14px;font-family:var(--font-body);resize:vertical">${esc(c.content||'')}</textarea></div>`;
}
function setupConstitution() {}
function addConstitutionEntry() { if (!state.data.constitution) state.data.constitution=[]; state.data.constitution.push({category:'',title:'',content:''}); autoSave(); renderTabContent(); }
async function aiGenConstitution() {
  const el = $('#ai-constitution-result');
  const text = await runAI(window.api.aiGenerateConstitution(state.data), el);
  if (text) { const arr = tryParseJSONArray(text)||tryParseJSON(text); if (arr && Array.isArray(arr)) { if (!state.data.constitution) state.data.constitution=[]; arr.forEach(c=>state.data.constitution.push({category:c.category||'',title:c.title||'',content:c.content||''})); autoSave(); renderTabContent(); } }
}
function updateConstitutionEntry(i,key,value) { if (state.data.constitution&&state.data.constitution[i]) { state.data.constitution[i][key]=value; autoSave(); } }
async function deleteConstitutionEntry(i) { if (!await customConfirm('删除此条目？')) return; state.data.constitution.splice(i,1); autoSave(); renderTabContent(); }