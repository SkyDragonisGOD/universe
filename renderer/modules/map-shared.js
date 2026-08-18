// ============================================================
// 架空地图 — 共享常量、状态与工具函数
// ============================================================

let _mapApp = null;
let _mapContainer = null;
let _mapViewport = null;
let _mapMode = 'select';
let _mapSelectedId = null;
let _mapPanData = null;
let _mapLocPlaceMode = false;
let _mapTerritoryIdCounter = 0;
let _terrainCache = null;

const _MAP_W = 1000;
const _MAP_H = 500;

function _mapUid() { return 'tp_' + Date.now() + '_' + (_mapTerritoryIdCounter++); }

function _mapVP() {
  if (!_mapViewport) _mapViewport = { zoom: 1, panX: 0, panY: 0 };
  return _mapViewport;
}

function _mapCssToStage(cssX, cssY) {
  if (!_mapApp || !_mapApp.canvas) return { x: cssX, y: cssY };
  const rect = _mapApp.canvas.getBoundingClientRect();
  return { x: (cssX - rect.left) * (_MAP_W / rect.width), y: (cssY - rect.top) * (_MAP_H / rect.height) };
}

function _mapStageToCss(sx, sy) {
  if (!_mapApp || !_mapApp.canvas) return { x: sx, y: sy };
  const rect = _mapApp.canvas.getBoundingClientRect();
  return { x: rect.left + sx * (rect.width / _MAP_W), y: rect.top + sy * (rect.height / _MAP_H) };
}

function _mapScreenToWorld(sx, sy) {
  const vp = _mapVP();
  return { x: (sx - vp.panX) / vp.zoom, y: (sy - vp.panY) / vp.zoom };
}

function _ensureMapData() {
  if (!state.data.worldMap) state.data.worldMap = { seed: 0, genCount: 12, territories: [], locationMarkers: [], nextId: 1 };
  const md = state.data.worldMap;
  if (!md.territories) md.territories = [];
  if (!md.locationMarkers) md.locationMarkers = [];
  if (!md.nextId) md.nextId = md.territories.length + 1;
  if (!md.seed) md.seed = 0;
  if (!md.genCount) md.genCount = 12;
  md.territories.forEach(t => {
    if (!t.factionIds) t.factionIds = t.factionId ? [t.factionId] : [];
    if (!t.locationIds) t.locationIds = t.locationId ? [t.locationId] : [];
    if (!t.characterIds) t.characterIds = [];
    if (!t.backpackItems) t.backpackItems = {};
    delete t.factionId;
    delete t.locationId;
    delete t.worldSystemIds;
  });
  md.locationMarkers.forEach(m => {
    if (!m.icon) m.icon = '📍';
  });
  return md;
}

function _hslToHex(h, s, l) {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = n => { const k = (n + h / 30) % 12; return l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1); };
  const toHex = x => Math.round(x * 255).toString(16).padStart(2, '0');
  return '#' + toHex(f(0)) + toHex(f(8)) + toHex(f(4));
}