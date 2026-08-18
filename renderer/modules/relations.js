// ============================================================
// 世界生成器 — 关系图表
// 依赖: core/state.js, core/utils.js, core/modal.js, core/glossary.js
// ============================================================

function _getGraphEntityTypes() {
  return [
    { key:'character', icon:'👤', label:'角色', getData:()=>(state.data.characters||[]).map(c=>({id:c.id,name:c.name||'未命名'})) },
    { key:'faction', icon:'🏰', label:'势力', getData:()=>(state.data.factions||[]).map(f=>({id:f.id,name:f.name||'未命名'})) },
    { key:'location', icon:'📍', label:'地点', getData:()=>(state.data.locations||[]).map(l=>({id:l.id,name:l.name||'未命名'})) },
    { key:'item', icon:'📦', label:'物品', getData:()=>(state.data.items||[]).map(i=>({id:i.id,name:i.name||'未命名'})) },
    { key:'event', icon:'⚡', label:'事件', getData:()=>(state.data.timeline||[]).map(e=>({id:e.id,name:e.name||e.title||'未命名'})) },
  ];
}

function _getAllGraphEntities() {
  const types = _getGraphEntityTypes();
  const result = [];
  types.forEach(t => { t.getData().forEach(d => { result.push({...d, typeKey:t.key, icon:t.icon, typeLabel:t.label}); }); });
  return result;
}

function _getSelectedGraphSubjects() {
  if (state._graphSubjects === undefined || state._graphSubjects === null) {
    const all = _getAllGraphEntities();
    state._graphSubjects = all.map(e => e.typeKey + ':' + e.id);
  }
  return state._graphSubjects;
}

function _getEntityById(id) {
  const all = _getAllGraphEntities();
  return all.find(x=>x.id===id) || null;
}

function _normLinks(arr) { if (!arr || !Array.isArray(arr)) return []; return arr.map(l => typeof l === 'string' ? {id:l,desc:''} : l); }

function _getEntityAvatar(typeKey, id) {
  if (typeKey === 'character') {
    const c = (state.data.characters||[]).find(x=>x.id===id);
    return c && c.avatar ? c.avatar : null;
  }
  return null;
}

function _collectAllConnections(selectedIds) {
  const conns = [];
  const idSet = new Set(selectedIds);
  const chars = state.data.characters||[];
  const factions = state.data.factions||[];
  const locations = state.data.locations||[];
  const items = state.data.items||[];
  const events = state.data.timeline||[];

  chars.forEach(c => {
    if (!idSet.has(c.id)) return;
    _normLinks(c.factions).forEach(l => { if (idSet.has(l.id)) conns.push({from:c.id,to:l.id,desc:l.desc||'所属势力',fromType:'character',toType:'faction'}); });
    _normLinks(c.locations).forEach(l => { if (idSet.has(l.id)) conns.push({from:c.id,to:l.id,desc:l.desc||'所在地点',fromType:'character',toType:'location'}); });
    if (c.backpackItems && typeof c.backpackItems === 'object') {
      Object.values(c.backpackItems).forEach(idArr => {
        (Array.isArray(idArr) ? idArr : []).forEach(itemId => {
          if (idSet.has(itemId)) conns.push({from:c.id,to:itemId,desc:'持有物品',fromType:'character',toType:'item'});
        });
      });
    }
    _normLinks(c.relatedCharacters).forEach(l => { if (idSet.has(l.id)) conns.push({from:c.id,to:l.id,desc:l.desc||'',fromType:'character',toType:'character'}); });
    _normLinks(c.relatedEvents).forEach(l => { if (idSet.has(l.id)) conns.push({from:c.id,to:l.id,desc:l.desc||'参与事件',fromType:'character',toType:'event'}); });
  });

  factions.forEach(f => {
    if (!idSet.has(f.id)) return;
    _normLinks(f.headquarters).forEach(l => { if (idSet.has(l.id)) conns.push({from:f.id,to:l.id,desc:l.desc||'据点',fromType:'faction',toType:'location'}); });
    _normLinks(f.members).forEach(l => { if (idSet.has(l.id)) conns.push({from:f.id,to:l.id,desc:l.desc||'成员',fromType:'faction',toType:'character'}); });
    _normLinks(f.rivals).forEach(l => { if (idSet.has(l.id)) conns.push({from:f.id,to:l.id,desc:l.desc||'敌对',fromType:'faction',toType:'faction'}); });
    _normLinks(f.allies).forEach(l => { if (idSet.has(l.id)) conns.push({from:f.id,to:l.id,desc:l.desc||'盟友',fromType:'faction',toType:'faction'}); });
    _normLinks(f.relatedEvents).forEach(l => { if (idSet.has(l.id)) conns.push({from:f.id,to:l.id,desc:l.desc||'相关事件',fromType:'faction',toType:'event'}); });
  });

  locations.forEach(loc => {
    if (!idSet.has(loc.id)) return;
    _normLinks(loc.relatedCharacters).forEach(l => { if (idSet.has(l.id)) conns.push({from:loc.id,to:l.id,desc:l.desc||'关联角色',fromType:'location',toType:'character'}); });
    _normLinks(loc.relatedFactions).forEach(l => { if (idSet.has(l.id)) conns.push({from:loc.id,to:l.id,desc:l.desc||'驻扎势力',fromType:'location',toType:'faction'}); });
    _normLinks(loc.events).forEach(l => { if (idSet.has(l.id)) conns.push({from:loc.id,to:l.id,desc:l.desc||'发生事件',fromType:'location',toType:'event'}); });
  });

  items.forEach(it => {
    if (!idSet.has(it.id)) return;
    _normLinks(it.relatedCharacters).forEach(l => { if (idSet.has(l.id)) conns.push({from:it.id,to:l.id,desc:l.desc||'关联角色',fromType:'item',toType:'character'}); });
    _normLinks(it.relatedFactions).forEach(l => { if (idSet.has(l.id)) conns.push({from:it.id,to:l.id,desc:l.desc||'关联势力',fromType:'item',toType:'faction'}); });
    _normLinks(it.relatedLocations).forEach(l => { if (idSet.has(l.id)) conns.push({from:it.id,to:l.id,desc:l.desc||'关联地点',fromType:'item',toType:'location'}); });
    _normLinks(it.relatedEvents).forEach(l => { if (idSet.has(l.id)) conns.push({from:it.id,to:l.id,desc:l.desc||'关联事件',fromType:'item',toType:'event'}); });
  });

  events.forEach(ev => {
    if (!idSet.has(ev.id)) return;
    _normLinks(ev.characters).forEach(l => { if (idSet.has(l.id)) conns.push({from:ev.id,to:l.id,desc:l.desc||'参与角色',fromType:'event',toType:'character'}); });
    _normLinks(ev.factions).forEach(l => { if (idSet.has(l.id)) conns.push({from:ev.id,to:l.id,desc:l.desc||'关联势力',fromType:'event',toType:'faction'}); });
    _normLinks(ev.locations).forEach(l => { if (idSet.has(l.id)) conns.push({from:ev.id,to:l.id,desc:l.desc||'发生地点',fromType:'event',toType:'location'}); });
    _normLinks(ev.items).forEach(l => { if (idSet.has(l.id)) conns.push({from:ev.id,to:l.id,desc:l.desc||'关联物品',fromType:'event',toType:'item'}); });
  });

  (state.data.characterRelations||[]).forEach(r => {
    if (idSet.has(r.sourceId) && idSet.has(r.targetId)) {
      conns.push({from:r.sourceId,to:r.targetId,desc:r.type||r.description||'',fromType:'character',toType:'character',isExplicit:true});
    }
  });

  return conns;
}

function _buildEdgeMap(conns) {
  const edgeMap = {};
  conns.forEach(c => {
    const key = [c.from, c.to].sort().join('|||');
    if (!edgeMap[key]) edgeMap[key] = {a:c.from, b:c.to, aToB:null, bToA:null, aType:c.fromType, bType:c.toType};
    if (c.from === edgeMap[key].a) {
      edgeMap[key].aToB = c.desc;
      edgeMap[key].aType = c.fromType;
      edgeMap[key].bType = c.toType;
    } else {
      edgeMap[key].bToA = c.desc;
      edgeMap[key].bType = c.fromType;
      edgeMap[key].aType = c.toType;
    }
  });
  return Object.values(edgeMap);
}

function _getGraphViewport() {
  if (!state._graphViewport) state._graphViewport = { zoom: 1, panX: 0, panY: 0 };
  return state._graphViewport;
}

function _screenToWorld(sx, sy) {
  const vp = _getGraphViewport();
  return {
    x: (sx - vp.panX) / vp.zoom,
    y: (sy - vp.panY) / vp.zoom
  };
}

function renderRelations() {
  const entityTypes = _getGraphEntityTypes();
  const selectedSubjects = _getSelectedGraphSubjects();
  const allConns = _collectAllConnections(selectedSubjects.map(s=>s.split(':')[1]));
  const edges = _buildEdgeMap(allConns);
  const vp = _getGraphViewport();
  const zoomPct = Math.round(vp.zoom * 100);
  const selectedCount = selectedSubjects.length;
  const filterBtns = entityTypes.map(t => {
    const items = t.getData();
    if (items.length === 0) return '';
    const typeSelected = selectedSubjects.filter(s => s.startsWith(t.key + ':'));
    const count = typeSelected.length;
    const label = count > 0 ? `${t.icon} ${t.label}(${count})` : `${t.icon} ${t.label}`;
    const btnClass = count > 0 ? 'filter-btn active' : 'filter-btn';
    return `<div class="filter-pop-wrap" data-filter-key="graph_${t.key}" data-state-key="_graphFilterPop">
      <button class="${btnClass}" onclick="toggleFilterPop(this)">${esc(label)}</button>
      <div class="filter-pop hidden">
        <input class="filter-search" placeholder="搜索${t.label}..." oninput="filterPopSearch(this)" onclick="event.stopPropagation()">
        <div class="filter-pop-list">${items.map(d => {
          const sid = t.key + ':' + d.id;
          const checked = selectedSubjects.includes(sid);
          return `<label class="filter-pop-item${checked?' checked':''}"><input type="checkbox" value="${esc(sid)}" ${checked?'checked':''} onchange="toggleGraphSubjectFromFilter(this)"><span>${esc(d.name)}</span></label>`;
        }).join('')}</div>
      </div>
    </div>`;
  }).join('');
  return `<div class="relation-layout">
    <div class="relation-list-panel">
      <div class="flex-between mb-8"><h3>📋 关系列表</h3><div class="flex-gap"><button class="btn btn-sm btn-primary" onclick="addRelation()">+ 新建</button></div></div>
      ${renderSearchBox('relSearch')}
      <div id="relation-list" class="relations-list">${renderRelationList()}</div>
    </div>
    <div class="relation-detail-panel">
      <div class="card" style="padding-bottom:8px"><h3>🕸️ 关系图表</h3>
        <p class="text-sm text-muted mb-8">勾选主体，自动生成关系图（${edges.length} 条关联）· 滚轮缩放 · 右键/中键拖拽画布</p>
        <div class="filter-bar" style="margin-bottom:6px">
          ${filterBtns}
          <button class="btn btn-xs btn-outline" onclick="selectAllGraphSubjects()">全选</button>
          <button class="btn btn-xs btn-outline" onclick="clearAllGraphSubjects()">清空</button>
          ${selectedCount > 0 ? `<button class="filter-btn-clear" onclick="clearAllGraphSubjects()">✕ 清除(${selectedCount})</button>` : ''}
        </div>
        <div class="flex-gap mb-8" style="flex-wrap:wrap">
          <button class="btn btn-xs btn-outline" onclick="resetGraphLayout()">🔄 重置布局</button>
          <button class="btn btn-xs btn-primary" onclick="saveCurrentGraphToResources()">💾 保存到资源库存</button>
          <span style="display:inline-flex;align-items:center;gap:4px;margin-left:auto">
            <button class="btn btn-xs btn-outline" onclick="graphZoom(-0.15)">➖</button>
            <span style="font-size:11px;min-width:36px;text-align:center">${zoomPct}%</span>
            <button class="btn btn-xs btn-outline" onclick="graphZoom(0.15)">➕</button>
          </span>
        </div>
        <div class="relations-canvas-container" style="overflow:hidden;position:relative"><canvas id="relations-canvas" width="800" height="500"></canvas></div>
      </div>
      <div id="relation-detail"></div>
    </div></div>`;
}

function renderRelationList() {
  const rels = state.data.characterRelations||[];
  const chars = state.data.characters||[];
  if (rels.length===0) return '<div class="empty-state"><div class="icon">🕸️</div><p>暂无关系</p></div>';
  const filtered = rels.filter(r => {
    const q = (state.relSearch || '').toLowerCase().trim();
    if (!q) return true;
    const source = chars.find(c=>c.id===r.sourceId);
    const target = chars.find(c=>c.id===r.targetId);
    return (source?.name||'').toLowerCase().includes(q) || (target?.name||'').toLowerCase().includes(q) || (r.type||'').toLowerCase().includes(q);
  });
  if (filtered.length===0) return '<div class="empty-state"><div class="icon">🔍</div><p>无匹配关系</p></div>';
  return filtered.map((r,i) => {
    const source = chars.find(c=>c.id===r.sourceId);
    const target = chars.find(c=>c.id===r.targetId);
    const isSelected = state.selectedRelationId === r.id;
    return `<div class="relation-item${isSelected?' selected':''}" data-rel-id="${esc(r.id)}" onclick="selectRelation('${esc(r.id)}')">
      <div class="relation-connector"><span class="relation-char">${esc(source?.name||'未知')}</span>
        <span class="relation-arrow">——${esc(r.type||'关系')}——→</span><span class="relation-char">${esc(target?.name||'未知')}</span></div>
      ${r.description ? `<div class="relation-desc">${esc(r.description)}</div>` : ''}
      <div class="relation-actions">
        <input value="${esc(r.type||'')}" onchange="updateRelation(${i},'type',this.value)" onclick="event.stopPropagation()" placeholder="关系类型" style="padding:3px 6px;background:var(--white);border:1px solid var(--border);border-radius:var(--radius-xs);font-size:12px;font-family:var(--font-body);width:70px">
        <button class="btn btn-xs btn-danger" onclick="event.stopPropagation();deleteRelation(${i})">×</button></div></div>`;
  }).join('');
}

function selectRelation(id) {
  state.selectedRelationId = id;
  const list = $('#relation-list');
  if (list) list.innerHTML = renderRelationList();
  const detail = $('#relation-detail');
  if (detail) detail.innerHTML = renderRelationDetail();
}

function renderRelationDetail() {
  const rels = state.data.characterRelations||[];
  const chars = state.data.characters||[];
  const r = rels.find(rel => rel.id === state.selectedRelationId);
  if (!r) return '<div class="empty-state"><div class="icon">👆</div><p>选择左侧关系查看详情</p></div>';
  const source = chars.find(c=>c.id===r.sourceId);
  const target = chars.find(c=>c.id===r.targetId);
  return `<div class="card detail-scroll-area">
    <div style="display:flex;align-items:center;gap:12px;font-size:16px;font-weight:500;margin-bottom:12px">
      <span style="cursor:pointer;color:var(--accent)" onclick="showPreviewCard('character','${esc(r.sourceId)}',event)">${esc(source?.name||'未知')}</span>
      <span style="color:var(--warm-gray)">——${esc(r.type||'关系')}——→</span>
      <span style="cursor:pointer;color:var(--accent)" onclick="showPreviewCard('character','${esc(r.targetId)}',event)">${esc(target?.name||'未知')}</span>
    </div>
    ${r.description ? `<div class="wiki-section"><div class="wiki-section-title">描述</div><p style="font-size:14px;line-height:1.6">${esc(r.description)}</p></div>` : ''}
    <div class="wiki-section"><div class="wiki-section-title">编辑</div>
      <div class="form-group"><label>关系类型</label><input value="${esc(r.type||'')}" onchange="updateRelationById('${esc(r.id)}','type',this.value)" style="width:100%;padding:8px 12px;background:var(--white);border:1px solid var(--border);border-radius:var(--radius-sm);font-size:14px;font-family:var(--font-body)"></div>
      <div class="form-group"><label>描述</label><textarea onchange="updateRelationById('${esc(r.id)}','description',this.value)" rows="3" style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);font-size:14px;font-family:var(--font-body);resize:vertical">${esc(r.description||'')}</textarea></div>
    </div>
  </div>
  <div class="detail-sticky-bar">
    <div></div>
    <button class="btn btn-sm btn-danger" onclick="deleteRelationById('${esc(r.id)}')">🗑️ 删除此关系</button>
  </div>`;
}

function updateRelationById(id, key, value) {
  const rels = state.data.characterRelations||[];
  const r = rels.find(rel => rel.id === id);
  if (r) { r[key] = value; autoSave(); }
}

function toggleGraphSubject(sid, checked) {
  if (!state._graphSubjects) state._graphSubjects = [];
  if (checked) {
    if (!state._graphSubjects.includes(sid)) state._graphSubjects.push(sid);
  } else {
    state._graphSubjects = state._graphSubjects.filter(s => s !== sid);
  }
  delete state._graphPositions;
  renderTabContent();
}

function toggleGraphSubjectFromFilter(checkbox) {
  const sid = checkbox.value;
  const checked = checkbox.checked;
  if (!state._graphSubjects) state._graphSubjects = [];
  if (checked) {
    if (!state._graphSubjects.includes(sid)) state._graphSubjects.push(sid);
  } else {
    state._graphSubjects = state._graphSubjects.filter(s => s !== sid);
  }
  const label = checkbox.closest('label');
  if (label) label.classList.toggle('checked', checked);
  delete state._graphPositions;
  const activePop = document.getElementById('filter-pop-active');
  if (activePop) {
    const key = activePop.dataset.key;
    const typeKey = key.replace('graph_', '');
    const entityTypes = _getGraphEntityTypes();
    const typeInfo = entityTypes.find(t => t.key === typeKey);
    const selectedSubjects = _getSelectedGraphSubjects();
    const typeSelected = selectedSubjects.filter(s => s.startsWith(typeKey + ':'));
    const count = typeSelected.length;
    const btn = document.querySelector(`.filter-pop-wrap[data-filter-key="${key}"] > button`);
    if (btn && typeInfo) {
      btn.textContent = count > 0 ? `${typeInfo.icon} ${typeInfo.label}(${count})` : `${typeInfo.icon} ${typeInfo.label}`;
      btn.className = count > 0 ? 'filter-btn active' : 'filter-btn';
    }
  }
  const selectedSubjects = _getSelectedGraphSubjects();
  const clearBtn = document.querySelector('.filter-bar .filter-btn-clear');
  if (clearBtn) {
    if (selectedSubjects.length > 0) {
      clearBtn.textContent = `✕ 清除(${selectedSubjects.length})`;
      clearBtn.style.display = '';
    } else {
      clearBtn.style.display = 'none';
    }
  }
  drawRelationsGraph();
}

function selectAllGraphSubjects() {
  const all = _getAllGraphEntities();
  state._graphSubjects = all.map(e => e.typeKey + ':' + e.id);
  delete state._graphPositions;
  renderTabContent();
}

function clearAllGraphSubjects() {
  state._graphSubjects = [];
  delete state._graphPositions;
  state._graphSelectedNode = null;
  state._graphRelatedNodes = null;
  state._graphHoveredNode = null;
  renderTabContent();
}

function resetGraphLayout() {
  delete state._graphPositions;
  state._graphViewport = { zoom: 1, panX: 0, panY: 0 };
  drawRelationsGraph();
}

function graphZoom(delta, centerX, centerY) {
  const vp = _getGraphViewport();
  const oldZoom = vp.zoom;
  vp.zoom = Math.max(0.15, Math.min(4, vp.zoom + delta));
  if (centerX !== undefined && centerY !== undefined) {
    vp.panX = centerX - (centerX - vp.panX) * (vp.zoom / oldZoom);
    vp.panY = centerY - (centerY - vp.panY) * (vp.zoom / oldZoom);
  }
  drawRelationsGraph();
  const zoomLabel = document.querySelector('.flex-gap.mb-8 span[style*="min-width"]');
  if (zoomLabel) zoomLabel.textContent = Math.round(vp.zoom * 100) + '%';
}

async function saveCurrentGraphToResources() {
  const subjects = _getSelectedGraphSubjects();
  if (subjects.length === 0) { showToast('请先勾选主体'); return; }
  const entities = subjects.map(sid => {
    const [typeKey, id] = sid.split(':');
    return _getEntityById(id) || {name:'未知'};
  });
  const names = entities.map(e=>e.name).join('、');
  const title = await customPrompt('关系图标题', names + ' 关系图');
  if (!title) return;
  const note = await customPrompt('备注（可选）', '');
  const canvas = $('#relations-canvas');
  const imageData = canvas ? canvas.toDataURL('image/png') : '';
  saveRelationGraphAsResource(subjects, title, note || '', imageData);
}

function setupRelations() {
  registerSearchTarget('relSearch','relation-list',renderRelationList);
  try { drawRelationsGraph(); _setupCanvasInteraction(); _playGraphEntrance(); } catch(e) { console.error('drawRelationsGraph error:', e); }
}

function _playGraphEntrance() {
  const canvas = $('#relations-canvas');
  if (!canvas) return;
  const positions = _getGraphPositions();
  const ids = Object.keys(positions);
  if (ids.length === 0) return;
  const savedPositions = {};
  ids.forEach(id => { savedPositions[id] = { x: positions[id].x, y: positions[id].y }; });
  const cx = canvas.width / 2, cy = canvas.height / 2;
  ids.forEach(id => { positions[id].x = cx; positions[id].y = cy; });
  let progress = 0;
  const step = () => {
    progress += 0.04;
    if (progress >= 1) {
      ids.forEach(id => { positions[id].x = savedPositions[id].x; positions[id].y = savedPositions[id].y; });
      drawRelationsGraph();
      return;
    }
    const ease = 1 - Math.pow(1 - progress, 3);
    ids.forEach(id => {
      positions[id].x = cx + (savedPositions[id].x - cx) * ease;
      positions[id].y = cy + (savedPositions[id].y - cy) * ease;
    });
    drawRelationsGraph();
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function _getGraphPositions() {
  if (!state._graphPositions) state._graphPositions = {};
  return state._graphPositions;
}

function _setupCanvasInteraction() {
  const canvas = $('#relations-canvas');
  if (!canvas) return;
  let draggingNode = null;
  let dragOffsetX = 0, dragOffsetY = 0;
  let dragPending = null;
  let dragStartSX = 0, dragStartSY = 0;
  let panning = false;
  let panStartX = 0, panStartY = 0;
  let panStartPanX = 0, panStartPanY = 0;

  canvas.onmousedown = (e) => {
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const world = _screenToWorld(sx, sy);
    const positions = _getGraphPositions();
    if (e.button === 0) {
      for (const id in positions) {
        const p = positions[id];
        const dx = world.x - p.x, dy = world.y - p.y;
        if (dx*dx + dy*dy <= 784) {
          dragPending = id;
          dragOffsetX = world.x - p.x;
          dragOffsetY = world.y - p.y;
          dragStartSX = e.clientX;
          dragStartSY = e.clientY;
          e.preventDefault();
          return;
        }
      }
      if (state._graphSelectedNode) {
        state._graphSelectedNode = null;
        state._graphRelatedNodes = null;
        drawRelationsGraph();
      }
      panning = true;
      panStartX = e.clientX;
      panStartY = e.clientY;
      const vp = _getGraphViewport();
      panStartPanX = vp.panX;
      panStartPanY = vp.panY;
      canvas.style.cursor = 'move';
      e.preventDefault();
    } else if (e.button === 1 || e.button === 2) {
      panning = true;
      panStartX = e.clientX;
      panStartY = e.clientY;
      const vp = _getGraphViewport();
      panStartPanX = vp.panX;
      panStartPanY = vp.panY;
      canvas.style.cursor = 'move';
      e.preventDefault();
    }
  };

  canvas.onmousemove = (e) => {
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const world = _screenToWorld(sx, sy);
    const positions = _getGraphPositions();

    if (dragPending && !draggingNode) {
      const dist = Math.sqrt((e.clientX - dragStartSX) ** 2 + (e.clientY - dragStartSY) ** 2);
      if (dist > 3) {
        draggingNode = dragPending;
        dragPending = null;
        canvas.style.cursor = 'grabbing';
      }
    }

    if (draggingNode) {
      if (positions[draggingNode]) {
        positions[draggingNode].x = world.x - dragOffsetX;
        positions[draggingNode].y = world.y - dragOffsetY;
        drawRelationsGraph();
      }
      return;
    }

    if (panning) {
      const vp = _getGraphViewport();
      vp.panX = panStartPanX + (e.clientX - panStartX);
      vp.panY = panStartPanY + (e.clientY - panStartY);
      drawRelationsGraph();
      return;
    }

    let hoveredId = null;
    for (const id in positions) {
      const p = positions[id];
      const dx = world.x - p.x, dy = world.y - p.y;
      if (dx*dx + dy*dy <= 784) { hoveredId = id; break; }
    }
    if (hoveredId !== state._graphHoveredNode) {
      state._graphHoveredNode = hoveredId;
      drawRelationsGraph();
    }
    canvas.style.cursor = hoveredId ? 'pointer' : 'default';
  };

  canvas.onmouseup = (e) => {
    if (dragPending && !draggingNode) {
      const id = dragPending;
      dragPending = null;
      if (state._graphSelectedNode === id) {
        state._graphSelectedNode = null;
        state._graphRelatedNodes = null;
      } else {
        state._graphSelectedNode = id;
        const related = new Set();
        related.add(id);
        const selectedSubjects = _getSelectedGraphSubjects();
        const allEntities = _getAllGraphEntities();
        const entities = selectedSubjects.map(sid => { const [tk,id2] = sid.split(':'); return allEntities.find(en=>en.id===id2 && en.typeKey===tk); }).filter(Boolean);
        const idList = entities.map(en=>en.id);
        const allConns = _collectAllConnections(idList);
        allConns.forEach(c => {
          if (c.from === id) related.add(c.to);
          if (c.to === id) related.add(c.from);
        });
        state._graphRelatedNodes = related;
      }
      drawRelationsGraph();
    }
    if (draggingNode) { draggingNode = null; canvas.style.cursor = 'default'; }
    dragPending = null;
    if (panning) { panning = false; canvas.style.cursor = 'default'; }
  };

  canvas.onmouseleave = () => {
    if (draggingNode) { draggingNode = null; }
    if (panning) { panning = false; }
    if (state._graphHoveredNode) { state._graphHoveredNode = null; drawRelationsGraph(); }
    canvas.style.cursor = 'default';
  };

  canvas.onwheel = (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const delta = e.deltaY > 0 ? -0.08 : 0.08;
    graphZoom(delta, mouseX, mouseY);
  };

  canvas.oncontextmenu = (e) => e.preventDefault();
}

function _drawArrow(ctx, fromX, fromY, toX, toY, color, label, offset) {
  const dx = toX - fromX, dy = toY - fromY;
  const len = Math.sqrt(dx*dx + dy*dy);
  if (len < 1) return;
  const nx = dx/len, ny = dy/len;
  const px = -ny, py = nx;
  const off = offset || 0;
  const sx = fromX + nx*28 + px*off, sy = fromY + ny*28 + py*off;
  const ex = toX - nx*28 + px*off, ey = toY - ny*28 + py*off;
  const mx = (sx+ex)/2 + px*off*0.5, my = (sy+ey)/2 + py*off*0.5;
  const ctrlX = mx + px*len*0.12, ctrlY = my + py*len*0.12;
  ctx.beginPath(); ctx.moveTo(sx, sy); ctx.quadraticCurveTo(ctrlX, ctrlY, ex, ey);
  ctx.strokeStyle = color; ctx.lineWidth = 1.8; ctx.globalAlpha = 0.45; ctx.stroke(); ctx.globalAlpha = 1;
  const headLen = 7;
  const t = 0.95;
  const tangentX = 2*(1-t)*(ctrlX-sx) + 2*t*(ex-ctrlX);
  const tangentY = 2*(1-t)*(ctrlY-sy) + 2*t*(ey-ctrlY);
  const angle = Math.atan2(tangentY, tangentX);
  const tipX = sx*(1-t)*(1-t) + 2*ctrlX*t*(1-t) + ex*t*t;
  const tipY = sy*(1-t)*(1-t) + 2*ctrlY*t*(1-t) + ey*t*t;
  ctx.beginPath();
  ctx.moveTo(tipX, tipY);
  ctx.lineTo(tipX - headLen*Math.cos(angle-Math.PI/6), tipY - headLen*Math.sin(angle-Math.PI/6));
  ctx.moveTo(tipX, tipY);
  ctx.lineTo(tipX - headLen*Math.cos(angle+Math.PI/6), tipY - headLen*Math.sin(angle+Math.PI/6));
  ctx.strokeStyle = color; ctx.lineWidth = 1.8; ctx.globalAlpha = 0.55; ctx.stroke(); ctx.globalAlpha = 1;
  if (label && state._graphSelectedNode) {
    const labelX = sx*0.25 + ctrlX*0.5 + ex*0.25 + px*8;
    const labelY = sy*0.25 + ctrlY*0.5 + ey*0.25 + py*8;
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = '#57534e'; ctx.font = '9px "Microsoft YaHei",sans-serif'; ctx.textAlign = 'center';
    const displayLabel = label.length > 6 ? label.slice(0,6)+'…' : label;
    ctx.fillText(displayLabel, labelX, labelY);
    ctx.globalAlpha = 1;
  }
}

function _drawLine(ctx, fromX, fromY, toX, toY, color, label) {
  const dx = toX - fromX, dy = toY - fromY;
  const len = Math.sqrt(dx*dx + dy*dy);
  if (len < 1) return;
  const nx = dx/len, ny = dy/len;
  const px = -ny, py = nx;
  const sx = fromX + nx*28, sy = fromY + ny*28;
  const ex = toX - nx*28, ey = toY - ny*28;
  const mx = (sx+ex)/2, my = (sy+ey)/2;
  const ctrlX = mx + px*len*0.08, ctrlY = my + py*len*0.08;
  ctx.beginPath(); ctx.moveTo(sx, sy); ctx.quadraticCurveTo(ctrlX, ctrlY, ex, ey);
  ctx.strokeStyle = color; ctx.lineWidth = 1.8; ctx.globalAlpha = 0.4; ctx.stroke(); ctx.globalAlpha = 1;
  if (label && state._graphSelectedNode) {
    const labelX = sx*0.25 + ctrlX*0.5 + ex*0.25 + px*8;
    const labelY = sy*0.25 + ctrlY*0.5 + ey*0.25 + py*8 - 4;
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = '#57534e'; ctx.font = '10px "Microsoft YaHei",sans-serif'; ctx.textAlign = 'center';
    const displayLabel = label.length > 8 ? label.slice(0,8)+'…' : label;
    ctx.fillText(displayLabel, labelX, labelY);
    ctx.globalAlpha = 1;
  }
}

const _graphAvatarCache = {};

function _loadAvatarForGraph(typeKey, id) {
  const avatar = _getEntityAvatar(typeKey, id);
  if (!avatar) return Promise.resolve(null);
  const cacheKey = typeKey + ':' + id;
  if (_graphAvatarCache[cacheKey]) return Promise.resolve(_graphAvatarCache[cacheKey]);
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => { _graphAvatarCache[cacheKey] = img; resolve(img); };
    img.onerror = () => resolve(null);
    img.src = avatar;
  });
}

async function drawRelationsGraph() {
  const canvas = $('#relations-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  const vp = _getGraphViewport();

  ctx.clearRect(0,0,w,h);
  ctx.fillStyle = '#f7f8fa'; ctx.fillRect(0,0,w,h);

  ctx.save();
  ctx.translate(vp.panX, vp.panY);
  ctx.scale(vp.zoom, vp.zoom);

  const selectedSubjects = _getSelectedGraphSubjects();
  const allEntities = _getAllGraphEntities();
  const entities = selectedSubjects.map(sid => { const [tk,id] = sid.split(':'); return allEntities.find(e=>e.id===id && e.typeKey===tk); }).filter(Boolean);
  if (entities.length === 0) {
    ctx.restore();
    ctx.fillStyle='#777169'; ctx.font='14px "Microsoft YaHei",sans-serif'; ctx.textAlign='center'; ctx.fillText('请勾选主体或添加词条',w/2,h/2);
    return;
  }
  const idList = entities.map(e=>e.id);
  const allConns = _collectAllConnections(idList);
  const edges = _buildEdgeMap(allConns);
  const positions = _getGraphPositions();
  const cx=w/2, cy=h/2, radius=Math.min(w,h)/2-50;
  const typeColors = {character:'#7c9cb5',faction:'#c48b7f',location:'#7fb89a',item:'#c4a96b',event:'#a08bc4'};
  const edgeColors = {
    'character|faction':'#c48b7f', 'character|location':'#7fb89a', 'character|item':'#c4a96b',
    'character|event':'#a08bc4', 'faction|location':'#b49cd0', 'faction|faction':'#d4918a',
    'character|character':'#7c9cb5', 'location|event':'#7bb5c4', 'item|location':'#8db87a',
    'faction|event':'#c9a07a', 'item|event':'#c4b67a'
  };
  const currentIds = new Set(entities.map(e=>e.id));
  Object.keys(positions).forEach(id => { if (!currentIds.has(id)) delete positions[id]; });
  entities.forEach((e,i) => {
    if (!positions[e.id]) {
      const angle = (Math.PI*2/entities.length)*i - Math.PI/2;
      positions[e.id] = { x:cx+radius*Math.cos(angle), y:cy+radius*Math.sin(angle) };
    }
  });
  edges.forEach(edge => {
    const posA = positions[edge.a], posB = positions[edge.b];
    if (!posA || !posB) return;
    const typeKey = [edge.aType, edge.bType].sort().join('|');
    const color = edgeColors[typeKey] || '#c4b89a';
    const hasA2B = edge.aToB && edge.aToB.trim();
    const hasB2A = edge.bToA && edge.bToA.trim();
    const edgeDimmed = state._graphHoveredNode && (!state._graphRelatedNodes || !state._graphRelatedNodes.has(edge.a) || !state._graphRelatedNodes.has(edge.b));
    if (edgeDimmed) ctx.globalAlpha = 0.12;
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
    if (edgeDimmed) ctx.globalAlpha = 1;
  });
  const avatarPromises = entities.map(e => _loadAvatarForGraph(e.typeKey, e.id));
  const avatarImages = await Promise.all(avatarPromises);
  entities.forEach((e, idx) => {
    const pos = positions[e.id]; if (!pos) return;
    const color = typeColors[e.typeKey] || '#888888';
    const avatarImg = avatarImages[idx];
    const isHovered = state._graphHoveredNode === e.id;
    const isSelected = state._graphSelectedNode === e.id;
    const isRelated = state._graphSelectedNode && state._graphRelatedNodes && state._graphRelatedNodes.has(e.id);
    const dimmed = state._graphSelectedNode && !isSelected && !isRelated;
    const nodeAlpha = dimmed ? 0.25 : 1;
    ctx.save();
    ctx.globalAlpha = nodeAlpha;
    const cardW = 56, cardH = 56, cardR = 14;
    const cardX = pos.x - cardW/2, cardY = pos.y - cardH/2;
    ctx.shadowColor = 'rgba(0,0,0,0.06)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 2;
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, cardR);
    ctx.fillStyle = '#ffffff'; ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = isSelected ? '#b4a0d4' : (isHovered ? '#c4bdd4' : '#e2e5ea');
    ctx.lineWidth = isSelected ? 2 : (isHovered ? 1.5 : 1);
    ctx.stroke();
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, cardR);
    ctx.clip();
    if (avatarImg) {
      const size = 40;
      const aspect = avatarImg.naturalWidth / avatarImg.naturalHeight;
      let dw, dh, dx, dy;
      if (aspect > 1) { dh = size; dw = size * aspect; dx = pos.x - dw/2; dy = pos.y - dh/2; }
      else { dw = size; dh = size / aspect; dx = pos.x - dw/2; dy = pos.y - dh/2; }
      ctx.drawImage(avatarImg, dx, dy, dw, dh);
    } else {
      ctx.fillStyle = color; ctx.font = 'bold 14px "Microsoft YaHei",sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(e.icon||'●', pos.x, pos.y);
    }
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = nodeAlpha;
    ctx.fillStyle = '#3d3929'; ctx.font = '11px "Microsoft YaHei",sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText(e.name, pos.x, pos.y + cardH/2 + 4);
    ctx.restore();
  });
  ctx.restore();

  const legend = _getGraphEntityTypes().filter(t => entities.some(e=>e.typeKey===t.key));
  if (legend.length > 1) {
    const legendH = legend.length * 18 + 8;
    ctx.fillStyle = 'rgba(247,248,250,0.9)';
    ctx.fillRect(4, 4, 90, legendH);
    ctx.strokeStyle = 'rgba(0,0,0,0.06)';
    ctx.lineWidth = 1;
    ctx.strokeRect(4, 4, 90, legendH);
    legend.forEach((t,i) => {
      const lx = 12, ly = 16 + i*18;
      ctx.fillStyle = typeColors[t.key] || '#000000';
      ctx.fillRect(lx, ly-8, 10, 10);
      ctx.fillStyle = '#777169'; ctx.font = '11px "Microsoft YaHei",sans-serif'; ctx.textAlign = 'left';
      ctx.fillText(t.icon+' '+t.label, lx+14, ly);
    });
  }
}

async function addRelation() {
  const chars = state.data.characters||[];
  if (chars.length < 2) { showToast('请先添加至少两个角色！'); return; }
  const modal = $('#modal-box');
  const overlay = $('#modal-overlay');
  modal.innerHTML = `
    <h3>添加关系</h3>
    <div class="form-group"><label>源角色</label><select id="rel-source" style="width:100%;padding:8px 12px;background:var(--white);border:1px solid var(--border);border-radius:var(--radius-sm);font-size:14px;font-family:var(--font-body)">${chars.map((c,i)=>`<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select></div>
    <div class="form-group"><label>目标角色</label><select id="rel-target" style="width:100%;padding:8px 12px;background:var(--white);border:1px solid var(--border);border-radius:var(--radius-sm);font-size:14px;font-family:var(--font-body)">${chars.map((c,i)=>`<option value="${c.id}"${i===1?' selected':''}>${esc(c.name)}</option>`).join('')}</select></div>
    <div class="form-group"><label>关系类型</label><input id="rel-type" placeholder="如：师徒、恋人、宿敌..." style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);font-size:14px;font-family:var(--font-body)"></div>
    <div class="form-group"><label>描述（可选）</label><textarea id="rel-desc" rows="2" style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);font-size:14px;font-family:var(--font-body);resize:vertical" placeholder="补充说明"></textarea></div>
    <div class="modal-actions">
      <button class="btn btn-outline" id="rel-cancel">取消</button>
      <button class="btn btn-primary" id="rel-ok">确定</button>
    </div>`;
  overlay.classList.remove('hidden');
  return new Promise((resolve) => {
    const finish = (val) => { closeModal(); resolve(val); };
    $('#rel-ok').onclick = () => {
      const sourceId = $('#rel-source').value;
      const targetId = $('#rel-target').value;
      const type = $('#rel-type').value;
      const desc = $('#rel-desc').value;
      if (!type || !type.trim()) { showToast('请填写关系类型'); return; }
      if (sourceId === targetId) { showToast('源角色和目标角色不能相同'); return; }
      state.data.characterRelations.push({ id: uid(), sourceId, targetId, type: type.trim(), description: desc||'' });
      autoSave(); renderTabContent();
      finish(true);
    };
    $('#rel-cancel').onclick = () => finish(false);
    overlay.onclick = (e) => { if (e.target === overlay) finish(false); };
  });
}

async function aiGenRelations() {
  const el = $('#ai-relations-result');
  const text = await runAI(window.api.aiGenerateRelations(state.data), el);
  if (text) { const json = tryParseJSON(text); if (json && Array.isArray(json)) { json.forEach(r => { r.id = r.id || uid(); state.data.characterRelations.push(r); }); autoSave(); renderTabContent(); } }
}

function updateRelation(i, key, value) { if (state.data.characterRelations[i]) { state.data.characterRelations[i][key] = value; autoSave(); } }
async function deleteRelation(i) { if (!await customConfirm('删除此关系？')) return; state.data.characterRelations.splice(i, 1); autoSave(); if (state.editingCharacter) { const c=(state.data.characters||[]).find(ch=>ch.id===state.selectedCharacterId); if(c){const d=$('#char-detail');if(d)d.innerHTML=renderCharEditForm(c);} } else { renderTabContent(); } }
async function deleteRelationById(id) { if (!await customConfirm('删除此关系？')) return; const idx = (state.data.characterRelations||[]).findIndex(r=>r.id===id); if (idx>=0) { state.data.characterRelations.splice(idx,1); autoSave(); state.selectedRelationId=null; renderTabContent(); } }