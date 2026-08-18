// ============================================================
// 世界生成器 — 概览 & 世界观
// 依赖: core/state.js, core/utils.js, core/animation.js, core/ai.js
// ============================================================

const PRESET_GENRES = ['奇幻','科幻','蒸汽朋克','赛博朋克','末日废土','历史','现代','神话','仙侠','武侠','恐怖','悬疑','童话','乌托邦','反乌托邦','太空歌剧','暗黑奇幻','都市奇幻','低魔奇幻','高魔奇幻'];
const PRESET_TAGS = ['魔法体系','多物种','架空大陆','星际旅行','时间旅行','平行世界','政治阴谋','战争冲突','宗教信仰','古老文明','神秘遗迹','禁忌知识','命运预言','家族传承','生存挣扎','身份认同','复仇','探索发现','禁忌之恋','成长蜕变','种族冲突','阶级分化','生态危机','技术伦理','意识觉醒','神明干预','灵魂轮回','契约束缚','异变感染','远古威胁'];

function _ovTagHtml(tag, selected, onclick) {
  const cls = selected ? 'ov-tag selected' : 'ov-tag';
  return `<span class="${cls}" ${onclick}>${esc(tag)}</span>`;
}

function _ovGenreHtml(genre, selected, onclick) {
  const cls = selected ? 'ov-genre selected' : 'ov-genre';
  return `<span class="${cls}" ${onclick}>${esc(genre)}</span>`;
}

// --- OVERVIEW ---
function renderOverview() {
  const p = state.data.project;
  const isEditing = state._ovEditing || false;
  const genres = p.genre ? (Array.isArray(p.genre) ? p.genre : p.genre.split(',').map(g=>g.trim()).filter(Boolean)) : [];
  const tags = p.tags || [];

  if (!isEditing) {
    const genreDisplay = genres.length > 0 ? genres.map(g => `<span class="wiki-tag skill">${esc(g)}</span>`).join(' ') : '<span class="text-muted">未设置</span>';
    const tagDisplay = tags.length > 0 ? tags.map(t => `<span class="wiki-tag item">${esc(t)}</span>`).join(' ') : '<span class="text-muted">未设置</span>';
    return `<div class="card"><div class="flex-between mb-8"><h3>项目信息</h3><button class="btn btn-sm btn-outline" onclick="toggleOvEdit()">✏️ 编辑</button></div>
      <div class="wiki-field"><span class="wiki-label">世界名称</span><span class="wiki-value">${esc(p.name)}</span></div>
      <div class="wiki-field"><span class="wiki-label">类型/风格</span><div class="wiki-tags" style="margin-top:4px">${genreDisplay}</div></div>
      <div class="wiki-field"><span class="wiki-label">标签</span><div class="wiki-tags" style="margin-top:4px">${tagDisplay}</div></div>
      <div class="wiki-field"><span class="wiki-label">世界观简介</span><p style="font-size:14px;line-height:1.6;margin-top:4px;white-space:pre-wrap">${esc(p.synopsis||'未设置')}</p></div></div>
    ${_renderOvStats()}`;
  }

  const genreOptions = PRESET_GENRES.map(g => _ovGenreHtml(g, genres.includes(g), `onclick="toggleOvGenre('${esc(g)}')"`)).join('');
  const tagOptions = PRESET_TAGS.map(t => _ovTagHtml(t, tags.includes(t), `onclick="toggleOvTag('${esc(t)}')"`)).join('');
  const customGenreInput = `<div class="ov-custom-row"><input id="ov-custom-genre" placeholder="自定义类型..." style="flex:1;padding:6px 10px;border:1px solid var(--border);border-radius:var(--radius-sm);font-size:13px;font-family:var(--font-body)"><button class="btn btn-xs btn-outline" onclick="addOvCustomGenre()">添加</button></div>`;
  const customTagInput = `<div class="ov-custom-row"><input id="ov-custom-tag" placeholder="自定义标签..." style="flex:1;padding:6px 10px;border:1px solid var(--border);border-radius:var(--radius-sm);font-size:13px;font-family:var(--font-body)"><button class="btn btn-xs btn-outline" onclick="addOvCustomTag()">添加</button></div>`;

  return `<div class="card"><div class="flex-between mb-8"><h3>项目信息</h3><button class="btn btn-sm btn-primary" onclick="toggleOvEdit()">✓ 完成</button></div>
    <div class="form-group"><label>世界名称</label><input id="ov-name" value="${esc(p.name)}" onchange="updateProjectField('name',this.value)"></div>
    <div class="form-group"><label>类型/风格</label>
      <div class="ov-preset-list">${genreOptions}</div>
      ${customGenreInput}
    </div>
    <div class="form-group"><label>标签</label>
      <div class="ov-preset-list">${tagOptions}</div>
      ${customTagInput}
    </div>
    <div class="form-group"><label>世界观简介</label><textarea id="ov-synopsis" rows="4" onchange="updateProjectField('synopsis',this.value)">${esc(p.synopsis||'')}</textarea></div></div>
    ${_renderOvStats()}`;
}

function _renderOvStats() {
  return `<div class="card"><h3>数据统计</h3><div class="grid-3">
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
      <div class="attr-item"><div class="attr-name">📍 地图标注</div><div class="attr-value">${(state.data.worldMap?.locationMarkers||[]).length}</div></div>
      <div class="attr-item"><div class="attr-name">🧬 种族</div><div class="attr-value">${(state.data.races||[]).length}</div></div>
      <div class="attr-item"><div class="attr-name">⚡ 事件</div><div class="attr-value">${(state.data.timeline||[]).length}</div></div>
    </div></div>`;
}

function toggleOvEdit() {
  state._ovEditing = !state._ovEditing;
  renderTabContent();
}

function toggleOvGenre(genre) {
  const p = state.data.project;
  let genres = p.genre ? (Array.isArray(p.genre) ? p.genre : p.genre.split(',').map(g=>g.trim()).filter(Boolean)) : [];
  if (genres.includes(genre)) genres = genres.filter(g => g !== genre);
  else genres.push(genre);
  p.genre = genres;
  autoSave();
  renderTabContent();
}

function toggleOvTag(tag) {
  const p = state.data.project;
  if (!p.tags) p.tags = [];
  if (p.tags.includes(tag)) p.tags = p.tags.filter(t => t !== tag);
  else p.tags.push(tag);
  autoSave();
  renderTabContent();
}

function addOvCustomGenre() {
  const input = $('#ov-custom-genre');
  if (!input || !input.value.trim()) return;
  const val = input.value.trim();
  const p = state.data.project;
  let genres = p.genre ? (Array.isArray(p.genre) ? p.genre : p.genre.split(',').map(g=>g.trim()).filter(Boolean)) : [];
  if (!genres.includes(val)) { genres.push(val); p.genre = genres; autoSave(); }
  input.value = '';
  renderTabContent();
}

function addOvCustomTag() {
  const input = $('#ov-custom-tag');
  if (!input || !input.value.trim()) return;
  const val = input.value.trim();
  const p = state.data.project;
  if (!p.tags) p.tags = [];
  if (!p.tags.includes(val)) { p.tags.push(val); autoSave(); }
  input.value = '';
  renderTabContent();
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