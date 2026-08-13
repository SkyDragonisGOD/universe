// ============================================================
// 世界生成器 — 工具函数
// ============================================================

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);
function uid() { return 'id_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8); }
function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
function jsStr(s) { return String(s||'').replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/\n/g,'\\n').replace(/\r/g,''); }
function fmtDate(s) { if (!s) return ''; const d = new Date(s); return d.toLocaleDateString('zh-CN',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}); }
function autoSave() { clearTimeout(state._saveTimer); state._saveTimer = setTimeout(() => { if (state.currentProjectId && state.data) window.api.saveProject(state.currentProjectId, state.data); }, 500); }
function ensureData(key, defaultValue) { if (state.data[key] === undefined) state.data[key] = defaultValue; return state.data[key]; }
function checkDuplicate(collection, name, excludeId) { if (!name || !name.trim()) return false; return (collection || []).some(item => item.name === name.trim() && item.id !== excludeId); }

function _normLinks(arr) {
  if (!arr) return [];
  return arr.map(x => {
    if (typeof x === 'string') return { id: x, desc: '' };
    if (x && typeof x === 'object' && x.id) return { id: x.id, desc: x.desc || '' };
    return null;
  }).filter(Boolean);
}

function _linkIds(arr) { return _normLinks(arr).map(l => l.id); }

function _findLink(arr, id) { return _normLinks(arr).find(l => l.id === id); }

function _setLink(arr, id, desc) {
  const links = _normLinks(arr);
  const existing = links.find(l => l.id === id);
  if (existing) { existing.desc = desc || existing.desc || ''; }
  else { links.push({ id, desc: desc || '' }); }
  return links;
}

function _removeLink(arr, id) { return _normLinks(arr).filter(l => l.id !== id); }

function syncLink(sourceType, sourceId, targetField, targetIds, desc, oldTargetIds) {
  const d = state.data;
  if (!d) return;
  const added = targetIds.filter(id => !oldTargetIds.includes(id));
  const removed = oldTargetIds.filter(id => !targetIds.includes(id));
  const reverseMap = {
    character: { factions: { reverseField: 'members', targetType: 'faction' }, locations: { reverseField: 'relatedCharacters', targetType: 'location' }, relatedEvents: { reverseField: 'characters', targetType: 'event' } },
    faction: { members: { reverseField: 'factions', targetType: 'character' }, headquarters: { reverseField: 'relatedFactions', targetType: 'location' }, rivals: { reverseField: 'rivals', targetType: 'faction' }, allies: { reverseField: 'allies', targetType: 'faction' }, relatedEvents: { reverseField: 'factions', targetType: 'event' } },
    location: { relatedCharacters: { reverseField: 'locations', targetType: 'character' }, events: { reverseField: 'locations', targetType: 'event' }, relatedFactions: { reverseField: 'headquarters', targetType: 'faction' } },
    event: { characters: { reverseField: 'relatedEvents', targetType: 'character' }, factions: { reverseField: 'relatedEvents', targetType: 'faction' }, locations: { reverseField: 'events', targetType: 'location' }, prerequisites: { reverseField: 'followUpEvents', targetType: 'event' }, followUpEvents: { reverseField: 'prerequisites', targetType: 'event' } },
    race: { regions: { reverseField: 'relatedRaces', targetType: 'location' }, relatedCharacters: { reverseField: 'race', targetType: 'character' } }
  };
  const mapping = reverseMap[sourceType] && reverseMap[sourceType][targetField];
  if (!mapping) return;
  const reverseField = mapping.reverseField;
  const targetType = mapping.targetType;
  const targetCollectionMap = { character: 'characters', faction: 'factions', location: 'locations', event: 'timeline', race: 'races' };
  const tColl = d[targetCollectionMap[targetType]];
  added.forEach(tid => {
    const targetEntity = tColl ? tColl.find(e => e.id === tid) : null;
    if (targetEntity) {
      if (!targetEntity[reverseField]) targetEntity[reverseField] = [];
      const existing = _findLink(targetEntity[reverseField], sourceId);
      if (!existing) {
        targetEntity[reverseField] = _setLink(targetEntity[reverseField], sourceId, desc || '');
      }
    }
  });
  removed.forEach(tid => {
    const targetEntity = tColl ? tColl.find(e => e.id === tid) : null;
    if (targetEntity && targetEntity[reverseField]) {
      targetEntity[reverseField] = _removeLink(targetEntity[reverseField], sourceId);
    }
  });
}

function getLinkDesc(arr, id) { const link = _findLink(arr, id); return link ? link.desc : ''; }