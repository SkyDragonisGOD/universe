// ============================================================
// 架空地图 — 地点标注管理
// ============================================================

function _mapSetMode(mode) {
  if (mode === 'placeLoc' && _mapMode === 'placeLoc') mode = 'select';
  _mapMode = mode;
  document.querySelectorAll('.fmap-mode-btn').forEach(b => {
    b.classList.remove('btn-primary', 'btn-warning');
    b.classList.add('btn-outline');
  });
  const btn = document.querySelector(`.fmap-mode-btn[data-mode="${mode}"]`);
  if (btn) {
    btn.classList.remove('btn-outline');
    if (mode === 'placeLoc') {
      btn.classList.add('btn-warning');
    } else {
      btn.classList.add('btn-primary');
    }
  }
  if (_mapApp && _mapApp.canvas) {
    _mapApp.canvas.style.cursor = mode === 'placeLoc' ? 'crosshair' : 'default';
  }
  _mapLocPlaceMode = mode === 'placeLoc';
}

function _mapShowLocCard(locId, pixiEvent) {
  _mapShowDetail('location', locId);
}

async function _mapPlaceLocation(worldX, worldY) {
  const locs = state.data.locations || [];
  if (locs.length === 0) { showToast('暂无地点，请先创建'); return; }
  const items = locs.map(l => ({ id: l.id, name: l.name }));
  const result = await customSelectModal('📍 选择要标注的地点', items, []);
  if (!result || result.length === 0) return;
  const md = _ensureMapData();
  const existing = md.locationMarkers.findIndex(m => m.locationId === result[0]);
  if (existing >= 0) md.locationMarkers.splice(existing, 1);
  md.locationMarkers.push({ locationId: result[0], x: Math.round(worldX * 10) / 10, y: Math.round(worldY * 10) / 10, icon: '📍' });
  autoSave();
  await _mapFullRender();
  _updateLocListPanel();
  showToast('地点已标注');
}

function _mapRemoveLocationMarker(locId) {
  const md = _ensureMapData();
  md.locationMarkers = md.locationMarkers.filter(m => m.locationId !== locId);
  autoSave();
  _mapFullRender();
  _updateLocListPanel();
}

function _updateLocListPanel() {
  const panel = $('#map-loc-list');
  if (!panel) return;
  const md = _ensureMapData();
  const locs = state.data.locations || [];
  const markers = md.locationMarkers.filter(m => locs.find(l => l.id === m.locationId));
  const header = document.querySelector('.fmap-sidebar-section .fmap-loc-header');
  if (header) header.textContent = `📍 已标注地点 (${markers.length})`;
  if (markers.length === 0) {
    panel.innerHTML = '<div class="text-sm text-muted">暂无标注地点</div>';
    return;
  }
  panel.innerHTML = markers.map(m => {
    const loc = locs.find(l => l.id === m.locationId);
    const icon = m.icon || '📍';
    return `<div class="fmap-loc-item" style="cursor:pointer" onclick="_mapHighlightLoc('${esc(m.locationId)}')"><span>${icon} ${esc(loc ? loc.name : '未知')}</span><div style="display:flex;gap:2px"><button class="btn btn-xs btn-icon" style="font-size:10px" onclick="event.stopPropagation();_mapEditLocIcon('${esc(m.locationId)}')">🎨</button><button class="btn btn-xs btn-icon btn-danger" onclick="event.stopPropagation();_mapRemoveLocationMarker('${esc(m.locationId)}')">×</button></div></div>`;
  }).join('');
}

function _mapHighlightLoc(locId) {
  const md = _ensureMapData();
  const marker = md.locationMarkers.find(m => m.locationId === locId);
  if (!marker) return;
  const vp = _mapVP();
  vp.panX = _MAP_W / 2 - marker.x * vp.zoom;
  vp.panY = _MAP_H / 2 - marker.y * vp.zoom;
  _clampViewport();
  _mapApplyViewport();
  _mapFlashLocMarker(locId);
  _mapShowDetail('location', locId);
}

function _mapFlashLocMarker(locId) {
  if (!_mapContainer) return;
  const targets = [];
  const findTargets = (container) => {
    for (const child of container.children) {
      if (child._locationId === locId) targets.push(child);
      if (child.children && child.children.length > 0) findTargets(child);
    }
  };
  findTargets(_mapContainer);
  if (targets.length === 0) return;
  const origScales = targets.map(t => ({ sx: t.scale.x, sy: t.scale.y }));
  let count = 0;
  const iv = setInterval(() => {
    count++;
    targets.forEach((t, i) => {
      if (count % 2 === 1) {
        t.scale.set(origScales[i].sx * 1.5, origScales[i].sy * 1.5);
        t.alpha = 0.5;
      } else {
        t.scale.set(origScales[i].sx, origScales[i].sy);
        t.alpha = 1;
      }
    });
    if (count >= 6) {
      clearInterval(iv);
      targets.forEach((t, i) => {
        t.scale.set(origScales[i].sx, origScales[i].sy);
        t.alpha = 1;
      });
    }
  }, 200);
}

async function _mapEditLocIcon(locId) {
  const md = _ensureMapData();
  const marker = md.locationMarkers.find(m => m.locationId === locId);
  if (!marker) return;
  const result = await _mapOpenLocIconPicker(marker.icon || '📍');
  if (result === null || result === undefined) return;
  marker.icon = result.trim() || '📍';
  autoSave();
  await _mapFullRender();
  _updateLocListPanel();
}

function _mapOpenLocIconPicker(currentIcon) {
  return new Promise((resolve) => {
    const modal = $('#modal-box');
    const overlay = $('#modal-overlay');
    const _seen = new Set();
    const customLib = (state.data.emojiLib || []).filter(em => { if (_seen.has(em.emoji)) return false; _seen.add(em.emoji); return true; }).map(em => em.emoji);
    const customLibHtml = customLib.length > 0 ? `<div class="emoji-cat"><div class="emoji-cat-title">⭐ 自定义 Emoji</div><div class="emoji-grid">${customLib.map(e => `<button class="emoji-btn" onclick="_mapSelectLocIcon('${e.replace(/'/g, "\\'")}')">${e}</button>`).join('')}</div></div>` : '';
    const categories = Object.entries(EMOJI_CATEGORIES).map(([cat, emojis]) => {
      return `<div class="emoji-cat"><div class="emoji-cat-title">${esc(cat)}</div><div class="emoji-grid">${emojis.map(e => `<button class="emoji-btn" onclick="_mapSelectLocIcon('${e}')">${e}</button>`).join('')}</div></div>`;
    }).join('');
    modal.innerHTML = `
      <h3>选择地点图标</h3>
      <div class="form-group"><label>自定义输入</label><input id="map-loc-icon-custom" placeholder="输入emoji或文字" value="${esc(currentIcon)}" style="width:100%;padding:8px 12px;font-size:14px"></div>
      <div style="max-height:350px;overflow-y:auto">${customLibHtml}${categories}</div>
      <div class="modal-actions">
        <button class="btn btn-outline" onclick="closeModal();_mapLocIconPickerResolve=null">取消</button>
        <button class="btn btn-primary" id="map-loc-icon-ok">确定</button>
      </div>`;
    overlay.classList.remove('hidden');
    window._mapLocIconPickerResolve = resolve;
    window._mapSelectLocIcon = (emoji) => {
      window._mapLocIconPickerResolve(emoji);
      closeModal();
      window._mapLocIconPickerResolve = null;
    };
    $('#map-loc-icon-ok').onclick = () => {
      const val = ($('#map-loc-icon-custom') || {}).value || '📍';
      resolve(val.trim() || '📍');
      closeModal();
      window._mapLocIconPickerResolve = null;
    };
    overlay.onclick = (e) => {
      if (e.target === overlay) {
        closeModal();
        resolve(null);
        window._mapLocIconPickerResolve = null;
      }
    };
  });
}