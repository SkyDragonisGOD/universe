// ============================================================
// 世界生成器 — 世界百科
// 依赖: core/state.js, core/utils.js, core/modal.js, core/glossary.js, core/properties.js
// ============================================================

let editEncyclopediaItemId = null;
let _encyclopediaIsNew = false;

const DEFAULT_ENCYCLOPEDIA_TREE = [
  { id: 'enc_era', label: '时代背景', icon: '🕰️', children: [
    { id: 'enc_era_period', label: '历史时期', icon: '📜' },
    { id: 'enc_era_divergence', label: '架空起点', icon: '🦋' },
    { id: 'enc_era_calendar', label: '历法时间', icon: '📅' },
  ]},
  { id: 'enc_events', label: '重大事件', icon: '⚡', children: [] },
  { id: 'enc_geography', label: '地理疆域', icon: '🗺️', children: [
    { id: 'enc_geo_admin', label: '行政区划', icon: '📐' },
    { id: 'enc_geo_terrain', label: '地形地貌', icon: '⛰️' },
    { id: 'enc_geo_cities', label: '城市重镇', icon: '🏰' },
    { id: 'enc_geo_water', label: '水系', icon: '🌊' },
    { id: 'enc_geo_roads', label: '道路交通', icon: '🛤️' },
  ]},
  { id: 'enc_climate', label: '气候环境', icon: '🌦️', children: [
    { id: 'enc_cli_weather', label: '气候特征', icon: '☀️' },
    { id: 'enc_cli_disaster', label: '自然灾害', icon: '🌪️' },
    { id: 'enc_cli_ecology', label: '生态物种', icon: '🌿' },
  ]},
  { id: 'enc_politics', label: '政治制度', icon: '🏛️', children: [
    { id: 'enc_pol_system', label: '政体形态', icon: '👑' },
    { id: 'enc_pol_central', label: '中央官制', icon: '📋' },
    { id: 'enc_pol_local', label: '地方官制', icon: '🏠' },
    { id: 'enc_pol_selection', label: '选官制度', icon: '🎓' },
    { id: 'enc_pol_nobility', label: '爵位封号', icon: '🎖️' },
    { id: 'enc_pol_law', label: '法律刑罚', icon: '⚖️' },
    { id: 'enc_pol_diplomacy', label: '外交', icon: '🤝' },
  ]},
  { id: 'enc_military', label: '军事', icon: '⚔️', children: [
    { id: 'enc_mil_org', label: '军制编制', icon: '🪖' },
    { id: 'enc_mil_weapons', label: '武器装备', icon: '🗡️' },
    { id: 'enc_mil_tactics', label: '战术战法', icon: '🗺️' },
    { id: 'enc_mil_fort', label: '防御工事', icon: '🏰' },
  ]},
  { id: 'enc_economy', label: '经济', icon: '💰', children: [
    { id: 'enc_eco_tax', label: '赋税制度', icon: '📊' },
    { id: 'enc_eco_currency', label: '货币金融', icon: '🪙' },
    { id: 'enc_eco_trade', label: '商业贸易', icon: '🏪' },
    { id: 'enc_eco_agri', label: '农业', icon: '🌾' },
    { id: 'enc_eco_crafts', label: '手工业', icon: '🔨' },
    { id: 'enc_eco_resources', label: '资源物产', icon: '💎' },
  ]},
  { id: 'enc_society', label: '社会结构', icon: '👥', children: [
    { id: 'enc_soc_hierarchy', label: '阶层等级', icon: '📶' },
    { id: 'enc_soc_clan', label: '宗族家族', icon: '🏠' },
    { id: 'enc_soc_gender', label: '性别秩序', icon: '⚤' },
    { id: 'enc_soc_servitude', label: '依附关系', icon: '🔗' },
    { id: 'enc_soc_orgs', label: '民间组织', icon: '🤫' },
  ]},
  { id: 'enc_technology', label: '科技生产力', icon: '⚙️', children: [
    { id: 'enc_tech_eng', label: '工程建筑', icon: '🏗️' },
    { id: 'enc_tech_med', label: '医药', icon: '🏥' },
    { id: 'enc_tech_astro', label: '天文历算', icon: '🔭' },
    { id: 'enc_tech_transport', label: '交通工具', icon: '🚢' },
    { id: 'enc_tech_comm', label: '通信', icon: '📨' },
    { id: 'enc_tech_tools', label: '生产工具', icon: '🔧' },
  ]},
  { id: 'enc_culture', label: '文化思想', icon: '📚', children: [
    { id: 'enc_cul_phil', label: '主流思想', icon: '🧠' },
    { id: 'enc_cul_arts', label: '文学艺术', icon: '🎨' },
    { id: 'enc_cul_edu', label: '教育', icon: '🎓' },
  ]},
  { id: 'enc_religion', label: '宗教信仰', icon: '🙏', children: [
    { id: 'enc_rel_official', label: '官方宗教', icon: '⛪' },
    { id: 'enc_rel_folk', label: '民间信仰', icon: '🏮' },
    { id: 'enc_rel_funeral', label: '丧葬祭祀', icon: '🪦' },
    { id: 'enc_rel_taboo', label: '禁忌避讳', icon: '🚫' },
  ]},
  { id: 'enc_ethnicity', label: '民族族群', icon: '🌏', children: [
    { id: 'enc_eth_main', label: '主体民族', icon: '🏘️' },
    { id: 'enc_eth_neighbors', label: '周边民族', icon: '🏕️' },
    { id: 'enc_eth_interact', label: '民族互动', icon: '🔄' },
    { id: 'enc_eth_foreign', label: '外国势力', icon: '🌐' },
  ]},
  { id: 'enc_language', label: '语言称谓', icon: '💬', children: [
    { id: 'enc_lang_spoken', label: '口语风格', icon: '🗣️' },
    { id: 'enc_lang_titles', label: '称谓体系', icon: '📛' },
    { id: 'enc_lang_written', label: '书面语', icon: '✒️' },
    { id: 'enc_lang_taboo', label: '忌讳用语', icon: '🤐' },
  ]},
];

function initEncyclopediaData() {
  let needSave = false;
  if (!state.data.encyclopediaCategories) { state.data.encyclopediaCategories = []; needSave = true; }
  if (!state.data.encyclopediaSubCategories) { state.data.encyclopediaSubCategories = []; needSave = true; }
  if (!state.data.encyclopediaItems) { state.data.encyclopediaItems = []; needSave = true; }
  ensurePropertyDefs();
  if (!state.data.propertyDefs.categoryBindings) { state.data.propertyDefs.categoryBindings = {}; needSave = true; }
  if (state.data.encyclopediaCategories.length === 0 && state.data.encyclopediaSubCategories.length === 0) {
    for (const l1 of DEFAULT_ENCYCLOPEDIA_TREE) {
      state.data.encyclopediaCategories.push({ id: l1.id, name: l1.label, icon: l1.icon, description: '' });
      if (l1.children) {
        for (const l2 of l1.children) {
          state.data.encyclopediaSubCategories.push({ id: l2.id, name: l2.label, icon: l2.icon, description: '', parentId: l1.id });
        }
      }
    }
    needSave = true;
  }
  if (needSave) autoSave();
}

function getEncyclopediaBinding(catType) {
  initEncyclopediaData();
  return state.data.propertyDefs.categoryBindings[catType] || null;
}

function getBoundCatType(subId) {
  initEncyclopediaData();
  const bindings = state.data.propertyDefs.categoryBindings || {};
  for (const [catType, sid] of Object.entries(bindings)) {
    if (sid === subId) return catType;
  }
  return null;
}

function renderEncyclopedia() {
  initEncyclopediaData();
  const cats = state.data.encyclopediaCategories;
  const selectedCatId = state.selectedEncyclopediaCatId;
  const selectedCat = cats.find(c => c.id === selectedCatId);
  const selectedSubId = state.selectedEncyclopediaSubId;
  const selectedSub = (state.data.encyclopediaSubCategories || []).find(s => s.id === selectedSubId);

  return `<div class="encyclopedia-layout">
    <div class="encyclopedia-cat-panel">
      <div class="flex-between mb-8">
        <h3>📚 世界百科</h3>
        <div style="display:flex;gap:4px">
          <button class="btn btn-xs btn-outline" onclick="openAddTemplateCategoryModal()">📋 模板</button>
          <button class="btn btn-sm btn-primary" onclick="addEncyclopediaCategory()">+ 新建</button>
        </div>
      </div>
      ${renderSearchBox('encyclopediaSearch')}
      <div id="encyclopedia-cat-list">${renderEncyclopediaCategoryList()}</div>
    </div>
    <div class="encyclopedia-sub-panel">
      ${selectedCat ? renderEncyclopediaSubPanel(selectedCat) : '<div class="empty-state"><div class="icon">👈</div><p>选择左侧大类</p></div>'}
    </div>
    <div class="encyclopedia-item-panel">
      ${selectedSub ? renderEncyclopediaItemPanel(selectedSub) : '<div class="empty-state"><div class="icon">👈</div><p>选择子类查看物品</p></div>'}
    </div>
  </div>`;
}

function renderEncyclopediaCategoryList() {
  const cats = state.data.encyclopediaCategories || [];
  const q = (state.encyclopediaSearch || '').toLowerCase().trim();
  const matchCat = (cat) => {
    if (!q) return true;
    if ((cat.name || '').toLowerCase().includes(q)) return true;
    const subs = (state.data.encyclopediaSubCategories || []).filter(s => s.parentId === cat.id);
    if (subs.some(s => (s.name || '').toLowerCase().includes(q))) return true;
    const subIds = subs.map(s => s.id);
    if ((state.data.encyclopediaItems || []).some(i => subIds.includes(i.subCategoryId) && (i.name || '').toLowerCase().includes(q))) return true;
    return false;
  };
  if (cats.length === 0) return '<div class="empty-state"><div class="icon">📚</div><p>暂无大类</p></div>';
  return cats.filter(matchCat).map(cat => {
    const subCount = (state.data.encyclopediaSubCategories || []).filter(s => s.parentId === cat.id).length;
    const active = state.selectedEncyclopediaCatId === cat.id;
    return `<div class="encyclopedia-cat-item${active ? ' selected' : ''}" data-cat-id="${cat.id}">
      <span class="drag-handle" style="cursor:grab;font-size:10px;color:var(--muted);user-select:none">⠿</span>
      <span style="font-size:16px">${cat.icon || '📁'}</span>
      <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(cat.name)}</span>
      <span class="text-xs text-muted">${subCount}</span>
      <button class="btn btn-xs btn-danger" style="padding:0 4px;font-size:10px" onclick="event.stopPropagation();deleteEncyclopediaCategory('${esc(cat.id)}')">×</button>
    </div>`;
  }).join('');
}

function renderEncyclopediaSubPanel(cat) {
  const subs = (state.data.encyclopediaSubCategories || []).filter(s => s.parentId === cat.id);
  return `<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px;margin-bottom:8px">
    <div style="display:flex;align-items:center;gap:6px">
      <h3 style="margin:0">${cat.icon || '📁'} ${esc(cat.name)}</h3>
      <button class="btn btn-xs btn-outline" onclick="openEncyclopediaCatIconPicker('${esc(cat.id)}')">😀</button>
      <button class="btn btn-xs btn-outline" onclick="renameEncyclopediaCategory()">✏️</button>
    </div>
    <div style="display:flex;align-items:center;gap:4px">
      <button class="btn btn-xs btn-outline" onclick="openBindFromEncyclopedia()">🔗 绑定</button>
      <button class="btn btn-xs btn-primary" onclick="addEncyclopediaSubCategory()">+ 新建子类</button>
    </div>
  </div>
  ${cat.description ? `<p class="text-sm text-muted mb-8">${esc(cat.description)}</p>` : ''}
  ${renderSearchBox('encyclopediaSubSearch')}
  <div id="encyclopedia-sub-list">${renderEncyclopediaSubList(subs)}</div>`;
}

function renderEncyclopediaSubList(subs) {
  const q = (state.encyclopediaSubSearch || '').toLowerCase().trim();
  const filtered = q ? subs.filter(s => (s.name||'').toLowerCase().includes(q)) : subs;
  if (filtered.length === 0) return '<div class="empty-state" style="padding:24px"><div class="icon">📂</div><p>暂无子类</p></div>';
  return filtered.map(sub => {
    const itemCount = (state.data.encyclopediaItems || []).filter(i => i.subCategoryId === sub.id).length;
    const active = state.selectedEncyclopediaSubId === sub.id;
    const boundType = getBoundCatType(sub.id);
    const boundBadge = boundType ? `<span class="wiki-tag skill" style="font-size:10px;padding:1px 6px">🔗 ${CAT_TYPE_LABELS[boundType] || boundType}</span>` : '';
    return `<div class="encyclopedia-sub-item${active ? ' selected' : ''}" data-sub-id="${sub.id}">
      <span class="drag-handle" style="cursor:grab;font-size:10px;color:var(--muted);user-select:none">⠿</span>
      <span style="font-size:14px">${sub.icon || '📂'}</span>
      <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(sub.name)}</span>
      ${boundBadge}
      <span class="text-xs text-muted">${itemCount}项</span>
      <button class="btn btn-xs btn-danger" style="padding:0 4px;font-size:10px" onclick="event.stopPropagation();deleteEncyclopediaSubCategory('${esc(sub.id)}')">×</button>
    </div>`;
  }).join('');
}

function renderEncyclopediaItemPanel(sub) {
  const items = (state.data.encyclopediaItems || []).filter(i => i.subCategoryId === sub.id);
  const boundCatType = getBoundCatType(sub.id);
  ensurePropertyDefs();
  const customProps = getCustomPropsForScope('encyclopedia_' + sub.id);

  return `<div class="card detail-scroll-area" style="height:100%;overflow-y:auto">
    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px;margin-bottom:12px">
      <div style="display:flex;align-items:center;gap:8px">
        <h3 style="margin:0">${sub.icon || '📂'} ${esc(sub.name)}</h3>
        <button class="btn btn-xs btn-outline" onclick="openEncyclopediaSubIconPicker('${esc(sub.id)}')">😀</button>
        <button class="btn btn-xs btn-outline" onclick="renameEncyclopediaSubCategory()">✏️</button>
      </div>
      <div style="display:flex;align-items:center;gap:4px;flex-wrap:wrap">
        ${boundCatType ? `<button class="btn btn-xs btn-outline" onclick="switchTab('properties')">⚙️</button>` : `<button class="btn btn-xs btn-outline" onclick="openBindFromEncyclopedia()">🔗 绑定</button>`}
        <button class="btn btn-xs btn-primary" ${editEncyclopediaItemId ? 'disabled style="opacity:0.5;cursor:not-allowed"' : ''} onclick="${editEncyclopediaItemId ? '' : 'addEncyclopediaItem()'}">+ 物品</button>
      </div>
    </div>
    ${boundCatType ? `<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;padding:6px 10px;background:var(--bg-alt);border-radius:var(--radius-xs);font-size:12px"><span>🔗 已绑定: ${CAT_TYPE_LABELS[boundCatType] || boundCatType}</span><button class="btn btn-xs btn-outline" onclick="unbindEncyclopediaCategory('${esc(boundCatType)}')">解开绑定</button></div>` : ''}
    ${sub.description ? `<p class="text-sm text-muted mb-8">${esc(sub.description)}</p>` : ''}
    ${renderSearchBox('encyclopediaItemSearch')}
    ${editEncyclopediaItemId ? renderEncyclopediaItemEditForm(items.find(i => i.id === editEncyclopediaItemId), sub, customProps) : ''}
    <div id="encyclopedia-items-list">${renderEncyclopediaItemList(items)}</div>
  </div>`;
}

function renderEncyclopediaItemList(items) {
  const q = (state.encyclopediaItemSearch || '').toLowerCase().trim();
  const filtered = q ? items.filter(i => (i.name||'').toLowerCase().includes(q)) : items;
  if (filtered.length === 0) return '<div class="empty-state" style="padding:24px"><div class="icon">📦</div><p>暂无物品</p></div>';
  const sub = (state.data.encyclopediaSubCategories || []).find(s => s.id === state.selectedEncyclopediaSubId);
  return filtered.map(item => editEncyclopediaItemId === item.id ? '' : renderEncyclopediaItemCard(item, sub)).join('');
}

function renderEncyclopediaItemCard(item, sub) {
  const boundCatType = getBoundCatType(sub.id);
  const catDesc = boundCatType ? getCategoryDesc(boundCatType, item.name) : '';
  const displayDesc = item.description || catDesc;
  return `<div class="bp-item-row" data-item-id="${item.id}" style="display:flex;align-items:center;gap:8px;padding:8px 10px;border:1px solid var(--border);border-radius:var(--radius-xs);margin-bottom:4px;background:var(--white);cursor:pointer" onclick="if(event.target.closest('.drag-handle'))return;showEncyclopediaItemDetail('${item.id}')">
    <span class="drag-handle" style="cursor:grab;font-size:10px;color:var(--muted);user-select:none">⠿</span>
    <span style="font-size:16px">${item.icon || '📦'}</span>
    <strong style="flex:1;font-size:13px">${esc(item.name)}</strong>
    ${displayDesc ? `<span class="text-xs text-muted" style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(displayDesc.substring(0, 40))}</span>` : ''}
    <button class="btn btn-xs btn-outline" onclick="event.stopPropagation();editEncyclopediaItem('${item.id}')">✏️</button>
    <button class="btn btn-xs btn-danger" onclick="event.stopPropagation();deleteEncyclopediaItem('${item.id}')">×</button>
  </div>`;
}

function showEncyclopediaItemDetail(itemId) {
  const item = (state.data.encyclopediaItems || []).find(i => i.id === itemId);
  if (!item) return;
  const sub = (state.data.encyclopediaSubCategories || []).find(s => s.id === item.subCategoryId);
  const cat = sub ? (state.data.encyclopediaCategories || []).find(c => c.id === sub.parentId) : null;
  const boundCatType = sub ? getBoundCatType(sub.id) : null;
  ensurePropertyDefs();
  const customProps = getCustomPropsForScope('encyclopedia_' + (sub ? sub.id : ''));
  const cpData = item.customProps || {};
  const customPropHtml = renderCustomPropWikiHtml(customProps, cpData);
  const modal = $('#modal-box');
  const overlay = $('#modal-overlay');
  modal.innerHTML = `
    <h3>${item.icon || '📦'} ${esc(item.name)}</h3>
    <div style="display:flex;flex-direction:column;gap:8px">
      ${cat ? `<div><span class="text-xs text-muted">所属大类</span><div style="font-size:13px">${cat.icon || '📁'} ${esc(cat.name)}</div></div>` : ''}
      ${sub ? `<div><span class="text-xs text-muted">所属子类</span><div style="font-size:13px">${sub.icon || '📂'} ${esc(sub.name)}</div></div>` : ''}
      ${boundCatType ? `<div><span class="text-xs text-muted">绑定属性</span><div style="font-size:13px">🔗 ${CAT_TYPE_LABELS[boundCatType] || boundCatType}</div></div>` : ''}
      ${customPropHtml ? `<div>${customPropHtml}</div>` : ''}
      ${item.description ? `<div><span class="text-xs text-muted">描述</span><div style="font-size:13px;white-space:pre-wrap">${esc(item.description)}</div></div>` : ''}
    </div>
    <div class="modal-actions">
      <button class="btn btn-outline" onclick="closeModal()">关闭</button>
      <button class="btn btn-primary" onclick="closeModal();editEncyclopediaItem('${item.id}')">✏️ 编辑</button>
    </div>`;
  overlay.classList.remove('hidden');
  overlay.onclick = (e) => { if (e.target === overlay) closeModal(); };
}

function renderEncyclopediaItemEditForm(item, sub, customProps) {
  if (!item) return '';
  if (!item.customProps) item.customProps = {};
  const boundCatType = getBoundCatType(sub.id);
  return `<div class="card" style="border:2px solid var(--accent);margin:8px 0">
    <div class="flex-between"><h4>✏️ 编辑物品</h4><div class="flex-gap">
      <button class="btn btn-sm btn-primary" onclick="saveEncyclopediaItemEdit()">💾 保存</button>
      <button class="btn btn-sm btn-outline" onclick="cancelEncyclopediaItemEdit()">取消</button>
    </div></div>
    <div class="form-row"><div class="form-group"><label>名称</label><input id="enc-item-name" value="${esc(item.name)}"></div>
    <div class="form-group"><label>图标</label><div style="display:flex;gap:6px;align-items:center"><input id="enc-item-icon" value="${esc(item.icon || '📦')}" style="flex:1"><button class="btn btn-xs btn-outline" onclick="openEncyclopediaEmojiPicker()">😀</button></div></div></div>
    ${customProps.map(prop => {
      const key = 'cp_' + prop.id;
      const val = item.customProps[key] || '';
      return renderCustomPropField(prop, val, `setEncyclopediaItemCustomProp('${prop.id}',this.value)`);
    }).join('')}
    <div class="form-group"><label>描述</label><textarea id="enc-item-desc" rows="3" style="width:100%;padding:8px 12px;background:var(--white);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--black);font-size:14px;font-family:var(--font-body);resize:vertical">${esc(item.description || '')}</textarea></div>
  </div>`;
}

function setEncyclopediaItemCustomProp(propId, value) {
  const item = (state.data.encyclopediaItems || []).find(i => i.id === editEncyclopediaItemId);
  if (!item) return;
  if (!item.customProps) item.customProps = {};
  item.customProps['cp_' + propId] = value;
  autoSave();
}

function openEncyclopediaEmojiPicker() {
  const modal = $('#modal-box');
  const overlay = $('#modal-overlay');
  const customLib = (state.data.emojiLib || []).map(em => em.emoji);
  const customLibHtml = customLib.length > 0 ? `<div class="emoji-cat"><div class="emoji-cat-title">⭐ 自定义 Emoji</div><div class="emoji-grid">${customLib.map(e => `<button class="emoji-btn" onclick="selectEncyclopediaEmoji('${e}')">${e}</button>`).join('')}</div></div>` : '';
  const categories = Object.entries(EMOJI_CATEGORIES).map(([cat, emojis]) => {
    return `<div class="emoji-cat"><div class="emoji-cat-title">${esc(cat)}</div><div class="emoji-grid">${emojis.map(e => `<button class="emoji-btn" onclick="selectEncyclopediaEmoji('${e}')">${e}</button>`).join('')}</div></div>`;
  }).join('');
  modal.innerHTML = `
    <h3>选择图标</h3>
    <div class="form-group"><label>自定义输入</label><input id="enc-emoji-custom-input" placeholder="输入emoji或文字" style="width:100%;padding:8px 12px;font-size:14px"></div>
    <div style="max-height:350px;overflow-y:auto">${customLibHtml}${categories}</div>
    <div class="modal-actions">
      <button class="btn btn-outline" onclick="closeModal()">取消</button>
      <button class="btn btn-primary" id="enc-emoji-ok-btn">确定</button>
    </div>`;
  overlay.classList.remove('hidden');
  $('#enc-emoji-ok-btn').onclick = () => { selectEncyclopediaEmoji(($('#enc-emoji-custom-input') || {}).value || '📦'); };
  overlay.onclick = (e) => { if (e.target === overlay) closeModal(); };
}

function selectEncyclopediaEmoji(emoji) {
  const input = $('#enc-item-icon');
  if (input) input.value = emoji;
  closeModal();
}

function openEncyclopediaCatIconPicker(catId) {
  const cat = (state.data.encyclopediaCategories || []).find(c => c.id === catId);
  if (!cat) return;
  const modal = $('#modal-box');
  const overlay = $('#modal-overlay');
  const customLib = (state.data.emojiLib || []).map(em => em.emoji);
  const customLibHtml = customLib.length > 0 ? `<div class="emoji-cat"><div class="emoji-cat-title">⭐ 自定义 Emoji</div><div class="emoji-grid">${customLib.map(e => `<button class="emoji-btn" onclick="selectEncyclopediaCatIcon('${esc(catId)}','${e}')">${e}</button>`).join('')}</div></div>` : '';
  const categories = Object.entries(EMOJI_CATEGORIES).map(([c, emojis]) => {
    return `<div class="emoji-cat"><div class="emoji-cat-title">${esc(c)}</div><div class="emoji-grid">${emojis.map(e => `<button class="emoji-btn" onclick="selectEncyclopediaCatIcon('${esc(catId)}','${e}')">${e}</button>`).join('')}</div></div>`;
  }).join('');
  modal.innerHTML = `
    <h3>选择大类图标</h3>
    <div class="form-group"><label>自定义输入</label><input id="enc-cat-icon-custom" placeholder="输入emoji或文字" value="${esc(cat.icon || '📁')}" style="width:100%;padding:8px 12px;font-size:14px"></div>
    <div style="max-height:350px;overflow-y:auto">${customLibHtml}${categories}</div>
    <div class="modal-actions">
      <button class="btn btn-outline" onclick="closeModal()">取消</button>
      <button class="btn btn-primary" id="enc-cat-icon-ok">确定</button>
    </div>`;
  overlay.classList.remove('hidden');
  $('#enc-cat-icon-ok').onclick = () => { selectEncyclopediaCatIcon(catId, ($('#enc-cat-icon-custom') || {}).value || '📁'); };
  overlay.onclick = (e) => { if (e.target === overlay) closeModal(); };
}

function selectEncyclopediaCatIcon(catId, icon) {
  const cat = (state.data.encyclopediaCategories || []).find(c => c.id === catId);
  if (!cat) return;
  cat.icon = icon;
  autoSave();
  closeModal();
  renderTabContent();
}

function openEncyclopediaSubIconPicker(subId) {
  const sub = (state.data.encyclopediaSubCategories || []).find(s => s.id === subId);
  if (!sub) return;
  const modal = $('#modal-box');
  const overlay = $('#modal-overlay');
  const customLib = (state.data.emojiLib || []).map(em => em.emoji);
  const customLibHtml = customLib.length > 0 ? `<div class="emoji-cat"><div class="emoji-cat-title">⭐ 自定义 Emoji</div><div class="emoji-grid">${customLib.map(e => `<button class="emoji-btn" onclick="selectEncyclopediaSubIcon('${esc(subId)}','${e}')">${e}</button>`).join('')}</div></div>` : '';
  const categories = Object.entries(EMOJI_CATEGORIES).map(([c, emojis]) => {
    return `<div class="emoji-cat"><div class="emoji-cat-title">${esc(c)}</div><div class="emoji-grid">${emojis.map(e => `<button class="emoji-btn" onclick="selectEncyclopediaSubIcon('${esc(subId)}','${e}')">${e}</button>`).join('')}</div></div>`;
  }).join('');
  modal.innerHTML = `
    <h3>选择子类图标</h3>
    <div class="form-group"><label>自定义输入</label><input id="enc-sub-icon-custom" placeholder="输入emoji或文字" value="${esc(sub.icon || '📂')}" style="width:100%;padding:8px 12px;font-size:14px"></div>
    <div style="max-height:350px;overflow-y:auto">${customLibHtml}${categories}</div>
    <div class="modal-actions">
      <button class="btn btn-outline" onclick="closeModal()">取消</button>
      <button class="btn btn-primary" id="enc-sub-icon-ok">确定</button>
    </div>`;
  overlay.classList.remove('hidden');
  $('#enc-sub-icon-ok').onclick = () => { selectEncyclopediaSubIcon(subId, ($('#enc-sub-icon-custom') || {}).value || '📂'); };
  overlay.onclick = (e) => { if (e.target === overlay) closeModal(); };
}

function selectEncyclopediaSubIcon(subId, icon) {
  const sub = (state.data.encyclopediaSubCategories || []).find(s => s.id === subId);
  if (!sub) return;
  sub.icon = icon;
  autoSave();
  closeModal();
  renderTabContent();
}

function saveEncyclopediaItemEdit() {
  const item = (state.data.encyclopediaItems || []).find(i => i.id === editEncyclopediaItemId);
  if (!item) return;
  const newName = ($('#enc-item-name') || {}).value || item.name;
  if (checkDuplicate(state.data.encyclopediaItems, newName, item.id)) {
    showToast('已存在同名物品！');
    return;
  }
  const oldName = item.name;
  item.name = newName;
  item.icon = ($('#enc-item-icon') || {}).value || item.icon;
  item.description = ($('#enc-item-desc') || {}).value || '';
  const sub = (state.data.encyclopediaSubCategories || []).find(s => s.id === item.subCategoryId);
  if (sub) {
    const boundCatType = getBoundCatType(sub.id);
    if (boundCatType && oldName !== newName) {
      const cat = (state.data.categories || []).find(c => c.type === boundCatType && c.name === oldName);
      if (cat && cat.name !== '未知') {
        cat.name = newName;
        renameCategoryRefs(boundCatType, oldName, newName);
      }
    }
    if (boundCatType) {
      const cat = (state.data.categories || []).find(c => c.type === boundCatType && c.name === newName);
      if (cat) {
        cat.description = item.description;
      }
    }
  }
  editEncyclopediaItemId = null;
  _encyclopediaIsNew = false;
  autoSave();
  renderTabContent();
}

function cancelEncyclopediaItemEdit() {
  if (_encyclopediaIsNew && editEncyclopediaItemId) {
    const sub = (state.data.encyclopediaSubCategories || []).find(s => s.id === state.selectedEncyclopediaSubId);
    state.data.encyclopediaItems = (state.data.encyclopediaItems || []).filter(i => i.id !== editEncyclopediaItemId);
    if (sub) {
      const boundCatType = getBoundCatType(sub.id);
      if (boundCatType) {
        const item = { id: editEncyclopediaItemId, name: '' };
        const cat = (state.data.categories || []).find(c => c.type === boundCatType && c.name === item.name);
        if (cat && cat.name !== '未知') {
          state.data.categories = (state.data.categories || []).filter(c => c.id !== cat.id);
          renameCategoryRefs(boundCatType, cat.name, '未知');
        }
      }
    }
    _encyclopediaIsNew = false;
    autoSave();
  }
  editEncyclopediaItemId = null;
  _encyclopediaIsNew = false;
  renderTabContent();
}

function editEncyclopediaItem(id) {
  editEncyclopediaItemId = id;
  _encyclopediaIsNew = false;
  renderTabContent();
}

async function addEncyclopediaCategory() {
  const name = await customPrompt('大类名称', '');
  if (!name || !name.trim()) return;
  if (checkDuplicate(state.data.encyclopediaCategories, name)) {
    showToast('已存在同名大类！');
    return;
  }
  state.data.encyclopediaCategories.push({ id: uid(), name: name.trim(), icon: '📁', description: '' });
  autoSave();
  renderTabContent();
}

async function renameEncyclopediaCategory() {
  const cat = (state.data.encyclopediaCategories || []).find(c => c.id === state.selectedEncyclopediaCatId);
  if (!cat) return;
  const name = await customPrompt('新名称', cat.name);
  if (!name || !name.trim()) return;
  if (checkDuplicate(state.data.encyclopediaCategories, name, cat.id)) {
    showToast('已存在同名大类！');
    return;
  }
  cat.name = name.trim();
  autoSave();
  renderTabContent();
}

async function deleteEncyclopediaCategory(id) {
  if (!await customConfirm('确定删除此大类及其所有子类和物品？')) return;
  const subIds = (state.data.encyclopediaSubCategories || []).filter(s => s.parentId === id).map(s => s.id);
  state.data.encyclopediaItems = (state.data.encyclopediaItems || []).filter(i => !subIds.includes(i.subCategoryId));
  state.data.encyclopediaSubCategories = (state.data.encyclopediaSubCategories || []).filter(s => s.parentId !== id);
  state.data.encyclopediaCategories = (state.data.encyclopediaCategories || []).filter(c => c.id !== id);
  const bindings = state.data.propertyDefs.categoryBindings || {};
  for (const [catType, subId] of Object.entries(bindings)) {
    if (subIds.includes(subId)) delete bindings[catType];
  }
  if (state.selectedEncyclopediaCatId === id) {
    state.selectedEncyclopediaCatId = null;
    state.selectedEncyclopediaSubId = null;
  }
  autoSave();
  renderTabContent();
}

async function addEncyclopediaSubCategory() {
  const catId = state.selectedEncyclopediaCatId;
  if (!catId) return;
  const name = await customPrompt('子类名称', '');
  if (!name || !name.trim()) return;
  const subs = (state.data.encyclopediaSubCategories || []).filter(s => s.parentId === catId);
  if (subs.find(s => s.name === name.trim())) {
    showToast('已存在同名子类！');
    return;
  }
  const newSub = { id: uid(), name: name.trim(), icon: '📂', description: '', parentId: catId };
  state.data.encyclopediaSubCategories.push(newSub);
  state.selectedEncyclopediaSubId = newSub.id;
  autoSave();
  renderTabContent();
}

async function renameEncyclopediaSubCategory() {
  const sub = (state.data.encyclopediaSubCategories || []).find(s => s.id === state.selectedEncyclopediaSubId);
  if (!sub) return;
  const name = await customPrompt('新名称', sub.name);
  if (!name || !name.trim()) return;
  sub.name = name.trim();
  autoSave();
  renderTabContent();
}

async function deleteEncyclopediaSubCategory(id) {
  if (!await customConfirm('确定删除此子类及其所有物品？')) return;
  state.data.encyclopediaItems = (state.data.encyclopediaItems || []).filter(i => i.subCategoryId !== id);
  state.data.encyclopediaSubCategories = (state.data.encyclopediaSubCategories || []).filter(s => s.id !== id);
  const bindings = state.data.propertyDefs.categoryBindings || {};
  for (const [catType, subId] of Object.entries(bindings)) {
    if (subId === id) {
      unbindEncyclopediaCategoryRestore(catType);
      delete bindings[catType];
    }
  }
  if (state.selectedEncyclopediaSubId === id) state.selectedEncyclopediaSubId = null;
  autoSave();
  renderTabContent();
}

function addEncyclopediaItem() {
  const subId = state.selectedEncyclopediaSubId;
  if (!subId) return;
  const sub = (state.data.encyclopediaSubCategories || []).find(s => s.id === subId);
  const boundCatType = getBoundCatType(subId);
  const item = {
    id: uid(),
    name: '新物品',
    icon: '📦',
    description: '',
    subCategoryId: subId,
    customProps: {}
  };
  state.data.encyclopediaItems.push(item);
  if (boundCatType) {
    const newCat = { id: uid(), type: boundCatType, name: item.name, description: '' };
    state.data.categories.push(newCat);
  }
  editEncyclopediaItemId = item.id;
  _encyclopediaIsNew = true;
  autoSave();
  renderTabContent();
}

async function deleteEncyclopediaItem(id) {
  const item = (state.data.encyclopediaItems || []).find(i => i.id === id);
  if (!item) return;
  if (!await customConfirm(`确定删除物品"${item.name}"？`)) return;
  const sub = (state.data.encyclopediaSubCategories || []).find(s => s.id === item.subCategoryId);
  if (sub) {
    const boundCatType = getBoundCatType(sub.id);
    if (boundCatType) {
      const cat = (state.data.categories || []).find(c => c.type === boundCatType && c.name === item.name);
      if (cat && cat.name !== '未知') {
        renameCategoryRefs(boundCatType, cat.name, '未知');
        state.data.categories = (state.data.categories || []).filter(c => c.id !== cat.id);
      }
    }
  }
  state.data.encyclopediaItems = (state.data.encyclopediaItems || []).filter(i => i.id !== id);
  if (editEncyclopediaItemId === id) editEncyclopediaItemId = null;
  autoSave();
  renderTabContent();
}

function bindEncyclopediaCategory(catType, subId) {
  initEncyclopediaData();
  const bindings = state.data.propertyDefs.categoryBindings;
  if (bindings[catType]) {
    showToast('该属性类型已绑定其他子类，请先解绑');
    return;
  }
  const existingCats = (state.data.categories || []).filter(c => c.type === catType && c.name !== '未知');
  const existingItems = (state.data.encyclopediaItems || []).filter(i => i.subCategoryId === subId);
  const existingItemNames = new Set(existingItems.map(i => i.name));
  existingCats.forEach(cat => {
    if (!existingItemNames.has(cat.name)) {
      state.data.encyclopediaItems.push({
        id: uid(),
        name: cat.name,
        icon: '📦',
        description: cat.description || '',
        subCategoryId: subId,
        customProps: {}
      });
    } else {
      const item = existingItems.find(i => i.name === cat.name);
      if (item && !item.description && cat.description) {
        item.description = cat.description;
      }
    }
  });
  bindings[catType] = subId;
  autoSave();
  renderTabContent();
}

function unbindEncyclopediaCategory(catType) {
  initEncyclopediaData();
  unbindEncyclopediaCategoryRestore(catType);
  delete state.data.propertyDefs.categoryBindings[catType];
  autoSave();
  renderTabContent();
}

function unbindEncyclopediaCategoryRestore(catType) {
  const bindings = state.data.propertyDefs.categoryBindings || {};
  const subId = bindings[catType];
  if (!subId) return;
  const items = (state.data.encyclopediaItems || []).filter(i => i.subCategoryId === subId);
  items.forEach(item => {
    const cat = (state.data.categories || []).find(c => c.type === catType && c.name === item.name);
    if (cat && item.description) {
      cat.description = item.description;
    }
  });
}

function navigateToEncyclopediaItem(catType, itemName) {
  initEncyclopediaData();
  const subId = getEncyclopediaBinding(catType);
  if (!subId) return;
  const item = (state.data.encyclopediaItems || []).find(i => i.subCategoryId === subId && i.name === itemName);
  const sub = (state.data.encyclopediaSubCategories || []).find(s => s.id === subId);
  if (sub) {
    const cat = (state.data.encyclopediaCategories || []).find(c => c.id === sub.parentId);
    if (cat) state.selectedEncyclopediaCatId = cat.id;
    state.selectedEncyclopediaSubId = subId;
  }
  state.activeTab = 'encyclopedia';
  render();
  if (item) {
    setTimeout(() => showEncyclopediaItemDetail(item.id), 100);
  }
}

function navigateToEncyclopediaSub(subId) {
  initEncyclopediaData();
  const sub = (state.data.encyclopediaSubCategories || []).find(s => s.id === subId);
  if (sub) {
    const cat = (state.data.encyclopediaCategories || []).find(c => c.id === sub.parentId);
    if (cat) state.selectedEncyclopediaCatId = cat.id;
    state.selectedEncyclopediaSubId = subId;
  }
  state.activeTab = 'encyclopedia';
  render();
}

function getCategoryDesc(catType, name) {
  const cat = (state.data.categories || []).find(c => c.type === catType && c.name === name);
  return cat ? (cat.description || '') : '';
}

function openBindEncyclopediaModal(catType) {
  initEncyclopediaData();
  const subs = state.data.encyclopediaSubCategories || [];
  const cats = state.data.encyclopediaCategories || [];
  const bindings = state.data.propertyDefs.categoryBindings || {};
  const usedSubIds = new Set(Object.values(bindings));
  const availableSubs = subs.filter(s => !usedSubIds.has(s.id));

  const modal = $('#modal-box');
  const overlay = $('#modal-overlay');
  modal.innerHTML = `
    <h3>🔗 绑定百科子类</h3>
    <p class="text-sm text-muted" style="margin-bottom:12px">将"${CAT_TYPE_LABELS[catType] || catType}"绑定到一个百科子类，绑定后该类型的选项将自动同步到百科物品中。</p>
    <div style="margin-bottom:8px"><input id="bind-enc-search" placeholder="搜索子类..." style="width:100%;padding:6px 10px;background:var(--white);border:1px solid var(--border);border-radius:var(--radius-sm);font-size:13px;font-family:var(--font-body)" oninput="filterBindEncList(this.value)"></div>
    <div id="bind-enc-list" style="max-height:300px;overflow-y:auto">
    ${availableSubs.length === 0 ? '<div class="empty-state" style="padding:24px"><div class="icon">📚</div><p>暂无可绑定的子类</p></div>' :
      availableSubs.map(sub => {
        const parentCat = cats.find(c => c.id === sub.parentId);
        const itemCount = (state.data.encyclopediaItems || []).filter(i => i.subCategoryId === sub.id).length;
        const searchText = (parentCat ? parentCat.name + ' ' : '') + sub.name;
        return `<div class="bind-enc-item" data-search="${esc(searchText.toLowerCase())}" style="display:flex;align-items:center;gap:8px;padding:10px 12px;border:1px solid var(--border);border-radius:var(--radius-xs);margin-bottom:4px;cursor:pointer" onclick="confirmBindEncyclopedia('${esc(catType)}','${esc(sub.id)}')">
          <span>${sub.icon || '📂'}</span>
          <span style="flex:1">${parentCat ? esc(parentCat.name) + ' / ' : ''}${esc(sub.name)}</span>
          <span class="text-xs text-muted">${itemCount}项</span>
          <button class="btn btn-xs btn-primary">绑定</button>
        </div>`;
      }).join('')}
    </div>
    <div style="display:flex;align-items:center;gap:8px;margin-top:12px;padding-top:12px;border-top:1px solid var(--border)">
      <input id="bind-enc-new-sub" placeholder="新建子类名称..." style="flex:1;padding:6px 10px;background:var(--white);border:1px solid var(--border);border-radius:var(--radius-sm);font-size:13px;font-family:var(--font-body)">
      <select id="bind-enc-new-cat" style="padding:6px 10px;background:var(--white);border:1px solid var(--border);border-radius:var(--radius-sm);font-size:13px;font-family:var(--font-body)">${cats.map(c => `<option value="${esc(c.id)}"${c.id === state.selectedEncyclopediaCatId ? ' selected' : ''}>${esc(c.name)}</option>`).join('')}</select>
      <button class="btn btn-xs btn-outline" onclick="createAndBindSub('${esc(catType)}')">创建并绑定</button>
    </div>
    <div class="modal-actions">
      <button class="btn btn-outline" onclick="closeModal()">取消</button>
    </div>`;
  overlay.classList.remove('hidden');
  overlay.onclick = (e) => { if (e.target === overlay) closeModal(); };
}

function filterBindEncList(q) {
  const ql = q.toLowerCase();
  document.querySelectorAll('.bind-enc-item').forEach(el => {
    el.style.display = el.dataset.search.includes(ql) ? '' : 'none';
  });
}

async function createAndBindSub(catType) {
  const name = ($('#bind-enc-new-sub') || {}).value;
  const catId = ($('#bind-enc-new-cat') || {}).value;
  if (!name || !name.trim() || !catId) { showToast('请输入子类名称并选择大类'); return; }
  const subs = (state.data.encyclopediaSubCategories || []).filter(s => s.parentId === catId);
  if (subs.find(s => s.name === name.trim())) { showToast('该大类下已存在同名子类！'); return; }
  const newSub = { id: uid(), name: name.trim(), icon: '📂', description: '', parentId: catId };
  state.data.encyclopediaSubCategories.push(newSub);
  closeModal();
  bindEncyclopediaCategory(catType, newSub.id);
}

function openBindFromEncyclopedia() {
  initEncyclopediaData();
  const subId = state.selectedEncyclopediaSubId;
  if (subId) {
    openBindTypePickerForSub(subId);
  } else {
    openBindSubPicker();
  }
}

function openBindSubPicker() {
  initEncyclopediaData();
  const catId = state.selectedEncyclopediaCatId;
  const subs = (state.data.encyclopediaSubCategories || []).filter(s => s.parentId === catId);
  const bindings = state.data.propertyDefs.categoryBindings || {};
  const boundSubIds = new Set(Object.values(bindings));
  const unboundSubs = subs.filter(s => !boundSubIds.has(s.id));
  const modal = $('#modal-box');
  const overlay = $('#modal-overlay');
  if (unboundSubs.length === 0 && subs.length > 0) {
    modal.innerHTML = `
      <h3>🔗 绑定属性类型</h3>
      <div class="empty-state" style="padding:24px"><div class="icon">🔗</div><p>当前大类下所有子类均已绑定</p></div>
      <div class="modal-actions"><button class="btn btn-outline" onclick="closeModal()">关闭</button></div>`;
    overlay.classList.remove('hidden');
    overlay.onclick = (e) => { if (e.target === overlay) closeModal(); };
    return;
  }
  modal.innerHTML = `
    <h3>🔗 绑定属性类型</h3>
    <p class="text-sm text-muted" style="margin-bottom:12px">选择一个子类，然后为其绑定属性类型。</p>
    <div style="margin-bottom:8px"><input id="bind-sub-search" placeholder="搜索子类..." style="width:100%;padding:6px 10px;background:var(--white);border:1px solid var(--border);border-radius:var(--radius-sm);font-size:13px;font-family:var(--font-body)" oninput="filterBindSubList(this.value)"></div>
    <div id="bind-sub-list" style="max-height:250px;overflow-y:auto">
    ${unboundSubs.length === 0 ? '<div class="empty-state" style="padding:16px"><div class="icon">📂</div><p>暂无子类</p></div>' : unboundSubs.map(sub => {
      const itemCount = (state.data.encyclopediaItems || []).filter(i => i.subCategoryId === sub.id).length;
      return `<div class="bind-sub-item" data-search="${esc(sub.name.toLowerCase())}" style="display:flex;align-items:center;gap:8px;padding:10px 12px;border:1px solid var(--border);border-radius:var(--radius-xs);margin-bottom:4px;cursor:pointer" onclick="closeModal();openBindTypePickerForSub('${esc(sub.id)}')">
        <span>${sub.icon || '📂'}</span>
        <span style="flex:1">${esc(sub.name)}</span>
        <span class="text-xs text-muted">${itemCount}项</span>
        <button class="btn btn-xs btn-primary">选择</button>
      </div>`;
    }).join('')}
    </div>
    <div style="display:flex;align-items:center;gap:8px;margin-top:12px;padding-top:12px;border-top:1px solid var(--border)">
      <input id="bind-new-sub-name" placeholder="新建子类名称..." style="flex:1;padding:6px 10px;background:var(--white);border:1px solid var(--border);border-radius:var(--radius-sm);font-size:13px;font-family:var(--font-body)">
      <button class="btn btn-xs btn-outline" onclick="createSubAndBindType()">创建并绑定</button>
    </div>
    <div class="modal-actions"><button class="btn btn-outline" onclick="closeModal()">取消</button></div>`;
  overlay.classList.remove('hidden');
  overlay.onclick = (e) => { if (e.target === overlay) closeModal(); };
}

async function createSubAndBindType() {
  const name = ($('#bind-new-sub-name') || {}).value;
  const catId = state.selectedEncyclopediaCatId;
  if (!name || !name.trim() || !catId) { showToast('请输入子类名称'); return; }
  const subs = (state.data.encyclopediaSubCategories || []).filter(s => s.parentId === catId);
  if (subs.find(s => s.name === name.trim())) { showToast('已存在同名子类！'); return; }
  const newSub = { id: uid(), name: name.trim(), icon: '📂', description: '', parentId: catId };
  state.data.encyclopediaSubCategories.push(newSub);
  autoSave();
  closeModal();
  openBindTypePickerForSub(newSub.id);
}

function filterBindSubList(q) {
  const ql = q.toLowerCase();
  document.querySelectorAll('.bind-sub-item').forEach(el => {
    el.style.display = el.dataset.search.includes(ql) ? '' : 'none';
  });
}

function openBindTypePickerForSub(subId) {
  initEncyclopediaData();
  const bindings = state.data.propertyDefs.categoryBindings || {};
  const boundTypes = Object.keys(CAT_TYPE_LABELS).filter(t => !bindings[t]);
  const modal = $('#modal-box');
  const overlay = $('#modal-overlay');
  const sub = (state.data.encyclopediaSubCategories || []).find(s => s.id === subId);
  if (boundTypes.length === 0) {
    modal.innerHTML = `
      <h3>🔗 绑定属性类型</h3>
      <div class="empty-state" style="padding:24px"><div class="icon">🔗</div><p>所有属性类型已绑定</p></div>
      <div class="modal-actions"><button class="btn btn-outline" onclick="closeModal()">关闭</button></div>`;
    overlay.classList.remove('hidden');
    overlay.onclick = (e) => { if (e.target === overlay) closeModal(); };
    return;
  }
  modal.innerHTML = `
    <h3>🔗 绑定属性类型 ${sub ? `→ ${esc(sub.name)}` : ''}</h3>
    <p class="text-sm text-muted" style="margin-bottom:12px">选择要绑定的属性类型。绑定后该类型的选项将自动同步到百科物品中。</p>
    <div style="margin-bottom:8px"><input id="bind-from-enc-search" placeholder="搜索属性类型..." style="width:100%;padding:6px 10px;background:var(--white);border:1px solid var(--border);border-radius:var(--radius-sm);font-size:13px;font-family:var(--font-body)" oninput="filterBindFromEncList(this.value)"></div>
    <div id="bind-from-enc-list" style="max-height:300px;overflow-y:auto">
    ${boundTypes.map(catType => {
      const label = CAT_TYPE_LABELS[catType] || catType;
      return `<div class="bind-from-enc-item" data-search="${esc(label.toLowerCase())}" style="display:flex;align-items:center;gap:8px;padding:10px 12px;border:1px solid var(--border);border-radius:var(--radius-xs);margin-bottom:4px;cursor:pointer" onclick="confirmBindFromEnc('${esc(catType)}','${esc(subId)}')">
        <span style="flex:1">${label}</span>
        <button class="btn btn-xs btn-primary">绑定</button>
      </div>`;
    }).join('')}
    </div>
    <div class="modal-actions"><button class="btn btn-outline" onclick="closeModal()">取消</button></div>`;
  overlay.classList.remove('hidden');
  overlay.onclick = (e) => { if (e.target === overlay) closeModal(); };
}

function filterBindFromEncList(q) {
  const ql = q.toLowerCase();
  document.querySelectorAll('.bind-from-enc-item').forEach(el => {
    el.style.display = el.dataset.search.includes(ql) ? '' : 'none';
  });
}

function confirmBindFromEnc(catType, subId) {
  closeModal();
  bindEncyclopediaCategory(catType, subId);
}

async function confirmBindEncyclopedia(catType, subId) {
  closeModal();
  bindEncyclopediaCategory(catType, subId);
}

function openAddTemplateCategoryModal() {
  initEncyclopediaData();
  const existingCats = state.data.encyclopediaCategories || [];
  const existingNames = new Set(existingCats.map(c => c.name));
  const modal = $('#modal-box');
  const overlay = $('#modal-overlay');
  const templateList = DEFAULT_ENCYCLOPEDIA_TREE.map(t => {
    const exists = existingNames.has(t.label);
    let missingInfo = '';
    if (exists) {
      const cat = existingCats.find(c => c.name === t.label);
      const existingSubNames = new Set((state.data.encyclopediaSubCategories || []).filter(s => s.parentId === cat.id).map(s => s.name));
      const missingChildren = (t.children || []).filter(ch => !existingSubNames.has(ch.label));
      if (missingChildren.length > 0) {
        missingInfo = `<span class="text-xs" style="margin-left:auto;color:var(--accent)">缺${missingChildren.length}子类: ${missingChildren.map(c => c.label).join(', ')}</span>`;
      } else {
        missingInfo = '<span class="text-xs text-muted" style="margin-left:auto">子类完整</span>';
      }
    }
    return `<label style="display:flex;align-items:center;gap:8px;padding:8px 10px;border:1px solid var(--border);border-radius:var(--radius-xs);margin-bottom:4px;cursor:pointer">
      <input type="checkbox" value="${esc(t.id)}" ${exists ? 'checked' : ''}>
      <span>${t.icon} ${esc(t.label)}</span>
      ${exists ? '<span class="text-xs text-muted">(已存在)</span>' : ''}
      ${missingInfo}
    </label>`;
  }).join('');
  modal.innerHTML = `
    <h3>📋 添加模板类</h3>
    <p class="text-sm text-muted" style="margin-bottom:12px">勾选要添加的默认大类。已存在的大类会补全缺失的子类，已有子类不覆盖。</p>
    <div style="max-height:400px;overflow-y:auto">${templateList}</div>
    <div class="modal-actions">
      <button class="btn btn-outline" onclick="closeModal()">取消</button>
      <button class="btn btn-primary" onclick="applyAddTemplateCategories()">添加</button>
    </div>`;
  overlay.classList.remove('hidden');
  overlay.onclick = (e) => { if (e.target === overlay) closeModal(); };
}

function applyAddTemplateCategories() {
  initEncyclopediaData();
  const checks = document.querySelectorAll('#modal-box input[type=checkbox]:checked');
  const selectedIds = new Set(Array.from(checks).map(c => c.value));
  let addedCats = 0, addedSubs = 0, skippedSubs = 0;
  for (const t of DEFAULT_ENCYCLOPEDIA_TREE) {
    if (!selectedIds.has(t.id)) continue;
    let cat = (state.data.encyclopediaCategories || []).find(c => c.name === t.label);
    if (!cat) {
      cat = { id: t.id, name: t.label, icon: t.icon, description: '' };
      state.data.encyclopediaCategories.push(cat);
      addedCats++;
    }
    if (t.children) {
      const existingSubNames = new Set(
        (state.data.encyclopediaSubCategories || []).filter(s => s.parentId === cat.id).map(s => s.name)
      );
      for (const child of t.children) {
        if (existingSubNames.has(child.label)) {
          skippedSubs++;
        } else {
          state.data.encyclopediaSubCategories.push({
            id: child.id, name: child.label, icon: child.icon, description: '', parentId: cat.id
          });
          addedSubs++;
        }
      }
    }
  }
  autoSave();
  closeModal();
  renderTabContent();
  let msg = `添加了 ${addedCats} 个大类，${addedSubs} 个子类`;
  if (skippedSubs > 0) msg += `，${skippedSubs} 个子类已存在被跳过`;
  showToast(msg);
}

function setupEncyclopedia() {
  registerSearchTarget('encyclopediaSearch', 'encyclopedia-cat-list', renderEncyclopediaCategoryList, bindEncyclopediaListEvents);
  registerSearchTarget('encyclopediaSubSearch', 'encyclopedia-sub-list', () => {
    const cat = (state.data.encyclopediaCategories || []).find(c => c.id === state.selectedEncyclopediaCatId);
    if (!cat) return '';
    const subs = (state.data.encyclopediaSubCategories || []).filter(s => s.parentId === cat.id);
    return renderEncyclopediaSubList(subs);
  }, bindEncyclopediaListEvents);
  registerSearchTarget('encyclopediaItemSearch', 'encyclopedia-items-list', () => {
    const items = (state.data.encyclopediaItems || []).filter(i => i.subCategoryId === state.selectedEncyclopediaSubId);
    return renderEncyclopediaItemList(items);
  });
  bindEncyclopediaListEvents();
  setupDragSort({
    containerId: 'encyclopedia-cat-list',
    itemSelector: '.encyclopedia-cat-item',
    handleSelector: '.drag-handle',
    getArray: () => state.data.encyclopediaCategories,
    setArray: (arr) => { state.data.encyclopediaCategories = arr; }
  });
  setupDragSort({
    containerId: 'encyclopedia-sub-list',
    itemSelector: '.encyclopedia-sub-item',
    handleSelector: '.drag-handle',
    getArray: () => {
      const catId = state.selectedEncyclopediaCatId;
      const allSubs = state.data.encyclopediaSubCategories || [];
      const catSubs = allSubs.filter(s => s.parentId === catId);
      return catSubs;
    },
    setArray: (sortedSubs) => {
      const catId = state.selectedEncyclopediaCatId;
      const allSubs = state.data.encyclopediaSubCategories || [];
      const otherSubs = allSubs.filter(s => s.parentId !== catId);
      state.data.encyclopediaSubCategories = [...otherSubs, ...sortedSubs];
    }
  });
  setupDragSort({
    containerId: 'encyclopedia-items-list',
    itemSelector: '.bp-item-row',
    handleSelector: '.drag-handle',
    getArray: () => {
      const subId = state.selectedEncyclopediaSubId;
      const allItems = state.data.encyclopediaItems || [];
      const subItems = allItems.filter(i => i.subCategoryId === subId);
      return subItems;
    },
    setArray: (sortedItems) => {
      const subId = state.selectedEncyclopediaSubId;
      const allItems = state.data.encyclopediaItems || [];
      const otherItems = allItems.filter(i => i.subCategoryId !== subId);
      state.data.encyclopediaItems = [...otherItems, ...sortedItems];
    }
  });
}

function bindEncyclopediaListEvents() {
  const catList = $('#encyclopedia-cat-list');
  if (catList) {
    catList.querySelectorAll('.encyclopedia-cat-item').forEach(el => {
      el.onclick = (ev) => {
        if (ev.target.closest('.drag-handle') || ev.target.closest('button')) return;
        state.selectedEncyclopediaCatId = el.dataset.catId;
        state.selectedEncyclopediaSubId = null;
        editEncyclopediaItemId = null;
        renderTabContent();
      };
    });
  }
  const subList = $('#encyclopedia-sub-list');
  if (subList) {
    subList.querySelectorAll('.encyclopedia-sub-item').forEach(el => {
      el.onclick = (ev) => {
        if (ev.target.closest('.drag-handle') || ev.target.closest('button')) return;
        state.selectedEncyclopediaSubId = el.dataset.subId;
        editEncyclopediaItemId = null;
        renderTabContent();
      };
    });
  }
}