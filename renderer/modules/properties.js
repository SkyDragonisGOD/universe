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
          <div class="prop-list" data-drag-group="cat-${type}">
            ${typeCats.length === 0 ? '<div class="text-xs text-muted" style="padding:8px 0">暂无类别</div>' :
              typeCats.map(c => {
                const isLocked = c.name === '未知';
                return `<div class="prop-item${isLocked?' prop-item-locked':''}" draggable="${!isLocked}" data-drag-id="${c.id}">
                  ${!isLocked?'<span class="prop-drag-handle" title="拖拽排序">⠿</span>':''}
                  <span class="prop-index" style="cursor:pointer" onclick="openCategoryDetail('${esc(c.type)}','${esc(c.name)}')">${isLocked?'🔒':esc(c.name)}</span>
                  <input class="prop-input" value="${esc(c.name)}"${isLocked?' readonly':''} ondragstart="event.stopPropagation();return false" data-cat-id="${c.id}" data-field="name" onfocus="this.select()" onblur="savePropCategory('${c.id}','name',this.value)" onkeydown="if(event.key==='Enter')this.blur()">
                  <input class="prop-desc-input" value="${esc(c.description||'')}" placeholder="简述（可选）"${isLocked?' readonly':''} ondragstart="event.stopPropagation();return false" data-cat-id="${c.id}" data-field="description" onfocus="this.select()" onblur="savePropCategory('${c.id}','description',this.value)" onkeydown="if(event.key==='Enter')this.blur()">
                  ${isLocked?'':`<button class="btn btn-xs btn-outline" onclick="insertPropCategory('${c.id}','${type}')" style="flex-shrink:0;font-size:10px;padding:2px 5px" title="在此处插入">＋</button><button class="btn btn-xs btn-danger" onclick="deletePropCategory('${c.id}')">×</button>`}
                </div>`;
              }).join('')}
          </div>
        </div>`;
      }).join('')}
    </div>

    <div class="card">
      <h3>💎 稀有度定义</h3>
      <p class="text-xs text-muted" style="margin-bottom:12px">用于物品系统中的稀有度选项</p>
      <div class="prop-list" data-drag-group="rarities">
        ${rarities.map((r, i) => {
          const isLocked = r.name === '未知';
          return `<div class="prop-item${isLocked?' prop-item-locked':''}" draggable="${!isLocked}" data-drag-index="${i}">
            ${!isLocked?'<span class="prop-drag-handle" title="拖拽排序">⠿</span>':''}
            <span class="prop-index" style="cursor:pointer;color:${getRarityColor(r.name)}" onclick="openPropOptionDetail('稀有度','${esc(r.name)}','${esc(r.description||'')}','','switchTab(&quot;properties&quot;)')">${isLocked?'🔒':i+1}</span>
            <input class="prop-input" value="${esc(r.name)}"${isLocked?' readonly':''} ondragstart="event.stopPropagation();return false" data-prop-type="rarities" data-prop-index="${i}" data-field="name" onfocus="this.select()" onblur="savePropDefField('rarities',${i},'name',this.value)" onkeydown="if(event.key==='Enter')this.blur()">
            <input class="prop-desc-input" value="${esc(r.description||'')}" placeholder="简述"${isLocked?' readonly':''} ondragstart="event.stopPropagation();return false" data-prop-type="rarities" data-prop-index="${i}" data-field="description" onfocus="this.select()" onblur="savePropDefField('rarities',${i},'description',this.value)" onkeydown="if(event.key==='Enter')this.blur()">
            ${isLocked?'':`<button class="btn btn-xs btn-outline" onclick="insertPropDef('rarities',${i})" style="flex-shrink:0;font-size:10px;padding:2px 5px" title="在此处插入">＋</button><button class="btn btn-xs btn-danger" onclick="deletePropDef('rarities',${i})">×</button>`}
          </div>`;
        }).join('')}
      </div>
      <button class="btn btn-xs btn-outline" style="margin-top:8px" onclick="addPropDef('rarities')">+ 新增稀有度</button>
    </div>

    <div class="card">
      <h3>📊 规模定义</h3>
      <p class="text-xs text-muted" style="margin-bottom:12px">用于种族系统中的规模选项</p>
      <div class="prop-list" data-drag-group="scales">
        ${scales.map((s, i) => {
          const isLocked = s.name === '未知';
          return `<div class="prop-item${isLocked?' prop-item-locked':''}" draggable="${!isLocked}" data-drag-index="${i}">
            ${!isLocked?'<span class="prop-drag-handle" title="拖拽排序">⠿</span>':''}
            <span class="prop-index" style="cursor:pointer" onclick="openPropOptionDetail('规模','${esc(s.name)}','${esc(s.description||'')}','','switchTab(&quot;properties&quot;)')">${isLocked?'🔒':i+1}</span>
            <input class="prop-input" value="${esc(s.name)}"${isLocked?' readonly':''} ondragstart="event.stopPropagation();return false" data-prop-type="scales" data-prop-index="${i}" data-field="name" onfocus="this.select()" onblur="savePropDefField('scales',${i},'name',this.value)" onkeydown="if(event.key==='Enter')this.blur()">
            <input class="prop-desc-input" value="${esc(s.description||'')}" placeholder="简述"${isLocked?' readonly':''} ondragstart="event.stopPropagation();return false" data-prop-type="scales" data-prop-index="${i}" data-field="description" onfocus="this.select()" onblur="savePropDefField('scales',${i},'description',this.value)" onkeydown="if(event.key==='Enter')this.blur()">
            ${isLocked?'':`<button class="btn btn-xs btn-outline" onclick="insertPropDef('scales',${i})" style="flex-shrink:0;font-size:10px;padding:2px 5px" title="在此处插入">＋</button><button class="btn btn-xs btn-danger" onclick="deletePropDef('scales',${i})">×</button>`}
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

function setupProperties() {
  document.querySelectorAll('.prop-list[data-drag-group]').forEach(list => {
    const group = list.dataset.dragGroup;
    let dragSrc = null;
    list.querySelectorAll('.prop-item[draggable="true"]').forEach(item => {
      item.addEventListener('dragstart', e => {
        const src = e.target || e.srcElement;
        if (src && (src.tagName === 'INPUT' || src.tagName === 'TEXTAREA' || src.closest('input,textarea'))) {
          e.preventDefault();
          return;
        }
        dragSrc = item;
        item.style.opacity = '0.4';
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', '');
      });
      item.addEventListener('dragend', () => {
        item.style.opacity = '';
        list.querySelectorAll('.prop-item').forEach(el => el.classList.remove('drag-over'));
        dragSrc = null;
      });
      item.addEventListener('dragover', e => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        const target = e.currentTarget;
        if (target !== dragSrc && target.classList.contains('prop-item') && target.getAttribute('draggable') === 'true') {
          list.querySelectorAll('.prop-item').forEach(el => el.classList.remove('drag-over'));
          target.classList.add('drag-over');
        }
      });
      item.addEventListener('dragleave', () => {
        item.classList.remove('drag-over');
      });
      item.addEventListener('drop', e => {
        e.preventDefault();
        item.classList.remove('drag-over');
        if (!dragSrc || dragSrc === item) return;
        const allItems = [...list.querySelectorAll('.prop-item[draggable="true"]')];
        const fromIdx = allItems.indexOf(dragSrc);
        const toIdx = allItems.indexOf(item);
        if (fromIdx === -1 || toIdx === -1) return;
        if (fromIdx < toIdx) {
          list.insertBefore(dragSrc, item.nextSibling);
        } else {
          list.insertBefore(dragSrc, item);
        }
        applyDragSort(group, list);
      });
    });
  });
}

function applyDragSort(group, list) {
  if (group.startsWith('cat-')) {
    const type = group.substring(4);
    const newOrder = [...list.querySelectorAll('.prop-item[data-drag-id]')].map(el => el.dataset.dragId);
    const cats = state.data.categories || [];
    const ofType = cats.filter(c => c.type === type);
    const otherType = cats.filter(c => c.type !== type);
    const sorted = newOrder.map(id => ofType.find(c => c.id === id)).filter(Boolean);
    const missing = ofType.filter(c => !newOrder.includes(c.id));
    state.data.categories = [...otherType, ...sorted, ...missing];
    autoSave();
    renderTabContent();
  } else if (group === 'rarities' || group === 'scales') {
    const arr = state.data.propertyDefs[group];
    if (!arr) return;
    const newOrder = [...list.querySelectorAll('.prop-item[data-drag-index]')].map(el => parseInt(el.dataset.dragIndex));
    const sorted = newOrder.map(i => arr[i]).filter(Boolean);
    arr.length = 0;
    sorted.forEach(item => arr.push(item));
    autoSave();
    renderTabContent();
  } else if (group.startsWith('cp-opts-')) {
    const pi = parseInt(group.substring(8));
    const prop = (state.data.propertyDefs.customProps || [])[pi];
    if (!prop || !prop.options) return;
    const newOrder = [...list.querySelectorAll('.prop-item[data-drag-index]')].map(el => parseInt(el.dataset.dragIndex));
    const sorted = newOrder.map(i => prop.options[i]).filter(Boolean);
    prop.options.length = 0;
    sorted.forEach(item => prop.options.push(item));
    autoSave();
    renderTabContent();
  }
}

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
        <div class="prop-list" data-drag-group="cp-opts-${pi}">
        ${(prop.options||[]).map((opt, oi) => {
          const optName = typeof opt === 'string' ? opt : opt.name;
          const optDesc = typeof opt === 'string' ? '' : (opt.description || '');
          const isLocked = optName === '未知';
          return `<div class="prop-item${isLocked?' prop-item-locked':''}" draggable="${!isLocked}" data-drag-index="${oi}">
            ${!isLocked?'<span class="prop-drag-handle" title="拖拽排序">⠿</span>':''}
            <span class="prop-index" style="cursor:pointer" onclick="openPropOptionDetail('${esc(prop.name)}','${esc(optName)}','${esc(optDesc)}','选择型',null)">${isLocked?'🔒':oi+1}</span>
            <input class="prop-input" value="${esc(optName)}"${isLocked?' readonly':''} ondragstart="event.stopPropagation();return false" data-cp-index="${pi}" data-opt-index="${oi}" data-field="name" onfocus="this.select()" onblur="saveCustomPropOption(${pi},${oi},'name',this.value)" onkeydown="if(event.key==='Enter')this.blur()">
            <input class="prop-desc-input" value="${esc(optDesc)}" placeholder="简述"${isLocked?' readonly':''} ondragstart="event.stopPropagation();return false" data-cp-index="${pi}" data-opt-index="${oi}" data-field="description" onfocus="this.select()" onblur="saveCustomPropOption(${pi},${oi},'description',this.value)" onkeydown="if(event.key==='Enter')this.blur()">
            ${isLocked?'':`<button class="btn btn-xs btn-outline" onclick="insertCustomPropOption(${pi},${oi})" style="flex-shrink:0;font-size:10px;padding:2px 5px" title="在此处插入">＋</button><button class="btn btn-xs btn-danger" onclick="removeCustomPropOption(${pi},${oi})">×</button>`}
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
            <input class="prop-input" value="${esc(prop.placeholder||'')}" ondragstart="event.stopPropagation();return false" placeholder="输入框提示文字（灰字）" data-cp-index="${pi}" data-field="placeholder" onfocus="this.select()" onblur="saveCustomPropPlaceholder(${pi},this.value)" onkeydown="if(event.key==='Enter')this.blur()">
          </div>
        </div>
      </div>` : ''}
    </div>`;
  }).join('');
}

function openCustomPropModal(editIndex) {
  const isEdit = editIndex !== undefined && editIndex !== null && editIndex >= 0;
  const existingProp = isEdit ? (state.data.propertyDefs.customProps || [])[editIndex] : null;
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
  const defaultScope = backpacks.length > 0 ? ['items_' + backpacks[0].id] : ['items'];
  const initName = existingProp ? existingProp.name : '';
  const initType = existingProp ? existingProp.type : 'select';
  const initRefType = existingProp ? (existingProp.refType || '') : '';
  const initScope = existingProp ? (existingProp.scope || []) : defaultScope;
  const initMultiSelect = existingProp ? (existingProp.multiSelect || false) : false;
  const initPlaceholder = existingProp ? (existingProp.placeholder || '') : '';
  const initOptions = existingProp ? (existingProp.options || []) : [{ name: '未知', description: '' }];

  const modal = $('#modal-box');
  const overlay = $('#modal-overlay');
  const typeOptions = [
    { id: 'select', name: '📋 选择型', desc: '自定义下拉选项（如：元素=火/水/风）' },
    { id: 'reference', name: '🔗 引用型', desc: '选择已有实体（如：上属势力=从势力列表选择）' },
    { id: 'text', name: '📝 文本型', desc: '自由输入文本' }
  ];
  const refTypeOptions = [
    { id: 'faction', name: '🏰 势力' },
    { id: 'location', name: '📍 地点' },
    { id: 'character', name: '👤 角色' },
    { id: 'race', name: '🧬 种族' },
    { id: 'timeline', name: '⚡ 事件' }
  ];

  function renderOptionsList(opts) {
    return (opts || []).map((opt, oi) => {
      const optName = typeof opt === 'string' ? opt : opt.name;
      const optDesc = typeof opt === 'string' ? '' : (opt.description || '');
      const isLocked = optName === '未知';
      const isFirst = oi === 0;
      const isLast = oi === (opts || []).length - 1;
      return `<div style="display:flex;gap:4px;align-items:center;margin-bottom:4px">
        <span style="color:var(--warm-gray);font-size:11px;width:18px;text-align:center;flex-shrink:0">${oi+1}</span>
        <input class="cp-opt-name" value="${esc(optName)}" ${isLocked?'readonly':''} ondragstart="event.stopPropagation();return false" placeholder="选项名称" data-opt-idx="${oi}" style="flex:1;padding:6px 10px;border:1px solid var(--border);border-radius:var(--radius-xs);font-size:13px;font-family:var(--font-body);background:${isLocked?'var(--light-gray)':'var(--white)'}">
        <input class="cp-opt-desc" value="${esc(optDesc)}" ${isLocked?'readonly':''} ondragstart="event.stopPropagation();return false" placeholder="简述（可选）" data-opt-idx="${oi}" style="flex:1;padding:6px 10px;border:1px solid var(--border);border-radius:var(--radius-xs);font-size:13px;font-family:var(--font-body);background:${isLocked?'var(--light-gray)':'var(--white)'}">
        ${isLocked?'':`<div style="display:flex;flex-direction:column;gap:1px;flex-shrink:0">
          <button class="btn btn-xs cp-opt-up" data-opt-idx="${oi}" style="padding:1px 4px;font-size:10px;line-height:1;${isFirst?'opacity:0.3;pointer-events:none':''}" title="上移">▲</button>
          <button class="btn btn-xs cp-opt-down" data-opt-idx="${oi}" style="padding:1px 4px;font-size:10px;line-height:1;${isLast?'opacity:0.3;pointer-events:none':''}" title="下移">▼</button>
        </div>
        <button class="btn btn-xs btn-outline cp-opt-insert" data-opt-idx="${oi}" style="flex-shrink:0;font-size:10px;padding:2px 5px" title="在此处插入">＋</button>
        <button class="btn btn-xs btn-danger cp-opt-remove" data-opt-idx="${oi}" style="flex-shrink:0">×</button>`}
      </div>`;
    }).join('');
  }

  function buildForm() {
    const currentType = modal.querySelector('input[name="cp-type"]:checked')?.value || initType;
    const currentOptions = currentType === 'select' ? _modalOptions : [];
    const typeCardStyle = (active) => `display:block;padding:12px 14px;border:2px solid ${active?'var(--black)':'var(--border)'};border-radius:var(--radius-sm);cursor:pointer;font-size:13px;background:${active?'var(--light-gray)':'var(--white)'};color:var(--text);text-align:center;transition:all .15s`;
    const scopeTagStyle = (active) => `display:inline-flex;align-items:center;gap:6px;padding:5px 12px;border:2px solid ${active?'var(--black)':'var(--border)'};border-radius:var(--radius-pill);font-size:12px;cursor:pointer;background:${active?'var(--light-gray)':'var(--white)'};color:var(--text);transition:all .15s`;
    return `
      <h3>${isEdit ? '✏️ 编辑词条' : '+ 新增词条'}</h3>
      <div class="form-group"><label>词条名称</label><input id="cp-name" value="${esc(initName)}" ondragstart="event.stopPropagation();return false" placeholder="输入词条名称" style="width:100%;padding:8px 12px;font-size:14px;border:1px solid var(--border);border-radius:var(--radius-sm);background:var(--white);font-family:var(--font-body)"></div>
      <div class="form-group"><label>词条类型</label>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px">${typeOptions.map(t => `<label style="${typeCardStyle(currentType===t.id)}">
          <input type="radio" name="cp-type" value="${t.id}" ${currentType===t.id?'checked':''} style="display:none"><div style="font-size:20px;margin-bottom:4px">${t.name.split(' ')[0]}</div><strong style="font-size:13px">${t.name.split(' ').slice(1).join(' ')}</strong><div style="font-size:11px;color:var(--warm-gray);margin-top:4px;line-height:1.4">${t.desc}</div></label>`).join('')}</div>
      </div>
      <div id="cp-ref-type-section" style="display:${currentType==='reference'?'block':'none'}">
        <div class="form-group"><label>引用实体类型</label>
          <select id="cp-ref-type" style="width:100%;padding:8px 12px;font-size:14px;border:1px solid var(--border);border-radius:var(--radius-sm);background:var(--white);font-family:var(--font-body)">
            ${refTypeOptions.map(r => `<option value="${r.id}" ${(existingProp?.refType||initRefType)===r.id?'selected':''}>${r.name}</option>`).join('')}
          </select>
        </div>
      </div>
      <div id="cp-multiselect-section" style="display:${currentType==='select'||currentType==='reference'?'block':'none'}">
        <div class="form-group"><label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px"><input type="checkbox" id="cp-multiselect" ${initMultiSelect?'checked':''} style="width:16px;height:16px;accent-color:var(--black)"> 允许多选</label></div>
      </div>
      <div id="cp-options-section" style="display:${currentType==='select'?'block':'none'}">
        <div class="form-group"><label>下拉选项</label>
          <div id="cp-options-list">${renderOptionsList(currentOptions)}</div>
          <button class="btn btn-xs btn-outline" style="margin-top:6px" id="cp-add-option">+ 新增选项</button>
        </div>
      </div>
      <div id="cp-placeholder-section" style="display:${currentType==='text'?'block':'none'}">
        <div class="form-group"><label>输入框提示文字</label><input id="cp-placeholder" value="${esc(initPlaceholder)}" ondragstart="event.stopPropagation();return false" placeholder="灰字提示文字" style="width:100%;padding:8px 12px;font-size:14px;border:1px solid var(--border);border-radius:var(--radius-sm);background:var(--white);font-family:var(--font-body)"></div>
      </div>
      <div class="form-group"><label>应用模块</label>
        <div style="display:flex;flex-wrap:wrap;gap:6px">${scopeOptions.map(s => `<label style="${scopeTagStyle(initScope.includes(s.id))}"><input type="checkbox" name="cp-scope" value="${esc(s.id)}" ${initScope.includes(s.id)?'checked':''} style="width:14px;height:14px;accent-color:var(--black)">${esc(s.name)}</label>`).join('')}</div>
      </div>
      <div class="modal-actions">
        <button class="btn btn-outline" id="cp-cancel">取消</button>
        <button class="btn btn-primary" id="cp-ok">${isEdit ? '保存' : '创建'}</button>
      </div>`;
  }

  let _modalOptions = initOptions.map(o => typeof o === 'string' ? { name: o, description: '' } : { ...o });

  modal.innerHTML = buildForm();
  overlay.classList.remove('hidden');

  const typeCardActive = 'display:block;padding:12px 14px;border:2px solid var(--black);border-radius:var(--radius-sm);cursor:pointer;font-size:13px;background:var(--light-gray);color:var(--text);text-align:center;transition:all .15s';
  const typeCardInactive = 'display:block;padding:12px 14px;border:2px solid var(--border);border-radius:var(--radius-sm);cursor:pointer;font-size:13px;background:var(--white);color:var(--text);text-align:center;transition:all .15s';
  const scopeTagActive = 'display:inline-flex;align-items:center;gap:6px;padding:5px 12px;border:2px solid var(--black);border-radius:var(--radius-pill);font-size:12px;cursor:pointer;background:var(--light-gray);color:var(--text);transition:all .15s';
  const scopeTagInactive = 'display:inline-flex;align-items:center;gap:6px;padding:5px 12px;border:2px solid var(--border);border-radius:var(--radius-pill);font-size:12px;cursor:pointer;background:var(--white);color:var(--text);transition:all .15s';

  modal.querySelectorAll('input[name="cp-type"]').forEach(radio => {
    radio.onchange = () => {
      const selectedType = modal.querySelector('input[name="cp-type"]:checked')?.value;
      if (selectedType === 'select' && _modalOptions.length === 0) {
        _modalOptions = [{ name: '未知', description: '' }];
      }
      modal.querySelector('#cp-ref-type-section').style.display = selectedType === 'reference' ? 'block' : 'none';
      modal.querySelector('#cp-multiselect-section').style.display = (selectedType === 'select' || selectedType === 'reference') ? 'block' : 'none';
      modal.querySelector('#cp-options-section').style.display = selectedType === 'select' ? 'block' : 'none';
      modal.querySelector('#cp-placeholder-section').style.display = selectedType === 'text' ? 'block' : 'none';
      modal.querySelectorAll('input[name="cp-type"]').forEach(r => {
        r.closest('label').style.cssText = r.checked ? typeCardActive : typeCardInactive;
      });
    };
  });

  modal.querySelectorAll('input[name="cp-scope"]').forEach(cb => {
    cb.onchange = () => {
      cb.closest('label').style.cssText = cb.checked ? scopeTagActive : scopeTagInactive;
    };
  });

  function syncOptionsToUI() {
    modal.querySelector('#cp-options-list').innerHTML = renderOptionsList(_modalOptions);
    bindOptionEvents();
  }

  function bindOptionEvents() {
    modal.querySelectorAll('.cp-opt-remove').forEach(btn => {
      btn.onclick = () => {
        const idx = parseInt(btn.dataset.optIdx);
        const optName = _modalOptions[idx] ? (typeof _modalOptions[idx] === 'string' ? _modalOptions[idx] : _modalOptions[idx].name) : '';
        if (optName === '未知') return;
        _modalOptions.splice(idx, 1);
        syncOptionsToUI();
      };
    });
    modal.querySelectorAll('.cp-opt-up').forEach(btn => {
      btn.onclick = () => {
        const idx = parseInt(btn.dataset.optIdx);
        if (idx <= 0) return;
        [_modalOptions[idx - 1], _modalOptions[idx]] = [_modalOptions[idx], _modalOptions[idx - 1]];
        syncOptionsToUI();
      };
    });
    modal.querySelectorAll('.cp-opt-down').forEach(btn => {
      btn.onclick = () => {
        const idx = parseInt(btn.dataset.optIdx);
        if (idx >= _modalOptions.length - 1) return;
        [_modalOptions[idx], _modalOptions[idx + 1]] = [_modalOptions[idx + 1], _modalOptions[idx]];
        syncOptionsToUI();
      };
    });
    modal.querySelectorAll('.cp-opt-insert').forEach(btn => {
      btn.onclick = () => {
        const idx = parseInt(btn.dataset.optIdx);
        _modalOptions.splice(idx, 0, { name: '', description: '' });
        syncOptionsToUI();
        const input = modal.querySelector(`.cp-opt-name[data-opt-idx="${idx}"]`);
        if (input) { input.focus(); input.select(); }
      };
    });
  }
  bindOptionEvents();

  const addOptBtn = modal.querySelector('#cp-add-option');
  if (addOptBtn) {
    addOptBtn.onclick = () => {
      _modalOptions.push({ name: '', description: '' });
      syncOptionsToUI();
      const inputs = modal.querySelectorAll('.cp-opt-name');
      const last = inputs[inputs.length - 1];
      if (last) { last.focus(); last.select(); }
    };
  }

  modal.querySelector('#cp-ok').onclick = () => {
    const name = modal.querySelector('#cp-name').value.trim();
    if (!name) { modal.querySelector('#cp-name').focus(); return; }
    const propType = modal.querySelector('input[name="cp-type"]:checked')?.value || 'select';
    const refType = modal.querySelector('#cp-ref-type')?.value || '';
    const multiSelect = modal.querySelector('#cp-multiselect')?.checked || false;
    const placeholder = modal.querySelector('#cp-placeholder')?.value || '';
    const scope = [...modal.querySelectorAll('input[name="cp-scope"]:checked')].map(cb => cb.value);
    if (scope.length === 0) { alert('请至少选择一个应用模块'); return; }

    if (propType === 'select') {
      modal.querySelectorAll('.cp-opt-name').forEach((input, i) => {
        if (_modalOptions[i]) {
          if (typeof _modalOptions[i] === 'string') _modalOptions[i] = { name: _modalOptions[i], description: '' };
          _modalOptions[i].name = input.value.trim() || _modalOptions[i].name;
        }
      });
      modal.querySelectorAll('.cp-opt-desc').forEach((input, i) => {
        if (_modalOptions[i]) {
          if (typeof _modalOptions[i] === 'string') _modalOptions[i] = { name: _modalOptions[i], description: '' };
          _modalOptions[i].description = input.value;
        }
      });
      _modalOptions = _modalOptions.filter(o => (typeof o === 'string' ? o : o.name).trim() !== '');
    }

    if (isEdit && existingProp) {
      const oldName = existingProp.name;
      existingProp.name = name;
      existingProp.type = propType;
      existingProp.refType = refType;
      existingProp.multiSelect = multiSelect;
      existingProp.placeholder = placeholder;
      const oldScope = existingProp.scope || [];
      existingProp.scope = scope;
      if (propType === 'select') {
        const oldOptNames = (existingProp.options || []).map(o => typeof o === 'string' ? o : o.name);
        const newOptNames = _modalOptions.map(o => typeof o === 'string' ? o : o.name);
        const removedOptNames = oldOptNames.filter(n => n !== '未知' && !newOptNames.includes(n));
        removedOptNames.forEach(removedName => {
          syncCustomPropOptionRefs(existingProp, removedName, null);
        });
        existingProp.options = _modalOptions.length > 0 ? _modalOptions : [{ name: '未知', description: '' }];
      } else if (propType === 'reference') {
        existingProp.options = [];
      } else {
        existingProp.options = [];
      }
      const removedScopes = oldScope.filter(s => !scope.includes(s));
      const key = 'cp_' + existingProp.id;
      removedScopes.forEach(s => {
        let list;
        if (s.startsWith('items_')) {
          const bpId = s.substring(6);
          list = (state.data.items || []).filter(i => i.backpackId === bpId);
        } else {
          list = state.data[s] || [];
        }
        list.forEach(item => { if (item.customProps && item.customProps[key] !== undefined) delete item.customProps[key]; });
      });
    } else {
      const newProp = {
        id: uid(),
        name,
        type: propType,
        scope,
        options: propType === 'select' ? (_modalOptions.length > 0 ? _modalOptions : [{ name: '未知', description: '' }]) : [],
        refType,
        multiSelect,
        placeholder
      };
      if (!state.data.propertyDefs.customProps) state.data.propertyDefs.customProps = [];
      state.data.propertyDefs.customProps.push(newProp);
    }
    autoSave();
    closeModal();
    renderTabContent();
  };

  modal.querySelector('#cp-cancel').onclick = () => closeModal();
  overlay.onclick = (e) => { if (e.target === overlay) closeModal(); };

  requestAnimationFrame(() => {
    const nameInput = modal.querySelector('#cp-name');
    if (nameInput) { nameInput.focus(); if (!isEdit) nameInput.select(); }
  });
}

function addCustomProp() { return openCustomPropModal(); }
function editCustomProp(index) { return openCustomPropModal(index); }

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

function insertCustomPropOption(propIndex, optIndex) {
  const prop = (state.data.propertyDefs.customProps || [])[propIndex];
  if (!prop) return;
  if (!prop.options) prop.options = [];
  prop.options.splice(optIndex, 0, { name: '', description: '' });
  autoSave();
  renderTabContent();
  setTimeout(() => {
    const input = document.querySelector(`input[data-cp-index="${propIndex}"][data-opt-index="${optIndex}"][data-field="name"]`);
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
        if (val === oldVal) { item.customProps[key] = newVal || '未知'; }
        if (Array.isArray(val) && val.includes(oldVal)) {
          item.customProps[key] = val.map(v => v === oldVal ? (newVal || '未知') : v);
        }
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

function insertPropCategory(beforeCatId, type) {
  if (!state.data.categories) state.data.categories = [];
  const idx = state.data.categories.findIndex(c => c.id === beforeCatId);
  if (idx === -1) return;
  const newCat = { id: uid(), type, name: '', description: '' };
  state.data.categories.splice(idx, 0, newCat);
  autoSave();
  renderTabContent();
  setTimeout(() => {
    const input = document.querySelector(`input[data-cat-id="${newCat.id}"][data-field="name"]`);
    if (input) { input.focus(); }
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
      const item = document.querySelector(`.prop-item[data-drag-id="${catId}"]`);
      if (item) { const idx = item.querySelector('.prop-index'); if (idx) idx.textContent = cat.name; }
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

function insertPropDef(propType, index) {
  if (!state.data.propertyDefs) return;
  const list = state.data.propertyDefs[propType];
  if (!list) return;
  const newName = propType === 'rarities' ? '' : '';
  list.splice(index, 0, { name: newName, description: '' });
  autoSave();
  renderTabContent();
  setTimeout(() => {
    const input = document.querySelector(`input[data-prop-type="${propType}"][data-prop-index="${index}"][data-field="name"]`);
    if (input) { input.focus(); }
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
      const row = document.querySelector(`.prop-item[data-drag-index="${index}"]`);
      if (row) {
        const idx = row.querySelector('.prop-index');
        if (idx) {
          idx.textContent = index + 1;
          if (propType === 'rarities') idx.style.color = getRarityColor(item.name);
        }
      }
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
  syncPropDefRefs(propType, name, '未知');
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