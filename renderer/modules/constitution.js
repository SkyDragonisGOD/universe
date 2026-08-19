// ============================================================
// 世界生成器 — 世界探索 (Wiki 浏览器)
// 依赖: core/state.js, core/utils.js, core/modal.js, core/glossary.js, core/properties.js
// ============================================================

function renderExplorer() {
  return `<div style="display:flex;flex-direction:column;height:calc(100vh - 120px)">
    <div id="explorer-header" class="card" style="flex-shrink:0;padding-bottom:12px;margin-bottom:12px">
      <div class="flex-between mb-8">
        <h3>🔭 世界探索</h3>
      </div>
      <p class="text-sm text-muted mb-8">浏览你的世界，发现每一个角落</p>
      <div style="position:relative;margin-bottom:12px">
        <input id="explorer-search" placeholder="搜索角色、地点、势力、事件、百科词条…" oninput="onExplorerSearch(this.value)" style="width:100%;padding:10px 14px 10px 36px;background:var(--white);border:1px solid var(--border);border-radius:var(--radius-sm);font-size:14px;font-family:var(--font-body);box-sizing:border-box">
        <span style="position:absolute;left:12px;top:50%;transform:translateY(-50%);font-size:14px;color:var(--muted)">🔍</span>
      </div>
    </div>
    <div id="explorer-content" style="flex:1;overflow-y:auto;min-height:0">
      ${renderExplorerRecommendations()}
    </div>
  </div>`;
}

function getAllExplorerEntries() {
  const d = state.data;
  const entries = [];
  (d.characters||[]).forEach(c => {
    const tags = [];
    if (c.role) tags.push(c.role);
    const races = Array.isArray(c.race) ? c.race : c.race ? [c.race] : [];
    races.forEach(r => tags.push(r));
    if (c.gender) tags.push(c.gender);
    const factions = collectGlossary('faction');
    (c.factions||[]).forEach(fid => { const f = factions.find(x=>x.id===fid); if (f) tags.push(f.name); });
    entries.push({ type:'character', id:c.id, icon:'👤', name:c.name||'未命名', desc:(c.shortDescription||c.personality||c.appearance||'').substring(0,120), tags });
  });
  (d.locations||[]).forEach(l => {
    const tags = [];
    if (l.category && l.category !== '未知') tags.push(l.category);
    (l.tags||[]).forEach(tid => { const t = findTag(d.locationTagTree||[], tid); if (t) tags.push(t.name); });
    entries.push({ type:'location', id:l.id, icon:'📍', name:l.name||'未命名', desc:(l.description||'').substring(0,120), tags });
  });
  (d.factions||[]).forEach(f => {
    const tags = [];
    if (f.type) tags.push(f.type);
    entries.push({ type:'faction', id:f.id, icon:'🏰', name:f.name||'未命名', desc:(f.description||'').substring(0,120), tags });
  });
  (d.races||[]).forEach(r => {
    const tags = [];
    if (r.category) tags.push(r.category);
    entries.push({ type:'race', id:r.id, icon:'🧬', name:r.name||'未命名', desc:(r.traits||r.description||'').substring(0,120), tags });
  });
  (d.items||[]).forEach(i => {
    const tags = [];
    if (i.type) tags.push(i.type);
    if (i.rarity) tags.push(getRarityLabel(i.rarity)||i.rarity);
    entries.push({ type:'item', id:i.id, icon:i.icon||'🎲', name:i.name||'未命名', desc:(i.description||i.effects||'').substring(0,120), tags });
  });
  (d.timeline||[]).forEach(e => {
    const tags = [];
    if (e.time) tags.push(e.time);
    if (e.type) tags.push(e.type);
    entries.push({ type:'event', id:e.id, icon:'⚡', name:e.name||e.title||'未命名', desc:(e.description||'').substring(0,120), tags });
  });
  (d.encyclopediaItems||[]).forEach(it => {
    const sub = (d.encyclopediaSubCategories||[]).find(s=>s.id===it.subCategoryId);
    const cat = sub ? (d.encyclopediaCategories||[]).find(c=>c.id===sub.parentId) : null;
    const tags = [];
    if (cat) tags.push(cat.name);
    if (sub) tags.push(sub.name);
    entries.push({ type:'encyclopedia', id:it.id, icon:it.icon||'📄', name:it.name||'未命名', desc:(it.description||'').substring(0,120), tags });
  });
  (d.outline||[]).forEach((vol, vi) => {
    entries.push({ type:'outline_volume', id:`vol_${vi}`, icon:'📖', name:vol.title||`第${vi+1}卷`, desc:(vol.summary||'').substring(0,120), tags:['大纲卷'] });
    (vol.chapters||[]).forEach((chap, ci) => {
      entries.push({ type:'outline_chapter', id:`chap_${vi}_${ci}`, icon:'📄', name:chap.title||`第${ci+1}章`, desc:(chap.summary||'').substring(0,120), tags:[vol.title||`第${vi+1}卷`] });
    });
  });
  (d.worldBackpacks||[]).forEach(ws => {
    const wsItems = (d.items||[]).filter(i=>i.backpackId===ws.id);
    entries.push({ type:'worldSystem', id:ws.id, icon:'🌍', name:ws.name||'未命名系统', desc:`${wsItems.length} 个物品`, tags:['世界系统'] });
  });
  (d.entityVariants||[]).forEach(v => {
    const parentRef = ([
      { type:'character', getData:()=>d.characters||[], nameKey:'name', icon:'👤' },
      { type:'faction', getData:()=>d.factions||[], nameKey:'name', icon:'🏰' },
      { type:'location', getData:()=>d.locations||[], nameKey:'name', icon:'📍' },
      { type:'race', getData:()=>d.races||[], nameKey:'name', icon:'🧬' },
      { type:'item', getData:()=>d.items||[], nameKey:'name', icon:'📦' },
      { type:'event', getData:()=>d.timeline||[], nameKey:'name', icon:'⚡' },
    ]).find(r=>r.type===v.parentType);
    const parent = parentRef ? parentRef.getData().find(e=>e.id===v.parentId) : null;
    const parentName = parent ? parent[parentRef.nameKey] : '';
    const typeLabel = v.variantType === 'historical' ? '历史形态' : '变体';
    const tags = [];
    if (parentName) tags.push(parentName);
    tags.push(typeLabel);
    entries.push({ type:'variant', id:v.id, icon: v.variantType === 'historical' ? '📜' : '🔄', name:v.name||'未命名变体', desc:(v.description||'').substring(0,120), tags });
  });
  return entries;
}

function renderExplorerRecommendations() {
  const all = getAllExplorerEntries();
  if (all.length === 0) return '<div class="empty-state"><div class="icon">🔭</div><p>世界还是一片空白，先去创建些什么吧</p></div>';
  const shuffled = [...all].sort(() => Math.random() - 0.5);
  const picks = shuffled.slice(0, 12);
  return `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
    <span class="text-sm text-muted">为你推荐 ${picks.length} 个词条</span>
    <button class="btn btn-sm btn-outline" onclick="refreshExplorerRecommendations()">🔄 换一批</button>
  </div>
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px">
    ${picks.map(e => renderExplorerCard(e)).join('')}
  </div>`;
}

function renderExplorerCard(e) {
  const tagsHtml = (e.tags||[]).slice(0, 4).map(t =>
    `<span style="font-size:11px;padding:1px 6px;border-radius:8px;background:var(--bg-alt);color:var(--text-muted)">${esc(t)}</span>`
  ).join('');
  return `<div class="explorer-card" onclick="showExplorerDetail('${e.type}','${esc(e.id)}')" style="background:var(--white);border:1px solid var(--border);border-radius:var(--radius-sm);padding:14px 16px;cursor:pointer;transition:box-shadow 0.2s,transform 0.15s;height:130px;display:flex;flex-direction:column;overflow:hidden" onmouseenter="this.style.boxShadow='var(--shadow-card)';this.style.transform='translateY(-2px)'" onmouseleave="this.style.boxShadow='';this.style.transform=''">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;flex-shrink:0">
      <span style="font-size:20px">${e.icon}</span>
      <strong style="font-size:14px;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(e.name)}</strong>
    </div>
    ${tagsHtml ? `<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:6px;flex-shrink:0">${tagsHtml}</div>` : ''}
    ${e.desc ? `<div style="font-size:12px;color:var(--text-muted);line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;flex:1;min-height:0">${esc(e.desc)}</div>` : ''}
  </div>`;
}

function refreshExplorerRecommendations() {
  const el = $('#explorer-content');
  if (el) {
    el.innerHTML = renderExplorerRecommendations();
    requestAnimationFrame(function() {
      el.querySelectorAll('.explorer-card').forEach(function(card, i) {
        gsap.fromTo(card, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, delay: i * 0.04, ease: 'power3.out' });
      });
    });
  }
}

function onExplorerSearch(q) {
  const el = $('#explorer-content');
  if (!el) return;
  if (!q || !q.trim()) {
    el.innerHTML = renderExplorerRecommendations();
    requestAnimationFrame(function() {
      el.querySelectorAll('.explorer-card').forEach(function(card, i) {
        gsap.fromTo(card, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, delay: i * 0.04, ease: 'power3.out' });
      });
    });
    return;
  }
  const lower = q.toLowerCase();
  const all = getAllExplorerEntries();
  const results = all.filter(e => e.name.toLowerCase().includes(lower) || e.desc.toLowerCase().includes(lower) || (e.tags||[]).some(t=>t.toLowerCase().includes(lower)));
  if (results.length === 0) {
    el.innerHTML = `<div class="empty-state"><div class="icon">🔍</div><p>未找到匹配的词条</p></div>`;
    return;
  }
  el.innerHTML = `<div style="margin-bottom:12px"><span class="text-sm text-muted">找到 ${results.length} 个结果</span></div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px">
      ${results.map(e => renderExplorerCard(e)).join('')}
    </div>`;
  requestAnimationFrame(function() {
    el.querySelectorAll('.explorer-card').forEach(function(card, i) {
      gsap.fromTo(card, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, delay: i * 0.04, ease: 'power3.out' });
    });
  });
}

function showExplorerDetail(type, id) {
  let html = '';
  if (type === 'character') {
    const ch = (state.data.characters||[]).find(c=>c.id===id);
    if (!ch) return;
    html = renderExplorerCharacterDetail(ch);
  } else if (type === 'location') {
    const loc = (state.data.locations||[]).find(l=>l.id===id);
    if (!loc) return;
    html = renderExplorerLocationDetail(loc);
  } else if (type === 'faction') {
    const f = (state.data.factions||[]).find(fa=>fa.id===id);
    if (!f) return;
    html = renderExplorerFactionDetail(f);
  } else if (type === 'race') {
    const r = (state.data.races||[]).find(ra=>ra.id===id);
    if (!r) return;
    html = renderExplorerRaceDetail(r);
  } else if (type === 'item') {
    const it = (state.data.items||[]).find(i=>i.id===id);
    if (!it) return;
    html = renderExplorerItemDetail(it);
  } else if (type === 'event') {
    const ev = (state.data.timeline||[]).find(e=>e.id===id);
    if (!ev) return;
    html = renderExplorerEventDetail(ev);
  } else if (type === 'encyclopedia') {
    const it = (state.data.encyclopediaItems||[]).find(i=>i.id===id);
    if (!it) return;
    html = renderExplorerEncyclopediaDetail(it);
  } else if (type === 'worldSystem') {
    const ws = (state.data.worldBackpacks||[]).find(w=>w.id===id);
    if (!ws) return;
    html = renderExplorerWorldSystemDetail(ws);
  } else if (type === 'variant') {
    const v = (state.data.entityVariants||[]).find(va=>va.id===id);
    if (!v) return;
    html = _renderVariantDetailPage(v);
  } else if (type === 'outline_volume') {
    const vi = parseInt(id.replace('vol_',''));
    const vol = (state.data.outline||[])[vi];
    if (!vol) return;
    html = renderExplorerVolumeDetail(vol, vi);
  } else if (type === 'outline_chapter') {
    const parts = id.replace('chap_','').split('_');
    const vi = parseInt(parts[0]);
    const ci = parseInt(parts[1]);
    const vol = (state.data.outline||[])[vi];
    const chap = vol && vol.chapters ? vol.chapters[ci] : null;
    if (!chap) return;
    html = renderExplorerChapterDetail(chap, vi, ci);
  }
  const el = $('#explorer-content');
  if (el) {
    el.innerHTML = html;
    requestAnimationFrame(function() {
      el.querySelectorAll('.wiki-page').forEach(function(panel, i) {
        gsap.fromTo(panel, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, delay: i * 0.06, ease: 'power3.out' });
      });
      el.querySelectorAll('.wiki-title').forEach(function(titleEl) {
        splitTextAnimate(titleEl, { delay: 30, duration: 500, ease: 'outExpo', from: { opacity: 0, translateY: 16 }, to: { opacity: 1, translateY: 0 } });
      });
      el.querySelectorAll('.wiki-header').forEach(function(hdr) {
        gsap.fromTo(hdr, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, delay: 0.05, ease: 'power3.out' });
      });
      el.querySelectorAll('.wiki-section').forEach(function(sec, i) {
        gsap.fromTo(sec, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, delay: 0.15 + i * 0.04, ease: 'power3.out' });
      });
    });
  }
  const header = $('#explorer-header');
  if (header) {
    header.querySelector('h3').style.display = 'none';
    header.querySelector('p').style.display = 'none';
  }
  state._explorerHistory = state._explorerHistory || [];
  state._explorerHistory.push({ type, id });
}

function goBackExplorer() {
  if (!state._explorerHistory || state._explorerHistory.length <= 1) {
    if (state._explorerFromTab) {
      const prevTab = state._explorerFromTab;
      state._explorerFromTab = null;
      state._explorerHistory = [];
      state.activeTab = prevTab;
      renderTabs();
      renderTabContent();
      return;
    }
    const el = $('#explorer-content');
    if (el) {
      el.innerHTML = renderExplorerRecommendations();
      requestAnimationFrame(function() {
        el.querySelectorAll('.explorer-card').forEach(function(card, i) {
          gsap.fromTo(card, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, delay: i * 0.04, ease: 'power3.out' });
        });
      });
    }
    state._explorerHistory = [];
    const header = $('#explorer-header');
    if (header) {
      header.querySelector('h3').style.display = '';
      header.querySelector('p').style.display = '';
    }
    return;
  }
  state._explorerHistory.pop();
  const prev = state._explorerHistory[state._explorerHistory.length - 1];
  state._explorerHistory.pop();
  showExplorerDetail(prev.type, prev.id);
}

function renderExplorerCharacterDetail(ch) {
  ensurePropertyDefs();
  const customProps = getCustomPropsForScope('characters');
  const cpData = ch.customProps || {};
  const customPropHtml = renderCustomPropWikiHtml(customProps, cpData);
  const raceLinks = Array.isArray(ch.race) ? ch.race : ch.race ? [ch.race] : [];
  const factions = collectGlossary('faction');
  const chFactions = (ch.factions||[]).map(fid => { const f = factions.find(x=>x.id===fid); return f ? f.name : fid; });
  const locLinks = _normLinks(ch.locations);
  const locations = collectGlossary('location');
  const chLocs = locLinks.map(ll => { const l = locations.find(x=>x.id===ll.id); return l ? l.name : ll.id; });
  return `<div class="wiki-page" style="padding:20px">
    <button class="btn btn-sm btn-outline" onclick="goBackExplorer()" style="margin-bottom:12px">← 返回</button>
    <div class="wiki-header"><h2 class="wiki-title">👤 ${esc(ch.name)}</h2>
      <div class="wiki-meta">${ch.role?`<span class="wiki-badge race">${esc(ch.role)}</span>`:''} ${ch.gender?`<span class="wiki-badge gender">${esc(ch.gender)}</span>`:''} ${raceLinks.map(r=>`<span class="wiki-badge skill">${esc(r)}</span>`).join('')}</div>
    </div>
    ${ch.shortDescription?`<div class="wiki-section"><div class="wiki-section-title">一句话简介</div><div class="wiki-value">${_renderLinkedContent(ch.shortDescription)}</div></div>`:''}
    ${ch.appearance?`<div class="wiki-section"><div class="wiki-section-title">外貌</div><div class="wiki-value">${_renderLinkedContent(ch.appearance)}</div></div>`:''}
    ${ch.personality?`<div class="wiki-section"><div class="wiki-section-title">性格</div><div class="wiki-value">${_renderLinkedContent(ch.personality)}</div></div>`:''}
    ${ch.background?`<div class="wiki-section"><div class="wiki-section-title">背景</div><div class="wiki-value">${_renderLinkedContent(ch.background)}</div></div>`:''}
    ${ch.motivation?`<div class="wiki-section"><div class="wiki-section-title">动机</div><div class="wiki-value">${_renderLinkedContent(ch.motivation)}</div></div>`:''}
    ${ch.abilities?`<div class="wiki-section"><div class="wiki-section-title">能力</div><div class="wiki-value">${_renderLinkedContent(ch.abilities)}</div></div>`:''}
    ${chFactions.length>0?`<div class="wiki-section"><div class="wiki-section-title">所属势力</div><div class="wiki-tags">${chFactions.map((n,i)=>{const f=(state.data.factions||[]).find(fa=>fa.name===n);return f?`<span class="wiki-tag skill" onclick="event.stopPropagation();showPreviewCard('faction','${esc(f.id)}',event)" style="cursor:pointer">${esc(n)}</span>`:`<span class="wiki-tag skill">${esc(n)}</span>`;}).join('')}</div></div>`:''}
    ${chLocs.length>0?`<div class="wiki-section"><div class="wiki-section-title">所在地点</div><div class="wiki-tags">${chLocs.map(n=>{const l=(state.data.locations||[]).find(lo=>lo.name===n);return l?`<span class="wiki-tag item" onclick="event.stopPropagation();showPreviewCard('location','${esc(l.id)}',event)" style="cursor:pointer">${esc(n)}</span>`:`<span class="wiki-tag item">${esc(n)}</span>`;}).join('')}</div></div>`:''}
    ${customPropHtml?`<div class="wiki-section">${customPropHtml}</div>`:''}
  </div>`;
}

function renderExplorerLocationDetail(loc) {
  const tags = state.data.locationTagTree||[];
  const locTags = (loc.tags||[]).map(tid=>findTag(tags,tid)).filter(Boolean);
  const characters = collectGlossary('character');
  const events = collectGlossary('event');
  const locCharLinks = _normLinks(loc.relatedCharacters);
  const locChars = locCharLinks.map(cl=>{const ch=characters.find(c=>c.id===cl.id);return ch?ch.name:null;}).filter(Boolean);
  const locEventLinks = _normLinks(loc.events);
  const locEvents = locEventLinks.map(el=>{const ev=events.find(e=>e.id===el.id);return ev?ev.name:null;}).filter(Boolean);
  const locFactionLinks = _normLinks(loc.relatedFactions);
  const locFactions = locFactionLinks.map(fl=>{const fa=(state.data.factions||[]).find(f=>f.id===fl.id);return fa?fa.name:null;}).filter(Boolean);
  ensurePropertyDefs();
  const customProps = getCustomPropsForScope('locations');
  const cpData = loc.customProps || {};
  const customPropHtml = renderCustomPropWikiHtml(customProps, cpData);
  return `<div class="wiki-page" style="padding:20px">
    <button class="btn btn-sm btn-outline" onclick="goBackExplorer()" style="margin-bottom:12px">← 返回</button>
    <div class="wiki-header"><h2 class="wiki-title">📍 ${esc(loc.name)}</h2>
      <div class="wiki-meta">${loc.category&&loc.category!=='未知'?`<span class="wiki-badge race">${esc(loc.category)}</span>`:''} ${locTags.map(t=>`<span class="wiki-badge gender"><span class="dot" style="background:${t.color};width:6px;height:6px;border-radius:50%;display:inline-block;margin-right:4px"></span>${esc(t.name)}</span>`).join('')}</div>
    </div>
    ${loc.description?`<div class="wiki-section"><div class="wiki-section-title">描述</div><div class="wiki-value">${_renderLinkedContent(loc.description)}</div></div>`:''}
    ${locChars.length>0?`<div class="wiki-section"><div class="wiki-section-title">关联角色</div><div class="wiki-tags">${locChars.map(n=>{const ch=(state.data.characters||[]).find(c=>c.name===n);return ch?`<span class="wiki-tag skill" onclick="event.stopPropagation();showPreviewCard('character','${esc(ch.id)}',event)" style="cursor:pointer">${esc(n)}</span>`:`<span class="wiki-tag skill">${esc(n)}</span>`;}).join('')}</div></div>`:''}
    ${locEvents.length>0?`<div class="wiki-section"><div class="wiki-section-title">关联事件</div><div class="wiki-tags">${locEvents.map(n=>{const ev=(state.data.timeline||[]).find(e=>(e.name||e.title)===n);return ev?`<span class="wiki-tag item" onclick="event.stopPropagation();showPreviewCard('event','${esc(ev.id)}',event)" style="cursor:pointer">${esc(n)}</span>`:`<span class="wiki-tag item">${esc(n)}</span>`;}).join('')}</div></div>`:''}
    ${locFactions.length>0?`<div class="wiki-section"><div class="wiki-section-title">关联势力</div><div class="wiki-tags">${locFactions.map(n=>{const fa=(state.data.factions||[]).find(f=>f.name===n);return fa?`<span class="wiki-tag item" onclick="event.stopPropagation();showPreviewCard('faction','${esc(fa.id)}',event)" style="cursor:pointer">${esc(n)}</span>`:`<span class="wiki-tag item">${esc(n)}</span>`;}).join('')}</div></div>`:''}
    ${customPropHtml?`<div class="wiki-section">${customPropHtml}</div>`:''}
  </div>`;
}

function renderExplorerFactionDetail(f) {
  const characters = collectGlossary('character');
  const fChars = (f.members||[]).map(mid=>{const ch=characters.find(c=>c.id===mid);return ch?ch.name:mid;});
  ensurePropertyDefs();
  const customProps = getCustomPropsForScope('factions');
  const cpData = f.customProps || {};
  const customPropHtml = renderCustomPropWikiHtml(customProps, cpData);
  return `<div class="wiki-page" style="padding:20px">
    <button class="btn btn-sm btn-outline" onclick="goBackExplorer()" style="margin-bottom:12px">← 返回</button>
    <div class="wiki-header"><h2 class="wiki-title">🏰 ${esc(f.name)}</h2>
      <div class="wiki-meta">${f.type?`<span class="wiki-badge race">${esc(f.type)}</span>`:''}</div>
    </div>
    ${f.description?`<div class="wiki-section"><div class="wiki-section-title">描述</div><div class="wiki-value">${_renderLinkedContent(f.description)}</div></div>`:''}
    ${f.goals?`<div class="wiki-section"><div class="wiki-section-title">目标</div><div class="wiki-value">${_renderLinkedContent(f.goals)}</div></div>`:''}
    ${f.resources?`<div class="wiki-section"><div class="wiki-section-title">资源</div><div class="wiki-value">${_renderLinkedContent(f.resources)}</div></div>`:''}
    ${fChars.length>0?`<div class="wiki-section"><div class="wiki-section-title">成员</div><div class="wiki-tags">${fChars.map(n=>{const ch=(state.data.characters||[]).find(c=>c.name===n);return ch?`<span class="wiki-tag skill" onclick="event.stopPropagation();showPreviewCard('character','${esc(ch.id)}',event)" style="cursor:pointer">${esc(n)}</span>`:`<span class="wiki-tag skill">${esc(n)}</span>`;}).join('')}</div></div>`:''}
    ${customPropHtml?`<div class="wiki-section">${customPropHtml}</div>`:''}
  </div>`;
}

function renderExplorerRaceDetail(r) {
  const characters = collectGlossary('character');
  const rChars = (r.relatedCharacters||[]).map(cid=>{const ch=characters.find(c=>c.id===cid);return ch?ch.name:cid;});
  ensurePropertyDefs();
  const customProps = getCustomPropsForScope('races');
  const cpData = r.customProps || {};
  const customPropHtml = renderCustomPropWikiHtml(customProps, cpData);
  return `<div class="wiki-page" style="padding:20px">
    <button class="btn btn-sm btn-outline" onclick="goBackExplorer()" style="margin-bottom:12px">← 返回</button>
    <div class="wiki-header"><h2 class="wiki-title">🧬 ${esc(r.name)}</h2>
      <div class="wiki-meta">${r.category?`<span class="wiki-badge race">${esc(r.category)}</span>`:''}</div>
    </div>
    ${r.description?`<div class="wiki-section"><div class="wiki-section-title">描述</div><div class="wiki-value">${_renderLinkedContent(r.description)}</div></div>`:''}
    ${r.traits?`<div class="wiki-section"><div class="wiki-section-title">特征</div><div class="wiki-value">${_renderLinkedContent(r.traits)}</div></div>`:''}
    ${r.culture?`<div class="wiki-section"><div class="wiki-section-title">文化</div><div class="wiki-value">${_renderLinkedContent(r.culture)}</div></div>`:''}
    ${rChars.length>0?`<div class="wiki-section"><div class="wiki-section-title">相关角色</div><div class="wiki-tags">${rChars.map(n=>{const ch=(state.data.characters||[]).find(c=>c.name===n);return ch?`<span class="wiki-tag skill" onclick="event.stopPropagation();showPreviewCard('character','${esc(ch.id)}',event)" style="cursor:pointer">${esc(n)}</span>`:`<span class="wiki-tag skill">${esc(n)}</span>`;}).join('')}</div></div>`:''}
    ${customPropHtml?`<div class="wiki-section">${customPropHtml}</div>`:''}
  </div>`;
}

function renderExplorerItemDetail(it) {
  ensurePropertyDefs();
  const bp = (state.data.worldBackpacks||[]).find(b=>b.id===it.backpackId);
  const customProps = getCustomPropsForScope('items');
  const cpData = it.customProps || {};
  const customPropHtml = renderCustomPropWikiHtml(customProps, cpData);
  return `<div class="wiki-page" style="padding:20px">
    <button class="btn btn-sm btn-outline" onclick="goBackExplorer()" style="margin-bottom:12px">← 返回</button>
    <div class="wiki-header"><h2 class="wiki-title">${it.icon||'🎲'} ${esc(it.name)}</h2>
      <div class="wiki-meta">${it.type?`<span class="wiki-badge race">${esc(it.type)}</span>`:''} ${it.rarity?`<span class="wiki-badge gender">${esc(getRarityLabel(it.rarity)||it.rarity)}</span>`:''} ${bp?`<span class="wiki-badge skill">🎲 ${esc(bp.name)}</span>`:''}</div>
    </div>
    ${it.description?`<div class="wiki-section"><div class="wiki-section-title">描述</div><div class="wiki-value">${_renderLinkedContent(it.description)}</div></div>`:''}
    ${it.effects?`<div class="wiki-section"><div class="wiki-section-title">效果</div><div class="wiki-value">${_renderLinkedContent(it.effects)}</div></div>`:''}
    ${customPropHtml?`<div class="wiki-section">${customPropHtml}</div>`:''}
  </div>`;
}

function renderExplorerEventDetail(ev) {
  const characters = collectGlossary('character');
  const evCharLinks = _normLinks(ev.relatedCharacters);
  const evChars = evCharLinks.map(cl=>{const ch=characters.find(c=>c.id===cl.id);return ch?ch.name:cl.id;}).filter(Boolean);
  const factions = collectGlossary('faction');
  const evFacLinks = _normLinks(ev.relatedFactions);
  const evFacs = evFacLinks.map(fl=>{const fa=factions.find(f=>f.id===fl.id);return fa?fa.name:fl.id;}).filter(Boolean);
  return `<div class="wiki-page" style="padding:20px">
    <button class="btn btn-sm btn-outline" onclick="goBackExplorer()" style="margin-bottom:12px">← 返回</button>
    <div class="wiki-header"><h2 class="wiki-title">⚡ ${esc(ev.name||ev.title||'未命名')}</h2>
      <div class="wiki-meta">${ev.time?`<span class="wiki-badge race">${esc(ev.time)}</span>`:''} ${ev.type?`<span class="wiki-badge gender">${esc(ev.type)}</span>`:''}</div>
    </div>
    ${ev.description?`<div class="wiki-section"><div class="wiki-section-title">描述</div><div class="wiki-value">${_renderLinkedContent(ev.description)}</div></div>`:''}
    ${evChars.length>0?`<div class="wiki-section"><div class="wiki-section-title">关联角色</div><div class="wiki-tags">${evChars.map(n=>{const ch=(state.data.characters||[]).find(c=>c.name===n);return ch?`<span class="wiki-tag skill" onclick="event.stopPropagation();showPreviewCard('character','${esc(ch.id)}',event)" style="cursor:pointer">${esc(n)}</span>`:`<span class="wiki-tag skill">${esc(n)}</span>`;}).join('')}</div></div>`:''}
    ${evFacs.length>0?`<div class="wiki-section"><div class="wiki-section-title">关联势力</div><div class="wiki-tags">${evFacs.map(n=>{const fa=(state.data.factions||[]).find(f=>f.name===n);return fa?`<span class="wiki-tag item" onclick="event.stopPropagation();showPreviewCard('faction','${esc(fa.id)}',event)" style="cursor:pointer">${esc(n)}</span>`:`<span class="wiki-tag item">${esc(n)}</span>`;}).join('')}</div></div>`:''}
  </div>`;
}

function renderExplorerEncyclopediaDetail(it) {
  const sub = (state.data.encyclopediaSubCategories||[]).find(s=>s.id===it.subCategoryId);
  const cat = sub ? (state.data.encyclopediaCategories||[]).find(c=>c.id===sub.parentId) : null;
  ensurePropertyDefs();
  const customProps = getCustomPropsForScope('encyclopedia_' + (sub ? sub.id : ''));
  const cpData = it.customProps || {};
  const customPropHtml = renderCustomPropWikiHtml(customProps, cpData);
  return `<div class="wiki-page" style="padding:20px">
    <button class="btn btn-sm btn-outline" onclick="goBackExplorer()" style="margin-bottom:12px">← 返回</button>
    <div class="wiki-header"><h2 class="wiki-title">${it.icon||'📄'} ${esc(it.name)}</h2>
      <div class="wiki-meta">${cat?`<span class="wiki-badge race">${cat.icon||'📁'} ${esc(cat.name)}</span>`:''} ${sub?`<span class="wiki-badge gender">${sub.icon||'📂'} ${esc(sub.name)}</span>`:''}</div>
    </div>
    ${it.description?`<div class="wiki-section"><div class="wiki-section-title">描述</div><div class="wiki-value">${_renderLinkedContent(it.description)}</div></div>`:''}
    ${customPropHtml?`<div class="wiki-section">${customPropHtml}</div>`:''}
  </div>`;
}

function renderExplorerVolumeDetail(vol, vi) {
  const chapLinks = (vol.chapters||[]).map((ch, ci) => {
    return `<span class="wiki-tag skill" onclick="event.stopPropagation();showPreviewCard('outline_chapter','chap_${vi}_${ci}',event)" style="cursor:pointer">📄 ${esc(ch.title||'第'+(ci+1)+'章')}</span>`;
  });
  return `<div class="wiki-page" style="padding:20px">
    <button class="btn btn-sm btn-outline" onclick="goBackExplorer()" style="margin-bottom:12px">← 返回</button>
    <div class="wiki-header"><h2 class="wiki-title">📖 ${esc(vol.title||'第'+(vi+1)+'卷')}</h2>
      <div class="wiki-meta"><span class="wiki-badge race">大纲卷</span></div>
    </div>
    ${vol.summary?`<div class="wiki-section"><div class="wiki-section-title">概述</div><div class="wiki-value">${_renderLinkedContent(vol.summary)}</div></div>`:''}
    ${chapLinks.length>0?`<div class="wiki-section"><div class="wiki-section-title">章节</div><div class="wiki-tags">${chapLinks.join('')}</div></div>`:''}
  </div>`;
}

function renderExplorerChapterDetail(chap, vi, ci) {
  const vol = (state.data.outline||[])[vi];
  const sceneLinks = (chap.scenes||[]).map((sc, si) => {
    return `<div class="wiki-field"><span class="wiki-label">场景${si+1}</span><span class="wiki-value">${_renderLinkedContent(sc.summary||sc.description||'')}</span></div>`;
  });
  return `<div class="wiki-page" style="padding:20px">
    <button class="btn btn-sm btn-outline" onclick="goBackExplorer()" style="margin-bottom:12px">← 返回</button>
    <div class="wiki-header"><h2 class="wiki-title">📄 ${esc(chap.title||'第'+(ci+1)+'章')}</h2>
      <div class="wiki-meta"><span class="wiki-badge race" onclick="event.stopPropagation();showPreviewCard('outline_volume','vol_${vi}',event)" style="cursor:pointer">📖 ${esc(vol?vol.title||'第'+(vi+1)+'卷':'')}</span></div>
    </div>
    ${chap.summary?`<div class="wiki-section"><div class="wiki-section-title">概述</div><div class="wiki-value">${_renderLinkedContent(chap.summary)}</div></div>`:''}
    ${sceneLinks.length>0?`<div class="wiki-section"><div class="wiki-section-title">场景</div>${sceneLinks.join('')}</div>`:''}
  </div>`;
}

function renderExplorerWorldSystemDetail(ws) {
  const items = (state.data.items||[]).filter(i=>i.backpackId===ws.id);
  return `<div class="wiki-page" style="padding:20px">
    <button class="btn btn-sm btn-outline" onclick="goBackExplorer()" style="margin-bottom:12px">← 返回</button>
    <div class="wiki-header"><h2 class="wiki-title">🌍 ${esc(ws.name||'未命名系统')}</h2>
      <div class="wiki-meta"><span class="wiki-badge skill">${items.length} 个物品</span></div>
    </div>
    ${items.length>0?`<div class="wiki-section"><div class="wiki-section-title">物品列表</div><div class="wiki-tags">${items.map(it=>`<span class="wiki-tag item" style="cursor:pointer" onclick="showPreviewCard('item','${esc(it.id)}',event)">${it.icon||'📦'} ${esc(it.name)}</span>`).join('')}</div></div>`:'<div class="wiki-section"><div class="wiki-value text-muted">此系统暂无物品</div></div>'}
  </div>`;
}

function navigateToExplorerDetail(type, id) {
  closePreviewCard();
  if (state.activeTab !== 'constitution') {
    state._explorerFromTab = state.activeTab;
    state.activeTab = 'constitution';
    renderTabs();
    renderTabContent();
  }
  showExplorerDetail(type, id);
}

function setupExplorer() {
  state._explorerHistory = [];
}

function renderConstitution() { return renderExplorer(); }
function setupConstitution() { setupExplorer(); }