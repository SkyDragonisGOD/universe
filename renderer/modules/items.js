// ============================================================
// 世界生成器 — 世界系统 / 物品 & 背包
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
  '杂项': ['📦','🎒','💰','🎁','🎭','🧸','🎲','🃏','🎵','🔔','🕯️','🗺️','🧭','⏳','🪙','⚱️','🪦','🧿']
};

function renderItems() {
  const backpacks = state.data.worldBackpacks||[];
  const selectedBp = backpacks.find(bp=>bp.id===state.selectedItemId);
  return `<div class="item-layout"><div class="item-list-panel"><div class="flex-between mb-8"><h3>🌍 世界系统</h3><button class="btn btn-sm btn-primary" onclick="addBackpack()">+ 新建背包</button></div>
    <div id="item-list">${renderBackpackList()}</div></div>
    <div class="item-detail-panel">
      ${selectedBp ? renderBackpackDetail(selectedBp) : '<div class="empty-state"><div class="icon">👆</div><p>选择左侧背包查看详情</p></div>'}
    </div></div>`;
}

function renderBackpackList() {
  const backpacks = state.data.worldBackpacks||[];
  if (backpacks.length===0) return '<div class="empty-state"><div class="icon">🎒</div><p>暂无背包，点击"+ 新建背包"创建</p></div>';
  return backpacks.map(bp=>`<div class="item-list-item${state.selectedItemId===bp.id?' selected':''}" data-bp-id="${bp.id}">
    <span class="item-icon">${bp.icon||'🎒'}</span><span>${esc(bp.name)}</span>
    <span class="text-xs text-muted" style="margin-left:auto">${((state.data.items||[]).filter(i=>i.backpackId===bp.id).length)}项</span>
  </div>`).join('');
}

function renderBackpackDetail(bp) {
  const bpItems = (state.data.items||[]).filter(i=>i.backpackId===bp.id);
  return `<div class="card">
    <div class="flex-between">
      <div style="display:flex;align-items:center;gap:8px">
        <h3 style="margin:0">${bp.icon||'🎒'} ${esc(bp.name)}</h3>
        <button class="btn btn-xs btn-outline" onclick="openBpIconPicker('${esc(bp.id)}')">😀</button>
      </div>
      <div class="flex-gap">
        <button class="btn btn-sm btn-outline" onclick="renameBackpack()">✏️ 改名</button>
        <button class="btn btn-sm btn-primary" onclick="addItemToBackpack()">+ 添加物品</button>
        <button class="btn btn-sm btn-danger" onclick="deleteBackpack('${bp.id}')">🗑️ 删除</button>
      </div>
    </div>
    <p class="text-sm text-muted mb-8">${esc(bp.description||'')}</p>
    ${bpItems.length===0 ? '<div class="empty-state"><div class="icon">📦</div><p>此背包为空，点击"+ 添加物品"添加</p></div>' : ''}
    ${editItemId ? renderBackpackItemEditForm(bpItems.find(i=>i.id===editItemId)) : ''}
    <div id="bp-items-list" style="margin-top:8px">
      ${bpItems.map(item => editItemId===item.id ? '' : renderBackpackItemCard(item)).join('')}
    </div>
  </div>`;
}

function renderBackpackItemCard(item) {
  const holder = (state.data.characters||[]).find(c=>(c.backpackItems||{})[item.backpackId]?.includes(item.id));
  return `<div class="bp-item-row" data-item-id="${item.id}" style="display:flex;align-items:center;gap:8px;padding:8px 10px;border:1px solid var(--border);border-radius:var(--radius-xs);margin-bottom:4px;background:var(--white);cursor:pointer" onclick="showItemDetail('${item.id}')">
    <span class="bp-item-drag" style="cursor:grab;font-size:10px;color:var(--warm-gray);user-select:none" title="拖拽排序">⠿</span>
    <span style="font-size:16px">${item.icon||'📦'}</span>
    <strong style="flex:1;font-size:13px">${esc(item.name)}</strong>
    ${item.rarity ? `<span style="color:${getRarityColor(item.rarity)};font-size:11px">[${esc(getRarityLabel(item.rarity))}]</span>` : ''}
    ${item.type ? `<span class="text-xs text-muted">${esc(item.type)}</span>` : ''}
    ${holder ? `<span class="text-xs" style="color:var(--accent)">👤 ${esc(holder.name)}</span>` : ''}
    <button class="btn btn-xs btn-outline" onclick="event.stopPropagation();editBackpackItem('${item.id}')">✏️</button>
    <button class="btn btn-xs btn-danger" onclick="event.stopPropagation();deleteBackpackItem('${item.id}')">×</button>
  </div>`;
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
      ${bp ? `<div><span class="text-xs text-muted">所属背包</span><div style="font-size:13px">🎒 ${esc(bp.name)}</div></div>` : ''}
      ${holder ? `<div><span class="text-xs text-muted">持有者</span><div style="font-size:13px">👤 ${esc(holder.name)}</div></div>` : ''}
      ${item.description ? `<div><span class="text-xs text-muted">描述</span><div style="font-size:13px;white-space:pre-wrap">${esc(item.description)}</div></div>` : ''}
      ${_normLinks(item.relatedCharacters).length>0?`<div><span class="text-xs text-muted">关联人物</span><div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:2px">${_normLinks(item.relatedCharacters).map(cl=>{const ch=(state.data.characters||[]).find(c=>c.id===cl.id);return ch?`<span class="wiki-tag skill">👤 ${esc(ch.name)}</span>`:'';}).join('')}</div></div>`:''}
      ${_normLinks(item.relatedFactions).length>0?`<div><span class="text-xs text-muted">关联势力</span><div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:2px">${_normLinks(item.relatedFactions).map(fl=>{const fa=(state.data.factions||[]).find(f=>f.id===fl.id);return fa?`<span class="wiki-tag item">🏰 ${esc(fa.name)}</span>`:'';}).join('')}</div></div>`:''}
      ${_normLinks(item.relatedLocations).length>0?`<div><span class="text-xs text-muted">关联地点</span><div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:2px">${_normLinks(item.relatedLocations).map(ll=>{const loc=(state.data.locations||[]).find(l=>l.id===ll.id);return loc?`<span class="wiki-tag skill">📍 ${esc(loc.name)}</span>`:'';}).join('')}</div></div>`:''}
      ${_normLinks(item.relatedEvents).length>0?`<div><span class="text-xs text-muted">关联事件</span><div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:2px">${_normLinks(item.relatedEvents).map(el=>{const ev=(state.data.timeline||[]).find(e=>e.id===el.id);return ev?`<span class="wiki-tag item">⚡ ${esc(ev.name)}</span>`:'';}).join('')}</div></div>`:''}
      ${_normLinks(item.relatedVolumes).length>0?`<div><span class="text-xs text-muted">📑 关联卷</span><div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:2px">${_normLinks(item.relatedVolumes).map(vl=>{const vol=(state.data.outline||[]).find((v,i)=>i===parseInt(vl.id)||v.id===vl.id);return vol?`<span class="wiki-tag item">📖 ${esc(vol.title||'未命名卷')}</span>`:'';}).join('')}</div></div>`:''}
    </div>
    <div class="modal-actions">
      <button class="btn btn-outline" onclick="closeModal()">关闭</button>
      <button class="btn btn-primary" onclick="closeModal();editBackpackItem('${item.id}')">✏️ 编辑</button>
    </div>`;
  overlay.classList.remove('hidden');
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
        ${_normLinks(item.relatedCharacters).length>0?`<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px">${_normLinks(item.relatedCharacters).map(cl=>{const ch=(state.data.characters||[]).find(c=>c.id===cl.id);return ch?`<span class="wiki-tag skill">👤 ${esc(ch.name)}<button class="btn btn-xs btn-icon btn-danger" style="font-size:8px;margin-left:2px" onclick="removeItemLink('${esc(item.id)}','relatedCharacters','${esc(cl.id)}')">×</button></span>`:'';}).join('')}</div>`:''}
      </div>
      <div class="form-group"><label>关联势力</label>
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <span class="text-xs text-muted">已选 ${_normLinks(item.relatedFactions).length} 个</span>
          <button class="btn btn-xs btn-outline" onclick="openItemLinkModal('${esc(item.id)}','relatedFactions')">选择</button>
        </div>
        ${_normLinks(item.relatedFactions).length>0?`<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px">${_normLinks(item.relatedFactions).map(fl=>{const fa=(state.data.factions||[]).find(f=>f.id===fl.id);return fa?`<span class="wiki-tag item">🏰 ${esc(fa.name)}<button class="btn btn-xs btn-icon btn-danger" style="font-size:8px;margin-left:2px" onclick="removeItemLink('${esc(item.id)}','relatedFactions','${esc(fl.id)}')">×</button></span>`:'';}).join('')}</div>`:''}
      </div>
      <div class="form-group"><label>关联地点</label>
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <span class="text-xs text-muted">已选 ${_normLinks(item.relatedLocations).length} 个</span>
          <button class="btn btn-xs btn-outline" onclick="openItemLinkModal('${esc(item.id)}','relatedLocations')">选择</button>
        </div>
        ${_normLinks(item.relatedLocations).length>0?`<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px">${_normLinks(item.relatedLocations).map(ll=>{const loc=(state.data.locations||[]).find(l=>l.id===ll.id);return loc?`<span class="wiki-tag skill">📍 ${esc(loc.name)}<button class="btn btn-xs btn-icon btn-danger" style="font-size:8px;margin-left:2px" onclick="removeItemLink('${esc(item.id)}','relatedLocations','${esc(ll.id)}')">×</button></span>`:'';}).join('')}</div>`:''}
      </div>
      <div class="form-group"><label>关联事件</label>
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <span class="text-xs text-muted">已选 ${_normLinks(item.relatedEvents).length} 个</span>
          <button class="btn btn-xs btn-outline" onclick="openItemLinkModal('${esc(item.id)}','relatedEvents')">选择</button>
        </div>
        ${_normLinks(item.relatedEvents).length>0?`<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px">${_normLinks(item.relatedEvents).map(el=>{const ev=(state.data.timeline||[]).find(e=>e.id===el.id);return ev?`<span class="wiki-tag item">⚡ ${esc(ev.name)}<button class="btn btn-xs btn-icon btn-danger" style="font-size:8px;margin-left:2px" onclick="removeItemLink('${esc(item.id)}','relatedEvents','${esc(el.id)}')">×</button></span>`:'';}).join('')}</div>`:''}
      </div>
      <div class="form-group"><label>📑 关联卷</label>
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <span class="text-xs text-muted">已选 ${_normLinks(item.relatedVolumes).length} 个</span>
          <button class="btn btn-xs btn-outline" onclick="openItemVolumeModal('${esc(item.id)}')">选择卷</button>
        </div>
        ${_normLinks(item.relatedVolumes).length>0?`<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px">${_normLinks(item.relatedVolumes).map(vl=>{const vol=(state.data.outline||[]).find((v,i)=>i===parseInt(vl.id)||v.id===vl.id);return vol?`<span class="wiki-tag item">📖 ${esc(vol.title||'未命名卷')}<button class="btn btn-xs btn-icon btn-danger" style="font-size:8px;margin-left:2px" onclick="removeItemVolume('${esc(item.id)}','${esc(vl.id)}')">×</button></span>`:'';}).join('')}</div>`:''}
      </div>
    </div>
  </div>`;
}

function saveBackpackItemEdit() {
  const item = (state.data.items||[]).find(i=>i.id===editItemId);
  if (!item) return;
  const newName = ($('#bp-item-name')||{}).value || item.name;
  if (checkDuplicate(state.data.items, newName, item.id)) {
    alert('已存在同名物品！');
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
  renderTabContent();
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
  if(outline.length===0){alert('暂无卷');return;}
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
  if(pool.length===0){alert('暂无可选项');return;}
  const existingIds=_normLinks(item[field]||[]).map(l=>l.id);
  const result=await customSelectModal(label,pool,existingIds);
  if(result===null) return;
  if(!item[field]) item[field]=[];
  item[field]=result.map(id=>({id}));
  autoSave();
  renderTabContent();
}
function removeItemLink(itemId,field,linkId) {
  const item=(state.data.items||[]).find(i=>i.id===itemId); if (!item) return;
  item[field]=_normLinks(item[field]||[]).filter(l=>l.id!==linkId).map(l=>({id:l.id,desc:l.desc}));
  autoSave();
  renderTabContent();
}

function openEmojiPicker() {
  const modal = $('#modal-box');
  const overlay = $('#modal-overlay');
  const categories = Object.entries(EMOJI_CATEGORIES).map(([cat, emojis]) => {
    return `<div class="emoji-cat"><div class="emoji-cat-title">${esc(cat)}</div><div class="emoji-grid">${emojis.map(e => `<button class="emoji-btn" onclick="selectEmoji('${e}')">${e}</button>`).join('')}</div></div>`;
  }).join('');
  modal.innerHTML = `
    <h3>选择图标</h3>
    <div class="form-group"><label>自定义输入</label><input id="emoji-custom-input" placeholder="输入emoji或文字" style="width:100%;padding:8px 12px;font-size:14px"></div>
    <div style="max-height:350px;overflow-y:auto">${categories}</div>
    <div class="modal-actions">
      <button class="btn btn-outline" onclick="closeModal()">取消</button>
      <button class="btn btn-primary" id="emoji-ok-btn">确定</button>
    </div>`;
  overlay.classList.remove('hidden');
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
  const categories = Object.entries(EMOJI_CATEGORIES).map(([cat, emojis]) => {
    return `<div class="emoji-cat"><div class="emoji-cat-title">${esc(cat)}</div><div class="emoji-grid">${emojis.map(e => `<button class="emoji-btn" onclick="selectBpIcon('${esc(bpId)}','${e}')">${e}</button>`).join('')}</div></div>`;
  }).join('');
  modal.innerHTML = `
    <h3>选择背包图标</h3>
    <div class="form-group"><label>自定义输入</label><input id="bp-icon-custom-input" placeholder="输入emoji或文字" value="${esc(bp.icon||'🎒')}" style="width:100%;padding:8px 12px;font-size:14px"></div>
    <div style="max-height:350px;overflow-y:auto">${categories}</div>
    <div class="modal-actions">
      <button class="btn btn-outline" onclick="closeModal()">取消</button>
      <button class="btn btn-primary" id="bp-icon-ok-btn">确定</button>
    </div>`;
  overlay.classList.remove('hidden');
  $('#bp-icon-ok-btn').onclick = () => { selectBpIcon(bpId, ($('#bp-icon-custom-input')||{}).value || '🎒'); };
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
  renderTabContent();
}
function editBackpackItem(id) { editItemId = id; _itemIsNew = false; renderTabContent(); }

async function addBackpack() {
  const name = await customPrompt('背包名称', '');
  if (!name || !name.trim()) return;
  if (checkDuplicate(state.data.worldBackpacks, name)) {
    alert('已存在同名背包！');
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
    alert('已存在同名背包！');
    return;
  }
  bp.name = name.trim();
  autoSave();
  renderTabContent();
}

async function deleteBackpack(id) {
  if (!await customConfirm('确定删除此背包及其所有物品？')) return;
  state.data.worldBackpacks = (state.data.worldBackpacks||[]).filter(b=>b.id!==id);
  state.data.items = (state.data.items||[]).filter(i=>i.backpackId!==id);
  if (state.selectedItemId===id) state.selectedItemId=null;
  autoSave();
  renderTabContent();
}

function addItemToBackpack() {
  const bp = (state.data.worldBackpacks||[]).find(b=>b.id===state.selectedItemId);
  if (!bp) return;
  const item = { id:uid(), name:'新物品', icon:'📦', type:'', rarity:'', description:'', backpackId:bp.id, relatedCharacters:[], relatedFactions:[], relatedLocations:[], relatedEvents:[], relatedVolumes:[], customProps:{} };
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

function setupItems() {
  const list = $('#item-list');
  if (list) { list.querySelectorAll('.item-list-item').forEach(item=>{item.onclick=()=>{state.selectedItemId=item.dataset.bpId;editItemId=null;state._forceAnimate=true;state._animateScope='detail';renderTabContent();};});}
  const bpList=$('#bp-items-list');
  if(!bpList) return;
  let dragState=null;
  bpList.querySelectorAll('.bp-item-drag').forEach(handle=>{
    handle.addEventListener('mousedown',function(ev){
      if(ev.button!==0) return;
      ev.preventDefault();
      const el=this.closest('.bp-item-row');
      if(!el) return;
      const itemId=el.dataset.itemId;
      const bpId=state.selectedItemId;
      const bpItems=(state.data.items||[]).filter(i=>i.backpackId===bpId);
      const idx=bpItems.findIndex(i=>i.id===itemId);
      const rect=el.getBoundingClientRect();
      dragState={itemId,idx,el,offsetY:ev.clientY-rect.top,startX:ev.clientX,startY:ev.clientY,moved:false,ghost:null,origEl:el,bpId};
    });
  });
  if(window._bpItemMM) document.removeEventListener('mousemove',window._bpItemMM);
  if(window._bpItemMU) document.removeEventListener('mouseup',window._bpItemMU);
  window._bpItemMM=function(ev){
    if(!dragState) return;
    const dx=ev.clientX-dragState.startX,dy=ev.clientY-dragState.startY;
    if(!dragState.moved&&Math.abs(dx)+Math.abs(dy)<5) return;
    dragState.moved=true;
    dragState.origEl.style.opacity='0.3';
    if(!dragState.ghost){
      const ghost=dragState.origEl.cloneNode(true);
      ghost.style.position='fixed';ghost.style.zIndex='10000';ghost.style.pointerEvents='none';ghost.style.opacity='0.85';
      ghost.style.width=dragState.origEl.offsetWidth+'px';ghost.style.boxShadow='0 8px 24px rgba(0,0,0,0.18)';ghost.style.transition='none';
      document.body.appendChild(ghost);dragState.ghost=ghost;
    }
    dragState.ghost.style.left=dragState.origEl.getBoundingClientRect().left+'px';
    dragState.ghost.style.top=(ev.clientY-dragState.offsetY)+'px';
    bpList.querySelectorAll('.bp-drop-ind').forEach(el=>el.remove());
    const rows=bpList.querySelectorAll('.bp-item-row');
    for(let i=0;i<rows.length;i++){
      const r=rows[i].getBoundingClientRect();
      if(ev.clientY<r.top+r.height/2){
        const ind=document.createElement('div');ind.className='bp-drop-ind';ind.style.cssText='height:2px;background:var(--accent);border-radius:1px;margin:2px 0';
        rows[i].before(ind);break;
      }
      if(i===rows.length-1){
        const ind=document.createElement('div');ind.className='bp-drop-ind';ind.style.cssText='height:2px;background:var(--accent);border-radius:1px;margin:2px 0';
        rows[i].after(ind);
      }
    }
  };
  window._bpItemMU=function(ev){
    if(!dragState) return;
    if(dragState.ghost) dragState.ghost.remove();
    dragState.origEl.style.opacity='';
    bpList.querySelectorAll('.bp-drop-ind').forEach(el=>el.remove());
    if(dragState.moved){
      const bpId=dragState.bpId;
      const bpItems=(state.data.items||[]).filter(i=>i.backpackId===bpId);
      const rows=bpList.querySelectorAll('.bp-item-row');
      let dropIdx=bpItems.length;
      for(let i=0;i<rows.length;i++){
        const r=rows[i].getBoundingClientRect();
        if(ev.clientY<r.top+r.height/2){dropIdx=i;break;}
      }
      const fromIdx=dragState.idx;
      if(fromIdx!==dropIdx&&fromIdx!==dropIdx-1){
        const allItems=state.data.items;
        const fromGlobalIdx=allItems.findIndex(i=>i.id===dragState.itemId);
        const item=allItems.splice(fromGlobalIdx,1)[0];
        let insertGlobalIdx;
        if(dropIdx>=bpItems.length){
          insertGlobalIdx=allItems.length;
        } else {
          const targetId=bpItems[dropIdx>=fromIdx?dropIdx:dropIdx].id;
          insertGlobalIdx=allItems.findIndex(i=>i.backpackId===bpId&&i.id===targetId);
          if(dropIdx>fromIdx) insertGlobalIdx=Math.max(0,insertGlobalIdx);
        }
        allItems.splice(insertGlobalIdx,0,item);
        autoSave();renderTabContent();
      }
    }
    dragState=null;
  };
  document.addEventListener('mousemove',window._bpItemMM);
  document.addEventListener('mouseup',window._bpItemMU);
}