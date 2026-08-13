// ============================================================
// 世界生成器 — 时间线视图
// 依赖: core/state.js, core/utils.js, core/modal.js, core/glossary.js
// ============================================================

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
  const hasLinks = (ev) => {
    return _normLinks(ev.characters).length > 0 || _normLinks(ev.factions).length > 0 || _normLinks(ev.locations).length > 0 || _normLinks(ev.items).length > 0 || _normLinks(ev.prerequisites).length > 0 || _normLinks(ev.followUpEvents).length > 0 || _normLinks(ev.subEvents).length > 0;
  };
  const filterLinked = state.timelineFilterLinked || false;
  const tlRelDefs = [
    { key:'character', label:'角色', field:'characters', getItems:()=>collectGlossary('character') },
    { key:'faction', label:'势力', field:'factions', getItems:()=>collectGlossary('faction') },
    { key:'location', label:'地点', field:'locations', getItems:()=>collectGlossary('location') },
    { key:'item', label:'物品', field:'items', getItems:()=>collectGlossary('item') },
  ];
  const tlRelMatchDefs = [
    { key:'character', field:'characters' },
    { key:'faction', field:'factions' },
    { key:'location', field:'locations' },
    { key:'item', field:'items' },
  ];
  let filteredOrdered = filterLinked ? orderedEvents.filter(hasLinks) : orderedEvents;
  let filteredUnordered = filterLinked ? unorderedEvents.filter(hasLinks) : unorderedEvents;
  filteredOrdered = filteredOrdered.filter(e => matchRelFilter(e, 'tlRelFilter', tlRelMatchDefs));
  filteredUnordered = filteredUnordered.filter(e => matchRelFilter(e, 'tlRelFilter', tlRelMatchDefs));
  filteredOrdered = filteredOrdered.filter(e => matchSearch(e.name || e.title, 'tlSearch'));
  filteredUnordered = filteredUnordered.filter(e => matchSearch(e.name || e.title, 'tlSearch'));
  return `<div class="card" style="max-width:900px;margin:0 auto">
    <div class="flex-between mb-16"><h3>⏳ 时间线</h3><span class="text-sm text-muted">点击展开详情 · 按住拖拽排序 · 上早下晚</span></div>
    <div style="margin-bottom:12px;display:flex;align-items:center;gap:6px"><span style="font-size:12px;color:var(--warm-gray)">筛选：</span><button class="btn btn-xs ${filterLinked?'btn-outline':'btn-primary'}" onclick="state.timelineFilterLinked=false;renderTabContent()">全部</button><button class="btn btn-xs ${filterLinked?'btn-primary':'btn-outline'}" onclick="state.timelineFilterLinked=true;renderTabContent()">有关联</button></div>
    ${renderSearchBox('tlSearch')}
    ${renderRelFilter('tlRelFilter', tlRelDefs)}
    ${filteredUnordered.length > 0 ? `<div class="mb-16"><div class="text-sm text-muted mb-8">未加入时间线的事件（拖拽到下方时间线）</div>
      <div id="tl-unordered" style="display:flex;flex-wrap:wrap;gap:8px;min-height:40px;padding:8px;border:2px dashed var(--border);border-radius:var(--radius-sm)">
        ${filteredUnordered.map(e => `<div class="tl-drag-card" data-eid="${e.id}" style="padding:6px 12px;background:var(--bg-alt);border-radius:var(--radius-xs);cursor:grab;font-size:13px;border:1px solid var(--border);user-select:none">${esc(e.name || '未命名')}${e.time ? `<span style="color:var(--warm-gray);margin-left:6px;font-size:11px">${esc(e.time)}</span>` : ''}</div>`).join('')}
      </div></div>` : ''}
    <div class="text-sm text-muted mb-8">时间线</div>
    <div id="tl-ordered" style="position:relative;min-height:60px">
      ${filteredOrdered.length === 0 ? '<div class="text-xs text-muted" style="padding:16px 0">将上方事件拖拽到此处，或在事件tab中创建事件</div>' : filteredOrdered.map(e => _tlEventCard(e, allEvents, 0)).join('')}
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