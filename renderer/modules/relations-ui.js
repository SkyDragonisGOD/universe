// ============================================================
// 世界生成器 — 关系图表 · UI层
// 依赖: relations-data.js, relations-graph.js, core/state.js, core/utils.js, core/modal.js
// ============================================================

const TYPE_ICONS = { character:'👤', faction:'🏰', location:'📍', item:'📦', event:'⚡' };
const TYPE_LABELS = { character:'角色', faction:'势力', location:'地点', item:'物品', event:'事件' };

function _getDedupedConnections(conns) {
  const seen = new Set();
  return conns.filter(c => {
    const key = `${c.from}|${c.to}|${c.desc}|${c.fromType}|${c.toType}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function _getAllListConnections() {
  const selectedSubjects = _getSelectedGraphSubjects();
  const selectedIds = selectedSubjects.map(s => s.split(':')[1]);
  const conns = _collectAllConnections(selectedIds);
  let result = _getDedupedConnections(conns);
  if (state._graphSelectedNode) {
    result = result.filter(c => c.from === state._graphSelectedNode || c.to === state._graphSelectedNode);
  }
  return result;
}

function _syncRelationList() {
  const list = $('#relation-list');
  if (list) list.innerHTML = renderRelationList();
}

function _connKey(c) {
  return `${c.from}|${c.to}|${c.desc}|${c.fromType}|${c.toType}`;
}

function renderRelations() {
  const entityTypes = _getGraphEntityTypes();
  const selectedSubjects = _getSelectedGraphSubjects();
  const allConns = _getAllListConnections();
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
  const focusedNode = state._graphSelectedNode;
  const focusedName = focusedNode ? (_getAllGraphEntities().find(e => e.id === focusedNode)?.name || '') : '';
  const listTitle = focusedNode ? `📋 ${esc(focusedName)} 的关系 (${allConns.length})` : `📋 关系列表 (${allConns.length})`;
  return `<div class="relation-layout">
    <div class="relation-list-panel">
      <div class="flex-between mb-8"><h3>${listTitle}</h3><div class="flex-gap">${focusedNode ? `<button class="btn btn-xs btn-outline" onclick="clearGraphNodeSelection()">✕ 取消聚焦</button>` : ''}<button class="btn btn-sm btn-primary" onclick="addRelation()">+ 新建</button></div></div>
      ${renderSearchBox('relSearch')}
      <div id="relation-list" class="relations-list">${renderRelationList()}</div>
    </div>
    <div class="relation-detail-panel">
      <div class="relation-graph-header"><h3>🕸️ 关系图表</h3>
        <p class="text-sm text-muted mb-8">勾选主体，自动生成关系图（${edges.length} 条边）· 滚轮缩放 · 右键/中键拖拽画布</p>
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
      </div>
      <div class="relations-canvas-container" style="overflow:hidden;position:relative"><canvas id="relations-canvas" width="800" height="500"></canvas></div>
    </div></div>`;
}

function renderRelationList() {
  const conns = _getAllListConnections();
  const allEntities = _getAllGraphEntities();
  if (conns.length === 0) return '<div class="empty-state"><div class="icon">🕸️</div><p>暂无关联</p></div>';
  const q = (state.relSearch || '').toLowerCase().trim();
  let filtered = conns;
  if (q) {
    filtered = conns.filter(c => {
      const fromE = allEntities.find(e => e.id === c.from);
      const toE = allEntities.find(e => e.id === c.to);
      return (fromE?.name||'').toLowerCase().includes(q) || (toE?.name||'').toLowerCase().includes(q) || (c.desc||'').toLowerCase().includes(q) || (TYPE_LABELS[c.fromType]||'').toLowerCase().includes(q) || (TYPE_LABELS[c.toType]||'').toLowerCase().includes(q);
    });
  }
  if (filtered.length === 0) return '<div class="empty-state"><div class="icon">🔍</div><p>无匹配关联</p></div>';
  filtered.sort((a, b) => {
    const tc = (a.fromType+a.toType).localeCompare(b.fromType+b.toType);
    if (tc !== 0) return tc;
    const fa = allEntities.find(e => e.id === a.from);
    const fb = allEntities.find(e => e.id === b.from);
    return (fa?.name||'').localeCompare(fb?.name||'');
  });
  return filtered.map(c => {
    const fromE = allEntities.find(e => e.id === c.from);
    const toE = allEntities.find(e => e.id === c.to);
    const fromIcon = TYPE_ICONS[c.fromType] || '●';
    const toIcon = TYPE_ICONS[c.toType] || '●';
    const key = _connKey(c);
    const isSelected = state._selectedConnKey === key;
    return `<div class="relation-item${isSelected?' selected':''}" onclick="selectConnection('${esc(key)}')">
      <div class="relation-connector"><span class="relation-entity">${fromIcon} ${esc(fromE?.name||'未知')}</span>
        <span class="relation-arrow">——${esc(c.desc||'关联')}——→</span><span class="relation-entity">${toIcon} ${esc(toE?.name||'未知')}</span></div>
      <div class="relation-type-badge">${esc(TYPE_LABELS[c.fromType]||c.fromType)} → ${esc(TYPE_LABELS[c.toType]||c.toType)}${c.isExplicit?' · 可编辑':''}</div>
    </div>`;
  }).join('');
}

function selectConnection(key) {
  state._selectedConnKey = key;
  const list = $('#relation-list');
  if (list) list.innerHTML = renderRelationList();
}

function _findConnectionByKey(key) {
  const conns = _getAllListConnections();
  return conns.find(c => _connKey(c) === key) || null;
}

function renderRelationDetail() {
  const key = state._selectedConnKey;
  if (!key) return '<div class="empty-state"><div class="icon">👆</div><p>选择左侧关联查看详情</p></div>';
  const c = _findConnectionByKey(key);
  if (!c) return '<div class="empty-state"><div class="icon">👆</div><p>选择左侧关联查看详情</p></div>';
  const allEntities = _getAllGraphEntities();
  const fromE = allEntities.find(e => e.id === c.from);
  const toE = allEntities.find(e => e.id === c.to);
  const fromIcon = TYPE_ICONS[c.fromType] || '●';
  const toIcon = TYPE_ICONS[c.toType] || '●';

  let editSection = '';
  if (c.isExplicit) {
    const relId = c.relationId;
    if (c.isCharRelation) {
      const r = (state.data.characterRelations||[]).find(x => x.id === relId);
      if (r) {
        editSection = `<div class="wiki-section"><div class="wiki-section-title">编辑关系</div>
          <div class="form-group"><label>关系类型</label><input value="${esc(r.type||'')}" onchange="updateCharRelation('${esc(relId)}','type',this.value)" style="width:100%;padding:8px 12px;background:var(--white);border:1px solid var(--border);border-radius:var(--radius-sm);font-size:14px;font-family:var(--font-body)"></div>
          <div class="form-group"><label>描述</label><textarea onchange="updateCharRelation('${esc(relId)}','description',this.value)" rows="3" style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);font-size:14px;font-family:var(--font-body);resize:vertical">${esc(r.description||'')}</textarea></div>
        </div>`;
      }
    } else if (c.isEntityRelation) {
      const r = (state.data.entityRelations||[]).find(x => x.id === relId);
      if (r) {
        editSection = `<div class="wiki-section"><div class="wiki-section-title">编辑关系</div>
          <div class="form-group"><label>关系类型</label><input value="${esc(r.type||'')}" onchange="updateEntityRelation('${esc(relId)}','type',this.value)" style="width:100%;padding:8px 12px;background:var(--white);border:1px solid var(--border);border-radius:var(--radius-sm);font-size:14px;font-family:var(--font-body)"></div>
          <div class="form-group"><label>描述</label><textarea onchange="updateEntityRelation('${esc(relId)}','description',this.value)" rows="3" style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);font-size:14px;font-family:var(--font-body);resize:vertical">${esc(r.description||'')}</textarea></div>
        </div>`;
      }
    }
  }

  const derivedNote = !c.isExplicit ? `<div class="wiki-section"><p style="font-size:13px;color:var(--warm-gray)">此关联源自实体数据字段，编辑对应实体可修改</p></div>` : '';

  return `<div class="card detail-scroll-area">
    <div style="display:flex;align-items:center;gap:10px;font-size:15px;font-weight:500;margin-bottom:12px;flex-wrap:wrap">
      <span style="cursor:pointer;color:var(--accent)" onclick="showPreviewCard('${esc(c.fromType)}','${esc(c.from)}',event)">${fromIcon} ${esc(fromE?.name||'未知')}</span>
      <span style="color:var(--warm-gray)">——${esc(c.desc||'关联')}——→</span>
      <span style="cursor:pointer;color:var(--accent)" onclick="showPreviewCard('${esc(c.toType)}','${esc(c.to)}',event)">${toIcon} ${esc(toE?.name||'未知')}</span>
    </div>
    <div class="wiki-field"><span class="wiki-label">类型</span><span class="wiki-value">${esc(TYPE_LABELS[c.fromType]||c.fromType)} → ${esc(TYPE_LABELS[c.toType]||c.toType)}</span></div>
    ${editSection}${derivedNote}
  </div>
  ${c.isExplicit ? `<div class="detail-sticky-bar"><div></div><button class="btn btn-sm btn-danger" onclick="deleteSelectedRelation()">🗑️ 删除此关系</button></div>` : ''}`;
}

function updateCharRelation(id, key, value) {
  const r = (state.data.characterRelations||[]).find(x => x.id === id);
  if (r) { r[key] = value; autoSave(); }
}

function updateEntityRelation(id, key, value) {
  const r = (state.data.entityRelations||[]).find(x => x.id === id);
  if (r) { r[key] = value; autoSave(); }
}

async function deleteSelectedRelation() {
  if (!await customConfirm('删除此关系？')) return;
  const key = state._selectedConnKey;
  if (!key) return;
  const c = _findConnectionByKey(key);
  if (!c || !c.isExplicit) return;
  if (c.isCharRelation) {
    const idx = (state.data.characterRelations||[]).findIndex(r => r.id === c.relationId);
    if (idx >= 0) state.data.characterRelations.splice(idx, 1);
  } else if (c.isEntityRelation) {
    const idx = (state.data.entityRelations||[]).findIndex(r => r.id === c.relationId);
    if (idx >= 0) state.data.entityRelations.splice(idx, 1);
  }
  state._selectedConnKey = null;
  autoSave();
  renderTabContent();
}

// ---- 主体筛选控制 ----
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
  _syncRelationList();
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

function clearGraphNodeSelection() {
  state._graphSelectedNode = null;
  state._graphRelatedNodes = null;
  drawRelationsGraph();
  _syncRelationList();
}

// ---- 入口 ----
function setupRelations() {
  registerSearchTarget('relSearch','relation-list',renderRelationList);
  try { drawRelationsGraph(); _setupCanvasInteraction(); _playGraphEntrance(); } catch(e) { console.error('drawRelationsGraph error:', e); }
  const canvas = $('#relations-canvas');
  const container = canvas?.parentElement;
  if (canvas && container) {
    const resizeCanvas = () => {
      const w = container.clientWidth - 24;
      const h = container.clientHeight - 24;
      if (w > 0 && h > 0 && (canvas.width !== w || canvas.height !== h)) {
        canvas.width = w;
        canvas.height = h;
        drawRelationsGraph();
      }
    };
    resizeCanvas();
    if (typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(resizeCanvas).observe(container);
    }
  }
}

// ---- CRUD ----
function _populateEntitySelect(typeKey, selectId) {
  const sel = document.getElementById(selectId);
  if (!sel) return;
  const types = _getGraphEntityTypes();
  const t = types.find(x => x.key === typeKey);
  if (!t) { sel.innerHTML = ''; return; }
  sel.innerHTML = t.getData().map(d => `<option value="${esc(d.id)}">${esc(d.name)}</option>`).join('');
}

async function addRelation() {
  const entityTypes = _getGraphEntityTypes();
  const allEntities = _getAllGraphEntities();
  if (allEntities.length < 2) { showToast('请先添加至少两个实体！'); return; }
  const modal = $('#modal-box');
  const overlay = $('#modal-overlay');
  const typeOptions = entityTypes.map(t => `<option value="${t.key}">${t.icon} ${t.label}</option>`).join('');
  const firstType = entityTypes[0];
  const firstItems = firstType.getData().map(d => `<option value="${d.id}">${esc(d.name)}</option>`).join('');
  const secondType = entityTypes.length > 1 ? entityTypes[1] : entityTypes[0];
  const secondItems = secondType.getData().map(d => `<option value="${d.id}">${esc(d.name)}</option>`).join('');
  modal.innerHTML = `
    <h3>添加关系</h3>
    <div class="form-row">
      <div class="form-group"><label>源类型</label><select id="rel-from-type" onchange="_populateEntitySelect(this.value,'rel-from-id')" style="width:100%;padding:8px 12px;background:var(--white);border:1px solid var(--border);border-radius:var(--radius-sm);font-size:14px;font-family:var(--font-body)">${typeOptions}</select></div>
      <div class="form-group"><label>源实体</label><select id="rel-from-id" style="width:100%;padding:8px 12px;background:var(--white);border:1px solid var(--border);border-radius:var(--radius-sm);font-size:14px;font-family:var(--font-body)">${firstItems}</select></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>目标类型</label><select id="rel-to-type" onchange="_populateEntitySelect(this.value,'rel-to-id')" style="width:100%;padding:8px 12px;background:var(--white);border:1px solid var(--border);border-radius:var(--radius-sm);font-size:14px;font-family:var(--font-body)">${typeOptions}</select></div>
      <div class="form-group"><label>目标实体</label><select id="rel-to-id" style="width:100%;padding:8px 12px;background:var(--white);border:1px solid var(--border);border-radius:var(--radius-sm);font-size:14px;font-family:var(--font-body)">${secondItems}</select></div>
    </div>
    <div class="form-group"><label>关系类型</label><input id="rel-type" placeholder="如：师徒、据点、参与..." style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);font-size:14px;font-family:var(--font-body)"></div>
    <div class="form-group"><label>描述（可选）</label><textarea id="rel-desc" rows="2" style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);font-size:14px;font-family:var(--font-body);resize:vertical" placeholder="补充说明"></textarea></div>
    <div class="modal-actions">
      <button class="btn btn-outline" id="rel-cancel">取消</button>
      <button class="btn btn-primary" id="rel-ok">确定</button>
    </div>`;
  showModalOverlay();
  const toTypeSel = document.getElementById('rel-to-type');
  if (toTypeSel && entityTypes.length > 1) toTypeSel.value = secondType.key;
  return new Promise((resolve) => {
    const finish = (val) => { closeModal(); resolve(val); };
    $('#rel-ok').onclick = () => {
      const fromType = $('#rel-from-type').value;
      const fromId = $('#rel-from-id').value;
      const toType = $('#rel-to-type').value;
      const toId = $('#rel-to-id').value;
      const type = $('#rel-type').value;
      const desc = $('#rel-desc').value;
      if (!type || !type.trim()) { showToast('请填写关系类型'); return; }
      if (fromId === toId && fromType === toType) { showToast('源实体和目标实体不能相同'); return; }
      if (!state.data.entityRelations) state.data.entityRelations = [];
      state.data.entityRelations.push({ id: uid(), fromId, fromType, toId, toType, type: type.trim(), description: desc||'' });
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
async function deleteRelation(i) { if (!await customConfirm('删除此关系？')) return; state.data.characterRelations.splice(i, 1); autoSave(); renderTabContent(); }