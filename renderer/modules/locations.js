// ============================================================
// 世界生成器 — 地点
// 依赖: core/state.js, core/utils.js, core/modal.js, core/glossary.js
// ============================================================

function renderLocations() {
  const returnBtn = state._mapReturnFromTab ? `<button class="btn btn-xs btn-outline" onclick="const t=state._mapReturnFromTab;state._mapReturnFromTab=null;switchTab(t||'map')" style="margin-right:4px">🗺️ 返回地图</button>` : '';
  return `<div class="char-layout">
    <div class="char-list-panel">
      <div class="flex-between mb-8"><h3>📍 地点列表</h3><div class="flex-gap">${returnBtn}<button class="btn btn-sm btn-primary" onclick="addLocation()">+ 添加</button></div></div>
      ${renderSearchBox('locSearch')}
      <div id="location-list">${renderLocationList()}</div>
    </div>
    <div class="char-detail-panel" id="location-detail">${renderLocationDetail()}</div>
  </div>`;
}

function renderLocationList() {
  const allLocs = state.data.locations||[];
  const locs = allLocs.filter(l => matchSearch(l.name, 'locSearch'));
  if (allLocs.length===0) return '<div class="empty-state"><div class="icon">📍</div><p>暂无地点</p></div>';
  return (locs.length===0?'<div class="empty-state"><div class="icon">🔍</div><p>无匹配地点</p></div>':locs.map(l=>{
    return`<div class="location-card${state.selectedLocationId===l.id&&!state._selectedVariantId?' selected':''}" data-loc-id="${l.id}" oncontextmenu="event.preventDefault();_showEntityCtxMenu(event,'location','${esc(l.id)}')"><div class="flex-between"><div style="display:flex;align-items:center;gap:6px"><span class="drag-handle" style="cursor:grab;font-size:10px;color:var(--muted);user-select:none">⠿</span><span class="loc-name">${esc(l.name)}${_renderVariantDropdown('location',l.id,l.name)}</span></div><button class="btn btn-xs btn-danger" onclick="event.stopPropagation();deleteLocation('${l.id}')">×</button></div><div class="loc-desc">${esc((l.description||'').slice(0,100))}</div>${l.category&&l.category!=='未知'?`<div style="font-size:11px;color:var(--muted);margin-top:2px">${esc(l.category)}</div>`:''}</div>${_renderVariantListItems('location',l.id)}`;}).join(''));
}

function renderLocationDetail() {
  if (state._selectedVariantId) {
    const v = _getVariantById(state._selectedVariantId);
    if (v && v.parentType === 'location' && v.parentId === state.selectedLocationId) {
      if (state._editingVariantId === v.id) return _renderVariantEditPage(v);
      return _renderVariantDetailPage(v);
    }
    state._selectedVariantId = null;
    state._editingVariantId = null;
  }
  const loc = (state.data.locations||[]).find(l=>l.id===state.selectedLocationId);
  if (!loc) return '<div class="empty-state"><div class="icon">📍</div><p>选择一个地点查看详情</p></div>';
  if (state.editingLocation) return renderLocationEditForm(loc);
  return renderLocationWikiView(loc);
}

function renderLocationWikiView(loc) {
  const characters = collectGlossary('character');
  const events = collectGlossary('event');
  const locCharLinks = _normLinks(loc.relatedCharacters);
  const locEventLinks = _normLinks(loc.events);
  const locFactionLinks = _normLinks(loc.relatedFactions);
  const locChars = locCharLinks.map(cl=>{const ch=characters.find(c=>c.id===cl.id||c.name===cl.id);return ch?{id:ch.id,name:ch.name,_desc:cl.desc}:null;}).filter(Boolean);
  const locEvents = locEventLinks.map(el=>{const ev=events.find(e=>e.id===el.id||e.name===el.id);return ev?{id:ev.id,name:ev.name,_desc:el.desc}:null;}).filter(Boolean);
  const locFactions = locFactionLinks.map(fl=>{const fa=(state.data.factions||[]).find(f=>f.id===fl.id);return fa?{id:fa.id,name:fa.name,_desc:fl.desc}:null;}).filter(Boolean);
  ensurePropertyDefs();
  const customProps = getCustomPropsForScope('locations');
  const cpData = loc.customProps || {};
  const customPropHtml = renderCustomPropWikiHtml(customProps, cpData);

  return `<div class="wiki-page detail-scroll-area">
    <div class="wiki-header">
      <h2 class="wiki-title">📍 ${esc(loc.name)}</h2>
      <div class="wiki-meta">
        ${loc.category&&loc.category!=='未知'?`<span class="wiki-badge race" style="cursor:pointer" title="${esc(getCategoryDesc('category',loc.category))}" onclick="openCategoryDetail('category','${esc(loc.category)}')">${esc(loc.category)}</span>`:''}
      </div>
      ${customPropHtml?`<div style="margin-top:4px">${customPropHtml}</div>`:''}
    </div>
    ${loc.description?`<div class="wiki-section"><div class="wiki-section-title">描述</div><div class="wiki-value">${_renderLinkedContent(loc.description)}</div></div>`:''}
    ${locChars.length>0?`<div class="wiki-section"><div class="wiki-section-title">关联角色</div><div class="wiki-tags">${locChars.map(ch=>{const descArg=ch._desc?`, '${jsStr(ch._desc)}'`:'';return`<span class="wiki-tag skill" onclick="showPreviewCard('character','${esc(ch.id)}',event${descArg})" style="cursor:pointer">${esc(ch.name)}</span>`;}).join('')}</div></div>`:''}
    ${locEvents.length>0?`<div class="wiki-section"><div class="wiki-section-title">关联事件</div><div class="wiki-tags">${locEvents.map(ev=>{const descArg=ev._desc?`, '${jsStr(ev._desc)}'`:'';return`<span class="wiki-tag item" onclick="showPreviewCard('event','${esc(ev.id)}',event${descArg})" style="cursor:pointer">${esc(ev.name)}</span>`;}).join('')}</div></div>`:''}
    ${locFactions.length>0?`<div class="wiki-section"><div class="wiki-section-title">关联势力</div><div class="wiki-tags">${locFactions.map(fa=>{const descArg=fa._desc?`, '${jsStr(fa._desc)}'`:'';return`<span class="wiki-tag item" onclick="showPreviewCard('faction','${esc(fa.id)}',event${descArg})" style="cursor:pointer">${esc(fa.name)}</span>`;}).join('')}</div></div>`:''}
    ${(loc.backpackItems && Object.keys(loc.backpackItems).some(k=>(loc.backpackItems[k]||[]).length>0))?`<div class="wiki-section"><div class="wiki-section-title">🎲 背包物品</div>${Object.entries(loc.backpackItems).filter(([bpId,itemIds])=>itemIds.length>0).map(([bpId,itemIds])=>{const bp=(state.data.worldBackpacks||[]).find(b=>b.id===bpId);if(!bp)return'';const bpItems=(state.data.items||[]).filter(i=>i.backpackId===bpId&&itemIds.includes(i.id));return bpItems.length>0?`<div style="margin-bottom:4px"><span style="font-size:11px;color:var(--muted)">${esc(bp.name)}:</span> <div class="wiki-tags" style="display:inline-flex">${bpItems.map(it=>`<span class="wiki-tag item" style="cursor:pointer" onclick="showPreviewCard('item','${esc(it.id)}',event)">${it.icon||'📦'} ${esc(it.name)}</span>`).join('')}</div></div>`:'';}).join('')}</div>`:''}
    ${_normLinks(loc.relatedVolumes).length>0?`<div class="wiki-section"><div class="wiki-section-title">📑 关联卷</div><div class="wiki-tags">${_normLinks(loc.relatedVolumes).map(vl=>{const vol=(state.data.outline||[]).find((v,i)=>i===parseInt(vl.id)||v.id===vl.id);return vol?`<span class="wiki-tag item">📖 ${esc(vol.title||'未命名卷')}</span>`:`<span class="wiki-tag item">${esc(vl.id)}</span>`;}).join('')}</div></div>`:''}
    ${_renderVariantWikiSection('location',loc.id)}
  </div>
  <div class="detail-sticky-bar">
    <button class="btn btn-sm btn-outline" onclick="state.selectedLocationId=null;renderTabContent()">← 返回</button>
    <div class="flex-gap">
      <button class="btn btn-sm btn-danger" onclick="deleteLocation('${loc.id}')">🗑️ 删除</button>
      <button class="btn btn-sm btn-primary" onclick="startLocationEdit()">✏️ 编辑</button>
    </div>
  </div>`;
}

function renderLocationEditForm(loc) {
  const characters = collectGlossary('character');
  const events = collectGlossary('event');
  const factions = collectGlossary('faction');
  ensurePropertyDefs();
  const customProps = getCustomPropsForScope('locations');
  if (!loc.customProps) loc.customProps = {};
  if (!loc.backpackItems) loc.backpackItems = {};
  return `<div class="card detail-scroll-area">
    <div class="form-row"><div class="form-group"><label>名称</label><input value="${esc(loc.name)}" onchange="updateLocation('name',this.value)"></div>
    <div class="form-group"><label>分类</label>${renderCategorySelect(loc.category||'','category',"updateLocation('category',this.value)")}</div></div>
    <div class="form-group"><label>描述</label><textarea rows="3" onchange="updateLocation('description',this.value)">${esc(loc.description||'')}</textarea></div>
    ${customProps.map(prop => {
      const key = 'cp_' + prop.id;
      const val = loc.customProps[key] || '';
      return renderCustomPropField(prop, val, `setLocationCustomProp('${prop.id}',this.value)`);
    }).join('')}
    <div class="card"><h4>关联</h4>
      <div class="form-group"><label>关联角色</label>
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <span class="text-xs text-muted">已选 ${_normLinks(loc.relatedCharacters).length} 人</span>
          <button class="btn btn-xs btn-outline" onclick="openLocCharSelectModal()">选择角色</button>
        </div>
        ${_normLinks(loc.relatedCharacters).length > 0 ? `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px">${_normLinks(loc.relatedCharacters).map(cl => {
          const ch = characters.find(c=>c.id===cl.id);
          const descHtml = cl.desc ? `<span style="font-size:11px;color:var(--text-muted)">(${esc(cl.desc)})</span>` : '';
          return ch ? `<span class="wiki-tag skill">${esc(ch.name)}${descHtml}<button class="btn btn-xs btn-icon btn-danger" style="font-size:8px;margin-left:2px" onclick="removeLocChar('${esc(cl.id)}')">×</button></span>` : '';
        }).join('')}</div>` : ''}
      </div>
      <div class="form-group"><label>关联事件</label>
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <span class="text-xs text-muted">已选 ${_normLinks(loc.events).length} 个</span>
          <button class="btn btn-xs btn-outline" onclick="openLocEventSelectModal()">选择事件</button>
        </div>
        ${_normLinks(loc.events).length > 0 ? `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px">${_normLinks(loc.events).map(el => {
          const ev = events.find(e=>e.id===el.id);
          const descHtml = el.desc ? `<span style="font-size:11px;color:var(--text-muted)">(${esc(el.desc)})</span>` : '';
          return ev ? `<span class="wiki-tag item">${esc(ev.name)}${descHtml}<button class="btn btn-xs btn-icon btn-danger" style="font-size:8px;margin-left:2px" onclick="removeLocEvent('${esc(el.id)}')">×</button></span>` : '';
        }).join('')}</div>` : ''}
      </div>
      <div class="form-group"><label>关联势力</label>
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <span class="text-xs text-muted">已选 ${_normLinks(loc.relatedFactions).length} 个</span>
          <button class="btn btn-xs btn-outline" onclick="openLocFactionSelectModal()">选择势力</button>
        </div>
        ${_normLinks(loc.relatedFactions).length > 0 ? `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px">${_normLinks(loc.relatedFactions).map(fl => {
          const fa = (state.data.factions||[]).find(f=>f.id===fl.id);
          const descHtml = fl.desc ? `<span style="font-size:11px;color:var(--text-muted)">(${esc(fl.desc)})</span>` : '';
          return fa ? `<span class="wiki-tag item"><span class="dot" style="background:${fa.color||'#888'};width:8px;height:8px;border-radius:50%;display:inline-block;margin-right:4px"></span>${esc(fa.name)}${descHtml}<button class="btn btn-xs btn-icon btn-danger" style="font-size:8px;margin-left:2px" onclick="removeLocFaction('${esc(fl.id)}')">×</button></span>` : '';
        }).join('')}</div>` : ''}
      </div>
      ${(state.data.worldBackpacks||[]).length === 0 ? '' : (state.data.worldBackpacks||[]).map(bp => {
        const bpItems = (state.data.items||[]).filter(i=>i.backpackId===bp.id);
        const selectedItems = (loc.backpackItems||{})[bp.id]||[];
        return `<div class="card"><h4>🎲 ${esc(bp.name)}</h4>
          ${bpItems.length===0 ? '<div class="text-xs text-muted" style="padding:4px 0">此系统为空</div>' :
          `<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px">
            <span class="text-xs text-muted">已选 ${selectedItems.length} 项</span>
            <button class="btn btn-xs btn-outline" onclick="openLocBackpackSelectModal('${bp.id}')">选择物品</button>
          </div>
          ${selectedItems.length > 0 ? `<div style="display:flex;flex-wrap:wrap;gap:4px">${selectedItems.map(iid => {
            const it = bpItems.find(i=>i.id===iid);
            return it ? `<span class="wiki-tag item" style="cursor:pointer" onclick="showPreviewCard('item','${esc(it.id)}',event)">${it.icon||'📦'} ${esc(it.name)}</span>` : '';
          }).join('')}</div>` : ''}`}
        </div>`;
      }).join('')}
      <div class="form-group"><label>关联卷</label>
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <span class="text-xs text-muted">已选 ${_normLinks(loc.relatedVolumes).length} 个</span>
          <button class="btn btn-xs btn-outline" onclick="openLocVolumeModal()">选择卷</button>
        </div>
        ${_normLinks(loc.relatedVolumes).length>0?`<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px">${_normLinks(loc.relatedVolumes).map(vl=>{const vol=(state.data.outline||[]).find((v,i)=>i===parseInt(vl.id)||v.id===vl.id);return vol?`<span class="wiki-tag item">📖 ${esc(vol.title||'未命名卷')}<button class="btn btn-xs btn-icon btn-danger" style="font-size:8px;margin-left:2px" onclick="removeLocVolume('${esc(vl.id)}')">×</button></span>`:'';}).join('')}</div>`:''}
      </div>
    </div>

    ${_renderVariantSection('location',loc.id,loc.name)}
  </div>
  <div class="detail-sticky-bar">
    <div></div>
    <div class="flex-gap">
      <button class="btn btn-sm btn-outline" onclick="cancelLocationEdit()">取消</button>
      <button class="btn btn-sm btn-primary" onclick="saveLocationEdit()">💾 保存</button>
    </div>
  </div>`;
}

let _locEditSnapshot = null;
let _locIsNew = false;
function startLocationEdit() {
  const loc = (state.data.locations||[]).find(l=>l.id===state.selectedLocationId);
  if (loc) _locEditSnapshot = JSON.parse(JSON.stringify(loc));
  _locIsNew = false;
  state.editingLocation = true; state._forceAnimate=true; state._animateScope='detail'; renderTabContent();
}
function saveLocationEdit() { _locEditSnapshot = null; _locIsNew = false; state.editingLocation = false; autoSave(); state._forceAnimate=true; state._animateScope='detail'; renderTabContent(); }
function cancelLocationEdit() {
  if (_locIsNew) {
    state.data.locations = (state.data.locations||[]).filter(l=>l.id!==state.selectedLocationId);
    state.selectedLocationId = null;
    _locIsNew = false;
    _locEditSnapshot = null;
    autoSave(); state._forceAnimate=true; state._animateScope='detail'; renderTabContent(); return;
  }
  if (_locEditSnapshot) {
    const loc = (state.data.locations||[]).find(l=>l.id===state.selectedLocationId);
    if (loc) Object.assign(loc, _locEditSnapshot);
    _locEditSnapshot = null;
  }
  state.editingLocation = false; state._forceAnimate=true; state._animateScope='detail'; renderTabContent();
}

function removeLocChar(cid) { const loc=(state.data.locations||[]).find(l=>l.id===state.selectedLocationId); if (!loc) return; const oldIds=_linkIds(loc.relatedCharacters); loc.relatedCharacters=_removeLink(loc.relatedCharacters,cid); syncLink('location',loc.id,'relatedCharacters',_linkIds(loc.relatedCharacters),'',oldIds); autoSave(); if (state.editingLocation) { const detail=$('#location-detail'); if(detail) detail.innerHTML=renderLocationEditForm(loc); } }
function removeLocEvent(eid) { const loc=(state.data.locations||[]).find(l=>l.id===state.selectedLocationId); if (!loc) return; const oldIds=_linkIds(loc.events); loc.events=_removeLink(loc.events,eid); syncLink('location',loc.id,'events',_linkIds(loc.events),'',oldIds); autoSave(); if (state.editingLocation) { const detail=$('#location-detail'); if(detail) detail.innerHTML=renderLocationEditForm(loc); } }
function removeLocFaction(fid) { const loc=(state.data.locations||[]).find(l=>l.id===state.selectedLocationId); if (!loc) return; const oldIds=_linkIds(loc.relatedFactions); loc.relatedFactions=_removeLink(loc.relatedFactions,fid); syncLink('location',loc.id,'relatedFactions',_linkIds(loc.relatedFactions),'',oldIds); autoSave(); if (state.editingLocation) { const detail=$('#location-detail'); if(detail) detail.innerHTML=renderLocationEditForm(loc); } }

async function openLocVolumeModal() {
  const loc=(state.data.locations||[]).find(l=>l.id===state.selectedLocationId); if (!loc) return;
  const outline=state.data.outline||[];
  if(outline.length===0){showToast('暂无卷');return;}
  const volItems=outline.map((v,i)=>({id:String(i),name:v.title||('第'+(i+1)+'卷')}));
  const existingIds=_normLinks(loc.relatedVolumes||[]).map(l=>l.id);
  const result=await customSelectModal('📑 选择关联卷',volItems,existingIds);
  if(result===null) return;
  if(!loc.relatedVolumes) loc.relatedVolumes=[];
  loc.relatedVolumes=result.map(id=>({id}));
  autoSave();
  if(state.editingLocation){const d=$('#location-detail');if(d)d.innerHTML=renderLocationEditForm(loc);}else{renderTabContent();}
}
function removeLocVolume(id) {
  const loc=(state.data.locations||[]).find(l=>l.id===state.selectedLocationId); if (!loc) return;
  loc.relatedVolumes=_normLinks(loc.relatedVolumes||[]).filter(l=>l.id!==id).map(l=>({id:l.id,desc:l.desc}));
  autoSave();
  if(state.editingLocation){const d=$('#location-detail');if(d)d.innerHTML=renderLocationEditForm(loc);}else{renderTabContent();}
}

async function openLocCharSelectModal() {
  const loc = (state.data.locations||[]).find(l=>l.id===state.selectedLocationId);
  if (!loc) return;
  const characters = collectGlossary('character');
  if (characters.length === 0) { showToast('暂无角色'); return; }
  const result = await customLinkModal('选择关联角色', characters, loc.relatedCharacters||[], '简述关系');
  if (result === null) return;
  const oldIds=_linkIds(loc.relatedCharacters);
  loc.relatedCharacters = result;
  const newIds=result.map(r=>r.id);
  syncLink('location',loc.id,'relatedCharacters',newIds,'',oldIds);
  autoSave();
  if (state.editingLocation) { const detail=$('#location-detail'); if(detail) detail.innerHTML=renderLocationEditForm(loc); } else { renderTabContent(); }
}

function findTag(tags,id) { for (const t of tags) { if (t.id===id) return t; if (t.children) { const f=findTag(t.children,id); if (f) return f; } } return null; }

function setupLocations() {
  registerSearchTarget('locSearch','location-list',renderLocationList);
  const locList = $('#location-list');
  if (locList) { locList.querySelectorAll('.location-card').forEach(c=>{c.onclick=(ev)=>{if(ev.target.closest('.drag-handle')||ev.target.closest('button'))return;state.selectedLocationId=c.dataset.locId;state.editingLocation=false;state._selectedVariantId=null;state._editingVariantId=null;state._forceAnimate=true;state._animateScope='detail';renderTabContent();};});}
  setupDragSort({
    containerId: 'location-list',
    itemSelector: '.location-card',
    handleSelector: '.drag-handle',
    getArray: () => state.data.locations,
    setArray: (arr) => { state.data.locations = arr; }
  });
}

function addLocation() { let base='新地点',n=1; while((state.data.locations||[]).some(l=>l.name===base)){base='新地点'+(++n);} const loc={id:uid(),name:base,description:'',category:'',tags:[],relatedCharacters:[],events:[],relatedFactions:[],relatedWorldSystems:[],relatedVolumes:[],backpackItems:{},customProps:{}}; state.data.locations.push(loc); state.selectedLocationId=loc.id; state.editingLocation=true; _locIsNew=true; autoSave(); state._forceAnimate=true; state._animateScope='detail'; renderTabContent(); }
async function aiGenLocation() { const text=await runAI(window.api.aiGenerateLocation(state.data)); if (text) { const json=tryParseJSON(text); if (json&&json.name) { const loc={id:uid(),name:json.name,description:json.description||'',category:json.category||'',tags:json.tags||[],relatedCharacters:json.relatedCharacters||[],events:json.events||[],relatedFactions:[],relatedWorldSystems:[],relatedVolumes:[],backpackItems:{},customProps:{}}; state.data.locations.push(loc); state.selectedLocationId=loc.id; autoSave(); renderTabContent(); } } }
function updateLocation(key,value) { const loc=(state.data.locations||[]).find(l=>l.id===state.selectedLocationId); if (loc) { if (key==='name'&&checkDuplicate(state.data.locations,value,loc.id)){showToast('已存在同名地点！');renderTabContent();return;} loc[key]=value; autoSave(); } }
function setLocationCustomProp(propId, value) { const loc=(state.data.locations||[]).find(l=>l.id===state.selectedLocationId); if (!loc) return; if (!loc.customProps) loc.customProps = {}; loc.customProps['cp_'+propId] = value; autoSave(); }

async function openLocEventSelectModal() {
  const loc=(state.data.locations||[]).find(l=>l.id===state.selectedLocationId);
  if (!loc) return;
  const events = collectGlossary('event');
  if (events.length===0){showToast('暂无事件');return;}
  const result = await customLinkModal('选择关联事件', events, loc.events||[], '简述关系');
  if (result===null) return;
  const oldIds=_linkIds(loc.events);
  loc.events = result;
  const newIds=result.map(r=>r.id);
  syncLink('location',loc.id,'events',newIds,'',oldIds);
  autoSave(); if (state.editingLocation) { const detail=$('#location-detail'); if(detail) detail.innerHTML=renderLocationEditForm(loc); } else { renderTabContent(); }
}

async function openLocFactionSelectModal() {
  const loc=(state.data.locations||[]).find(l=>l.id===state.selectedLocationId);
  if (!loc) return;
  const factions = collectGlossary('faction');
  if (factions.length===0){showToast('暂无势力');return;}
  const result = await customLinkModal('选择关联势力', factions, loc.relatedFactions||[], '简述关系');
  if (result===null) return;
  const oldIds=_linkIds(loc.relatedFactions);
  loc.relatedFactions = result;
  const newIds=result.map(r=>r.id);
  syncLink('location',loc.id,'relatedFactions',newIds,'',oldIds);
  autoSave(); if (state.editingLocation) { const detail=$('#location-detail'); if(detail) detail.innerHTML=renderLocationEditForm(loc); } else { renderTabContent(); }
}

async function openLocBackpackSelectModal(bpId) {
  const loc=(state.data.locations||[]).find(l=>l.id===state.selectedLocationId);
  if (!loc) return;
  if (!loc.backpackItems) loc.backpackItems = {};
  const bpItems = (state.data.items||[]).filter(i=>i.backpackId===bpId);
  if (bpItems.length===0){showToast('此系统无物品');return;}
  const selectedIds = loc.backpackItems[bpId]||[];
  const items = bpItems.map(i=>({id:i.id,name:(i.icon||'📦')+' '+(i.name||'未命名')}));
  const result = await customSelectModal('🎲 选择物品', items, selectedIds);
  if (result===null) return;
  loc.backpackItems[bpId] = result;
  autoSave();
  if(state.editingLocation){const d=$('#location-detail');if(d)d.innerHTML=renderLocationEditForm(loc);}else{renderTabContent();}
}

async function deleteLocation(id) { if (!await customConfirm('确定删除此地？')) return; state.data.locations=(state.data.locations||[]).filter(l=>l.id!==id); if (state.selectedLocationId===id) state.selectedLocationId=null; autoSave(); renderTabContent(); }