// ============================================================
// 世界生成器 — 词条 & 类别系统
// ============================================================

const CAT_TYPE_LABELS = {
  raceCategory: '🧬 种族分类',
  factionType: '🏰 势力类型',
  category: '📍 地点分类',
  itemType: '📦 物品类型',
  eventType: '⚡ 事件类型',
  resourceType: '📦 资源类别'
};

const SYSTEM_LOCKED_CATEGORIES = { resourceType: ['关系图', '头像'] };

function collectGlossary(type) {
  const d = state.data;
  if (!d) return [];
  const cats = (d.categories||[]).filter(c=>c.type===type);
  switch (type) {
    case 'race': return (d.races||[]).length > 0 ? (d.races||[]).map(r => r.name).sort() : [...new Set((d.characters||[]).map(c => c.race || c.profile).filter(Boolean))].sort();
    case 'raceCategory': { const names=cats.map(c=>c.name); const existing=[...new Set((d.races||[]).map(r=>r.category).filter(Boolean))]; return [...new Set([...names,...existing])]; }
    case 'role': { const preset=['主角','反派','重要配角','次要角色','NPC','路人']; const existing=[...new Set((d.characters||[]).map(c=>c.role).filter(Boolean))]; return [...new Set([...preset,...existing])]; }
    case 'gender': return [...new Set((d.characters||[]).map(c => c.gender).filter(Boolean))].sort();
    case 'category': { const names=cats.map(c=>c.name); const existing=[...new Set((d.locations||[]).map(l=>l.category).filter(Boolean))]; return [...new Set([...names,...existing])]; }
    case 'factionType': { const names=cats.map(c=>c.name); const existing=[...new Set((d.factions||[]).map(f=>f.type).filter(Boolean))]; return [...new Set([...names,...existing])]; }
    case 'itemType': { const names=cats.map(c=>c.name); const existing=[...new Set((d.items||[]).map(i=>i.type).filter(Boolean))]; return [...new Set([...names,...existing])]; }
    case 'eventType': { const names=cats.map(c=>c.name); const existing=[...new Set((d.timeline||[]).map(e=>e.type).filter(Boolean))]; return [...new Set([...names,...existing])]; }
    case 'resourceType': { const names=cats.map(c=>c.name); const existing=[...new Set((d.resources||[]).map(r=>r.category).filter(Boolean))]; return [...new Set([...names,...existing])]; }
    case 'skills': return [...new Set((d.characters||[]).flatMap(c => c.skills||[]))].sort();
    case 'faction': return (d.factions||[]).map(f => ({ id: f.id, name: f.name }));
    case 'location': return (d.locations||[]).map(l => ({ id: l.id, name: l.name }));
    case 'character': return (d.characters||[]).map(c => ({ id: c.id, name: c.name }));
    case 'event': return (d.timeline||[]).map(e => ({ id: e.id, name: e.name || e.title || '未命名事件' }));
    case 'item': return (d.items||[]).map(i => ({ id: i.id, name: i.name }));
    case 'encyclopediaSub': return (d.encyclopediaSubCategories||[]).map(s => ({ id: s.id, name: s.name }));
    default: return [];
  }
}

function renderEntrySelect(currentValue, entries, placeholder, onChange) {
  const isStrArr = Array.isArray(entries) && entries.length > 0 && typeof entries[0] === 'string';
  const hasValue = currentValue && currentValue !== '';
  const opts = isStrArr
    ? entries.map(e => `<option value="${esc(e)}"${currentValue===e?' selected':''}>${esc(e)}</option>`).join('')
    : entries.map(e => `<option value="${esc(e.id)}"${currentValue===e.id||currentValue===e.name?' selected':''}>${esc(e.name)}</option>`).join('');
  return `<select class="entry-select" onchange="${onChange}" style="width:100%"><option value="未知"${!hasValue?' selected':''}>未知</option>${opts}</select>`;
}

function renderEntryMultiSelect(selectedIds, entries, idField, labelField, onChangeFn) {
  if (!entries || entries.length === 0) return '<div class="text-xs text-muted" style="padding:4px 0">暂无可用词条</div>';
  const sel = new Set(selectedIds||[]);
  return entries.map((e, i) => {
    const id = idField ? e[idField] : e;
    const label = labelField ? e[labelField] : (typeof e === 'string' ? e : e.name);
    const checked = sel.has(id) || sel.has(label);
    const safeId = jsStr(String(id));
    return `<span class="entry-checkbox${checked?' active':''}" onclick="event.stopPropagation();var el=this;var was=el.classList.contains('active');var newVal=!was;${onChangeFn}('${safeId}',newVal);if(newVal){el.classList.add('active')}else{el.classList.remove('active')}" data-entry-id="${esc(String(id))}">${esc(label)}</span>`;
  }).join('');
}

function handleNewEntrySelect(selectEl, promptText, updateFn) {
  if (selectEl.value === '__new__') {
    customPrompt(promptText, '').then(name => {
      if (name && name.trim()) { updateFn(name.trim()); }
      selectEl.value = '';
    });
  }
}

function getCategoryDesc(type, name) {
  const cat = (state.data.categories||[]).find(c=>c.type===type&&c.name===name);
  return cat ? cat.description : '';
}

async function addCategory(type, callback) {
  const name = await customPrompt('新增类别名称', '');
  if (!name||!name.trim()) return;
  if (!state.data.categories) state.data.categories=[];
  if (state.data.categories.find(c=>c.type===type&&c.name===name.trim())) { showToast('该类别已存在'); return; }
  const desc = await customPrompt('类别简述（可留空）', '');
  state.data.categories.push({id:uid(),type,name:name.trim(),description:desc||''});
  autoSave();
  if (callback) callback(name.trim());
}

async function editCategoryDesc(type, name) {
  const cat = (state.data.categories||[]).find(c=>c.type===type&&c.name===name);
  if (!cat) { await addCategory(type); return; }
  const desc = await customPrompt('编辑类别简述', cat.description||'');
  if (desc===null) return;
  cat.description = desc;
  autoSave();
}

function renderCategorySelect(currentValue, catType, onChangeAction) {
  const entries = collectGlossary(catType);
  const hasValue = currentValue && currentValue !== '' && currentValue !== '未知';
  const desc = hasValue ? getCategoryDesc(catType, currentValue) : '';
  const opts = entries.map(e => `<option value="${esc(e)}"${currentValue===e?' selected':''}>${esc(e)}</option>`).join('');
  return `<select class="entry-select" onchange="${onChangeAction}" style="width:100%"><option value="未知"${!hasValue?' selected':''}>未知</option>${opts}</select>
  ${hasValue&&desc?`<div class="text-xs text-muted" style="margin-top:4px;padding-left:2px">${esc(desc)}</div>`:''}`;
}

function openCategoryManager() {
  const overlay = $('#modal-overlay');
  const modal = $('#modal-box');
  state._catSelected = null;
  renderCategoryManagerUI();
  overlay.classList.remove('hidden');
  overlay.onclick = (e) => { if (e.target === overlay) closeModal(); };
}

function renderCategoryManagerUI() {
  const modal = $('#modal-box');
  const cats = state.data.categories || [];
  const groups = {};
  Object.keys(CAT_TYPE_LABELS).forEach(t => { groups[t] = cats.filter(c => c.type === t); });
  const sel = state._catSelected;
  const selCat = sel ? cats.find(c => c.id === sel) : null;

  modal.innerHTML = `
    <h3 style="margin-bottom:16px">🏷️ 类别管理</h3>
    <div style="display:flex;gap:16px;min-height:400px">
      <div style="flex:1;min-width:0;border-right:1px solid var(--border);padding-right:16px;overflow-y:auto;max-height:500px">
        ${Object.entries(CAT_TYPE_LABELS).map(([type, label]) => `
          <div style="margin-bottom:16px">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
              <h4 style="margin:0">${label}</h4>
              <button class="btn btn-xs btn-outline" onclick="addCategoryToManager('${type}')">+ 新增</button>
            </div>
            ${(groups[type]||[]).length === 0 ? '<div class="text-xs text-muted" style="padding:4px 0">暂无类别</div>' :
              (groups[type]||[]).map(c => `
                <div class="card" style="margin:0 0 6px 0;padding:8px 12px;cursor:pointer;${sel===c.id?'border-color:var(--accent);background:var(--bg-alt)':''}" onclick="state._catSelected='${c.id}';renderCategoryManagerUI()">
                  <div style="display:flex;align-items:center;justify-content:space-between">
                    <span style="font-weight:500">${esc(c.name)}</span>
                    <div style="display:flex;gap:4px">
                      <button class="btn btn-xs" style="padding:2px 6px;font-size:11px;color:var(--warm-gray)" onclick="event.stopPropagation();editCategoryInManager('${c.id}')">✏️</button>
                      <button class="btn btn-xs" style="padding:2px 6px;font-size:11px;color:var(--warm-gray)" onclick="event.stopPropagation();deleteCategoryFromManager('${c.id}')">🗑️</button>
                    </div>
                  </div>
                  ${c.description?`<div class="text-xs text-muted" style="margin-top:4px">${esc(c.description).substring(0,50)}${c.description.length>50?'...':''}</div>`:''}
                </div>
              `).join('')}
            }
          </div>
        `).join('')}
      </div>
      <div style="flex:1;min-width:0;padding-left:16px">
        ${selCat ? `
          <div class="wiki-page" style="padding:0">
            <div class="wiki-header" style="padding-bottom:12px;border-bottom:1px solid var(--border)">
              <h2 style="margin:0">${CAT_TYPE_LABELS[selCat.type]||''} · ${esc(selCat.name)}</h2>
            </div>
            <div class="wiki-section" style="margin-top:12px">
              <div class="wiki-field"><span class="wiki-label">类别名称</span><span class="wiki-value">${esc(selCat.name)}</span></div>
              <div class="wiki-field"><span class="wiki-label">所属模块</span><span class="wiki-value">${CAT_TYPE_LABELS[selCat.type]||selCat.type}</span></div>
            </div>
            ${selCat.description?`<div class="wiki-section"><div class="wiki-section-title">简述</div><div class="wiki-value">${esc(selCat.description)}</div></div>`:`<div class="wiki-section"><div class="wiki-section-title">简述</div><div class="text-xs text-muted">暂无简述</div></div>`}
            <div style="margin-top:16px">
              <button class="btn btn-sm btn-outline" onclick="editCategoryInManager('${selCat.id}')">✏️ 编辑</button>
            </div>
          </div>
        ` : `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--warm-gray)">← 点击左侧类别查看详情</div>`}
      </div>
    </div>
    <div class="modal-actions" style="margin-top:16px">
      <button class="btn btn-outline" onclick="closeModal()">关闭</button>
    </div>`;
}

async function addCategoryToManager(type) {
  const name = await customPrompt('新增类别名称', '');
  if (!name || !name.trim()) return;
  if ((state.data.categories||[]).find(c => c.type === type && c.name === name.trim())) { showToast('该类别已存在'); return; }
  const desc = await customPrompt('类别简述（可留空）', '');
  if (!state.data.categories) state.data.categories = [];
  const newCat = { id: uid(), type, name: name.trim(), description: desc || '' };
  state.data.categories.push(newCat);
  autoSave();
  state._catSelected = newCat.id;
  renderCategoryManagerUI();
}

async function editCategoryInManager(catId) {
  const cat = (state.data.categories||[]).find(c => c.id === catId);
  if (!cat) return;
  const name = await customPrompt('类别名称', cat.name);
  if (name === null) return;
  if (name && name.trim() && name.trim() !== cat.name) {
    if ((state.data.categories||[]).find(c => c.type === cat.type && c.name === name.trim() && c.id !== catId)) { showToast('该类别已存在'); return; }
    const oldName = cat.name;
    cat.name = name.trim();
    renameCategoryRefs(cat.type, oldName, cat.name);
  }
  const desc = await customPrompt('类别简述', cat.description || '');
  if (desc !== null) cat.description = desc;
  autoSave();
  renderCategoryManagerUI();
}

async function deleteCategoryFromManager(catId) {
  const cat = (state.data.categories||[]).find(c => c.id === catId);
  if (!cat) return;
  if (!await customConfirm(`确定删除类别"${cat.name}"？`)) return;
  state.data.categories = (state.data.categories||[]).filter(c => c.id !== catId);
  if (state._catSelected === catId) state._catSelected = null;
  autoSave();
  renderCategoryManagerUI();
}

function renameCategoryRefs(type, oldName, newName) {
  const d = state.data;
  if (type === 'raceCategory') (d.races||[]).forEach(r => { if (r.category === oldName) r.category = newName; });
  if (type === 'factionType') (d.factions||[]).forEach(f => { if (f.type === oldName) f.type = newName; });
  if (type === 'category') (d.locations||[]).forEach(l => { if (l.category === oldName) l.category = newName; });
  if (type === 'itemType') (d.items||[]).forEach(i => { if (i.type === oldName) i.type = newName; });
  if (type === 'eventType') (d.timeline||[]).forEach(e => { if (e.type === oldName) e.type = newName; });
}