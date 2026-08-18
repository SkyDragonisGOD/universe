// ============================================================
// 世界生成器 — 概览 & 世界观
// 依赖: core/state.js, core/utils.js, core/animation.js, core/ai.js
// ============================================================

// --- OVERVIEW ---
function renderOverview() {
  const p = state.data.project;
  return `<div class="card"><h3>项目信息</h3>
    <div class="form-group"><label>世界名称</label><input id="ov-name" value="${esc(p.name)}" onchange="updateProjectField('name',this.value)"></div>
    <div class="form-row"><div class="form-group"><label>类型/风格</label><input id="ov-genre" value="${esc(p.genre||'')}" onchange="updateProjectField('genre',this.value)"></div>
    <div class="form-group"><label>标签（逗号分隔）</label><input id="ov-tags" value="${esc((p.tags||[]).join(', '))}" onchange="updateProjectField('tags',this.value.split(',').map(t=>t.trim()).filter(Boolean))"></div></div>
    <div class="form-group"><label>世界观简介</label><textarea id="ov-synopsis" rows="4" onchange="updateProjectField('synopsis',this.value)">${esc(p.synopsis||'')}</textarea></div></div>
    <div class="card"><h3>数据统计</h3><div class="grid-3">
      <div class="attr-item"><div class="attr-name">📚 词条总数</div><div class="attr-value">${getAllExplorerEntries().length}</div></div>
      ${[['地点','locations'],['角色','characters'],['势力','factions'],['关系图','characterRelations'],['大纲','outline'],['力量体系','powers']].map(([label,key]) => {
        return `<div class="attr-item"><div class="attr-name">${label}</div><div class="attr-value">${(state.data[key]||[]).length}</div></div>`;
      }).join('')}
      ${(state.data.worldBackpacks||[]).filter(bp => (state.data.items||[]).filter(i=>i.backpackId===bp.id).length > 0).map(bp => {
        const count = (state.data.items||[]).filter(i=>i.backpackId===bp.id).length;
        return `<div class="attr-item"><div class="attr-name">🎲 ${esc(bp.name)}</div><div class="attr-value">${count}</div></div>`;
      }).join('')}
      ${(state.data.encyclopediaSubCategories||[]).filter(sub => (state.data.encyclopediaItems||[]).filter(i=>i.subCategoryId===sub.id).length > 0).map(sub => {
        const itemCount = (state.data.encyclopediaItems||[]).filter(i=>i.subCategoryId===sub.id).length;
        return `<div class="attr-item"><div class="attr-name">${sub.icon||'📄'} ${esc(sub.name)}</div><div class="attr-value">${itemCount}</div></div>`;
      }).join('')}
      <div class="attr-item"><div class="attr-name">📦 资源</div><div class="attr-value">${(state.data.resources||[]).length}</div></div>
      <div class="attr-item"><div class="attr-name">🗺️ 领地</div><div class="attr-value">${(state.data.worldMap?.territories||[]).length}</div></div>
      <div class="attr-item"><div class="attr-name">📍 地图标注</div><div class="attr-value">${(state.data.worldMap?.locationMarkers||[]).length}</div></div>
      <div class="attr-item"><div class="attr-name">🧬 种族</div><div class="attr-value">${(state.data.races||[]).length}</div></div>
      <div class="attr-item"><div class="attr-name">⚡ 事件</div><div class="attr-value">${(state.data.timeline||[]).length}</div></div>
    </div></div>`;
}

async function aiGenSynopsis() { const el = $('#ai-overview-result'); const text = await runAI(window.api.aiGenerateSynopsis(state.data), el); if (text) { state.data.project.synopsis = text; $('#ov-synopsis').value = text; autoSave(); } }

async function aiGenAllWorldview() {
  const el = $('#ai-overview-result');
  const text = await runAI(window.api.aiGenerateWorldview(state.data), el);
  if (text) {
    const originMatch = text.match(/【世界起源】([\s\S]*?)(?=【自然法则】|$)/);
    const natureMatch = text.match(/【自然法则】([\s\S]*?)(?=【文化社会】|$)/);
    const cultureMatch = text.match(/【文化社会】([\s\S]*?)$/);
    if (originMatch) { state.data.worldview.origin = originMatch[1].trim().slice(0,100); state.data.worldview.originDetail = originMatch[1].trim(); }
    if (natureMatch) { state.data.worldview.nature = natureMatch[1].trim().slice(0,100); state.data.worldview.natureDetail = natureMatch[1].trim(); }
    if (cultureMatch) { state.data.worldview.culture = cultureMatch[1].trim().slice(0,100); state.data.worldview.cultureDetail = cultureMatch[1].trim(); }
    autoSave();
  }
  if (state.data.characters && state.data.characters.length > 0) {
    const relText = await runAI(window.api.aiGenerateRelations(state.data), el);
    if (relText) { const relJson = tryParseJSON(relText); if (relJson && Array.isArray(relJson)) { state.data.characterRelations = relJson; autoSave(); } }
  }
  const conText = await runAI(window.api.aiGenerateConstitution(state.data), el);
  if (conText) { const conJson = tryParseJSON(conText); if (conJson && Array.isArray(conJson)) { state.data.constitution = conJson; autoSave(); } }
  const outText = await runAI(window.api.aiGenerateOutline(state.data), el);
  if (outText) { const outJson = tryParseJSON(outText); if (outJson && Array.isArray(outJson)) { state.data.outline = outJson; autoSave(); } }
  renderTabContent();
}

function updateProjectField(key, value) { state.data.project[key] = value; if (key==='name') $('#editor-title').textContent = value; autoSave(); }

// --- WORLDVIEW ---
function renderWorldview() {
  const w = state.data.worldview || {};
  return `<div class="card"><h3>世界观设定</h3>
    <div class="worldview-section"><h4>世界起源</h4>
      <div class="form-group"><label>简述</label><input id="wv-origin" value="${esc(w.origin||'')}" onchange="updateWorldview('origin',this.value)"></div>
      <div class="form-group"><label>详细描述</label><textarea id="wv-originDetail" rows="4" onchange="updateWorldview('originDetail',this.value)">${esc(w.originDetail||'')}</textarea></div></div>
    <div class="worldview-section"><h4>自然法则</h4>
      <div class="form-group"><label>简述</label><input id="wv-nature" value="${esc(w.nature||'')}" onchange="updateWorldview('nature',this.value)"></div>
      <div class="form-group"><label>详细描述</label><textarea id="wv-natureDetail" rows="4" onchange="updateWorldview('natureDetail',this.value)">${esc(w.natureDetail||'')}</textarea></div></div>
    <div class="worldview-section"><h4>文化社会</h4>
      <div class="form-group"><label>简述</label><input id="wv-culture" value="${esc(w.culture||'')}" onchange="updateWorldview('culture',this.value)"></div>
      <div class="form-group"><label>详细描述</label><textarea id="wv-cultureDetail" rows="4" onchange="updateWorldview('cultureDetail',this.value)">${esc(w.cultureDetail||'')}</textarea></div></div></div>`;
}

async function aiGenWorldview() {
  const el = $('#ai-worldview-result');
  const text = await runAI(window.api.aiGenerateWorldview(state.data), el);
  if (text) {
    const originMatch = text.match(/【世界起源】([\s\S]*?)(?=【自然法则】|$)/);
    const natureMatch = text.match(/【自然法则】([\s\S]*?)(?=【文化社会】|$)/);
    const cultureMatch = text.match(/【文化社会】([\s\S]*?)$/);
    if (originMatch) { state.data.worldview.origin = originMatch[1].trim().slice(0,100); state.data.worldview.originDetail = originMatch[1].trim(); }
    if (natureMatch) { state.data.worldview.nature = natureMatch[1].trim().slice(0,100); state.data.worldview.natureDetail = natureMatch[1].trim(); }
    if (cultureMatch) { state.data.worldview.culture = cultureMatch[1].trim().slice(0,100); state.data.worldview.cultureDetail = cultureMatch[1].trim(); }
    autoSave(); renderTabContent();
  }
}

function updateWorldview(key, value) { if (!state.data.worldview) state.data.worldview = {}; state.data.worldview[key] = value; autoSave(); }