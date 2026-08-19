// ============================================================
// 世界生成器 — 世界系统 / 物品 & 系统
// 依赖: core/state.js, core/utils.js, core/modal.js, core/glossary.js, core/properties.js
// ============================================================

let editItemId = null;
let _itemIsNew = false;

const EMOJI_CATEGORIES = {
  '武器': ['⚔️','🗡️','🏹','🔫','🛡️','💣','🪄','🔱','⚒️','🪓'],
  '魔法': ['✨','🔮','💫','🌟','⭐','🌙','☀️','⚡','🔥','❄️','💧','🌊','🌪️','💎','🧿'],
  '药剂': ['🧪','💊','🍷','🫧','🍵','🧴','🍯','🫖'],
  '食物': ['🍞','🧀','🥩','🍗','🍎','🍇','🫐','🥧','🎂','🍩'],
  '装备': ['👕','👖','🧥','👒','🎩','🧤','🥾','📿','💍','👑'],
  '工具': ['🔧','🔨','⛏️','🪝','🧲','🔑','🗝️','🔒','📐','🪬'],
  '书籍': ['📖','📜','📚','📓','📃','🏷️','🔖','📰'],
  '自然': ['🌿','🌸','🍄','🌲','🍁','🌺','🌻','🌱','🍀','🌾'],
  '动物': ['🐉','🦅','🐺','🐍','🦁','🐴','🦇','🐈','🦊','🐻'],
  '杂项': ['📦','🎒','💰','🎁','🎭','🧸','🎲','🃏','🎵','🔔','🕯️','🗺️','🧭','⏳','🪙','⚱️','🪦','🧿','📍','📌','🏕️','⛺','🏰','🏯','🏠','🏙️','⛰️','🌋','🏖️','🏝️']
};

function renderItems() {
  const returnBtn = state._mapReturnFromTab ? `<button class="btn btn-xs btn-outline" onclick="const t=state._mapReturnFromTab;state._mapReturnFromTab=null;switchTab(t||'map')" style="margin-right:4px">🗺️ 返回地图</button>` : '';
  const backpacks = state.data.worldBackpacks||[];
  const selectedBp = backpacks.find(bp=>bp.id===state.selectedItemId);
  const itemRelDefs = [
    { key:'character', label:'角色', field:'relatedCharacters', getItems:()=>collectGlossary('character') },
    { key:'faction', label:'势力', field:'relatedFactions', getItems:()=>(state.data.factions||[]).map(f=>({id:f.id,name:f.name||'未命名'})) },
    { key:'location', label:'地点', field:'relatedLocations', getItems:()=>collectGlossary('location') },
    { key:'event', label:'事件', field:'relatedEvents', getItems:()=>(state.data.timeline||[]).map(e=>({id:e.id,name:e.name||e.title||'未命名'})) },
  ];
  return `<div class="item-layout"><div class="item-list-panel"><div class="flex-between mb-8"><h3>🌍 世界系统</h3><div class="flex-gap">${returnBtn}<button class="btn btn-sm btn-primary" onclick="addBackpack()">+ 新建系统</button></div></div>
    ${renderSearchBox('itemSearch')}
    ${renderRelFilter('itemRelFilter', itemRelDefs)}
    <div id="item-list">${renderBackpackList()}</div></div>
    <div class="item-detail-panel">
      ${renderItemDetailPanel(selectedBp)}
    </div></div>`;
}

function renderItemDetailPanel(selectedBp) {
  if (state._selectedVariantId) {
    const v = _getVariantById(state._selectedVariantId);
    if (v && v.parentType === 'item') {
      if (state._editingVariantId === v.id) return _renderVariantEditPage(v);
      return _renderVariantDetailPage(v);
    }
    state._selectedVariantId = null;
    state._editingVariantId = null;
  }
  return selectedBp ? renderBackpackDetail(selectedBp) : '<div class="empty-state"><div class="icon">🎲</div><p>选择左侧系统查看详情</p></div>';
}

function renderBackpackList() {
  const backpacks = state.data.worldBackpacks||[];
  const allItems = state.data.items||[];
  const f = state.itemRelFilter;
  const itemRelMatchDefs = [
    { key:'character', field:'relatedCharacters' },
    { key:'faction', field:'relatedFactions' },
    { key:'location', field:'relatedLocations' },
    { key:'event', field:'relatedEvents' },
  ];
  const hasFilter = f && Object.values(f).some(v => v && v.length > 0);
  const q = (state.itemSearch || '').toLowerCase().trim();
  const matchBpSearch = (bp) => {
    if (!q) return true;
    if ((bp.name||'').toLowerCase().includes(q)) return true;
    return allItems.filter(i => i.backpackId === bp.id).some(i => (i.name||'').toLowerCase().includes(q));
  };
  if (q && !hasFilter) {
    const matchedBps = backpacks.filter(bp => (bp.name||'').toLowerCase().includes(q));
    const matchedItems = allItems.filter(i => (i.name||'').toLowerCase().includes(q));
    let html = '';
    if (matchedBps.length > 0) {
      html += `<div class="text-xs text-muted" style="padding:4px 8px;font-weight:600">🎲 系统</div>`;
      html += matchedBps.map(bp=>`<div class="item-list-item${state.selectedItemId===bp.id?' selected':''}" data-bp-id="${bp.id}">
        <span class="item-icon">${bp.icon||'🎲'}</span><span>${esc(bp.name)}</span>
        <span class="text-xs text-muted" style="margin-left:auto">${allItems.filter(i=>i.backpackId===bp.id).length}项</span>
      </div>`).join('');
    }
    if (matchedItems.length > 0) {
      html += `<div class="text-xs text-muted" style="padding:4px 8px;font-weight:600;margin-top:4px">📦 物品</div>`;
      html += matchedItems.map(i => {
        const bp = backpacks.find(b=>b.id===i.backpackId);
        return `<div class="item-list-item" data-item-id="${i.id}" data-bp-id="${i.backpackId}" style="padding-left:24px">
          <span class="item-icon">${i.icon||'📦'}</span><span>${esc(i.name)}</span>
          <span class="text-xs text-muted" style="margin-left:auto">${bp?esc(bp.name):''}</span>
        </div>`;
      }).join('');
    }
    if (matchedBps.length === 0 && matchedItems.length === 0) return '<div class="empty-state"><div class="icon">🎲</div><p>无匹配结果</p></div>';
    return html;
  }
  if (hasFilter) {
    const filteredBps = backpacks.filter(bp => {
      const bpItems = allItems.filter(i => i.backpackId === bp.id);
      return bpItems.some(item => matchRelFilter(item, 'itemRelFilter', itemRelMatchDefs));
    }).filter(matchBpSearch);
    if (filteredBps.length===0) return '<div class="empty-state"><div class="icon">🎲</div><p>无匹配系统</p></div>';
    return filteredBps.map(bp=>`<div class="item-list-item${state.selectedItemId===bp.id?' selected':''}" data-bp-id="${bp.id}">
      <span class="item-icon">${bp.icon||'🎲'}</span><span>${esc(bp.name)}</span>
      <span class="text-xs text-muted" style="margin-left:auto">${allItems.filter(i=>i.backpackId===bp.id).length}项</span>
    </div>`).join('');
  }
  if (backpacks.length===0) return '<div class="empty-state"><div class="icon">🎲</div><p>暂无系统，点击"+ 新建系统"创建</p></div>';
  return backpacks.filter(matchBpSearch).map(bp=>`<div class="item-list-item${state.selectedItemId===bp.id?' selected':''}" data-bp-id="${bp.id}">
    <span class="drag-handle" style="cursor:grab;font-size:10px;color:var(--muted);user-select:none">⠿</span>
    <span class="item-icon">${bp.icon||'🎲'}</span><span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(bp.name)}</span>
    <span class="text-xs text-muted">${allItems.filter(i=>i.backpackId===bp.id).length}项</span>
  </div>`).join('');
}

function renderBackpackDetail(bp) {
  const bpItems = (state.data.items||[]).filter(i=>i.backpackId===bp.id);
  return `<div class="card detail-scroll-area">
    <div class="flex-between">
      <div style="display:flex;align-items:center;gap:8px">
        <h3 style="margin:0">${bp.icon||'🎲'} ${esc(bp.name)}</h3>
        <button class="btn btn-xs btn-outline" onclick="openBpIconPicker('${esc(bp.id)}')">😀</button>
      </div>
      <div class="flex-gap">
        <button class="btn btn-sm btn-outline" onclick="renameBackpack()">✏️ 改名</button>
        <button class="btn btn-sm btn-primary" ${editItemId ? 'disabled style="opacity:0.5;cursor:not-allowed"' : ''} onclick="${editItemId ? '' : 'addItemToBackpack()'}">+ 添加物品</button>
        <button class="btn btn-sm btn-danger" onclick="deleteBackpack('${bp.id}')">🗑️ 删除</button>
      </div>
    </div>
    <p class="text-sm text-muted mb-8">${_renderLinkedContent(bp.description||'')}</p>
    ${bpItems.length===0 ? '<div class="empty-state"><div class="icon">📦</div><p>此系统为空，点击"+ 添加物品"添加</p></div>' : ''}
    ${editItemId ? renderBackpackItemEditForm(bpItems.find(i=>i.id===editItemId)) : ''}
    <div id="bp-items-list" style="margin-top:8px">
      ${bpItems.map(item => editItemId===item.id ? '' : renderBackpackItemCard(item)).join('')}
    </div>
  </div>`;
}

function renderBackpackItemCard(item) {
  const holder = (state.data.characters||[]).find(c=>(c.backpackItems||{})[item.backpackId]?.includes(item.id));
  return `<div class="bp-item-row" data-item-id="${item.id}" style="display:flex;align-items:center;gap:8px;padding:8px 10px;border:1px solid var(--border);border-radius:var(--radius-xs);margin-bottom:4px;background:var(--white);cursor:pointer" onclick="showItemDetail('${item.id}')" oncontextmenu="event.preventDefault();_showEntityCtxMenu(event,'item','${esc(item.id)}')">
    <span class="bp-item-drag" style="cursor:grab;font-size:10px;color:var(--warm-gray);user-select:none" title="拖拽排序">⠿</span>
    <span style="font-size:16px">${item.icon||'📦'}</span>
    <strong style="flex:1;font-size:13px">${esc(item.name)}${_renderVariantDropdown('item',item.id,item.name)}</strong>
    ${item.rarity ? `<span style="color:${getRarityColor(item.rarity)};font-size:11px">[${esc(getRarityLabel(item.rarity))}]</span>` : ''}
    ${item.type ? `<span class="text-xs text-muted">${esc(item.type)}</span>` : ''}
    ${holder ? `<span class="text-xs" style="color:var(--accent)">👤 ${esc(holder.name)}</span>` : ''}
    <button class="btn btn-xs btn-outline" onclick="event.stopPropagation();editBackpackItem('${item.id}')">✏️</button>
    <button class="btn btn-xs btn-danger" onclick="event.stopPropagation();deleteBackpackItem('${item.id}')">×</button>
  </div>${_renderVariantListItems('item',item.id)}`;
}

function showItemDetail(itemId) {
  const item = (state.data.items||[]).find(i=>i.id===itemId);
  if (!item) return;
  const bp = (state.data.worldBackpacks||[]).find(b=>b.id===item.backpackId);
  const holder = (state.data.characters||[]).find(c=>(c.backpackItems||{})[item.backpackId]?.includes(item.id));
  ensurePropertyDefs();
  const customProps = getCustomPropsForScope('items_' + item.backpackId);
  const cpData = item.customProps || {};
  const customPropHtml = renderCustomPropWikiHtml(customProps, cpData);
  const modal = $('#modal-box');
  const overlay = $('#modal-overlay');
  modal.innerHTML = `
    <h3>${item.icon||'📦'} ${esc(item.name)}</h3>
    <div style="display:flex;flex-direction:column;gap:8px">
      ${item.rarity ? `<div><span class="text-xs text-muted">稀有度</span><div style="font-size:13px;color:${getRarityColor(item.rarity)};cursor:pointer" onclick="openPropOptionDetail('稀有度','${esc(item.rarity)}','${esc(getRarityDesc(item.rarity))}','','switchTab(&quot;properties&quot;)')">${esc(getRarityLabel(item.rarity))}</div></div>` : ''}
      ${item.type ? `<div><span class="text-xs text-muted">类型</span><div style="font-size:13px;cursor:pointer" onclick="openCategoryDetail('itemType','${esc(item.type)}')">${esc(item.type)}</div></div>` : ''}
      ${customPropHtml?`<div>${customPropHtml}</div>`:''}
      ${bp ? `<div><span class="text-xs text-muted">所属系统</span><div style="font-size:13px">🎲 ${esc(bp.name)}</div></div>` : ''}
      ${holder ? `<div><span class="text-xs text-muted">持有者</span><div style="font-size:13px">👤 ${esc(holder.name)}</div></div>` : ''}
      ${item.description ? `<div><span class="text-xs text-muted">描述</span><div style="font-size:13px;white-space:pre-wrap">${_renderLinkedContent(item.description)}</div></div>` : ''}
      ${_normLinks(item.relatedCharacters).length>0?`<div><span class="text-xs text-muted">关联人物</span><div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:2px">${_normLinks(item.relatedCharacters).map(cl=>{const ch=(state.data.characters||[]).find(c=>c.id===cl.id);return ch?`<span class="wiki-tag skill">👤 ${esc(ch.name)}${cl.desc?' <span style="font-size:10px;color:var(--muted)">'+esc(cl.desc)+'</span>':''}</span>`:'';}).join('')}</div></div>`:''}
      ${_normLinks(item.relatedFactions).length>0?`<div><span class="text-xs text-muted">关联势力</span><div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:2px">${_normLinks(item.relatedFactions).map(fl=>{const fa=(state.data.factions||[]).find(f=>f.id===fl.id);return fa?`<span class="wiki-tag item">🏰 ${esc(fa.name)}${fl.desc?' <span style="font-size:10px;color:var(--muted)">'+esc(fl.desc)+'</span>':''}</span>`:'';}).join('')}</div></div>`:''}
      ${_normLinks(item.relatedLocations).length>0?`<div><span class="text-xs text-muted">关联地点</span><div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:2px">${_normLinks(item.relatedLocations).map(ll=>{const loc=(state.data.locations||[]).find(l=>l.id===ll.id);return loc?`<span class="wiki-tag skill">📍 ${esc(loc.name)}${ll.desc?' <span style="font-size:10px;color:var(--muted)">'+esc(ll.desc)+'</span>':''}</span>`:'';}).join('')}</div></div>`:''}
      ${_normLinks(item.relatedEvents).length>0?`<div><span class="text-xs text-muted">关联事件</span><div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:2px">${_normLinks(item.relatedEvents).map(el=>{const ev=(state.data.timeline||[]).find(e=>e.id===el.id);return ev?`<span class="wiki-tag item">⚡ ${esc(ev.name)}${el.desc?' <span style="font-size:10px;color:var(--muted)">'+esc(el.desc)+'</span>':''}</span>`:'';}).join('')}</div></div>`:''}
      ${_normLinks(item.relatedItems).length>0?`<div><span class="text-xs text-muted">关联物品</span>${(state.data.worldBackpacks||[]).map(bp=>{const bpLinks=_normLinks(item.relatedItems).filter(il=>{const it=(state.data.items||[]).find(i=>i.id===il.id);return it&&it.backpackId===bp.id;});if(bpLinks.length===0)return '';return `<div style="margin-top:2px"><span style="font-size:11px;color:var(--muted)">🎲 ${esc(bp.name)}</span><div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:2px">${bpLinks.map(il=>{const it=(state.data.items||[]).find(i=>i.id===il.id);return it?`<span class="wiki-tag item">${it.icon||'📦'} ${esc(it.name)}${il.desc?' <span style="font-size:10px;color:var(--muted)">'+esc(il.desc)+'</span>':''}</span>`:'';}).join('')}</div></div>`;}).join('')}</div>`:''}
      ${_normLinks(item.relatedVolumes).length>0?`<div><span class="text-xs text-muted">📑 关联卷</span><div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:2px">${_normLinks(item.relatedVolumes).map(vl=>{const vol=(state.data.outline||[]).find((v,i)=>i===parseInt(vl.id)||v.id===vl.id);return vol?`<span class="wiki-tag item">📖 ${esc(vol.title||'未命名卷')}</span>`:'';}).join('')}</div></div>`:''}
    </div>
    ${_renderVariantWikiSection('item',item.id)}
    <div class="modal-actions">
      <button class="btn btn-outline" onclick="closeModal()">关闭</button>
      <button class="btn btn-primary" onclick="closeModal();editBackpackItem('${item.id}')">✏️ 编辑</button>
    </div>`;
  showModalOverlay();
  overlay.onclick = (e) => { if (e.target === overlay) closeModal(); };
}

function renderBackpackItemEditForm(item) {
  if (!item) return '';
  ensurePropertyDefs();
  const customProps = getCustomPropsForScope('items_' + item.backpackId);
  if (!item.customProps) item.customProps = {};
  return `<div class="card" style="border:2px solid var(--accent);margin:8px 0">
    <div class="flex-between"><h4>✏️ 编辑物品</h4><div class="flex-gap">
      <button class="btn btn-sm btn-primary" onclick="saveBackpackItemEdit()">💾 保存</button>
      <button class="btn btn-sm btn-outline" onclick="cancelBackpackItemEdit()">取消</button>
    </div></div>
    <div class="form-row"><div class="form-group"><label>名称</label><input id="bp-item-name" value="${esc(item.name)}"></div>
    <div class="form-group"><label>图标</label><div style="display:flex;gap:6px;align-items:center"><input id="bp-item-icon" value="${esc(item.icon||'📦')}" style="flex:1"><button class="btn btn-xs btn-outline" onclick="openEmojiPicker()">😀</button></div></div></div>
    <div class="form-row"><div class="form-group"><label>类型</label>${renderCategorySelect(item.type||'','itemType',"document.getElementById('bp-item-type').value=this.value;document.getElementById('bp-item-type').dispatchEvent(new Event('change'))")}<input type="hidden" id="bp-item-type" value="${esc(item.type||'')}"></div>
    <div class="form-group"><label>稀有度</label>${renderRaritySelect(item.rarity||'', "document.getElementById('bp-item-rarity').value=this.value;document.getElementById('bp-item-rarity').dispatchEvent(new Event('change'))")}<input type="hidden" id="bp-item-rarity" value="${esc(item.rarity||'')}"></div></div>
    ${customProps.map(prop => {
      const key = 'cp_' + prop.id;
      const val = item.customProps[key] || '';
      return renderCustomPropField(prop, val, `setItemCustomProp('${prop.id}',this.value)`);
    }).join('')}
    <div class="form-group"><label>描述</label><textarea id="bp-item-desc" rows="3" style="width:100%;padding:8px 12px;background:var(--white);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--black);font-size:14px;font-family:var(--font-body);resize:vertical">${esc(item.description||'')}</textarea></div>
    <div class="card"><h4>关联</h4>
      <div class="form-group"><label>关联人物</label>
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <span class="text-xs text-muted">已选 ${_normLinks(item.relatedCharacters).length} 个</span>
          <button class="btn btn-xs btn-outline" onclick="openItemLinkModal('${esc(item.id)}','relatedCharacters')">选择</button>
        </div>
        ${_normLinks(item.relatedCharacters).length>0?`<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px">${_normLinks(item.relatedCharacters).map(cl=>{const ch=(state.data.characters||[]).find(c=>c.id===cl.id);return ch?`<span class="wiki-tag skill">👤 ${esc(ch.name)}${cl.desc?' <span style="font-size:10px;color:var(--muted)">'+esc(cl.desc)+'</span>':''}<button class="btn btn-xs btn-icon btn-danger" style="font-size:8px;margin-left:2px" onclick="removeItemLink('${esc(item.id)}','relatedCharacters','${esc(cl.id)}')">×</button></span>`:'';}).join('')}</div>`:''}
      </div>
      <div class="form-group"><label>关联势力</label>
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <span class="text-xs text-muted">已选 ${_normLinks(item.relatedFactions).length} 个</span>
          <button class="btn btn-xs btn-outline" onclick="openItemLinkModal('${esc(item.id)}','relatedFactions')">选择</button>
        </div>
        ${_normLinks(item.relatedFactions).length>0?`<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px">${_normLinks(item.relatedFactions).map(fl=>{const fa=(state.data.factions||[]).find(f=>f.id===fl.id);return fa?`<span class="wiki-tag item">🏰 ${esc(fa.name)}${fl.desc?' <span style="font-size:10px;color:var(--muted)">'+esc(fl.desc)+'</span>':''}<button class="btn btn-xs btn-icon btn-danger" style="font-size:8px;margin-left:2px" onclick="removeItemLink('${esc(item.id)}','relatedFactions','${esc(fl.id)}')">×</button></span>`:'';}).join('')}</div>`:''}
      </div>
      <div class="form-group"><label>关联地点</label>
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <span class="text-xs text-muted">已选 ${_normLinks(item.relatedLocations).length} 个</span>
          <button class="btn btn-xs btn-outline" onclick="openItemLinkModal('${esc(item.id)}','relatedLocations')">选择</button>
        </div>
        ${_normLinks(item.relatedLocations).length>0?`<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px">${_normLinks(item.relatedLocations).map(ll=>{const loc=(state.data.locations||[]).find(l=>l.id===ll.id);return loc?`<span class="wiki-tag skill">📍 ${esc(loc.name)}${ll.desc?' <span style="font-size:10px;color:var(--muted)">'+esc(ll.desc)+'</span>':''}<button class="btn btn-xs btn-icon btn-danger" style="font-size:8px;margin-left:2px" onclick="removeItemLink('${esc(item.id)}','relatedLocations','${esc(ll.id)}')">×</button></span>`:'';}).join('')}</div>`:''}
      </div>
      <div class="form-group"><label>关联事件</label>
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <span class="text-xs text-muted">已选 ${_normLinks(item.relatedEvents).length} 个</span>
          <button class="btn btn-xs btn-outline" onclick="openItemLinkModal('${esc(item.id)}','relatedEvents')">选择</button>
        </div>
        ${_normLinks(item.relatedEvents).length>0?`<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px">${_normLinks(item.relatedEvents).map(el=>{const ev=(state.data.timeline||[]).find(e=>e.id===el.id);return ev?`<span class="wiki-tag item">⚡ ${esc(ev.name)}${el.desc?' <span style="font-size:10px;color:var(--muted)">'+esc(el.desc)+'</span>':''}<button class="btn btn-xs btn-icon btn-danger" style="font-size:8px;margin-left:2px" onclick="removeItemLink('${esc(item.id)}','relatedEvents','${esc(el.id)}')">×</button></span>`:'';}).join('')}</div>`:''}
      </div>
      <div class="form-group"><label>关联物品</label>
        ${(state.data.worldBackpacks||[]).length === 0 ? '<div class="text-xs text-muted">暂无背包系统</div>' : (state.data.worldBackpacks||[]).map(bp => {
          const bpItems = (state.data.items||[]).filter(i=>i.backpackId===bp.id && i.id!==item.id);
          const selectedInBp = _normLinks(item.relatedItems).filter(il => { const it = (state.data.items||[]).find(i=>i.id===il.id); return it && it.backpackId===bp.id; });
          return `<div style="margin-bottom:6px;padding:6px 8px;background:var(--bg-alt);border-radius:var(--radius-xs)">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
              <span style="font-size:12px;font-weight:500">🎲 ${esc(bp.name)}</span>
              <span class="text-xs text-muted">已选 ${selectedInBp.length} 项</span>
              ${bpItems.length>0 ? `<button class="btn btn-xs btn-outline" onclick="openItemBackpackLinkModal('${esc(item.id)}','${esc(bp.id)}')">选择</button>` : '<span class="text-xs text-muted">空</span>'}
            </div>
            ${selectedInBp.length>0 ? `<div style="display:flex;flex-wrap:wrap;gap:3px">${selectedInBp.map(il=>{const it=bpItems.find(i=>i.id===il.id);return it?`<span class="wiki-tag item">${it.icon||'📦'} ${esc(it.name)}${il.desc?' <span style="font-size:10px;color:var(--muted)">'+esc(il.desc)+'</span>':''}<button class="btn btn-xs btn-icon btn-danger" style="font-size:8px;margin-left:2px" onclick="removeItemLink('${esc(item.id)}','relatedItems','${esc(il.id)}')">×</button></span>`:'';}).join('')}</div>` : ''}
          </div>`;
        }).join('')}
      </div>
      <div class="form-group"><label>📑 关联卷</label>
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <span class="text-xs text-muted">已选 ${_normLinks(item.relatedVolumes).length} 个</span>
          <button class="btn btn-xs btn-outline" onclick="openItemVolumeModal('${esc(item.id)}')">选择卷</button>
        </div>
        ${_normLinks(item.relatedVolumes).length>0?`<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px">${_normLinks(item.relatedVolumes).map(vl=>{const vol=(state.data.outline||[]).find((v,i)=>i===parseInt(vl.id)||v.id===vl.id);return vol?`<span class="wiki-tag item">📖 ${esc(vol.title||'未命名卷')}<button class="btn btn-xs btn-icon btn-danger" style="font-size:8px;margin-left:2px" onclick="removeItemVolume('${esc(item.id)}','${esc(vl.id)}')">×</button></span>`:'';}).join('')}</div>`:''}
      </div>
    </div>
    ${_renderVariantSection('item',item.id,item.name)}
  </div>`;
}

function saveBackpackItemEdit() {
  const item = (state.data.items||[]).find(i=>i.id===editItemId);
  if (!item) return;
  const newName = ($('#bp-item-name')||{}).value || item.name;
  if (checkDuplicate(state.data.items, newName, item.id)) {
    showToast('已存在同名物品！');
    return;
  }
  item.name = newName;
  item.icon = ($('#bp-item-icon')||{}).value || item.icon;
  item.type = ($('#bp-item-type')||{}).value || '';
  item.rarity = ($('#bp-item-rarity')||{}).value || '';
  item.description = ($('#bp-item-desc')||{}).value || '';
  editItemId = null;
  _itemIsNew = false;
  autoSave();
  state._forceAnimate=true; state._animateScope='detail'; renderTabContent();
}

function setItemCustomProp(propId, value) {
  const item = (state.data.items||[]).find(i=>i.id===editItemId);
  if (!item) return;
  if (!item.customProps) item.customProps = {};
  item.customProps['cp_' + propId] = value;
  autoSave();
}

async function openItemVolumeModal(itemId) {
  const item=(state.data.items||[]).find(i=>i.id===itemId); if (!item) return;
  const outline=state.data.outline||[];
  if(outline.length===0){showToast('暂无卷');return;}
  const volItems=outline.map((v,i)=>({id:String(i),name:v.title||('第'+(i+1)+'卷')}));
  const existingIds=_normLinks(item.relatedVolumes||[]).map(l=>l.id);
  const result=await customSelectModal('📑 选择关联卷',volItems,existingIds);
  if(result===null) return;
  if(!item.relatedVolumes) item.relatedVolumes=[];
  item.relatedVolumes=result.map(id=>({id}));
  autoSave();
  renderTabContent();
}
function removeItemVolume(itemId,volId) {
  const item=(state.data.items||[]).find(i=>i.id===itemId); if (!item) return;
  item.relatedVolumes=_normLinks(item.relatedVolumes||[]).filter(l=>l.id!==volId).map(l=>({id:l.id,desc:l.desc}));
  autoSave();
  renderTabContent();
}

async function openItemLinkModal(itemId,field) {
  const item=(state.data.items||[]).find(i=>i.id===itemId); if (!item) return;
  let pool=[],label='';
  if(field==='relatedCharacters'){pool=collectGlossary('character');label='👤 选择关联人物';}
  else if(field==='relatedFactions'){pool=collectGlossary('faction');label='🏰 选择关联势力';}
  else if(field==='relatedLocations'){pool=collectGlossary('location');label='📍 选择关联地点';}
  else if(field==='relatedEvents'){pool=(state.data.timeline||[]).map(e=>({id:e.id,name:e.name||'未命名事件'}));label='⚡ 选择关联事件';}
  else if(field==='relatedItems'){showToast('请通过背包分组选择关联物品');return;}
  if(pool.length===0){showToast('暂无可选项');return;}
  const result=await customLinkModal(label,pool,item[field]||[],'简述关系');
  if(result===null) return;
  item[field]=result;
  autoSave();
  renderTabContent();
}
function removeItemLink(itemId,field,linkId) {
  const item=(state.data.items||[]).find(i=>i.id===itemId); if (!item) return;
  item[field]=_normLinks(item[field]||[]).filter(l=>l.id!==linkId).map(l=>({id:l.id,desc:l.desc}));
  autoSave();
  renderTabContent();
}

async function openItemBackpackLinkModal(itemId, bpId) {
  const item=(state.data.items||[]).find(i=>i.id===itemId); if (!item) return;
  const bp=(state.data.worldBackpacks||[]).find(b=>b.id===bpId); if (!bp) return;
  const bpItems=(state.data.items||[]).filter(i=>i.backpackId===bpId && i.id!==itemId);
  if (bpItems.length===0) { showToast('此背包为空'); return; }
  const existingLinks = _normLinks(item.relatedItems||[]);
  const existingInBp = existingLinks.filter(l => { const it = (state.data.items||[]).find(i=>i.id===l.id); return it && it.backpackId===bpId; });
  const options = bpItems.map(i=>({id:i.id, name:(i.icon||'📦')+' '+i.name}));
  const result = await customLinkModal('🎲 '+bp.name+' — 选择关联物品', options, existingInBp, '简述关系');
  if (result === null) return;
  const otherLinks = existingLinks.filter(l => { const it = (state.data.items||[]).find(i=>i.id===l.id); return !it || it.backpackId !== bpId; });
  item.relatedItems = [...otherLinks, ...result];
  autoSave();
  renderTabContent();
}

function openEmojiPicker() {
  const modal = $('#modal-box');
  const overlay = $('#modal-overlay');
  const _seen = new Set();
  const customLib = (state.data.emojiLib || []).filter(em => { if (_seen.has(em.emoji)) return false; _seen.add(em.emoji); return true; }).map(em => em.emoji);
  const customLibHtml = customLib.length > 0 ? `<div class="emoji-cat"><div class="emoji-cat-title">⭐ 自定义 Emoji</div><div class="emoji-grid">${customLib.map(e => `<button class="emoji-btn" onclick="selectEmoji('${e}')">${e}</button>`).join('')}</div></div>` : '';
  const categories = Object.entries(EMOJI_CATEGORIES).map(([cat, emojis]) => {
    return `<div class="emoji-cat"><div class="emoji-cat-title">${esc(cat)}</div><div class="emoji-grid">${emojis.map(e => `<button class="emoji-btn" onclick="selectEmoji('${e}')">${e}</button>`).join('')}</div></div>`;
  }).join('');
  modal.innerHTML = `
    <h3>选择图标</h3>
    <div class="form-group"><label>自定义输入</label><input id="emoji-custom-input" placeholder="输入emoji或文字" style="width:100%;padding:8px 12px;font-size:14px"></div>
    <div style="max-height:350px;overflow-y:auto">${customLibHtml}${categories}</div>
    <div class="modal-actions">
      <button class="btn btn-outline" onclick="closeModal()">取消</button>
      <button class="btn btn-primary" id="emoji-ok-btn">确定</button>
    </div>`;
  showModalOverlay();
  $('#emoji-ok-btn').onclick = () => { selectEmoji(($('#emoji-custom-input')||{}).value || '📦'); };
  overlay.onclick = (e) => { if (e.target === overlay) closeModal(); };
}

function selectEmoji(emoji) {
  const input = $('#bp-item-icon');
  if (input) input.value = emoji;
  closeModal();
}

function openBpIconPicker(bpId) {
  const bp = (state.data.worldBackpacks||[]).find(b=>b.id===bpId);
  if (!bp) return;
  const modal = $('#modal-box');
  const overlay = $('#modal-overlay');
  const customLib = (state.data.emojiLib || []).map(em => em.emoji);
  const customLibHtml = customLib.length > 0 ? `<div class="emoji-cat"><div class="emoji-cat-title">⭐ 自定义 Emoji</div><div class="emoji-grid">${customLib.map(e => `<button class="emoji-btn" onclick="selectBpIcon('${esc(bpId)}','${e}')">${e}</button>`).join('')}</div></div>` : '';
  const categories = Object.entries(EMOJI_CATEGORIES).map(([cat, emojis]) => {
    return `<div class="emoji-cat"><div class="emoji-cat-title">${esc(cat)}</div><div class="emoji-grid">${emojis.map(e => `<button class="emoji-btn" onclick="selectBpIcon('${esc(bpId)}','${e}')">${e}</button>`).join('')}</div></div>`;
  }).join('');
  modal.innerHTML = `
    <h3>选择系统图标</h3>
    <div class="form-group"><label>自定义输入</label><input id="bp-icon-custom-input" placeholder="输入emoji或文字" value="${esc(bp.icon||'🎲')}" style="width:100%;padding:8px 12px;font-size:14px"></div>
    <div style="max-height:350px;overflow-y:auto">${customLibHtml}${categories}</div>
    <div class="modal-actions">
      <button class="btn btn-outline" onclick="closeModal()">取消</button>
      <button class="btn btn-primary" id="bp-icon-ok-btn">确定</button>
    </div>`;
  showModalOverlay();
  $('#bp-icon-ok-btn').onclick = () => { selectBpIcon(bpId, ($('#bp-icon-custom-input')||{}).value || '🎲'); };
  overlay.onclick = (e) => { if (e.target === overlay) closeModal(); };
}

function selectBpIcon(bpId, icon) {
  const bp = (state.data.worldBackpacks||[]).find(b=>b.id===bpId);
  if (!bp) return;
  bp.icon = icon;
  autoSave();
  closeModal();
  renderTabContent();
}

function cancelBackpackItemEdit() {
  if (_itemIsNew && editItemId) {
    state.data.items = (state.data.items||[]).filter(i=>i.id!==editItemId);
    _itemIsNew = false;
    autoSave();
  }
  editItemId = null;
  _itemIsNew = false;
  state._forceAnimate=true; state._animateScope='detail'; renderTabContent();
}
function editBackpackItem(id) { editItemId = id; _itemIsNew = false; state._forceAnimate=true; state._animateScope='detail'; renderTabContent(); }

async function addBackpack() {
  const name = await customPrompt('系统名称', '');
  if (!name || !name.trim()) return;
  if (checkDuplicate(state.data.worldBackpacks, name)) {
    showToast('已存在同名系统！');
    return;
  }
  state.data.worldBackpacks.push({ id: uid(), name: name.trim(), description: '' });
  autoSave();
  renderTabContent();
}

async function renameBackpack() {
  const bp = (state.data.worldBackpacks||[]).find(b=>b.id===state.selectedItemId);
  if (!bp) return;
  const name = await customPrompt('新名称', bp.name);
  if (!name || !name.trim()) return;
  if (checkDuplicate(state.data.worldBackpacks, name, bp.id)) {
    showToast('已存在同名系统！');
    return;
  }
  bp.name = name.trim();
  autoSave();
  renderTabContent();
}

async function deleteBackpack(id) {
  if (!await customConfirm('确定删除此系统及其所有物品？')) return;
  state.data.worldBackpacks = (state.data.worldBackpacks||[]).filter(b=>b.id!==id);
  state.data.items = (state.data.items||[]).filter(i=>i.backpackId!==id);
  if (state.selectedItemId===id) state.selectedItemId=null;
  autoSave();
  renderTabContent();
}

function addItemToBackpack() {
  const bp = (state.data.worldBackpacks||[]).find(b=>b.id===state.selectedItemId);
  if (!bp) return;
  const item = { id:uid(), name:'新物品', icon:'📦', type:'', rarity:'', description:'', backpackId:bp.id, relatedCharacters:[], relatedFactions:[], relatedLocations:[], relatedEvents:[], relatedItems:[], relatedVolumes:[], customProps:{} };
  state.data.items.push(item);
  editItemId = item.id;
  _itemIsNew = true;
  autoSave();
  renderTabContent();
}

async function deleteBackpackItem(id) {
  if (!await customConfirm('确定删除此物品？')) return;
  state.data.items = (state.data.items||[]).filter(i=>i.id!==id);
  if (editItemId===id) editItemId=null;
  autoSave();
  renderTabContent();
}

function bindItemListEvents() {
  const list = $('#item-list');
  if (list) { list.querySelectorAll('.item-list-item').forEach(item=>{
    item.onclick=(ev)=>{
      if(ev.target.closest('.drag-handle')) return;
      const bpId = item.dataset.bpId;
      const itemId = item.dataset.itemId;
      state._selectedVariantId=null;
      state._editingVariantId=null;
      if (itemId && bpId) {
        state.selectedItemId=bpId;
        editItemId=null;
        state.itemSearch='';
        state._forceAnimate=true;
        state._animateScope='detail';
        renderTabContent();
        setTimeout(()=>{
          const el = document.querySelector(`[data-item-id="${itemId}"]`);
          if (el) el.scrollIntoView({behavior:'smooth',block:'center'});
        },100);
      } else {
        state.selectedItemId=bpId;
        editItemId=null;
        state._forceAnimate=true;
        state._animateScope='detail';
        renderTabContent();
      }
    };
  });}
}

function setupItems() {
  registerSearchTarget('itemSearch','item-list',renderBackpackList,bindItemListEvents);
  bindItemListEvents();
  setupDragSort({
    containerId: 'item-list',
    itemSelector: '.item-list-item',
    handleSelector: '.drag-handle',
    getArray: () => state.data.worldBackpacks,
    setArray: (arr) => { state.data.worldBackpacks = arr; }
  });
  const bpList=$('#bp-items-list');
  if(!bpList) return;
  setupDragSort({
    containerId: 'bp-items-list',
    itemSelector: '.bp-item-row',
    handleSelector: '.bp-item-drag',
    getArray: () => {
      const bpId = state.selectedItemId;
      return (state.data.items||[]).filter(i=>i.backpackId===bpId);
    },
    setArray: (sortedItems) => {
      const bpId = state.selectedItemId;
      const allItems = state.data.items || [];
      const otherItems = allItems.filter(i=>i.backpackId!==bpId);
      state.data.items = [...otherItems, ...sortedItems];
    }
  });
}