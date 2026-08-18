// ============================================================
// 世界生成器 — 关系图表 · 数据层
// 依赖: core/state.js, core/utils.js
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
      conns.push({from:r.sourceId,to:r.targetId,desc:r.type||r.description||'',fromType:'character',toType:'character',isExplicit:true,relationId:r.id,isCharRelation:true});
    }
  });

  (state.data.entityRelations||[]).forEach(r => {
    if (idSet.has(r.fromId) && idSet.has(r.toId)) {
      conns.push({from:r.fromId,to:r.toId,desc:r.type||r.description||'',fromType:r.fromType,toType:r.toType,isExplicit:true,relationId:r.id,isEntityRelation:true});
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

function _getGraphPositions() {
  if (!state._graphPositions) state._graphPositions = {};
  return state._graphPositions;
}