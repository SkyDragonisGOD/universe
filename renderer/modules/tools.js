// ============================================================
// 世界生成器 — 工具 (资源库存/备份)
// 依赖: core/state.js, core/utils.js, core/modal.js, core/properties.js
// ============================================================

// --- EMOJI LIBRARY ---
let _emojiLibDragData = null;
let _emojiLibActiveInput = null;

function _getEmojiLib() {
  if (!state.data.emojiLib) state.data.emojiLib = [];
  return state.data.emojiLib;
}

function _syncCatEmojiOrder(cat) {
  if (!state.data.emojiCatOrders) state.data.emojiCatOrders = {};
  const order = state.data.emojiCatOrders[cat] || [];
  const presets = new Set(EMOJI_CATEGORIES_LIB[cat] || []);
  const customs = new Set(_getEmojiLib().filter(em => em.category === cat).map(em => em.emoji));
  const allValid = new Set([...presets, ...customs]);
  const filtered = order.filter(e => allValid.has(e));
  for (const e of allValid) {
    if (!filtered.includes(e)) filtered.push(e);
  }
  state.data.emojiCatOrders[cat] = filtered;
  return filtered;
}

function renderEmojiLibSection() {
  const lib = _getEmojiLib();
  const seen = new Set();
  const unique = lib.filter(em => { if (seen.has(em.emoji)) return false; seen.add(em.emoji); return true; });
  return `<div style="margin-bottom:12px;padding:10px;background:var(--bg-alt);border-radius:var(--radius-sm)">
    <div class="flex-between mb-4"><span style="font-size:12px;font-weight:500">😀 自定义 Emoji 库</span><button class="btn btn-xs btn-outline" onclick="openEmojiLibManager()">⚙️ 管理</button></div>
    ${unique.length === 0 ? '<div style="font-size:11px;color:var(--muted)">暂无自定义 emoji，点击管理添加</div>' :
      `<div style="display:flex;flex-wrap:wrap;gap:4px">${unique.map(em =>
        `<span style="display:inline-flex;align-items:center;gap:2px;padding:2px 6px;background:var(--white);border:1px solid var(--border);border-radius:var(--radius-xs);font-size:16px;cursor:default" title="${esc(em.name||'')}">${esc(em.emoji)}</span>`
      ).join('')}</div>`}
  </div>`;
}

function _renderDraggableEmoji(emojiStr, cat, posIdx) {
  const lib = _getEmojiLib();
  const customEntry = lib.find(em => em.emoji === emojiStr && em.category === cat);
  const isCustom = !!customEntry;
  const libIdx = isCustom ? lib.indexOf(customEntry) : -1;
  const deleteBtnHtml = isCustom
    ? `<button style="position:absolute;top:-4px;right:-4px;width:14px;height:14px;border-radius:50%;background:var(--danger);color:var(--white);border:none;font-size:8px;cursor:pointer;display:none;align-items:center;justify-content:center;line-height:1" class="emoji-lib-del" onclick="event.stopPropagation();_emojiLibManagerRemove(${libIdx})">×</button>`
    : '';
  const clickAttr = !isCustom ? `onclick="_emojiLibManagerAdd('${emojiStr}')"` : '';
  const ctxAttr = isCustom ? `oncontextmenu="event.preventDefault();_emojiLibContextMenu(event,${libIdx})"` : 'oncontextmenu="event.preventDefault()"';
  return `<div class="emoji-lib-item" data-emoji-str="${esc(emojiStr)}" data-emoji-cat="${esc(cat)}" data-emoji-pos="${posIdx}" data-emoji-custom="${isCustom?'1':'0'}" draggable="true" ${clickAttr} ${ctxAttr} style="position:relative;display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;font-size:20px;background:var(--white);border:1px solid var(--border);border-radius:var(--radius-xs);cursor:grab;transition:all var(--transition)">${esc(emojiStr)}${deleteBtnHtml}</div>`;
}

function openEmojiLibManager() {
  const lib = _getEmojiLib();
  lib.forEach(em => { if (!em.category) em.category = '我的 Emoji'; });
  const overlay = $('#modal-overlay');
  const modal = $('#modal-box');
  const myOrder = _syncCatEmojiOrder('我的 Emoji');
  const myItems = myOrder.map((e, i) => _renderDraggableEmoji(e, '我的 Emoji', i)).join('');
  const myEmojiHtml = `<div class="emoji-cat"><div class="emoji-cat-title">⭐ 我的 Emoji</div><div class="emoji-grid" data-cat="我的 Emoji">${myItems}<span class="emoji-add-wrapper"><button class="emoji-btn emoji-add-btn" style="border-style:dashed;color:var(--muted)" onclick="_emojiLibShowAddInput('我的 Emoji',this)">＋</button></span></div></div>`;
  const categories = Object.entries(EMOJI_CATEGORIES_LIB).map(([cat]) => {
    const order = _syncCatEmojiOrder(cat);
    const items = order.map((e, i) => _renderDraggableEmoji(e, cat, i)).join('');
    return `<div class="emoji-cat"><div class="emoji-cat-title">${esc(cat)}</div><div class="emoji-grid" data-cat="${esc(cat)}">${items}<span class="emoji-add-wrapper"><button class="emoji-btn emoji-add-btn" style="border-style:dashed;color:var(--muted)" onclick="_emojiLibShowAddInput('${esc(cat)}',this)">＋</button></span></div></div>`;
  }).join('');
  modal.innerHTML = `
    <h3>😀 管理 Emoji 库</h3>
    <div style="max-height:400px;overflow-y:auto">${myEmojiHtml}${categories}</div>
    <div class="modal-actions">
      <button class="btn btn-outline" onclick="_emojiLibResetPresets()">🔄 重置预设</button>
      <div style="flex:1"></div>
      <button class="btn btn-outline" onclick="_emojiLibManagerCancel()">取消</button>
      <button class="btn btn-primary" onclick="_emojiLibManagerSave()">💾 保存</button>
    </div>`;
  overlay.classList.remove('hidden');
  overlay.onclick = (e) => { if (e.target === overlay) _emojiLibManagerCancel(); };
  if (!state._emojiLibBackup) state._emojiLibBackup = JSON.parse(JSON.stringify(lib));
  if (!state._emojiCatOrdersBackup) state._emojiCatOrdersBackup = JSON.parse(JSON.stringify(state.data.emojiCatOrders || {}));
  _setupEmojiLibDrag();
}

const EMOJI_CATEGORIES_LIB = {
  '武器': ['⚔️','🗡️','🏹','🔫','🛡️','💣','🪄','🔱','⚒️','🪓'],
  '魔法': ['✨','🔮','💫','🌟','⭐','🌙','☀️','⚡','🔥','❄️','💧','🌊','🌪️','💎','🧿'],
  '药剂': ['🧪','💊','🍷','🫧','🍵','🧴','🍯','🫖'],
  '食物': ['🍞','🧀','🥩','🍗','🍎','🍇','🫐','🥧','🎂','🍩'],
  '装备': ['👕','👖','🧥','👒','🎩','🧤','🥾','📿','💍','👑'],
  '工具': ['🔧','🔨','⛏️','🪝','🧲','🔑','🗝️','🔒','📐','🪬'],
  '书籍': ['📖','📜','📚','📓','📃','🏷️','🔖','📰'],
  '自然': ['🌿','🌸','🍄','🌲','🍁','🌺','🌻','🌱','🍀','🌾'],
  '动物': ['🐉','🦅','🐺','🐍','🦁','🐴','🦇','🐈','🦊','🐻'],
  '杂项': ['📦','🎒','💰','🎁','🎭','🧸','🎲','🃏','🎵','🔔','🕯️','🗺️','🧭','⏳','🪙','⚱️','🪦','🧿']
};

function _setupEmojiLibDrag() {
  document.querySelectorAll('.emoji-grid[data-cat]').forEach(grid => {
    grid.querySelectorAll('.emoji-lib-item').forEach(item => {
      item.addEventListener('dragstart', function(e) {
        _emojiLibDragData = { str: this.dataset.emojiStr, cat: this.dataset.emojiCat, pos: parseInt(this.dataset.emojiPos) };
        e.dataTransfer.setData('text/plain', this.dataset.emojiStr);
        this.style.opacity = '0.4';
      });
      item.addEventListener('dragend', function() {
        this.style.opacity = '1';
        _emojiLibDragData = null;
        grid.querySelectorAll('.emoji-lib-item').forEach(el => el.style.borderColor = 'var(--border)');
      });
      item.addEventListener('dragover', function(e) {
        e.preventDefault();
        if (_emojiLibDragData && _emojiLibDragData.cat === this.dataset.emojiCat) {
          this.style.borderColor = 'var(--accent)';
        }
      });
      item.addEventListener('dragleave', function() {
        this.style.borderColor = 'var(--border)';
      });
      item.addEventListener('drop', function(e) {
        e.preventDefault();
        this.style.borderColor = 'var(--border)';
        if (!_emojiLibDragData || _emojiLibDragData.cat !== this.dataset.emojiCat) return;
        const cat = _emojiLibDragData.cat;
        const fromPos = _emojiLibDragData.pos;
        const toPos = parseInt(this.dataset.emojiPos);
        if (fromPos === toPos || isNaN(fromPos) || isNaN(toPos)) return;
        const order = _syncCatEmojiOrder(cat);
        const [moved] = order.splice(fromPos, 1);
        order.splice(toPos, 0, moved);
        state.data.emojiCatOrders[cat] = order;
        openEmojiLibManager();
      });
      if (item.dataset.emojiCustom === '1') {
        item.addEventListener('mouseenter', function() {
          const del = this.querySelector('.emoji-lib-del');
          if (del) del.style.display = 'flex';
        });
        item.addEventListener('mouseleave', function() {
          const del = this.querySelector('.emoji-lib-del');
          if (del) del.style.display = 'none';
        });
      }
    });
  });
}

function _emojiLibManagerRemove(idx) {
  const lib = _getEmojiLib();
  const removed = lib[idx];
  if (removed && state.data.emojiCatOrders && state.data.emojiCatOrders[removed.category]) {
    state.data.emojiCatOrders[removed.category] = state.data.emojiCatOrders[removed.category].filter(e => e !== removed.emoji);
  }
  lib.splice(idx, 1);
  openEmojiLibManager();
}

function _emojiLibManagerAdd(emoji) {
  const lib = _getEmojiLib();
  if (!lib.find(em => em.emoji === emoji && em.category === '我的 Emoji')) {
    lib.push({ emoji, name: '', category: '我的 Emoji' });
    const myOrder = _syncCatEmojiOrder('我的 Emoji');
    if (!myOrder.includes(emoji)) myOrder.push(emoji);
    state.data.emojiCatOrders['我的 Emoji'] = myOrder;
  }
  openEmojiLibManager();
}

function _emojiLibCloseActiveInput() {
  if (!_emojiLibActiveInput) return;
  const ai = _emojiLibActiveInput;
  ai.submitted = true;
  if (ai.inputWrapperEl && ai.wrapperEl && ai.wrapperEl.contains(ai.inputWrapperEl)) {
    ai.wrapperEl.removeChild(ai.inputWrapperEl);
  }
  if (ai.btnEl) ai.btnEl.style.display = '';
  _emojiLibActiveInput = null;
}

function _emojiLibShowAddInput(category, btn) {
  _emojiLibCloseActiveInput();
  const wrapper = btn.parentElement;
  btn.style.display = 'none';
  const inputWrapper = document.createElement('div');
  inputWrapper.className = 'emoji-inline-input-wrapper';
  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = '请输入emoji';
  input.className = 'emoji-inline-input';
  inputWrapper.appendChild(input);
  wrapper.appendChild(inputWrapper);
  input.focus();
  const ctx = { submitted: false, wrapperEl: wrapper, btnEl: btn, inputWrapperEl: inputWrapper };
  const submitFn = () => {
    if (ctx.submitted) return;
    ctx.submitted = true;
    _emojiLibActiveInput = null;
    const val = input.value.trim();
    if (val) {
      const lib = _getEmojiLib();
      if (!lib.find(em => em.emoji === val && em.category === category)) {
        lib.push({ emoji: val, name: '', category });
      }
      const order = _syncCatEmojiOrder(category);
      if (!order.includes(val)) order.push(val);
      state.data.emojiCatOrders[category] = order;
    }
    openEmojiLibManager();
  };
  const closeFn = () => {
    if (ctx.submitted) return;
    ctx.submitted = true;
    _emojiLibActiveInput = null;
    if (wrapper.contains(inputWrapper)) wrapper.removeChild(inputWrapper);
    btn.style.display = '';
  };
  _emojiLibActiveInput = ctx;
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); submitFn(); }
    else if (e.key === 'Escape') closeFn();
  });
  input.addEventListener('blur', () => { setTimeout(() => { if (!ctx.submitted) submitFn(); }, 120); });
}

function _emojiLibResetPresets() {
  const lib = _getEmojiLib();
  lib.forEach(em => { if (!em.category) em.category = '我的 Emoji'; });
  if (!state.data.emojiCatOrders) state.data.emojiCatOrders = {};
  for (const [cat, presets] of Object.entries(EMOJI_CATEGORIES_LIB)) {
    const customs = lib.filter(em => em.category === cat).map(em => em.emoji);
    state.data.emojiCatOrders[cat] = [...presets, ...customs];
  }
  const myCustoms = lib.filter(em => em.category === '我的 Emoji').map(em => em.emoji);
  state.data.emojiCatOrders['我的 Emoji'] = [...myCustoms];
  openEmojiLibManager();
}

function _emojiLibContextMenu(e, idx) {
  const existing = document.getElementById('emoji-ctx-menu');
  if (existing) existing.remove();
  const menu = document.createElement('div');
  menu.id = 'emoji-ctx-menu';
  menu.style.cssText = `position:fixed;left:${e.clientX}px;top:${e.clientY}px;background:var(--white);border:1px solid var(--border);border-radius:var(--radius-sm);box-shadow:var(--shadow);z-index:10000;min-width:80px;padding:4px 0`;
  menu.innerHTML = `<div style="padding:6px 12px;cursor:pointer;font-size:12px;color:var(--danger);display:flex;align-items:center;gap:4px" onmouseover="this.style.background='var(--bg-alt)'" onmouseout="this.style.background=''" onclick="_emojiLibManagerRemove(${idx});document.getElementById('emoji-ctx-menu').remove()">🗑️ 删除</div>`;
  document.body.appendChild(menu);
  setTimeout(() => {
    const close = (ev) => {
      if (!menu.contains(ev.target)) { menu.remove(); document.removeEventListener('click', close); }
    };
    document.addEventListener('click', close);
  }, 0);
}

function _emojiLibManagerSave() {
  delete state._emojiLibBackup;
  delete state._emojiCatOrdersBackup;
  autoSave();
  closeModal();
  renderTabContent();
}

function _emojiLibManagerCancel() {
  if (state._emojiLibBackup) {
    state.data.emojiLib = state._emojiLibBackup;
    delete state._emojiLibBackup;
  }
  if (state._emojiCatOrdersBackup) {
    state.data.emojiCatOrders = state._emojiCatOrdersBackup;
    delete state._emojiCatOrdersBackup;
  }
  closeModal();
  renderTabContent();
}

function getEmojiPickerHtml(targetInputId) {
  const lib = _getEmojiLib();
  if (lib.length === 0) return '';
  const seen = new Set();
  const unique = lib.filter(em => { if (seen.has(em.emoji)) return false; seen.add(em.emoji); return true; });
  return `<div style="margin-top:4px;display:flex;flex-wrap:wrap;gap:2px">${unique.map(em =>
    `<span style="cursor:pointer;font-size:16px;padding:2px;border-radius:var(--radius-xs);border:1px solid transparent" onmouseover="this.style.background='var(--bg-alt)';this.style.borderColor='var(--border)'" onmouseout="this.style.background='';this.style.borderColor='transparent'" onclick="document.getElementById('${targetInputId}').value='${esc(em.emoji)}';document.getElementById('${targetInputId}').dispatchEvent(new Event('input'))" title="${esc(em.name||em.emoji)}">${esc(em.emoji)}</span>`
  ).join('')}</div>`;
}

// --- RESOURCES ---
function renderRules() {
  if (!state.data.resources) state.data.resources = [];
  ensurePropertyDefs();
  const resources = state.data.resources;
  const customProps = getCustomPropsForScope('resources');
  const selectedId = state.selectedResourceId;
  const selected = selectedId ? resources.find(r=>r.id===selectedId) : null;
  return `<div class="char-layout">
    <div class="char-list-panel">
      <div class="flex-between mb-8"><h3>📦 资源库存</h3><div class="flex-gap"><button class="btn btn-sm btn-primary" onclick="addResource()">+ 新建</button></div></div>
      ${renderEmojiLibSection()}
      ${renderSearchBox('resSearch')}
      <div id="resource-list" style="max-height:calc(100vh - 280px);overflow-y:auto">${renderResourceList()}</div>
    </div>
    <div class="char-detail-panel" id="resource-detail">${selected ? renderResourceDetail(selected) : '<div class="empty-state"><div class="icon">📦</div><p>选择左侧资源查看详情</p></div>'}</div>
  </div>`;
}

function renderResourceList() {
  const resources = state.data.resources || [];
  const q = (state.resSearch || '').toLowerCase().trim();
  let filtered = resources;
  if (q) filtered = filtered.filter(r => (r.title||'').toLowerCase().includes(q) || (r.category||'').toLowerCase().includes(q) || (r.note||'').toLowerCase().includes(q));
  if (filtered.length === 0) return '<div class="empty-state"><div class="icon">📦</div><p>暂无资源</p></div>';
  return filtered.map(r => {
    const icon = r.imageData ? '🖼️' : (r.category === '关系图' ? '🕸️' : '📄');
    const isSelected = state.selectedResourceId === r.id;
    return `<div class="char-list-item${isSelected?' selected':''}" data-res-id="${r.id}" onclick="selectResource('${esc(r.id)}')">
      <span style="flex-shrink:0">${icon}</span>
      <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(r.title||'未命名')}</span>
      <span class="text-xs text-muted">${esc(r.category||'')}</span>
    </div>`;
  }).join('');
}

function selectResource(id) {
  state.selectedResourceId = id;
  const list = $('#resource-list');
  if (list) list.innerHTML = renderResourceList();
  const detail = $('#resource-detail');
  const r = (state.data.resources||[]).find(res=>res.id===id);
  if (detail) detail.innerHTML = r ? renderResourceDetail(r) : '<div class="empty-state"><div class="icon">📦</div><p>选择左侧资源查看详情</p></div>';
}

function _renderResourceLinkedEntries(r) {
  const linkedEntries = r.linkedEntries || [];
  if (r.category === '关系图' && r.graphSubjects) {
    r.graphSubjects.forEach(sid => {
      const [typeKey, id] = sid.split(':');
      if (!linkedEntries.find(e => e.id === id)) {
        linkedEntries.push({ typeKey, id });
      }
    });
  }
  if (linkedEntries.length === 0) return '';
  const typeLabels = {character:'👤',faction:'🏰',location:'📍',item:'📦',event:'⚡'};
  return `<div class="wiki-section"><div class="wiki-section-title">关联词条</div>
    <div style="display:flex;flex-wrap:wrap;gap:4px">${linkedEntries.map(e => {
      let name = '未知';
      const typeMap = {character:state.data.characters,faction:state.data.factions,location:state.data.locations,item:state.data.items,event:state.data.timeline};
      const list = typeMap[e.typeKey] || [];
      const found = list.find(x=>x.id===e.id);
      if (found) name = found.name || found.title || '未知';
      const previewType = e.typeKey === 'event' ? 'event' : e.typeKey;
      return `<span style="cursor:pointer;padding:2px 8px;background:var(--bg-alt);border:1px solid var(--border);border-radius:var(--radius-xs);font-size:12px" onclick="showPreviewCard('${esc(previewType)}','${esc(e.id)}',event)">${typeLabels[e.typeKey]||'📄'} ${esc(name)}</span>`;
    }).join('')}</div></div>`;
}

function renderResourceDetail(r) {
  ensurePropertyDefs();
  const customProps = getCustomPropsForScope('resources');
  const cpData = r.customProps || {};
  const customPropHtml = renderCustomPropWikiHtml(customProps, cpData);
  const imageHtml = r.imageData ? `<div style="margin-bottom:12px"><img src="${esc(r.imageData)}" style="max-width:100%;max-height:300px;border-radius:var(--radius-sm);cursor:pointer;border:1px solid var(--border)" onclick="viewFullImage('${esc(r.id)}')"></div>` : '';
  const graphHtml = r.category === '关系图' && !r.imageData && r.graphSubjects ? renderResourceGraphPreview(r) : '';
  const linkedHtml = _renderResourceLinkedEntries(r);
  return `<div class="card detail-scroll-area">
    <div class="flex-between mb-8">
      <h3>${esc(r.title||'未命名资源')}</h3>
      <div class="flex-gap">
        <button class="btn btn-sm btn-outline" onclick="editResource('${esc(r.id)}')">✏️ 编辑</button>
        <button class="btn btn-sm btn-outline" onclick="saveResourceToLocal('${esc(r.id)}')">💾 保存到本地</button>
        <button class="btn btn-sm btn-danger" onclick="deleteResource('${esc(r.id)}')">🗑️ 删除</button>
      </div>
    </div>
    ${r.category ? `<div style="margin-bottom:8px"><span class="wiki-badge race">${esc(r.category)}</span></div>` : ''}
    ${r.category === '世界地图' && r.mapData ? _renderMapResourcePreview(r) : ''}
    ${imageHtml}
    ${graphHtml}
    ${linkedHtml}
    ${r.note ? `<div class="wiki-section"><div class="wiki-section-title">备注</div><div class="wiki-value">${esc(r.note)}</div></div>` : ''}
    ${customPropHtml ? `<div class="wiki-section">${customPropHtml}</div>` : ''}
  </div>`;
}

function _renderMapResourcePreview(r) {
  let info = '';
  try {
    const data = JSON.parse(r.mapData);
    const terrCount = (data.territories || []).length;
    const locCount = (data.locationMarkers || []).length;
    const bgLabel = data.bgType === 'land' ? '🏔️ 陆地' : '🌊 海洋';
    info = `${bgLabel} · ${terrCount} 领地 · ${locCount} 地点标注`;
  } catch (e) { info = '数据解析失败'; }
  return `<div style="margin-bottom:12px;padding:12px;background:var(--bg-alt);border-radius:var(--radius-sm)">
    <div style="font-size:12px;color:var(--muted);margin-bottom:8px">🗺️ 世界地图数据 — ${esc(info)}</div>
    <button class="btn btn-xs btn-primary" onclick="_importMapFromResource('${esc(r.id)}')">📥 导入到世界地图编辑器</button>
  </div>`;
}

async function _importMapFromResource(resId) {
  const res = (state.data.resources || []).find(r => r.id === resId);
  if (!res || !res.mapData) { showToast('该资源无地图数据'); return; }
  try {
    const data = JSON.parse(res.mapData);
    if (!state.data.worldMap) state.data.worldMap = { seed: 0, genCount: 12, territories: [], locationMarkers: [], nextId: 1 };
    const md = state.data.worldMap;
    if (data.seed) md.seed = data.seed;
    if (data.genCount) md.genCount = data.genCount;
    if (data.territories) md.territories = data.territories;
    if (data.locationMarkers) md.locationMarkers = data.locationMarkers;
    if (data.nextId) md.nextId = data.nextId;
    autoSave();
    switchTab('map');
    await new Promise(r => setTimeout(r, 100));
    if (typeof _terrainCache !== 'undefined') _terrainCache = null;
    if (typeof _mapFullRender === 'function') await _mapFullRender();
    if (typeof _updateTerritoryPanel === 'function') _updateTerritoryPanel();
    if (typeof _updateLocListPanel === 'function') _updateLocListPanel();
    if (typeof _updateTerritoryListPanel === 'function') _updateTerritoryListPanel();
    showToast('地图已导入');
  } catch (e) {
    showToast('导入失败: 数据格式错误');
  }
}

function renderResourceGraphPreview(r) {
  const subjects = (r.graphSubjects||[]).map(sid => {
    const [typeKey, id] = sid.split(':');
    return { typeKey, id };
  });
  const idList = subjects.map(s=>s.id);
  const allConns = _collectAllConnections(idList);
  const edges = _buildEdgeMap(allConns);
  return `<div style="margin-bottom:12px;padding:12px;background:var(--bg-alt);border-radius:var(--radius-sm)">
    <div style="font-size:12px;color:var(--muted);margin-bottom:8px">关系图预览 (${subjects.length} 主体, ${edges.length} 关联)</div>
    <canvas id="resource-graph-canvas-${r.id}" width="500" height="300" style="width:100%;background:var(--white);border-radius:var(--radius-xs)"></canvas>
  </div>`;
}

function setupRules() {
  const resources = state.data.resources || [];
  resources.forEach(r => {
    if (r.category === '关系图' && r.graphSubjects) {
      setTimeout(() => drawResourceGraph(r), 100);
    }
  });
  registerSearchTarget('resSearch', 'resource-list', renderResourceList);
}

function drawResourceGraph(r) {
  const canvas = $(`#resource-graph-canvas-${r.id}`);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0,0,w,h);
  ctx.fillStyle = '#fafaf8'; ctx.fillRect(0,0,w,h);
  const subjects = (r.graphSubjects||[]).map(sid => {
    const [typeKey, id] = sid.split(':');
    return { typeKey, id };
  });
  const typeColors = {character:'#3b82f6',faction:'#ef4444',location:'#22c55e',item:'#f59e0b',event:'#8b5cf6'};
  const typeIcons = {character:'👤',faction:'🏰',location:'📍',item:'📦',event:'⚡'};
  const entities = [];
  subjects.forEach(s => {
    let name = '未知', icon = typeIcons[s.typeKey]||'●';
    if (s.typeKey === 'character') { const c = (state.data.characters||[]).find(x=>x.id===s.id); if(c) name=c.name; }
    else if (s.typeKey === 'faction') { const f = (state.data.factions||[]).find(x=>x.id===s.id); if(f) name=f.name; }
    else if (s.typeKey === 'location') { const l = (state.data.locations||[]).find(x=>x.id===s.id); if(l) name=l.name; }
    else if (s.typeKey === 'item') { const i = (state.data.items||[]).find(x=>x.id===s.id); if(i) name=i.name; }
    else if (s.typeKey === 'event') { const e = (state.data.timeline||[]).find(x=>x.id===s.id); if(e) name=e.name||e.title; }
    entities.push({ id:s.id, name, icon, typeKey:s.typeKey });
  });
  if (entities.length === 0) { ctx.fillStyle='#777169'; ctx.font='13px "Microsoft YaHei",sans-serif'; ctx.textAlign='center'; ctx.fillText('无主体数据',w/2,h/2); return; }
  const idList = entities.map(e=>e.id);
  const allConns = _collectAllConnections(idList);
  const edges = _buildEdgeMap(allConns);
  const positions = {};
  const cx = w/2, cy = h/2, radius = Math.min(w,h)/2 - 40;
  const edgeColors = {
    'character|faction':'#ef4444', 'character|location':'#22c55e', 'character|item':'#f59e0b',
    'character|event':'#8b5cf6', 'faction|location':'#a855f7', 'faction|faction':'#dc2626',
    'character|character':'#3b82f6', 'location|event':'#06b6d4', 'item|location':'#84cc16',
    'faction|event':'#f97316', 'item|event':'#eab308'
  };
  entities.forEach((e, i) => {
    const angle = (Math.PI*2/entities.length)*i - Math.PI/2;
    positions[e.id] = { x: cx + radius*Math.cos(angle), y: cy + radius*Math.sin(angle), name: e.name, icon: e.icon, typeKey: e.typeKey };
  });
  edges.forEach(edge => {
    const posA = positions[edge.a], posB = positions[edge.b];
    if (!posA || !posB) return;
    const typeKey = [edge.aType, edge.bType].sort().join('|');
    const color = edgeColors[typeKey] || '#d69e2e';
    const hasA2B = edge.aToB && edge.aToB.trim();
    const hasB2A = edge.bToA && edge.bToA.trim();
    if (hasA2B && hasB2A) {
      if (edge.aToB.trim() === edge.bToA.trim()) {
        _drawLine(ctx, posA.x, posA.y, posB.x, posB.y, color, edge.aToB.trim());
      } else {
        _drawArrow(ctx, posA.x, posA.y, posB.x, posB.y, color, edge.aToB.trim(), 8);
        _drawArrow(ctx, posB.x, posB.y, posA.x, posA.y, color, edge.bToA.trim(), 8);
      }
    } else if (hasA2B) {
      _drawArrow(ctx, posA.x, posA.y, posB.x, posB.y, color, edge.aToB.trim(), 0);
    } else if (hasB2A) {
      _drawArrow(ctx, posB.x, posB.y, posA.x, posA.y, color, edge.bToA.trim(), 0);
    } else {
      _drawLine(ctx, posA.x, posA.y, posB.x, posB.y, color, '');
    }
  });
  entities.forEach(e => {
    const pos = positions[e.id]; if (!pos) return;
    const color = typeColors[e.typeKey] || '#000000';
    ctx.beginPath(); ctx.arc(pos.x, pos.y, 18, 0, Math.PI*2);
    ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.fillStyle = color; ctx.font = 'bold 11px "Microsoft YaHei",sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(e.icon||'●', pos.x, pos.y+4);
    ctx.fillStyle = '#1c1917'; ctx.font = '11px "Microsoft YaHei",sans-serif';
    ctx.fillText(e.name, pos.x, pos.y+34);
  });
  const legend = [...new Set(entities.map(e=>e.typeKey))].map(tk => ({ key:tk, icon:typeIcons[tk], label:{character:'角色',faction:'势力',location:'地点',item:'物品',event:'事件'}[tk]||tk }));
  if (legend.length > 1) {
    legend.forEach((t,i) => {
      const lx = 12, ly = 16 + i*18;
      ctx.fillStyle = typeColors[t.key] || '#000000';
      ctx.fillRect(lx, ly-8, 10, 10);
      ctx.fillStyle = '#777169'; ctx.font = '11px "Microsoft YaHei",sans-serif'; ctx.textAlign = 'left';
      ctx.fillText(t.icon+' '+t.label, lx+14, ly);
    });
  }
}

async function addResource() {
  const modal = $('#modal-box');
  const overlay = $('#modal-overlay');
  ensurePropertyDefs();
  const customProps = getCustomPropsForScope('resources');
  const tempCustomProps = {};
  const emojiPickerHtml = getEmojiPickerHtml('res-title');
  modal.innerHTML = `
    <h3>新建资源</h3>
    <div class="form-group"><label>标题</label><input id="res-title" placeholder="资源标题" style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);font-size:14px;font-family:var(--font-body)">${emojiPickerHtml}</div>
    <div class="form-group"><label>类别</label>${renderCategorySelect('','resourceType',"document.getElementById('res-category').value=this.value")}<input type="hidden" id="res-category" value=""></div>
    <div class="form-group"><label>备注</label><textarea id="res-note" rows="3" placeholder="备注说明" style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);font-size:14px;font-family:var(--font-body);resize:vertical"></textarea></div>
    <div class="form-group"><label>上传图片</label><input type="file" id="res-image" accept="image/*" style="width:100%;padding:6px;font-size:13px"></div>
    ${customProps.map(prop => {
      return renderCustomPropField(prop, '', `tempCustomProps['cp_${prop.id}']=this.value`);
    }).join('')}
    <div class="modal-actions">
      <button class="btn btn-outline" id="res-cancel">取消</button>
      <button class="btn btn-primary" id="res-ok">确定</button>
    </div>`;
  overlay.classList.remove('hidden');
  return new Promise((resolve) => {
    const finish = (val) => { closeModal(); resolve(val); };
    $('#res-ok').onclick = async () => {
      const title = ($('#res-title')||{}).value || '';
      if (!title.trim()) { showToast('请填写标题'); return; }
      const category = ($('#res-category')||{}).value || '';
      const note = ($('#res-note')||{}).value || '';
      let imageData = '';
      const fileInput = $('#res-image');
      if (fileInput && fileInput.files && fileInput.files[0]) {
        imageData = await readFileAsDataUrl(fileInput.files[0]);
      }
      const res = { id: uid(), title: title.trim(), category, note, imageData, customProps: {...tempCustomProps}, linkedEntries: [] };
      if (!state.data.resources) state.data.resources = [];
      state.data.resources.push(res);
      autoSave(); renderTabContent();
      finish(true);
    };
    $('#res-cancel').onclick = () => finish(false);
    overlay.onclick = (e) => { if (e.target === overlay) finish(false); };
  });
}

async function editResource(id) {
  const r = (state.data.resources||[]).find(res=>res.id===id);
  if (!r) return;
  ensurePropertyDefs();
  const customProps = getCustomPropsForScope('resources');
  const modal = $('#modal-box');
  const overlay = $('#modal-overlay');
  const editCustomProps = {...(r.customProps||{})};
  const emojiPickerHtml = getEmojiPickerHtml('res-edit-title');
  modal.innerHTML = `
    <h3>编辑资源</h3>
    <div class="form-group"><label>标题</label><input id="res-edit-title" value="${esc(r.title||'')}" style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);font-size:14px;font-family:var(--font-body)">${emojiPickerHtml}</div>
    <div class="form-group"><label>类别</label>${renderCategorySelect(r.category||'','resourceType',"document.getElementById('res-edit-category').value=this.value")}<input type="hidden" id="res-edit-category" value="${esc(r.category||'')}"></div>
    <div class="form-group"><label>备注</label><textarea id="res-edit-note" rows="3" style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);font-size:14px;font-family:var(--font-body);resize:vertical">${esc(r.note||'')}</textarea></div>
    ${r.imageData ? `<div style="margin-bottom:8px"><img src="${esc(r.imageData)}" style="max-width:200px;max-height:120px;border-radius:var(--radius-xs);border:1px solid var(--border)"><div style="margin-top:4px;display:flex;gap:6px"><button class="btn btn-xs btn-outline" onclick="viewFullImage('${esc(r.id)}')">🔍 放大</button><button class="btn btn-xs btn-danger" onclick="removeResourceImage('${esc(r.id)}')">🗑️ 移除图片</button></div></div>` : ''}
    <div class="form-group"><label>更换图片</label><input type="file" id="res-edit-image" accept="image/*" style="width:100%;padding:6px;font-size:13px"></div>
    ${customProps.map(prop => {
      const val = (r.customProps||{})['cp_'+prop.id] || '';
      return renderCustomPropField(prop, val, `editCustomProps['cp_${prop.id}']=this.value`);
    }).join('')}
    <div class="modal-actions">
      <button class="btn btn-outline" id="res-edit-cancel">取消</button>
      <button class="btn btn-primary" id="res-edit-ok">保存</button>
    </div>`;
  overlay.classList.remove('hidden');
  return new Promise((resolve) => {
    const finish = (val) => { closeModal(); resolve(val); };
    $('#res-edit-ok').onclick = async () => {
      r.title = ($('#res-edit-title')||{}).value || r.title;
      r.category = ($('#res-edit-category')||{}).value || '';
      r.note = ($('#res-edit-note')||{}).value || '';
      const fileInput = $('#res-edit-image');
      if (fileInput && fileInput.files && fileInput.files[0]) {
        r.imageData = await readFileAsDataUrl(fileInput.files[0]);
      }
      r.customProps = {...editCustomProps};
      autoSave(); renderTabContent();
      finish(true);
    };
    $('#res-edit-cancel').onclick = () => finish(false);
    overlay.onclick = (e) => { if (e.target === overlay) finish(false); };
  });
}

function removeResourceImage(id) {
  const r = (state.data.resources||[]).find(res=>res.id===id);
  if (!r) return;
  r.imageData = '';
  autoSave(); renderTabContent();
}

async function deleteResource(id) {
  if (!await customConfirm('确定删除此资源？')) return;
  state.data.resources = (state.data.resources||[]).filter(r=>r.id!==id);
  if (state.selectedResourceId===id) state.selectedResourceId=null;
  autoSave(); renderTabContent();
}

let _imageViewerZoom = 1;
let _imageViewerSrc = '';
let _imageViewerPanX = 0;
let _imageViewerPanY = 0;

function viewFullImage(id) {
  const r = (state.data.resources||[]).find(res=>res.id===id);
  if (!r || !r.imageData) return;
  _imageViewerSrc = r.imageData;
  _imageViewerZoom = 1;
  _imageViewerPanX = 0;
  _imageViewerPanY = 0;
  _renderImageViewer();
}

function _applyImageViewerTransform() {
  const img = document.getElementById('image-viewer-img');
  if (img) {
    img.style.transform = `translate(${_imageViewerPanX}px,${_imageViewerPanY}px) scale(${_imageViewerZoom})`;
  }
  const label = document.querySelector('#modal-box span[style*="font-size:12px"]');
  if (label) label.textContent = Math.round(_imageViewerZoom * 100) + '%';
}

function _renderImageViewer() {
  const overlay = $('#modal-overlay');
  const modal = $('#modal-box');
  modal.innerHTML = `<div style="text-align:center;overflow:hidden;max-height:90vh;position:relative">
    <div style="margin-bottom:8px;display:flex;justify-content:center;gap:6px;position:relative;z-index:1">
      <button class="btn btn-xs btn-outline" onclick="_imageViewerZoom=Math.max(0.1,_imageViewerZoom-0.2);_imageViewerPanX=0;_imageViewerPanY=0;_applyImageViewerTransform()">➖ 缩小</button>
      <span style="font-size:12px;line-height:28px">${Math.round(_imageViewerZoom*100)}%</span>
      <button class="btn btn-xs btn-outline" onclick="_imageViewerZoom=Math.min(5,_imageViewerZoom+0.2);_imageViewerPanX=0;_imageViewerPanY=0;_applyImageViewerTransform()">➕ 放大</button>
      <button class="btn btn-xs btn-outline" onclick="_imageViewerZoom=1;_imageViewerPanX=0;_imageViewerPanY=0;_applyImageViewerTransform()">🔄 1:1</button>
      <button class="btn btn-xs btn-outline" onclick="closeModal()">关闭</button>
    </div>
    <div id="image-viewer-scroll" style="overflow:hidden;max-height:80vh;display:flex;justify-content:center;align-items:center;cursor:grab;position:relative">
      <img id="image-viewer-img" src="${esc(_imageViewerSrc)}" style="transform:translate(${_imageViewerPanX}px,${_imageViewerPanY}px) scale(${_imageViewerZoom});transform-origin:center center;max-width:none;max-height:none;border-radius:var(--radius-sm);pointer-events:none;user-select:none">
    </div>
  </div>`;
  overlay.classList.remove('hidden');
  overlay.onclick = (e) => { if (e.target === overlay) closeModal(); };

  const scrollArea = document.getElementById('image-viewer-scroll');
  if (scrollArea) {
    scrollArea.onwheel = (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.15 : 0.15;
      _imageViewerZoom = Math.max(0.1, Math.min(5, _imageViewerZoom + delta));
      _applyImageViewerTransform();
    };

    let dragging = false;
    let dragStartX = 0, dragStartY = 0;
    let panStartX = 0, panStartY = 0;

    scrollArea.onmousedown = (e) => {
      dragging = true;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      panStartX = _imageViewerPanX;
      panStartY = _imageViewerPanY;
      scrollArea.style.cursor = 'grabbing';
      e.preventDefault();
    };

    scrollArea.onmousemove = (e) => {
      if (!dragging) return;
      _imageViewerPanX = panStartX + (e.clientX - dragStartX);
      _imageViewerPanY = panStartY + (e.clientY - dragStartY);
      _applyImageViewerTransform();
    };

    scrollArea.onmouseup = () => {
      if (dragging) {
        dragging = false;
        scrollArea.style.cursor = 'grab';
      }
    };

    scrollArea.onmouseleave = () => {
      if (dragging) {
        dragging = false;
        scrollArea.style.cursor = 'grab';
      }
    };
  }
}

function saveResourceToLocal(id) {
  const r = (state.data.resources||[]).find(res=>res.id===id);
  if (!r) return;
  if (r.imageData) {
    const link = document.createElement('a');
    link.href = r.imageData;
    const ext = r.imageData.includes('image/png') ? 'png' : (r.imageData.includes('image/jpeg') ? 'jpg' : 'png');
    link.download = (r.title || '资源') + '.' + ext;
    link.click();
    showToast('图片已保存到本地');
  } else {
    const data = {
      title: r.title,
      category: r.category,
      note: r.note,
      customProps: r.customProps || {},
      graphSubjects: r.graphSubjects || []
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = (r.title || '资源') + '.json';
    link.click();
    URL.revokeObjectURL(url);
    showToast('资源数据已保存到本地');
  }
}

function readFileAsDataUrl(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.readAsDataURL(file);
  });
}

function saveRelationGraphAsResource(subjectIds, title, note, imageData) {
  if (!state.data.resources) state.data.resources = [];
  const linkedEntries = subjectIds.map(sid => {
    const [typeKey, id] = sid.split(':');
    return { typeKey, id };
  });
  const res = {
    id: uid(),
    title: title || '关系图',
    category: '关系图',
    note: note || '',
    imageData: imageData || '',
    graphSubjects: subjectIds,
    linkedEntries,
    customProps: {}
  };
  state.data.resources.push(res);
  autoSave();
  showToast('关系图已保存到资源库存');
  return res.id;
}

function autoSaveAvatarToResources(charName, avatarData) {
  if (!avatarData) return;
  if (!state.data.resources) state.data.resources = [];
  const existing = state.data.resources.find(r => r.title === charName + '头像');
  if (existing) {
    existing.imageData = avatarData;
  } else {
    state.data.resources.push({
      id: uid(),
      title: charName + '头像',
      category: '头像',
      note: '',
      imageData: avatarData,
      linkedEntries: [],
      customProps: {}
    });
  }
  autoSave();
}

// --- BACKUP ---
function renderBackups() {
  const backups = state.data.backups || [];
  return `<div class="card"><h3>💾 备份管理</h3><p class="text-sm text-muted mb-16">创建项目快照，随时恢复</p>
    <div class="flex-gap mb-16"><button class="btn btn-sm btn-primary" onclick="createBackup()">📸 创建快照</button><button class="btn btn-sm btn-outline" onclick="exportProject()">📤 导出 ZIP</button></div>
    <div class="backups-list">${backups.length===0?'<div class="empty-state"><div class="icon">💾</div><p>暂无备份</p></div>':backups.map((b,i)=>`<div class="backup-item"><div><strong>${esc(b.name||'快照 '+fmtDate(b.createdAt))}</strong><div class="meta">${fmtDate(b.createdAt)}</div></div><div class="flex-gap"><button class="btn btn-xs btn-outline" onclick="restoreBackup(${i})">恢复</button><button class="btn btn-xs btn-danger" onclick="deleteBackup(${i})">删除</button></div></div>`).join('')}</div></div>`;
}

function setupBackups() {}
function createBackup() {
  if (!state.data.backups) state.data.backups = [];
  const snapshot = JSON.parse(JSON.stringify(state.data));
  delete snapshot.backups;
  state.data.backups.push({ name: state.data.project.name + ' - ' + new Date().toLocaleString('zh-CN'), createdAt: new Date().toISOString(), data: snapshot });
  autoSave(); renderTabContent();
}

async function restoreBackup(i) {
  if (!await customConfirm('恢复到此快照？当前数据将被覆盖！')) return;
  const backup = state.data.backups[i];
  if (backup && backup.data) {
    state.data.project = backup.data.project;
    delete backup.data.backups;
    Object.keys(backup.data).forEach(k => { if (k !== 'project' && k !== 'backups') state.data[k] = backup.data[k]; });
    autoSave(); renderTabContent();
  }
}

async function deleteBackup(i) {
  if (!await customConfirm('删除此备份？')) return;
  state.data.backups.splice(i, 1);
  autoSave(); renderTabContent();
}

function exportProject() {
  const data = JSON.stringify(state.data, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `world-backup-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}