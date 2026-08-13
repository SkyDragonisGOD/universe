// ============================================================
// 世界生成器 — 叙事系统 (事件/力量体系/故事/伏笔/大纲/时间线)
// 依赖: core/state.js, core/utils.js, core/modal.js, core/glossary.js, core/properties.js, core/ai.js
// ============================================================

// --- EVENTS ---
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

function renderEvents() {
  _migrateTimeline();
  const events = state.data.timeline || [];
  return `<div class="char-layout">
    <div class="char-list-panel" style="min-width:220px">
      <div class="flex-between mb-8"><h3>⚡ 事件列表</h3><div class="flex-gap"><button class="btn btn-ai btn-sm" onclick="aiGenTimeline()">🤖</button><button class="btn btn-sm btn-primary" onclick="addTimelineEvent()">+</button></div></div>
      <div id="ai-timeline-result"></div>
      <div id="event-list">${renderEventList()}</div>
    </div>
    <div class="char-detail-panel" id="event-detail">${renderEventDetail()}</div>
  </div>`;
}

function renderEventList() {
  const events = state.data.timeline || [];
  if (events.length === 0) return '<div class="empty-state"><div class="icon">⚡</div><p>暂无事件</p></div>';
  return events.map((e, i) => {
    const sel = state.selectedEventId === e.id;
    const desc = (e.description || e.cause || '').substring(0, 60);
    const charCount = _normLinks(e.characters).length;
    const locCount = _normLinks(e.locations).length;
    return `<div class="location-card${sel ? ' selected' : ''}" data-eid="${e.id}" style="cursor:pointer">
      <div class="flex-between"><span class="loc-name">${esc(e.name || e.title || '未命名事件')}</span>
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

  return `<div class="wiki-page">
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
    <div class="flex-between" style="margin-top:16px;padding-top:16px;border-top:1px solid var(--border)">
      <button class="btn btn-sm btn-outline" onclick="if(state.navigationHistory.length>0)goBack();else{state.selectedEventId=null;renderTabContent()}">← 返回</button>
      <div class="flex-gap">
        <button class="btn btn-sm btn-outline" onclick="locateEventOnTimeline('${e.id}')">📍 定位到时间线</button>
        <button class="btn btn-sm btn-danger" onclick="deleteTimelineEvent('${e.id}')">🗑️ 删除</button>
        <button class="btn btn-sm btn-primary" onclick="startEventEdit()">✏️ 编辑</button>
      </div>
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
  const itemPool = (state.data.items||[]).map(it => ({ id: it.id, name: `${it.icon||'📦'} ${it.name} [${bpNames[it.backpackId]||'未知背包'}]` }));

  function editLinkTags(links, pool, removeFn) {
    return links.map(l => {
      const item = pool.find(p => p.id === l.id);
      const name = item ? item.name : l.id;
      const descHtml = l.desc ? `<span style="font-size:11px;color:var(--text-muted)">(${esc(l.desc)})</span>` : '';
      return `<span class="wiki-tag skill">${esc(name)}${descHtml}<button class="btn btn-xs btn-icon btn-danger" style="font-size:8px;margin-left:2px" onclick="${removeFn}('${esc(l.id)}')">×</button></span>`;
    }).join('');
  }

  return `<div class="card">
    <div class="flex-between"><h3>✏️ 编辑事件</h3><div class="flex-gap"><button class="btn btn-sm btn-outline" onclick="cancelEventEdit()">取消</button><button class="btn btn-sm btn-primary" onclick="saveEventEdit()">💾 保存</button></div></div>
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
  if (key === 'name' && checkDuplicate(state.data.timeline, value, e.id)) { alert('已存在同名事件！'); renderTabContent(); return; }
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
  if (allEvents.length === 0) { alert('暂无可选事件（已作为后续事件或子事件的不可选）'); return; }
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
  if (allEvents.length === 0) { alert('暂无可选事件（已作为前置事件或子事件的不可选）'); return; }
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
  if (allEvents.length === 0) { alert('暂无可选事件（已作为前置事件或后续事件的不可选）'); return; }
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
  if (characters.length === 0) { alert('暂无角色'); return; }
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
  if (factions.length === 0) { alert('暂无势力'); return; }
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
  if (locations.length === 0) { alert('暂无地点'); return; }
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
  if (backpacks.length === 0) { alert('暂无背包，请先在世界系统中创建背包和物品'); return; }
  const allItems = (state.data.items || []);
  if (allItems.length === 0) { alert('暂无物品，请先在世界系统中添加物品'); return; }
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
        <span>${esc(bp.icon||'🎒')} ${esc(bp.name)}</span>
        <span style="font-size:11px;color:var(--warm-gray);font-weight:400">${bpItems.length}个物品</span>
      </div>
      <div class="bp-items" style="display:none;padding-top:4px">${itemRows}</div>
    </div>`;
  }).join('');

  modal.innerHTML = `
    <h3>选择关联物品（点击背包展开物品）</h3>
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
  if (outline.length === 0) { alert('暂无卷'); return; }
  const volItems = outline.map((v, i) => ({ id: String(i), name: v.title || ('第' + (i + 1) + '卷') }));
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
  const elList = $('#event-list');
  if (elList) {
    elList.querySelectorAll('.location-card').forEach(c => {
      c.onclick = () => {
        state.selectedEventId = c.dataset.eid;
        state.editingEvent = false;
        state._forceAnimate = true;
        state._animateScope = 'detail';
        renderTabContent();
      };
    });
  }
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

// --- TIMELINE VIEW ---
function _tlEventCard(e, allEvents, depth) {
  const prereqLinks = _normLinks(e.prerequisites);
  const followUpLinks = _normLinks(e.followUpEvents);
  const subEventLinks = _normLinks(e.subEvents);
  const prereqEvents = prereqLinks.map(l => allEvents.find(ev => ev.id === l.id)).filter(Boolean);
  const followUpEvents = followUpLinks.map(l => allEvents.find(ev => ev.id === l.id)).filter(Boolean);
  const subEvents = subEventLinks.map(l => allEvents.find(ev => ev.id === l.id)).filter(Boolean);
  const borderColors = ['var(--black)', 'var(--accent)', '#6c5ce7', '#00b894', '#e17055'];
  const bc = borderColors[depth % borderColors.length];
  const pad = depth * 20;
  const isMain = depth === 0;

  function miniCard(ev, label, linkDesc) {
    const isSubEvent = label === '子事件';
    const evSubLinks = _normLinks(ev.subEvents);
    const hasSubDetail = isSubEvent && evSubLinks.length > 0;
    const descText = linkDesc || '';
    if (!isSubEvent) {
      return `<div class="tl-nested-card" data-eid="${ev.id}" style="margin-bottom:6px;border-left:3px solid ${bc};background:var(--bg-alt);border-radius:var(--radius-xs);overflow:hidden">
        <div class="tl-nested-header" style="padding:8px 10px;display:flex;align-items:center;gap:6px">
          <span style="font-size:10px;color:var(--warm-gray);min-width:32px">${esc(label)}</span>
          <strong style="font-size:13px;flex:1">${esc(ev.name || '未命名')}</strong>
          ${ev.time ? `<span style="color:var(--warm-gray);font-size:11px">${esc(ev.time)}</span>` : ''}
          ${descText ? `<span style="font-size:11px;color:var(--dark-gray);margin-left:4px">— ${esc(descText)}</span>` : ''}
          <button class="btn btn-xs btn-outline" style="font-size:10px" onclick="navigateToEvent('${ev.id}')">查看详情</button>
          <button class="btn btn-xs btn-outline" style="font-size:10px" onclick="locateEventOnTimeline('${ev.id}')">📍定位</button>
        </div>
      </div>`;
    }
    return `<div class="tl-nested-card" data-eid="${ev.id}" style="margin-bottom:6px;border-left:3px solid ${bc};background:var(--bg-alt);border-radius:var(--radius-xs);overflow:hidden">
      <div class="tl-nested-header" style="padding:8px 10px;cursor:pointer;display:flex;align-items:center;gap:6px" onclick="_tlToggleCard(this)">
        <span style="font-size:10px;color:var(--warm-gray);min-width:32px">${esc(label)}</span>
        <strong style="font-size:13px;flex:1">${esc(ev.name || '未命名')}</strong>
        ${ev.time ? `<span style="color:var(--warm-gray);font-size:11px">${esc(ev.time)}</span>` : ''}
        ${descText ? `<span style="font-size:11px;color:var(--dark-gray);margin-left:4px">— ${esc(descText)}</span>` : ''}
        ${hasSubDetail ? `<span class="tl-expand-icon" style="font-size:10px;transition:transform 0.2s">▼</span>` : ''}
        <button class="btn btn-xs btn-outline" style="font-size:10px" onclick="event.stopPropagation();navigateToEvent('${ev.id}')">查看详情</button>
        <button class="btn btn-xs btn-outline" style="font-size:10px" onclick="event.stopPropagation();locateEventOnTimeline('${ev.id}')">📍定位</button>
      </div>
      ${hasSubDetail ? `<div class="tl-nested-body" style="display:none;padding:8px 10px;border-top:1px solid var(--border)">
        ${evSubLinks.map(l => { const se = allEvents.find(x => x.id === l.id); return se ? miniCard(se, '子事件', l.desc) : ''; }).join('')}
      </div>` : ''}
    </div>`;
  }

  const timeText = e.time || '';
  const cardBody = `<div class="tl-card-body" style="display:none;border-top:1px solid var(--border);padding:12px 16px">
    ${e.cause ? `<div style="margin-bottom:8px"><span style="font-size:11px;color:var(--warm-gray)">起因</span><div style="font-size:13px;color:var(--dark-gray)">${esc(e.cause)}</div></div>` : ''}
    ${e.description ? `<div style="margin-bottom:8px"><span style="font-size:11px;color:var(--warm-gray)">经过</span><div style="font-size:13px;color:var(--dark-gray)">${esc(e.description)}</div></div>` : ''}
    ${e.outcome ? `<div style="margin-bottom:8px"><span style="font-size:11px;color:var(--warm-gray)">结局</span><div style="font-size:13px;color:var(--dark-gray)">${esc(e.outcome)}</div></div>` : ''}
    ${e.aftermath ? `<div style="margin-bottom:8px"><span style="font-size:11px;color:var(--warm-gray)">后续影响</span><div style="font-size:13px;color:var(--dark-gray)">${esc(e.aftermath)}</div></div>` : ''}
    ${prereqEvents.length > 0 ? `<div style="margin-bottom:8px"><span style="font-size:11px;color:var(--warm-gray)">前置事件</span>${prereqEvents.map((p, i) => miniCard(p, '前置', prereqLinks[i] ? prereqLinks[i].desc : '')).join('')}</div>` : ''}
    ${subEvents.length > 0 ? `<div style="margin-bottom:8px"><span style="font-size:11px;color:var(--warm-gray)">子事件</span>${subEvents.map((s, i) => miniCard(s, '子事件', subEventLinks[i] ? subEventLinks[i].desc : '')).join('')}</div>` : ''}
    ${followUpEvents.length > 0 ? `<div style="margin-bottom:8px"><span style="font-size:11px;color:var(--warm-gray)">后续影响事件</span>${followUpEvents.map((f, i) => miniCard(f, '后续', followUpLinks[i] ? followUpLinks[i].desc : '')).join('')}</div>` : ''}
    <div style="margin-top:8px"><button class="btn btn-xs btn-outline" onclick="navigateToEvent('${e.id}')">查看完整详情 →</button></div>
  </div>`;

  if (isMain) {
    return `<div class="tl-timeline-item tl-main-item" data-eid="${e.id}" style="position:relative;margin-bottom:20px;display:flex;align-items:flex-start">
      <div style="flex-shrink:0;width:72px;text-align:right;padding-right:10px;padding-top:10px">
        <span style="font-size:17px;font-weight:800;color:var(--accent);white-space:nowrap;letter-spacing:0.5px">${esc(timeText)}</span>
      </div>
      <div style="flex-shrink:0;display:flex;flex-direction:column;align-items:center;width:18px;position:relative">
        <div style="width:2px;position:absolute;top:0;bottom:0;left:50%;transform:translateX(-50%);background:var(--border)"></div>
        <div style="width:14px;height:14px;border-radius:50%;background:${bc};z-index:1;border:2px solid var(--white);box-shadow:0 0 0 2px ${bc};flex-shrink:0;margin-top:10px"></div>
      </div>
      <div style="flex:1;min-width:0;background:var(--white);border-radius:var(--radius-sm);box-shadow:var(--shadow-card);border-left:4px solid ${bc};overflow:hidden;cursor:grab">
        <div class="tl-card-header" style="padding:12px 16px;cursor:pointer;display:flex;align-items:center;gap:8px" onclick="_tlToggleCard(this)">
          <strong style="font-size:15px;flex:1">${esc(e.name || '未命名')}</strong>
          ${e.type ? `<span style="color:var(--dark-gray);font-size:11px;background:var(--bg-alt);padding:2px 6px;border-radius:var(--radius-xs)">${esc(e.type)}</span>` : ''}
          <span class="tl-expand-icon" style="font-size:10px;transition:transform 0.2s;color:var(--warm-gray)">▼</span>
          <button class="btn btn-xs btn-icon btn-danger" style="font-size:10px" onclick="event.stopPropagation();removeEventFromTimeline('${e.id}')">×</button>
        </div>
        ${cardBody}
      </div>
    </div>`;
  }
  return `<div class="tl-timeline-item" data-eid="${e.id}" style="position:relative;margin-bottom:0">
    <div style="background:var(--white);border-radius:var(--radius-sm);box-shadow:var(--shadow-card);border-left:4px solid ${bc};overflow:hidden">
      <div class="tl-card-header" style="padding:12px 16px;cursor:pointer;display:flex;align-items:center;gap:8px" onclick="_tlToggleCard(this)">
        <strong style="font-size:13px;flex:1">${esc(e.name || '未命名')}</strong>
        ${e.type ? `<span style="color:var(--dark-gray);font-size:11px;background:var(--bg-alt);padding:2px 6px;border-radius:var(--radius-xs)">${esc(e.type)}</span>` : ''}
        <span class="tl-expand-icon" style="font-size:10px;transition:transform 0.2s;color:var(--warm-gray)">▼</span>
      </div>
      ${cardBody}
    </div>
  </div>`;
}

function renderTimelineView() {
  _migrateTimeline();
  const order = state.data.timelineOrder || [];
  const allEvents = state.data.timeline || [];
  const orderedEvents = order.map(id => allEvents.find(e => e.id === id)).filter(Boolean);
  const unorderedEvents = allEvents.filter(e => !order.includes(e.id));
  return `<div class="card" style="max-width:900px;margin:0 auto">
    <div class="flex-between mb-16"><h3>⏳ 时间线</h3><span class="text-sm text-muted">点击展开详情 · 按住拖拽排序 · 上早下晚</span></div>
    ${unorderedEvents.length > 0 ? `<div class="mb-16"><div class="text-sm text-muted mb-8">未加入时间线的事件（拖拽到下方时间线）</div>
      <div id="tl-unordered" style="display:flex;flex-wrap:wrap;gap:8px;min-height:40px;padding:8px;border:2px dashed var(--border);border-radius:var(--radius-sm)">
        ${unorderedEvents.map(e => `<div class="tl-drag-card" data-eid="${e.id}" style="padding:6px 12px;background:var(--bg-alt);border-radius:var(--radius-xs);cursor:grab;font-size:13px;border:1px solid var(--border);user-select:none">${esc(e.name || '未命名')}${e.time ? `<span style="color:var(--warm-gray);margin-left:6px;font-size:11px">${esc(e.time)}</span>` : ''}</div>`).join('')}
      </div></div>` : ''}
    <div class="text-sm text-muted mb-8">时间线</div>
    <div id="tl-ordered" style="position:relative;min-height:60px">
      ${orderedEvents.length === 0 ? '<div class="text-xs text-muted" style="padding:16px 0">将上方事件拖拽到此处，或在事件tab中创建事件</div>' : orderedEvents.map(e => _tlEventCard(e, allEvents, 0)).join('')}
    </div>
  </div>`;
}

function removeEventFromTimeline(eid) {
  state.data.timelineOrder = (state.data.timelineOrder || []).filter(id => id !== eid);
  autoSave();
  renderTabContent();
}

function _tlAutoSort() {
  const order = [...(state.data.timelineOrder || [])];
  if (order.length <= 1) return order;

  const allEvents = state.data.timeline || [];
  const inOrder = new Set(order);

  const edges = {};
  order.forEach(id => { edges[id] = new Set(); });

  allEvents.forEach(e => {
    if (!inOrder.has(e.id)) return;
    _normLinks(e.prerequisites).forEach(l => {
      if (inOrder.has(l.id)) edges[l.id].add(e.id);
    });
    _normLinks(e.followUpEvents).forEach(l => {
      if (inOrder.has(l.id)) edges[e.id].add(l.id);
    });
  });

  const posMap = {};
  order.forEach((id, i) => { posMap[id] = i; });

  const inDegree = {};
  order.forEach(id => { inDegree[id] = 0; });
  order.forEach(id => { edges[id].forEach(next => { inDegree[next]++; }); });

  const ready = order.filter(id => inDegree[id] === 0).sort((a, b) => posMap[a] - posMap[b]);
  const result = [];

  while (ready.length > 0) {
    const id = ready.shift();
    result.push(id);
    const newlyReady = [];
    edges[id].forEach(next => {
      inDegree[next]--;
      if (inDegree[next] === 0) newlyReady.push(next);
    });
    newlyReady.sort((a, b) => posMap[a] - posMap[b]);
    for (const nr of newlyReady) {
      let lo = 0, hi = ready.length;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (posMap[ready[mid]] < posMap[nr]) lo = mid + 1; else hi = mid;
      }
      ready.splice(lo, 0, nr);
    }
  }

  if (result.length < order.length) {
    const resultSet = new Set(result);
    order.forEach(id => { if (!resultSet.has(id)) result.push(id); });
  }

  return result;
}

function setupTimelineView() {
  const ordered = $('#tl-ordered');
  const unordered = $('#tl-unordered');
  if (!ordered) return;

  let dragState = null;
  let _tlClickLock = false;

  function getDropIndex(y) {
    const items = ordered.querySelectorAll('.tl-main-item');
    for (let i = 0; i < items.length; i++) {
      const rect = items[i].getBoundingClientRect();
      if (y < rect.top + rect.height / 2) return i;
    }
    return items.length;
  }

  function clearIndicators() {
    ordered.querySelectorAll('.tl-drop-indicator').forEach(el => el.remove());
  }

  function showDropIndicator(idx) {
    clearIndicators();
    const items = ordered.querySelectorAll('.tl-main-item');
    const indicator = document.createElement('div');
    indicator.className = 'tl-drop-indicator';
    indicator.style.cssText = 'height:3px;background:var(--accent);border-radius:2px;transition:all 0.15s';
    if (idx >= items.length) {
      if (items.length > 0) items[items.length - 1].after(indicator);
      else ordered.appendChild(indicator);
    } else {
      items[idx].before(indicator);
    }
  }

  function startDrag(el, eid, source, clientX, clientY) {
    const rect = el.getBoundingClientRect();
    dragState = {
      eid, source,
      ghost: null,
      offsetX: clientX - rect.left,
      offsetY: clientY - rect.top,
      startX: clientX,
      startY: clientY,
      moved: false,
      origEl: el
    };
  }

  function moveDrag(clientX, clientY) {
    if (!dragState) return;
    const dx = clientX - dragState.startX;
    const dy = clientY - dragState.startY;
    if (!dragState.moved && Math.abs(dx) + Math.abs(dy) < 5) return;
    dragState.moved = true;
    dragState.origEl.style.opacity = '0.3';
    if (!dragState.ghost) {
      const ghost = dragState.origEl.cloneNode(true);
      ghost.style.position = 'fixed';
      ghost.style.zIndex = '10000';
      ghost.style.pointerEvents = 'none';
      ghost.style.opacity = '0.85';
      ghost.style.width = dragState.origEl.offsetWidth + 'px';
      ghost.style.transform = 'rotate(1deg) scale(1.01)';
      ghost.style.boxShadow = '0 8px 24px rgba(0,0,0,0.18)';
      ghost.style.transition = 'none';
      document.body.appendChild(ghost);
      dragState.ghost = ghost;
    }
    dragState.ghost.style.left = (clientX - dragState.offsetX) + 'px';
    dragState.ghost.style.top = (clientY - dragState.offsetY) + 'px';

    if (dragState.source === 'tl-ordered' || ordered.getBoundingClientRect().top <= clientY) {
      const idx = getDropIndex(clientY);
      showDropIndicator(idx);
    } else {
      clearIndicators();
    }
  }

  function endDrag() {
    if (!dragState) return;
    if (dragState.ghost) dragState.ghost.remove();
    dragState.origEl.style.opacity = '';
    clearIndicators();
    dragState = null;
  }

  document.querySelectorAll('.tl-drag-card').forEach(el => {
    el.addEventListener('mousedown', function(ev) {
      if (ev.button !== 0) return;
      ev.preventDefault();
      startDrag(this, this.dataset.eid, 'tl-unordered', ev.clientX, ev.clientY);
    });
  });
  document.querySelectorAll('.tl-main-item').forEach(el => {
    el.addEventListener('mousedown', function(ev) {
      if (ev.button !== 0) return;
      if (ev.target.closest('button') || ev.target.closest('.tl-nested-card') || ev.target.closest('.tl-card-body')) return;
      const header = ev.target.closest('.tl-card-header');
      if (!header) return;
      startDrag(this, this.dataset.eid, 'tl-ordered', ev.clientX, ev.clientY);
    });
  });

  if (window._tlMouseMove) document.removeEventListener('mousemove', window._tlMouseMove);
  if (window._tlMouseUp) document.removeEventListener('mouseup', window._tlMouseUp);

  window._tlMouseMove = function(ev) {
    if (!dragState) return;
    ev.preventDefault();
    moveDrag(ev.clientX, ev.clientY);
  };
  window._tlMouseUp = function(ev) {
    if (!dragState) return;
    if (!dragState.moved) {
      endDrag();
      return;
    }
    _tlClickLock = true;
    setTimeout(() => { _tlClickLock = false; }, 50);

    const order = [...(state.data.timelineOrder || [])];
    const dropIdx = getDropIndex(ev.clientY);
    const orderedRect = ordered.getBoundingClientRect();
    const inTimeline = ev.clientY >= orderedRect.top && ev.clientY <= orderedRect.bottom;
    const inUnordered = unordered && ev.clientX >= unordered.getBoundingClientRect().left && ev.clientX <= unordered.getBoundingClientRect().right && ev.clientY >= unordered.getBoundingClientRect().top && ev.clientY <= unordered.getBoundingClientRect().bottom;

    if (dragState.source === 'tl-unordered' && inTimeline) {
      if (!order.includes(dragState.eid)) {
        order.splice(dropIdx, 0, dragState.eid);
      }
      state.data.timelineOrder = order;
      state.data.timelineOrder = _tlAutoSort();
    } else if (dragState.source === 'tl-ordered') {
      if (inUnordered) {
        state.data.timelineOrder = order.filter(id => id !== dragState.eid);
      } else if (inTimeline) {
        const fromIdx = order.indexOf(dragState.eid);
        if (fromIdx !== -1) {
          order.splice(fromIdx, 1);
          const newIdx = dropIdx > fromIdx ? dropIdx - 1 : dropIdx;
          order.splice(newIdx < 0 ? 0 : newIdx, 0, dragState.eid);
        }
        state.data.timelineOrder = order;
        state.data.timelineOrder = _tlAutoSort();
      }
    }
    endDrag();
    autoSave();
    renderTabContent();
  };

  document.addEventListener('mousemove', window._tlMouseMove);
  document.addEventListener('mouseup', window._tlMouseUp);

  window._tlToggleCard = function(headerEl) {
    if (_tlClickLock) return;
    const body = headerEl.nextElementSibling;
    const icon = headerEl.querySelector('.tl-expand-icon');
    if (!body) return;
    if (body.style.display === 'none') {
      body.style.display = 'block';
      if (icon) icon.style.transform = 'rotate(180deg)';
    } else {
      body.style.display = 'none';
      if (icon) icon.style.transform = '';
    }
  };
}

// --- POWERS ---
function renderPowers() {
  const powers = state.data.powers||[];
  ensurePropertyDefs();
  const customProps = getCustomPropsForScope('powers');
  return `<div class="card"><h3>⚡ 力量体系</h3><div class="flex-between mb-8"><div class="flex-gap"><button class="btn btn-ai btn-sm" onclick="aiGenPowers()">🤖 AI 生成</button><button class="btn btn-sm btn-primary" onclick="addPower()">+ 添加体系</button></div></div>
    <div id="ai-powers-result"></div><div class="powers-list">${powers.length===0?'<div class="empty-state"><div class="icon">⚡</div><p>暂无力量体系</p></div>':powers.map((p,i)=>renderPowerItem(p,i,customProps)).join('')}</div></div>`;
}

function renderPowerItem(p,i,customProps) {
  if (!p.levels) p.levels = [];
  if (!p.levelEntries) p.levelEntries = [];
  if (!p.customProps) p.customProps = {};
  if (!p.relatedPowers) p.relatedPowers = [];
  const allPowers = (state.data.powers||[]).filter((_,pi)=>pi!==i);
  const relatedLinks = _normLinks(p.relatedPowers);

  const levelEntriesHtml = p.levelEntries.map((le,li) => {
    const leDesc = le.desc || '';
    return `<div style="display:flex;gap:6px;align-items:flex-start;margin-bottom:6px;padding:8px;background:var(--white);border:1px solid var(--border);border-radius:var(--radius-xs)">
      <span style="color:var(--warm-gray);font-size:12px;padding-top:8px;flex-shrink:0">${li+1}.</span>
      <div style="flex:1;min-width:0">
        <input value="${esc(le.name||'')}" placeholder="等级/境界名称" onchange="updatePowerLevelEntry(${i},${li},'name',this.value)" style="width:100%;padding:4px 8px;background:var(--white);border:1px solid var(--border);border-radius:var(--radius-xs);font-size:13px;font-family:var(--font-body)">
        <textarea rows="1" placeholder="简述（如：此境界特征、突破条件等）" onchange="updatePowerLevelEntry(${i},${li},'desc',this.value)" style="width:100%;padding:4px 8px;background:var(--white);border:1px solid var(--border);border-radius:var(--radius-xs);font-size:12px;font-family:var(--font-body);resize:vertical;margin-top:4px">${esc(leDesc)}</textarea>
      </div>
      <button class="btn btn-xs btn-danger" style="flex-shrink:0" onclick="removePowerLevelEntry(${i},${li})">×</button>
    </div>`;
  }).join('');

  const levelTagsHtml = p.levelEntries.filter(le=>le.name).map((le,li) => {
    const descAttr = le.desc ? ` title="${esc(le.desc)}"` : '';
    return `<span class="wiki-tag skill" style="cursor:pointer"${descAttr} onclick="openPowerLevelDetail(${i},${li})">${esc(le.name)}</span>`;
  }).join('');

  const relatedTagsHtml = relatedLinks.map(rl => {
    const rpIdx = parseInt(rl.id);
    const rp = state.data.powers[rpIdx];
    if (!rp) return '';
    const descArg = rl.desc ? `, '${jsStr(rl.desc)}'` : '';
    return `<span class="wiki-tag item" style="cursor:pointer" onclick="showPreviewCard('power','${esc(rpIdx)}',event${descArg})">${esc(rp.name)}<button class="btn btn-xs btn-icon btn-danger" style="font-size:8px;margin-left:2px" onclick="event.stopPropagation();removePowerRel(${i},'${esc(rl.id)}')">×</button></span>`;
  }).join('');

  return `<div class="power-item" style="border:1px solid var(--border);border-radius:var(--radius-sm);padding:16px;margin-bottom:12px;background:var(--bg-alt)">
    <div class="flex-between" style="margin-bottom:8px"><strong style="font-size:16px">${esc(p.name||'未命名体系')}</strong><button class="btn btn-xs btn-danger" onclick="deletePower(${i})">×</button></div>
    <div class="form-group"><label>体系名称</label><input value="${esc(p.name||'')}" onchange="updatePower(${i},'name',this.value)"></div>
    <div class="form-group"><label>描述</label><textarea rows="3" onchange="updatePower(${i},'description',this.value)">${esc(p.description||'')}</textarea></div>
    <div class="form-group"><label>等级/境界</label>
      ${levelTagsHtml ? `<div class="wiki-tags" style="margin-bottom:8px">${levelTagsHtml}</div>` : ''}
      <div style="margin-bottom:6px">${levelEntriesHtml}</div>
      <button class="btn btn-xs btn-outline" onclick="addPowerLevelEntry(${i})">+ 添加等级</button>
    </div>
    <div class="form-group"><label>规则/限制</label><textarea rows="2" onchange="updatePower(${i},'rules',this.value)">${esc(p.rules||'')}</textarea></div>
    ${customProps.length>0?`<div class="card" style="margin-bottom:8px;padding:10px"><h4 style="margin:0 0 8px">自定义属性</h4>${customProps.map(prop=>{
      const key='cp_'+prop.id;
      const val=p.customProps[key]||'';
      return renderCustomPropField(prop,val,`setPowerCustomProp(${i},'${prop.id}',this.value)`);
    }).join('')}</div>`:''}
    <div class="card" style="margin-bottom:0;padding:10px"><h4 style="margin:0 0 8px">关联力量体系</h4>
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
        <span class="text-xs text-muted">已选 ${relatedLinks.length} 个</span>
        <button class="btn btn-xs btn-outline" onclick="openPowerRelModal(${i})">选择</button>
      </div>
      ${relatedTagsHtml?`<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px">${relatedTagsHtml}</div>`:''}
    </div>
  </div>`;
}

function setupPowers() {}
function addPower() { if (!state.data.powers) state.data.powers=[]; state.data.powers.push({name:'',description:'',levels:[],levelEntries:[],rules:'',customProps:{},relatedPowers:[]}); autoSave(); renderTabContent(); }
async function aiGenPowers() { const el=$('#ai-powers-result'); const text=await runAI(window.api.aiGeneratePowerSystem(state.data),el); if (text) { const arr=tryParseJSONArray(text)||tryParseJSON(text); if (arr&&Array.isArray(arr)) { if (!state.data.powers) state.data.powers=[]; arr.forEach(p=>state.data.powers.push({name:p.name||p.title||'',description:p.description||'',levels:p.levels||[],levelEntries:(p.levels||[]).map(l=>typeof l==='object'?l:{name:l,desc:''}),rules:p.rules||'',customProps:{},relatedPowers:[]})); autoSave(); renderTabContent(); } } }
function updatePower(i,key,value) { if (state.data.powers&&state.data.powers[i]) { if (key==='levels'&&typeof value==='string') state.data.powers[i][key]=value.split('\n').filter(Boolean); else state.data.powers[i][key]=value; autoSave(); } }
function addPowerLevelEntry(i) { if (!state.data.powers[i].levelEntries) state.data.powers[i].levelEntries=[]; state.data.powers[i].levelEntries.push({name:'',desc:''}); autoSave(); renderTabContent(); }
function updatePowerLevelEntry(i,li,key,value) { if (state.data.powers&&state.data.powers[i]&&state.data.powers[i].levelEntries&&state.data.powers[i].levelEntries[li]) { state.data.powers[i].levelEntries[li][key]=value; autoSave(); } }
function removePowerLevelEntry(i,li) { if (state.data.powers&&state.data.powers[i]&&state.data.powers[i].levelEntries) { state.data.powers[i].levelEntries.splice(li,1); autoSave(); renderTabContent(); } }
function setPowerCustomProp(i,propId,value) { if(!state.data.powers||!state.data.powers[i]) return; if(!state.data.powers[i].customProps) state.data.powers[i].customProps={}; state.data.powers[i].customProps['cp_'+propId]=value; autoSave(); }
function openPowerLevelDetail(pi, li) {
  const p = (state.data.powers||[])[pi];
  if (!p || !p.levelEntries || !p.levelEntries[li]) return;
  const le = p.levelEntries[li];
  const overlay = $('#modal-overlay');
  const modal = $('#modal-box');
  modal.innerHTML = `
    <div class="wiki-page" style="padding:0">
      <div class="wiki-header" style="padding-bottom:12px;border-bottom:1px solid var(--border)">
        <h2 style="margin:0">🔮 ${esc(p.name||'未命名体系')} · ${esc(le.name||'第'+(li+1)+'级')}</h2>
      </div>
      <div class="wiki-section" style="margin-top:12px">
        <div class="wiki-field"><span class="wiki-label">等级序号</span><span class="wiki-value">${li+1}</span></div>
        <div class="wiki-field"><span class="wiki-label">等级名称</span><span class="wiki-value">${esc(le.name||'未命名')}</span></div>
      </div>
      ${le.desc?`<div class="wiki-section"><div class="wiki-section-title">简述</div><div class="wiki-value">${esc(le.desc)}</div></div>`:`<div class="wiki-section"><div class="wiki-section-title">简述</div><div class="text-xs text-muted">暂无简述</div></div>`}
      <div class="modal-actions" style="margin-top:16px">
        <button class="btn btn-outline" onclick="closeModal()">关闭</button>
      </div>
    </div>`;
  overlay.classList.remove('hidden');
  overlay.onclick = (e) => { if (e.target === overlay) closeModal(); };
}
async function openPowerRelModal(i) {
  const p = state.data.powers[i]; if(!p) return;
  const allPowers = (state.data.powers||[]).filter((_,pi)=>pi!==i);
  if(allPowers.length===0){alert('暂无其他力量体系');return;}
  const options = allPowers.map((rp,ri)=>{const realIdx=state.data.powers.indexOf(rp);return {id:String(realIdx),name:rp.name||'未命名体系'};});
  const result = await customLinkModal('关联力量体系',options,p.relatedPowers||[],'简述关联');
  if(result===null) return;
  p.relatedPowers = result;
  autoSave(); renderTabContent();
}
function removePowerRel(i,id) {
  const p = state.data.powers[i]; if(!p) return;
  p.relatedPowers = _normLinks(p.relatedPowers||[]).filter(l=>l.id!==id).map(l=>({id:l.id,desc:l.desc}));
  autoSave(); renderTabContent();
}
async function deletePower(i) { if (!await customConfirm('删除此力量体系？')) return; state.data.powers.splice(i,1); autoSave(); renderTabContent(); }

// --- OUTLINE ---
function renderOutline() {
  const outline = state.data.outline || [];
  if (!state.outlineCollapsed) state.outlineCollapsed = {};
  if (!state.outlineViewMode) state.outlineViewMode = {};
  return `<div class="card"><h3>📑 大纲/章节</h3>
    <div class="ai-section-actions"><button class="btn btn-ai btn-sm" onclick="aiGenOutline()">🤖 AI 生成大纲</button><button class="btn btn-sm btn-primary" onclick="addOutlineVolume()">+ 添加卷</button></div>
    <div id="ai-outline-result"></div>
    <div class="outline-list">${outline.length===0?'<div class="empty-state"><div class="icon">📑</div><p>暂无大纲</p></div>':outline.map((v,vi)=>renderOutlineVolume(v,vi)).join('')}</div></div>`;
}

function renderOutlineVolume(v,vi) {
  const collapsed = state.outlineCollapsed['vol_'+vi];
  const isEditing = state.outlineViewMode['vol_'+vi] === 'edit';
  const characters = collectGlossary('character');
  const factions = collectGlossary('faction');
  const locations = collectGlossary('location');
  const events = (state.data.timeline||[]);
  const allItems = (state.data.items||[]);
  const charLinks = _normLinks(v.characters||[]);
  const factionLinks = _normLinks(v.factions||[]);
  const locLinks = _normLinks(v.locations||[]);
  const eventLinks = _normLinks(v.events||[]);
  const itemLinks = _normLinks(v.items||[]);
  ensurePropertyDefs();
  const customProps = getCustomPropsForScope('outline');
  if (!v.customProps) v.customProps = {};
  const chapCount = (v.chapters||[]).length;
  const volTitle = v.title || `第${vi+1}卷`;

  if (!isEditing) {
    return renderOutlineVolumeView(v, vi, { charLinks, factionLinks, locLinks, eventLinks, itemLinks, characters, factions, locations, events, allItems, customProps, chapCount, volTitle, collapsed });
  }

  return `<div class="outline-volume" data-vi="${vi}" style="border:1px solid var(--border);border-radius:var(--radius-sm);margin-bottom:12px;background:var(--bg-alt);overflow:hidden">
    <div style="padding:12px 16px;display:flex;align-items:center;gap:8px;cursor:pointer;background:var(--bg-alt);border-bottom:${collapsed?'none':'1px solid var(--border)'}" onclick="toggleOutlineCollapse('vol_${vi}')">
      <span style="transition:transform 0.2s;display:inline-block;${collapsed?'':'transform:rotate(90deg)'}">▶</span>
      <span class="ol-vol-drag" style="cursor:grab;font-size:14px;color:var(--warm-gray);user-select:none" title="拖拽排序" onclick="event.stopPropagation()">⠿</span>
      <h4 style="margin:0;flex:1">📖 ${esc(volTitle)}</h4>
      <span class="text-xs text-muted">${chapCount}章</span>
      <div class="flex-gap" onclick="event.stopPropagation()">
        <button class="btn btn-xs btn-outline" onclick="setOutlineViewMode('vol_${vi}','view')">👁 观看</button>
        <button class="btn btn-xs btn-outline" onclick="insertOutlineVolume(${vi})">⬆ 插入</button>
        <button class="btn btn-xs btn-danger" onclick="deleteOutlineVolume(${vi})">×</button>
      </div>
    </div>
    ${collapsed ? '' : `<div style="padding:12px 16px">
    <div class="form-group"><input value="${esc(v.title||'')}" placeholder="卷标题" onchange="updateOutlineVolume(${vi},'title',this.value)" style="width:100%;padding:8px 12px;background:var(--white);border:1px solid var(--border);border-radius:var(--radius-sm);font-size:15px;font-weight:600;font-family:var(--font-body)"></div>
    <div class="form-group"><textarea rows="2" placeholder="卷简介" onchange="updateOutlineVolume(${vi},'summary',this.value)" style="width:100%;padding:8px 12px;background:var(--white);border:1px solid var(--border);border-radius:var(--radius-sm);font-size:14px;font-family:var(--font-body);resize:vertical">${esc(v.summary||'')}</textarea></div>
    ${customProps.length>0?`<div class="card" style="margin-bottom:8px;padding:10px">${customProps.map(prop=>{
      const key='cp_'+prop.id;
      const val=v.customProps[key]||'';
      return renderCustomPropField(prop,val,`setOutlineCustomProp(${vi},'${prop.id}',this.value)`);
    }).join('')}</div>`:''}
    <div class="card" style="margin-bottom:8px;padding:10px"><h4 style="margin:0 0 8px">关联</h4>
      <div class="form-group"><label>关联人物</label>
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <span class="text-xs text-muted">已选 ${charLinks.length} 个</span>
          <button class="btn btn-xs btn-outline" onclick="openOutlineLinkModal(${vi},'characters')">选择</button>
        </div>
        ${charLinks.length>0?`<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px">${charLinks.map(cl=>{const ch=characters.find(c=>c.id===cl.id);return ch?`<span class="wiki-tag skill">${esc(ch.name)}<button class="btn btn-xs btn-icon btn-danger" style="font-size:8px;margin-left:2px" onclick="removeOutlineLink(${vi},'characters','${esc(cl.id)}')">×</button></span>`:'';}).join('')}</div>`:''}
      </div>
      <div class="form-group"><label>关联势力</label>
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <span class="text-xs text-muted">已选 ${factionLinks.length} 个</span>
          <button class="btn btn-xs btn-outline" onclick="openOutlineLinkModal(${vi},'factions')">选择</button>
        </div>
        ${factionLinks.length>0?`<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px">${factionLinks.map(fl=>{const fa=factions.find(f=>f.id===fl.id);return fa?`<span class="wiki-tag item">${esc(fa.name)}<button class="btn btn-xs btn-icon btn-danger" style="font-size:8px;margin-left:2px" onclick="removeOutlineLink(${vi},'factions','${esc(fl.id)}')">×</button></span>`:'';}).join('')}</div>`:''}
      </div>
      <div class="form-group"><label>关联地点</label>
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <span class="text-xs text-muted">已选 ${locLinks.length} 个</span>
          <button class="btn btn-xs btn-outline" onclick="openOutlineLinkModal(${vi},'locations')">选择</button>
        </div>
        ${locLinks.length>0?`<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px">${locLinks.map(ll=>{const loc=locations.find(l=>l.id===ll.id);return loc?`<span class="wiki-tag skill">${esc(loc.name)}<button class="btn btn-xs btn-icon btn-danger" style="font-size:8px;margin-left:2px" onclick="removeOutlineLink(${vi},'locations','${esc(ll.id)}')">×</button></span>`:'';}).join('')}</div>`:''}
      </div>
      <div class="form-group"><label>关联事件</label>
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <span class="text-xs text-muted">已选 ${eventLinks.length} 个</span>
          <button class="btn btn-xs btn-outline" onclick="openOutlineLinkModal(${vi},'events')">选择</button>
        </div>
        ${eventLinks.length>0?`<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px">${eventLinks.map(el=>{const ev=events.find(e=>e.id===el.id);return ev?`<span class="wiki-tag item">${esc(ev.name)}<button class="btn btn-xs btn-icon btn-danger" style="font-size:8px;margin-left:2px" onclick="removeOutlineLink(${vi},'events','${esc(el.id)}')">×</button></span>`:'';}).join('')}</div>`:''}
      </div>
      <div class="form-group"><label>关联物品</label>
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <span class="text-xs text-muted">已选 ${itemLinks.length} 个</span>
          <button class="btn btn-xs btn-outline" onclick="openOutlineItemModal(${vi})">选择</button>
        </div>
        ${itemLinks.length>0?`<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px">${itemLinks.map(il=>{const it=allItems.find(i=>i.id===il.id);return it?`<span class="wiki-tag item">${it.icon||'📦'} ${esc(it.name)}<button class="btn btn-xs btn-icon btn-danger" style="font-size:8px;margin-left:2px" onclick="removeOutlineLink(${vi},'items','${esc(il.id)}')">×</button></span>`:'';}).join('')}</div>`:''}
      </div>
    </div>
    <div class="chapters-list">${(v.chapters||[]).map((ch,ci)=>renderOutlineChapter(ch,vi,ci)).join('')}</div>
    <button class="btn btn-xs btn-outline" style="margin-top:8px" onclick="addOutlineChapter(${vi})">+ 添加章节</button>
    </div>`}
  </div>`;
}

function renderOutlineVolumeView(v, vi, ctx) {
  const { charLinks, factionLinks, locLinks, eventLinks, itemLinks, characters, factions, locations, events, allItems, customProps, chapCount, volTitle, collapsed } = ctx;
  const cpData = v.customProps || {};
  const customPropHtml = renderCustomPropWikiHtml(customProps, cpData);

  function viewTag(item, type) {
    const descArg = item._desc ? `, '${jsStr(item._desc)}'` : '';
    return `<span class="wiki-tag skill" onclick="showPreviewCard('${type}','${esc(item.id)}',event${descArg})" style="cursor:pointer">${esc(item.name)}</span>`;
  }

  const charItems = charLinks.map(l => { const ch = characters.find(c => c.id === l.id); return ch ? { ...ch, _desc: l.desc } : null; }).filter(Boolean);
  const factionItems = factionLinks.map(l => { const f = factions.find(fa => fa.id === l.id); return f ? { ...f, _desc: l.desc } : null; }).filter(Boolean);
  const locItems = locLinks.map(l => { const loc = locations.find(lo => lo.id === l.id); return loc ? { ...loc, _desc: l.desc } : null; }).filter(Boolean);
  const eventItems = eventLinks.map(l => { const ev = events.find(e => e.id === l.id); return ev ? { ...ev, _desc: l.desc } : null; }).filter(Boolean);
  const itemItems = itemLinks.map(l => { const it = allItems.find(i => i.id === l.id); return it ? { ...it, _desc: l.desc } : null; }).filter(Boolean);

  const hasLinks = charItems.length > 0 || factionItems.length > 0 || locItems.length > 0 || eventItems.length > 0 || itemItems.length > 0;

  return `<div class="outline-volume" data-vi="${vi}" style="border:1px solid var(--border);border-radius:var(--radius-sm);margin-bottom:12px;background:var(--bg-alt);overflow:hidden">
    <div style="padding:12px 16px;display:flex;align-items:center;gap:8px;cursor:pointer;background:var(--bg-alt);border-bottom:${collapsed?'none':'1px solid var(--border)'}" onclick="toggleOutlineCollapse('vol_${vi}')">
      <span style="transition:transform 0.2s;display:inline-block;${collapsed?'':'transform:rotate(90deg)'}">▶</span>
      <span class="ol-vol-drag" style="cursor:grab;font-size:14px;color:var(--warm-gray);user-select:none" title="拖拽排序" onclick="event.stopPropagation()">⠿</span>
      <h4 style="margin:0;flex:1">📖 ${esc(volTitle)}</h4>
      <span class="text-xs text-muted">${chapCount}章</span>
      <div class="flex-gap" onclick="event.stopPropagation()">
        <button class="btn btn-xs btn-primary" onclick="setOutlineViewMode('vol_${vi}','edit')">✏️ 编辑</button>
        <button class="btn btn-xs btn-outline" onclick="insertOutlineVolume(${vi})">⬆ 插入</button>
        <button class="btn btn-xs btn-danger" onclick="deleteOutlineVolume(${vi})">×</button>
      </div>
    </div>
    ${collapsed ? '' : `<div style="padding:16px">
      ${v.summary ? `<div style="color:var(--text);margin-bottom:12px;line-height:1.6;white-space:pre-wrap">${esc(v.summary)}</div>` : ''}
      ${customPropHtml ? `<div style="margin-bottom:12px">${customPropHtml}</div>` : ''}
      ${hasLinks ? `<div style="margin-bottom:12px">
        ${charItems.length > 0 ? `<div style="margin-bottom:6px"><span class="text-xs text-muted">👤 人物</span><div class="wiki-tags" style="margin-top:2px">${charItems.map(ch => viewTag(ch, 'character')).join('')}</div></div>` : ''}
        ${factionItems.length > 0 ? `<div style="margin-bottom:6px"><span class="text-xs text-muted">🏰 势力</span><div class="wiki-tags" style="margin-top:2px">${factionItems.map(f => viewTag(f, 'faction')).join('')}</div></div>` : ''}
        ${locItems.length > 0 ? `<div style="margin-bottom:6px"><span class="text-xs text-muted">📍 地点</span><div class="wiki-tags" style="margin-top:2px">${locItems.map(l => viewTag(l, 'location')).join('')}</div></div>` : ''}
        ${eventItems.length > 0 ? `<div style="margin-bottom:6px"><span class="text-xs text-muted">⚡ 事件</span><div class="wiki-tags" style="margin-top:2px">${eventItems.map(e => viewTag(e, 'event')).join('')}</div></div>` : ''}
        ${itemItems.length > 0 ? `<div style="margin-bottom:6px"><span class="text-xs text-muted">📦 物品</span><div class="wiki-tags" style="margin-top:2px">${itemItems.map(it => `<span class="wiki-tag item" style="cursor:pointer" onclick="showItemDetail('${esc(it.id)}')">${it.icon||'📦'} ${esc(it.name)}</span>`).join('')}</div></div>` : ''}
      </div>` : ''}
      ${(v.chapters||[]).length > 0 ? `<div style="border-top:1px solid var(--border);padding-top:12px">${(v.chapters||[]).map((ch,ci) => renderOutlineChapterView(ch, vi, ci)).join('')}</div>` : ''}
    </div>`}
  </div>`;
}

function renderOutlineChapter(ch,vi,ci) {
  const collapsed = state.outlineCollapsed['ch_'+vi+'_'+ci];
  const chTitle = ch.title || `第${ci+1}章`;
  const charLinks = _normLinks(ch.characters||[]);
  const factionLinks = _normLinks(ch.factions||[]);
  const locLinks = _normLinks(ch.locations||[]);
  const eventLinks = _normLinks(ch.events||[]);
  const itemLinks = _normLinks(ch.items||[]);
  const characters = collectGlossary('character');
  const factions = collectGlossary('faction');
  const locations = collectGlossary('location');
  const events = (state.data.timeline||[]);
  const allItems = (state.data.items||[]);
  const vol = state.data.outline[vi];
  const volCharLinks = _normLinks(vol.characters||[]);
  const volFactionLinks = _normLinks(vol.factions||[]);
  const volLocLinks = _normLinks(vol.locations||[]);
  const volEventLinks = _normLinks(vol.events||[]);
  const volItemLinks = _normLinks(vol.items||[]);

  function renderVolTags(field, volLinks, allItems, chLinks) {
    const chIds = new Set(chLinks.map(l=>l.id));
    const items = volLinks.map(vl => {
      const item = allItems.find(it => it.id === vl.id);
      return item ? item : null;
    }).filter(Boolean);
    if (items.length === 0) return `<span class="text-xs text-muted">卷内无关联</span>`;
    return items.map(item => {
      const active = chIds.has(item.id);
      return `<span class="wiki-tag ${active?'skill':''}" style="cursor:pointer;font-size:11px;${active?'':'opacity:0.45;background:var(--bg-alt);border:1px dashed var(--border);color:var(--text-muted)'}" onclick="toggleChapterVolLink(${vi},${ci},'${field}','${esc(item.id)}',${!active})">${esc(item.name)}</span>`;
    }).join('');
  }

  return `<div class="outline-chapter" style="border:1px solid var(--border);border-radius:var(--radius-xs);margin-bottom:6px;background:var(--white);overflow:hidden">
    <div style="padding:8px 12px;display:flex;align-items:center;gap:6px;cursor:pointer;background:var(--white);border-bottom:${collapsed?'none':'1px solid var(--border)'}" onclick="toggleOutlineCollapse('ch_${vi}_${ci}')">
      <span style="transition:transform 0.2s;display:inline-block;font-size:10px;${collapsed?'':'transform:rotate(90deg)'}">▶</span>
      <strong style="flex:1;font-size:13px">📄 ${esc(chTitle)}</strong>
      <button class="btn btn-xs btn-danger" onclick="event.stopPropagation();deleteOutlineChapter(${vi},${ci})">×</button>
    </div>
    ${collapsed ? '' : `<div style="padding:10px 12px">
    <div class="form-group"><input value="${esc(ch.title||'')}" placeholder="章节标题" onchange="updateOutlineChapter(${vi},${ci},'title',this.value)" style="width:100%;padding:6px 10px;background:var(--white);border:1px solid var(--border);border-radius:var(--radius-sm);font-size:14px;font-family:var(--font-body)"></div>
    <div class="form-group"><textarea rows="2" placeholder="章节概要" onchange="updateOutlineChapter(${vi},${ci},'summary',this.value)" style="width:100%;padding:6px 10px;background:var(--white);border:1px solid var(--border);border-radius:var(--radius-sm);font-size:13px;font-family:var(--font-body);resize:vertical">${esc(ch.summary||'')}</textarea></div>
    <div style="margin-top:6px;padding:8px;background:var(--bg-alt);border-radius:var(--radius-xs)">
      <div style="font-size:11px;font-weight:500;margin-bottom:6px;color:var(--text-muted)">卷内关联（点击标签切换）</div>
      <div style="margin-bottom:6px"><span style="font-size:11px;color:var(--warm-gray);margin-right:4px">👤</span>${renderVolTags('characters', volCharLinks, characters, charLinks)}</div>
      <div style="margin-bottom:6px"><span style="font-size:11px;color:var(--warm-gray);margin-right:4px">🏰</span>${renderVolTags('factions', volFactionLinks, factions, factionLinks)}</div>
      <div style="margin-bottom:6px"><span style="font-size:11px;color:var(--warm-gray);margin-right:4px">📍</span>${renderVolTags('locations', volLocLinks, locations, locLinks)}</div>
      <div style="margin-bottom:6px"><span style="font-size:11px;color:var(--warm-gray);margin-right:4px">⚡</span>${renderVolTags('events', volEventLinks, events, eventLinks)}</div>
      <div><span style="font-size:11px;color:var(--warm-gray);margin-right:4px">📦</span>${renderVolTags('items', volItemLinks, allItems, itemLinks)}</div>
    </div>
    </div>`}
  </div>`;
}

function renderOutlineChapterView(ch, vi, ci) {
  const chTitle = ch.title || `第${ci+1}章`;
  const collapsed = state.outlineCollapsed['chview_'+vi+'_'+ci];
  const charLinks = _normLinks(ch.characters||[]);
  const factionLinks = _normLinks(ch.factions||[]);
  const locLinks = _normLinks(ch.locations||[]);
  const eventLinks = _normLinks(ch.events||[]);
  const itemLinks = _normLinks(ch.items||[]);
  const characters = collectGlossary('character');
  const factions = collectGlossary('faction');
  const locations = collectGlossary('location');
  const events = (state.data.timeline||[]);
  const allItems = (state.data.items||[]);
  const charItems = charLinks.map(l => { const ch2 = characters.find(c => c.id === l.id); return ch2 ? { ...ch2, _desc: l.desc } : null; }).filter(Boolean);
  const factionItems = factionLinks.map(l => { const f = factions.find(fa => fa.id === l.id); return f ? { ...f, _desc: l.desc } : null; }).filter(Boolean);
  const locItems = locLinks.map(l => { const loc = locations.find(lo => lo.id === l.id); return loc ? { ...loc, _desc: l.desc } : null; }).filter(Boolean);
  const eventItems = eventLinks.map(l => { const ev = events.find(e => e.id === l.id); return ev ? { ...ev, _desc: l.desc } : null; }).filter(Boolean);
  const itemItems = itemLinks.map(l => { const it = allItems.find(i => i.id === l.id); return it ? { ...it, _desc: l.desc } : null; }).filter(Boolean);
  const hasLinks = charItems.length > 0 || factionItems.length > 0 || locItems.length > 0 || eventItems.length > 0 || itemItems.length > 0;
  const linkCount = charItems.length + factionItems.length + locItems.length + eventItems.length + itemItems.length;

  function viewTag(item, type) {
    const descArg = item._desc ? `, '${jsStr(item._desc)}'` : '';
    return `<span class="wiki-tag skill" onclick="showPreviewCard('${type}','${esc(item.id)}',event${descArg})" style="cursor:pointer">${esc(item.name)}</span>`;
  }

  return `<div style="border:1px solid var(--border-subtle);border-radius:var(--radius-xs);margin-bottom:6px;background:var(--white);overflow:hidden">
    <div style="padding:8px 12px;display:flex;align-items:center;gap:6px;cursor:pointer" onclick="toggleOutlineCollapse('chview_${vi}_${ci}')">
      <span style="transition:transform 0.2s;display:inline-block;font-size:10px;${collapsed?'':'transform:rotate(90deg)'}">▶</span>
      <strong style="flex:1;font-size:13px">📄 ${esc(chTitle)}</strong>
      ${linkCount > 0 ? `<span class="text-xs text-muted">${linkCount}项关联</span>` : ''}
    </div>
    ${collapsed ? '' : `<div style="padding:6px 12px 10px">
      ${ch.summary ? `<div style="color:var(--text);font-size:13px;line-height:1.5;margin-bottom:6px;white-space:pre-wrap">${esc(ch.summary)}</div>` : `<div class="text-xs text-muted" style="margin-bottom:4px">暂无概要</div>`}
      ${hasLinks ? `<div>
        ${charItems.length > 0 ? `<div style="margin-bottom:4px"><span class="text-xs text-muted">👤</span> ${charItems.map(ch2 => viewTag(ch2, 'character')).join('')}</div>` : ''}
        ${factionItems.length > 0 ? `<div style="margin-bottom:4px"><span class="text-xs text-muted">🏰</span> ${factionItems.map(f => viewTag(f, 'faction')).join('')}</div>` : ''}
        ${locItems.length > 0 ? `<div style="margin-bottom:4px"><span class="text-xs text-muted">📍</span> ${locItems.map(l => viewTag(l, 'location')).join('')}</div>` : ''}
        ${eventItems.length > 0 ? `<div style="margin-bottom:4px"><span class="text-xs text-muted">⚡</span> ${eventItems.map(e => viewTag(e, 'event')).join('')}</div>` : ''}
        ${itemItems.length > 0 ? `<div><span class="text-xs text-muted">📦</span> ${itemItems.map(it => `<span class="wiki-tag item" style="cursor:pointer" onclick="showItemDetail('${esc(it.id)}')">${it.icon||'📦'} ${esc(it.name)}</span>`).join('')}</div>` : ''}
      </div>` : ''}
    </div>`}
  </div>`;
}

function setupOutline() {
  const list = document.querySelector('.outline-list');
  if (!list) return;
  let dragState = null;

  list.querySelectorAll('.ol-vol-drag').forEach(handle => {
    handle.addEventListener('mousedown', function(ev) {
      if (ev.button !== 0) return;
      ev.preventDefault();
      const volEl = this.closest('.outline-volume');
      if (!volEl) return;
      const vi = parseInt(volEl.dataset.vi);
      const rect = volEl.getBoundingClientRect();
      dragState = { vi, el: volEl, offsetY: ev.clientY - rect.top, startX: ev.clientX, startY: ev.clientY, moved: false, ghost: null, origEl: volEl };
    });
  });

  function moveOutlineDrag(clientX, clientY) {
    if (!dragState) return;
    const dx = clientX - dragState.startX;
    const dy = clientY - dragState.startY;
    if (!dragState.moved && Math.abs(dx) + Math.abs(dy) < 5) return;
    dragState.moved = true;
    dragState.origEl.style.opacity = '0.3';
    if (!dragState.ghost) {
      const ghost = dragState.origEl.cloneNode(true);
      ghost.style.position = 'fixed';
      ghost.style.zIndex = '10000';
      ghost.style.pointerEvents = 'none';
      ghost.style.opacity = '0.85';
      ghost.style.width = dragState.origEl.offsetWidth + 'px';
      ghost.style.boxShadow = '0 8px 24px rgba(0,0,0,0.18)';
      ghost.style.transition = 'none';
      document.body.appendChild(ghost);
      dragState.ghost = ghost;
    }
    dragState.ghost.style.left = dragState.origEl.getBoundingClientRect().left + 'px';
    dragState.ghost.style.top = (clientY - dragState.offsetY) + 'px';

    list.querySelectorAll('.ol-drop-indicator').forEach(el => el.remove());
    const vols = list.querySelectorAll('.outline-volume');
    for (let i = 0; i < vols.length; i++) {
      const r = vols[i].getBoundingClientRect();
      if (clientY < r.top + r.height / 2) {
        const ind = document.createElement('div');
        ind.className = 'ol-drop-indicator';
        ind.style.cssText = 'height:3px;background:var(--accent);border-radius:2px;margin:4px 0';
        vols[i].before(ind);
        break;
      }
      if (i === vols.length - 1) {
        const ind = document.createElement('div');
        ind.className = 'ol-drop-indicator';
        ind.style.cssText = 'height:3px;background:var(--accent);border-radius:2px;margin:4px 0';
        vols[i].after(ind);
      }
    }
  }

  function endOutlineDrag() {
    if (!dragState) return;
    if (dragState.ghost) dragState.ghost.remove();
    dragState.origEl.style.opacity = '';
    list.querySelectorAll('.ol-drop-indicator').forEach(el => el.remove());
    dragState = null;
  }

  if (window._olMouseMove) document.removeEventListener('mousemove', window._olMouseMove);
  if (window._olMouseUp) document.removeEventListener('mouseup', window._olMouseUp);

  window._olMouseMove = function(ev) { if (!dragState) return; ev.preventDefault(); moveOutlineDrag(ev.clientX, ev.clientY); };
  window._olMouseUp = function(ev) {
    if (!dragState) return;
    if (!dragState.moved) { endOutlineDrag(); return; }
    const vols = list.querySelectorAll('.outline-volume');
    let dropIdx = state.data.outline.length;
    for (let i = 0; i < vols.length; i++) {
      const r = vols[i].getBoundingClientRect();
      if (ev.clientY < r.top + r.height / 2) { dropIdx = i; break; }
    }
    const fromIdx = dragState.vi;
    if (fromIdx !== dropIdx && fromIdx !== dropIdx - 1) {
      const arr = state.data.outline;
      const item = arr.splice(fromIdx, 1)[0];
      const insertAt = dropIdx > fromIdx ? dropIdx - 1 : dropIdx;
      arr.splice(insertAt, 0, item);
      autoSave();
      renderTabContent();
    }
    endOutlineDrag();
  };

  document.addEventListener('mousemove', window._olMouseMove);
  document.addEventListener('mouseup', window._olMouseUp);
}

function toggleOutlineCollapse(key) { if (!state.outlineCollapsed) state.outlineCollapsed = {}; state.outlineCollapsed[key] = !state.outlineCollapsed[key]; renderTabContent(); }
function setOutlineViewMode(key, mode) { if (!state.outlineViewMode) state.outlineViewMode = {}; state.outlineViewMode[key] = mode; renderTabContent(); }
function addOutlineVolume() { if(!state.data.outline) state.data.outline=[]; state.data.outline.push({title:'',summary:'',chapters:[],characters:[],factions:[],locations:[],events:[],items:[],customProps:{}}); autoSave(); renderTabContent(); }
function insertOutlineVolume(vi) { if(!state.data.outline) state.data.outline=[]; state.data.outline.splice(vi,0,{title:'',summary:'',chapters:[],characters:[],factions:[],locations:[],events:[],items:[],customProps:{}}); autoSave(); renderTabContent(); }
function addOutlineChapter(vi) { if (!state.data.outline[vi].chapters) state.data.outline[vi].chapters=[]; state.data.outline[vi].chapters.push({title:'',summary:'',characters:[],factions:[],locations:[],events:[],items:[]}); autoSave(); renderTabContent(); }
async function aiGenOutline() { const el=$('#ai-outline-result'); const text=await runAI(window.api.aiGenerateOutline(state.data),el); if (text) { const arr=tryParseJSONArray(text)||tryParseJSON(text); if (arr&&Array.isArray(arr)) { if (!state.data.outline) state.data.outline=[]; arr.forEach(v=>state.data.outline.push({title:v.title||'',summary:v.summary||'',chapters:(v.chapters||[]).map(ch=>({title:ch.title||ch||'',summary:ch.summary||'',characters:[],factions:[],locations:[],events:[],items:[]})),characters:[],factions:[],locations:[],events:[],items:[],customProps:{}})); autoSave(); renderTabContent(); } } }
function updateOutlineVolume(vi,key,value) { if (state.data.outline&&state.data.outline[vi]) { state.data.outline[vi][key]=value; autoSave(); } }
function updateOutlineChapter(vi,ci,key,value) { if (state.data.outline&&state.data.outline[vi]&&state.data.outline[vi].chapters&&state.data.outline[vi].chapters[ci]) { state.data.outline[vi].chapters[ci][key]=value; autoSave(); } }
async function deleteOutlineVolume(vi) { if (!await customConfirm('删除此卷？')) return; state.data.outline.splice(vi,1); autoSave(); renderTabContent(); }
function deleteOutlineChapter(vi,ci) { state.data.outline[vi].chapters.splice(ci,1); autoSave(); renderTabContent(); }
function setOutlineCustomProp(vi,propId,value) { if(!state.data.outline||!state.data.outline[vi]) return; if(!state.data.outline[vi].customProps) state.data.outline[vi].customProps={}; state.data.outline[vi].customProps['cp_'+propId]=value; autoSave(); }
async function openOutlineLinkModal(vi,field) {
  const v = state.data.outline[vi]; if(!v) return;
  const existing = _normLinks(v[field]||[]);
  const existingIds = existing.map(l=>l.id);
  let items=[], label='';
  if(field==='characters'){ items=collectGlossary('character'); label='关联人物'; }
  else if(field==='factions'){ items=collectGlossary('faction'); label='关联势力'; }
  else if(field==='locations'){ items=collectGlossary('location'); label='关联地点'; }
  else if(field==='events'){ items=(state.data.timeline||[]); label='关联事件'; }
  const result = await customSelectModal(label, items, existingIds);
  if(result===null) return;
  v[field] = result.map(id=>({id}));
  autoSave(); renderTabContent();
}
function removeOutlineLink(vi,field,id) {
  const v = state.data.outline[vi]; if(!v) return;
  v[field] = _normLinks(v[field]||[]).filter(l=>l.id!==id).map(l=>({id:l.id,desc:l.desc}));
  autoSave(); renderTabContent();
}
async function openOutlineItemModal(vi) {
  const v = state.data.outline[vi]; if(!v) return;
  const backpacks = state.data.worldBackpacks || [];
  const allItems = state.data.items || [];
  if(allItems.length===0){alert('暂无物品');return;}
  const existingIds = _normLinks(v.items||[]).map(l=>l.id);
  const itemOptions = allItems.map(it=>({id:it.id,name:(it.icon||'📦')+' '+(it.name||'未命名')}));
  const result = await customSelectModal('📦 选择关联物品',itemOptions,existingIds);
  if(result===null) return;
  v.items = result.map(id=>({id}));
  autoSave(); renderTabContent();
}
async function openChapterLinkModal(vi,ci,field) {
  const ch = state.data.outline[vi].chapters[ci]; if(!ch) return;
  if(!ch[field]) ch[field] = [];
  const existing = _normLinks(ch[field]);
  const existingIds = existing.map(l=>l.id);
  let items=[], label='';
  if(field==='characters'){ items=collectGlossary('character'); label='关联人物'; }
  else if(field==='factions'){ items=collectGlossary('faction'); label='关联势力'; }
  else if(field==='locations'){ items=collectGlossary('location'); label='关联地点'; }
  else if(field==='events'){ items=(state.data.timeline||[]); label='关联事件'; }
  const result = await customSelectModal(label, items, existingIds);
  if(result===null) return;
  ch[field] = result.map(id=>({id}));
  autoSave(); renderTabContent();
}
function removeChapterLink(vi,ci,field,id) {
  const ch = state.data.outline[vi].chapters[ci]; if(!ch) return;
  ch[field] = _normLinks(ch[field]||[]).filter(l=>l.id!==id).map(l=>({id:l.id,desc:l.desc}));
  autoSave(); renderTabContent();
}
function toggleChapterVolLink(vi,ci,field,id,checked) {
  const ch = state.data.outline[vi].chapters[ci]; if(!ch) return;
  if (!ch[field]) ch[field] = [];
  const links = _normLinks(ch[field]);
  if (checked) {
    if (!links.some(l=>l.id===id)) { links.push({id}); }
  } else {
    const idx = links.findIndex(l=>l.id===id);
    if (idx >= 0) links.splice(idx,1);
  }
  ch[field] = links;
  autoSave(); renderTabContent();
}
async function openChapterItemModal(vi,ci) {
  const ch = state.data.outline[vi].chapters[ci]; if(!ch) return;
  if(!ch.items) ch.items = [];
  const allItems = state.data.items || [];
  if(allItems.length===0){alert('暂无物品');return;}
  const existingIds = _normLinks(ch.items||[]).map(l=>l.id);
  const itemOptions = allItems.map(it=>({id:it.id,name:(it.icon||'📦')+' '+(it.name||'未命名')}));
  const result = await customSelectModal('📦 选择关联物品',itemOptions,existingIds);
  if(result===null) return;
  ch.items = result.map(id=>({id}));
  autoSave(); renderTabContent();
}