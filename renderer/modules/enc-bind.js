// ============================================================
// 世界百科 — 绑定/解绑功能
// ============================================================

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
  showModalOverlay();
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
    showModalOverlay();
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
  showModalOverlay();
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
    showModalOverlay();
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
  showModalOverlay();
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