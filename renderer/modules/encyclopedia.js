// ============================================================
// 世界生成器 — 世界百科 (主入口)
// 依赖: core/state.js, core/utils.js, core/modal.js, core/glossary.js,
//        core/properties.js, enc-shared, enc-render, enc-emoji, enc-bind, enc-template
// ============================================================

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

function setEncyclopediaItemCustomProp(propId, value) {
  const item = (state.data.encyclopediaItems || []).find(i => i.id === editEncyclopediaItemId);
  if (!item) return;
  if (!item.customProps) item.customProps = {};
  item.customProps['cp_' + propId] = value;
  autoSave();
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