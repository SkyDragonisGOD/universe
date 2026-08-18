// ============================================================
// 架空地图 — 存档导入导出
// ============================================================

async function _mapSaveToResource() {
  const md = _ensureMapData();
  const json = JSON.stringify({ seed: md.seed, genCount: md.genCount, territories: md.territories, locationMarkers: md.locationMarkers, nextId: md.nextId }, null, 2);
  let imageData = '';
  if (_terrainCache) {
    const terrainCanvas = _renderTerrainCanvas();
    if (terrainCanvas) {
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = _MAP_W;
      exportCanvas.height = _MAP_H;
      const ectx = exportCanvas.getContext('2d');
      ectx.drawImage(terrainCanvas, 0, 0);
      for (const m of md.locationMarkers) {
        const loc = (state.data.locations || []).find(l => l.id === m.locationId);
        if (!loc) continue;
        const icon = m.icon || '📍';
        ectx.font = '14px Microsoft YaHei, sans-serif';
        ectx.textAlign = 'center';
        ectx.fillText(icon, m.x, m.y + 5);
        ectx.font = 'bold 10px Microsoft YaHei, sans-serif';
        ectx.fillStyle = '#1a1a1a';
        ectx.fillText(loc.name.slice(0, 8), m.x, m.y - 8);
      }
      for (const t of md.territories) {
        const lx = t.centerX != null ? t.centerX : (t.seedX || 0);
        const ly = t.centerY != null ? t.centerY : (t.seedY || 0);
        if (!lx && !ly) continue;
        ectx.font = 'bold 13px Microsoft YaHei, sans-serif';
        ectx.textAlign = 'center';
        ectx.fillStyle = '#222222';
        ectx.strokeStyle = '#ffffff';
        ectx.lineWidth = 3;
        ectx.strokeText(t.name, lx, ly);
        ectx.fillText(t.name, lx, ly);
      }
      imageData = exportCanvas.toDataURL('image/png');
    }
  }
  if (!state.data.resources) state.data.resources = [];

  const existingMapRes = (state.data.resources || []).filter(r => r.mapData);
  let saveTarget = null;

  if (existingMapRes.length > 0) {
    const items = [{ id: '__new__', name: '➕ 新建存储' }, ...existingMapRes.map(r => ({ id: r.id, name: r.title + ' (' + (r.category || '') + ')' }))];
    const result = await customSelectModal('💾 选择保存方式', items, []);
    if (!result || result.length === 0) return;
    if (result[0] === '__new__') {
      saveTarget = null;
    } else {
      saveTarget = existingMapRes.find(r => r.id === result[0]);
    }
  }

  if (saveTarget) {
    saveTarget.mapData = json;
    if (imageData) saveTarget.imageData = imageData;
    saveTarget.title = '世界地图 ' + new Date().toLocaleDateString('zh-CN');
    autoSave();
    showToast('地图已更新保存到资源库存');
  } else {
    const res = {
      id: uid(),
      title: '世界地图 ' + new Date().toLocaleDateString('zh-CN'),
      category: '世界地图',
      note: '架空地图模拟器导出',
      imageData,
      mapData: json,
      customProps: {},
      linkedEntries: [],
    };
    state.data.resources.push(res);
    autoSave();
    showToast('地图已保存到资源库存');
  }
}

async function _mapLoadFromResource() {
  const resources = (state.data.resources || []).filter(r => r.mapData || r.category === '世界地图');
  if (resources.length === 0) { showToast('资源库存中暂无地图数据'); return; }
  const items = resources.map(r => ({ id: r.id, name: r.title + ' (' + (r.category || '') + ')' }));
  const result = await customSelectModal('📂 选择要导入的地图', items, []);
  if (!result || result.length === 0) return;
  const res = resources.find(r => r.id === result[0]);
  if (!res || !res.mapData) { showToast('该资源无地图数据'); return; }
  try {
    const data = JSON.parse(res.mapData);
    const md = _ensureMapData();
    if (data.seed) md.seed = data.seed;
    if (data.genCount) md.genCount = data.genCount;
    if (data.territories) md.territories = data.territories;
    if (data.locationMarkers) md.locationMarkers = data.locationMarkers;
    if (data.nextId) md.nextId = data.nextId;
    _terrainCache = null;
    autoSave();
    await _mapFullRender();
    _updateTerritoryPanel();
    _updateLocListPanel();
    showToast('地图已导入');
  } catch (e) {
    showToast('导入失败: 数据格式错误');
  }
}

async function _mapClearAll() {
  const ok = await customConfirm('确定清空所有领地和地点标注？此操作不可撤销。');
  if (!ok) return;
  const md = _ensureMapData();
  md.territories = [];
  md.locationMarkers = [];
  md.nextId = 1;
  md.seed = 0;
  _mapSelectedId = null;
  _terrainCache = null;
  autoSave();
  await _mapFullRender();
  _updateTerritoryPanel();
  _updateLocListPanel();
  showToast('地图已清空');
}