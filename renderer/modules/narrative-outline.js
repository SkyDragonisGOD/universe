// ============================================================
// 世界生成器 — 大纲/章节
// 依赖: core/state.js, core/utils.js, core/modal.js, core/glossary.js, core/properties.js, core/ai.js
// ============================================================

function renderOutline() {
  const outline = state.data.outline || [];
  if (!state.outlineCollapsed) state.outlineCollapsed = {};
  if (!state.outlineViewMode) state.outlineViewMode = {};
  const hasLinks = (v) => {
    return _normLinks(v.characters||[]).length > 0 || _normLinks(v.factions||[]).length > 0 || _normLinks(v.locations||[]).length > 0 || _normLinks(v.events||[]).length > 0 || _normLinks(v.items||[]).length > 0 || (v.chapters||[]).length > 0;
  };
  const filterLinked = state.outlineFilterLinked || false;
  const outlineRelDefs = [
    { key:'character', label:'角色', field:'characters', getItems:()=>collectGlossary('character') },
    { key:'faction', label:'势力', field:'factions', getItems:()=>collectGlossary('faction') },
    { key:'location', label:'地点', field:'locations', getItems:()=>collectGlossary('location') },
    { key:'event', label:'事件', field:'events', getItems:()=>(state.data.timeline||[]).map(e=>({id:e.id,name:e.name||e.title||'未命名'})) },
    { key:'item', label:'物品', field:'items', getItems:()=>collectGlossary('item') },
  ];
  const outlineRelMatchDefs = [
    { key:'character', field:'characters' },
    { key:'faction', field:'factions' },
    { key:'location', field:'locations' },
    { key:'event', field:'events' },
    { key:'item', field:'items' },
  ];
  let filteredOutline = filterLinked ? outline.filter(hasLinks) : outline;
  filteredOutline = filteredOutline.filter(v => matchRelFilter(v, 'outlineRelFilter', outlineRelMatchDefs));
  return `<div class="card"><h3>📑 大纲/章节</h3>
    <div class="ai-section-actions"><button class="btn btn-ai btn-sm" onclick="aiGenOutline()">🤖 AI 生成大纲</button><button class="btn btn-sm btn-primary" onclick="addOutlineVolume()">+ 添加卷</button></div>
    <div style="margin-bottom:8px;display:flex;align-items:center;gap:6px"><span style="font-size:12px;color:var(--warm-gray)">筛选：</span><button class="btn btn-xs ${filterLinked?'btn-outline':'btn-primary'}" onclick="state.outlineFilterLinked=false;renderTabContent()">全部</button><button class="btn btn-xs ${filterLinked?'btn-primary':'btn-outline'}" onclick="state.outlineFilterLinked=true;renderTabContent()">有关联/章节</button></div>
    ${renderSearchBox('outlineSearch')}
    ${renderRelFilter('outlineRelFilter', outlineRelDefs)}
    <div id="ai-outline-result"></div>
    <div class="outline-list">${filteredOutline.length===0?'<div class="empty-state"><div class="icon">📑</div><p>暂无大纲</p></div>':filteredOutline.filter(v=>matchSearch(v.name||v.title,'outlineSearch')).map((v)=>{const realIdx=outline.indexOf(v);return renderOutlineVolume(v,realIdx);}).join('')}</div></div>`;
}

function renderOutlineVolume(v,vi) {
  const collapsed = state.outlineCollapsed['vol_'+vi];
  const isEditing = state.outlineViewMode['vol_'+vi] === 'edit';
  const characters = collectGlossary('character');
  const factions = collectGlossary('faction');
  const locations = collectGlossary('location');
  const events = (state.data.timeline||[]);
  const allItems = (state.data.items||[]);
  const charLinks = _normLinks(v.characters||[]);
  const factionLinks = _normLinks(v.factions||[]);
  const locLinks = _normLinks(v.locations||[]);
  const eventLinks = _normLinks(v.events||[]);
  const itemLinks = _normLinks(v.items||[]);
  ensurePropertyDefs();
  const customProps = getCustomPropsForScope('outline');
  if (!v.customProps) v.customProps = {};
  const chapCount = (v.chapters||[]).length;
  const volTitle = v.title ? `第${toChineseNum(vi+1)}卷·${v.title}` : `第${toChineseNum(vi+1)}卷`;

  if (!isEditing) {
    return renderOutlineVolumeView(v, vi, { charLinks, factionLinks, locLinks, eventLinks, itemLinks, characters, factions, locations, events, allItems, customProps, chapCount, volTitle, collapsed });
  }

  return `<div class="outline-volume" data-vi="${vi}" style="border:1px solid var(--border);border-radius:var(--radius-sm);margin-bottom:12px;background:var(--bg-alt);overflow:hidden">
    <div style="padding:12px 16px;display:flex;align-items:center;gap:8px;cursor:pointer;background:var(--bg-alt);border-bottom:${collapsed?'none':'1px solid var(--border)'}" onclick="toggleOutlineCollapse('vol_${vi}')">
      <span style="transition:transform 0.2s;display:inline-block;${collapsed?'':'transform:rotate(90deg)'}">▶</span>
      <span class="ol-vol-drag" style="cursor:grab;font-size:14px;color:var(--warm-gray);user-select:none" title="拖拽排序" onclick="event.stopPropagation()">⠿</span>
      <h4 style="margin:0;flex:1">📖 ${esc(volTitle)}</h4>
      <span class="text-xs text-muted">${chapCount}章</span>
      <div class="flex-gap" onclick="event.stopPropagation()">
        <button class="btn btn-xs btn-outline" onclick="setOutlineViewMode('vol_${vi}','view')">👁 观看</button>
        <button class="btn btn-xs btn-outline" onclick="insertOutlineVolume(${vi})">⬆ 插入</button>
        <button class="btn btn-xs btn-danger" onclick="deleteOutlineVolume(${vi})">×</button>
      </div>
    </div>
    ${collapsed ? '' : `<div style="padding:12px 16px">
    <div class="form-group"><input value="${esc(v.title||'')}" placeholder="卷标题" onchange="updateOutlineVolume(${vi},'title',this.value)" style="width:100%;padding:8px 12px;background:var(--white);border:1px solid var(--border);border-radius:var(--radius-sm);font-size:15px;font-weight:600;font-family:var(--font-body)"></div>
    <div class="form-group"><textarea rows="2" placeholder="卷简介" onchange="updateOutlineVolume(${vi},'summary',this.value)" style="width:100%;padding:8px 12px;background:var(--white);border:1px solid var(--border);border-radius:var(--radius-sm);font-size:14px;font-family:var(--font-body);resize:vertical">${esc(v.summary||'')}</textarea></div>
    ${customProps.length>0?`<div class="card" style="margin-bottom:8px;padding:10px">${customProps.map(prop=>{
      const key='cp_'+prop.id;
      const val=v.customProps[key]||'';
      return renderCustomPropField(prop,val,`setOutlineCustomProp(${vi},'${prop.id}',this.value)`);
    }).join('')}</div>`:''}
    <div class="card" style="margin-bottom:8px;padding:10px"><h4 style="margin:0 0 8px">关联</h4>
      <div class="form-group"><label>关联人物</label>
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <span class="text-xs text-muted">已选 ${charLinks.length} 个</span>
          <button class="btn btn-xs btn-outline" onclick="openOutlineLinkModal(${vi},'characters')">选择</button>
        </div>
        ${charLinks.length>0?`<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px">${charLinks.map(cl=>{const ch=characters.find(c=>c.id===cl.id);return ch?`<span class="wiki-tag skill">${esc(ch.name)}<button class="btn btn-xs btn-icon btn-danger" style="font-size:8px;margin-left:2px" onclick="removeOutlineLink(${vi},'characters','${esc(cl.id)}')">×</button></span>`:'';}).join('')}</div>`:''}
      </div>
      <div class="form-group"><label>关联势力</label>
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <span class="text-xs text-muted">已选 ${factionLinks.length} 个</span>
          <button class="btn btn-xs btn-outline" onclick="openOutlineLinkModal(${vi},'factions')">选择</button>
        </div>
        ${factionLinks.length>0?`<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px">${factionLinks.map(fl=>{const fa=factions.find(f=>f.id===fl.id);return fa?`<span class="wiki-tag item">${esc(fa.name)}<button class="btn btn-xs btn-icon btn-danger" style="font-size:8px;margin-left:2px" onclick="removeOutlineLink(${vi},'factions','${esc(fl.id)}')">×</button></span>`:'';}).join('')}</div>`:''}
      </div>
      <div class="form-group"><label>关联地点</label>
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <span class="text-xs text-muted">已选 ${locLinks.length} 个</span>
          <button class="btn btn-xs btn-outline" onclick="openOutlineLinkModal(${vi},'locations')">选择</button>
        </div>
        ${locLinks.length>0?`<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px">${locLinks.map(ll=>{const loc=locations.find(l=>l.id===ll.id);return loc?`<span class="wiki-tag skill">${esc(loc.name)}<button class="btn btn-xs btn-icon btn-danger" style="font-size:8px;margin-left:2px" onclick="removeOutlineLink(${vi},'locations','${esc(ll.id)}')">×</button></span>`:'';}).join('')}</div>`:''}
      </div>
      <div class="form-group"><label>关联事件</label>
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <span class="text-xs text-muted">已选 ${eventLinks.length} 个</span>
          <button class="btn btn-xs btn-outline" onclick="openOutlineLinkModal(${vi},'events')">选择</button>
        </div>
        ${eventLinks.length>0?`<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px">${eventLinks.map(el=>{const ev=events.find(e=>e.id===el.id);return ev?`<span class="wiki-tag item">${esc(ev.name)}<button class="btn btn-xs btn-icon btn-danger" style="font-size:8px;margin-left:2px" onclick="removeOutlineLink(${vi},'events','${esc(el.id)}')">×</button></span>`:'';}).join('')}</div>`:''}
      </div>
      <div class="form-group"><label>关联物品</label>
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <span class="text-xs text-muted">已选 ${itemLinks.length} 个</span>
          <button class="btn btn-xs btn-outline" onclick="openOutlineItemModal(${vi})">选择</button>
        </div>
        ${itemLinks.length>0?`<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px">${itemLinks.map(il=>{const it=allItems.find(i=>i.id===il.id);return it?`<span class="wiki-tag item">${it.icon||'📦'} ${esc(it.name)}<button class="btn btn-xs btn-icon btn-danger" style="font-size:8px;margin-left:2px" onclick="removeOutlineLink(${vi},'items','${esc(il.id)}')">×</button></span>`:'';}).join('')}</div>`:''}
      </div>
    </div>
    <div class="chapters-list">${(v.chapters||[]).map((ch,ci)=>renderOutlineChapter(ch,vi,ci)).join('')}</div>
    <button class="btn btn-xs btn-outline" style="margin-top:8px" onclick="addOutlineChapter(${vi})">+ 添加章节</button>
    </div>`}
  </div>`;
}

function renderOutlineVolumeView(v, vi, ctx) {
  const { charLinks, factionLinks, locLinks, eventLinks, itemLinks, characters, factions, locations, events, allItems, customProps, chapCount, volTitle, collapsed } = ctx;
  const cpData = v.customProps || {};
  const customPropHtml = renderCustomPropWikiHtml(customProps, cpData);

  function viewTag(item, type) {
    const descArg = item._desc ? `, '${jsStr(item._desc)}'` : '';
    return `<span class="wiki-tag skill" onclick="showPreviewCard('${type}','${esc(item.id)}',event${descArg})" style="cursor:pointer">${esc(item.name)}</span>`;
  }

  const charItems = charLinks.map(l => { const ch = characters.find(c => c.id === l.id); return ch ? { ...ch, _desc: l.desc } : null; }).filter(Boolean);
  const factionItems = factionLinks.map(l => { const f = factions.find(fa => fa.id === l.id); return f ? { ...f, _desc: l.desc } : null; }).filter(Boolean);
  const locItems = locLinks.map(l => { const loc = locations.find(lo => lo.id === l.id); return loc ? { ...loc, _desc: l.desc } : null; }).filter(Boolean);
  const eventItems = eventLinks.map(l => { const ev = events.find(e => e.id === l.id); return ev ? { ...ev, _desc: l.desc } : null; }).filter(Boolean);
  const itemItems = itemLinks.map(l => { const it = allItems.find(i => i.id === l.id); return it ? { ...it, _desc: l.desc } : null; }).filter(Boolean);

  const hasLinks = charItems.length > 0 || factionItems.length > 0 || locItems.length > 0 || eventItems.length > 0 || itemItems.length > 0;

  return `<div class="outline-volume" data-vi="${vi}" style="border:1px solid var(--border);border-radius:var(--radius-sm);margin-bottom:12px;background:var(--bg-alt);overflow:hidden">
    <div style="padding:12px 16px;display:flex;align-items:center;gap:8px;cursor:pointer;background:var(--bg-alt);border-bottom:${collapsed?'none':'1px solid var(--border)'}" onclick="toggleOutlineCollapse('vol_${vi}')">
      <span style="transition:transform 0.2s;display:inline-block;${collapsed?'':'transform:rotate(90deg)'}">▶</span>
      <span class="ol-vol-drag" style="cursor:grab;font-size:14px;color:var(--warm-gray);user-select:none" title="拖拽排序" onclick="event.stopPropagation()">⠿</span>
      <h4 style="margin:0;flex:1">📖 ${esc(volTitle)}</h4>
      <span class="text-xs text-muted">${chapCount}章</span>
      <div class="flex-gap" onclick="event.stopPropagation()">
        <button class="btn btn-xs btn-primary" onclick="setOutlineViewMode('vol_${vi}','edit')">✏️ 编辑</button>
        <button class="btn btn-xs btn-outline" onclick="insertOutlineVolume(${vi})">⬆ 插入</button>
        <button class="btn btn-xs btn-danger" onclick="deleteOutlineVolume(${vi})">×</button>
      </div>
    </div>
    ${collapsed ? '' : `<div style="padding:16px">
      ${v.summary ? `<div style="color:var(--text);margin-bottom:12px;line-height:1.6;white-space:pre-wrap">${esc(v.summary)}</div>` : ''}
      ${customPropHtml ? `<div style="margin-bottom:12px">${customPropHtml}</div>` : ''}
      ${hasLinks ? `<div style="margin-bottom:12px">
        ${charItems.length > 0 ? `<div style="margin-bottom:6px"><span class="text-xs text-muted">👤 人物</span><div class="wiki-tags" style="margin-top:2px">${charItems.map(ch => viewTag(ch, 'character')).join('')}</div></div>` : ''}
        ${factionItems.length > 0 ? `<div style="margin-bottom:6px"><span class="text-xs text-muted">🏰 势力</span><div class="wiki-tags" style="margin-top:2px">${factionItems.map(f => viewTag(f, 'faction')).join('')}</div></div>` : ''}
        ${locItems.length > 0 ? `<div style="margin-bottom:6px"><span class="text-xs text-muted">📍 地点</span><div class="wiki-tags" style="margin-top:2px">${locItems.map(l => viewTag(l, 'location')).join('')}</div></div>` : ''}
        ${eventItems.length > 0 ? `<div style="margin-bottom:6px"><span class="text-xs text-muted">⚡ 事件</span><div class="wiki-tags" style="margin-top:2px">${eventItems.map(e => viewTag(e, 'event')).join('')}</div></div>` : ''}
        ${itemItems.length > 0 ? `<div style="margin-bottom:6px"><span class="text-xs text-muted">📦 物品</span><div class="wiki-tags" style="margin-top:2px">${itemItems.map(it => `<span class="wiki-tag item" style="cursor:pointer" onclick="showItemDetail('${esc(it.id)}')">${it.icon||'📦'} ${esc(it.name)}</span>`).join('')}</div></div>` : ''}
      </div>` : ''}
      ${(v.chapters||[]).length > 0 ? `<div style="border-top:1px solid var(--border);padding-top:12px">${(v.chapters||[]).map((ch,ci) => renderOutlineChapterView(ch, vi, ci)).join('')}</div>` : ''}
    </div>`}
  </div>`;
}

function renderOutlineChapter(ch,vi,ci) {
  const collapsed = state.outlineCollapsed['ch_'+vi+'_'+ci];
  const chTitle = ch.title || `第${toChineseNum(ci+1)}章`;
  const charLinks = _normLinks(ch.characters||[]);
  const factionLinks = _normLinks(ch.factions||[]);
  const locLinks = _normLinks(ch.locations||[]);
  const eventLinks = _normLinks(ch.events||[]);
  const itemLinks = _normLinks(ch.items||[]);
  const characters = collectGlossary('character');
  const factions = collectGlossary('faction');
  const locations = collectGlossary('location');
  const events = (state.data.timeline||[]);
  const allItems = (state.data.items||[]);
  const vol = state.data.outline[vi];
  const volCharLinks = _normLinks(vol.characters||[]);
  const volFactionLinks = _normLinks(vol.factions||[]);
  const volLocLinks = _normLinks(vol.locations||[]);
  const volEventLinks = _normLinks(vol.events||[]);
  const volItemLinks = _normLinks(vol.items||[]);

  function renderVolTags(field, volLinks, allItems, chLinks) {
    const chIds = new Set(chLinks.map(l=>l.id));
    const items = volLinks.map(vl => {
      const item = allItems.find(it => it.id === vl.id);
      return item ? item : null;
    }).filter(Boolean);
    if (items.length === 0) return `<span class="text-xs text-muted">卷内无关联</span>`;
    return items.map(item => {
      const active = chIds.has(item.id);
      return `<span class="wiki-tag ${active?'skill':''}" style="cursor:pointer;font-size:11px;${active?'':'opacity:0.45;background:var(--bg-alt);border:1px dashed var(--border);color:var(--text-muted)'}" onclick="toggleChapterVolLink(${vi},${ci},'${field}','${esc(item.id)}',${!active})">${esc(item.name)}</span>`;
    }).join('');
  }

  return `<div class="outline-chapter" data-vi="${vi}" data-ci="${ci}" style="border:1px solid var(--border);border-radius:var(--radius-xs);margin-bottom:6px;background:var(--white);overflow:hidden">
    <div style="padding:8px 12px;display:flex;align-items:center;gap:6px;cursor:pointer;background:var(--white);border-bottom:${collapsed?'none':'1px solid var(--border)'}" onclick="toggleOutlineCollapse('ch_${vi}_${ci}')">
      <span style="transition:transform 0.2s;display:inline-block;font-size:10px;${collapsed?'':'transform:rotate(90deg)'}">▶</span>
      <span class="ol-ch-drag" style="cursor:grab;font-size:12px;color:var(--warm-gray);user-select:none" title="拖拽排序" onclick="event.stopPropagation()">⠿</span>
      <strong style="flex:1;font-size:13px">📄 ${esc(chTitle)}</strong>
      <div style="display:flex;gap:2px" onclick="event.stopPropagation()">
        <button class="btn btn-xs btn-outline" style="padding:0 4px;font-size:10px" onclick="insertOutlineChapter(${vi},${ci})" title="在此处插入">⬆</button>
        <button class="btn btn-xs btn-danger" style="padding:0 4px;font-size:10px" onclick="deleteOutlineChapter(${vi},${ci})">×</button>
      </div>
    </div>
    ${collapsed ? '' : `<div style="padding:10px 12px">
    <div class="form-group"><input value="${esc(ch.title||'')}" placeholder="章节标题" onchange="updateOutlineChapter(${vi},${ci},'title',this.value)" style="width:100%;padding:6px 10px;background:var(--white);border:1px solid var(--border);border-radius:var(--radius-sm);font-size:14px;font-family:var(--font-body)"></div>
    <div class="form-group"><textarea rows="2" placeholder="章节概要" onchange="updateOutlineChapter(${vi},${ci},'summary',this.value)" style="width:100%;padding:6px 10px;background:var(--white);border:1px solid var(--border);border-radius:var(--radius-sm);font-size:13px;font-family:var(--font-body);resize:vertical">${esc(ch.summary||'')}</textarea></div>
    <div style="margin-top:6px;padding:8px;background:var(--bg-alt);border-radius:var(--radius-xs)">
      <div style="font-size:11px;font-weight:500;margin-bottom:6px;color:var(--text-muted)">卷内关联（点击标签切换）</div>
      <div style="margin-bottom:6px"><span style="font-size:11px;color:var(--warm-gray);margin-right:4px">👤</span>${renderVolTags('characters', volCharLinks, characters, charLinks)}</div>
      <div style="margin-bottom:6px"><span style="font-size:11px;color:var(--warm-gray);margin-right:4px">🏰</span>${renderVolTags('factions', volFactionLinks, factions, factionLinks)}</div>
      <div style="margin-bottom:6px"><span style="font-size:11px;color:var(--warm-gray);margin-right:4px">📍</span>${renderVolTags('locations', volLocLinks, locations, locLinks)}</div>
      <div style="margin-bottom:6px"><span style="font-size:11px;color:var(--warm-gray);margin-right:4px">⚡</span>${renderVolTags('events', volEventLinks, events, eventLinks)}</div>
      <div><span style="font-size:11px;color:var(--warm-gray);margin-right:4px">📦</span>${renderVolTags('items', volItemLinks, allItems, itemLinks)}</div>
    </div>
    </div>`}
  </div>`;
}

function renderOutlineChapterView(ch, vi, ci) {
  const chTitle = ch.title || `第${toChineseNum(ci+1)}章`;
  const collapsed = state.outlineCollapsed['chview_'+vi+'_'+ci];
  const charLinks = _normLinks(ch.characters||[]);
  const factionLinks = _normLinks(ch.factions||[]);
  const locLinks = _normLinks(ch.locations||[]);
  const eventLinks = _normLinks(ch.events||[]);
  const itemLinks = _normLinks(ch.items||[]);
  const characters = collectGlossary('character');
  const factions = collectGlossary('faction');
  const locations = collectGlossary('location');
  const events = (state.data.timeline||[]);
  const allItems = (state.data.items||[]);
  const charItems = charLinks.map(l => { const ch2 = characters.find(c => c.id === l.id); return ch2 ? { ...ch2, _desc: l.desc } : null; }).filter(Boolean);
  const factionItems = factionLinks.map(l => { const f = factions.find(fa => fa.id === l.id); return f ? { ...f, _desc: l.desc } : null; }).filter(Boolean);
  const locItems = locLinks.map(l => { const loc = locations.find(lo => lo.id === l.id); return loc ? { ...loc, _desc: l.desc } : null; }).filter(Boolean);
  const eventItems = eventLinks.map(l => { const ev = events.find(e => e.id === l.id); return ev ? { ...ev, _desc: l.desc } : null; }).filter(Boolean);
  const itemItems = itemLinks.map(l => { const it = allItems.find(i => i.id === l.id); return it ? { ...it, _desc: l.desc } : null; }).filter(Boolean);
  const hasLinks = charItems.length > 0 || factionItems.length > 0 || locItems.length > 0 || eventItems.length > 0 || itemItems.length > 0;
  const linkCount = charItems.length + factionItems.length + locItems.length + eventItems.length + itemItems.length;

  function viewTag(item, type) {
    const descArg = item._desc ? `, '${jsStr(item._desc)}'` : '';
    return `<span class="wiki-tag skill" onclick="showPreviewCard('${type}','${esc(item.id)}',event${descArg})" style="cursor:pointer">${esc(item.name)}</span>`;
  }

  return `<div style="border:1px solid var(--border-subtle);border-radius:var(--radius-xs);margin-bottom:6px;background:var(--white);overflow:hidden">
    <div style="padding:8px 12px;display:flex;align-items:center;gap:6px;cursor:pointer" onclick="toggleOutlineCollapse('chview_${vi}_${ci}')">
      <span style="transition:transform 0.2s;display:inline-block;font-size:10px;${collapsed?'':'transform:rotate(90deg)'}">▶</span>
      <strong style="flex:1;font-size:13px">📄 ${esc(chTitle)}</strong>
      ${linkCount > 0 ? `<span class="text-xs text-muted">${linkCount}项关联</span>` : ''}
    </div>
    ${collapsed ? '' : `<div style="padding:6px 12px 10px">
      ${ch.summary ? `<div style="color:var(--text);font-size:13px;line-height:1.5;margin-bottom:6px;white-space:pre-wrap">${esc(ch.summary)}</div>` : `<div class="text-xs text-muted" style="margin-bottom:4px">暂无概要</div>`}
      ${hasLinks ? `<div>
        ${charItems.length > 0 ? `<div style="margin-bottom:4px"><span class="text-xs text-muted">👤</span> ${charItems.map(ch2 => viewTag(ch2, 'character')).join('')}</div>` : ''}
        ${factionItems.length > 0 ? `<div style="margin-bottom:4px"><span class="text-xs text-muted">🏰</span> ${factionItems.map(f => viewTag(f, 'faction')).join('')}</div>` : ''}
        ${locItems.length > 0 ? `<div style="margin-bottom:4px"><span class="text-xs text-muted">📍</span> ${locItems.map(l => viewTag(l, 'location')).join('')}</div>` : ''}
        ${eventItems.length > 0 ? `<div style="margin-bottom:4px"><span class="text-xs text-muted">⚡</span> ${eventItems.map(e => viewTag(e, 'event')).join('')}</div>` : ''}
        ${itemItems.length > 0 ? `<div><span class="text-xs text-muted">📦</span> ${itemItems.map(it => `<span class="wiki-tag item" style="cursor:pointer" onclick="showItemDetail('${esc(it.id)}')">${it.icon||'📦'} ${esc(it.name)}</span>`).join('')}</div>` : ''}
      </div>` : ''}
    </div>`}
  </div>`;
}

function setupOutline() {
  const list = document.querySelector('.outline-list');
  if (!list) return;
  let dragState = null;

  list.querySelectorAll('.ol-vol-drag').forEach(handle => {
    handle.addEventListener('mousedown', function(ev) {
      if (ev.button !== 0) return;
      ev.preventDefault();
      const volEl = this.closest('.outline-volume');
      if (!volEl) return;
      const vi = parseInt(volEl.dataset.vi);
      const rect = volEl.getBoundingClientRect();
      dragState = { type: 'volume', vi, el: volEl, offsetY: ev.clientY - rect.top, startX: ev.clientX, startY: ev.clientY, moved: false, ghost: null, origEl: volEl };
    });
  });

  list.querySelectorAll('.ol-ch-drag').forEach(handle => {
    handle.addEventListener('mousedown', function(ev) {
      if (ev.button !== 0) return;
      ev.preventDefault();
      const chEl = this.closest('.outline-chapter');
      if (!chEl) return;
      const vi = parseInt(chEl.dataset.vi);
      const ci = parseInt(chEl.dataset.ci);
      const rect = chEl.getBoundingClientRect();
      dragState = { type: 'chapter', vi, ci, el: chEl, offsetY: ev.clientY - rect.top, startX: ev.clientX, startY: ev.clientY, moved: false, ghost: null, origEl: chEl };
    });
  });

  function moveOutlineDrag(clientX, clientY) {
    if (!dragState) return;
    const dx = clientX - dragState.startX;
    const dy = clientY - dragState.startY;
    if (!dragState.moved && Math.abs(dx) + Math.abs(dy) < 5) return;
    dragState.moved = true;
    dragState.origEl.style.opacity = '0.3';
    if (!dragState.ghost) {
      const ghost = dragState.origEl.cloneNode(true);
      ghost.style.position = 'fixed';
      ghost.style.zIndex = '10000';
      ghost.style.pointerEvents = 'none';
      ghost.style.opacity = '0.85';
      ghost.style.width = dragState.origEl.offsetWidth + 'px';
      ghost.style.boxShadow = '0 8px 24px rgba(0,0,0,0.18)';
      ghost.style.transition = 'none';
      document.body.appendChild(ghost);
      dragState.ghost = ghost;
    }
    dragState.ghost.style.left = dragState.origEl.getBoundingClientRect().left + 'px';
    dragState.ghost.style.top = (clientY - dragState.offsetY) + 'px';

    list.querySelectorAll('.ol-drop-indicator').forEach(el => el.remove());
    if (dragState.type === 'volume') {
      const vols = list.querySelectorAll('.outline-volume');
      for (let i = 0; i < vols.length; i++) {
        const r = vols[i].getBoundingClientRect();
        if (clientY < r.top + r.height / 2) {
          const ind = document.createElement('div');
          ind.className = 'ol-drop-indicator';
          ind.style.cssText = 'height:3px;background:var(--accent);border-radius:2px;margin:4px 0';
          vols[i].before(ind);
          break;
        }
        if (i === vols.length - 1) {
          const ind = document.createElement('div');
          ind.className = 'ol-drop-indicator';
          ind.style.cssText = 'height:3px;background:var(--accent);border-radius:2px;margin:4px 0';
          vols[i].after(ind);
        }
      }
    } else if (dragState.type === 'chapter') {
      const volEl = list.querySelector(`.outline-volume[data-vi="${dragState.vi}"]`);
      if (!volEl) return;
      const chs = volEl.querySelectorAll('.outline-chapter');
      for (let i = 0; i < chs.length; i++) {
        const r = chs[i].getBoundingClientRect();
        if (clientY < r.top + r.height / 2) {
          const ind = document.createElement('div');
          ind.className = 'ol-drop-indicator';
          ind.style.cssText = 'height:3px;background:var(--accent);border-radius:2px;margin:2px 0';
          chs[i].before(ind);
          break;
        }
        if (i === chs.length - 1) {
          const ind = document.createElement('div');
          ind.className = 'ol-drop-indicator';
          ind.style.cssText = 'height:3px;background:var(--accent);border-radius:2px;margin:2px 0';
          chs[i].after(ind);
        }
      }
    }
  }

  function endOutlineDrag() {
    if (!dragState) return;
    if (dragState.ghost) dragState.ghost.remove();
    dragState.origEl.style.opacity = '';
    list.querySelectorAll('.ol-drop-indicator').forEach(el => el.remove());
    dragState = null;
  }

  if (window._olMouseMove) document.removeEventListener('mousemove', window._olMouseMove);
  if (window._olMouseUp) document.removeEventListener('mouseup', window._olMouseUp);

  window._olMouseMove = function(ev) { if (!dragState) return; ev.preventDefault(); moveOutlineDrag(ev.clientX, ev.clientY); };
  window._olMouseUp = function(ev) {
    if (!dragState) return;
    if (!dragState.moved) { endOutlineDrag(); return; }

    if (dragState.type === 'volume') {
      const vols = list.querySelectorAll('.outline-volume');
      let dropIdx = state.data.outline.length;
      for (let i = 0; i < vols.length; i++) {
        const r = vols[i].getBoundingClientRect();
        if (ev.clientY < r.top + r.height / 2) { dropIdx = i; break; }
      }
      const fromIdx = dragState.vi;
      if (fromIdx !== dropIdx && fromIdx !== dropIdx - 1) {
        const arr = state.data.outline;
        const item = arr.splice(fromIdx, 1)[0];
        const insertAt = dropIdx > fromIdx ? dropIdx - 1 : dropIdx;
        arr.splice(insertAt, 0, item);
        autoSave();
        renderTabContent();
      }
    } else if (dragState.type === 'chapter') {
      const volEl = list.querySelector(`.outline-volume[data-vi="${dragState.vi}"]`);
      if (!volEl) { endOutlineDrag(); return; }
      const chs = volEl.querySelectorAll('.outline-chapter');
      const chapters = state.data.outline[dragState.vi].chapters;
      let dropIdx = chapters.length;
      for (let i = 0; i < chs.length; i++) {
        const r = chs[i].getBoundingClientRect();
        if (ev.clientY < r.top + r.height / 2) { dropIdx = i; break; }
      }
      const fromIdx = dragState.ci;
      if (fromIdx !== dropIdx && fromIdx !== dropIdx - 1) {
        const item = chapters.splice(fromIdx, 1)[0];
        const insertAt = dropIdx > fromIdx ? dropIdx - 1 : dropIdx;
        chapters.splice(insertAt, 0, item);
        autoSave();
        renderTabContent();
      }
    }

    endOutlineDrag();
  };

  document.addEventListener('mousemove', window._olMouseMove);
  document.addEventListener('mouseup', window._olMouseUp);
}

function toggleOutlineCollapse(key) { if (!state.outlineCollapsed) state.outlineCollapsed = {}; state.outlineCollapsed[key] = !state.outlineCollapsed[key]; renderTabContent(); }
function setOutlineViewMode(key, mode) { if (!state.outlineViewMode) state.outlineViewMode = {}; state.outlineViewMode[key] = mode; renderTabContent(); }
function addOutlineVolume() { if(!state.data.outline) state.data.outline=[]; state.data.outline.push({title:'',summary:'',chapters:[],characters:[],factions:[],locations:[],events:[],items:[],customProps:{}}); autoSave(); renderTabContent(); }
function insertOutlineVolume(vi) { if(!state.data.outline) state.data.outline=[]; state.data.outline.splice(vi,0,{title:'',summary:'',chapters:[],characters:[],factions:[],locations:[],events:[],items:[],customProps:{}}); autoSave(); renderTabContent(); }
function addOutlineChapter(vi) { if (!state.data.outline[vi].chapters) state.data.outline[vi].chapters=[]; state.data.outline[vi].chapters.push({title:'',summary:'',characters:[],factions:[],locations:[],events:[],items:[]}); autoSave(); renderTabContent(); }
function insertOutlineChapter(vi,ci) { if (!state.data.outline[vi].chapters) state.data.outline[vi].chapters=[]; state.data.outline[vi].chapters.splice(ci,0,{title:'',summary:'',characters:[],factions:[],locations:[],events:[],items:[]}); autoSave(); renderTabContent(); }
async function aiGenOutline() { const el=$('#ai-outline-result'); const text=await runAI(window.api.aiGenerateOutline(state.data),el); if (text) { const arr=tryParseJSONArray(text)||tryParseJSON(text); if (arr&&Array.isArray(arr)) { if (!state.data.outline) state.data.outline=[]; arr.forEach(v=>state.data.outline.push({title:v.title||'',summary:v.summary||'',chapters:(v.chapters||[]).map(ch=>({title:ch.title||ch||'',summary:ch.summary||'',characters:[],factions:[],locations:[],events:[],items:[]})),characters:[],factions:[],locations:[],events:[],items:[],customProps:{}})); autoSave(); renderTabContent(); } } }
function updateOutlineVolume(vi,key,value) { if (state.data.outline&&state.data.outline[vi]) { state.data.outline[vi][key]=value; autoSave(); } }
function updateOutlineChapter(vi,ci,key,value) { if (state.data.outline&&state.data.outline[vi]&&state.data.outline[vi].chapters&&state.data.outline[vi].chapters[ci]) { state.data.outline[vi].chapters[ci][key]=value; autoSave(); } }
async function deleteOutlineVolume(vi) { if (!await customConfirm('删除此卷？')) return; state.data.outline.splice(vi,1); autoSave(); renderTabContent(); }
function deleteOutlineChapter(vi,ci) { state.data.outline[vi].chapters.splice(ci,1); autoSave(); renderTabContent(); }
function setOutlineCustomProp(vi,propId,value) { if(!state.data.outline||!state.data.outline[vi]) return; if(!state.data.outline[vi].customProps) state.data.outline[vi].customProps={}; state.data.outline[vi].customProps['cp_'+propId]=value; autoSave(); }
async function openOutlineLinkModal(vi,field) {
  const v = state.data.outline[vi]; if(!v) return;
  const existing = _normLinks(v[field]||[]);
  const existingIds = existing.map(l=>l.id);
  let items=[], label='';
  if(field==='characters'){ items=collectGlossary('character'); label='关联人物'; }
  else if(field==='factions'){ items=collectGlossary('faction'); label='关联势力'; }
  else if(field==='locations'){ items=collectGlossary('location'); label='关联地点'; }
  else if(field==='events'){ items=(state.data.timeline||[]); label='关联事件'; }
  const result = await customSelectModal(label, items, existingIds);
  if(result===null) return;
  v[field] = result.map(id=>({id}));
  autoSave(); renderTabContent();
}
function removeOutlineLink(vi,field,id) {
  const v = state.data.outline[vi]; if(!v) return;
  v[field] = _normLinks(v[field]||[]).filter(l=>l.id!==id).map(l=>({id:l.id,desc:l.desc}));
  autoSave(); renderTabContent();
}
async function openOutlineItemModal(vi) {
  const v = state.data.outline[vi]; if(!v) return;
  const allItems = state.data.items || [];
  if(allItems.length===0){ await customConfirm('暂无物品，请先在世界系统中添加物品'); return; }
  const existingIds = _normLinks(v.items||[]).map(l=>l.id);
  const itemOptions = allItems.map(it=>({id:it.id,name:(it.icon||'📦')+' '+(it.name||'未命名')}));
  const result = await customSelectModal('📦 选择关联物品',itemOptions,existingIds);
  if(result===null) return;
  v.items = result.map(id=>({id}));
  autoSave(); renderTabContent();
}
async function openChapterLinkModal(vi,ci,field) {
  const ch = state.data.outline[vi].chapters[ci]; if(!ch) return;
  if(!ch[field]) ch[field] = [];
  const existing = _normLinks(ch[field]);
  const existingIds = existing.map(l=>l.id);
  let items=[], label='';
  if(field==='characters'){ items=collectGlossary('character'); label='关联人物'; }
  else if(field==='factions'){ items=collectGlossary('faction'); label='关联势力'; }
  else if(field==='locations'){ items=collectGlossary('location'); label='关联地点'; }
  else if(field==='events'){ items=(state.data.timeline||[]); label='关联事件'; }
  const result = await customSelectModal(label, items, existingIds);
  if(result===null) return;
  ch[field] = result.map(id=>({id}));
  autoSave(); renderTabContent();
}
function removeChapterLink(vi,ci,field,id) {
  const ch = state.data.outline[vi].chapters[ci]; if(!ch) return;
  ch[field] = _normLinks(ch[field]||[]).filter(l=>l.id!==id).map(l=>({id:l.id,desc:l.desc}));
  autoSave(); renderTabContent();
}
function toggleChapterVolLink(vi,ci,field,id,checked) {
  const ch = state.data.outline[vi].chapters[ci]; if(!ch) return;
  if (!ch[field]) ch[field] = [];
  const links = _normLinks(ch[field]);
  if (checked) {
    if (!links.some(l=>l.id===id)) { links.push({id}); }
  } else {
    const idx = links.findIndex(l=>l.id===id);
    if (idx >= 0) links.splice(idx,1);
  }
  ch[field] = links;
  autoSave(); renderTabContent();
}
async function openChapterItemModal(vi,ci) {
  const ch = state.data.outline[vi].chapters[ci]; if(!ch) return;
  if(!ch.items) ch.items = [];
  const allItems = state.data.items || [];
  if(allItems.length===0){ await customConfirm('暂无物品，请先在世界系统中添加物品'); return; }
  const existingIds = _normLinks(ch.items||[]).map(l=>l.id);
  const itemOptions = allItems.map(it=>({id:it.id,name:(it.icon||'📦')+' '+(it.name||'未命名')}));
  const result = await customSelectModal('📦 选择关联物品',itemOptions,existingIds);
  if(result===null) return;
  ch.items = result.map(id=>({id}));
  autoSave(); renderTabContent();
}