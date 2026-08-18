// ============================================================
// 世界生成器 — 架空地图模拟器 (主入口)
// 依赖: pixi.js v8, map-shared, map-terrain, map-interaction,
//        map-territory, map-location, map-stats, map-io
// ============================================================

async function _mapFullRender() {
  if (!_mapContainer || !_mapApp) return;
  _mapContainer.removeChildren();
  const md = _ensureMapData();

  if (!_terrainCache && md.seed) _regenerateTerrain();

  if (_terrainCache) {
    const terrainCanvas = _renderTerrainCanvas();
    if (terrainCanvas) {
      const texture = PIXI.Texture.from(terrainCanvas);
      const sprite = new PIXI.Sprite(texture);
      sprite.eventMode = 'static';
      sprite.cursor = 'pointer';
      sprite.on('pointerdown', (e) => {
        if (_mapMode === 'select' && e.button === 0) {
          const g = e.global;
          const world = _mapScreenToWorld(g.x, g.y);
          const t = _getTerrainAt(world.x, world.y);
          if (t) {
            e.stopPropagation();
            _mapSelectTerritory(t.id);
          } else {
            _mapDeselectTerritory();
          }
        }
      });
      _mapContainer.addChild(sprite);
    }
  } else {
    const bgGfx = new PIXI.Graphics();
    bgGfx.rect(0, 0, _MAP_W, _MAP_H);
    bgGfx.fill({ color: 0xffffff });
    _mapContainer.addChild(bgGfx);
    const hint = new PIXI.Text({
      text: '在右侧面板设置种子和数量，点击「生成地形」开始',
      style: { fontSize: 16, fontFamily: 'Microsoft YaHei, sans-serif', fill: 0x999999, fontWeight: 'normal' }
    });
    hint.anchor.set(0.5);
    hint.x = _MAP_W / 2;
    hint.y = _MAP_H / 2;
    _mapContainer.addChild(hint);
  }

  const labelLayer = new PIXI.Container();
  for (const t of md.territories) {
    const lx = t.centerX != null ? t.centerX : (t.seedX || 0);
    const ly = t.centerY != null ? t.centerY : (t.seedY || 0);
    if (!lx && !ly) continue;
    const label = new PIXI.Text({
      text: t.name,
      style: {
        fontSize: 13, fontFamily: 'Microsoft YaHei, sans-serif', fill: 0x222222, fontWeight: 'bold',
        dropShadow: { alpha: 0.75, blur: 3, distance: 1, color: 0xffffff }
      }
    });
    label.anchor.set(0.5);
    label.x = lx; label.y = ly;
    label.eventMode = 'static';
    label.cursor = 'pointer';
    label._territoryId = t.id;
    label.on('pointerdown', (e) => {
      if (_mapMode === 'select') {
        e.stopPropagation();
        _mapSelectTerritory(t.id);
      }
    });
    labelLayer.addChild(label);
  }
  _mapContainer.addChild(labelLayer);

  const locGfx = new PIXI.Graphics();
  const locLabelLayer = new PIXI.Container();
  for (const m of md.locationMarkers) {
    const loc = (state.data.locations || []).find(l => l.id === m.locationId);
    if (!loc) continue;
    const icon = m.icon || '📍';
    const iconLabel = new PIXI.Text({
      text: icon,
      style: { fontSize: 14, fontFamily: 'Microsoft YaHei, sans-serif' }
    });
    iconLabel.anchor.set(0.5);
    iconLabel.x = m.x; iconLabel.y = m.y;
    iconLabel.eventMode = 'static';
    iconLabel.cursor = 'pointer';
    iconLabel._locationId = m.locationId;
    iconLabel.on('pointerdown', (e) => {
      e.stopPropagation();
      _mapShowLocCard(m.locationId, e);
    });
    locGfx.addChild(iconLabel);
    const locLabel = new PIXI.Text({
      text: loc.name.slice(0, 8),
      style: {
        fontSize: 10, fontFamily: 'Microsoft YaHei, sans-serif', fill: 0x1a1a1a, fontWeight: 'bold',
        dropShadow: { alpha: 0.7, blur: 2, distance: 1, color: 0xffffff }
      }
    });
    locLabel.anchor.set(0.5);
    locLabel.x = m.x; locLabel.y = m.y - 12;
    locLabel.eventMode = 'static';
    locLabel.cursor = 'pointer';
    locLabel._locationId = m.locationId;
    locLabel.on('pointerdown', (e) => {
      e.stopPropagation();
      _mapShowLocCard(m.locationId, e);
    });
    locLabelLayer.addChild(locLabel);
  }
  _mapContainer.addChild(locGfx);
  _mapContainer.addChild(locLabelLayer);
}

function renderMap() {
  const md = _ensureMapData();
  const locs = state.data.locations || [];
  const markers = md.locationMarkers.filter(m => locs.find(l => l.id === m.locationId));
  const terrCount = md.territories.length;

  return `<div class="fmap-layout">
    <div class="fmap-toolbar">
      <div class="fmap-toolbar-left">
        <span style="font-size:14px;font-weight:600">🗺️ 架空地图模拟器</span>
        <span class="text-xs text-muted" style="margin-left:4px">${terrCount} 领地 · ${markers.length} 地点</span>
      </div>
      <div class="fmap-toolbar-right">
        <button class="btn btn-xs fmap-mode-btn btn-primary" data-mode="select" onclick="_mapSetMode('select')">🖱️ 选择</button>
        <button class="btn btn-xs fmap-mode-btn btn-outline" data-mode="placeLoc" onclick="_mapSetMode('placeLoc')">📍 标注地点</button>
        <span style="width:1px;height:20px;background:var(--border)"></span>
        <div style="position:relative" id="fmap-info-toggle-wrap">
          <button class="btn btn-xs btn-outline" onclick="_mapToggleInfoDropdown()">📊 信息显示</button>
        </div>
        <span style="width:1px;height:20px;background:var(--border)"></span>
        <button class="btn btn-xs btn-outline" onclick="_mapResetView()">📐 重置视角</button>
        <span id="map-zoom-label" style="font-size:11px;min-width:36px;text-align:center;color:var(--muted)">100%</span>
      </div>
    </div>
    <div class="fmap-main">
      <div class="fmap-left" id="map-stats-area">
        <div class="fmap-canvas-wrap">
          <div id="map-pixi-container" class="fmap-canvas"></div>
        </div>
        <div class="fmap-stats-content">
          ${_mapRenderStats()}
        </div>
      </div>
      <div class="fmap-sidebar">
        <div class="fmap-sidebar-section">
          <h4 style="font-size:12px;margin-bottom:6px">🎲 地形生成</h4>
          <div class="fmap-param"><label>种子</label><input type="number" id="map-gen-seed" value="${md.seed || ''}" placeholder="随机" style="width:70px;padding:2px 4px;font-size:11px;border:1px solid var(--border);border-radius:var(--radius-xs)"><button class="btn btn-xs btn-icon" onclick="document.getElementById('map-gen-seed').value=Math.floor(Math.random()*999999)+1" title="随机种子">🎲</button></div>
          <div class="fmap-param"><label>数量</label><input type="range" id="map-gen-count" min="3" max="30" step="1" value="${md.genCount || 12}" oninput="document.getElementById('map-gen-count-val').textContent=this.value"><span id="map-gen-count-val">${md.genCount || 12}</span></div>
          <button class="btn btn-sm btn-primary" style="width:100%;margin-top:4px" onclick="_generateRandomTerritories(parseInt(document.getElementById('map-gen-count').value),parseInt(document.getElementById('map-gen-seed').value)||0)">🌍 生成地形</button>
        </div>
        <div class="fmap-sidebar-section">
          <h4 style="font-size:12px;margin-bottom:6px" class="fmap-terr-list-header">🏷️ 领地列表 (${terrCount})</h4>
          <div id="map-territory-list" class="fmap-loc-list" style="max-height:120px;overflow-y:auto">${terrCount === 0 ? '<div class="text-sm text-muted">暂无领地</div>' : md.territories.map(t => {
            const isSelected = _mapSelectedId === t.id;
            return `<div class="fmap-loc-item" style="cursor:pointer;${isSelected ? 'background:var(--bg-alt);' : ''}" onclick="_mapHighlightTerritory('${esc(t.id)}')"><span><span class="dot" style="background:${t.color||'#888'};width:8px;height:8px;border-radius:50%;display:inline-block;margin-right:4px"></span>${esc(t.name)}</span></div>`;
          }).join('')}</div>
        </div>
        <div class="fmap-sidebar-section" id="map-territory-detail-section">
          <div class="flex-between" style="margin-bottom:6px"><h4 style="font-size:12px;margin:0">🏷️ 领地详情</h4><button class="btn btn-xs btn-outline" id="map-terr-detail-toggle" onclick="_toggleTerritoryDetail()">收起</button></div>
          <div id="map-territory-info"><div class="text-sm text-muted" style="padding:6px">点击领地查看/编辑详情</div></div>
        </div>
        <div class="fmap-sidebar-section">
          <h4 style="font-size:12px;margin-bottom:6px" class="fmap-loc-header">📍 已标注地点 (${markers.length})</h4>
          <div id="map-loc-list" class="fmap-loc-list">${markers.length === 0 ? '<div class="text-sm text-muted">暂无标注地点</div>' : markers.map(m => {
            const loc = locs.find(l => l.id === m.locationId);
            const icon = m.icon || '📍';
            return `<div class="fmap-loc-item" style="cursor:pointer" onclick="_mapHighlightLoc('${esc(m.locationId)}')"><span>${icon} ${esc(loc ? loc.name : '未知')}</span><div style="display:flex;gap:2px"><button class="btn btn-xs btn-icon" style="font-size:10px" onclick="event.stopPropagation();_mapEditLocIcon('${esc(m.locationId)}')">🎨</button><button class="btn btn-xs btn-icon btn-danger" onclick="event.stopPropagation();_mapRemoveLocationMarker('${esc(m.locationId)}')">×</button></div></div>`;
          }).join('')}</div>
        </div>
        <div class="fmap-sidebar-section">
          <h4 style="font-size:12px;margin-bottom:6px">💾 存档</h4>
          <div style="display:flex;flex-direction:column;gap:4px">
            <button class="btn btn-xs btn-outline" style="width:100%" onclick="_mapSaveToResource()">📤 保存到资源库</button>
            <button class="btn btn-xs btn-outline" style="width:100%" onclick="_mapLoadFromResource()">📥 从资源库导入</button>
            <button class="btn btn-xs btn-danger" style="width:100%" onclick="_mapClearAll()">🗑️ 清空地图</button>
          </div>
        </div>
      </div>
    </div>
  </div>`;
}

async function setupMap() {
  _mapApp = null;
  _mapContainer = null;
  _mapViewport = null;
  _mapMode = 'select';
  _mapSelectedId = null;
  _mapPanData = null;
  _mapLocPlaceMode = false;
  _terrainCache = null;

  const container = $('#map-pixi-container');
  if (!container) return;

  if (typeof PIXI === 'undefined') {
    container.innerHTML = '<div class="empty-state"><div class="icon">⚠️</div><p>PixiJS 未加载</p></div>';
    return;
  }

  try {
    const app = new PIXI.Application();
    await app.init({
      width: _MAP_W, height: _MAP_H,
      background: 0xffffff,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      preference: 'webgl'
    });
    container.innerHTML = '';
    container.appendChild(app.canvas);
    app.canvas.style.width = '100%';
    app.canvas.style.height = 'auto';
    app.canvas.style.display = 'block';

    _mapContainer = new PIXI.Container();
    app.stage.addChild(_mapContainer);
    _mapApp = app;

    _setupMapInteraction();
    _mapApplyViewport();
    await _mapFullRender();
    _updateTerritoryListPanel();
    _updateLocListPanel();

  } catch (err) {
    console.error('[FantasyMap] PixiJS init error:', err);
    container.innerHTML = '<div class="empty-state"><div class="icon">⚠️</div><p>初始化失败: ' + esc(err.message) + '</p></div>';
  }
}

function destroyMap() {
  if (_mapApp) {
    _mapApp.destroy(true);
    _mapApp = null;
  }
  _mapContainer = null;
  _mapViewport = null;
  _mapMode = 'select';
  _mapSelectedId = null;
  _mapPanData = null;
  _mapLocPlaceMode = false;
  _terrainCache = null;
}