// ============================================================
// 世界生成器 — 工具函数
// ============================================================

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);
function uid() { return 'id_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8); }
function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
function jsStr(s) { return String(s||'').replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/\n/g,'\\n').replace(/\r/g,''); }
function fmtDate(s) { if (!s) return ''; const d = new Date(s); return d.toLocaleDateString('zh-CN',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}); }
function autoSave() { clearTimeout(state._saveTimer); state._saveTimer = setTimeout(() => { if (state.currentProjectId && state.data) window.api.saveProject(state.currentProjectId, state.data); }, 500); }
function ensureData(key, defaultValue) { if (state.data[key] === undefined) state.data[key] = defaultValue; return state.data[key]; }
function checkDuplicate(collection, name, excludeId) { if (!name || !name.trim()) return false; return (collection || []).some(item => item.name === name.trim() && item.id !== excludeId); }

function showToast(msg, duration) {
  duration = duration || 2500;
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText = 'position:fixed;top:20px;right:20px;z-index:99999;display:flex;flex-direction:column;gap:8px;pointer-events:none';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.style.cssText = 'background:var(--black);color:var(--white);padding:10px 20px;border-radius:var(--radius-sm);font-size:14px;font-family:var(--font-body);box-shadow:0 4px 12px rgba(0,0,0,0.15);opacity:0;transform:translateX(20px);transition:opacity 0.3s,transform 0.3s;pointer-events:auto;max-width:360px';
  toast.textContent = msg;
  container.appendChild(toast);
  requestAnimationFrame(() => { toast.style.opacity = '1'; toast.style.transform = 'translateX(0)'; });
  setTimeout(() => {
    toast.style.opacity = '0'; toast.style.transform = 'translateX(20px)';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

function _normLinks(arr) {
  if (!arr) return [];
  return arr.map(x => {
    if (typeof x === 'string') return { id: x, desc: '' };
    if (x && typeof x === 'object' && x.id) return { id: x.id, desc: x.desc || '' };
    return null;
  }).filter(Boolean);
}

function _linkIds(arr) { return _normLinks(arr).map(l => l.id); }

function _findLink(arr, id) { return _normLinks(arr).find(l => l.id === id); }

function _setLink(arr, id, desc) {
  const links = _normLinks(arr);
  const existing = links.find(l => l.id === id);
  if (existing) { existing.desc = desc || existing.desc || ''; }
  else { links.push({ id, desc: desc || '' }); }
  return links;
}

function _removeLink(arr, id) { return _normLinks(arr).filter(l => l.id !== id); }

function syncLink(sourceType, sourceId, targetField, targetIds, desc, oldTargetIds) {
  const d = state.data;
  if (!d) return;
  const added = targetIds.filter(id => !oldTargetIds.includes(id));
  const removed = oldTargetIds.filter(id => !targetIds.includes(id));
  const reverseMap = {
    character: { factions: { reverseField: 'members', targetType: 'faction' }, locations: { reverseField: 'relatedCharacters', targetType: 'location' }, relatedEvents: { reverseField: 'characters', targetType: 'event' } },
    faction: { members: { reverseField: 'factions', targetType: 'character' }, headquarters: { reverseField: 'relatedFactions', targetType: 'location' }, rivals: { reverseField: 'rivals', targetType: 'faction' }, allies: { reverseField: 'allies', targetType: 'faction' }, relatedEvents: { reverseField: 'factions', targetType: 'event' } },
    location: { relatedCharacters: { reverseField: 'locations', targetType: 'character' }, events: { reverseField: 'locations', targetType: 'event' }, relatedFactions: { reverseField: 'headquarters', targetType: 'faction' } },
    event: { characters: { reverseField: 'relatedEvents', targetType: 'character' }, factions: { reverseField: 'relatedEvents', targetType: 'faction' }, locations: { reverseField: 'events', targetType: 'location' }, prerequisites: { reverseField: 'followUpEvents', targetType: 'event' }, followUpEvents: { reverseField: 'prerequisites', targetType: 'event' } },
    race: { regions: { reverseField: 'relatedRaces', targetType: 'location' }, relatedCharacters: { reverseField: 'race', targetType: 'character' } }
  };
  const mapping = reverseMap[sourceType] && reverseMap[sourceType][targetField];
  if (!mapping) return;
  const reverseField = mapping.reverseField;
  const targetType = mapping.targetType;
  const targetCollectionMap = { character: 'characters', faction: 'factions', location: 'locations', event: 'timeline', race: 'races' };
  const tColl = d[targetCollectionMap[targetType]];
  added.forEach(tid => {
    const targetEntity = tColl ? tColl.find(e => e.id === tid) : null;
    if (targetEntity) {
      if (!targetEntity[reverseField]) targetEntity[reverseField] = [];
      const existing = _findLink(targetEntity[reverseField], sourceId);
      if (!existing) {
        targetEntity[reverseField] = _setLink(targetEntity[reverseField], sourceId, desc || '');
      }
    }
  });
  removed.forEach(tid => {
    const targetEntity = tColl ? tColl.find(e => e.id === tid) : null;
    if (targetEntity && targetEntity[reverseField]) {
      targetEntity[reverseField] = _removeLink(targetEntity[reverseField], sourceId);
    }
  });
}

function getLinkDesc(arr, id) { const link = _findLink(arr, id); return link ? link.desc : ''; }

function renderRelFilter(stateKey, filterDefs) {
  const current = state[stateKey] || {};
  const parts = [];
  filterDefs.forEach(def => {
    const selected = current[def.key] || [];
    const count = selected.length;
    const label = count > 0 ? `${def.label}(${count})` : def.label;
    const btnClass = count > 0 ? 'filter-btn active' : 'filter-btn';
    if (def.grouped) {
      const groups = def.getGroups();
      if (groups.length === 0) return;
      const allItemIds = [];
      groups.forEach(g => g.items.forEach(it => { if (!allItemIds.includes(it.id)) allItemIds.push(it.id); }));
      if (allItemIds.length === 0) return;
      parts.push(`<div class="filter-pop-wrap" data-filter-key="${def.key}" data-state-key="${stateKey}">
        <button class="${btnClass}" onclick="toggleFilterPop(this)">${esc(label)}</button>
        <div class="filter-pop hidden">
          <input class="filter-search" placeholder="搜索物品..." oninput="filterGroupSearch(this)" onclick="event.stopPropagation()">
          <div class="filter-pop-list">${groups.map(g => `<div class="filter-group" data-group-id="${esc(g.id)}">
            <div class="filter-group-header" onclick="filterGroupToggle(this)"><span class="filter-group-arrow">▶</span>${esc(g.name)}<span class="filter-group-count">${g.items.length}</span></div>
            <div class="filter-group-items hidden">${g.items.map(it => {
              const checked = selected.includes(it.id);
              return `<label class="filter-pop-item${checked?' checked':''}"><input type="checkbox" value="${esc(it.id)}" ${checked?'checked':''} onchange="filterPopChange(this)"><span>${esc(it.name)}</span></label>`;
            }).join('')}</div>
          </div>`).join('')}</div>
        </div>
      </div>`);
    } else {
      const items = def.getItems();
      if (items.length === 0) return;
      parts.push(`<div class="filter-pop-wrap" data-filter-key="${def.key}" data-state-key="${stateKey}">
        <button class="${btnClass}" onclick="toggleFilterPop(this)">${esc(label)}</button>
        <div class="filter-pop hidden">
          <input class="filter-search" placeholder="搜索..." oninput="filterPopSearch(this)" onclick="event.stopPropagation()">
          <div class="filter-pop-list">${items.map(it => {
            const checked = selected.includes(it.id);
            return `<label class="filter-pop-item${checked?' checked':''}"><input type="checkbox" value="${esc(it.id)}" ${checked?'checked':''} onchange="filterPopChange(this)"><span>${esc(it.name)}</span></label>`;
          }).join('')}</div>
        </div>
      </div>`);
    }
  });
  if (parts.length === 0) return '';
  const hasAny = Object.values(current).some(v => v && v.length > 0);
  return `<div class="filter-bar">${hasAny ? `<button class="filter-btn-clear" onclick="state.${stateKey}={};renderTabContent()">✕ 清除</button>` : ''}${parts.join('')}</div>`;
}

function renderSearchBox(stateKey) {
  const val = state[stateKey] || '';
  const clearClick = `state.${stateKey}='';_searchRefreshList('${stateKey}')`;
  return `<div class="search-box-wrap" data-search-key="${stateKey}"><input class="search-input" type="text" placeholder="搜索..." value="${esc(val)}" oninput="_searchOnInput(this,'${stateKey}')" oncompositionstart="this._composing=true" oncompositionend="this._composing=false;_searchOnInput(this,'${stateKey}')">${val?`<button class="search-clear" onclick="${clearClick}">✕</button>`:''}</div>`;
}

const _searchTargets = {};
function registerSearchTarget(searchKey, containerId, renderFn, afterRefresh) { _searchTargets[searchKey] = { containerId, renderFn, afterRefresh }; }

function _searchOnInput(input, key) {
  state[key] = input.value;
  if (input._composing) return;
  _searchRefreshList(key);
}

function _searchRefreshList(key) {
  const target = _searchTargets[key];
  if (target) {
    const container = document.getElementById(target.containerId);
    if (container) container.innerHTML = target.renderFn();
    if (typeof target.afterRefresh === 'function') target.afterRefresh();
    return;
  }
  renderTabContent();
}

function matchSearch(name, stateKey) {
  const q = (state[stateKey] || '').toLowerCase().trim();
  if (!q) return true;
  return (name || '').toLowerCase().includes(q);
}

function toggleFilterPop(btn) {
  const wrap = btn.closest('.filter-pop-wrap');
  const key = wrap.dataset.filterKey;
  const stateKey = wrap.dataset.stateKey;
  const existingPop = document.getElementById('filter-pop-active');
  if (existingPop) { existingPop.remove(); if (existingPop.dataset.key === key && existingPop.dataset.stateKey === stateKey) return; }
  const pop = wrap.querySelector('.filter-pop');
  const clone = pop.cloneNode(true);
  clone.id = 'filter-pop-active';
  clone.dataset.key = key;
  clone.dataset.stateKey = stateKey;
  clone.classList.remove('hidden');
  const r = btn.getBoundingClientRect();
  clone.style.position = 'fixed';
  clone.style.left = r.left + 'px';
  clone.style.top = (r.bottom + 4) + 'px';
  clone.style.zIndex = '1000';
  document.body.appendChild(clone);
}

function filterPopSearch(input) {
  const q = input.value.toLowerCase();
  const list = input.nextElementSibling;
  list.querySelectorAll('.filter-pop-item').forEach(item => {
    const name = item.querySelector('span').textContent.toLowerCase();
    item.style.display = name.includes(q) ? '' : 'none';
  });
}

function filterGroupToggle(header) {
  const items = header.nextElementSibling;
  const arrow = header.querySelector('.filter-group-arrow');
  const wasHidden = items.classList.contains('hidden');
  items.classList.toggle('hidden', !wasHidden);
  arrow.textContent = wasHidden ? '▼' : '▶';
}

function filterGroupSearch(input) {
  const q = input.value.toLowerCase();
  const list = input.nextElementSibling;
  list.querySelectorAll('.filter-group').forEach(group => {
    const items = group.querySelectorAll('.filter-pop-item');
    let anyVisible = false;
    items.forEach(item => {
      const name = item.querySelector('span').textContent.toLowerCase();
      const match = name.includes(q);
      item.style.display = match ? '' : 'none';
      if (match) anyVisible = true;
    });
    group.style.display = anyVisible ? '' : 'none';
    if (anyVisible && q) {
      group.querySelector('.filter-group-items').classList.remove('hidden');
      group.querySelector('.filter-group-arrow').textContent = '▼';
    }
  });
}

function filterPopChange(checkbox) {
  const activePop = document.getElementById('filter-pop-active');
  const key = activePop ? activePop.dataset.key : checkbox.closest('.filter-pop-wrap')?.dataset.filterKey;
  const stateKey = activePop ? activePop.dataset.stateKey : checkbox.closest('.filter-pop-wrap')?.dataset.stateKey;
  if (!key || !stateKey) return;
  if (!state[stateKey]) state[stateKey] = {};
  if (!state[stateKey][key]) state[stateKey][key] = [];
  if (checkbox.checked) {
    if (!state[stateKey][key].includes(checkbox.value)) state[stateKey][key].push(checkbox.value);
  } else {
    state[stateKey][key] = state[stateKey][key].filter(id => id !== checkbox.value);
  }
  const label = checkbox.closest('label');
  if (label) label.classList.toggle('checked', checkbox.checked);
  renderTabContent();
}

function matchRelFilter(item, stateKey, linkDefs) {
  const f = state[stateKey];
  if (!f) return true;
  const activeKeys = Object.keys(f).filter(k => f[k] && f[k].length > 0);
  if (activeKeys.length === 0) return true;
  return activeKeys.every(key => {
    const def = linkDefs.find(d => d.key === key);
    if (!def) return true;
    if (def.matchFn) return def.matchFn(item, f[key]);
    const fields = def.fields || (def.field ? [def.field] : []);
    return fields.some(field => {
      const val = item[field];
      if (!val) return false;
      const arr = Array.isArray(val) ? val : [val];
      const links = _normLinks(arr);
      return links.some(l => f[key].includes(l.id));
    });
  });
}

function setupDragSort(config) {
  const { containerId, itemSelector, handleSelector, getArray, setArray, getId, afterSort } = config;
  const list = document.getElementById(containerId);
  if (!list) return;
  const ns = containerId.replace(/-/g, '_');
  if (window['_dsState_' + ns]) window['_dsState_' + ns] = null;
  else window['_dsState_' + ns] = null;
  let dragState = null;
  window['_dsState_' + ns] = dragState;
  if (window['_dsMD_' + ns]) list.removeEventListener('mousedown', window['_dsMD_' + ns]);
  if (window['_dsMM_' + ns]) document.removeEventListener('mousemove', window['_dsMM_' + ns]);
  if (window['_dsMU_' + ns]) document.removeEventListener('mouseup', window['_dsMU_' + ns]);
  window['_dsMD_' + ns] = function(ev) {
    const handle = ev.target.closest(handleSelector);
    if (!handle || ev.button !== 0) return;
    ev.preventDefault();
    const el = handle.closest(itemSelector);
    if (!el) return;
    const items = list.querySelectorAll(itemSelector);
    const idx = Array.from(items).indexOf(el);
    if (idx === -1) return;
    const rect = el.getBoundingClientRect();
    dragState = { idx, el, offsetY: ev.clientY - rect.top, startX: ev.clientX, startY: ev.clientY, moved: false, ghost: null, origEl: el };
    window['_dsState_' + ns] = dragState;
  };
  window['_dsMM_' + ns] = function(ev) {
    if (!dragState) return;
    const dx = ev.clientX - dragState.startX, dy = ev.clientY - dragState.startY;
    if (!dragState.moved && Math.abs(dx) + Math.abs(dy) < 5) return;
    dragState.moved = true;
    dragState.origEl.style.opacity = '0.3';
    if (!dragState.ghost) {
      const ghost = dragState.origEl.cloneNode(true);
      ghost.style.position = 'fixed'; ghost.style.zIndex = '10000'; ghost.style.pointerEvents = 'none'; ghost.style.opacity = '0.85';
      ghost.style.width = dragState.origEl.offsetWidth + 'px'; ghost.style.boxShadow = '0 8px 24px rgba(0,0,0,0.18)'; ghost.style.transition = 'none';
      document.body.appendChild(ghost); dragState.ghost = ghost;
    }
    dragState.ghost.style.left = dragState.origEl.getBoundingClientRect().left + 'px';
    dragState.ghost.style.top = (ev.clientY - dragState.offsetY) + 'px';
    list.querySelectorAll('.drag-drop-ind').forEach(el => el.remove());
    const items = list.querySelectorAll(itemSelector);
    for (let i = 0; i < items.length; i++) {
      const r = items[i].getBoundingClientRect();
      if (ev.clientY < r.top + r.height / 2) {
        const ind = document.createElement('div'); ind.className = 'drag-drop-ind'; ind.style.cssText = 'height:2px;background:var(--accent);border-radius:1px;margin:2px 0';
        items[i].before(ind); break;
      }
      if (i === items.length - 1) {
        const ind = document.createElement('div'); ind.className = 'drag-drop-ind'; ind.style.cssText = 'height:2px;background:var(--accent);border-radius:1px;margin:2px 0';
        items[i].after(ind);
      }
    }
  };
  window['_dsMU_' + ns] = function(ev) {
    if (!dragState) return;
    if (dragState.ghost) dragState.ghost.remove();
    dragState.origEl.style.opacity = '';
    list.querySelectorAll('.drag-drop-ind').forEach(el => el.remove());
    if (dragState.moved) {
      const arr = getArray();
      const items = list.querySelectorAll(itemSelector);
      let dropIdx = arr.length;
      for (let i = 0; i < items.length; i++) {
        const r = items[i].getBoundingClientRect();
        if (ev.clientY < r.top + r.height / 2) { dropIdx = i; break; }
      }
      const fromIdx = dragState.idx;
      if (fromIdx !== dropIdx && fromIdx !== dropIdx - 1) {
        const item = arr.splice(fromIdx, 1)[0];
        const insertAt = dropIdx > fromIdx ? dropIdx - 1 : dropIdx;
        arr.splice(insertAt, 0, item);
        setArray(arr);
        autoSave();
        if (afterSort) afterSort(); else renderTabContent();
      }
    }
    dragState = null;
    window['_dsState_' + ns] = null;
  };
  list.addEventListener('mousedown', window['_dsMD_' + ns]);
  document.addEventListener('mousemove', window['_dsMM_' + ns]);
  document.addEventListener('mouseup', window['_dsMU_' + ns]);
}

document.addEventListener('click', (e) => {
  if (!e.target.closest('.filter-pop-wrap') && !e.target.closest('#filter-pop-active')) {
    const p = document.getElementById('filter-pop-active');
    if (p) p.remove();
  }
});
document.addEventListener('scroll', () => {
  const p = document.getElementById('filter-pop-active');
  if (p) p.remove();
}, true);