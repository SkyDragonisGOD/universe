// ============================================================
// 世界生成器 — 词条化 & 变体系统
// ============================================================

const _WIKI_ENTITY_MAP = [
  { type: 'character', icon: '👤', getData: () => state.data.characters || [], nameKey: 'name' },
  { type: 'faction', icon: '🏰', getData: () => state.data.factions || [], nameKey: 'name' },
  { type: 'location', icon: '📍', getData: () => state.data.locations || [], nameKey: 'name' },
  { type: 'race', icon: '🧬', getData: () => state.data.races || [], nameKey: 'name' },
  { type: 'item', icon: '📦', getData: () => state.data.items || [], nameKey: 'name' },
  { type: 'event', icon: '⚡', getData: () => state.data.timeline || [], nameKey: 'name' },
  { type: 'worldSystem', icon: '🌍', getData: () => state.data.worldBackpacks || [], nameKey: 'name' },
  { type: 'power', icon: '🔮', getData: () => (state.data.powers || []), nameKey: 'name' },
];

const _WIKI_MARKER_OPEN = '\u27E6';
const _WIKI_MARKER_CLOSE = '\u27E7';
const _WIKI_MARKER_END = _WIKI_MARKER_OPEN + '/' + _WIKI_MARKER_CLOSE;

function _buildWikiNameIndex() {
  const index = {};
  for (const def of _WIKI_ENTITY_MAP) {
    const items = def.getData();
    for (const item of items) {
      const name = item[def.nameKey] || item.title;
      if (!name) continue;
      const lower = name.toLowerCase();
      if (!index[lower]) index[lower] = [];
      index[lower].push({ type: def.type, id: item.id, name, icon: def.icon });
    }
  }
  const allVariants = state.data.entityVariants || [];
  for (const v of allVariants) {
    if (!v.name) continue;
    const lower = v.name.toLowerCase();
    if (!index[lower]) index[lower] = [];
    index[lower].push({ type: 'variant', id: v.id, name: v.name, icon: _variantIcon(v), parentType: v.parentType, parentId: v.parentId });
  }
  return index;
}

function _variantIcon(v) {
  return v.variantType === 'historical' ? '📜' : '🔄';
}

function _findWikiMatchesInText(text) {
  const index = _buildWikiNameIndex();
  const lower = text.toLowerCase();
  const found = [];
  const seen = new Set();
  for (const key in index) {
    if (!index.hasOwnProperty(key)) continue;
    let searchFrom = 0;
    while (true) {
      const pos = lower.indexOf(key, searchFrom);
      if (pos === -1) break;
      const matchedText = text.substring(pos, pos + key.length);
      for (const m of index[key]) {
        const uid = m.type + ':' + m.id + '@' + pos;
        if (!seen.has(uid)) {
          seen.add(uid);
          found.push({ ...m, pos, len: key.length, matchedText });
        }
      }
      searchFrom = pos + 1;
    }
  }
  found.sort((a, b) => b.len - a.len || a.pos - b.pos);
  return found;
}

function _findExistingWikiLinksInSelection(target, selStart, selEnd) {
  const value = target.value;
  const mo = _WIKI_MARKER_OPEN;
  const mc = _WIKI_MARKER_CLOSE;
  const me = _WIKI_MARKER_END;
  const links = [];
  let startIdx = 0;
  while (true) {
    const openPos = value.indexOf(mo, startIdx);
    if (openPos === -1) break;
    const closePos = value.indexOf(mc, openPos + mo.length);
    if (closePos === -1) break;
    const endPos = value.indexOf(me, closePos + mc.length);
    if (endPos === -1) break;
    const linkedText = value.substring(closePos + mc.length, endPos);
    const ref = value.substring(openPos + mo.length, closePos);
    if (openPos < selEnd && endPos > selStart) {
      links.push({ openPos, closePos, endPos, ref, linkedText });
    }
    startIdx = closePos + 1;
  }
  return links;
}

function _showWikiContextMenu(e) {
  const sel = window.getSelection();
  const selectedText = sel ? sel.toString().trim() : '';
  if (!selectedText) return;
  const target = e.target;
  const isEditable = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
  if (!isEditable) return;
  e.preventDefault();
  e.stopPropagation();
  const existing = document.querySelector('.wiki-ctx-menu');
  if (existing) existing.remove();

  const matches = _findWikiMatchesInText(selectedText);
  const selStart = target.selectionStart;
  const selEnd = target.selectionEnd;
  const existingLinks = _findExistingWikiLinksInSelection(target, selStart, selEnd);

  const menu = document.createElement('div');
  menu.className = 'wiki-ctx-menu';
  let html = '';

  if (matches.length > 0) {
    html += `<div class="wiki-ctx-group-label">🔗 词条化</div>`;
    if (matches.length === 1) {
      const m = matches[0];
      if (m.type === 'variant') {
        html += `<div class="wiki-ctx-item" data-action="link" data-type="${esc(m.parentType)}" data-id="${esc(m.parentId)}" data-variant="${esc(m.id)}" data-match-text="${esc(m.matchedText)}" data-match-pos="${m.pos}">${m.icon} ${esc(m.name)}（变体）</div>`;
      } else {
        html += `<div class="wiki-ctx-item" data-action="link" data-type="${esc(m.type)}" data-id="${esc(m.id)}" data-match-text="${esc(m.matchedText)}" data-match-pos="${m.pos}">${m.icon} ${esc(m.name)}</div>`;
      }
    } else {
      html += `<div class="wiki-ctx-sub">`;
      for (const m of matches) {
        if (m.type === 'variant') {
          html += `<label class="wiki-ctx-check"><input type="checkbox" data-action="link" data-type="${esc(m.parentType)}" data-id="${esc(m.parentId)}" data-variant="${esc(m.id)}" data-match-text="${esc(m.matchedText)}" data-match-pos="${m.pos}">${m.icon} ${esc(m.name)}（变体）</label>`;
        } else {
          html += `<label class="wiki-ctx-check"><input type="checkbox" data-action="link" data-type="${esc(m.type)}" data-id="${esc(m.id)}" data-match-text="${esc(m.matchedText)}" data-match-pos="${m.pos}">${m.icon} ${esc(m.name)}</label>`;
        }
      }
      html += `</div>`;
      html += `<div class="wiki-ctx-item wiki-ctx-apply" data-action="apply-links">✓ 应用勾选</div>`;
    }
  } else {
    html += `<div class="wiki-ctx-item disabled">未找到匹配词条</div>`;
  }

  if (existingLinks.length > 0) {
    html += `<div class="wiki-ctx-sep"></div>`;
    html += `<div class="wiki-ctx-group-label">✕ 取消词条化</div>`;
    if (existingLinks.length === 1) {
      const lk = existingLinks[0];
      html += `<div class="wiki-ctx-item" data-action="unlink" data-unlink-idx="0">${esc(lk.linkedText)}</div>`;
    } else {
      html += `<div class="wiki-ctx-sub">`;
      existingLinks.forEach((lk, i) => {
        html += `<label class="wiki-ctx-check"><input type="checkbox" data-action="unlink" data-unlink-idx="${i}">${esc(lk.linkedText)}</label>`;
      });
      html += `</div>`;
      html += `<div class="wiki-ctx-item wiki-ctx-apply" data-action="apply-unlinks">✓ 应用勾选</div>`;
    }
  }

  menu.innerHTML = html;
  document.body.appendChild(menu);
  let left = e.clientX;
  let top = e.clientY;
  requestAnimationFrame(() => {
    const rect = menu.getBoundingClientRect();
    left = Math.min(left, window.innerWidth - rect.width - 8);
    top = Math.min(top, window.innerHeight - rect.height - 8);
    menu.style.left = left + 'px';
    menu.style.top = top + 'px';
  });
  const closeMenu = () => { menu.remove(); document.removeEventListener('click', closeMenu); };
  menu.onclick = (ev) => {
    const item = ev.target.closest('.wiki-ctx-item');
    if (!item) return;
    if (item.classList.contains('disabled')) return;
    const action = item.dataset.action;
    if (action === 'link') {
      const type = item.dataset.type;
      const id = item.dataset.id;
      const variantId = item.dataset.variant || '';
      const matchText = item.dataset.matchText;
      const matchPos = parseInt(item.dataset.matchPos);
      _applyWikiLink(target, matchText, matchPos, selStart, type, id, variantId);
      closeMenu();
    } else if (action === 'apply-links') {
      const checks = menu.querySelectorAll('[data-action="link"]:checked');
      if (checks.length === 0) { showToast('请先勾选要词条化的词'); return; }
      const items = Array.from(checks).map(cb => ({
        type: cb.dataset.type,
        id: cb.dataset.id,
        variantId: cb.dataset.variant || '',
        matchText: cb.dataset.matchText,
        matchPos: parseInt(cb.dataset.matchPos),
      }));
      items.sort((a, b) => b.matchPos - a.matchPos);
      for (const it of items) {
        _applyWikiLink(target, it.matchText, it.matchPos, selStart, it.type, it.id, it.variantId);
      }
      closeMenu();
    } else if (action === 'unlink') {
      const idx = parseInt(item.dataset.unlinkIdx);
      _removeWikiLinkByIndex(target, existingLinks, [idx]);
      closeMenu();
    } else if (action === 'apply-unlinks') {
      const checks = menu.querySelectorAll('[data-action="unlink"]:checked');
      if (checks.length === 0) { showToast('请先勾选要取消词条化的词'); return; }
      const indices = Array.from(checks).map(cb => parseInt(cb.dataset.unlinkIdx));
      _removeWikiLinkByIndex(target, existingLinks, indices);
      closeMenu();
    }
  };
  setTimeout(() => { document.addEventListener('click', closeMenu); }, 50);
}

function _applyWikiLink(target, matchText, matchPosInSel, selStart, type, id, variantId) {
  if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
    const value = target.value;
    const actualPos = selStart + matchPosInSel;
    const before = value.substring(0, actualPos);
    const after = value.substring(actualPos + matchText.length);
    const linkMarker = _WIKI_MARKER_OPEN + type + ':' + id + (variantId ? '|v:' + variantId : '') + _WIKI_MARKER_CLOSE;
    target.value = before + linkMarker + matchText + _WIKI_MARKER_END + after;
    target.dispatchEvent(new Event('change', { bubbles: true }));
    showToast('已词条化: ' + matchText);
  }
}

function _removeWikiLinkByIndex(target, existingLinks, indices) {
  if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
    let value = target.value;
    const mo = _WIKI_MARKER_OPEN;
    const mc = _WIKI_MARKER_CLOSE;
    const me = _WIKI_MARKER_END;
    const toRemove = indices.map(i => existingLinks[i]).filter(Boolean);
    toRemove.sort((a, b) => b.openPos - a.openPos);
    for (const lk of toRemove) {
      value = value.substring(0, lk.openPos) + lk.linkedText + value.substring(lk.endPos + me.length);
    }
    target.value = value;
    target.dispatchEvent(new Event('change', { bubbles: true }));
    showToast('已取消词条化');
  }
}

function _renderLinkedContent(text) {
  if (!text) return '';
  const mo = _WIKI_MARKER_OPEN;
  const mc = _WIKI_MARKER_CLOSE;
  const me = _WIKI_MARKER_END;
  const moe = mo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const mce = mc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const mee = me.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const markerPattern = new RegExp(moe + '([^' + mce + ']+)' + mce + '([^' + moe + ']*?)' + mee, 'g');
  let result = '';
  let lastIndex = 0;
  let match;
  while ((match = markerPattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      result += esc(text.substring(lastIndex, match.index));
    }
    const ref = match[1];
    const linkedText = match[2];
    const parts = ref.split('|');
    const typeAndId = parts[0].split(':');
    const type = typeAndId[0];
    const id = typeAndId[1];
    const variantPart = parts.find(p => p.startsWith('v:'));
    const variantId = variantPart ? variantPart.substring(2) : '';
    if (variantId) {
      result += `<span class="wiki-link" onclick="_showVariantDetailPage('${esc(variantId)}')">${esc(linkedText)}</span>`;
    } else {
      result += `<span class="wiki-link" onclick="showPreviewCard('${esc(type)}','${esc(id)}',event)">${esc(linkedText)}</span>`;
    }
    lastIndex = markerPattern.lastIndex;
  }
  if (lastIndex < text.length) {
    result += esc(text.substring(lastIndex));
  }
  return result || esc(text);
}

function initWikiLinkSystem() {
  document.addEventListener('contextmenu', (e) => {
    const sel = window.getSelection();
    const selectedText = sel ? sel.toString().trim() : '';
    if (!selectedText) return;
    const target = e.target;
    const isEditable = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
    if (!isEditable) return;
    _showWikiContextMenu(e);
  });
}

// ============================================================
// 变体系统
// ============================================================

function _saveDetailScrollPos() {
  const scrollArea = document.querySelector('.detail-scroll-area');
  if (scrollArea) {
    if (!state._detailScrollMap) state._detailScrollMap = {};
    const key = state._selectedVariantId || (state.activeTab + ':' + (state.selectedCharacterId || state.selectedFactionId || state.selectedLocationId || state.selectedRaceId || state.selectedEventId || state.selectedItemId || ''));
    state._detailScrollMap[key] = scrollArea.scrollTop;
  }
}

function _restoreDetailScrollPos() {
  requestAnimationFrame(() => {
    const scrollArea = document.querySelector('.detail-scroll-area');
    if (scrollArea && state._detailScrollMap) {
      const key = state._selectedVariantId || (state.activeTab + ':' + (state.selectedCharacterId || state.selectedFactionId || state.selectedLocationId || state.selectedRaceId || state.selectedEventId || state.selectedItemId || ''));
      const pos = state._detailScrollMap[key];
      if (pos !== undefined) {
        scrollArea.scrollTop = pos;
        delete state._detailScrollMap[key];
      }
    }
  });
}

function _getEntityVariants(parentType, parentId) {
  return (state.data.entityVariants || []).filter(v => v.parentType === parentType && v.parentId === parentId);
}

function _getVariantById(variantId) {
  return (state.data.entityVariants || []).find(v => v.id === variantId);
}

async function _createVariant(parentType, parentId) {
  if (!state.data.entityVariants) state.data.entityVariants = [];
  const parentRef = _WIKI_ENTITY_MAP.find(e => e.type === parentType);
  if (!parentRef) return;
  const parent = parentRef.getData().find(e => e.id === parentId);
  if (!parent) return;
  const variantType = await customSelectModal('选择类型', [
    { id: 'variant', name: '🔄 变体' },
    { id: 'historical', name: '📜 历史形态' },
  ], [], 1);
  if (!variantType || variantType.length === 0) return;
  const typeLabel = variantType[0] === 'historical' ? '历史形态' : '变体';
  const name = await customPrompt(typeLabel + '名称', (parent.name || '') + '（' + typeLabel + '）');
  if (!name || !name.trim()) return;
  const trimmedName = name.trim();
  const existingVariant = (state.data.entityVariants || []).find(v => v.name === trimmedName);
  if (existingVariant) {
    showToast('已存在同名变体：' + trimmedName);
    return;
  }
  const variant = {
    id: uid(),
    name: name.trim(),
    variantType: variantType[0],
    parentType,
    parentId,
    description: '',
    customProps: {},
    dimensions: {},
    factions: [],
    locations: [],
    relatedEvents: [],
    relatedCharacters: [],
    relatedItems: [],
  };
  if (parentType === 'character') {
    CHAR_DIMENSIONS.forEach(d => { variant.dimensions[d.key] = ''; });
  }
  state.data.entityVariants.push(variant);
  autoSave();
  showToast(typeLabel + '已创建');
  state._selectedVariantId = variant.id;
  state._editingVariantId = variant.id;
  renderTabContent();
  return variant;
}

function _deleteVariant(variantId) {
  if (!state.data.entityVariants) return;
  state.data.entityVariants = state.data.entityVariants.filter(v => v.id !== variantId);
  if (state._selectedVariantId === variantId) state._selectedVariantId = null;
  if (state._editingVariantId === variantId) state._editingVariantId = null;
  autoSave();
  renderTabContent();
}

function _updateVariant(variantId, key, value) {
  const v = _getVariantById(variantId);
  if (!v) return;
  v[key] = value;
  autoSave();
}

function _updateVariantDim(variantId, dimKey, value) {
  const v = _getVariantById(variantId);
  if (!v) return;
  if (!v.dimensions) v.dimensions = {};
  v.dimensions[dimKey] = value;
  autoSave();
}

function _startEditVariant(variantId) {
  const v = _getVariantById(variantId);
  if (!v) return;
  _saveDetailScrollPos();
  state._editingVariantId = variantId;
  state._selectedVariantId = variantId;
  _ensureParentTab(v);
  state._forceAnimate = true;
  state._animateScope = 'detail';
  renderTabContent();
}

function _ensureParentTab(v) {
  const tabMap = { character:'characters', faction:'factions', location:'locations', race:'races', event:'events', item:'items' };
  const tab = tabMap[v.parentType];
  if (tab && state.activeTab !== tab) state.activeTab = tab;
  if (v.parentType === 'character') state.selectedCharacterId = v.parentId;
  else if (v.parentType === 'faction') state.selectedFactionId = v.parentId;
  else if (v.parentType === 'location') state.selectedLocationId = v.parentId;
  else if (v.parentType === 'race') state.selectedRaceId = v.parentId;
  else if (v.parentType === 'event') state.selectedEventId = v.parentId;
  else if (v.parentType === 'item') {
    const item = (state.data.items || []).find(i => i.id === v.parentId);
    if (item) state.selectedItemId = item.backpackId;
  }
}

function _cancelEditVariant() {
  state._editingVariantId = null;
  state._selectedVariantId = null;
  state._forceAnimate = true;
  state._animateScope = 'detail';
  renderTabContent();
  _restoreDetailScrollPos();
}

function _saveEditVariant() {
  const variantId = state._editingVariantId;
  if (!variantId) return;
  const v = _getVariantById(variantId);
  if (!v) return;
  const nameEl = document.getElementById('variant-edit-name');
  const descEl = document.getElementById('variant-edit-desc');
  if (nameEl) v.name = nameEl.value;
  if (descEl) v.description = descEl.value;
  document.querySelectorAll('[data-dim-key]').forEach(el => {
    if (!v.dimensions) v.dimensions = {};
    v.dimensions[el.dataset.dimKey] = el.value;
  });
  _saveVariantRelsFromDetail(variantId);
  state._editingVariantId = null;
  state._selectedVariantId = variantId;
  autoSave();
  state._forceAnimate = true;
  state._animateScope = 'detail';
  renderTabContent();
  _restoreDetailScrollPos();
  showToast('变体已保存');
}

function _renderVariantEditPage(v) {
  const parentRef = _WIKI_ENTITY_MAP.find(e => e.type === v.parentType);
  const parent = parentRef ? parentRef.getData().find(e => e.id === v.parentId) : null;
  const parentName = parent ? parent[parentRef.nameKey] : '';
  const typeLabel = v.variantType === 'historical' ? '历史形态' : '变体';
  const typeIcon = _variantIcon(v);
  const vid = v.id;

  const proxy = _buildVariantProxy(v, parent);

  let editHtml = '';
  if (v.parentType === 'character' && typeof renderCharEditForm === 'function') {
    editHtml = renderCharEditForm(proxy);
  } else if (v.parentType === 'faction' && typeof renderFactionEditForm === 'function') {
    editHtml = renderFactionEditForm(proxy);
  } else if (v.parentType === 'location' && typeof renderLocationEditForm === 'function') {
    editHtml = renderLocationEditForm(proxy);
  } else if (v.parentType === 'race' && typeof renderRaceEditForm === 'function') {
    editHtml = renderRaceEditForm(proxy);
  } else if (v.parentType === 'event' && typeof renderEventEditForm === 'function') {
    editHtml = renderEventEditForm(proxy);
  } else {
    editHtml = _renderVariantFallbackEditPage(v, typeIcon, typeLabel, parentName);
  }

  editHtml = _rewriteVariantEditCallbacks(editHtml, v);

  const headerHtml = `<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;padding:8px 12px;background:var(--bg-alt);border-radius:var(--radius-sm);font-size:13px;color:var(--muted)">${typeIcon} 编辑${typeLabel} — ${esc(parentName)} 的${typeLabel}</div>`;

  editHtml = editHtml.replace(/(<div class="card detail-scroll-area">)/, `$1${headerHtml}`);

  const stickyIdx = editHtml.lastIndexOf('<div class="detail-sticky-bar">');
  if (stickyIdx !== -1) {
    editHtml = editHtml.substring(0, stickyIdx);
  }

  editHtml += `<div class="detail-sticky-bar">
    <button class="btn btn-sm btn-outline" onclick="_cancelEditVariant()">取消</button>
    <div class="flex-gap">
      <button class="btn btn-sm btn-danger" onclick="_deleteVariant('${esc(vid)}')">🗑️ 删除</button>
      <button class="btn btn-sm btn-primary" onclick="_saveEditVariant()">💾 保存</button>
    </div>
  </div>`;

  return editHtml;
}

function _buildVariantProxy(v, parent) {
  if (v.parentType === 'character') {
    const proxy = Object.assign({}, v.dimensions || {}, {
      id: v.id,
      name: v.name,
      role: v.role || '',
      race: v.race || [],
      gender: v.gender || '',
      age: v.age || '',
      description: v.description || '',
      customProps: v.customProps || {},
      factions: v.factions || [],
      locations: v.locations || [],
      relatedEvents: v.relatedEvents || [],
      relatedCharacters: v.relatedCharacters || [],
      relatedItems: v.relatedItems || [],
      relatedVolumes: v.relatedVolumes || [],
      backpackItems: v.backpackItems || {},
      avatar: v.avatar || '',
      skills: v.skills || [],
      equipment: v.equipment || [],
    });
    return proxy;
  } else if (v.parentType === 'faction') {
    const proxy = {
      id: v.id,
      name: v.name,
      type: v.type || '',
      color: v.color || '#888',
      goals: v.goals || '',
      description: v.description || '',
      customProps: v.customProps || {},
      headquarters: v.headquarters || [],
      members: v.members || [],
      rivals: v.rivals || [],
      allies: v.allies || [],
      relatedEvents: v.relatedEvents || [],
      relatedVolumes: v.relatedVolumes || [],
    };
    return proxy;
  } else if (v.parentType === 'location') {
    const proxy = {
      id: v.id,
      name: v.name,
      category: v.category || '',
      description: v.description || '',
      customProps: v.customProps || {},
      relatedCharacters: v.relatedCharacters || [],
      events: v.events || [],
      relatedFactions: v.relatedFactions || [],
      relatedVolumes: v.relatedVolumes || [],
      backpackItems: v.backpackItems || {},
    };
    return proxy;
  } else if (v.parentType === 'race') {
    const proxy = Object.assign({}, v.dimensions || {}, {
      id: v.id,
      name: v.name,
      category: v.category || '',
      scale: v.scale || '',
      description: v.description || '',
      customProps: v.customProps || {},
      regions: v.regions || [],
      relatedCharacters: v.relatedCharacters || [],
      relatedEvents: v.relatedEvents || [],
      relatedVolumes: v.relatedVolumes || [],
    });
    return proxy;
  } else if (v.parentType === 'event') {
    const proxy = {
      id: v.id,
      name: v.name,
      title: v.name,
      time: v.time || '',
      type: v.type || '',
      cause: v.cause || '',
      description: v.description || '',
      outcome: v.outcome || '',
      aftermath: v.aftermath || '',
      customProps: v.customProps || {},
      characters: v.characters || [],
      factions: v.factions || [],
      locations: v.locations || [],
      items: v.items || [],
      relatedVolumes: v.relatedVolumes || [],
    };
    return proxy;
  }
  return { id: v.id, name: v.name, description: v.description || '', customProps: v.customProps || {} };
}

function _rewriteVariantEditCallbacks(html, v) {
  const vid = v.id;
  const replacements = {
    "updateCharacter('": `_variantEditUpdate('${vid}','character','`,
    "updateCharDim('": `_variantEditDimUpdate('${vid}','`,
    "setCharCustomProp('": `_variantEditCustomProp('${vid}','`,
    "updateFaction('": `_variantEditUpdate('${vid}','faction','`,
    "setFactionCustomProp('": `_variantEditCustomProp('${vid}','`,
    "updateLocation('": `_variantEditUpdate('${vid}','location','`,
    "setLocationCustomProp('": `_variantEditCustomProp('${vid}','`,
    "updateRace('": `_variantEditUpdate('${vid}','race','`,
    "setRaceCustomProp('": `_variantEditCustomProp('${vid}','`,
    "updateEvent('": `_variantEditUpdate('${vid}','event','`,
    "setEventCustomProp('": `_variantEditCustomProp('${vid}','`,
  };
  let result = html;
  for (const [from, to] of Object.entries(replacements)) {
    result = result.split(from).join(to);
  }
  const variantSectionMarker = '<h3>🔄 历史形态 / 变体</h3>';
  const variantSectionIdx = result.indexOf(variantSectionMarker);
  if (variantSectionIdx !== -1) {
    const cardStartIdx = result.lastIndexOf('<div class="card"', variantSectionIdx);
    if (cardStartIdx !== -1) {
      let depth = 0;
      let endIdx = cardStartIdx;
      for (let i = cardStartIdx; i < result.length; i++) {
        if (result.substring(i, i + 4) === '<div') { depth++; }
        else if (result.substring(i, i + 6) === '</div>') { depth--; if (depth === 0) { endIdx = i + 6; break; } }
      }
      result = result.substring(0, cardStartIdx) + result.substring(endIdx);
    }
  }
  return result;
}

function _variantEditUpdate(variantId, parentType, key, value) {
  const v = _getVariantById(variantId);
  if (!v) return;
  if (key === 'name') {
    if (value && value.trim()) {
      const dup = (state.data.entityVariants || []).find(va => va.id !== variantId && va.name === value.trim());
      if (dup) { showToast('已存在同名变体：' + value.trim()); return; }
    }
    v.name = value;
  }
  else if (key === 'description') { v.description = value; }
  else if (parentType === 'character') {
    const dimDef = CHAR_DIMENSIONS.find(d => d.key === key);
    if (dimDef) {
      if (!v.dimensions) v.dimensions = {};
      v.dimensions[key] = value;
    } else {
      v[key] = value;
    }
  } else if (parentType === 'faction') {
    v[key] = value;
  } else if (parentType === 'race') {
    const raceDimFields = ['origin', 'lifespan', 'appearance', 'traits', 'abilities', 'culture'];
    if (raceDimFields.includes(key)) {
      if (!v.dimensions) v.dimensions = {};
      v.dimensions[key] = value;
    } else { v[key] = value; }
  } else {
    v[key] = value;
  }
  autoSave();
}

function _variantEditDimUpdate(variantId, dimKey, value) {
  _updateVariantDim(variantId, dimKey, value);
}

function _variantEditCustomProp(variantId, propId, value) {
  const v = _getVariantById(variantId);
  if (!v) return;
  if (!v.customProps) v.customProps = {};
  v.customProps['cp_' + propId] = value;
  autoSave();
}

function _renderVariantFallbackEditPage(v, typeIcon, typeLabel, parentName) {
  let dimFields = '';
  if (v.parentType === 'character') {
    const dimGroups = {};
    CHAR_DIMENSIONS.forEach(d => { if (!dimGroups[d.group]) dimGroups[d.group] = []; dimGroups[d.group].push(d); });
    dimFields = Object.entries(dimGroups).map(([group, dims]) => {
      const fields = dims.map(d => {
        const val = (v.dimensions || {})[d.key] || '';
        return `<div class="form-group"><label>${d.label}</label><textarea rows="${d.rows}" data-dim-key="${esc(d.key)}" onchange="_updateVariantDim('${esc(v.id)}','${esc(d.key)}',this.value)">${esc(val)}</textarea></div>`;
      }).join('');
      return `<div class="card"><h3>${esc(group)}</h3>${fields}</div>`;
    }).join('');
  } else {
    const existingDims = Object.keys(v.dimensions || {});
    if (existingDims.length > 0) {
      dimFields = `<div class="card"><h3>属性</h3>${existingDims.map(k => {
        const val = v.dimensions[k] || '';
        return `<div class="form-group"><label>${esc(k)}</label><textarea rows="3" data-dim-key="${esc(k)}" onchange="_updateVariantDim('${esc(v.id)}','${esc(k)}',this.value)">${esc(val)}</textarea></div>`;
      }).join('')}</div>`;
    }
  }

  const relSections = _renderVariantRelEditSections(v);

  return `<div class="card detail-scroll-area">
    <div class="flex-between" style="margin-bottom:16px">
      <div><h2>${typeIcon} 编辑${typeLabel}</h2><span class="text-xs text-muted">${esc(parentName)} 的${typeLabel}</span></div>
    </div>
    <div class="form-group"><label>名称</label><input id="variant-edit-name" value="${esc(v.name)}" onchange="_updateVariant('${esc(v.id)}','name',this.value)"></div>
    <div class="form-group"><label>描述</label><textarea id="variant-edit-desc" rows="4" onchange="_updateVariant('${esc(v.id)}','description',this.value)">${esc(v.description||'')}</textarea></div>
    ${dimFields}
    ${relSections}
  </div>`;
}

function _renderVariantRelEditSections(v) {
  const allFactions = (state.data.factions || []).map(f => ({ id: f.id, name: f.name }));
  const allLocations = (state.data.locations || []).map(l => ({ id: l.id, name: l.name }));
  const allEvents = (state.data.timeline || []).map(e => ({ id: e.id, name: e.name || e.title || '未命名' }));
  const allChars = (state.data.characters || []).map(c => ({ id: c.id, name: c.name }));
  const allItems = (state.data.items || []).map(i => ({ id: i.id, name: i.name }));
  const allVariants = (state.data.entityVariants || []).filter(va => va.id !== v.id).map(va => ({ id: va.id, name: va.name + '（变体）' }));

  const sel = (arr) => (arr || []).map(x => x.id || x).filter(Boolean);
  const makeCheckboxes = (field, options, selected) => {
    return options.map(o => {
      const checked = selected.includes(o.id);
      return `<label style="display:flex;align-items:center;gap:6px;font-size:13px;padding:2px 0"><input type="checkbox" data-rel-field="${esc(field)}" data-rel-id="${esc(o.id)}" ${checked ? 'checked' : ''}>${esc(o.name)}</label>`;
    }).join('');
  };

  let html = '';
  if (allFactions.length > 0) {
    html += `<div class="card"><h3>🏰 所属势力</h3><div style="max-height:160px;overflow-y:auto">${makeCheckboxes('factions', allFactions, sel(v.factions))}</div></div>`;
  }
  if (allLocations.length > 0) {
    html += `<div class="card"><h3>📍 常驻地点</h3><div style="max-height:160px;overflow-y:auto">${makeCheckboxes('locations', allLocations, sel(v.locations))}</div></div>`;
  }
  if (allChars.length > 0) {
    html += `<div class="card"><h3>👤 关联角色</h3><div style="max-height:160px;overflow-y:auto">${makeCheckboxes('relatedCharacters', allChars, sel(v.relatedCharacters))}</div></div>`;
  }
  if (allEvents.length > 0) {
    html += `<div class="card"><h3>⚡ 关联事件</h3><div style="max-height:160px;overflow-y:auto">${makeCheckboxes('relatedEvents', allEvents, sel(v.relatedEvents))}</div></div>`;
  }
  if (allItems.length > 0) {
    html += `<div class="card"><h3>📦 关联物品</h3><div style="max-height:160px;overflow-y:auto">${makeCheckboxes('relatedItems', allItems, sel(v.relatedItems))}</div></div>`;
  }
  if (allVariants.length > 0) {
    html += `<div class="card"><h3>🔄 关联变体</h3><div style="max-height:160px;overflow-y:auto">${makeCheckboxes('relatedVariants', allVariants, sel(v.relatedVariants))}</div></div>`;
  }
  return html;
}

function _saveVariantRelsFromDetail(variantId) {
  const v = _getVariantById(variantId);
  if (!v) return;
  const fields = ['factions', 'locations', 'relatedCharacters', 'relatedEvents', 'relatedItems', 'relatedVariants'];
  for (const field of fields) {
    const checked = document.querySelectorAll(`[data-rel-field="${field}"]:checked`);
    v[field] = Array.from(checked).map(cb => cb.dataset.relId);
  }
}

function _renderVariantSection(parentType, parentId, parentName) {
  const variants = _getEntityVariants(parentType, parentId);
  let html = `<div class="card" style="margin-top:12px"><h3>🔄 历史形态 / 变体</h3>
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
      <span class="text-xs text-muted">${variants.length} 个</span>
      <button class="btn btn-xs btn-outline" onclick="_createVariant('${esc(parentType)}','${esc(parentId)}')">+ 新建</button>
    </div>`;
  if (variants.length > 0) {
    html += `<div style="display:flex;flex-direction:column;gap:6px">`;
    for (const v of variants) {
      const icon = _variantIcon(v);
      const typeLabel = v.variantType === 'historical' ? '历史形态' : '变体';
      html += `<div class="card" style="margin:0;padding:10px 12px;display:flex;align-items:center;gap:8px;cursor:pointer" onclick="_startEditVariant('${esc(v.id)}')">
        <span style="font-weight:500;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${icon} ${esc(v.name)} <span class="text-xs text-muted">${typeLabel}</span></span>
        <button class="btn btn-xs btn-outline" onclick="event.stopPropagation();_startEditVariant('${esc(v.id)}')">✏️</button>
        <button class="btn btn-xs btn-icon btn-danger" style="font-size:8px" onclick="event.stopPropagation();_deleteVariant('${esc(v.id)}')">×</button>
      </div>`;
    }
    html += `</div>`;
  }
  html += `</div>`;
  return html;
}

function _renderVariantDetailPage(v) {
  const parentRef = _WIKI_ENTITY_MAP.find(e => e.type === v.parentType);
  const parent = parentRef ? parentRef.getData().find(e => e.id === v.parentId) : null;
  const parentName = parent ? parent[parentRef.nameKey] : '';
  const icon = _variantIcon(v);
  const typeLabel = v.variantType === 'historical' ? '历史形态' : '变体';

  const descHtml = v.description ? `<div class="wiki-section"><div class="wiki-section-title">描述</div><div class="wiki-field"><span class="wiki-value">${_renderLinkedContent(v.description)}</span></div></div>` : '';

  let dimHtml = '';
  if (v.parentType === 'character') {
    const dimGroups = {};
    CHAR_DIMENSIONS.forEach(d => { if (!dimGroups[d.group]) dimGroups[d.group] = []; dimGroups[d.group].push(d); });
    dimHtml = Object.entries(dimGroups).map(([group, dims]) => {
      const hasContent = dims.some(d => (v.dimensions || {})[d.key] && v.dimensions[d.key].trim());
      if (!hasContent) return '';
      return `<div class="wiki-section"><div class="wiki-section-title">${esc(group)}</div>${dims.map(d => {
        const val = (v.dimensions || {})[d.key] || '';
        if (!val.trim()) return '';
        return `<div class="wiki-field"><span class="wiki-label">${d.label}</span><span class="wiki-value">${_renderLinkedContent(val)}</span></div>`;
      }).join('')}</div>`;
    }).join('');
  } else {
    const dimKeys = Object.keys(v.dimensions || {}).filter(k => v.dimensions[k] && v.dimensions[k].trim());
    if (dimKeys.length > 0) {
      dimHtml = `<div class="wiki-section"><div class="wiki-section-title">属性</div>${dimKeys.map(k => `<div class="wiki-field"><span class="wiki-label">${esc(k)}</span><span class="wiki-value">${_renderLinkedContent(v.dimensions[k])}</span></div>`).join('')}</div>`;
    }
  }

  const relHtml = _renderVariantRelWikiSections(v);

  return `<div class="wiki-page detail-scroll-area">
    <div class="wiki-header">
      <div class="flex-between">
        <div class="flex-gap" style="align-items:center">
          <h2 class="wiki-title">${icon} ${esc(v.name)}</h2>
        </div>
      </div>
      <div class="wiki-meta">
        <span class="wiki-badge role">${typeLabel}</span>
        <span class="wiki-badge race" style="cursor:pointer" onclick="_navigateToParent('${esc(v.parentType)}','${esc(v.parentId)}')">${parentRef ? parentRef.icon : ''} ${esc(parentName)}（本体）</span>
      </div>
    </div>
    ${descHtml}${dimHtml}${relHtml}
  </div>
  <div class="detail-sticky-bar">
    <button class="btn btn-sm btn-outline" onclick="_navigateToParent('${esc(v.parentType)}','${esc(v.parentId)}')">← 返回本体</button>
    <div class="flex-gap">
      <button class="btn btn-sm btn-danger" onclick="_deleteVariant('${esc(v.id)}')">🗑️ 删除</button>
      <button class="btn btn-sm btn-primary" onclick="_startEditVariant('${esc(v.id)}')">✏️ 编辑</button>
    </div>
  </div>`;
}

function _navigateToParent(parentType, parentId) {
  _saveDetailScrollPos();
  const tabMap = { character:'characters', faction:'factions', location:'locations', race:'races', event:'events', item:'items' };
  const tab = tabMap[parentType];
  if (tab && state.activeTab !== tab) state.activeTab = tab;
  if (parentType === 'character') { state.selectedCharacterId = parentId; }
  else if (parentType === 'faction') { state.selectedFactionId = parentId; }
  else if (parentType === 'location') { state.selectedLocationId = parentId; }
  else if (parentType === 'race') { state.selectedRaceId = parentId; }
  else if (parentType === 'event') { state.selectedEventId = parentId; }
  else if (parentType === 'item') {
    const item = (state.data.items || []).find(i => i.id === parentId);
    if (item) state.selectedItemId = item.backpackId;
  }
  state._selectedVariantId = null;
  state._editingVariantId = null;
  state._forceAnimate = true;
  state._animateScope = 'detail';
  renderTabContent();
  _restoreDetailScrollPos();
}

function _renderVariantRelWikiSections(v) {
  let html = '';
  const factionLinks = _normLinks(v.factions || []);
  const locationLinks = _normLinks(v.locations || []);
  const charLinks = _normLinks(v.relatedCharacters || []);
  const eventLinks = _normLinks(v.relatedEvents || []);
  const itemLinks = _normLinks(v.relatedItems || []);
  const variantLinks = _normLinks(v.relatedVariants || []);

  if (factionLinks.length > 0) {
    html += `<div class="wiki-section"><div class="wiki-section-title">🏰 所属势力</div><div class="wiki-tags">${factionLinks.map(fl => {
      const f = (state.data.factions || []).find(fa => fa.id === fl.id);
      return f ? `<span class="wiki-tag item" onclick="showPreviewCard('faction','${esc(f.id)}',event)" style="cursor:pointer">${esc(f.name)}</span>` : `<span class="wiki-tag item">${esc(fl.id)}</span>`;
    }).join('')}</div></div>`;
  }
  if (locationLinks.length > 0) {
    html += `<div class="wiki-section"><div class="wiki-section-title">📍 常驻地点</div><div class="wiki-tags">${locationLinks.map(ll => {
      const l = (state.data.locations || []).find(lo => lo.id === ll.id);
      return l ? `<span class="wiki-tag skill" onclick="showPreviewCard('location','${esc(l.id)}',event)" style="cursor:pointer">${esc(l.name)}</span>` : `<span class="wiki-tag skill">${esc(ll.id)}</span>`;
    }).join('')}</div></div>`;
  }
  if (charLinks.length > 0) {
    html += `<div class="wiki-section"><div class="wiki-section-title">👤 关联角色</div><div class="wiki-tags">${charLinks.map(cl => {
      const c = (state.data.characters || []).find(ch => ch.id === cl.id);
      return c ? `<span class="wiki-tag item" onclick="showPreviewCard('character','${esc(c.id)}',event)" style="cursor:pointer">${esc(c.name)}</span>` : `<span class="wiki-tag item">${esc(cl.id)}</span>`;
    }).join('')}</div></div>`;
  }
  if (eventLinks.length > 0) {
    html += `<div class="wiki-section"><div class="wiki-section-title">⚡ 关联事件</div><div class="wiki-tags">${eventLinks.map(el => {
      const e = (state.data.timeline || []).find(ev => ev.id === el.id);
      return e ? `<span class="wiki-tag item" onclick="showPreviewCard('event','${esc(e.id)}',event)" style="cursor:pointer">${esc(e.name || e.title)}</span>` : `<span class="wiki-tag item">${esc(el.id)}</span>`;
    }).join('')}</div></div>`;
  }
  if (itemLinks.length > 0) {
    html += `<div class="wiki-section"><div class="wiki-section-title">📦 关联物品</div><div class="wiki-tags">${itemLinks.map(il => {
      const i = (state.data.items || []).find(it => it.id === il.id);
      return i ? `<span class="wiki-tag item" onclick="showItemDetail('${esc(i.id)}')" style="cursor:pointer">${esc(i.name)}</span>` : `<span class="wiki-tag item">${esc(il.id)}</span>`;
    }).join('')}</div></div>`;
  }
  if (variantLinks.length > 0) {
    html += `<div class="wiki-section"><div class="wiki-section-title">🔄 关联变体</div><div class="wiki-tags">${variantLinks.map(vl => {
      const va = _getVariantById(vl.id);
      return va ? `<span class="wiki-tag item" onclick="_showVariantDetailPage('${esc(va.id)}')" style="cursor:pointer">${esc(va.name)}</span>` : `<span class="wiki-tag item">${esc(vl.id)}</span>`;
    }).join('')}</div></div>`;
  }
  return html;
}

function _showVariantDetailPage(variantId) {
  const v = _getVariantById(variantId);
  if (!v) return;
  _saveDetailScrollPos();
  state._selectedVariantId = variantId;
  state._editingVariantId = null;
  _ensureParentTab(v);
  state._forceAnimate = true;
  state._animateScope = 'detail';
  renderTabContent();
}

function _renderVariantDropdown(parentType, parentId, parentName) {
  const variants = _getEntityVariants(parentType, parentId);
  if (variants.length === 0) return '';
  const expanded = state._expandedVariantParent === parentId;
  const icon = expanded ? '▼' : '▶';
  return `<span class="variant-toggle" onclick="event.stopPropagation();state._expandedVariantParent=state._expandedVariantParent==='${esc(parentId)}'?null:'${esc(parentId)}';renderTabContent()" style="cursor:pointer;font-size:10px;color:var(--muted);margin-left:2px" title="展开变体/历史形态">${icon}</span>`;
}

function _renderVariantListItems(parentType, parentId) {
  const variants = _getEntityVariants(parentType, parentId);
  if (variants.length === 0) return '';
  const expanded = state._expandedVariantParent === parentId;
  if (!expanded) return '';
  let html = '';
  for (const v of variants) {
    const icon = _variantIcon(v);
    const typeLabel = v.variantType === 'historical' ? '历史形态' : '变体';
    const isSelected = state._selectedVariantId === v.id;
    html += `<div class="variant-list-item${isSelected ? ' selected' : ''}" onclick="_showVariantDetailPage('${esc(v.id)}')" style="padding:6px 8px 6px 28px;font-size:12px;cursor:pointer;display:flex;align-items:center;gap:6px;margin:2px 4px;border-radius:var(--radius-sm);border:1px solid var(--border-subtle)">
      <span style="color:var(--muted)">${icon}</span>
      <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(v.name)}</span>
      <span class="text-xs text-muted">${typeLabel}</span>
    </div>`;
  }
  return html;
}

function _renderVariantWikiSection(parentType, parentId) {
  const variants = _getEntityVariants(parentType, parentId);
  if (variants.length === 0) return '';
  const historicals = variants.filter(v => v.variantType === 'historical');
  const regularVariants = variants.filter(v => v.variantType !== 'historical');
  let html = '';
  if (historicals.length > 0) {
    html += `<div class="wiki-section"><div class="wiki-section-title">📜 历史形态</div><div style="display:flex;flex-direction:column;gap:8px">`;
    for (const v of historicals) {
      html += _renderVariantWikiCard(v);
    }
    html += `</div></div>`;
  }
  if (regularVariants.length > 0) {
    html += `<div class="wiki-section"><div class="wiki-section-title">🔄 变体</div><div style="display:flex;flex-direction:column;gap:8px">`;
    for (const v of regularVariants) {
      html += _renderVariantWikiCard(v);
    }
    html += `</div></div>`;
  }
  return html;
}

function _renderVariantWikiCard(v) {
  const descHtml = v.description ? `<div class="wiki-field"><span class="wiki-value">${_renderLinkedContent(v.description)}</span></div>` : '';
  const dimKeys = Object.keys(v.dimensions || {}).filter(k => v.dimensions[k] && v.dimensions[k].trim());
  const dimHtml = dimKeys.length > 0 ? dimKeys.map(k => `<div class="wiki-field"><span class="wiki-label">${esc(k)}</span><span class="wiki-value">${_renderLinkedContent(v.dimensions[k])}</span></div>`).join('') : '';
  return `<div class="card" style="padding:12px;cursor:pointer" onclick="_showVariantDetailPage('${esc(v.id)}')"><div style="font-weight:500;margin-bottom:6px">${_variantIcon(v)} ${esc(v.name)}</div>${descHtml}${dimHtml}</div>`;
}

function _showEntityCtxMenu(e, parentType, parentId) {
  const existing = document.querySelector('.entity-ctx-menu');
  if (existing) existing.remove();
  const menu = document.createElement('div');
  menu.className = 'entity-ctx-menu wiki-ctx-menu';
  menu.innerHTML = `<div class="wiki-ctx-item" style="cursor:pointer" data-action="create-variant">🔄 新建变体</div><div class="wiki-ctx-item" style="cursor:pointer" data-action="create-historical">📜 新建历史形态</div>`;
  document.body.appendChild(menu);
  let left = e.clientX;
  let top = e.clientY;
  requestAnimationFrame(() => {
    const rect = menu.getBoundingClientRect();
    left = Math.min(left, window.innerWidth - rect.width - 8);
    top = Math.min(top, window.innerHeight - rect.height - 8);
    menu.style.left = left + 'px';
    menu.style.top = top + 'px';
  });
  const closeMenu = () => { menu.remove(); document.removeEventListener('click', closeMenu); };
  menu.onclick = (ev) => {
    const item = ev.target.closest('.wiki-ctx-item');
    if (!item) return;
    const action = item.dataset.action;
    closeMenu();
    if (action === 'create-variant') {
      _createVariantWithType(parentType, parentId, 'variant');
    } else if (action === 'create-historical') {
      _createVariantWithType(parentType, parentId, 'historical');
    }
  };
  setTimeout(() => { document.addEventListener('click', closeMenu); }, 50);
}

async function _createVariantWithType(parentType, parentId, variantType) {
  if (!state.data.entityVariants) state.data.entityVariants = [];
  const parentRef = _WIKI_ENTITY_MAP.find(e => e.type === parentType);
  if (!parentRef) return;
  const parent = parentRef.getData().find(e => e.id === parentId);
  if (!parent) return;
  const typeLabel = variantType === 'historical' ? '历史形态' : '变体';
  const name = await customPrompt(typeLabel + '名称', (parent.name || parent.title || '') + '（' + typeLabel + '）');
  if (!name || !name.trim()) return;
  const trimmedName = name.trim();
  const existingVariant = (state.data.entityVariants || []).find(v => v.name === trimmedName);
  if (existingVariant) {
    showToast('已存在同名变体：' + trimmedName);
    return;
  }
  const variant = {
    id: uid(),
    name: trimmedName,
    variantType: variantType,
    parentType,
    parentId,
    description: '',
    customProps: {},
    dimensions: {},
    factions: [],
    locations: [],
    relatedEvents: [],
    relatedCharacters: [],
    relatedItems: [],
  };
  if (parentType === 'character') {
    CHAR_DIMENSIONS.forEach(d => { variant.dimensions[d.key] = ''; });
  }
  state.data.entityVariants.push(variant);
  autoSave();
  showToast(typeLabel + '已创建');
  state._selectedVariantId = variant.id;
  state._editingVariantId = variant.id;
  state._forceAnimate = true;
  state._animateScope = 'detail';
  _ensureParentTab(variant);
  renderTabContent();
}