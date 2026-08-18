// ============================================================
// 世界百科 — 渲染函数
// ============================================================

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