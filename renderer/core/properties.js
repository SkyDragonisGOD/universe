// ============================================================
// 世界生成器 — 属性定义系统
// ============================================================

const DEFAULT_RARITIES = [
  { name: '未知', description: '' },
  { name: '普通', description: '常见的普通物品' },
  { name: '优秀', description: '品质优于普通的物品' },
  { name: '稀有', description: '较为罕见的物品' },
  { name: '史诗', description: '极为珍贵的史诗级物品' },
  { name: '传说', description: '传说中的绝世之物' }
];
const DEFAULT_SCALES = [
  { name: '未知', description: '' },
  { name: '濒危', description: '极度稀少，接近灭绝' },
  { name: '极小', description: '数量极少' },
  { name: '小', description: '数量较少' },
  { name: '中等', description: '数量适中' },
  { name: '大', description: '数量较多' },
  { name: '庞大', description: '数量庞大' },
  { name: '遍布世界', description: '遍布世界各地' }
];
const RARITY_MIGRATION = { '': '普通', 'uncommon': '优秀', 'rare': '稀有', 'epic': '史诗', 'legendary': '传说' };
const RARITY_COLORS = ['#888', '#38a169', '#3182ce', '#805ad5', '#d69e2e', '#e53e3e', '#dd6b20', '#718096'];

function migratePropArray(arr) {
  if (!arr) return [];
  return arr.map(item => {
    if (typeof item === 'string') return { name: item, description: '' };
    return item;
  });
}

function ensurePropertyDefs() {
  if (!state.data.propertyDefs) {
    state.data.propertyDefs = { rarities: JSON.parse(JSON.stringify(DEFAULT_RARITIES)), scales: JSON.parse(JSON.stringify(DEFAULT_SCALES)), customProps: [] };
    let migrated = false;
    (state.data.items || []).forEach(item => {
      if (RARITY_MIGRATION[item.rarity] !== undefined) { item.rarity = RARITY_MIGRATION[item.rarity]; migrated = true; }
    });
    if (migrated) autoSave();
  }
  if (!state.data.propertyDefs.customProps) state.data.propertyDefs.customProps = [];
  let needSave = false;
  if (state.data.propertyDefs.rarities.length > 0 && typeof state.data.propertyDefs.rarities[0] === 'string') {
    state.data.propertyDefs.rarities = migratePropArray(state.data.propertyDefs.rarities);
    needSave = true;
  }
  if (state.data.propertyDefs.scales.length > 0 && typeof state.data.propertyDefs.scales[0] === 'string') {
    state.data.propertyDefs.scales = migratePropArray(state.data.propertyDefs.scales);
    needSave = true;
  }
  (state.data.propertyDefs.customProps || []).forEach(prop => {
    if (prop.type === 'select' && prop.options && prop.options.length > 0 && typeof prop.options[0] === 'string') {
      prop.options = migratePropArray(prop.options);
      needSave = true;
    }
    if (prop.type === 'select' && prop.options && !prop.options.find(o => (typeof o === 'string' ? o : o.name) === '未知')) {
      prop.options.unshift({ name: '未知', description: '' });
      needSave = true;
    }
  });
  if (!state.data.propertyDefs.rarities.find(r => (typeof r === 'string' ? r : r.name) === '未知')) {
    state.data.propertyDefs.rarities.unshift({ name: '未知', description: '' });
    needSave = true;
  }
  if (!state.data.propertyDefs.scales.find(s => (typeof s === 'string' ? s : s.name) === '未知')) {
    state.data.propertyDefs.scales.unshift({ name: '未知', description: '' });
    needSave = true;
  }
  if (!state.data.categories) state.data.categories = [];
  Object.keys(CAT_TYPE_LABELS).forEach(type => {
    if (!state.data.categories.find(c => c.type === type && c.name === '未知')) {
      state.data.categories.unshift({ id: uid(), type, name: '未知', description: '' });
      needSave = true;
    }
  });
  (state.data.characters || []).forEach(c => {
    if (typeof c.race === 'string') {
      c.race = c.race && c.race !== '未知' ? [c.race] : [];
      needSave = true;
    }
  });
  if (needSave) autoSave();
}

function getRarityLabel(value) {
  ensurePropertyDefs();
  if (!value) return '普通';
  const found = state.data.propertyDefs.rarities.find(r => r.name === value);
  return found ? found.name : value;
}

function getRarityDesc(value) {
  ensurePropertyDefs();
  const found = state.data.propertyDefs.rarities.find(r => r.name === value);
  return found ? (found.description || '') : '';
}

function getScaleDesc(value) {
  ensurePropertyDefs();
  const found = state.data.propertyDefs.scales.find(s => s.name === value);
  return found ? (found.description || '') : '';
}

function getRarityColor(value) {
  ensurePropertyDefs();
  const idx = state.data.propertyDefs.rarities.findIndex(r => r.name === value);
  return idx >= 0 ? RARITY_COLORS[Math.min(idx, RARITY_COLORS.length - 1)] : '#888';
}

function renderRaritySelect(currentValue, onChangeAction) {
  ensurePropertyDefs();
  const rarities = state.data.propertyDefs.rarities;
  const val = currentValue || '普通';
  const opts = rarities.map(r => `<option value="${esc(r.name)}"${val===r.name?' selected':''}>${esc(r.name)}</option>`).join('');
  return `<select onchange="${onChangeAction}" style="width:100%;padding:8px 12px;background:var(--white);border:1px solid var(--border);border-radius:var(--radius-sm);font-size:14px;font-family:var(--font-body)">${opts}</select>`;
}

function renderScaleSelect(currentValue, onChangeAction) {
  ensurePropertyDefs();
  const scales = state.data.propertyDefs.scales;
  const opts = scales.map(s => `<option value="${esc(s.name)}"${currentValue===s.name?' selected':''}>${esc(s.name)}</option>`).join('');
  return `<select onchange="${onChangeAction}" style="width:100%;padding:8px 12px;background:var(--white);border:1px solid var(--border);border-radius:var(--radius-sm);font-size:14px;font-family:var(--font-body)">${opts}</select>`;
}

function openPropOptionDetail(title, name, description, type, onEdit) {
  const overlay = $('#modal-overlay');
  const modal = $('#modal-box');
  modal.innerHTML = `
    <div class="wiki-page" style="padding:0">
      <div class="wiki-header" style="padding-bottom:12px;border-bottom:1px solid var(--border)">
        <h2 style="margin:0">${esc(title)} · ${esc(name)}</h2>
      </div>
      <div class="wiki-section" style="margin-top:12px">
        <div class="wiki-field"><span class="wiki-label">名称</span><span class="wiki-value">${esc(name)}</span></div>
        ${type ? `<div class="wiki-field"><span class="wiki-label">类型</span><span class="wiki-value">${esc(type)}</span></div>` : ''}
      </div>
      <div class="wiki-section"><div class="wiki-section-title">简述</div><div class="wiki-value">${description ? esc(description) : '<span class="text-xs text-muted">暂无简述</span>'}</div></div>
      <div class="modal-actions" style="margin-top:16px">
        ${onEdit ? `<button class="btn btn-outline" onclick="closeModal();${onEdit}">⚙️ 编辑</button>` : ''}
        <button class="btn btn-outline" onclick="closeModal()">关闭</button>
      </div>
    </div>`;
  overlay.classList.remove('hidden');
  overlay.onclick = (e) => { if (e.target === overlay) closeModal(); };
}

function openCategoryDetail(type, name) {
  const cat = (state.data.categories||[]).find(c => c.type === type && c.name === name);
  const overlay = $('#modal-overlay');
  const modal = $('#modal-box');
  modal.innerHTML = `
    <div class="wiki-page" style="padding:0">
      <div class="wiki-header" style="padding-bottom:12px;border-bottom:1px solid var(--border)">
        <h2 style="margin:0">${CAT_TYPE_LABELS[type]||type} · ${esc(name)}</h2>
      </div>
      <div class="wiki-section" style="margin-top:12px">
        <div class="wiki-field"><span class="wiki-label">类别名称</span><span class="wiki-value">${esc(name)}</span></div>
        <div class="wiki-field"><span class="wiki-label">所属模块</span><span class="wiki-value">${CAT_TYPE_LABELS[type]||type}</span></div>
      </div>
      ${cat&&cat.description?`<div class="wiki-section"><div class="wiki-section-title">简述</div><div class="wiki-value">${esc(cat.description)}</div></div>`:`<div class="wiki-section"><div class="wiki-section-title">简述</div><div class="text-xs text-muted">暂无简述</div></div>`}
      <div class="modal-actions" style="margin-top:16px">
        ${cat?`<button class="btn btn-outline" onclick="closeModal();switchTab('properties')">⚙️ 在属性定义中编辑</button>`:''}
        <button class="btn btn-outline" onclick="closeModal()">关闭</button>
      </div>
    </div>`;
  overlay.classList.remove('hidden');
  overlay.onclick = (e) => { if (e.target === overlay) closeModal(); };
}