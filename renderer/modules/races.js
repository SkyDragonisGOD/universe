// ============================================================
// 世界生成器 — 种族
// 依赖: core/state.js, core/utils.js, core/modal.js, core/glossary.js, core/properties.js
// ============================================================

function renderRaces() {
  const races = state.data.races||[];
  const selectedRace = races.find(r=>r.id===state.selectedRaceId);
  const raceRelDefs = [
    { key:'character', label:'角色', field:'relatedCharacters', getItems:()=>collectGlossary('character') },
    { key:'location', label:'地点', field:'regions', getItems:()=>collectGlossary('location') },
    { key:'event', label:'事件', field:'relatedEvents', getItems:()=>(state.data.timeline||[]).map(e=>({id:e.id,name:e.name||e.title||'未命名'})) },
  ];
  const raceRelMatchDefs = [
    { key:'character', field:'relatedCharacters' },
    { key:'location', field:'regions' },
    { key:'event', field:'relatedEvents' },
  ];
  const filtered = races.filter(r => matchRelFilter(r, 'raceRelFilter', raceRelMatchDefs));
  return `<div class="item-layout"><div class="item-list-panel"><div class="flex-between mb-8"><h3>🧬 种族</h3><button class="btn btn-sm btn-primary" onclick="addRace()">+ 新建种族</button></div>
    ${renderSearchBox('raceSearch')}
    ${renderRelFilter('raceRelFilter', raceRelDefs)}
    <div id="race-list">${filtered.length===0?'<div class="empty-state"><div class="icon">🧬</div><p>暂无种族</p></div>':filtered.filter(r=>matchSearch(r.name,'raceSearch')).map(r=>`<div class="item-list-item${state.selectedRaceId===r.id&&!state._selectedVariantId?' selected':''}" data-race-id="${r.id}" oncontextmenu="event.preventDefault();_showEntityCtxMenu(event,'race','${esc(r.id)}')"><span class="race-drag-handle" style="cursor:grab;font-size:10px;color:var(--warm-gray);margin-right:4px;user-select:none" title="拖拽排序">⠿</span><span class="item-icon">🧬</span><span>${esc(r.name)}${_renderVariantDropdown('race',r.id,r.name)}</span></div>${_renderVariantListItems('race',r.id)}`).join('')}</div></div>
    <div class="item-detail-panel"><div id="race-detail">${renderRaceDetail()}</div></div></div>`;
}

function renderRaceDetail() {
  if (state._selectedVariantId) {
    const v = _getVariantById(state._selectedVariantId);
    if (v && v.parentType === 'race' && v.parentId === state.selectedRaceId) {
      if (state._editingVariantId === v.id) return _renderVariantEditPage(v);
      return _renderVariantDetailPage(v);
    }
    state._selectedVariantId = null;
    state._editingVariantId = null;
  }
  const selectedRace = (state.data.races||[]).find(r=>r.id===state.selectedRaceId);
  if (!selectedRace) return '<div class="empty-state"><div class="icon">👆</div><p>选择左侧种族查看详情</p></div>';
  if (state.editingRace) return renderRaceEditForm(selectedRace);
  return renderRaceWikiView(selectedRace);
}

function renderRaceWikiView(race) {
  const locations = collectGlossary('location');
  const characters = collectGlossary('character');
  const hasBasic = race.origin||race.lifespan||race.appearance;
  const hasTraits = race.traits||race.abilities;
  ensurePropertyDefs();
  const customProps = getCustomPropsForScope('races');
  const cpData = race.customProps || {};
  const cpHtml = renderCustomPropWikiHtml(customProps, cpData);
  const regionLinks = _normLinks(race.regions);
  const charLinks = _normLinks(race.relatedCharacters);

  return `<div class="wiki-page detail-scroll-area">
    <div class="wiki-header">
      <h2 class="wiki-title">🧬 ${esc(race.name)}</h2>
      <div class="wiki-meta">
        ${race.category&&race.category!=='未知'?`<span class="wiki-badge race" style="cursor:pointer" title="${esc(getCategoryDesc('raceCategory',race.category))}" onclick="openCategoryDetail('raceCategory','${esc(race.category)}')">${esc(race.category)}</span>`:''}
        ${race.scale&&race.scale!=='未知'?`<span class="wiki-badge age" style="cursor:pointer" title="${esc(getScaleDesc(race.scale))}" onclick="openPropOptionDetail('规模','${esc(race.scale)}','${esc(getScaleDesc(race.scale))}','','switchTab(&quot;properties&quot;)')">${esc(race.scale)}</span>`:''}
      </div>
      ${cpHtml?`<div style="margin-top:4px">${cpHtml}</div>`:''}
    </div>
    ${hasBasic?`<div class="wiki-section"><div class="wiki-section-title">基本信息</div>
      ${race.origin?`<div class="wiki-field"><span class="wiki-label">起源</span><span class="wiki-value">${_renderLinkedContent(race.origin)}</span></div>`:''}
      ${race.lifespan?`<div class="wiki-field"><span class="wiki-label">寿命</span><span class="wiki-value">${_renderLinkedContent(race.lifespan)}</span></div>`:''}
      ${race.appearance?`<div class="wiki-field"><span class="wiki-label">外貌</span><span class="wiki-value">${_renderLinkedContent(race.appearance)}</span></div>`:''}
    </div>`:''}
    ${hasTraits?`<div class="wiki-section"><div class="wiki-section-title">种族特征</div>
      ${race.traits?`<div class="wiki-field"><span class="wiki-label">特征</span><span class="wiki-value">${_renderLinkedContent(race.traits)}</span></div>`:''}
      ${race.abilities?`<div class="wiki-field"><span class="wiki-label">天赋能力</span><span class="wiki-value">${_renderLinkedContent(race.abilities)}</span></div>`:''}
    </div>`:''}
    ${race.culture?`<div class="wiki-section"><div class="wiki-section-title">文化</div><div class="wiki-value">${_renderLinkedContent(race.culture)}</div></div>`:''}
    ${regionLinks.length>0?`<div class="wiki-section"><div class="wiki-section-title">常驻地区</div><div class="wiki-tags">${regionLinks.map(rl=>{const loc=(state.data.locations||[]).find(l=>l.id===rl.id||l.name===rl.id);const descArg=rl.desc?`, '${jsStr(rl.desc)}'`:'';return loc?`<span class="wiki-tag skill" onclick="showPreviewCard('location','${esc(loc.id)}',event${descArg})" style="cursor:pointer">${esc(loc.name)}</span>`:`<span class="wiki-tag skill">${esc(rl.id)}</span>`;}).join('')}</div></div>`:''}
    ${charLinks.length>0?`<div class="wiki-section"><div class="wiki-section-title">代表角色</div><div class="wiki-tags">${charLinks.map(cl=>{const ch=characters.find(c=>c.id===cl.id);const descArg=cl.desc?`, '${jsStr(cl.desc)}'`:'';return ch?`<span class="wiki-tag skill" onclick="showPreviewCard('character','${esc(ch.id)}',event${descArg})" style="cursor:pointer">${esc(ch.name)}</span>`:`<span class="wiki-tag skill">${esc(cl.id)}</span>`;}).join('')}</div></div>`:''}
    ${race.description?`<div class="wiki-section"><div class="wiki-section-title">描述</div><div class="wiki-value">${_renderLinkedContent(race.description)}</div></div>`:''}
    ${_normLinks(race.relatedEvents).length>0?`<div class="wiki-section"><div class="wiki-section-title">关联事件</div><div class="wiki-tags">${_normLinks(race.relatedEvents).map(el=>{const ev=(state.data.timeline||[]).find(e=>e.id===el.id);const descArg=el.desc?`, '${jsStr(el.desc)}'`:'';return ev?`<span class="wiki-tag item" onclick="showPreviewCard('event','${esc(ev.id)}',event${descArg})" style="cursor:pointer">${esc(ev.name)}</span>`:`<span class="wiki-tag item">${esc(el.id)}</span>`;}).join('')}</div></div>`:''}
    ${_normLinks(race.relatedVolumes).length>0?`<div class="wiki-section"><div class="wiki-section-title">📑 关联卷</div><div class="wiki-tags">${_normLinks(race.relatedVolumes).map(vl=>{const vol=(state.data.outline||[]).find((v,i)=>i===parseInt(vl.id)||v.id===vl.id);return vol?`<span class="wiki-tag item">📖 ${esc(vol.title||'未命名卷')}</span>`:`<span class="wiki-tag item">${esc(vl.id)}</span>`;}).join('')}</div></div>`:''}
    ${_renderVariantWikiSection('race',race.id)}
  </div>
  <div class="detail-sticky-bar">
    <button class="btn btn-sm btn-outline" onclick="if(state.navigationHistory.length>0)goBack();else{state.selectedRaceId=null;renderTabContent()}">← 返回</button>
    <div class="flex-gap">
      <button class="btn btn-sm btn-danger" onclick="deleteRace('${race.id}')">🗑️ 删除</button>
      <button class="btn btn-sm btn-primary" onclick="startRaceEdit()">✏️ 编辑</button>
    </div>
  </div>`;
}

function renderRaceEditForm(race) {
  const locations = collectGlossary('location');
  const characters = collectGlossary('character');
  ensurePropertyDefs();
  const customProps = getCustomPropsForScope('races');
  if (!race.customProps) race.customProps = {};
  const regionLinks = _normLinks(race.regions);
  const charLinks = _normLinks(race.relatedCharacters);
  return `<div class="card detail-scroll-area">
    <div class="form-row"><div class="form-group"><label>名称</label><input value="${esc(race.name)}" onchange="updateRace('name',this.value)"></div>
    <div class="form-group"><label>分类</label>${renderCategorySelect(race.category||'','raceCategory',"updateRace('category',this.value)")}</div></div>
    <div class="form-row"><div class="form-group"><label>寿命</label><input value="${esc(race.lifespan||'')}" onchange="updateRace('lifespan',this.value)" placeholder="如：200年/永生"></div>
    <div class="form-group"><label>规模</label>${renderScaleSelect(race.scale||'', "updateRace('scale',this.value)")}</div></div>
    <div class="form-group"><label>外貌描述</label><input value="${esc(race.appearance||'')}" onchange="updateRace('appearance',this.value)" placeholder="如：银色长发、尖耳、金色瞳孔"></div>
    ${customProps.map(prop => {
      const key = 'cp_' + prop.id;
      const val = race.customProps[key] || '';
      return renderCustomPropField(prop, val, `setRaceCustomProp('${prop.id}',this.value)`);
    }).join('')}
    <div class="card"><h4>种族特征</h4>
      <div class="form-group"><label>特征</label><textarea rows="2" onchange="updateRace('traits',this.value)">${esc(race.traits||'')}</textarea></div>
      <div class="form-group"><label>天赋能力</label><textarea rows="2" onchange="updateRace('abilities',this.value)">${esc(race.abilities||'')}</textarea></div>
    </div>
    <div class="form-group"><label>文化</label><textarea rows="2" onchange="updateRace('culture',this.value)">${esc(race.culture||'')}</textarea></div>
    <div class="card"><h4>📍 常驻地区</h4>
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px">
        <span class="text-xs text-muted">已选 ${regionLinks.length} 个</span>
        <button class="btn btn-xs btn-outline" onclick="openRaceRegionSelectModal()">选择地区</button>
      </div>
      ${regionLinks.length>0?`<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px">${regionLinks.map(rl=>{const loc=locations.find(l=>l.id===rl.id);const descHtml=rl.desc?`<span style="font-size:11px;color:var(--text-muted)">(${esc(rl.desc)})</span>`:'';return loc?`<span class="wiki-tag skill">${esc(loc.name)}${descHtml}<button class="btn btn-xs btn-icon btn-danger" style="font-size:8px;margin-left:2px" onclick="removeRaceRegion('${esc(rl.id)}')">×</button></span>`:'';}).join('')}</div>`:''}
    </div>
    <div class="card"><h4>👤 代表角色</h4>
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px">
        <span class="text-xs text-muted">已选 ${charLinks.length} 人</span>
        <button class="btn btn-xs btn-outline" onclick="openRaceCharSelectModal()">选择角色</button>
      </div>
      ${charLinks.length>0?`<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px">${charLinks.map(cl=>{const ch=characters.find(c=>c.id===cl.id);const descHtml=cl.desc?`<span style="font-size:11px;color:var(--text-muted)">(${esc(cl.desc)})</span>`:'';return ch?`<span class="wiki-tag skill">${esc(ch.name)}${descHtml}<button class="btn btn-xs btn-icon btn-danger" style="font-size:8px;margin-left:2px" onclick="removeRaceChar('${esc(cl.id)}')">×</button></span>`:'';}).join('')}</div>`:''}
    </div>
    <div class="card"><h4>📑 关联卷</h4>
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px">
        <span class="text-xs text-muted">已选 ${_normLinks(race.relatedVolumes).length} 个</span>
        <button class="btn btn-xs btn-outline" onclick="openRaceVolumeModal()">选择卷</button>
      </div>
      ${_normLinks(race.relatedVolumes).length>0?`<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px">${_normLinks(race.relatedVolumes).map(vl=>{const vol=(state.data.outline||[]).find((v,i)=>i===parseInt(vl.id)||v.id===vl.id);return vol?`<span class="wiki-tag item">📖 ${esc(vol.title||'未命名卷')}<button class="btn btn-xs btn-icon btn-danger" style="font-size:8px;margin-left:2px" onclick="removeRaceVolume('${esc(vl.id)}')">×</button></span>`:'';}).join('')}</div>`:''}
    </div>
    <div class="card"><h4>⚡ 关联事件</h4>
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px">
        <span class="text-xs text-muted">已选 ${_normLinks(race.relatedEvents).length} 个</span>
        <button class="btn btn-xs btn-outline" onclick="openRaceEventModal()">选择事件</button>
      </div>
      ${_normLinks(race.relatedEvents).length>0?`<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px">${_normLinks(race.relatedEvents).map(el=>{const ev=(state.data.timeline||[]).find(e=>e.id===el.id);return ev?`<span class="wiki-tag item">⚡ ${esc(ev.name)}<button class="btn btn-xs btn-icon btn-danger" style="font-size:8px;margin-left:2px" onclick="removeRaceEvent('${esc(el.id)}')">×</button></span>`:'';}).join('')}</div>`:''}
    </div>
    <div class="form-group"><label>描述</label><textarea rows="3" onchange="updateRace('description',this.value)">${esc(race.description||'')}</textarea></div>

    ${_renderVariantSection('race',race.id,race.name)}
  </div>
  <div class="detail-sticky-bar">
    <div></div>
    <div class="flex-gap">
      <button class="btn btn-sm btn-outline" onclick="cancelRaceEdit()">取消</button>
      <button class="btn btn-sm btn-primary" onclick="saveRaceEdit()">💾 保存</button>
    </div>
  </div>`;
}

let _raceEditSnapshot = null;
let _raceIsNew = false;

function addRace() {
  const race = { id:uid(), name:'新种族', category:'', origin:'', traits:'', lifespan:'', scale:'', appearance:'', abilities:'', culture:'', regions:[], relatedCharacters:[], relatedEvents:[], relatedVolumes:[], description:'', customProps:{} };
  state.data.races.push(race);
  state.selectedRaceId = race.id;
  state.editingRace = true;
  _raceIsNew = true;
  autoSave();
  state._forceAnimate=true; state._animateScope='detail'; renderTabContent();
}
function startRaceEdit() {
  const race = (state.data.races||[]).find(r=>r.id===state.selectedRaceId);
  if (race) _raceEditSnapshot = JSON.parse(JSON.stringify(race));
  _raceIsNew = false;
  state.editingRace = true; state._forceAnimate=true; state._animateScope='detail'; renderTabContent();
}
function saveRaceEdit() { _raceEditSnapshot = null; _raceIsNew = false; state.editingRace = false; autoSave(); state._forceAnimate=true; state._animateScope='detail'; renderTabContent(); }
function cancelRaceEdit() {
  if (_raceIsNew) {
    state.data.races = (state.data.races||[]).filter(r=>r.id!==state.selectedRaceId);
    state.selectedRaceId = null;
    _raceIsNew = false;
    _raceEditSnapshot = null;
    autoSave(); state._forceAnimate=true; state._animateScope='detail'; renderTabContent(); return;
  }
  if (_raceEditSnapshot) {
    const race = (state.data.races||[]).find(r=>r.id===state.selectedRaceId);
    if (race) Object.assign(race, _raceEditSnapshot);
    _raceEditSnapshot = null;
  }
  state.editingRace = false; state._forceAnimate=true; state._animateScope='detail'; renderTabContent();
}
function updateRace(key, value) { const race = (state.data.races||[]).find(r=>r.id===state.selectedRaceId); if (race) { if (key==='name'&&checkDuplicate(state.data.races,value,race.id)){showToast('已存在同名种族！');renderTabContent();return;} race[key]=value; autoSave(); } }
function setRaceCustomProp(propId, value) { const race = (state.data.races||[]).find(r=>r.id===state.selectedRaceId); if (!race) return; if (!race.customProps) race.customProps = {}; race.customProps['cp_'+propId] = value; autoSave(); }
function removeRaceRegion(locId) { const race=(state.data.races||[]).find(r=>r.id===state.selectedRaceId); if (!race) return; const oldIds=_linkIds(race.regions); race.regions=_removeLink(race.regions,locId); syncLink('race',race.id,'regions',_linkIds(race.regions),'',oldIds); autoSave(); if (state.editingRace) { const d=$('#race-detail'); if(d) d.innerHTML=renderRaceEditForm(race); } }
function removeRaceChar(charId) { const race=(state.data.races||[]).find(r=>r.id===state.selectedRaceId); if (!race) return; const oldIds=_linkIds(race.relatedCharacters); race.relatedCharacters=_removeLink(race.relatedCharacters,charId); syncLink('race',race.id,'relatedCharacters',_linkIds(race.relatedCharacters),'',oldIds); autoSave(); if (state.editingRace) { const d=$('#race-detail'); if(d) d.innerHTML=renderRaceEditForm(race); } }

async function openRaceVolumeModal() {
  const race=(state.data.races||[]).find(r=>r.id===state.selectedRaceId); if (!race) return;
  const outline=state.data.outline||[];
  if(outline.length===0){showToast('暂无卷');return;}
  const volItems=outline.map((v,i)=>({id:String(i),name:v.title||('第'+(i+1)+'卷')}));
  const existingIds=_normLinks(race.relatedVolumes||[]).map(l=>l.id);
  const result=await customSelectModal('📑 选择关联卷',volItems,existingIds);
  if(result===null) return;
  if(!race.relatedVolumes) race.relatedVolumes=[];
  race.relatedVolumes=result.map(id=>({id}));
  autoSave();
  if(state.editingRace){const d=$('#race-detail');if(d)d.innerHTML=renderRaceEditForm(race);}else{renderTabContent();}
}
function removeRaceVolume(id) {
  const race=(state.data.races||[]).find(r=>r.id===state.selectedRaceId); if (!race) return;
  race.relatedVolumes=_normLinks(race.relatedVolumes||[]).filter(l=>l.id!==id).map(l=>({id:l.id,desc:l.desc}));
  autoSave();
  if(state.editingRace){const d=$('#race-detail');if(d)d.innerHTML=renderRaceEditForm(race);}else{renderTabContent();}
}

async function openRaceEventModal() {
  const race=(state.data.races||[]).find(r=>r.id===state.selectedRaceId); if (!race) return;
  const events=(state.data.timeline||[]);
  if(events.length===0){showToast('暂无事件');return;}
  const eventItems=events.map(e=>({id:e.id,name:e.name||'未命名事件'}));
  const existingIds=_normLinks(race.relatedEvents||[]).map(l=>l.id);
  const result=await customSelectModal('⚡ 选择关联事件',eventItems,existingIds);
  if(result===null) return;
  if(!race.relatedEvents) race.relatedEvents=[];
  race.relatedEvents=result.map(id=>({id}));
  autoSave();
  if(state.editingRace){const d=$('#race-detail');if(d)d.innerHTML=renderRaceEditForm(race);}else{renderTabContent();}
}
function removeRaceEvent(id) {
  const race=(state.data.races||[]).find(r=>r.id===state.selectedRaceId); if (!race) return;
  race.relatedEvents=_normLinks(race.relatedEvents||[]).filter(l=>l.id!==id).map(l=>({id:l.id,desc:l.desc}));
  autoSave();
  if(state.editingRace){const d=$('#race-detail');if(d)d.innerHTML=renderRaceEditForm(race);}else{renderTabContent();}
}

async function openRaceRegionSelectModal() {
  const race = (state.data.races||[]).find(r=>r.id===state.selectedRaceId);
  if (!race) return;
  const locations = collectGlossary('location');
  if (locations.length === 0) { showToast('暂无地点'); return; }
  const result = await customLinkModal('选择常驻地区', locations, race.regions||[], '简述关系');
  if (result === null) return;
  const oldIds=_linkIds(race.regions);
  race.regions = result;
  const newIds=result.map(r=>r.id);
  syncLink('race',race.id,'regions',newIds,'',oldIds);
  autoSave();
  if (state.editingRace) { const d=$('#race-detail'); if(d) d.innerHTML=renderRaceEditForm(race); } else { renderTabContent(); }
}

async function openRaceCharSelectModal() {
  const race = (state.data.races||[]).find(r=>r.id===state.selectedRaceId);
  if (!race) return;
  const characters = collectGlossary('character');
  if (characters.length === 0) { showToast('暂无角色'); return; }
  const result = await customLinkModal('选择代表角色', characters, race.relatedCharacters||[], '简述关系');
  if (result === null) return;
  const oldIds=_linkIds(race.relatedCharacters);
  race.relatedCharacters = result;
  const newIds=result.map(r=>r.id);
  syncLink('race',race.id,'relatedCharacters',newIds,'',oldIds);
  autoSave();
  if (state.editingRace) { const d=$('#race-detail'); if(d) d.innerHTML=renderRaceEditForm(race); } else { renderTabContent(); }
}

async function deleteRace(id) { if (!await customConfirm('确定删除此种族？')) return; state.data.races=(state.data.races||[]).filter(r=>r.id!==id); if (state.selectedRaceId===id) state.selectedRaceId=null; autoSave(); renderTabContent(); }

function setupRaces() {
  registerSearchTarget('raceSearch','race-list',()=>{const races=state.data.races||[];const raceRelMatchDefs=[{key:'character',field:'relatedCharacters'},{key:'location',field:'regions'},{key:'event',field:'relatedEvents'}];const filtered=races.filter(r=>matchRelFilter(r,'raceRelFilter',raceRelMatchDefs)).filter(r=>matchSearch(r.name,'raceSearch'));return filtered.length===0?'<div class="empty-state"><div class="icon">🧬</div><p>暂无种族</p></div>':filtered.map(r=>`<div class="item-list-item${state.selectedRaceId===r.id?' selected':''}" data-race-id="${r.id}"><span class="drag-handle" style="cursor:grab;font-size:10px;color:var(--warm-gray);margin-right:4px;user-select:none" title="拖拽排序">⠿</span><span class="item-icon">🧬</span><span>${esc(r.name)}</span></div>`).join('');});
  const list = $('#race-list');
  if (!list) return;
  list.querySelectorAll('.item-list-item').forEach(item=>{
    item.onclick=(ev)=>{
      if(ev.target.closest('.drag-handle')) return;
      state.selectedRaceId=item.dataset.raceId;state.editingRace=false;state._selectedVariantId=null;state._editingVariantId=null;state._forceAnimate=true;state._animateScope='detail';renderTabContent();
    };
  });
  setupDragSort({
    containerId: 'race-list',
    itemSelector: '.item-list-item',
    handleSelector: '.drag-handle',
    getArray: () => state.data.races,
    setArray: (arr) => { state.data.races = arr; }
  });
}