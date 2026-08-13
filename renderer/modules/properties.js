// ============================================================
// 世界生成器 — 属性定义
// 依赖: core/state.js, core/utils.js, core/modal.js, core/properties.js
// ============================================================

function renderProperties() {
  ensurePropertyDefs();
  const cats = state.data.categories || [];
  const rarities = state.data.propertyDefs.rarities;
  const scales = state.data.propertyDefs.scales;
  const customProps = state.data.propertyDefs.customProps || [];

  return `<div style="max-width:800px">
    <div class="section-title">⚙️ 属性定义</div>
    <p class="text-sm text-muted" style="margin-bottom:24px">管理世界中使用的各类属性选项，修改后会自动同步到对应的编辑表单中。</p>

    <div class="card">
      <h3>🏷️ 类别定义</h3>
      ${Object.entries(CAT_TYPE_LABELS).map(([type, label]) => {
        const typeCats = cats.filter(c => c.type === type);
        return `<div class="prop-group">
          <div class="prop-group-header">
            <h4>${label}</h4>
            <button class="btn btn-xs btn-outline" onclick="addPropCategory('${type}')">+ 新增</button>
          </div>
          <div class="prop-list">
            ${typeCats.length === 0 ? '<div class="text-xs text-muted" style="padding:8px 0">暂无类别</div>' :
              typeCats.map(c => {
                const isLocked = c.name === '未知';
                return `<div class="prop-item${isLocked?' prop-item-locked':''}">
                  <span class="prop-index" style="cursor:pointer" onclick="openCategoryDetail('${esc(c.type)}','${esc(c.name)}')">${isLocked?'🔒':esc(c.name)}</span>
                  <input class="prop-input" value="${esc(c.name)}"${isLocked?' readonly':''} data-cat-id="${c.id}" data-field="name" onfocus="this.select()" onblur="savePropCategory('${c.id}','name',this.value)" onkeydown="if(event.key==='Enter')this.blur()">
                  <input class="prop-desc-input" value="${esc(c.description||'')}" placeholder="简述（可选）"${isLocked?' readonly':''} data-cat-id="${c.id}" data-field="description" onfocus="this.select()" onblur="savePropCategory('${c.id}','description',this.value)" onkeydown="if(event.key==='Enter')this.blur()">
                  ${isLocked?'':`<button class="btn btn-xs btn-danger" onclick="deletePropCategory('${c.id}')">×</button>`}
                </div>`;
              }).join('')}
          </div>
        </div>`;
      }).join('')}
    </div>

    <div class="card">
      <h3>💎 稀有度定义</h3>
      <p class="text-xs text-muted" style="margin-bottom:12px">用于物品系统中的稀有度选项</p>
      <div class="prop-list">
        ${rarities.map((r, i) => {
          const isLocked = r.name === '未知';
          return `<div class="prop-item${isLocked?' prop-item-locked':''}">
            <span class="prop-index" style="cursor:pointer;color:${getRarityColor(r.name)}" onclick="openPropOptionDetail('稀有度','${esc(r.name)}','${esc(r.description||'')}','','switchTab(&quot;properties&quot;)')">${isLocked?'🔒':i+1}</span>
            <input class="prop-input" value="${esc(r.name)}"${isLocked?' readonly':''} data-prop-type="rarities" data-prop-index="${i}" data-field="name" onfocus="this.select()" onblur="savePropDefField('rarities',${i},'name',this.value)" onkeydown="if(event.key==='Enter')this.blur()">
            <input class="prop-desc-input" value="${esc(r.description||'')}" placeholder="简述"${isLocked?' readonly':''} data-prop-type="rarities" data-prop-index="${i}" data-field="description" onfocus="this.select()" onblur="savePropDefField('rarities',${i},'description',this.value)" onkeydown="if(event.key==='Enter')this.blur()">
            ${isLocked?'':`<button class="btn btn-xs btn-danger" onclick="deletePropDef('rarities',${i})">×</button>`}
          </div>`;
        }).join('')}
      </div>
      <button class="btn btn-xs btn-outline" style="margin-top:8px" onclick="addPropDef('rarities')">+ 新增稀有度</button>
    </div>

    <div class="card">
      <h3>📊 规模定义</h3>
      <p class="text-xs text-muted" style="margin-bottom:12px">用于种族系统中的规模选项</p>
      <div class="prop-list">
        ${scales.map((s, i) => {
          const isLocked = s.name === '未知';
          return `<div class="prop-item${isLocked?' prop-item-locked':''}">
            <span class="prop-index" style="cursor:pointer" onclick="openPropOptionDetail('规模','${esc(s.name)}','${esc(s.description||'')}','','switchTab(&quot;properties&quot;)')">${isLocked?'🔒':i+1}</span>
            <input class="prop-input" value="${esc(s.name)}"${isLocked?' readonly':''} data-prop-type="scales" data-prop-index="${i}" data-field="name" onfocus="this.select()" onblur="savePropDefField('scales',${i},'name',this.value)" onkeydown="if(event.key==='Enter')this.blur()">
            <input class="prop-desc-input" value="${esc(s.description||'')}" placeholder="简述"${isLocked?' readonly':''} data-prop-type="scales" data-prop-index="${i}" data-field="description" onfocus="this.select()" onblur="savePropDefField('scales',${i},'description',this.value)" onkeydown="if(event.key==='Enter')this.blur()">
            ${isLocked?'':`<button class="btn btn-xs btn-danger" onclick="deletePropDef('scales',${i})">×</button>`}
          </div>`;
        }).join('')}
      </div>
      <button class="btn btn-xs btn-outline" style="margin-top:8px" onclick="addPropDef('scales')">+ 新增规模</button>
    </div>

    <div class="card">
      <h3>📝 自定义词条</h3>
      <p class="text-xs text-muted" style="margin-bottom:12px">为物品、势力等模块添加自定义字段，支持选择型（下拉选项）、引用型（选择已有实体）和文本型（自由输入）</p>
      ${renderCustomPropGroups(customProps)}
      <button class="btn btn-sm btn-primary" style="margin-top:12px" onclick="addCustomProp()">+ 新增词条</button>
    </div>
  </div>`;
}

function setupProperties() {}

function renderCustomPropGroups(customProps) {
  if (!customProps || customProps.length === 0) {
    return '<div class="text-xs text-muted" style="padding:8px 0">暂无自定义词条，点击下方按钮添加</div>';
  }
  const backpacks = state.data.worldBackpacks || [];
  const bpMap = {};
  backpacks.forEach(bp => { bpMap['items_' + bp.id] = '🎒 ' + bp.name; });
  return customProps.map((prop, pi) => {
    const scopeLabels = { items: '📦 物品', factions: '🏰 势力', races: '🧬 种族', locations: '📍 地点', characters: '👤 角色', timeline: '⚡ 事件', outline: '📑 大纲', powers: '🔮 力量体系', ...bpMap };
    const typeLabels = { select: '选择型（下拉选项）', reference: '引用型（选择已有实体）', text: '文本型（自由输入）' };
    const refTypeLabels = { faction: '势力', location: '地点', character: '角色', race: '种族', timeline: '事件' };
    return `<div class="custom-prop-card">
      <div class="custom-prop-header">
        <div class="custom-prop-title">
          <span class="custom-prop-badge ${prop.type}">${prop.type === 'select' ? '📋' : prop.type === 'reference' ? '🔗' : '📝'} ${typeLabels[prop.type] || prop.type}</span>
          <strong>${esc(prop.name)}</strong>
          <span class="text-xs text-muted">→ ${(prop.scope||[]).map(s => scopeLabels[s]||s).join(', ')}</span>
        </div>
        <div class="flex-gap">
          <button class="btn btn-xs btn-outline" onclick="editCustomProp(${pi})">✏️ 编辑</button>
          <button class="btn btn-xs btn-danger" onclick="deleteCustomProp(${pi})">×</button>
        </div>
      </div>
      ${prop.type === 'select' ? `<div style="margin-top:8px">
        <label style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--text-secondary);margin-bottom:6px"><input type="checkbox" ${prop.multiSelect?'checked':''} onchange="toggleCustomPropMultiSelect(${pi},'select',this.checked)"> 允许多选</label>
        <div class="prop-list">
        ${(prop.options||[]).map((opt, oi) => {
          const optName = typeof opt === 'string' ? opt : opt.name;
          const optDesc = typeof opt === 'string' ? '' : (opt.description || '');
          const isLocked = optName === '未知';
          return `<div class="prop-item${isLocked?' prop-item-locked':''}">
            <span class="prop-index" style="cursor:pointer" onclick="openPropOptionDetail('${esc(prop.name)}','${esc(optName)}','${esc(optDesc)}','选择型',null)">${isLocked?'🔒':oi+1}</span>
            <input class="prop-input" value="${esc(optName)}"${isLocked?' readonly':''} data-cp-index="${pi}" data-opt-index="${oi}" data-field="name" onfocus="this.select()" onblur="saveCustomPropOption(${pi},${oi},'name',this.value)" onkeydown="if(event.key==='Enter')this.blur()">
            <input class="prop-desc-input" value="${esc(optDesc)}" placeholder="简述"${isLocked?' readonly':''} data-cp-index="${pi}" data-opt-index="${oi}" data-field="description" onfocus="this.select()" onblur="saveCustomPropOption(${pi},${oi},'description',this.value)" onkeydown="if(event.key==='Enter')this.blur()">
            ${isLocked?'':`<button class="btn btn-xs btn-danger" onclick="removeCustomPropOption(${pi},${oi})">×</button>`}
          </div>`;
        }).join('')}
        <button class="btn btn-xs btn-outline" style="margin-top:4px" onclick="addCustomPropOption(${pi})">+ 新增选项</button>
        </div>
      </div>` : ''}
      ${prop.type === 'reference' ? `<div style="margin-top:8px">
        <label style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--text-secondary);margin-bottom:6px"><input type="checkbox" ${prop.multiSelect?'checked':''} onchange="toggleCustomPropMultiSelect(${pi},'reference',this.checked)"> 允许多选</label>
        <div class="custom-prop-options">
          <span class="custom-prop-option" style="background:#e8daef;color:#6c3483">🔗 引用: ${refTypeLabels[prop.refType]||prop.refType||'未指定'}</span>
        </div>
      </div>` : ''}
      ${prop.type === 'text' ? `<div style="margin-top:8px">
        <div class="prop-list">
          <div class="prop-item">
            <span class="prop-index" style="font-size:11px;color:var(--text-muted)">提示</span>
            <input class="prop-input" value="${esc(prop.placeholder||'')}" placeholder="输入框提示文字（灰字）" data-cp-index="${pi}" data-field="placeholder" onfocus="this.select()" onblur="saveCustomPropPlaceholder(${pi},this.value)" onkeydown="if(event.key==='Enter')this.blur()">
          </div>
        </div>
      </div>` : ''}
    </div>`;
  }).join('');
}

async function addCustomProp() {
  const name = await customPrompt('词条名称', '');
  if (!name || !name.trim()) return;
  const typeResult = await customSelectModal('选择词条类型', [
    { id: 'select', name: '📋 选择型 — 自定义下拉选项（如：元素=火/水/风）' },
    { id: 'reference', name: '🔗 引用型 — 选择已有实体（如：上属势力=从势力列表选择）' },
    { id: 'text', name: '📝 文本型 — 自由输入文本' }
  ], []);
  if (!typeResult || typeResult.length === 0) return;
  const propType = typeResult[0];
  let refType = '';
  if (propType === 'reference') {
    const refResult = await customSelectModal('引用的实体类型', [
      { id: 'faction', name: '🏰 势力' },
      { id: 'location', name: '📍 地点' },
      { id: 'character', name: '👤 角色' },
      { id: 'race', name: '🧬 种族' },
      { id: 'timeline', name: '⚡ 事件' }
    ], []);
    if (!refResult || refResult.length === 0) return;
    refType = refResult[0];
  }
  const backpacks = state.data.worldBackpacks || [];
  const scopeOptions = [
    { id: 'factions', name: '🏰 势力' },
    { id: 'races', name: '🧬 种族' },
    { id: 'locations', name: '📍 地点' },
    { id: 'characters', name: '👤 角色' },
    { id: 'timeline', name: '⚡ 事件' },
    { id: 'outline', name: '📑 大纲' },
    { id: 'powers', name: '🔮 力量体系' },
    ...backpacks.map(bp => ({ id: 'items_' + bp.id, name: '🎒 ' + bp.name }))
  ];
  if (backpacks.length === 0) {
    scopeOptions.push({ id: 'items', name: '📦 物品（无背包时）' });
  }
  const scopeResult = await customSelectModal('应用到哪些模块（可多选）', scopeOptions, backpacks.length > 0 ? ['items_' + backpacks[0].id] : ['items']);
  if (!scopeResult || scopeResult.length === 0) return;
  const defaultOptions = propType === 'select' ? [{ name: '未知', description: '' }] : [];
  const newProp = { id: uid(), name: name.trim(), type: propType, scope: scopeResult, options: defaultOptions, refType, multiSelect: false, placeholder: '' };
  if (!state.data.propertyDefs.customProps) state.data.propertyDefs.customProps = [];
  state.data.propertyDefs.customProps.push(newProp);
  autoSave();
  renderTabContent();
}

async function editCustomProp(index) {
  const prop = (state.data.propertyDefs.customProps || [])[index];
  if (!prop) return;
  const name = await customPrompt('词条名称', prop.name);
  if (name === null) return;
  if (name && name.trim()) prop.name = name.trim();
  const backpacks = state.data.worldBackpacks || [];
  const scopeOptions = [
    { id: 'factions', name: '🏰 势力' },
    { id: 'races', name: '🧬 种族' },
    { id: 'locations', name: '📍 地点' },
    { id: 'characters', name: '👤 角色' },
    { id: 'timeline', name: '⚡ 事件' },
    { id: 'outline', name: '📑 大纲' },
    { id: 'powers', name: '🔮 力量体系' },
    ...backpacks.map(bp => ({ id: 'items_' + bp.id, name: '🎒 ' + bp.name }))
  ];
  if (backpacks.length === 0) {
    scopeOptions.push({ id: 'items', name: '📦 物品（无背包时）' });
  }
  const scopeResult = await customSelectModal('应用到哪些模块（可多选）', scopeOptions, prop.scope || []);
  if (scopeResult === null) return;
  if (scopeResult) prop.scope = scopeResult;
  autoSave();
  renderTabContent();
}

async function deleteCustomProp(index) {
  const prop = (state.data.propertyDefs.customProps || [])[index];
  if (!prop) return;
  if (!await customConfirm(`确定删除词条"${prop.name}"？`)) return;
  removeCustomPropData(prop);
  state.data.propertyDefs.customProps.splice(index, 1);
  autoSave();
  renderTabContent();
}

function addCustomPropOption(propIndex) {
  const prop = (state.data.propertyDefs.customProps || [])[propIndex];
  if (!prop) return;
  if (!prop.options) prop.options = [];
  prop.options.push({ name: '新选项', description: '' });
  autoSave();
  renderTabContent();
  setTimeout(() => {
    const input = document.querySelector(`input[data-cp-index="${propIndex}"][data-opt-index="${prop.options.length - 1}"][data-field="name"]`);
    if (input) { input.focus(); input.select(); }
  }, 50);
}

function saveCustomPropOption(propIndex, optIndex, field, value) {
  const prop = (state.data.propertyDefs.customProps || [])[propIndex];
  if (!prop || !prop.options || optIndex >= prop.options.length) return;
  const opt = prop.options[optIndex];
  if (!opt) return;
  const optName = typeof opt === 'string' ? opt : opt.name;
  if (optName === '未知') return;
  if (field === 'name' && value.trim()) {
    const oldName = typeof opt === 'string' ? opt : opt.name;
    if (value.trim() !== oldName) {
      if (typeof opt === 'string') { prop.options[optIndex] = { name: value.trim(), description: '' }; }
      else { opt.name = value.trim(); }
      syncCustomPropOptionRefs(prop, oldName, value.trim());
    }
  } else if (field === 'description') {
    if (typeof opt === 'string') { prop.options[optIndex] = { name: opt, description: value }; }
    else { opt.description = value; }
  }
  autoSave();
}

function toggleCustomPropMultiSelect(propIndex, propType, checked) {
  const prop = (state.data.propertyDefs.customProps || [])[propIndex];
  if (!prop) return;
  prop.multiSelect = checked;
  autoSave();
}

function saveCustomPropPlaceholder(propIndex, value) {
  const prop = (state.data.propertyDefs.customProps || [])[propIndex];
  if (!prop) return;
  prop.placeholder = value;
  autoSave();
}

async function removeCustomPropOption(propIndex, optIndex) {
  const prop = (state.data.propertyDefs.customProps || [])[propIndex];
  if (!prop || !prop.options) return;
  const oldOpt = prop.options[optIndex];
  const oldName = typeof oldOpt === 'string' ? oldOpt : oldOpt.name;
  if (oldName === '未知') return;
  if (!await customConfirm(`确定删除选项"${oldName}"？`)) return;
  prop.options.splice(optIndex, 1);
  syncCustomPropOptionRefs(prop, oldName, null);
  autoSave();
  renderTabContent();
}

function removeCustomPropData(prop) {
  const d = state.data;
  const key = 'cp_' + prop.id;
  (prop.scope || []).forEach(scope => {
    if (scope.startsWith('items_')) {
      const bpId = scope.substring(6);
      const items = (d.items || []).filter(i => i.backpackId === bpId);
      items.forEach(item => { if (item.customProps) delete item.customProps[key]; });
    } else {
      const list = d[scope] || [];
      list.forEach(item => { if (item.customProps) delete item.customProps[key]; });
    }
  });
}

function syncCustomPropOptionRefs(prop, oldVal, newVal) {
  const d = state.data;
  const key = 'cp_' + prop.id;
  (prop.scope || []).forEach(scope => {
    let list;
    if (scope.startsWith('items_')) {
      const bpId = scope.substring(6);
      list = (d.items || []).filter(i => i.backpackId === bpId);
    } else {
      list = d[scope] || [];
    }
    list.forEach(item => {
      if (!item.customProps || !item.customProps[key]) return;
      const val = item.customProps[key];
      if (prop.type === 'select') {
        if (val === oldVal) { item.customProps[key] = newVal || ''; }
      } else if (prop.type === 'reference') {
        if (Array.isArray(val) && val.includes(oldVal)) {
          item.customProps[key] = val.filter(v => v !== oldVal);
        }
      }
    });
  });
}

function renderCustomPropField(prop, currentValue, onChangeAction) {
  if (prop.type === 'select') {
    if (prop.multiSelect) {
      const selVals = Array.isArray(currentValue) ? currentValue : (currentValue ? [currentValue] : []);
      const checkboxes = (prop.options || []).map(o => {
        const optName = typeof o === 'string' ? o : o.name;
        const checked = selVals.includes(optName);
        return `<label style="display:inline-flex;align-items:center;gap:4px;margin-right:12px;font-size:13px;cursor:pointer"><input type="checkbox" value="${esc(optName)}"${checked?' checked':''} onchange="handleCustomPropMultiSelect('${prop.id}','${esc(optName)}',this.checked)"> ${esc(optName)}</label>`;
      }).join('');
      return `<div class="form-group"><label>${esc(prop.name)}</label><div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px">${checkboxes}</div></div>`;
    } else {
      const effectiveVal = currentValue || '未知';
      const opts = (prop.options || []).map(o => {
        const optName = typeof o === 'string' ? o : o.name;
        return `<option value="${esc(optName)}"${effectiveVal===optName?' selected':''}>${esc(optName)}</option>`;
      }).join('');
      return `<div class="form-group"><label>${esc(prop.name)}</label><select onchange="${onChangeAction}" style="width:100%;padding:8px 12px;background:var(--white);border:1px solid var(--border);border-radius:var(--radius-sm);font-size:14px;font-family:var(--font-body)">${opts}</select></div>`;
    }
  } else if (prop.type === 'reference') {
    const entries = collectGlossary(prop.refType);
    const selIds = Array.isArray(currentValue) ? currentValue : (currentValue ? [currentValue] : []);
    const selNames = entries.filter(e => selIds.includes(e.id)).map(e => e.name);
    const refTypeNavMap = { faction: 'factions', location: 'locations', character: 'characters', race: 'races', timeline: 'events' };
    return `<div class="form-group"><label>${esc(prop.name)}</label>
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
        <span class="text-xs text-muted">已选 ${selIds.length} 个</span>
        <button class="btn btn-xs btn-outline" onclick="openCustomPropRefSelect('${prop.id}','${prop.refType}')">选择</button>
      </div>
      ${selNames.length > 0 ? `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px">${selNames.map(n => { const e = entries.find(x => x.name === n); const eid = e ? e.id : n; const pType = prop.refType === 'timeline' ? 'event' : prop.refType; return `<span class="wiki-tag skill" style="cursor:pointer" onclick="showPreviewCard('${pType}','${esc(eid)}',event)">${esc(n)}</span>`; }).join('')}</div>` : ''}
    </div>`;
  } else {
    return `<div class="form-group"><label>${esc(prop.name)}</label><input value="${esc(currentValue||'')}" onchange="${onChangeAction}" placeholder="${esc(prop.placeholder||'')}" style="width:100%;padding:8px 12px;background:var(--white);border:1px solid var(--border);border-radius:var(--radius-sm);font-size:14px;font-family:var(--font-body)"></div>`;
  }
}

function renderCustomPropWikiHtml(customProps, cpData) {
  return (customProps || []).map(prop => {
    const key = 'cp_' + prop.id;
    const val = cpData[key];
    if (!val || (Array.isArray(val) && val.length === 0)) return '';
    if (prop.type === 'reference') {
      const entries = collectGlossary(prop.refType);
      const names = (Array.isArray(val) ? val : [val]).map(id => { const e = entries.find(x => x.id === id); return e ? e.name : id; });
      return `<div class="wiki-field"><span class="wiki-label">${esc(prop.name)}</span><div class="wiki-tags">${names.map(n => { const e = entries.find(x => x.name === n); const eid = e ? e.id : n; const pType = prop.refType === 'timeline' ? 'event' : prop.refType; return `<span class="wiki-tag skill" style="cursor:pointer" onclick="showPreviewCard('${pType}','${esc(eid)}',event)">${esc(n)}</span>`; }).join(' ')}</div></div>`;
    }
    if (prop.type === 'select') {
      if (prop.multiSelect) {
        const vals = Array.isArray(val) ? val : [val];
        return `<div class="wiki-field"><span class="wiki-label">${esc(prop.name)}</span><div class="wiki-tags">${vals.map(v => {
          const optObj = (prop.options || []).find(o => (typeof o === 'string' ? o : o.name) === v);
          const optDesc = optObj ? (typeof optObj === 'string' ? '' : (optObj.description || '')) : '';
          return `<span class="wiki-tag skill" style="cursor:pointer" title="${esc(optDesc)}" onclick="openPropOptionDetail('${esc(prop.name)}','${esc(v)}','${esc(optDesc)}','选择型',null)">${esc(v)}</span>`;
        }).join(' ')}</div></div>`;
      }
      const optObj = (prop.options || []).find(o => (typeof o === 'string' ? o : o.name) === val);
      const optDesc = optObj ? (typeof optObj === 'string' ? '' : (optObj.description || '')) : '';
      return `<div class="wiki-field"><span class="wiki-label">${esc(prop.name)}</span><span class="wiki-value" style="cursor:pointer" title="${esc(optDesc)}" onclick="openPropOptionDetail('${esc(prop.name)}','${esc(val)}','${esc(optDesc)}','选择型',null)">${esc(val)}</span></div>`;
    }
    return `<div class="wiki-field"><span class="wiki-label">${esc(prop.name)}</span><span class="wiki-value">${esc(Array.isArray(val) ? val.join(', ') : val)}</span></div>`;
  }).filter(Boolean).join('');
}

function getCustomPropsForScope(scope) {
  ensurePropertyDefs();
  return (state.data.propertyDefs.customProps || []).filter(p => (p.scope || []).includes(scope));
}

async function openCustomPropRefSelect(propId, refType) {
  const entries = collectGlossary(refType);
  if (entries.length === 0) { alert('暂无可选项'); return; }
  const key = 'cp_' + propId;
  const prop = (state.data.propertyDefs.customProps || []).find(p => p.id === propId);
  if (!prop) return;
  let currentItem = null;
  for (const s of prop.scope) {
    let list, selId;
    if (s.startsWith('items_')) {
      const bpId = s.substring(6);
      list = (state.data.items || []).filter(i => i.backpackId === bpId);
      selId = editItemId;
    } else {
      list = state.data[s] || [];
      selId = s === 'factions' ? state.selectedFactionId :
              s === 'races' ? state.selectedRaceId :
              s === 'locations' ? state.selectedLocationId :
              s === 'characters' ? state.selectedCharacterId : null;
    }
    const found = list.find(i => i.id === selId);
    if (found) { currentItem = found; break; }
  }
  if (!currentItem) return;
  if (!currentItem.customProps) currentItem.customProps = {};
  const current = currentItem.customProps[key] || [];
  const maxSel = prop.multiSelect ? undefined : 1;
  const result = await customSelectModal('选择' + prop.name, entries, Array.isArray(current) ? current : [], maxSel);
  if (result === null) return;
  currentItem.customProps[key] = prop.multiSelect ? result : (result.length > 0 ? result[0] : '');
  autoSave();
  renderTabContent();
}

function handleCustomPropMultiSelect(propId, optName, checked) {
  const prop = (state.data.propertyDefs.customProps || []).find(p => p.id === propId);
  if (!prop) return;
  const key = 'cp_' + propId;
  let currentItem = null;
  for (const s of prop.scope) {
    let list, selId;
    if (s.startsWith('items_')) {
      const bpId = s.substring(6);
      list = (state.data.items || []).filter(i => i.backpackId === bpId);
      selId = editItemId;
    } else {
      list = state.data[s] || [];
      selId = s === 'factions' ? state.selectedFactionId :
              s === 'races' ? state.selectedRaceId :
              s === 'locations' ? state.selectedLocationId :
              s === 'characters' ? state.selectedCharacterId : null;
    }
    const found = list.find(i => i.id === selId);
    if (found) { currentItem = found; break; }
  }
  if (!currentItem) return;
  if (!currentItem.customProps) currentItem.customProps = {};
  let vals = currentItem.customProps[key] || [];
  if (!Array.isArray(vals)) vals = vals ? [vals] : [];
  if (checked) {
    if (!vals.includes(optName)) vals.push(optName);
  } else {
    vals = vals.filter(v => v !== optName);
  }
  currentItem.customProps[key] = vals;
  autoSave();
}

function navigateToEntry(type, name) {
  const tabMap = { faction: 'factions', location: 'locations', character: 'characters', race: 'races' };
  const tab = tabMap[type];
  if (!tab) return;
  pushNavHistory();
  const list = state.data[tab] || [];
  const entry = list.find(e => e.name === name || e.id === name);
  if (entry) {
    if (tab === 'factions') state.selectedFactionId = entry.id;
    else if (tab === 'races') state.selectedRaceId = entry.id;
    else if (tab === 'locations') state.selectedLocationId = entry.id;
    else if (tab === 'characters') state.selectedCharacterId = entry.id;
  }
  state.activeTab = tab;
  render();
}

function addPropCategory(type) {
  if (!state.data.categories) state.data.categories = [];
  const newCat = { id: uid(), type, name: '新类别', description: '' };
  state.data.categories.push(newCat);
  autoSave();
  renderTabContent();
  setTimeout(() => {
    const input = document.querySelector(`input[data-cat-id="${newCat.id}"][data-field="name"]`);
    if (input) { input.focus(); input.select(); }
  }, 50);
}

function savePropCategory(catId, field, value) {
  const cat = (state.data.categories || []).find(c => c.id === catId);
  if (!cat) return;
  if (cat.name === '未知') return;
  const oldValue = cat[field];
  if (field === 'name' && value.trim()) {
    if (value.trim() !== oldValue) {
      if ((state.data.categories || []).find(c => c.type === cat.type && c.name === value.trim() && c.id !== catId)) {
        alert('该类别已存在');
        renderTabContent();
        return;
      }
      cat.name = value.trim();
      renameCategoryRefs(cat.type, oldValue, cat.name);
    }
  } else if (field === 'description') {
    cat.description = value;
  }
  autoSave();
}

async function deletePropCategory(catId) {
  const cat = (state.data.categories || []).find(c => c.id === catId);
  if (!cat) return;
  if (cat.name === '未知') return;
  if (!await customConfirm(`确定删除类别"${cat.name}"？`)) return;
  state.data.categories = (state.data.categories || []).filter(c => c.id !== catId);
  autoSave();
  renderTabContent();
}

function addPropDef(propType) {
  if (!state.data.propertyDefs) return;
  if (propType === 'rarities') {
    state.data.propertyDefs.rarities.push({ name: '新稀有度', description: '' });
  } else if (propType === 'scales') {
    state.data.propertyDefs.scales.push({ name: '新规模', description: '' });
  }
  autoSave();
  renderTabContent();
  const list = state.data.propertyDefs[propType];
  setTimeout(() => {
    const input = document.querySelector(`input[data-prop-type="${propType}"][data-prop-index="${list.length - 1}"][data-field="name"]`);
    if (input) { input.focus(); input.select(); }
  }, 50);
}

function savePropDefField(propType, index, field, value) {
  if (!state.data.propertyDefs) return;
  const list = state.data.propertyDefs[propType];
  if (!list || index >= list.length) return;
  const item = list[index];
  if (!item) return;
  if (field === 'name' && item.name === '未知') return;
  if (field === 'description' && item.name === '未知') return;
  if (field === 'name' && value.trim()) {
    const oldName = item.name;
    if (value.trim() !== oldName) {
      item.name = value.trim();
      syncPropDefRefs(propType, oldName, value.trim());
    }
  } else if (field === 'description') {
    item.description = value;
  }
  autoSave();
}

async function deletePropDef(propType, index) {
  if (!state.data.propertyDefs) return;
  const list = state.data.propertyDefs[propType];
  if (!list || index >= list.length) return;
  const item = list[index];
  const name = typeof item === 'string' ? item : item.name;
  if (name === '未知') return;
  if (!await customConfirm(`确定删除"${name}"？`)) return;
  list.splice(index, 1);
  autoSave();
  renderTabContent();
}

function syncPropDefRefs(propType, oldValue, newValue) {
  const d = state.data;
  if (propType === 'rarities') {
    (d.items || []).forEach(i => { if (i.rarity === oldValue) i.rarity = newValue; });
  } else if (propType === 'scales') {
    (d.races || []).forEach(r => { if (r.scale === oldValue) r.scale = newValue; });
  }
}