// ============================================================
// 世界生成器 — 势力
// 依赖: core/state.js, core/utils.js, core/modal.js, core/glossary.js
// ============================================================

function renderFactions() {
  const factionRelDefs = [
    { key:'character', label:'角色', field:'members', getItems:()=>collectGlossary('character') },
    { key:'location', label:'地点', fields:['headquarters'], getItems:()=>collectGlossary('location') },
    { key:'faction', label:'势力', fields:['rivals','allies'], getItems:()=>(state.data.factions||[]).map(f=>({id:f.id,name:f.name||'未命名'})) },
    { key:'event', label:'事件', field:'relatedEvents', getItems:()=>(state.data.timeline||[]).map(e=>({id:e.id,name:e.name||e.title||'未命名'})) },
  ];
  return `<div class="faction-layout">
    <div class="faction-list-panel"><div class="flex-between mb-8"><h3>🏰 势力列表</h3><div class="flex-gap"><button class="btn btn-ai btn-sm" onclick="aiGenFaction()">🤖 AI 生成</button><button class="btn btn-sm btn-primary" onclick="addFaction()">+ 新建</button></div></div>
      ${renderSearchBox('factionSearch')}
      ${renderRelFilter('factionRelFilter', factionRelDefs)}
      <div id="faction-list">${renderFactionList()}</div></div>
    <div class="faction-detail-panel" id="faction-detail">${renderFactionDetail()}</div></div>`;
}

function renderFactionList() {
  const factions = state.data.factions||[];
  const factionRelMatchDefs = [
    { key:'character', field:'members' },
    { key:'location', fields:['headquarters'] },
    { key:'faction', fields:['rivals','allies'] },
    { key:'event', field:'relatedEvents' },
  ];
  const filtered = factions.filter(f => matchRelFilter(f, 'factionRelFilter', factionRelMatchDefs)).filter(f => matchSearch(f.name, 'factionSearch'));
  if (filtered.length===0) return '<div class="empty-state"><div class="icon">🏰</div><p>暂无势力</p></div>';
  return filtered.map(f=>`<div class="faction-list-item${state.selectedFactionId===f.id?' selected':''}" data-faction-id="${f.id}"><span class="drag-handle" style="cursor:grab;font-size:10px;color:var(--muted);user-select:none">⠿</span><span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(f.name)}</span><span class="tag" style="background:${f.color||'#888'}">${esc(f.type||'')}</span></div>`).join('');
}

function renderFactionDetail() {
  const f = (state.data.factions||[]).find(fa=>fa.id===state.selectedFactionId);
  if (!f) return '<div class="empty-state"><div class="icon">👆</div><p>选择左侧势力查看详情</p></div>';
  if (state.editingFaction) return renderFactionEditForm(f);
  return renderFactionWikiView(f);
}

function renderFactionWikiView(f) {
  const locations = collectGlossary('location');
  const characters = collectGlossary('character');
  const allFactions = state.data.factions||[];
  const hqLinks = _normLinks(f.headquarters);
  const hqNames = hqLinks.map(hl=>{const loc=locations.find(l=>l.id===hl.id||l.name===hl.id);return loc?loc.name:hl.id;});
  const memberNames = _normLinks(f.members).map(ml=>{const ch=characters.find(c=>c.id===ml.id||c.name===ml.id);return ch?ch.name:ml.id;});
  const rivalNames = _normLinks(f.rivals).map(rl=>{const rf=allFactions.find(fa=>fa.id===rl.id);return rf?rf.name:rl.id;});
  const allyNames = _normLinks(f.allies).map(al=>{const af=allFactions.find(fa=>fa.id===al.id);return af?af.name:al.id;});
  ensurePropertyDefs();
  const customProps = getCustomPropsForScope('factions');
  const cpData = f.customProps || {};
  const customPropHtml = renderCustomPropWikiHtml(customProps, cpData);

  return `<div class="wiki-page detail-scroll-area">
    <div class="wiki-header">
      <h2 class="wiki-title">🏰 ${esc(f.name)}</h2>
      <div class="wiki-meta">
        ${f.type&&f.type!=='未知'?`<span class="wiki-badge role" style="background:${f.color||'#888'};color:#fff;cursor:pointer" title="${esc(getCategoryDesc('factionType',f.type))}" onclick="openCategoryDetail('factionType','${esc(f.type)}')">${esc(f.type)}</span>`:''}
      </div>
      ${hqNames.length>0?`<div class="wiki-field"><span class="wiki-label">总部/据点</span><div class="wiki-tags">${hqLinks.map(hl=>{const loc=locations.find(l=>l.id===hl.id||l.name===hl.id);const descArg=hl.desc?`, '${jsStr(hl.desc)}'`:'';return loc?`<span class="wiki-tag skill" onclick="showPreviewCard('location','${esc(loc.id)}',event${descArg})" style="cursor:pointer">${esc(loc.name)}</span>`:`<span class="wiki-tag skill">${esc(hl.id)}</span>`;}).join('')}</div></div>`:''}
      ${customPropHtml?`<div style="margin-top:4px">${customPropHtml}</div>`:''}
    </div>
    ${f.description?`<div class="wiki-section"><div class="wiki-section-title">描述</div><div class="wiki-value">${esc(f.description)}</div></div>`:''}
    ${f.goals?`<div class="wiki-section"><div class="wiki-section-title">目标/宗旨</div><div class="wiki-value">${esc(f.goals)}</div></div>`:''}
    ${memberNames.length>0?`<div class="wiki-section"><div class="wiki-section-title">成员</div><div class="wiki-tags">${_normLinks(f.members).map(ml=>{const ch=characters.find(c=>c.id===ml.id||c.name===ml.id);const descArg=ml.desc?`, '${jsStr(ml.desc)}'`:'';return ch?`<span class="wiki-tag skill" onclick="showPreviewCard('character','${esc(ch.id)}',event${descArg})" style="cursor:pointer">${esc(ch.name)}</span>`:`<span class="wiki-tag skill">${esc(ml.id)}</span>`;}).join('')}</div></div>`:''}
    ${rivalNames.length>0?`<div class="wiki-section"><div class="wiki-section-title">敌对势力</div><div class="wiki-tags">${_normLinks(f.rivals).map(rl=>{const rf=allFactions.find(fa=>fa.id===rl.id);const descArg=rl.desc?`, '${jsStr(rl.desc)}'`:'';return rf?`<span class="wiki-tag item" onclick="showPreviewCard('faction','${esc(rf.id)}',event${descArg})" style="cursor:pointer;background:#fde8e8;color:#9b2c2c">${esc(rf.name)}</span>`:`<span class="wiki-tag item" style="background:#fde8e8;color:#9b2c2c">${esc(rl.id)}</span>`;}).join('')}</div></div>`:''}
    ${allyNames.length>0?`<div class="wiki-section"><div class="wiki-section-title">盟友势力</div><div class="wiki-tags">${_normLinks(f.allies).map(al=>{const af=allFactions.find(fa=>fa.id===al.id);const descArg=al.desc?`, '${jsStr(al.desc)}'`:'';return af?`<span class="wiki-tag item" onclick="showPreviewCard('faction','${esc(af.id)}',event${descArg})" style="cursor:pointer">${esc(af.name)}</span>`:`<span class="wiki-tag item">${esc(al.id)}</span>`;}).join('')}</div></div>`:''}
    ${_normLinks(f.relatedEvents).length>0?`<div class="wiki-section"><div class="wiki-section-title">关联事件</div><div class="wiki-tags">${_normLinks(f.relatedEvents).map(el=>{const ev=(state.data.timeline||[]).find(e=>e.id===el.id);const descArg=el.desc?`, '${jsStr(el.desc)}'`:'';return ev?`<span class="wiki-tag item" onclick="showPreviewCard('event','${esc(ev.id)}',event${descArg})" style="cursor:pointer">${esc(ev.name)}</span>`:`<span class="wiki-tag item">${esc(el.id)}</span>`;}).join('')}</div></div>`:''}
    ${_normLinks(f.relatedVolumes).length>0?`<div class="wiki-section"><div class="wiki-section-title">📑 关联卷</div><div class="wiki-tags">${_normLinks(f.relatedVolumes).map(vl=>{const vol=(state.data.outline||[]).find((v,i)=>i===parseInt(vl.id)||v.id===vl.id);return vol?`<span class="wiki-tag item">📖 ${esc(vol.title||'未命名卷')}</span>`:`<span class="wiki-tag item">${esc(vl.id)}</span>`;}).join('')}</div></div>`:''}
  </div>
  <div class="detail-sticky-bar">
    <button class="btn btn-sm btn-outline" onclick="if(state.navigationHistory.length>0)goBack();else{state.selectedFactionId=null;renderTabContent()}">← 返回</button>
    <div class="flex-gap">
      <button class="btn btn-sm btn-danger" onclick="deleteFaction('${f.id}')">🗑️ 删除</button>
      <button class="btn btn-sm btn-primary" onclick="startFactionEdit()">✏️ 编辑</button>
    </div>
  </div>`;
}

function renderFactionEditForm(f) {
  const types = collectGlossary('factionType');
  const locations = collectGlossary('location');
  const characters = collectGlossary('character');
  const allFactions = (state.data.factions||[]).filter(fa=>fa.id!==f.id);
  const hqLinks = _normLinks(Array.isArray(f.headquarters)?f.headquarters:(f.headquarters?[f.headquarters]:[]));
  ensurePropertyDefs();
  const customProps = getCustomPropsForScope('factions');
  if (!f.customProps) f.customProps = {};
  return `<div class="card detail-scroll-area">
    <div class="form-row"><div class="form-group"><label>名称</label><input value="${esc(f.name)}" onchange="updateFaction('name',this.value)"></div>
    <div class="form-group"><label>类型</label>${renderCategorySelect(f.type||'','factionType',"updateFaction('type',this.value)")}</div></div>
    <div class="form-row"><div class="form-group"><label>势力颜色</label><input type="color" value="${f.color||'#888888'}" onchange="updateFaction('color',this.value)" style="width:60px;height:36px;padding:2px;background:var(--white);border:1px solid var(--border);border-radius:var(--radius-sm)"></div></div>
    ${customProps.map(prop => {
      const key = 'cp_' + prop.id;
      const val = f.customProps[key] || '';
      return renderCustomPropField(prop, val, `setFactionCustomProp('${prop.id}',this.value)`);
    }).join('')}

    <div class="card"><h3>📍 总部/据点</h3>
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px">
        <span class="text-xs text-muted">已选 ${hqLinks.length} 个</span>
        <button class="btn btn-xs btn-outline" onclick="openFactionHQSelectModal()">选择地点</button>
      </div>
      ${hqLinks.length>0?`<div style="display:flex;flex-direction:column;gap:6px">${hqLinks.map(hl=>{const loc=locations.find(l=>l.id===hl.id);const descHtml=hl.desc?`<span style="font-size:11px;color:var(--text-muted);margin-left:4px">(${esc(hl.desc)})</span>`:'';return loc?`<div class="card" style="margin:0;padding:10px 12px;display:flex;align-items:center;gap:8px;cursor:pointer" onclick="showPreviewCard('location','${esc(loc.id)}',event)"><span style="font-weight:500;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">📍 ${esc(loc.name)}${descHtml}</span><button class="btn btn-xs" style="padding:2px 6px;font-size:11px;color:var(--warm-gray)" onclick="event.stopPropagation();removeFactionHQ('${esc(hl.id)}')">✕</button></div>`:`<div class="card" style="margin:0;padding:10px 12px;display:flex;align-items:center;gap:8px"><span style="flex:1">${esc(hl.id)}${descHtml}</span><button class="btn btn-xs" style="padding:2px 6px;font-size:11px;color:var(--warm-gray)" onclick="removeFactionHQ('${esc(hl.id)}')">✕</button></div>`;}).join('')}</div>`:''}
    </div>
    <div class="card"><h4>详细介绍</h4>
      <div class="form-group"><label>描述</label><textarea rows="3" onchange="updateFaction('description',this.value)">${esc(f.description||'')}</textarea></div>
      <div class="form-group"><label>目标/宗旨</label><textarea rows="2" onchange="updateFaction('goals',this.value)">${esc(f.goals||'')}</textarea></div>
    </div>
    <div class="card"><h4>关联</h4>
      <div class="form-group"><label>关联角色</label>
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <span class="text-xs text-muted">已选 ${_normLinks(f.members).length} 人</span>
          <button class="btn btn-xs btn-outline" onclick="openFactionMemberModal()">选择角色</button>
        </div>
        ${_normLinks(f.members).length>0?`<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px">${_normLinks(f.members).map(ml=>{const ch=characters.find(c=>c.id===ml.id);const descHtml=ml.desc?`<span style="font-size:11px;color:var(--text-muted)">(${esc(ml.desc)})</span>`:'';return ch?`<span class="wiki-tag skill">${esc(ch.name)}${descHtml}<button class="btn btn-xs btn-icon btn-danger" style="font-size:8px;margin-left:2px" onclick="removeFactionMember('${esc(ml.id)}')">×</button></span>`:'';}).join('')}</div>`:''}
      </div>
      <div class="form-group"><label>敌对势力</label>
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <span class="text-xs text-muted">已选 ${_normLinks(f.rivals).length} 个</span>
          <button class="btn btn-xs btn-outline" onclick="openFactionRivalModal()">选择势力</button>
        </div>
        ${_normLinks(f.rivals).length>0?`<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px">${_normLinks(f.rivals).map(rl=>{const rf=allFactions.find(fa=>fa.id===rl.id);const descHtml=rl.desc?`<span style="font-size:11px;color:var(--text-muted)">(${esc(rl.desc)})</span>`:'';return rf?`<span class="wiki-tag item" style="background:#fde8e8;color:#9b2c2c">${esc(rf.name)}${descHtml}<button class="btn btn-xs btn-icon btn-danger" style="font-size:8px;margin-left:2px" onclick="removeFactionRival('${esc(rl.id)}')">×</button></span>`:'';}).join('')}</div>`:''}
      </div>
      <div class="form-group"><label>盟友势力</label>
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <span class="text-xs text-muted">已选 ${_normLinks(f.allies).length} 个</span>
          <button class="btn btn-xs btn-outline" onclick="openFactionAllyModal()">选择势力</button>
        </div>
        ${_normLinks(f.allies).length>0?`<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px">${_normLinks(f.allies).map(al=>{const af=allFactions.find(fa=>fa.id===al.id);const descHtml=al.desc?`<span style="font-size:11px;color:var(--text-muted)">(${esc(al.desc)})</span>`:'';return af?`<span class="wiki-tag item">${esc(af.name)}${descHtml}<button class="btn btn-xs btn-icon btn-danger" style="font-size:8px;margin-left:2px" onclick="removeFactionAlly('${esc(al.id)}')">×</button></span>`:'';}).join('')}</div>`:''}
      </div>
      <div class="form-group"><label>关联事件</label>
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <span class="text-xs text-muted">已选 ${_normLinks(f.relatedEvents).length} 个</span>
          <button class="btn btn-xs btn-outline" onclick="openFactionEventModal()">选择事件</button>
        </div>
        ${_normLinks(f.relatedEvents).length>0?`<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px">${_normLinks(f.relatedEvents).map(el=>{const ev=(state.data.timeline||[]).find(e=>e.id===el.id);const descHtml=el.desc?`<span style="font-size:11px;color:var(--text-muted)">(${esc(el.desc)})</span>`:'';return ev?`<span class="wiki-tag item">${esc(ev.name)}${descHtml}<button class="btn btn-xs btn-icon btn-danger" style="font-size:8px;margin-left:2px" onclick="removeFactionEvent('${esc(el.id)}')">×</button></span>`:'';}).join('')}</div>`:''}
      </div>
      <div class="form-group"><label>关联卷</label>
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <span class="text-xs text-muted">已选 ${_normLinks(f.relatedVolumes).length} 个</span>
          <button class="btn btn-xs btn-outline" onclick="openFactionVolumeModal()">选择卷</button>
        </div>
        ${_normLinks(f.relatedVolumes).length>0?`<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px">${_normLinks(f.relatedVolumes).map(vl=>{const vol=(state.data.outline||[]).find((v,i)=>i===parseInt(vl.id)||v.id===vl.id);return vol?`<span class="wiki-tag item">📖 ${esc(vol.title||'未命名卷')}<button class="btn btn-xs btn-icon btn-danger" style="font-size:8px;margin-left:2px" onclick="removeFactionVolume('${esc(vl.id)}')">×</button></span>`:'';}).join('')}</div>`:''}
      </div>
    </div>
  </div>
  <div class="detail-sticky-bar">
    <div></div>
    <div class="flex-gap">
      <button class="btn btn-sm btn-outline" onclick="cancelFactionEdit()">取消</button>
      <button class="btn btn-sm btn-primary" onclick="saveFactionEdit()">💾 保存</button>
    </div>
  </div>`;
}

let _factionEditSnapshot = null;
let _factionIsNew = false;
function startFactionEdit() {
  const f = (state.data.factions||[]).find(fa=>fa.id===state.selectedFactionId);
  if (f) _factionEditSnapshot = JSON.parse(JSON.stringify(f));
  _factionIsNew = false;
  state.editingFaction = true; state._forceAnimate=true; state._animateScope='detail'; renderTabContent();
}
function saveFactionEdit() { _factionEditSnapshot = null; _factionIsNew = false; state.editingFaction = false; autoSave(); renderTabContent(); }
function cancelFactionEdit() {
  if (_factionIsNew) {
    state.data.factions = (state.data.factions||[]).filter(fa=>fa.id!==state.selectedFactionId);
    state.selectedFactionId = null;
    _factionIsNew = false;
    _factionEditSnapshot = null;
    autoSave(); renderTabContent(); return;
  }
  if (_factionEditSnapshot) {
    const f = (state.data.factions||[]).find(fa=>fa.id===state.selectedFactionId);
    if (f) Object.assign(f, _factionEditSnapshot);
    _factionEditSnapshot = null;
  }
  state.editingFaction = false; renderTabContent();
}

function setupFactions() {
  registerSearchTarget('factionSearch','faction-list',renderFactionList);
  const list = $('#faction-list');
  if (list) { list.querySelectorAll('.faction-list-item').forEach(item=>{item.onclick=(ev)=>{if(ev.target.closest('.drag-handle'))return;state.selectedFactionId=item.dataset.factionId;state.editingFaction=false;state._forceAnimate=true;state._animateScope='detail';renderTabContent();};});}
  setupDragSort({
    containerId: 'faction-list',
    itemSelector: '.faction-list-item',
    handleSelector: '.drag-handle',
    getArray: () => state.data.factions,
    setArray: (arr) => { state.data.factions = arr; }
  });
}

function addFaction() { ensureData('factions',[]); const f={id:uid(),name:'新势力',type:'',color:'#888888',description:'',goals:'',headquarters:'',members:[],rivals:[],allies:[],relatedEvents:[],relatedVolumes:[],customProps:{}}; state.data.factions.push(f); state.selectedFactionId=f.id; state.editingFaction=true; _factionIsNew=true; autoSave(); state._forceAnimate=true; state._animateScope='detail'; renderTabContent(); }
async function aiGenFaction() { const el=document.createElement('div'); el.id='ai-faction-result'; const panel=$('#faction-detail'); if (panel) panel.prepend(el); const text=await runAI(window.api.aiGenerateFaction(state.data),el); if (text) { const json=tryParseJSON(text); if (json&&json.name) { const f={id:uid(),name:json.name,type:json.type||'',color:json.color||'#'+Math.floor(Math.random()*16777215).toString(16),description:json.description||'',goals:json.goals||'',headquarters:json.headquarters||'',members:json.members||[],rivals:[],allies:[],relatedEvents:[],customProps:{}}; state.data.factions.push(f); state.selectedFactionId=f.id; autoSave(); renderTabContent(); } } }
function updateFaction(key,value) { const f=(state.data.factions||[]).find(fa=>fa.id===state.selectedFactionId); if (f) { if (key==='name'&&checkDuplicate(state.data.factions,value,f.id)){showToast('已存在同名势力！');renderTabContent();return;} f[key]=value; autoSave(); } }
function setFactionCustomProp(propId, value) { const f=(state.data.factions||[]).find(fa=>fa.id===state.selectedFactionId); if (!f) return; if (!f.customProps) f.customProps = {}; f.customProps['cp_'+propId] = value; autoSave(); }
function removeFactionHQ(locId) { const f=(state.data.factions||[]).find(fa=>fa.id===state.selectedFactionId); if (!f) return; const oldArr=Array.isArray(f.headquarters)?f.headquarters:(f.headquarters?[f.headquarters]:[]); const oldIds=_linkIds(oldArr); f.headquarters=_removeLink(oldArr,locId); syncLink('faction',f.id,'headquarters',_linkIds(f.headquarters),'',oldIds); autoSave(); if (state.editingFaction) { const d=$('#faction-detail'); if(d) d.innerHTML=renderFactionEditForm(f); } }
function removeFactionMember(mid) { const f=(state.data.factions||[]).find(fa=>fa.id===state.selectedFactionId); if (!f) return; const oldIds=_linkIds(f.members); f.members=_removeLink(f.members,mid); syncLink('faction',f.id,'members',_linkIds(f.members),'',oldIds); autoSave(); if (state.editingFaction) { const d=$('#faction-detail'); if(d) d.innerHTML=renderFactionEditForm(f); } }
function removeFactionRival(rid) { const f=(state.data.factions||[]).find(fa=>fa.id===state.selectedFactionId); if (!f) return; const oldIds=_linkIds(f.rivals); f.rivals=_removeLink(f.rivals,rid); syncLink('faction',f.id,'rivals',_linkIds(f.rivals),'',oldIds); autoSave(); if (state.editingFaction) { const d=$('#faction-detail'); if(d) d.innerHTML=renderFactionEditForm(f); } }
function removeFactionAlly(aid) { const f=(state.data.factions||[]).find(fa=>fa.id===state.selectedFactionId); if (!f) return; const oldIds=_linkIds(f.allies); f.allies=_removeLink(f.allies,aid); syncLink('faction',f.id,'allies',_linkIds(f.allies),'',oldIds); autoSave(); if (state.editingFaction) { const d=$('#faction-detail'); if(d) d.innerHTML=renderFactionEditForm(f); } }
async function openFactionHQSelectModal() {
  const f=(state.data.factions||[]).find(fa=>fa.id===state.selectedFactionId); if (!f) return;
  const allLocations=(state.data.locations||[]).map(l=>({id:l.id,name:l.name}));
  const selected=Array.isArray(f.headquarters)?f.headquarters:(f.headquarters?[f.headquarters]:[]);
  const result=await customLinkModal('📍 选择总部/据点',allLocations,selected,'简述关系');
  if (result===null) return;
  const oldIds=_linkIds(selected);
  f.headquarters=result;
  const newIds=result.map(r=>r.id);
  syncLink('faction',f.id,'headquarters',newIds,'',oldIds);
  autoSave();
  if (state.editingFaction) { const d=$('#faction-detail'); if(d) d.innerHTML=renderFactionEditForm(f); } else { renderTabContent(); }
}

async function openFactionMemberModal() {
  const f=(state.data.factions||[]).find(fa=>fa.id===state.selectedFactionId);
  if (!f) return;
  const characters = collectGlossary('character');
  if (characters.length===0){showToast('暂无角色');return;}
  const result = await customLinkModal('选择关联角色', characters, f.members||[], '简述关系');
  if (result===null) return;
  const oldIds=_linkIds(f.members);
  f.members = result;
  const newIds=result.map(r=>r.id);
  syncLink('faction',f.id,'members',newIds,'',oldIds);
  autoSave(); if (state.editingFaction) { const d=$('#faction-detail'); if(d) d.innerHTML=renderFactionEditForm(f); } else { renderTabContent(); }
}

async function openFactionRivalModal() {
  const f=(state.data.factions||[]).find(fa=>fa.id===state.selectedFactionId);
  if (!f) return;
  const otherFactions = (state.data.factions||[]).filter(fa=>fa.id!==f.id).map(fa=>({id:fa.id,name:fa.name}));
  if (otherFactions.length===0){showToast('暂无其他势力');return;}
  const result = await customLinkModal('选择敌对势力', otherFactions, f.rivals||[], '简述关系');
  if (result===null) return;
  const oldIds=_linkIds(f.rivals);
  f.rivals = result;
  const newIds=result.map(r=>r.id);
  syncLink('faction',f.id,'rivals',newIds,'',oldIds);
  autoSave(); if (state.editingFaction) { const d=$('#faction-detail'); if(d) d.innerHTML=renderFactionEditForm(f); } else { renderTabContent(); }
}

async function openFactionAllyModal() {
  const f=(state.data.factions||[]).find(fa=>fa.id===state.selectedFactionId);
  if (!f) return;
  const otherFactions = (state.data.factions||[]).filter(fa=>fa.id!==f.id).map(fa=>({id:fa.id,name:fa.name}));
  if (otherFactions.length===0){showToast('暂无其他势力');return;}
  const result = await customLinkModal('选择盟友势力', otherFactions, f.allies||[], '简述关系');
  if (result===null) return;
  const oldIds=_linkIds(f.allies);
  f.allies = result;
  const newIds=result.map(r=>r.id);
  syncLink('faction',f.id,'allies',newIds,'',oldIds);
  autoSave(); if (state.editingFaction) { const d=$('#faction-detail'); if(d) d.innerHTML=renderFactionEditForm(f); } else { renderTabContent(); }
}

function removeFactionEvent(eid) { const f=(state.data.factions||[]).find(fa=>fa.id===state.selectedFactionId); if (!f) return; const oldIds=_linkIds(f.relatedEvents); f.relatedEvents=_removeLink(f.relatedEvents,eid); syncLink('faction',f.id,'relatedEvents',_linkIds(f.relatedEvents),'',oldIds); autoSave(); if (state.editingFaction) { const d=$('#faction-detail'); if(d) d.innerHTML=renderFactionEditForm(f); } }

async function openFactionEventModal() {
  const f=(state.data.factions||[]).find(fa=>fa.id===state.selectedFactionId);
  if (!f) return;
  const events = collectGlossary('event');
  if (events.length===0){showToast('暂无事件');return;}
  const result = await customLinkModal('选择关联事件', events, f.relatedEvents||[], '简述关系');
  if (result===null) return;
  const oldIds=_linkIds(f.relatedEvents);
  f.relatedEvents = result;
  const newIds=result.map(r=>r.id);
  syncLink('faction',f.id,'relatedEvents',newIds,'',oldIds);
  autoSave(); if (state.editingFaction) { const d=$('#faction-detail'); if(d) d.innerHTML=renderFactionEditForm(f); } else { renderTabContent(); }
}

async function openFactionVolumeModal() {
  const f=(state.data.factions||[]).find(fa=>fa.id===state.selectedFactionId);
  if (!f) return;
  const outline=state.data.outline||[];
  if(outline.length===0){showToast('暂无卷');return;}
  const volItems=outline.map((v,i)=>({id:String(i),name:v.title||('第'+(i+1)+'卷')}));
  const existingIds=_normLinks(f.relatedVolumes||[]).map(l=>l.id);
  const result=await customSelectModal('📑 选择关联卷',volItems,existingIds);
  if(result===null) return;
  if(!f.relatedVolumes) f.relatedVolumes=[];
  f.relatedVolumes=result.map(id=>({id}));
  autoSave();
  if(state.editingFaction){const d=$('#faction-detail');if(d)d.innerHTML=renderFactionEditForm(f);}else{renderTabContent();}
}
function removeFactionVolume(id) {
  const f=(state.data.factions||[]).find(fa=>fa.id===state.selectedFactionId); if (!f) return;
  f.relatedVolumes=_normLinks(f.relatedVolumes||[]).filter(l=>l.id!==id).map(l=>({id:l.id,desc:l.desc}));
  autoSave();
  if(state.editingFaction){const d=$('#faction-detail');if(d)d.innerHTML=renderFactionEditForm(f);}else{renderTabContent();}
}

async function deleteFaction(id) { if (!await customConfirm('确定删除此势力？')) return; state.data.factions=(state.data.factions||[]).filter(f=>f.id!==id); if (state.selectedFactionId===id) state.selectedFactionId=null; autoSave(); renderTabContent(); }