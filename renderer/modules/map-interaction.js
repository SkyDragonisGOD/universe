// ============================================================
// 架空地图 — 视口控制与交互
// ============================================================

function _clampViewport() {
  if (!_mapApp || !_mapApp.canvas) return;
  const vp = _mapVP();
  const mw = _MAP_W * vp.zoom;
  const mh = _MAP_H * vp.zoom;
  if (vp.panX > 0) vp.panX = 0;
  if (vp.panX < _MAP_W - mw) vp.panX = _MAP_W - mw;
  if (vp.panY > 0) vp.panY = 0;
  if (vp.panY < _MAP_H - mh) vp.panY = _MAP_H - mh;
}

function _mapApplyViewport() {
  if (!_mapContainer) return;
  const vp = _mapVP();
  _mapContainer.position.set(vp.panX, vp.panY);
  _mapContainer.scale.set(vp.zoom);
}

function _mapResetView() {
  const vp = _mapVP();
  vp.zoom = 1; vp.panX = 0; vp.panY = 0;
  _clampViewport();
  _mapApplyViewport();
  _updateZoomLabel();
}

function _updateZoomLabel() {
  const label = $('#map-zoom-label');
  if (label) label.textContent = Math.round(_mapVP().zoom * 100) + '%';
}

function _setupMapInteraction() {
  if (!_mapApp) return;
  const stage = _mapApp.stage;
  stage.eventMode = 'static';
  stage.hitArea = new PIXI.Rectangle(-100000, -100000, 200000, 200000);

  stage.on('pointerdown', (e) => {
    const g = e.global;
    if (_mapMode === 'placeLoc' && e.button === 0) {
      const world = _mapScreenToWorld(g.x, g.y);
      _mapPlaceLocation(world.x, world.y);
      _mapSetMode('select');
      return;
    }
    if (e.button === 0 || e.button === 1) {
      const rect = _mapApp.canvas.getBoundingClientRect();
      const scaleX = _MAP_W / rect.width;
      const scaleY = _MAP_H / rect.height;
      _mapPanData = { startX: e.clientX, startY: e.clientY, startPanX: _mapVP().panX, startPanY: _mapVP().panY, scaleX, scaleY };
    }
  });

  stage.on('pointermove', (e) => {
    if (_mapPanData) {
      const dx = (e.clientX - _mapPanData.startX) * _mapPanData.scaleX;
      const dy = (e.clientY - _mapPanData.startY) * _mapPanData.scaleY;
      _mapVP().panX = _mapPanData.startPanX + dx;
      _mapVP().panY = _mapPanData.startPanY + dy;
      _clampViewport();
      _mapApplyViewport();
    }
  });

  stage.on('pointerup', () => { _mapPanData = null; });
  stage.on('pointerupoutside', () => { _mapPanData = null; });

  const canvas = _mapApp.canvas;
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (_MAP_W / rect.width);
    const my = (e.clientY - rect.top) * (_MAP_H / rect.height);
    const vp = _mapVP();
    const oldZoom = vp.zoom;
    const delta = e.deltaY > 0 ? -0.08 : 0.08;
    vp.zoom = Math.max(1, Math.min(8, vp.zoom + delta));
    vp.panX = mx - (mx - vp.panX) * (vp.zoom / oldZoom);
    vp.panY = my - (my - vp.panY) * (vp.zoom / oldZoom);
    _clampViewport();
    _mapApplyViewport();
    _updateZoomLabel();
  }, { passive: false });

  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
}