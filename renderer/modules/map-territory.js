// ============================================================
// 架空地图 — 领地管理与面板
// ============================================================

async function _generateRandomTerritories(count, seed) {
  const md = _ensureMapData();
  const hasExistingData = md.territories.length > 0 || md.locationMarkers.length > 0;
  if (hasExistingData) {
    const savedRes = (state.data.resources || []).find(r => r.mapData);
    if (!savedRes) {
      const ok = await customConfirm('当前地图数据尚未保存到资源库，生成新地形将覆盖现有数据。是否继续？');
      if (!ok) return;
    } else {
      try {
        const saved = JSON.parse(savedRes.mapData);
        const isDifferent = JSON.stringify(saved.territories) !== JSON.stringify(md.territories) || JSON.stringify(saved.locationMarkers) !== JSON.stringify(md.locationMarkers);
        if (isDifferent) {
          const ok = await customConfirm('当前地图数据与资源库中保存的版本不同，生成新地形将覆盖现有数据。是否继续？');
          if (!ok) return;
        }
      } catch (e) {}
    }
  }
  if (!seed) { seed = Math.floor(Math.random() * 999999) + 1; }
  md.seed = seed;
  md.genCount = count;

  const terrain = _regenerateTerrain();
  if (!terrain || terrain.seeds.length === 0) {
    showToast('地形生成失败，请尝试其他种子');
    return;
  }

  const cxArr = new Float64Array(terrain.seeds.length);
  const cyArr = new Float64Array(terrain.seeds.length);
  const cntArr = new Uint32Array(terrain.seeds.length);
  for (let y = 0; y < _MAP_H; y++) {
    for (let x = 0; x < _MAP_W; x++) {
      const ti = terrain.territoryMap[y * _MAP_W + x];
      if (ti >= 0) { cxArr[ti] += x; cyArr[ti] += y; cntArr[ti]++; }
    }
  }

  md.territories = [];
  md.locationMarkers = [];
  for (let i = 0; i < terrain.seeds.length; i++) {
    const id = _mapUid();
    md.territories.push({
      id,
      name: '地区' + (i + 1),
      seedX: terrain.seeds[i].x,
      seedY: terrain.seeds[i].y,
      centerX: cntArr[i] > 0 ? Math.round(cxArr[i] / cntArr[i]) : terrain.seeds[i].x,
      centerY: cntArr[i] > 0 ? Math.round(cyArr[i] / cntArr[i]) : terrain.seeds[i].y,
      color: _hslToHex((i * 137.5 + 30) % 360, 50, 70),
      factionIds: [],
      locationIds: [],
      characterIds: [],
      worldSystemIds: [],
    });
  }
  md.nextId = terrain.seeds.length + 1;
  _mapSelectedId = null;
  autoSave();
  await _mapFullRender();
  _updateTerritoryPanel();
  _updateLocListPanel();
  _updateTerritoryListPanel();
  showToast(`已生成 ${terrain.seeds.length} 个领地，标注地点已清空`);
}

function _mapSelectTerritory(tid) {
  _mapSelectedId = tid;
  _mapFullRender();
  _updateTerritoryPanel();
  _mapShowDetail('territory', tid);
}

function _mapDeselectTerritory() {
  _mapSelectedId = null;
  _mapFullRender();
  _updateTerritoryPanel();
  _mapBackToStats();
}

function _updateTerritoryPanel() {
  const panel = $('#map-territory-info');
  if (!panel) return;
  if (!_mapSelectedId) {
    panel.innerHTML = '<div class="text-sm text-muted" style="padding:6px">点击领地查看/编辑详情</div>';
    return;
  }
  const md = _ensureMapData();
  const t = md.territories.find(x => x.id === _mapSelectedId);
  if (!t) { panel.innerHTML = '<div class="text-sm text-muted" style="padding:6px">领地不存在</div>'; return; }
  const factions = state.data.factions || [];
  const locs = state.data.locations || [];
  const chars = state.data.characters || [];
  const wsys = state.data.worldBackpacks || [];

  const overrideLocId = _mapTerritoryLocOverride[t.id] || null;
  const overrideLoc = overrideLocId ? locs.find(l => l.id === overrideLocId) : null;

  const displayName = overrideLoc ? overrideLoc.name : t.name;

  let bodyHtml = '';
  if (overrideLoc) {
    const oFacs = _normLinks(overrideLoc.relatedFactions || []).map(f => { const fa = factions.find(x => x.id === f.id); return fa ? {id: fa.id, name: fa.name, color: fa.color} : null; }).filter(Boolean);
    const oChars = _normLinks(overrideLoc.relatedCharacters || []).map(c => { const ch = chars.find(x => x.id === c.id); return ch ? {id: ch.id, name: ch.name} : null; }).filter(Boolean);
    const oEvents = _normLinks(overrideLoc.events || []).map(e => { const ev = collectGlossary('event').find(x => x.id === e.id); return ev ? {id: ev.id, name: ev.name} : null; }).filter(Boolean);

    const oFacTags = oFacs.map(fa => `<span class="wiki-tag item" style="cursor:pointer" onclick="_mapShowDetail('faction','${esc(fa.id)}')"><span class="dot" style="background:${fa.color||'#888'};width:8px;height:8px;border-radius:50%;display:inline-block;margin-right:4px"></span>${esc(fa.name)}</span>`).join('');
    const oCharTags = oChars.map(ch => `<span class="wiki-tag skill" style="cursor:pointer" onclick="_mapShowDetail('character','${esc(ch.id)}')">👤 ${esc(ch.name)}</span>`).join('');
    const oEventTags = oEvents.map(ev => `<span class="wiki-tag item" style="cursor:pointer" onclick="showPreviewCard('event','${esc(ev.id)}',event)">${esc(ev.name)}</span>`).join('');

    bodyHtml = `
      ${overrideLoc.description ? `<div class="form-group"><label style="font-size:11px">描述</label><div style="font-size:12px;line-height:1.4;color:var(--text)">${esc(overrideLoc.description)}</div></div>` : ''}
      ${oFacs.length > 0 ? `<div class="form-group"><label style="font-size:11px">关联势力</label><div style="display:flex;flex-wrap:wrap;gap:4px">${oFacTags}</div></div>` : ''}
      ${oChars.length > 0 ? `<div class="form-group"><label style="font-size:11px">关联人物</label><div style="display:flex;flex-wrap:wrap;gap:4px">${oCharTags}</div></div>` : ''}
      ${oEvents.length > 0 ? `<div class="form-group"><label style="font-size:11px">关联事件</label><div style="display:flex;flex-wrap:wrap;gap:4px">${oEventTags}</div></div>` : ''}
    `;
  } else {
    const facTags = (t.factionIds || []).map(fid => {
      const f = factions.find(x => x.id === fid);
      return f ? `<span class="wiki-tag item" style="cursor:pointer" onclick="_mapShowDetail('faction','${esc(f.id)}')"><span class="dot" style="background:${f.color||'#888'};width:8px;height:8px;border-radius:50%;display:inline-block;margin-right:4px"></span>${esc(f.name)}</span><button class="btn btn-xs btn-icon btn-danger" style="font-size:8px;margin-left:1px" onclick="_mapRemoveTerritoryLink('factionIds','${esc(fid)}')">×</button>` : '';
    }).join('');
    const locTags = (t.locationIds || []).map(lid => {
      const l = locs.find(x => x.id === lid);
      return l ? `<span class="wiki-tag skill" style="cursor:pointer" onclick="_mapShowDetail('location','${esc(l.id)}')">📍 ${esc(l.name)}</span><button class="btn btn-xs btn-icon btn-danger" style="font-size:8px;margin-left:1px" onclick="_mapRemoveTerritoryLink('locationIds','${esc(lid)}')">×</button>` : '';
    }).join('');
    const charTags = (t.characterIds || []).map(cid => {
      const c = chars.find(x => x.id === cid);
      return c ? `<span class="wiki-tag skill" style="cursor:pointer" onclick="_mapShowDetail('character','${esc(c.id)}')">👤 ${esc(c.name)}</span><button class="btn btn-xs btn-icon btn-danger" style="font-size:8px;margin-left:1px" onclick="_mapRemoveTerritoryLink('characterIds','${esc(cid)}')">×</button>` : '';
    }).join('');

    const backpackHtml = wsys.length === 0 ? '' : wsys.map(bp => {
      const bpItems = (state.data.items||[]).filter(i=>i.backpackId===bp.id);
      const selectedItems = (t.backpackItems||{})[bp.id]||[];
      return `<div style="margin-bottom:6px;padding:6px;background:var(--bg-alt);border-radius:var(--radius-xs)">
        <div style="font-size:11px;font-weight:600;margin-bottom:4px">🎲 ${esc(bp.name)}</div>
        ${bpItems.length===0 ? '<div class="text-xs text-muted">此系统为空</div>' :
        `<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px"><span class="text-xs text-muted">已选 ${selectedItems.length} 项</span><button class="btn btn-xs btn-outline" onclick="_mapOpenTerritoryBackpackSelect('${esc(bp.id)}')">选择物品</button></div>
        ${selectedItems.length > 0 ? `<div style="display:flex;flex-wrap:wrap;gap:4px">${selectedItems.map(iid => {
          const it = bpItems.find(i=>i.id===iid);
          return it ? `<span class="wiki-tag item" style="cursor:pointer" onclick="_mapShowDetail('item','${esc(it.id)}')">${it.icon||'📦'} ${esc(it.name)}</span>` : '';
        }).join('')}</div>` : ''}`}
      </div>`;
    }).join('');

    bodyHtml = `
      <div class="form-group"><label style="font-size:11px">名称</label><input value="${esc(t.name)}" onchange="_mapUpdateTerritoryField('name',this.value)" style="width:100%;padding:3px 6px;font-size:12px;border:1px solid var(--border);border-radius:var(--radius-xs)"></div>
      <div class="form-group"><label style="font-size:11px">颜色</label><input type="color" value="${esc(t.color)}" onchange="_mapUpdateTerritoryField('color',this.value)" style="width:40px;height:24px;padding:0;border:1px solid var(--border);border-radius:var(--radius-xs);cursor:pointer"></div>
      <div class="form-group"><label style="font-size:11px">关联势力</label>
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px"><span class="text-xs text-muted">已选 ${(t.factionIds||[]).length}</span><button class="btn btn-xs btn-outline" onclick="_mapOpenTerritorySelect('factionIds','选择势力',_mapFactionItems())">选择</button></div>
        <div style="display:flex;flex-wrap:wrap;gap:4px">${facTags}</div>
      </div>
      <div class="form-group"><label style="font-size:11px">关联地点</label>
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px"><span class="text-xs text-muted">已选 ${(t.locationIds||[]).length}</span><button class="btn btn-xs btn-outline" onclick="_mapOpenTerritorySelect('locationIds','选择地点',_mapLocationItems())">选择</button></div>
        <div style="display:flex;flex-wrap:wrap;gap:4px">${locTags}</div>
      </div>
      <div class="form-group"><label style="font-size:11px">关联人物</label>
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px"><span class="text-xs text-muted">已选 ${(t.characterIds||[]).length}</span><button class="btn btn-xs btn-outline" onclick="_mapOpenTerritorySelect('characterIds','选择人物',_mapCharacterItems())">选择</button></div>
        <div style="display:flex;flex-wrap:wrap;gap:4px">${charTags}</div>
      </div>
      ${backpackHtml}
    `;
  }

  panel.innerHTML = `<div style="padding:4px">
    <div class="flex-between mb-4"><strong style="font-size:13px">${esc(displayName)}</strong><button class="btn btn-xs btn-outline" onclick="_mapDeselectTerritory()">✕</button></div>
    <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">
      ${locs.length > 0 ? `<button class="btn btn-xs btn-outline" onclick="_mapSelectLocForTerritory('${esc(t.id)}')">📍 选择地点覆盖</button>` : ''}
      ${overrideLocId ? `<button class="btn btn-xs btn-outline" style="font-size:10px" onclick="_mapClearLocOverride('${esc(t.id)}')">✕ 清除覆盖</button>` : ''}
    </div>
    ${bodyHtml}
    <button class="btn btn-xs btn-danger" style="width:100%;margin-top:6px" onclick="_mapDeleteTerritory('${esc(t.id)}')">🗑️ 删除此领地</button>
  </div>`;
}

function _mapFactionItems() { return (state.data.factions || []).map(f => ({ id: f.id, name: f.name })); }
function _mapLocationItems() { return (state.data.locations || []).map(l => ({ id: l.id, name: l.name })); }
function _mapCharacterItems() { return (state.data.characters || []).map(c => ({ id: c.id, name: c.name })); }

async function _mapOpenTerritorySelect(field, title, items) {
  if (items.length === 0) { showToast('暂无可选项'); return; }
  const md = _ensureMapData();
  const t = md.territories.find(x => x.id === _mapSelectedId);
  if (!t) return;
  const existingIds = t[field] || [];
  const result = await customSelectModal(title, items, existingIds);
  if (!result) return;
  t[field] = result;
  autoSave();
  _updateTerritoryPanel();
}

function _mapRemoveTerritoryLink(field, id) {
  const md = _ensureMapData();
  const t = md.territories.find(x => x.id === _mapSelectedId);
  if (!t) return;
  t[field] = (t[field] || []).filter(x => x !== id);
  autoSave();
  _updateTerritoryPanel();
}

async function _mapOpenTerritoryBackpackSelect(bpId) {
  const md = _ensureMapData();
  const t = md.territories.find(x => x.id === _mapSelectedId);
  if (!t) return;
  if (!t.backpackItems) t.backpackItems = {};
  const bpItems = (state.data.items||[]).filter(i=>i.backpackId===bpId);
  if (bpItems.length===0){showToast('此系统无物品');return;}
  const selectedIds = t.backpackItems[bpId]||[];
  const items = bpItems.map(i=>({id:i.id,name:(i.icon||'📦')+' '+(i.name||'未命名')}));
  const result = await customSelectModal('🎲 选择物品', items, selectedIds);
  if (result===null) return;
  t.backpackItems[bpId] = result;
  autoSave();
  _updateTerritoryPanel();
}

function _mapUpdateTerritoryField(key, value) {
  const md = _ensureMapData();
  const t = md.territories.find(x => x.id === _mapSelectedId);
  if (!t) return;
  t[key] = value;
  autoSave();
  if (key === 'name' || key === 'color') _mapFullRender();
  _updateTerritoryPanel();
}

function _mapDeleteTerritory(tid) {
  const md = _ensureMapData();
  md.territories = md.territories.filter(t => t.id !== tid);
  if (_mapSelectedId === tid) _mapSelectedId = null;
  autoSave();
  _mapFullRender();
  _updateTerritoryPanel();
  _updateLocListPanel();
  _updateTerritoryListPanel();
}

let _mapTerritoryDetailCollapsed = false;

function _toggleTerritoryDetail() {
  _mapTerritoryDetailCollapsed = !_mapTerritoryDetailCollapsed;
  const info = $('#map-territory-info');
  const btn = $('#map-terr-detail-toggle');
  if (info) info.style.display = _mapTerritoryDetailCollapsed ? 'none' : '';
  if (btn) btn.textContent = _mapTerritoryDetailCollapsed ? '展开' : '收起';
}

function _updateTerritoryListPanel() {
  const panel = $('#map-territory-list');
  if (!panel) return;
  const md = _ensureMapData();
  const header = document.querySelector('.fmap-terr-list-header');
  if (header) header.textContent = `🏷️ 领地列表 (${md.territories.length})`;
  if (md.territories.length === 0) {
    panel.innerHTML = '<div class="text-sm text-muted">暂无领地</div>';
    return;
  }
  panel.innerHTML = md.territories.map(t => {
    const isSelected = _mapSelectedId === t.id;
    return `<div class="fmap-loc-item" style="cursor:pointer;${isSelected ? 'background:var(--bg-alt);' : ''}" onclick="_mapHighlightTerritory('${esc(t.id)}')"><span><span class="dot" style="background:${t.color||'#888'};width:8px;height:8px;border-radius:50%;display:inline-block;margin-right:4px"></span>${esc(t.name)}</span></div>`;
  }).join('');
}

function _mapHighlightTerritory(tid) {
  const md = _ensureMapData();
  const t = md.territories.find(x => x.id === tid);
  if (!t) return;
  _mapSelectTerritory(tid);
  const vp = _mapVP();
  const cx = t.centerX != null ? t.centerX : (t.seedX || 0);
  const cy = t.centerY != null ? t.centerY : (t.seedY || 0);
  vp.panX = _MAP_W / 2 - cx * vp.zoom;
  vp.panY = _MAP_H / 2 - cy * vp.zoom;
  _clampViewport();
  _mapApplyViewport();
  _mapFlashTerritory(tid);
  if (typeof _mapPrevViewState !== 'undefined') _mapPrevViewState = null;
  _mapShowDetail('territory', tid);
}

function _mapFlashTerritory(tid) {
  if (!_mapContainer || !_terrainCache) return;
  const md = _ensureMapData();
  const t = md.territories.find(x => x.id === tid);
  if (!t) return;
  const ti = md.territories.indexOf(t);
  const gfx = new PIXI.Graphics();
  const tm = _terrainCache.territoryMap;
  const step = 3;
  for (let y = 0; y < _MAP_H; y += step) {
    for (let x = 0; x < _MAP_W; x += step) {
      const idx = y * _MAP_W + x;
      if (tm[idx] === ti) {
        gfx.rect(x, y, step, step);
      }
    }
  }
  gfx.fill({ color: 0xffffff, alpha: 0.5 });
  _mapContainer.addChild(gfx);
  let count = 0;
  const iv = setInterval(() => {
    count++;
    gfx.alpha = count % 2 === 1 ? 0.15 : 0.5;
    if (count >= 6) {
      clearInterval(iv);
      _mapContainer.removeChild(gfx);
      gfx.destroy();
    }
  }, 200);
}