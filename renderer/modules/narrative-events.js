// ============================================================
// 世界生成器 — 事件系统
// 依赖: core/state.js, core/utils.js, core/modal.js, core/glossary.js, core/properties.js, core/ai.js
// ============================================================

function _migrateTimeline() {
  if (!state.data.timeline) state.data.timeline = [];
  state.data.timeline.forEach((e, i) => {
    if (!e.id) e.id = uid();
    if (!e.name) e.name = e.title || '';
    if (e.type === undefined) e.type = '';
    if (e.cause === undefined) e.cause = '';
    if (!e.prerequisites) e.prerequisites = [];
    if (!e.subEvents) e.subEvents = [];
    if (e.outcome === undefined) e.outcome = '';
    if (e.aftermath === undefined) e.aftermath = '';
    if (!e.followUpEvents) e.followUpEvents = [];
    if (!e.characters) e.characters = [];
    if (!e.factions) e.factions = [];
    if (!e.locations) e.locations = [];
    if (!e.items) e.items = e.backpacks || [];
    if (!e.items) e.items = [];
    delete e.backpacks;
    if (!e.customProps) e.customProps = {};
    _migrateEventLinks(e);
  });
  if (!state.data.timelineOrder) state.data.timelineOrder = [];
}

function _migrateEventLinks(e) {
  ['prerequisites', 'followUpEvents', 'characters', 'factions', 'locations', 'items'].forEach(field => {
    if (e[field] && e[field].length > 0 && typeof e[field][0] === 'string') {
      e[field] = e[field].map(id => ({ id, desc: '' }));
    }
  });
}

function toChineseNum(n) {
  const chars = ['零','一','二','三','四','五','六','七','八','九'];
  if (n <= 10) return ['零','一','二','三','四','五','六','七','八','九','十'][n] || String(n);
  if (n < 20) return '十' + (n % 10 === 0 ? '' : chars[n % 10]);
  if (n < 100) {
    const tens = Math.floor(n / 10);
    const ones = n % 10;
    return (tens > 1 ? chars[tens] : '') + '十' + (ones > 0 ? chars[ones] : '');
  }
  return String(n);
}

function renderEvents() {
  _migrateTimeline();
  const events = state.data.timeline || [];
  const eventTypes = [...new Set(events.map(e => e.type).filter(Boolean))];
  const filterType = state.eventFilterType || '';
  const eventRelDefs = [
    { key:'character', label:'角色', field:'characters', getItems:()=>collectGlossary('character') },
    { key:'faction', label:'势力', field:'factions', getItems:()=>collectGlossary('faction') },
    { key:'location', label:'地点', field:'locations', getItems:()=>collectGlossary('location') },
    { key:'item', label:'物品', field:'items', getItems:()=>collectGlossary('item') },
  ];
  return `<div class="char-layout">
    <div class="char-list-panel" style="min-width:260px">
      <div class="flex-between mb-8"><h3>⚡ 事件列表</h3><div class="flex-gap"><button class="btn btn-ai btn-sm" onclick="aiGenTimeline()">🤖 AI 生成</button><button class="btn btn-sm btn-primary" onclick="addTimelineEvent()">+ 新建</button></div></div>
      <div id="ai-timeline-result"></div>
      ${eventTypes.length > 0 ? `<div style="margin-bottom:8px;display:flex;align-items:center;gap:6px;flex-wrap:wrap"><span style="font-size:12px;color:var(--warm-gray)">类型：</span><button class="btn btn-xs ${filterType?'btn-outline':'btn-primary'}" onclick="state.eventFilterType='';renderTabContent()">全部</button>${eventTypes.map(t=>`<button class="btn btn-xs ${filterType===t?'btn-primary':'btn-outline'}" onclick="state.eventFilterType='${esc(t)}';renderTabContent()">${esc(t)}</button>`).join('')}</div>` : ''}
      ${renderSearchBox('eventSearch')}
      ${renderRelFilter('eventRelFilter', eventRelDefs)}
      <div id="event-list">${renderEventList()}</div>
    </div>
    <div class="char-detail-panel" id="event-detail">${renderEventDetail()}</div>
  </div>`;
}

function renderEventList() {
  let events = state.data.timeline || [];
  const filterType = state.eventFilterType || '';
  if (filterType) events = events.filter(e => e.type === filterType);
  const eventRelDefs = [
    { key:'character', field:'characters' },
    { key:'faction', field:'factions' },
    { key:'location', field:'locations' },
    { key:'item', field:'items' },
  ];
  events = events.filter(e => matchRelFilter(e, 'eventRelFilter', eventRelDefs));
  events = events.filter(e => matchSearch(e.name || e.title, 'eventSearch'));
  if (events.length === 0) return '<div class="empty-state"><div class="icon">⚡</div><p>暂无事件</p></div>';
  return events.map((e, i) => {
    const sel = state.selectedEventId === e.id;
    const desc = (e.description || e.cause || '').substring(0, 60);
    const charCount = _normLinks(e.characters).length;
    const locCount = _normLinks(e.locations).length;
    return `<div class="location-card${sel ? ' selected' : ''}" data-eid="${e.id}" style="cursor:pointer">
      <div class="flex-between"><div style="display:flex;align-items:center;gap:6px"><span class="drag-handle" style="cursor:grab;font-size:10px;color:var(--muted);user-select:none">⠿</span><span class="loc-name">${esc(e.name || e.title || '未命名事件')}</span></div>
        <div class="flex-gap"><button class="btn btn-xs btn-icon btn-danger" style="font-size:10px" onclick="event.stopPropagation();deleteTimelineEvent('${e.id}')">×</button></div></div>
      <div class="loc-desc">${esc(e.time || '')}${e.type ? ' · ' + esc(e.type) : ''}</div>
      ${desc ? `<div style="font-size:12px;color:var(--dark-gray);margin-top:4px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${esc(desc)}${(e.description||e.cause||'').length>60?'...':''}</div>` : ''}
      ${(charCount > 0 || locCount > 0) ? `<div style="display:flex;gap:4px;margin-top:4px;font-size:11px;color:var(--warm-gray)">${charCount > 0 ? `<span>👤${charCount}</span>` : ''}${locCount > 0 ? `<span>📍${locCount}</span>` : ''}</div>` : ''}
    </div>`;
  }).join('');
}

function renderEventDetail() {
  const e = (state.data.timeline || []).find(ev => ev.id === state.selectedEventId);
  if (!e) return '';
  if (state.editingEvent) return renderEventEditForm(e);
  return renderEventWikiView(e);
}

function renderEventWikiView(e) {
  const characters = collectGlossary('character');
  const factions = collectGlossary('faction');
  const locations = collectGlossary('location');
  const events = collectGlossary('event');
  const allItems = collectGlossary('item');
  ensurePropertyDefs();
  const customProps = getCustomPropsForScope('timeline');
  const cpData = e.customProps || {};
  const customPropHtml = renderCustomPropWikiHtml(customProps, cpData);
  const eCharLinks = _normLinks(e.characters);
  const eFactionLinks = _normLinks(e.factions);
  const eLocLinks = _normLinks(e.locations);
  const ePrereqLinks = _normLinks(e.prerequisites);
  const eFollowUpLinks = _normLinks(e.followUpEvents);
  const eItemLinks = _normLinks(e.items);
  const eChars = eCharLinks.map(l => { const ch = characters.find(c => c.id === l.id); return ch ? { ...ch, _desc: l.desc } : null; }).filter(Boolean);
  const eFactions = eFactionLinks.map(l => { const f = factions.find(fa => fa.id === l.id); return f ? { ...f, _desc: l.desc } : null; }).filter(Boolean);
  const eLocs = eLocLinks.map(l => { const loc = locations.find(lo => lo.id === l.id); return loc ? { ...loc, _desc: l.desc } : null; }).filter(Boolean);
  const ePrereqs = ePrereqLinks.map(l => { const p = events.find(ev => ev.id === l.id); return p ? { ...p, _desc: l.desc } : null; }).filter(Boolean);
  const eFollowUps = eFollowUpLinks.map(l => { const f = events.find(ev => ev.id === l.id); return f ? { ...f, _desc: l.desc } : null; }).filter(Boolean);
  const eItems = eItemLinks.map(l => { const it = allItems.find(i => i.id === l.id); if (!it) return null; const bp = (state.data.worldBackpacks||[]).find(b=>b.id===(state.data.items||[]).find(i=>i.id===it.id)?.backpackId); return { ...it, _desc: l.desc, _bpName: bp ? bp.name : '' }; }).filter(Boolean);
  const subEventLinks = _normLinks(e.subEvents);
  const subEventItems = subEventLinks.map(l => { const ev = events.find(e2 => e2.id === l.id); return ev ? { ...ev, _desc: l.desc } : null; }).filter(Boolean);

  function linkTag(item, type) {
    const descArg = item._desc ? `, '${jsStr(item._desc)}'` : '';
    const bpSuffix = item._bpName ? ` [${esc(item._bpName)}]` : '';
    return `<span class="wiki-tag skill" onclick="showPreviewCard('${type}','${esc(item.id)}',event${descArg})" style="cursor:pointer">${esc(item.name)}${bpSuffix}</span>`;
  }

  return `<div class="wiki-page detail-scroll-area">
    <div class="wiki-header">
      <h2 class="wiki-title">⚡ ${esc(e.name || e.title || '未命名事件')}</h2>
      <div class="wiki-meta">
        ${e.time ? `<span class="wiki-badge race">${esc(e.time)}</span>` : ''}
        ${e.type&&e.type!=='未知'?`<span class="wiki-badge gender" style="cursor:pointer" title="${esc(getCategoryDesc('eventType',e.type))}" onclick="openCategoryDetail('eventType','${esc(e.type)}')">${esc(e.type)}</span>`:''}
      </div>
      ${customPropHtml?`<div style="margin-top:4px">${customPropHtml}</div>`:''}
    </div>
    ${ePrereqs.length > 0 ? `<div class="wiki-section"><div class="wiki-section-title">前置事件</div><div class="wiki-tags">${ePrereqs.map(p => linkTag(p, 'event')).join('')}</div></div>` : ''}
    ${e.cause ? `<div class="wiki-section"><div class="wiki-section-title">起因</div><div class="wiki-value">${esc(e.cause)}</div></div>` : ''}
    ${(e.description || subEventItems.length > 0) ? `<div class="wiki-section"><div class="wiki-section-title">经过</div>${e.description ? `<div class="wiki-value" style="margin-bottom:8px">${esc(e.description)}</div>` : ''}${subEventItems.length > 0 ? `<div style="border-left:2px solid var(--border);margin-left:8px;padding-left:12px">${subEventItems.map(se => `<div style="margin-bottom:6px;padding:6px 10px;background:var(--bg-alt);border-radius:var(--radius-xs);cursor:pointer" onclick="navigateToEvent('${esc(se.id)}')"><strong style="font-size:13px">${esc(se.name || '子事件')}</strong>${se._desc ? `<p style="font-size:12px;color:var(--dark-gray);margin-top:2px">${esc(se._desc)}</p>` : ''}</div>`).join('')}</div>` : ''}</div>` : ''}
    ${e.outcome ? `<div class="wiki-section"><div class="wiki-section-title">结局</div><div class="wiki-value">${esc(e.outcome)}</div></div>` : ''}
    ${e.aftermath ? `<div class="wiki-section"><div class="wiki-section-title">后续影响</div><div class="wiki-value">${esc(e.aftermath)}</div></div>` : ''}
    ${eFollowUps.length > 0 ? `<div class="wiki-section"><div class="wiki-section-title">后续事件</div><div class="wiki-tags">${eFollowUps.map(f => linkTag(f, 'event')).join('')}</div></div>` : ''}
    <div class="wiki-section"><div class="wiki-section-title">关联</div>
      ${eChars.length > 0 ? `<div style="margin-bottom:4px"><span class="text-xs text-muted">人物</span><div class="wiki-tags">${eChars.map(ch => linkTag(ch, 'character')).join('')}</div></div>` : ''}
      ${eFactions.length > 0 ? `<div style="margin-bottom:4px"><span class="text-xs text-muted">势力</span><div class="wiki-tags">${eFactions.map(f => linkTag(f, 'faction')).join('')}</div></div>` : ''}
      ${eLocs.length > 0 ? `<div style="margin-bottom:4px"><span class="text-xs text-muted">地点</span><div class="wiki-tags">${eLocs.map(l => linkTag(l, 'location')).join('')}</div></div>` : ''}
      ${eItems.length > 0 ? `<div style="margin-bottom:4px"><span class="text-xs text-muted">物品</span><div class="wiki-tags">${eItems.map(it => linkTag(it, 'item')).join('')}</div></div>` : ''}
      ${_normLinks(e.relatedVolumes).length>0?`<div style="margin-bottom:4px"><span class="text-xs text-muted">📑 关联卷</span><div class="wiki-tags">${_normLinks(e.relatedVolumes).map(vl=>{const vol=(state.data.outline||[]).find((v,i)=>i===parseInt(vl.id)||v.id===vl.id);return vol?`<span class="wiki-tag item">📖 ${esc(vol.title||'未命名卷')}</span>`:`<span class="wiki-tag item">${esc(vl.id)}</span>`;}).join('')}</div></div>`:''}
      ${eChars.length === 0 && eFactions.length === 0 && eLocs.length === 0 && eItems.length === 0 && _normLinks(e.relatedVolumes).length===0 ? '<div class="text-xs text-muted">暂无关联，点击编辑添加</div>' : ''}
    </div>
  </div>
  <div class="detail-sticky-bar">
    <div class="flex-gap">
      <button class="btn btn-sm btn-outline" onclick="if(state.navigationHistory.length>0)goBack();else{state.selectedEventId=null;renderTabContent()}">← 返回</button>
      <button class="btn btn-sm btn-outline" onclick="locateEventOnTimeline('${e.id}')">📍 时间线</button>
    </div>
    <div class="flex-gap">
      <button class="btn btn-sm btn-danger" onclick="deleteTimelineEvent('${e.id}')">🗑️ 删除</button>
      <button class="btn btn-sm btn-primary" onclick="startEventEdit()">✏️ 编辑</button>
    </div>
  </div>`;
}

function renderEventEditForm(e) {
  const characters = collectGlossary('character');
  const factions = collectGlossary('faction');
  const locations = collectGlossary('location');
  const allEvents = (state.data.timeline || []).filter(ev => ev.id !== e.id);
  const allItems = collectGlossary('item');
  ensurePropertyDefs();
  const customProps = getCustomPropsForScope('timeline');
  if (!e.customProps) e.customProps = {};
  const eventTypeCats = (state.data.categories || []).filter(c => c.type === 'eventType');
  const eventTypeOptions = [...new Set([...eventTypeCats.map(c => c.name), ...(state.data.timeline || []).map(ev => ev.type).filter(Boolean)])];
  const selTypeOpts = eventTypeOptions.map(t => `<option value="${esc(t)}"${e.type === t ? ' selected' : ''}>${esc(t)}</option>`).join('');

  const charLinks = _normLinks(e.characters);
  const factionLinks = _normLinks(e.factions);
  const locLinks = _normLinks(e.locations);
  const prereqLinks = _normLinks(e.prerequisites);
  const followUpLinks = _normLinks(e.followUpEvents);
  const itemLinks = _normLinks(e.items);
  const subEventLinks = _normLinks(e.subEvents);

  const prereqIds = new Set(prereqLinks.map(l => l.id));
  const followUpIds = new Set(followUpLinks.map(l => l.id));
  const subEventIds = new Set(subEventLinks.map(l => l.id));

  const bpNames = {};
  (state.data.worldBackpacks||[]).forEach(bp => { bpNames[bp.id] = bp.name; });
  const itemPool = (state.data.items||[]).map(it => ({ id: it.id, name: `${it.icon||'📦'} ${it.name} [${bpNames[it.backpackId]||'未知系统'}]` }));

  function editLinkTags(links, pool, removeFn) {
    return links.map(l => {
      const item = pool.find(p => p.id === l.id);
      const name = item ? item.name : l.id;
      const descHtml = l.desc ? `<span style="font-size:11px;color:var(--text-muted)">(${esc(l.desc)})</span>` : '';
      return `<span class="wiki-tag skill">${esc(name)}${descHtml}<button class="btn btn-xs btn-icon btn-danger" style="font-size:8px;margin-left:2px" onclick="${removeFn}('${esc(l.id)}')">×</button></span>`;
    }).join('');
  }

  return `<div class="card detail-scroll-area">
    <div class="form-row"><div class="form-group"><label>事件名称</label><input value="${esc(e.name || e.title || '')}" onchange="updateEvent('name',this.value)"></div>
    <div class="form-group"><label>时间</label><input value="${esc(e.time || '')}" placeholder="如：2024年春 / 第一章" onchange="updateEvent('time',this.value)"></div></div>
    <div class="form-group"><label>类型</label><div style="display:flex;gap:8px"><select onchange="updateEvent('type',this.value)" style="flex:1;padding:8px 12px;background:var(--white);border:1px solid var(--border);border-radius:var(--radius-sm);font-size:14px;font-family:var(--font-body)"><option value="">选择类型</option>${selTypeOpts}</select><button class="btn btn-xs btn-outline" onclick="addEventTypeCustom()">+自定义</button></div></div>
    <div class="form-group"><label>起因</label><textarea rows="2" placeholder="事件起因" onchange="updateEvent('cause',this.value)">${esc(e.cause || '')}</textarea></div>
    <div class="form-group"><label>经过</label><textarea rows="3" placeholder="事件经过概述" onchange="updateEvent('description',this.value)">${esc(e.description || '')}</textarea></div>
    <div class="form-group"><label>子事件</label>
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px">
        <span class="text-xs text-muted">已选 ${subEventLinks.length} 个</span>
        <button class="btn btn-xs btn-outline" onclick="openEventSubEventModal()">选择子事件</button>
      </div>
      ${subEventLinks.length > 0 ? `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px">${editLinkTags(subEventLinks, allEvents, 'removeEventSubEvent')}</div>` : ''}
    </div>
    <div class="form-group"><label>前置事件</label>
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px">
        <span class="text-xs text-muted">已选 ${prereqLinks.length} 个</span>
        <button class="btn btn-xs btn-outline" onclick="openEventPrereqModal()">选择前置事件</button>
      </div>
      ${prereqLinks.length > 0 ? `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px">${editLinkTags(prereqLinks, allEvents, 'removeEventPrereq')}</div>` : ''}
    </div>
    <div class="form-group"><label>结局</label><textarea rows="2" placeholder="事件结局" onchange="updateEvent('outcome',this.value)">${esc(e.outcome || '')}</textarea></div>
    <div class="form-group"><label>后续影响</label><textarea rows="2" placeholder="事件后续影响" onchange="updateEvent('aftermath',this.value)">${esc(e.aftermath || '')}</textarea></div>
    <div class="form-group"><label>后续事件</label>
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px">
        <span class="text-xs text-muted">已选 ${followUpLinks.length} 个</span>
        <button class="btn btn-xs btn-outline" onclick="openEventFollowUpModal()">选择后续事件</button>
      </div>
      ${followUpLinks.length > 0 ? `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px">${editLinkTags(followUpLinks, allEvents, 'removeEventFollowUp')}</div>` : ''}
    </div>
    <div class="card"><h4>关联</h4>
      <div class="form-group"><label>关联人物</label>
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <span class="text-xs text-muted">已选 ${charLinks.length} 人</span>
          <button class="btn btn-xs btn-outline" onclick="openEventCharModal()">选择人物</button>
        </div>
        ${charLinks.length > 0 ? `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px">${editLinkTags(charLinks, characters, 'removeEventChar')}</div>` : ''}
      </div>
      <div class="form-group"><label>关联势力</label>
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <span class="text-xs text-muted">已选 ${factionLinks.length} 个</span>
          <button class="btn btn-xs btn-outline" onclick="openEventFactionModal()">选择势力</button>
        </div>
        ${factionLinks.length > 0 ? `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px">${editLinkTags(factionLinks, factions, 'removeEventFaction')}</div>` : ''}
      </div>
      <div class="form-group"><label>关联地点</label>
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <span class="text-xs text-muted">已选 ${locLinks.length} 个</span>
          <button class="btn btn-xs btn-outline" onclick="openEventLocModal()">选择地点</button>
        </div>
        ${locLinks.length > 0 ? `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px">${editLinkTags(locLinks, locations, 'removeEventLoc')}</div>` : ''}
      </div>
      <div class="form-group"><label>关联物品</label>
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <span class="text-xs text-muted">已选 ${itemLinks.length} 个</span>
          <button class="btn btn-xs btn-outline" onclick="openEventItemModal()">选择物品</button>
        </div>
        ${itemLinks.length > 0 ? `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px">${editLinkTags(itemLinks, itemPool, 'removeEventItem')}</div>` : ''}
      </div>
      <div class="form-group"><label>📑 关联卷</label>
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <span class="text-xs text-muted">已选 ${_normLinks(e.relatedVolumes).length} 个</span>
          <button class="btn btn-xs btn-outline" onclick="openEventVolumeModal()">选择卷</button>
        </div>
        ${_normLinks(e.relatedVolumes).length>0?`<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px">${_normLinks(e.relatedVolumes).map(vl=>{const vol=(state.data.outline||[]).find((v,i)=>i===parseInt(vl.id)||v.id===vl.id);return vol?`<span class="wiki-tag item">📖 ${esc(vol.title||'未命名卷')}<button class="btn btn-xs btn-icon btn-danger" style="font-size:8px;margin-left:2px" onclick="removeEventVolume('${esc(vl.id)}')">×</button></span>`:'';}).join('')}</div>`:''}
      </div>
    </div>
    ${customProps.map(prop => {
      const key = 'cp_' + prop.id;
      const val = e.customProps[key] || '';
      return renderCustomPropField(prop, val, `setEventCustomProp('${prop.id}',this.value)`);
    }).join('')}
  </div>
  <div class="detail-sticky-bar">
    <div></div>
    <div class="flex-gap">
      <button class="btn btn-sm btn-outline" onclick="cancelEventEdit()">取消</button>
      <button class="btn btn-sm btn-primary" onclick="saveEventEdit()">💾 保存</button>
    </div>
  </div>`;
}

let _eventEditSnapshot = null;
let _eventIsNew = false;
function startEventEdit() {
  const e = (state.data.timeline || []).find(ev => ev.id === state.selectedEventId);
  if (e) _eventEditSnapshot = JSON.parse(JSON.stringify(e));
  _eventIsNew = false;
  state.editingEvent = true;
  state._forceAnimate = true;
  state._animateScope = 'detail';
  renderTabContent();
}
function saveEventEdit() {
  _eventEditSnapshot = null;
  _eventIsNew = false;
  state.editingEvent = false;
  autoSave();
  renderTabContent();
}
function cancelEventEdit() {
  if (_eventIsNew) {
    state.data.timeline = (state.data.timeline || []).filter(e => e.id !== state.selectedEventId);
    state.selectedEventId = null;
    _eventIsNew = false;
    _eventEditSnapshot = null;
    autoSave();
    renderTabContent();
    return;
  }
  if (_eventEditSnapshot) {
    const e = (state.data.timeline || []).find(ev => ev.id === state.selectedEventId);
    if (e) Object.assign(e, _eventEditSnapshot);
    _eventEditSnapshot = null;
  }
  state.editingEvent = false;
  renderTabContent();
}

function updateEvent(key, value) {
  const e = (state.data.timeline || []).find(ev => ev.id === state.selectedEventId);
  if (!e) return;
  if (key === 'name' && checkDuplicate(state.data.timeline, value, e.id)) { showToast('已存在同名事件！'); renderTabContent(); return; }
  e[key] = value;
  if (key === 'name') e.title = value;
  autoSave();
}
function setEventCustomProp(propId, value) {
  const e = (state.data.timeline || []).find(ev => ev.id === state.selectedEventId);
  if (!e) return;
  if (!e.customProps) e.customProps = {};
  e.customProps['cp_' + propId] = value;
  autoSave();
}

async function addEventTypeCustom() {
  const name = await customPrompt('自定义事件类型', '');
  if (!name) return;
  if (!state.data.categories) state.data.categories = [];
  if (!state.data.categories.find(c => c.type === 'eventType' && c.name === name)) {
    state.data.categories.push({ id: uid(), type: 'eventType', name, description: '' });
  }
  const e = (state.data.timeline || []).find(ev => ev.id === state.selectedEventId);
  if (e) { e.type = name; autoSave(); const detail = $('#event-detail'); if (detail && state.editingEvent) detail.innerHTML = renderEventEditForm(e); }
}

function removeEventPrereq(pid) {
  const e = (state.data.timeline || []).find(ev => ev.id === state.selectedEventId);
  if (!e) return;
  const oldIds = _linkIds(e.prerequisites);
  e.prerequisites = _removeLink(e.prerequisites, pid);
  syncLink('event', e.id, 'prerequisites', _linkIds(e.prerequisites), '', oldIds);
  autoSave();
  const detail = $('#event-detail');
  if (detail && state.editingEvent) detail.innerHTML = renderEventEditForm(e);
}
function removeEventFollowUp(fid) {
  const e = (state.data.timeline || []).find(ev => ev.id === state.selectedEventId);
  if (!e) return;
  const oldIds = _linkIds(e.followUpEvents);
  e.followUpEvents = _removeLink(e.followUpEvents, fid);
  syncLink('event', e.id, 'followUpEvents', _linkIds(e.followUpEvents), '', oldIds);
  autoSave();
  const detail = $('#event-detail');
  if (detail && state.editingEvent) detail.innerHTML = renderEventEditForm(e);
}
function removeEventSubEvent(sid) {
  const e = (state.data.timeline || []).find(ev => ev.id === state.selectedEventId);
  if (!e) return;
  e.subEvents = _removeLink(e.subEvents, sid);
  autoSave();
  const detail = $('#event-detail');
  if (detail && state.editingEvent) detail.innerHTML = renderEventEditForm(e);
}
function removeEventChar(cid) {
  const e = (state.data.timeline || []).find(ev => ev.id === state.selectedEventId);
  if (!e) return;
  const oldIds = _linkIds(e.characters);
  e.characters = _removeLink(e.characters, cid);
  syncLink('event', e.id, 'characters', _linkIds(e.characters), '', oldIds);
  autoSave();
  const detail = $('#event-detail');
  if (detail && state.editingEvent) detail.innerHTML = renderEventEditForm(e);
}
function removeEventFaction(fid) {
  const e = (state.data.timeline || []).find(ev => ev.id === state.selectedEventId);
  if (!e) return;
  const oldIds = _linkIds(e.factions);
  e.factions = _removeLink(e.factions, fid);
  syncLink('event', e.id, 'factions', _linkIds(e.factions), '', oldIds);
  autoSave();
  const detail = $('#event-detail');
  if (detail && state.editingEvent) detail.innerHTML = renderEventEditForm(e);
}
function removeEventLoc(lid) {
  const e = (state.data.timeline || []).find(ev => ev.id === state.selectedEventId);
  if (!e) return;
  const oldIds = _linkIds(e.locations);
  e.locations = _removeLink(e.locations, lid);
  syncLink('event', e.id, 'locations', _linkIds(e.locations), '', oldIds);
  autoSave();
  const detail = $('#event-detail');
  if (detail && state.editingEvent) detail.innerHTML = renderEventEditForm(e);
}
function removeEventItem(iid) {
  const e = (state.data.timeline || []).find(ev => ev.id === state.selectedEventId);
  if (!e) return;
  e.items = _removeLink(e.items, iid);
  autoSave();
  const detail = $('#event-detail');
  if (detail && state.editingEvent) detail.innerHTML = renderEventEditForm(e);
}

async function openEventPrereqModal() {
  const e = (state.data.timeline || []).find(ev => ev.id === state.selectedEventId);
  if (!e) return;
  const followUpIds = new Set(_linkIds(e.followUpEvents));
  const subEventIds = new Set(_linkIds(e.subEvents));
  const allEvents = (state.data.timeline || []).filter(ev => ev.id !== e.id).map(ev => {
    const tags = [];
    if (followUpIds.has(ev.id)) tags.push('后续事件');
    if (subEventIds.has(ev.id)) tags.push('子事件');
    return { id: ev.id, name: ev.name || ev.title || '未命名' + (tags.length ? ` [${tags.join(',')}]` : '') };
  }).filter(ev => !followUpIds.has(ev.id) && !subEventIds.has(ev.id));
  const result = await customLinkModal('选择前置事件', allEvents, e.prerequisites || [], '简述关系');
  if (result === null) return;
  const oldIds = _linkIds(e.prerequisites);
  e.prerequisites = result;
  const newIds = result.map(r => r.id);
  syncLink('event', e.id, 'prerequisites', newIds, '', oldIds);
  autoSave();
  const detail = $('#event-detail');
  if (detail && state.editingEvent) detail.innerHTML = renderEventEditForm(e);
}
async function openEventFollowUpModal() {
  const e = (state.data.timeline || []).find(ev => ev.id === state.selectedEventId);
  if (!e) return;
  const prereqIds = new Set(_linkIds(e.prerequisites));
  const subEventIds = new Set(_linkIds(e.subEvents));
  const allEvents = (state.data.timeline || []).filter(ev => ev.id !== e.id).map(ev => {
    const tags = [];
    if (prereqIds.has(ev.id)) tags.push('前置事件');
    if (subEventIds.has(ev.id)) tags.push('子事件');
    return { id: ev.id, name: ev.name || ev.title || '未命名' + (tags.length ? ` [${tags.join(',')}]` : '') };
  }).filter(ev => !prereqIds.has(ev.id) && !subEventIds.has(ev.id));
  const result = await customLinkModal('选择后续事件', allEvents, e.followUpEvents || [], '简述关系');
  if (result === null) return;
  const oldIds = _linkIds(e.followUpEvents);
  e.followUpEvents = result;
  const newIds = result.map(r => r.id);
  syncLink('event', e.id, 'followUpEvents', newIds, '', oldIds);
  autoSave();
  const detail = $('#event-detail');
  if (detail && state.editingEvent) detail.innerHTML = renderEventEditForm(e);
}
async function openEventSubEventModal() {
  const e = (state.data.timeline || []).find(ev => ev.id === state.selectedEventId);
  if (!e) return;
  const prereqIds = new Set(_linkIds(e.prerequisites));
  const followUpIds = new Set(_linkIds(e.followUpEvents));
  const allEvents = (state.data.timeline || []).filter(ev => ev.id !== e.id).map(ev => {
    const tags = [];
    if (prereqIds.has(ev.id)) tags.push('前置事件');
    if (followUpIds.has(ev.id)) tags.push('后续事件');
    return { id: ev.id, name: ev.name || ev.title || '未命名' + (tags.length ? ` [${tags.join(',')}]` : '') };
  }).filter(ev => !prereqIds.has(ev.id) && !followUpIds.has(ev.id));
  const result = await customLinkModal('选择子事件', allEvents, e.subEvents || [], '简述关系');
  if (result === null) return;
  e.subEvents = result;
  autoSave();
  const detail = $('#event-detail');
  if (detail && state.editingEvent) detail.innerHTML = renderEventEditForm(e);
}
async function openEventCharModal() {
  const e = (state.data.timeline || []).find(ev => ev.id === state.selectedEventId);
  if (!e) return;
  const characters = collectGlossary('character');
  const result = await customLinkModal('选择关联人物', characters, e.characters || [], '简述关系');
  if (result === null) return;
  const oldIds = _linkIds(e.characters);
  e.characters = result;
  const newIds = result.map(r => r.id);
  syncLink('event', e.id, 'characters', newIds, '', oldIds);
  autoSave();
  const detail = $('#event-detail');
  if (detail && state.editingEvent) detail.innerHTML = renderEventEditForm(e);
}
async function openEventFactionModal() {
  const e = (state.data.timeline || []).find(ev => ev.id === state.selectedEventId);
  if (!e) return;
  const factions = collectGlossary('faction');
  const result = await customLinkModal('选择关联势力', factions, e.factions || [], '简述关系');
  if (result === null) return;
  const oldIds = _linkIds(e.factions);
  e.factions = result;
  const newIds = result.map(r => r.id);
  syncLink('event', e.id, 'factions', newIds, '', oldIds);
  autoSave();
  const detail = $('#event-detail');
  if (detail && state.editingEvent) detail.innerHTML = renderEventEditForm(e);
}
async function openEventLocModal() {
  const e = (state.data.timeline || []).find(ev => ev.id === state.selectedEventId);
  if (!e) return;
  const locations = collectGlossary('location');
  const result = await customLinkModal('选择关联地点', locations, e.locations || [], '简述关系');
  if (result === null) return;
  const oldIds = _linkIds(e.locations);
  e.locations = result;
  const newIds = result.map(r => r.id);
  syncLink('event', e.id, 'locations', newIds, '', oldIds);
  autoSave();
  const detail = $('#event-detail');
  if (detail && state.editingEvent) detail.innerHTML = renderEventEditForm(e);
}
async function openEventItemModal() {
  const e = (state.data.timeline || []).find(ev => ev.id === state.selectedEventId);
  if (!e) return;
  const backpacks = state.data.worldBackpacks || [];
  const allItems = (state.data.items || []);
  if (allItems.length === 0) { await customConfirm('暂无物品，请先在世界系统中添加物品'); return; }
  const existingLinks = _normLinks(e.items || []);
  const linkMap = {};
  existingLinks.forEach(l => { linkMap[l.id] = l.desc || ''; });
  const selSet = new Set(Object.keys(linkMap));

  const modal = $('#modal-box');
  const overlay = $('#modal-overlay');

  const bpSections = backpacks.map(bp => {
    const bpItems = allItems.filter(it => it.backpackId === bp.id);
    if (bpItems.length === 0) return '';
    const itemRows = bpItems.map(it => {
      const checked = selSet.has(it.id);
      const desc = linkMap[it.id] || '';
      return `<div class="modal-link-item" style="padding:6px 0;border-bottom:1px solid var(--border);font-size:14px;margin-left:16px">
        <label style="display:flex;align-items:center;gap:10px;cursor:pointer;margin-bottom:4px">
          <input type="checkbox" data-ms-id="${esc(String(it.id))}" ${checked?'checked':''} style="width:16px;height:16px;accent-color:var(--black)">
          <span>${esc(it.icon||'📦')} ${esc(it.name)}</span>
        </label>
        <input type="text" data-ms-desc="${esc(String(it.id))}" value="${esc(desc)}" placeholder="简述关系" style="display:${checked?'block':'none'};width:100%;margin-left:26px;padding:4px 8px;font-size:12px;border:1px solid var(--border);border-radius:var(--radius-xs);background:var(--white)">
      </div>`;
    }).join('');
    return `<div class="bp-section" style="margin-bottom:8px">
      <div class="bp-header" data-bp-id="${esc(bp.id)}" style="padding:8px 0;cursor:pointer;display:flex;align-items:center;gap:6px;font-weight:600;font-size:14px;border-bottom:2px solid var(--border);user-select:none">
        <span class="bp-toggle" style="transition:transform 0.2s;font-size:10px">▶</span>
        <span>${esc(bp.icon||'🎲')} ${esc(bp.name)}</span>
        <span style="font-size:11px;color:var(--warm-gray);font-weight:400">${bpItems.length}个物品</span>
      </div>
      <div class="bp-items" style="display:none;padding-top:4px">${itemRows}</div>
    </div>`;
  }).join('');

  modal.innerHTML = `
    <h3>选择关联物品（点击系统展开物品）</h3>
    <div class="modal-select-list" style="max-height:400px;overflow-y:auto;margin:0 -8px;padding:0 8px">${bpSections || '<div class="text-xs text-muted" style="padding:8px">暂无可选项</div>'}</div>
    <div class="modal-actions">
      <button class="btn btn-outline" id="custom-link-cancel">取消</button>
      <button class="btn btn-primary" id="custom-link-ok">确定</button>
    </div>`;
  overlay.classList.remove('hidden');

  modal.querySelectorAll('.bp-header').forEach(hdr => {
    hdr.onclick = () => {
      const items = hdr.nextElementSibling;
      const toggle = hdr.querySelector('.bp-toggle');
      if (items.style.display === 'none') {
        items.style.display = 'block';
        if (toggle) toggle.style.transform = 'rotate(90deg)';
      } else {
        items.style.display = 'none';
        if (toggle) toggle.style.transform = '';
      }
    };
  });
  modal.querySelectorAll('input[data-ms-id]').forEach(cb => {
    cb.onchange = () => {
      const descInput = modal.querySelector(`input[data-ms-desc="${cb.dataset.msId}"]`);
      if (descInput) descInput.style.display = cb.checked ? 'block' : 'none';
    };
  });

  let resolved = false;
  const resolve = (val) => {
    if (resolved) return;
    resolved = true;
    if (val !== null) {
      e.items = val;
      autoSave();
      const detail = $('#event-detail');
      if (detail && state.editingEvent) detail.innerHTML = renderEventEditForm(e);
    }
  };
  $('#custom-link-ok').onclick = () => {
    const result = [...modal.querySelectorAll('input[data-ms-id]:checked')].map(cb => {
      const descInput = modal.querySelector(`input[data-ms-desc="${cb.dataset.msId}"]`);
      return { id: cb.dataset.msId, desc: descInput ? descInput.value.trim() : '' };
    });
    closeModal();
    resolve(result);
  };
  $('#custom-link-cancel').onclick = () => { closeModal(); resolve(null); };
  overlay.onclick = (e2) => { if (e2.target === overlay) { closeModal(); resolve(null); } };
}

async function openEventVolumeModal() {
  const e = (state.data.timeline || []).find(ev => ev.id === state.selectedEventId);
  if (!e) return;
  const outline = state.data.outline || [];
  if (outline.length === 0) { await customConfirm('暂无卷，请先在大纲中创建卷'); return; }
  const volItems = outline.map((v, i) => ({ id: String(i), name: v.title || ('第' + toChineseNum(i + 1) + '卷') }));
  const existingIds = _normLinks(e.relatedVolumes || []).map(l => l.id);
  const result = await customSelectModal('📑 选择关联卷', volItems, existingIds);
  if (result === null) return;
  if (!e.relatedVolumes) e.relatedVolumes = [];
  e.relatedVolumes = result.map(id => ({ id }));
  autoSave();
  const detail = $('#event-detail');
  if (detail && state.editingEvent) detail.innerHTML = renderEventEditForm(e);
  else renderTabContent();
}

function removeEventVolume(volId) {
  const e = (state.data.timeline || []).find(ev => ev.id === state.selectedEventId);
  if (!e) return;
  e.relatedVolumes = _normLinks(e.relatedVolumes || []).filter(l => l.id !== volId);
  autoSave();
  const detail = $('#event-detail');
  if (detail && state.editingEvent) detail.innerHTML = renderEventEditForm(e);
  else renderTabContent();
}

function setupEvents() {
  registerSearchTarget('eventSearch','event-list',renderEventList);
  const elList = $('#event-list');
  if (elList) {
    elList.querySelectorAll('.location-card').forEach(c => {
      c.onclick = (ev) => {
        if (ev.target.closest('.drag-handle') || ev.target.closest('button')) return;
        state.selectedEventId = c.dataset.eid;
        state.editingEvent = false;
        state._forceAnimate = true;
        state._animateScope = 'detail';
        renderTabContent();
      };
    });
  }
  setupDragSort({
    containerId: 'event-list',
    itemSelector: '.location-card',
    handleSelector: '.drag-handle',
    getArray: () => state.data.timeline,
    setArray: (arr) => { state.data.timeline = arr; }
  });
}

function addTimelineEvent() {
  _migrateTimeline();
  let base = '新事件', n = 1;
  while ((state.data.timeline || []).some(e => e.name === base || e.title === base)) { base = '新事件' + (++n); }
  const e = { id: uid(), name: base, title: base, time: '', type: '', description: '', cause: '', prerequisites: [], subEvents: [], outcome: '', aftermath: '', followUpEvents: [], characters: [], factions: [], locations: [], items: [], relatedVolumes: [], customProps: {} };
  _migrateEventLinks(e);
  state.data.timeline.push(e);
  state.selectedEventId = e.id;
  state.editingEvent = true;
  _eventIsNew = true;
  autoSave();
  state._forceAnimate = true;
  state._animateScope = 'detail';
  renderTabContent();
}

async function aiGenTimeline() {
  const el = $('#ai-timeline-result');
  const text = await runAI(window.api.aiGenerateTimelineEvents(state.data), el);
  if (text) {
    const arr = tryParseJSONArray(text) || tryParseJSON(text);
    if (arr && Array.isArray(arr)) {
      arr.forEach(e => {
        if (!state.data.timeline) state.data.timeline = [];
        const ne = { id: uid(), name: e.title || e.name || '', title: e.title || e.name || '', time: e.time || '', type: e.type || '', description: e.description || '', cause: e.cause || '', prerequisites: [], subEvents: [], outcome: e.outcome || '', aftermath: e.aftermath || '', followUpEvents: [], characters: [], factions: [], locations: [], items: [], relatedVolumes: [], customProps: {} };
        _migrateEventLinks(ne);
        state.data.timeline.push(ne);
      });
      autoSave();
      renderTabContent();
    }
  }
}

async function deleteTimelineEvent(id) {
  if (!await customConfirm('确定删除此事件？')) return;
  state.data.timeline = (state.data.timeline || []).filter(e => e.id !== id);
  if (state.selectedEventId === id) state.selectedEventId = null;
  autoSave();
  renderTabContent();
}

function navigateToEvent(eventId) {
  pushNavHistory();
  _migrateTimeline();
  state.activeTab = 'events';
  state.selectedEventId = eventId;
  render();
}

function locateEventOnTimeline(eventId) {
  _migrateTimeline();
  const order = state.data.timelineOrder || [];
  if (!order.includes(eventId)) {
    state.data.timelineOrder = order.concat(eventId);
    autoSave();
  }
  state.activeTab = 'timeline';
  state._locateEventId = eventId;
  render();
  setTimeout(() => {
    const el = document.querySelector(`.tl-main-item[data-eid="${eventId}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.style.transition = 'box-shadow 0.3s';
      el.style.boxShadow = '0 0 0 3px var(--accent), var(--shadow-card)';
      setTimeout(() => { el.style.boxShadow = ''; }, 2000);
    }
    state._locateEventId = null;
  }, 300);
}