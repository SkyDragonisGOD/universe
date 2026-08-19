// ============================================================
// 架空地图 — 统计与详情展示
// ============================================================

const _MAP_INFO_OPTIONS = [
  { key: 'locCategory', label: '📍 地点类型分布' },
  { key: 'locFaction', label: '⚔️ 地点关联势力' },
  { key: 'locChar', label: '👤 地点关联人物' },
  { key: 'terrFaction', label: '🛡️ 领地势力分布' },
  { key: 'terrChar', label: '👤 领地关联人物' },
  { key: 'terrLoc', label: '📍 领地关联地点' },
];

const _MAP_DETAIL_TAB_MAP = {
  location: 'locations',
  faction: 'factions',
  character: 'characters',
  item: 'items',
  territory: 'map',
};

function _mapGetInfoOpts() {
  if (!state.data._mapInfoOpts) state.data._mapInfoOpts = ['locCategory', 'terrFaction'];
  return state.data._mapInfoOpts;
}

function _mapToggleInfoDropdown() {
  const wrap = $('#fmap-info-toggle-wrap');
  if (!wrap) return;
  const existing = wrap.querySelector('.fmap-info-dropdown');
  if (existing) { existing.remove(); return; }
  const opts = _mapGetInfoOpts();
  const dd = document.createElement('div');
  dd.className = 'fmap-info-dropdown';
  dd.innerHTML = _MAP_INFO_OPTIONS.map(o => `<label><input type="checkbox" ${opts.includes(o.key) ? 'checked' : ''} onchange="_mapToggleInfoOpt('${o.key}',this.checked)">${o.label}</label>`).join('');
  wrap.appendChild(dd);
  const close = (e) => { if (!dd.contains(e.target)) { dd.remove(); document.removeEventListener('click', close); } };
  setTimeout(() => document.addEventListener('click', close), 0);
}

function _mapToggleInfoOpt(key, checked) {
  const opts = _mapGetInfoOpts();
  if (checked && !opts.includes(key)) opts.push(key);
  if (!checked) { const i = opts.indexOf(key); if (i >= 0) opts.splice(i, 1); }
  state.data._mapInfoOpts = opts;
  autoSave();
  _mapRefreshStats();
}

function _mapRefreshStats() {
  const area = $('#map-stats-area');
  if (!area) return;
  let content = area.querySelector('.fmap-stats-content');
  if (!content) {
    content = document.createElement('div');
    content.className = 'fmap-stats-content';
    area.appendChild(content);
  }
  content.innerHTML = _mapRenderStats();
}

let _mapPrevViewState = null;

function _mapShowDetail(type, id) {
  const area = $('#map-stats-area');
  if (!area) return;
  
  let content = area.querySelector('.fmap-stats-content');
  if (!content) {
    content = document.createElement('div');
    content.className = 'fmap-stats-content';
    area.appendChild(content);
  }
  
  if (!_mapPrevViewState) {
    const currentContent = content.innerHTML;
    _mapPrevViewState = { type: 'stats', content: currentContent };
  }
  
  let html = '';

  if (type === 'location') {
    const loc = (state.data.locations || []).find(l => l.id === id);
    if (!loc) return;
    const facs = _normLinks(loc.relatedFactions || []).map(f => { const fa = (state.data.factions || []).find(x => x.id === f.id); return fa ? {id: fa.id, name: fa.name} : null; }).filter(Boolean);
    const chars = _normLinks(loc.relatedCharacters || []).map(c => { const ch = (state.data.characters || []).find(x => x.id === c.id); return ch ? {id: ch.id, name: ch.name, desc: c.desc} : null; }).filter(Boolean);
    const events = _normLinks(loc.events || []).map(e => { const ev = collectGlossary('event').find(x => x.id === e.id); return ev ? {id: ev.id, name: ev.name, desc: e.desc} : null; }).filter(Boolean);
    
    html = `<div class="wiki-page fmap-detail-card fmap-compact">
      <div class="wiki-header" style="margin-bottom:10px;padding-bottom:6px">
        <h2 class="wiki-title" style="font-size:16px;margin-bottom:4px">📍 ${esc(loc.name)}</h2>
        <div class="wiki-meta" style="gap:4px">
          ${loc.category && loc.category !== '未知' ? `<span class="wiki-badge race" style="font-size:11px;padding:2px 8px;cursor:pointer" title="${esc(getCategoryDesc('category',loc.category))}" onclick="openCategoryDetail('category','${esc(loc.category)}')">${esc(loc.category)}</span>` : ''}
        </div>
      </div>
      ${loc.description ? `<div class="fmap-compact-section"><div class="fmap-compact-label">描述</div><div class="fmap-compact-value" style="font-size:12px;line-height:1.5">${esc(loc.description)}</div></div>` : ''}
      ${chars.length > 0 ? `<div class="fmap-compact-section"><div class="fmap-compact-label">关联角色</div><div class="fmap-compact-tags">${chars.map(ch => `<span class="wiki-tag skill" style="font-size:11px;padding:3px 8px" onclick="showPreviewCard('character','${esc(ch.id)}',event)" style="cursor:pointer">${esc(ch.name)}</span>`).join('')}</div></div>` : ''}
      ${events.length > 0 ? `<div class="fmap-compact-section"><div class="fmap-compact-label">关联事件</div><div class="fmap-compact-tags">${events.map(ev => `<span class="wiki-tag item" style="font-size:11px;padding:3px 8px" onclick="showPreviewCard('event','${esc(ev.id)}',event)" style="cursor:pointer">${esc(ev.name)}</span>`).join('')}</div></div>` : ''}
      ${facs.length > 0 ? `<div class="fmap-compact-section"><div class="fmap-compact-label">关联势力</div><div class="fmap-compact-tags">${facs.map(fa => `<span class="wiki-tag item" style="font-size:11px;padding:3px 8px" onclick="showPreviewCard('faction','${esc(fa.id)}',event)" style="cursor:pointer">${esc(fa.name)}</span>`).join('')}</div></div>` : ''}
      <div class="detail-sticky-bar">
        <button class="btn btn-xs btn-outline" onclick="_mapBackToPrevState()">← 返回</button>
        <button class="btn btn-xs btn-primary" onclick="_mapNavigateToDetail('${esc(type)}','${esc(id)}')">查看详情 →</button>
      </div>
    </div>`;
  } else if (type === 'faction') {
    const f = (state.data.factions || []).find(x => x.id === id);
    if (!f) return;
    html = `<div class="wiki-page fmap-detail-card fmap-compact">
      <div class="wiki-header" style="margin-bottom:10px;padding-bottom:6px">
        <h2 class="wiki-title" style="font-size:16px;margin-bottom:4px"><span class="dot" style="background:${f.color||'#888'};width:12px;height:12px;border-radius:50%;display:inline-block;margin-right:6px"></span>${esc(f.name)}</h2>
        <div class="wiki-meta" style="gap:4px">
          ${f.type && f.type !== '未知' ? `<span class="wiki-badge role" style="font-size:11px;padding:2px 8px;background:${f.color||'#888'};color:#fff;cursor:pointer" title="${esc(getCategoryDesc('factionType',f.type))}" onclick="openCategoryDetail('factionType','${esc(f.type)}')">${esc(f.type)}</span>` : ''}
        </div>
      </div>
      ${f.description ? `<div class="fmap-compact-section"><div class="fmap-compact-label">描述</div><div class="fmap-compact-value" style="font-size:12px;line-height:1.5">${esc(f.description)}</div></div>` : ''}
      <div class="detail-sticky-bar">
        <button class="btn btn-xs btn-outline" onclick="_mapBackToPrevState()">← 返回</button>
        <button class="btn btn-xs btn-primary" onclick="_mapNavigateToDetail('${esc(type)}','${esc(id)}')">查看详情 →</button>
      </div>
    </div>`;
  } else if (type === 'character') {
    const c = (state.data.characters || []).find(x => x.id === id);
    if (!c) return;
    html = `<div class="wiki-page fmap-detail-card fmap-compact">
      <div class="wiki-header" style="margin-bottom:10px;padding-bottom:6px">
        <h2 class="wiki-title" style="font-size:16px;margin-bottom:4px">👤 ${esc(c.name)}</h2>
        <div class="wiki-meta" style="gap:4px">
          ${c.role ? `<span class="wiki-badge role" style="font-size:11px;padding:2px 8px">${esc(c.role)}</span>` : ''}
          ${(c.race||[]).length>0?`<span class="wiki-badge race" style="font-size:11px;padding:2px 8px;cursor:pointer" onclick="showPreviewCard('race','${esc((state.data.races||[]).find(r=>r.name===c.race[0])?.id||c.race[0])}',event)">${esc(c.race[0])}</span>`:''}
        </div>
      </div>
      ${c.description ? `<div class="fmap-compact-section"><div class="fmap-compact-label">描述</div><div class="fmap-compact-value" style="font-size:12px;line-height:1.5">${esc(c.description)}</div></div>` : ''}
      <div class="detail-sticky-bar">
        <button class="btn btn-xs btn-outline" onclick="_mapBackToPrevState()">← 返回</button>
        <button class="btn btn-xs btn-primary" onclick="_mapNavigateToDetail('${esc(type)}','${esc(id)}')">查看详情 →</button>
      </div>
    </div>`;
  } else if (type === 'item') {
    const it = (state.data.items || []).find(x => x.id === id);
    if (!it) return;
    html = `<div class="wiki-page fmap-detail-card fmap-compact">
      <div class="wiki-header" style="margin-bottom:10px;padding-bottom:6px">
        <h2 class="wiki-title" style="font-size:16px;margin-bottom:4px">${it.icon || '📦'} ${esc(it.name)}</h2>
        <div class="wiki-meta" style="gap:4px">
          ${it.type ? `<span class="wiki-badge gender" style="font-size:11px;padding:2px 8px;cursor:pointer" title="${esc(getCategoryDesc('itemType',it.type))}" onclick="openCategoryDetail('itemType','${esc(it.type)}')">${esc(it.type)}</span>` : ''}
        </div>
      </div>
      ${it.description ? `<div class="fmap-compact-section"><div class="fmap-compact-label">描述</div><div class="fmap-compact-value" style="font-size:12px;line-height:1.5">${esc(it.description)}</div></div>` : ''}
      <div class="detail-sticky-bar">
        <button class="btn btn-xs btn-outline" onclick="_mapBackToPrevState()">← 返回</button>
        <button class="btn btn-xs btn-primary" onclick="_mapNavigateToDetail('${esc(type)}','${esc(id)}')">查看详情 →</button>
      </div>
    </div>`;
  } else if (type === 'territory') {
    html = _mapRenderTerritoryDetail(id);
  }
  if (html) {
    content.innerHTML = html;
    if (typeof gsap !== 'undefined') {
      gsap.fromTo(content, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, ease: 'power3.out' });
    }
  }
}

let _mapTerritoryLocOverride = {};

function _mapRenderTerritoryDetail(tid) {
  const md = _ensureMapData();
  const t = md.territories.find(x => x.id === tid);
  if (!t) return '';
  const locs = state.data.locations || [];
  const terrFacs = (t.factionIds || []).map(fid => { const fa = (state.data.factions || []).find(x => x.id === fid); return fa ? {id: fa.id, name: fa.name} : null; }).filter(Boolean);
  const terrChars = (t.characterIds || []).map(cid => { const ch = (state.data.characters || []).find(x => x.id === cid); return ch ? {id: ch.id, name: ch.name} : null; }).filter(Boolean);

  const linkedLocIds = (t.locationIds || []).filter(lid => locs.find(l => l.id === lid));
  const activeLocId = (linkedLocIds.length > 0 ? linkedLocIds[0] : null);
  const activeLoc = activeLocId ? locs.find(l => l.id === activeLocId) : null;

  let locInfoHtml = '';
  if (activeLoc) {
    const locFacs = _normLinks(activeLoc.relatedFactions || []).map(f => { const fa = (state.data.factions || []).find(x => x.id === f.id); return fa ? {id: fa.id, name: fa.name} : null; }).filter(Boolean);
    const locChars = _normLinks(activeLoc.relatedCharacters || []).map(c => { const ch = (state.data.characters || []).find(x => x.id === c.id); return ch ? {id: ch.id, name: ch.name, desc: c.desc} : null; }).filter(Boolean);
    const locEvents = _normLinks(activeLoc.events || []).map(e => { const ev = collectGlossary('event').find(x => x.id === e.id); return ev ? {id: ev.id, name: ev.name, desc: e.desc} : null; }).filter(Boolean);
    const allFacs = [...new Map([...locFacs, ...terrFacs].map(f => [f.id, f])).values()];
    const allChars = [...new Map([...locChars, ...terrChars].map(c => [c.id, c])).values()];

    locInfoHtml = `
      <div class="fmap-compact-section" style="padding:6px 10px">
        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
          <span class="wiki-badge skill" style="font-size:11px;padding:2px 8px">📍 ${esc(activeLoc.name)}</span>
          ${activeLoc.category && activeLoc.category !== '未知' ? `<span class="wiki-badge race" style="font-size:11px;padding:2px 8px;cursor:pointer" title="${esc(getCategoryDesc('category',activeLoc.category))}" onclick="openCategoryDetail('category','${esc(activeLoc.category)}')">${esc(activeLoc.category)}</span>` : ''}
        </div>
      </div>
      ${activeLoc.description ? `<div class="fmap-compact-section"><div class="fmap-compact-label">描述</div><div class="fmap-compact-value" style="font-size:12px;line-height:1.5">${esc(activeLoc.description)}</div></div>` : ''}
      ${allChars.length > 0 ? `<div class="fmap-compact-section"><div class="fmap-compact-label">关联人物</div><div class="fmap-compact-tags">${allChars.map(ch => `<span class="wiki-tag skill" style="font-size:11px;padding:3px 8px;cursor:pointer" onclick="showPreviewCard('character','${esc(ch.id)}',event)">${esc(ch.name)}</span>`).join('')}</div></div>` : ''}
      ${allFacs.length > 0 ? `<div class="fmap-compact-section"><div class="fmap-compact-label">关联势力</div><div class="fmap-compact-tags">${allFacs.map(fa => `<span class="wiki-tag item" style="font-size:11px;padding:3px 8px;cursor:pointer" onclick="showPreviewCard('faction','${esc(fa.id)}',event)">${esc(fa.name)}</span>`).join('')}</div></div>` : ''}
      ${locEvents.length > 0 ? `<div class="fmap-compact-section"><div class="fmap-compact-label">相关事件</div><div class="fmap-compact-tags">${locEvents.map(ev => `<span class="wiki-tag item" style="font-size:11px;padding:3px 8px;cursor:pointer" onclick="showPreviewCard('event','${esc(ev.id)}',event)">${esc(ev.name)}</span>`).join('')}</div></div>` : ''}`;
  } else {
    locInfoHtml = `<div style="font-size:12px;color:var(--muted);padding:12px;text-align:center">此领地尚未关联地点，请在右侧面板添加地点</div>`;
  }

  return `<div class="wiki-page fmap-detail-card fmap-compact">
    <div class="wiki-header" style="margin-bottom:10px;padding-bottom:6px">
      <h2 class="wiki-title" style="font-size:16px;margin-bottom:4px"><span class="dot" style="background:${t.color||'#888'};width:12px;height:12px;border-radius:50%;display:inline-block;margin-right:6px"></span>${esc(t.name)}</h2>
    </div>
    ${locInfoHtml}
    ${terrFacs.length > 0 && !activeLoc ? `<div class="fmap-compact-section"><div class="fmap-compact-label">关联势力</div><div class="fmap-compact-tags">${terrFacs.map(fa => `<span class="wiki-tag item" style="font-size:11px;padding:3px 8px;cursor:pointer" onclick="showPreviewCard('faction','${esc(fa.id)}',event)">${esc(fa.name)}</span>`).join('')}</div></div>` : ''}
    ${terrChars.length > 0 && !activeLoc ? `<div class="fmap-compact-section"><div class="fmap-compact-label">关联人物</div><div class="fmap-compact-tags">${terrChars.map(ch => `<span class="wiki-tag skill" style="font-size:11px;padding:3px 8px;cursor:pointer" onclick="showPreviewCard('character','${esc(ch.id)}',event)">${esc(ch.name)}</span>`).join('')}</div></div>` : ''}
    <div class="detail-sticky-bar">
      <button class="btn btn-xs btn-outline" onclick="_mapBackToPrevState()">← 返回</button>
      <button class="btn btn-xs btn-primary" onclick="_mapNavigateToDetail('territory','${esc(tid)}')">查看详情 →</button>
    </div>
  </div>`;
}

async function _mapSelectLocForTerritory(tid) {
  const locs = state.data.locations || [];
  if (locs.length === 0) { showToast('暂无地点可选'); return; }
  const items = locs.map(l => ({ id: l.id, name: l.name }));
  const existing = _mapTerritoryLocOverride[tid] ? [_mapTerritoryLocOverride[tid]] : [];
  const result = await customSelectModal('📍 选择地点覆盖', items, existing, 1);
  if (!result || result.length === 0) return;
  _mapTerritoryLocOverride[tid] = result[0];
  _updateTerritoryPanel();
  const area = $('#map-stats-area');
  if (area) { const content = area.querySelector('.fmap-stats-content'); if (content) content.innerHTML = _mapRenderTerritoryDetail(tid); }
}

function _mapClearLocOverride(tid) {
  delete _mapTerritoryLocOverride[tid];
  _updateTerritoryPanel();
  const area = $('#map-stats-area');
  if (area) { const content = area.querySelector('.fmap-stats-content'); if (content) content.innerHTML = _mapRenderTerritoryDetail(tid); }
}

function _mapNavigateToDetail(type, id) {
  state._mapReturnFromTab = 'map';
  if (type === 'location') {
    state.selectedLocationId = id;
    switchTab('locations');
  } else if (type === 'faction') {
    state.selectedFactionId = id;
    switchTab('factions');
  } else if (type === 'character') {
    state.selectedCharacterId = id;
    switchTab('characters');
  } else if (type === 'item') {
    state.selectedItemId = id;
    switchTab('items');
  } else if (type === 'territory') {
    _mapSelectTerritory(id);
    switchTab('map');
  }
}

function _mapBackToPrevState() {
  const area = $('#map-stats-area');
  if (!area) return;
  
  let content = area.querySelector('.fmap-stats-content');
  if (!content) return;

  if (typeof gsap !== 'undefined') {
    gsap.to(content, { y: -10, opacity: 0, duration: 0.15, ease: 'power2.in', onComplete: () => {
      _mapBackRestore(content);
      gsap.fromTo(content, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, ease: 'power3.out' });
    }});
  } else {
    _mapBackRestore(content);
  }
}

function _mapBackRestore(content) {
  if (_mapPrevViewState && _mapPrevViewState.type === 'stats') {
    _mapRefreshStats();
  } else if (_mapPrevViewState && _mapPrevViewState.content) {
    if (content) content.innerHTML = _mapPrevViewState.content;
  } else {
    _mapRefreshStats();
  }
  _mapPrevViewState = null;
}

function _mapBackToStats() {
  _mapPrevViewState = null;
  const area = $('#map-stats-area');
  if (!area) return;
  const content = area.querySelector('.fmap-stats-content');
  if (!content) { _mapRefreshStats(); return; }
  if (typeof gsap !== 'undefined') {
    gsap.to(content, { y: -10, opacity: 0, duration: 0.15, ease: 'power2.in', onComplete: () => {
      _mapRefreshStats();
      gsap.fromTo(content, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, ease: 'power3.out' });
    }});
  } else {
    _mapRefreshStats();
  }
}

function _mapRenderStats() {
  const opts = _mapGetInfoOpts();
  if (opts.length === 0) return '<div style="font-size:15px;color:var(--muted);flex:1;display:flex;align-items:center;justify-content:center">点击上方「📊 信息显示」选择要展示的统计</div>';
  const md = _ensureMapData();
  const locs = state.data.locations || [];
  const markers = md.locationMarkers.filter(m => locs.find(l => l.id === m.locationId));
  const markedLocs = markers.map(m => locs.find(l => l.id === m.locationId)).filter(Boolean);
  const groups = [];

  if (opts.includes('locCategory')) {
    const cats = {};
    markedLocs.forEach(l => { const c = l.category || '未分类'; cats[c] = (cats[c] || 0) + 1; });
    const entries = Object.entries(cats).sort((a, b) => b[1] - a[1]);
    if (entries.length > 0) groups.push({ title: '📍 地点类型分布', items: entries });
  }

  if (opts.includes('locFaction')) {
    const facs = {};
    markedLocs.forEach(l => { _normLinks(l.relatedFactions || []).forEach(f => { const fa = (state.data.factions || []).find(x => x.id === f.id); if (fa) facs[fa.name] = (facs[fa.name] || 0) + 1; }); });
    const entries = Object.entries(facs).sort((a, b) => b[1] - a[1]);
    if (entries.length > 0) groups.push({ title: '⚔️ 地点关联势力', items: entries });
  }

  if (opts.includes('locChar')) {
    const chars = {};
    markedLocs.forEach(l => { _normLinks(l.relatedCharacters || []).forEach(c => { const ch = (state.data.characters || []).find(x => x.id === c.id); if (ch) chars[ch.name] = (chars[ch.name] || 0) + 1; }); });
    const entries = Object.entries(chars).sort((a, b) => b[1] - a[1]);
    if (entries.length > 0) groups.push({ title: '👤 地点关联人物', items: entries });
  }

  if (opts.includes('terrFaction')) {
    const facs = {};
    md.territories.forEach(t => { (t.factionIds || []).forEach(fid => { const fa = (state.data.factions || []).find(x => x.id === fid); if (fa) facs[fa.name] = (facs[fa.name] || 0) + 1; }); });
    const entries = Object.entries(facs).sort((a, b) => b[1] - a[1]);
    if (entries.length > 0) groups.push({ title: '🛡️ 领地势力分布', items: entries });
  }

  if (opts.includes('terrChar')) {
    const chars = {};
    md.territories.forEach(t => { (t.characterIds || []).forEach(cid => { const ch = (state.data.characters || []).find(x => x.id === cid); if (ch) chars[ch.name] = (chars[ch.name] || 0) + 1; }); });
    const entries = Object.entries(chars).sort((a, b) => b[1] - a[1]);
    if (entries.length > 0) groups.push({ title: '👤 领地关联人物', items: entries });
  }

  if (opts.includes('terrLoc')) {
    const locMap = {};
    md.territories.forEach(t => { (t.locationIds || []).forEach(lid => { const l = (state.data.locations || []).find(x => x.id === lid); if (l) locMap[l.name] = (locMap[l.name] || 0) + 1; }); });
    const entries = Object.entries(locMap).sort((a, b) => b[1] - a[1]);
    if (entries.length > 0) groups.push({ title: '📍 领地关联地点', items: entries });
  }

  if (groups.length === 0) return '<div style="font-size:15px;color:var(--muted);flex:1;display:flex;align-items:center;justify-content:center">暂无统计数据</div>';

  const useColumns = groups.length >= 2;
  if (useColumns) {
    const half = Math.ceil(groups.length / 2);
    const left = groups.slice(0, half);
    const right = groups.slice(half);
    const renderCol = (gs) => gs.map(g => `<div class="fmap-stats-group"><div class="fmap-stats-group-title">${g.title}</div><div class="fmap-stats-group-items">${g.items.map(([k, v]) => `<span class="fmap-stats-item"><span class="label">${esc(k)}:</span><span class="value">${v}</span></span>`).join('')}</div></div>`).join('');
    return `<div style="flex:1;display:flex;gap:24px">${renderCol(left)}${renderCol(right)}</div>`;
  }

  return `<div style="flex:1">${groups.map(g => `<div class="fmap-stats-group"><div class="fmap-stats-group-title">${g.title}</div><div class="fmap-stats-group-items">${g.items.map(([k, v]) => `<span class="fmap-stats-item"><span class="label">${esc(k)}:</span><span class="value">${v}</span></span>`).join('')}</div></div>`).join('')}</div>`;
}