// ============================================================
// 世界生成器 — 角色
// 依赖: core/state.js, core/utils.js, core/modal.js, core/glossary.js, core/properties.js
// ============================================================

function renderCharacters() {
  return `<div class="char-layout">
    <div class="char-list-panel"><div class="flex-between mb-8"><h3>👤 角色列表</h3><div class="flex-gap"><button class="btn btn-ai btn-sm" onclick="aiGenCharacter()">🤖 AI 生成</button><button class="btn btn-sm btn-primary" onclick="addCharacter()">+</button></div></div>
      <div><select id="char-role-filter" onchange="refreshCharList()" style="width:100%;padding:6px 10px;margin-bottom:8px;background:var(--white);border:1px solid var(--border);border-radius:var(--radius-sm);font-size:13px;font-family:var(--font-body)">
        <option value="all">全部角色</option><option value="主角">主角</option><option value="反派">反派</option><option value="重要配角">重要配角</option><option value="次要角色">次要角色</option><option value="NPC">NPC</option><option value="路人">路人</option></select></div>
      <div id="char-list">${renderCharList()}</div></div>
    <div class="char-detail-panel" id="char-detail">${renderCharDetail()}</div></div>`;
}

function renderCharList() {
  const chars = state.data.characters||[];
  const filter = ($('#char-role-filter')?.value)||'all';
  const filtered = filter==='all'?chars:chars.filter(c=>c.role===filter);
  if (filtered.length===0) return '<div class="empty-state"><div class="icon">👤</div><p>暂无角色</p></div>';
  return filtered.map(c=>`<div class="char-list-item${state.selectedCharacterId===c.id?' selected':''}" data-char-id="${c.id}"><span>${esc(c.name)}</span><span class="char-role">${esc(c.role||'')}</span></div>`).join('');
}

function renderCharDetail() {
  const c = (state.data.characters||[]).find(ch=>ch.id===state.selectedCharacterId);
  if (!c) return '<div class="empty-state"><div class="icon">👆</div><p>选择左侧角色查看详情</p></div>';
  if (state.editingCharacter) return renderCharEditForm(c);
  return renderCharWikiView(c);
}

function renderCharWikiView(c) {
  const factions = collectGlossary('faction');
  const locations = collectGlossary('location');
  const skills = collectGlossary('skills');
  const items = collectGlossary('item');
  const charFactions = (c.factions||[]).length>0 ? c.factions : (c.faction ? [c.faction] : []);
  const charLocations = (c.locations||[]).length>0 ? c.locations : (c.location ? [c.location] : []);
  const dimGroups = {};
  CHAR_DIMENSIONS.forEach(d => { if (!dimGroups[d.group]) dimGroups[d.group]=[]; dimGroups[d.group].push(d); });
  ensurePropertyDefs();
  const customProps = getCustomPropsForScope('characters');
  const cpData = c.customProps || {};
  const customPropHtml = renderCustomPropWikiHtml(customProps, cpData);

  const roleBadge = c.role && c.role!=='未知' ? `<span class="wiki-badge role">${esc(c.role)}</span>` : '';
  const raceArr = Array.isArray(c.race) ? c.race : (c.race && c.race !== '未知' ? [c.race] : []);
  const raceBadge = raceArr.length > 0 ? raceArr.map(r => { const raceObj = (state.data.races||[]).find(ra=>ra.name===r||ra.id===r); const rid = raceObj ? raceObj.id : r; return `<span class="wiki-badge race" style="cursor:pointer" onclick="showPreviewCard('race','${esc(rid)}',event)">${esc(r)}</span>`; }).join('') : '';
  const genderBadge = c.gender && c.gender!=='未知' ? `<span class="wiki-badge gender">${esc(c.gender)}</span>` : '';
  const ageBadge = c.age ? `<span class="wiki-badge age">${esc(c.age)}岁</span>` : '';

  return `<div class="wiki-page">
    <div class="wiki-header">
      <div class="flex-between">
        <div class="flex-gap" style="align-items:center">
          <h2 class="wiki-title">${esc(c.name)}</h2>
        </div>
        <div style="display:flex;align-items:center;gap:12px;flex-shrink:0">
          ${c.avatar ? `<img src="${esc(c.avatar)}" class="wiki-avatar" style="width:72px;height:72px;border-radius:50%;object-fit:cover;border:3px solid var(--accent)">` : ''}
        </div>
      </div>
      <div class="wiki-meta">
        ${roleBadge}${raceBadge}${genderBadge}${ageBadge}
      </div>
      ${charFactions.length>0 ? `<div class="wiki-field"><span class="wiki-label">所属势力</span><div class="wiki-tags">${_normLinks(charFactions).map(fl=>{const f=(state.data.factions||[]).find(fa=>fa.id===fl.id||fa.name===fl.id);const descArg=fl.desc?`, '${jsStr(fl.desc)}'`:'';return f?`<span class="wiki-tag item" onclick="showPreviewCard('faction','${esc(f.id)}',event${descArg})" style="cursor:pointer">${esc(f.name)}</span>`:`<span class="wiki-tag item">${esc(fl.id)}</span>`;}).join('')}</div></div>` : ''}
      ${charLocations.length>0 ? `<div class="wiki-field"><span class="wiki-label">常驻地点</span><div class="wiki-tags">${_normLinks(charLocations).map(ll=>{const l=(state.data.locations||[]).find(lo=>lo.id===ll.id||lo.name===ll.id);const descArg=ll.desc?`, '${jsStr(ll.desc)}'`:'';return l?`<span class="wiki-tag skill" onclick="showPreviewCard('location','${esc(l.id)}',event${descArg})" style="cursor:pointer">${esc(l.name)}</span>`:`<span class="wiki-tag skill">${esc(ll.id)}</span>`;}).join('')}</div></div>` : ''}
      ${customPropHtml?`<div style="margin-top:4px">${customPropHtml}</div>`:''}
    </div>

    ${Object.entries(dimGroups).map(([group,dims]) => {
      const hasContent = dims.some(d => c[d.key] && c[d.key].trim());
      if (!hasContent) return '';
      return `<div class="wiki-section">
        <div class="wiki-section-title">${group}</div>
        ${dims.map(d => {
          if (!c[d.key] || !c[d.key].trim()) return '';
          return `<div class="wiki-field">
            <span class="wiki-label">${d.label}</span>
            <span class="wiki-value">${esc(c[d.key])}</span>
          </div>`;
        }).join('')}
      </div>`;
    }).join('')}

    ${(c.skills||[]).length > 0 ? `<div class="wiki-section">
      <div class="wiki-section-title">技能与能力</div>
      <div class="wiki-tags">${(c.skills||[]).map(s => `<span class="wiki-tag skill">${esc(s)}</span>`).join('')}</div>
    </div>` : ''}
    ${(c.equipment||[]).length > 0 ? `<div class="wiki-section">
      <div class="wiki-section-title">装备</div>
      <div class="wiki-tags">${(c.equipment||[]).map(eid => {
        const item = items.find(i=>i.id===eid);
        return `<span class="wiki-tag item">${esc(item?item.name:eid)}</span>`;
      }).join('')}</div>
    </div>` : ''}
    ${(state.data.worldBackpacks||[]).map(bp => {
      const selectedIds = (c.backpackItems||{})[bp.id]||[];
      const bpItems = (state.data.items||[]).filter(i=>i.backpackId===bp.id && selectedIds.includes(i.id));
      if (bpItems.length === 0) return '';
      return `<div class="wiki-section">
        <div class="wiki-section-title">🎒 ${esc(bp.name)}</div>
        <div class="wiki-tags">${bpItems.map(item => `<span class="wiki-tag item" style="cursor:pointer" onclick="showItemDetail('${item.id}')">${item.icon||'📦'} ${esc(item.name)}</span>`).join('')}</div>
      </div>`;
    }).join('')}
    ${_normLinks(c.relatedEvents).length>0?`<div class="wiki-section"><div class="wiki-section-title">关联事件</div><div class="wiki-tags">${_normLinks(c.relatedEvents).map(el=>{const ev=(state.data.timeline||[]).find(e=>e.id===el.id);const descArg=el.desc?`, '${jsStr(el.desc)}'`:'';return ev?`<span class="wiki-tag item" onclick="showPreviewCard('event','${esc(ev.id)}',event${descArg})" style="cursor:pointer">${esc(ev.name)}</span>`:`<span class="wiki-tag item">${esc(el.id)}</span>`;}).join('')}</div></div>`:''}
    ${_normLinks(c.relatedVolumes).length>0?`<div class="wiki-section"><div class="wiki-section-title">📑 关联卷</div><div class="wiki-tags">${_normLinks(c.relatedVolumes).map(vl=>{const vol=(state.data.outline||[]).find((v,i)=>i===parseInt(vl.id)||v.id===vl.id);return vol?`<span class="wiki-tag item">📖 ${esc(vol.title||'未命名卷')}</span>`:`<span class="wiki-tag item">${esc(vl.id)}</span>`;}).join('')}</div></div>`:''}
    <div class="flex-between" style="margin-top:16px;padding-top:16px;border-top:1px solid var(--border)">
      <button class="btn btn-sm btn-outline" onclick="if(state.navigationHistory.length>0)goBack();else{state.selectedCharacterId=null;renderTabContent()}">← 返回</button>
      <div class="flex-gap">
        <button class="btn btn-sm btn-danger" onclick="deleteCharacter('${c.id}')">🗑️ 删除</button>
        <button class="btn btn-sm btn-primary" onclick="startCharEdit()">✏️ 编辑</button>
      </div>
    </div>
  </div>`;
}

function renderCharEditForm(c) {
  const races = collectGlossary('race');
  const roles = collectGlossary('role');
  const factions = collectGlossary('faction');
  const locations = collectGlossary('location');
  const items = collectGlossary('item');
  const chars = (state.data.characters||[]).filter(ch=>ch.id!==c.id);
  const backpacks = state.data.worldBackpacks||[];
  const charFactions = (c.factions||[]).length>0 ? c.factions : (c.faction ? [c.faction] : []);
  const charLocations = (c.locations||[]).length>0 ? c.locations : (c.location ? [c.location] : []);
  const raceArr = Array.isArray(c.race) ? c.race : (c.race && c.race !== '未知' ? [c.race] : []);
  const dimGroups = {};
  CHAR_DIMENSIONS.forEach(d => { if (d.group === '能力') return; if (!dimGroups[d.group]) dimGroups[d.group]=[]; dimGroups[d.group].push(d); });
  ensurePropertyDefs();
  const customProps = getCustomPropsForScope('characters');
  if (!c.customProps) c.customProps = {};

  const rels = (state.data.characterRelations||[]).filter(r=>r.sourceId===c.id||r.targetId===c.id);

  return `<div class="card">
    <div style="display:flex;gap:20px;align-items:flex-start">
      <div style="flex:1;min-width:0">
        <div class="char-basic-info">
          <div class="form-group"><label>姓名</label><input value="${esc(c.name)}" onchange="updateCharacter('name',this.value)"></div>
          <div class="form-group"><label>角色定位</label>${renderEntrySelect(c.role||'',roles,'选择角色定位',"updateCharacter('role',this.value)")}</div>
          <div class="form-row"><div class="form-group"><label>性别</label><select onchange="updateCharacter('gender',this.value)" style="width:100%;padding:8px 12px;background:var(--white);border:1px solid var(--border);border-radius:var(--radius-sm);font-size:14px;font-family:var(--font-body)"><option value="未知"${!c.gender||c.gender==='未知'?' selected':''}>未知</option><option value="男"${c.gender==='男'?' selected':''}>男</option><option value="女"${c.gender==='女'?' selected':''}>女</option></select></div>
          <div class="form-group"><label>年龄</label><input value="${esc(c.age||'')}" onchange="updateCharacter('age',this.value)"></div></div>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:center;gap:8px;flex-shrink:0">
        ${c.avatar ? `<img src="${esc(c.avatar)}" class="char-avatar-preview" onerror="this.style.display='none'" style="width:120px;height:120px;border-radius:50%;object-fit:cover;border:3px solid var(--border)">` : `<div class="char-avatar-placeholder" style="width:120px;height:120px;border-radius:50%;background:var(--bg-alt);display:flex;align-items:center;justify-content:center;font-size:48px;border:3px dashed var(--border)">👤</div>`}
        <button class="btn btn-xs btn-outline" onclick="uploadCharAvatar()">📷 上传</button>
        ${c.avatar ? `<button class="btn btn-xs btn-outline" onclick="removeCharAvatar()">🗑️ 移除</button>` : ''}
      </div>
    </div>

    <div class="card"><h3>🧬 种族</h3>
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
        ${raceArr.length > 0 ? raceArr.map(r => { const raceObj = (state.data.races||[]).find(ra=>ra.name===r||ra.id===r); const rid = raceObj ? raceObj.id : r; return `<span class="wiki-tag skill" style="cursor:pointer" onclick="showPreviewCard('race','${esc(rid)}',event)">${esc(r)}</span>`; }).join('') : `<span class="wiki-tag skill" style="opacity:0.5">未知</span>`}
        <button class="btn btn-xs btn-outline" onclick="openCharRaceSelectModal()">选择种族</button>
      </div>
    </div>

    <div class="card"><h3>🏰 所属势力</h3>
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px">
        <span class="text-xs text-muted">已选 ${_normLinks(charFactions).length} 个</span>
        <button class="btn btn-xs btn-outline" onclick="openCharFactionSelectModal()">选择势力</button>
      </div>
      ${_normLinks(charFactions).length>0?`<div style="display:flex;flex-direction:column;gap:6px">${_normLinks(charFactions).map(fl=>{const f=(state.data.factions||[]).find(fa=>fa.id===fl.id||fa.name===fl.id);const descHtml=fl.desc?`<span style="font-size:11px;color:var(--text-muted);margin-left:4px">(${esc(fl.desc)})</span>`:'';return f?`<div class="card" style="margin:0;padding:10px 12px;display:flex;align-items:center;gap:8px;cursor:pointer" onclick="showPreviewCard('faction','${esc(f.id)}',event)"><span class="dot" style="background:${f.color||'#888'};width:10px;height:10px;border-radius:50%;flex-shrink:0"></span><span style="font-weight:500;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(f.name)}${descHtml}</span><button class="btn btn-xs" style="padding:2px 6px;font-size:11px;color:var(--warm-gray)" onclick="event.stopPropagation();removeCharFaction('${esc(fl.id)}')">✕</button></div>`:`<div class="card" style="margin:0;padding:10px 12px;display:flex;align-items:center;gap:8px"><span style="flex:1">${esc(fl.id)}${descHtml}</span><button class="btn btn-xs" style="padding:2px 6px;font-size:11px;color:var(--warm-gray)" onclick="removeCharFaction('${esc(fl.id)}')">✕</button></div>`;}).join('')}</div>`:''}
    </div>

    <div class="card"><h3>📍 常驻地点</h3>
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px">
        <span class="text-xs text-muted">已选 ${_normLinks(charLocations).length} 个</span>
        <button class="btn btn-xs btn-outline" onclick="openCharLocationSelectModal()">选择地点</button>
      </div>
      ${_normLinks(charLocations).length>0?`<div style="display:flex;flex-direction:column;gap:6px">${_normLinks(charLocations).map(ll=>{const l=(state.data.locations||[]).find(lo=>lo.id===ll.id||lo.name===ll.id);const descHtml=ll.desc?`<span style="font-size:11px;color:var(--text-muted);margin-left:4px">(${esc(ll.desc)})</span>`:'';return l?`<div class="card" style="margin:0;padding:10px 12px;display:flex;align-items:center;gap:8px;cursor:pointer" onclick="showPreviewCard('location','${esc(l.id)}',event)"><span style="font-weight:500;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">📍 ${esc(l.name)}${descHtml}</span><button class="btn btn-xs" style="padding:2px 6px;font-size:11px;color:var(--warm-gray)" onclick="event.stopPropagation();removeCharLocation('${esc(ll.id)}')">✕</button></div>`:`<div class="card" style="margin:0;padding:10px 12px;display:flex;align-items:center;gap:8px"><span style="flex:1">${esc(ll.id)}${descHtml}</span><button class="btn btn-xs" style="padding:2px 6px;font-size:11px;color:var(--warm-gray)" onclick="removeCharLocation('${esc(ll.id)}')">✕</button></div>`;}).join('')}</div>`:''}
    </div>

    ${Object.entries(dimGroups).map(([group,dims]) => `
    <div class="card"><h4>${group}</h4>
      ${dims.map(d => `<div class="form-group"><label>${d.label}</label><textarea rows="${d.rows}" onchange="updateCharDim('${d.key}',this.value)" style="width:100%;padding:8px 12px;background:var(--white);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--black);font-size:14px;font-family:var(--font-body);resize:vertical">${esc(c[d.key]||'')}</textarea></div>`).join('')}
    </div>`).join('')}

    ${customProps.length>0?`<div class="card"><h4>📝 自定义属性</h4>${customProps.map(prop => {
      const key = 'cp_' + prop.id;
      const val = c.customProps[key] || '';
      return renderCustomPropField(prop, val, `setCharCustomProp('${prop.id}',this.value)`);
    }).join('')}</div>`:''}

    ${backpacks.length===0 ? '' : backpacks.map(bp => {
      const bpItems = (state.data.items||[]).filter(i=>i.backpackId===bp.id);
      const selectedItems = (c.backpackItems||{})[bp.id]||[];
      return `<div class="card"><h3>🎒 ${esc(bp.name)}</h3>
        ${bpItems.length===0 ? '<div class="text-xs text-muted" style="padding:4px 0">此背包为空</div>' :
        `<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px">
          <span class="text-xs text-muted">已选 ${selectedItems.length} 项</span>
          <button class="btn btn-xs btn-outline" onclick="openBackpackSelectModal('${bp.id}')">选择物品</button>
        </div>
        ${selectedItems.length > 0 ? `<div style="display:flex;flex-wrap:wrap;gap:4px">${selectedItems.map(iid => {
          const it = bpItems.find(i=>i.id===iid);
          return it ? `<span class="wiki-tag item" style="cursor:pointer" onclick="showItemDetail('${it.id}')">${it.icon||'📦'} ${esc(it.name)}</span>` : '';
        }).join('')}</div>` : ''}`}
      </div>`;
    }).join('')}

    <div class="card"><h3>⚡ 关联事件</h3>
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px">
        <span class="text-xs text-muted">已选 ${_normLinks(c.relatedEvents).length} 个</span>
        <button class="btn btn-xs btn-outline" onclick="openCharEventModal()">选择事件</button>
      </div>
      ${_normLinks(c.relatedEvents).length>0?`<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px">${_normLinks(c.relatedEvents).map(el=>{const ev=(state.data.timeline||[]).find(e=>e.id===el.id);const descHtml=el.desc?`<span style="font-size:11px;color:var(--text-muted)">(${esc(el.desc)})</span>`:'';return ev?`<span class="wiki-tag item">${esc(ev.name)}${descHtml}<button class="btn btn-xs btn-icon btn-danger" style="font-size:8px;margin-left:2px" onclick="removeCharEvent('${esc(el.id)}')">×</button></span>`:'';}).join('')}</div>`:''}
    </div>

    <div class="card"><h3>📑 关联卷</h3>
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px">
        <span class="text-xs text-muted">已选 ${_normLinks(c.relatedVolumes).length} 个</span>
        <button class="btn btn-xs btn-outline" onclick="openCharVolumeModal()">选择卷</button>
      </div>
      ${_normLinks(c.relatedVolumes).length>0?`<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px">${_normLinks(c.relatedVolumes).map(vl=>{const vol=(state.data.outline||[]).find((v,i)=>i===parseInt(vl.id)||v.id===vl.id);return vol?`<span class="wiki-tag item">📖 ${esc(vol.title||'未命名卷')}<button class="btn btn-xs btn-icon btn-danger" style="font-size:8px;margin-left:2px" onclick="removeCharVolume('${esc(vl.id)}')">×</button></span>`:'';}).join('')}</div>`:''}
    </div>

    <div class="card"><h3>🕸️ 角色关系</h3>
      <p class="text-sm text-muted mb-8">为该角色关联其他角色并标注关系类型</p>
      ${rels.map((r,i) => {
        const isSource = r.sourceId === c.id;
        const otherId = isSource ? r.targetId : r.sourceId;
        const other = chars.find(ch=>ch.id===otherId) || (state.data.characters||[]).find(ch=>ch.id===otherId);
        const relIdx = (state.data.characterRelations||[]).findIndex(rr=>rr.id===r.id);
        return `<div class="relation-edit-item" style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--border);flex-wrap:wrap">
          <span style="font-weight:600">${esc(other?.name||'未知')}</span>
          <input value="${esc(r.type||'')}" onchange="updateRelation(${relIdx},'type',this.value)" placeholder="关系类型" style="padding:4px 8px;background:var(--white);border:1px solid var(--border);border-radius:var(--radius-xs);font-size:12px;font-family:var(--font-body);width:100px">
          <button class="btn btn-xs btn-danger" onclick="deleteRelation(${relIdx})">×</button>
        </div>`;
      }).join('')}
      <div style="margin-top:8px">
        <button class="btn btn-sm btn-outline" onclick="addCharRelation()">+ 添加关系</button>
      </div>
    </div>
    <div class="flex-between" style="margin-top:16px;padding-top:16px;border-top:1px solid var(--border)">
      <div></div>
      <div class="flex-gap">
        <button class="btn btn-sm btn-outline" onclick="cancelCharEdit()">取消</button>
        <button class="btn btn-sm btn-primary" onclick="saveCharEdit()">💾 保存</button>
      </div>
    </div></div>`;
}

let _charEditSnapshot = null;
let _charIsNew = false;

function startCharEdit() {
  const c = (state.data.characters||[]).find(ch=>ch.id===state.selectedCharacterId);
  if (c) _charEditSnapshot = JSON.parse(JSON.stringify(c));
  _charIsNew = false;
  state.editingCharacter = true; state._forceAnimate=true; state._animateScope='detail'; renderTabContent();
}
function saveCharEdit() {
  const c = (state.data.characters||[]).find(ch=>ch.id===state.selectedCharacterId);
  if (c && checkDuplicate(state.data.characters, c.name, c.id)) {
    alert('已存在同名角色！');
    return;
  }
  _charEditSnapshot = null;
  _charIsNew = false;
  state.editingCharacter = false; autoSave(); renderTabContent();
}
function cancelCharEdit() {
  if (_charIsNew) {
    state.data.characters = (state.data.characters||[]).filter(ch=>ch.id!==state.selectedCharacterId);
    state.selectedCharacterId = null;
    _charIsNew = false;
    _charEditSnapshot = null;
    autoSave(); renderTabContent(); return;
  }
  if (_charEditSnapshot) {
    const c = (state.data.characters||[]).find(ch=>ch.id===state.selectedCharacterId);
    if (c) Object.assign(c, _charEditSnapshot);
    _charEditSnapshot = null;
  }
  state.editingCharacter = false; renderTabContent();
}

function renderRaceSelect(currentRace) {
  const races = (state.data.races||[]).map(r=>({id:r.name,name:r.name}));
  const existing = collectGlossary('race');
  const allRaces = [...races];
  existing.forEach(name => { if (!allRaces.find(r=>r.name===name)) allRaces.push({id:name,name}); });
  return renderEntrySelect(currentRace, allRaces, '选择种族', "updateCharacter('race',this.value)");
}

async function openBackpackSelectModal(bpId) {
  const c = (state.data.characters||[]).find(ch=>ch.id===state.selectedCharacterId);
  if (!c) return;
  const bp = (state.data.worldBackpacks||[]).find(b=>b.id===bpId);
  if (!bp) return;
  const bpItems = (state.data.items||[]).filter(i=>i.backpackId===bpId);
  if (bpItems.length === 0) { alert('此背包为空'); return; }
  const selectedIds = (c.backpackItems||{})[bpId]||[];
  const options = bpItems.map(i=>({id:i.id, name:(i.icon||'📦')+' '+i.name}));
  const result = await customSelectModal('🎒 '+bp.name+' — 选择物品', options, selectedIds);
  if (result === null) return;
  if (!c.backpackItems) c.backpackItems = {};
  c.backpackItems[bpId] = result;
  autoSave();
  if (state.editingCharacter) {
    const detail = $('#char-detail');
    if (detail) { detail.innerHTML = renderCharEditForm(c); }
  } else {
    renderTabContent();
  }
}
function resolveLocName(locRef) {
  if (!locRef) return '';
  const locs = state.data.locations||[];
  let found = locs.find(l=>l.id===locRef||l.name===locRef);
  if (!found && locRef.startsWith('id_')) found = locs.find(l=>l.id===locRef);
  return found ? found.name : (locRef.startsWith('id_') ? '未知地点' : locRef);
}

function resolveFactionName(factionRef) {
  if (!factionRef) return '';
  const factions = state.data.factions||[];
  let found = factions.find(f=>f.id===factionRef||f.name===factionRef);
  if (!found && factionRef.startsWith('id_')) found = factions.find(f=>f.id===factionRef);
  return found ? found.name : (factionRef.startsWith('id_') ? '未知势力' : factionRef);
}

function getCharBackpackItems(c) {
  if (!c || !c.backpackItems) return [];
  const allItems = state.data.items || [];
  const result = [];
  Object.values(c.backpackItems).forEach(idList => {
    (idList || []).forEach(itemId => {
      const item = allItems.find(i => i.id === itemId);
      if (item) result.push(item);
    });
  });
  return result;
}

function showPreviewCard(type, id, event, contextDesc) {
  event.stopPropagation();
  event.preventDefault();
  const existing = $('.preview-card');
  if (existing) {
    const sameTrigger = existing._triggerEl === event.currentTarget;
    if (sameTrigger) { closePreviewCard(); return; }
    existing.remove();
  }
  let title = '', subtitle = '', detail = '', navFn = '';
  if (type === 'location') {
    const loc = (state.data.locations||[]).find(l=>l.id===id||l.name===id);
    if (!loc) return;
    title = '📍 ' + esc(loc.name);
    subtitle = loc.category ? `分类: ${esc(loc.category)}` : '';
    detail = (loc.description||'').substring(0, 100);
    navFn = `navigateToLocation('${esc(loc.id)}')`;
  } else if (type === 'faction') {
    const f = (state.data.factions||[]).find(fa=>fa.id===id||fa.name===id);
    if (!f) return;
    title = '🏰 ' + esc(f.name);
    subtitle = f.type ? `类型: ${esc(f.type)}` : '';
    detail = (f.description||'').substring(0, 100);
    navFn = `navigateToFaction('${esc(f.id)}')`;
  } else if (type === 'character') {
    const ch = (state.data.characters||[]).find(c=>c.id===id||c.name===id);
    if (!ch) return;
    title = '👤 ' + esc(ch.name);
    subtitle = [ch.role, ...(Array.isArray(ch.race)?ch.race:ch.race?[ch.race]:[]), ch.gender].filter(Boolean).join(' · ');
    detail = (ch.personality||ch.appearance||ch.background||'').substring(0, 100);
    navFn = `navigateToCharacter('${esc(ch.id)}')`;
  } else if (type === 'race') {
    const r = (state.data.races||[]).find(ra=>ra.id===id||ra.name===id);
    if (!r) return;
    title = '🧬 ' + esc(r.name);
    subtitle = r.category ? `分类: ${esc(r.category)}` : '';
    detail = (r.traits||r.description||'').substring(0, 100);
    navFn = `navigateToRace('${esc(r.id)}')`;
  } else if (type === 'item') {
    const it = (state.data.items||[]).find(i=>i.id===id||i.name===id);
    if (!it) return;
    title = (it.icon||'📦') + ' ' + esc(it.name);
    subtitle = [it.type, getRarityLabel(it.rarity)||''].filter(Boolean).join(' · ');
    detail = (it.description||it.effects||'').substring(0, 100);
    navFn = `showItemDetail('${esc(it.id)}')`;
  } else if (type === 'event') {
    const ev = (state.data.timeline||[]).find(e=>e.id===id||e.name===id);
    if (!ev) return;
    title = '⚡ ' + esc(ev.name || ev.title);
    subtitle = [ev.time, ev.type].filter(Boolean).join(' · ');
    detail = (ev.description||'').substring(0, 100);
    navFn = `navigateToEvent('${esc(ev.id)}')`;
  } else if (type === 'power') {
    const idx = parseInt(id);
    const p = (state.data.powers||[])[idx];
    if (!p) return;
    title = '🔮 ' + esc(p.name || '未命名体系');
    const levelNames = (p.levelEntries||[]).map(le=>le.name).filter(Boolean);
    subtitle = levelNames.length > 0 ? `等级: ${levelNames.join(' → ')}` : '';
    detail = (p.description||'').substring(0, 100);
    navFn = `switchTab('powers')`;
  }
  const contextHtml = contextDesc ? `<div style="color:var(--accent);font-size:12px;margin-bottom:6px;padding:4px 8px;background:var(--bg-alt);border-radius:var(--radius-xs);border-left:3px solid var(--accent)">${esc(contextDesc)}</div>` : '';
  const card = document.createElement('div');
  card.className = 'preview-card';
  card.innerHTML = `<div style="margin-bottom:8px"><strong style="font-size:15px">${title}</strong></div>
    ${contextHtml}
    ${subtitle ? `<div style="color:var(--text-muted);margin-bottom:4px">${subtitle}</div>` : ''}
    ${detail ? `<div style="color:var(--text);margin-bottom:8px;line-height:1.5">${detail}${detail.length>=100?'...':''}</div>` : ''}
    <div style="display:flex;gap:8px">
      <button class="btn btn-sm btn-primary" onclick="${navFn};closePreviewCard()">查看详情</button>
      <button class="btn btn-sm btn-outline" onclick="closePreviewCard()">关闭</button>
    </div>`;
  document.body.appendChild(card);
  card._triggerEl = event.currentTarget;
  const el = event.currentTarget.getBoundingClientRect();
  const cr = card.getBoundingClientRect();
  const gap = 8;
  let left = el.left + el.width / 2 - cr.width / 2;
  left = Math.max(8, Math.min(left, window.innerWidth - cr.width - 8));
  let top = el.top - cr.height - gap;
  if (top < 8) top = el.bottom + gap;
  top = Math.min(top, window.innerHeight - cr.height - 8);
  card.style.left = left + 'px';
  card.style.top = top + 'px';
  requestAnimationFrame(() => { card.classList.add('is-open'); });
  setTimeout(() => { const close = () => { closePreviewCard(); document.removeEventListener('click', close); }; document.addEventListener('click', close); }, 100);
}

function closePreviewCard() {
  const card = document.querySelector('.preview-card');
  if (!card) return;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducedMotion) { card.remove(); return; }
  card.classList.remove('is-open');
  card.classList.add('is-closing');
  card.addEventListener('transitionend', function handler(e) {
    if (e.propertyName === 'opacity' || e.propertyName === 'transform') {
      card.removeEventListener('transitionend', handler);
      card.remove();
    }
  });
  setTimeout(() => { if (card.parentNode) card.remove(); }, 420);
}

function pushNavHistory() {
  state.navigationHistory.push({ activeTab: state.activeTab, selectedLocationId: state.selectedLocationId, selectedCharacterId: state.selectedCharacterId, selectedFactionId: state.selectedFactionId, selectedRaceId: state.selectedRaceId, selectedItemId: state.selectedItemId, selectedEventId: state.selectedEventId });
  if (state.navigationHistory.length > 20) state.navigationHistory.shift();
}

function goBack() {
  if (state.navigationHistory.length === 0) return;
  const prev = state.navigationHistory.pop();
  state.activeTab = prev.activeTab;
  state.selectedLocationId = prev.selectedLocationId;
  state.selectedCharacterId = prev.selectedCharacterId;
  state.selectedFactionId = prev.selectedFactionId;
  state.selectedRaceId = prev.selectedRaceId;
  state.selectedItemId = prev.selectedItemId;
  state.selectedEventId = prev.selectedEventId;
  render();
}

function navigateToRace(raceRef) { pushNavHistory(); const race=(state.data.races||[]).find(r=>r.id===raceRef||r.name===raceRef); state.activeTab='races'; state.selectedRaceId=race?race.id:raceRef; render(); }
function navigateToFaction(factionId) { pushNavHistory(); state.activeTab = 'factions'; state.selectedFactionId = factionId; render(); }
function navigateToLocation(locationId) { pushNavHistory(); state.activeTab = 'locations'; state.selectedLocationId = locationId; render(); }
function navigateToCharacter(characterId) { pushNavHistory(); state.activeTab = 'characters'; state.selectedCharacterId = characterId; render(); }

function setupCharacters() {
  const charList = $('#char-list');
  if (charList) { charList.querySelectorAll('.char-list-item').forEach(item=>{item.onclick=()=>{state.selectedCharacterId=item.dataset.charId;state.editingCharacter=false;state._forceAnimate=true;state._animateScope='detail';renderTabContent();};});}
}

function refreshCharList() {
  const charList = $('#char-list');
  if (charList) { charList.innerHTML = renderCharList(); setupCharacters(); }
}

function addCharacter() {
  const attrs = {}; CHAR_DIMENSIONS.forEach(d=>{attrs[d.key]='';});
  const c = { id:uid(), name:'新角色', role:'', race:[], gender:'', age:'', factions:[], locations:[], relatedEvents:[], relatedVolumes:[], skills:[], equipment:[], backpackItems:{}, avatar:'', customProps:{}, ...attrs };
  state.data.characters.push(c); state.selectedCharacterId=c.id; state.editingCharacter=true; _charIsNew=true; autoSave(); state._forceAnimate=true; state._animateScope='detail'; renderTabContent();
}

async function uploadCharAvatar() {
  const c = (state.data.characters||[]).find(ch=>ch.id===state.selectedCharacterId);
  if (!c) return;
  try {
    if (window.api && window.api.selectImageFile) {
      const result = await window.api.selectImageFile();
      if (result && result.dataUrl) {
        c.avatar = result.dataUrl;
        autoSave();
        renderTabContent();
        return;
      }
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        c.avatar = ev.target.result;
        autoSave();
        renderTabContent();
      };
      reader.readAsDataURL(file);
    };
    input.click();
  } catch (e) {
    alert('上传失败：' + (e.message || '未知错误'));
  }
}

function removeCharAvatar() {
  const c = (state.data.characters||[]).find(ch=>ch.id===state.selectedCharacterId);
  if (!c) return;
  c.avatar = '';
  autoSave();
  renderTabContent();
}

function toggleCharBackpackItem(itemId, checked) {
  const c = (state.data.characters||[]).find(ch=>ch.id===state.selectedCharacterId);
  if (!c) return;
  const item = (state.data.items||[]).find(i=>i.id===itemId);
  if (!item || !item.backpackId) return;
  if (!c.backpackItems) c.backpackItems = {};
  if (!c.backpackItems[item.backpackId]) c.backpackItems[item.backpackId] = [];
  if (checked) {
    if (!c.backpackItems[item.backpackId].includes(itemId)) c.backpackItems[item.backpackId].push(itemId);
  } else {
    c.backpackItems[item.backpackId] = c.backpackItems[item.backpackId].filter(id=>id!==itemId);
  }
  autoSave();
}

async function addCharRelation() {
  const c = (state.data.characters||[]).find(ch=>ch.id===state.selectedCharacterId);
  if (!c) return;
  const chars = (state.data.characters||[]).filter(ch=>ch.id!==c.id);
  if (chars.length === 0) { alert('请先添加其他角色！'); return; }
  const modal = $('#modal-box');
  const overlay = $('#modal-overlay');
  modal.innerHTML = `
    <h3>添加关系</h3>
    <div class="form-group"><label>关联角色</label><select id="char-rel-target" style="width:100%;padding:8px 12px;background:var(--white);border:1px solid var(--border);border-radius:var(--radius-sm);font-size:14px;font-family:var(--font-body)">${chars.map(ch=>`<option value="${ch.id}">${esc(ch.name)}</option>`).join('')}</select></div>
    <div class="form-group"><label>关系类型</label><input id="char-rel-type" placeholder="如：师徒、恋人、宿敌..." style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);font-size:14px;font-family:var(--font-body)"></div>
    <div class="form-group"><label>描述（可选）</label><textarea id="char-rel-desc" rows="2" style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);font-size:14px;font-family:var(--font-body);resize:vertical" placeholder="补充说明"></textarea></div>
    <div class="modal-actions">
      <button class="btn btn-outline" id="char-rel-cancel">取消</button>
      <button class="btn btn-primary" id="char-rel-ok">确定</button>
    </div>`;
  overlay.classList.remove('hidden');
  return new Promise((resolve) => {
    const finish = (val) => { closeModal(); resolve(val); };
    $('#char-rel-ok').onclick = () => {
      const targetId = $('#char-rel-target').value;
      const type = $('#char-rel-type').value;
      const desc = $('#char-rel-desc').value;
      if (!type || !type.trim()) { alert('请填写关系类型'); return; }
      state.data.characterRelations.push({ id: uid(), sourceId: c.id, targetId, type: type.trim(), description: desc||'' });
      autoSave();
      if (state.editingCharacter) { const d=$('#char-detail'); if(d) d.innerHTML=renderCharEditForm(c); } else { renderTabContent(); }
      finish(true);
    };
    $('#char-rel-cancel').onclick = () => finish(false);
    overlay.onclick = (e) => { if (e.target === overlay) finish(false); };
  });
}

async function aiGenCharacter() {
  const el = document.createElement('div');
  el.id = 'ai-char-result';
  const panel = $('#char-detail');
  if (panel) panel.prepend(el);
  const text = await runAI(window.api.aiGenerateCharacter(state.data), el);
  if (text) {
    const json = tryParseJSON(text);
    if (json && json.name) {
      const c = { id:uid(), name:json.name, role:json.role||'', race:json.race?(Array.isArray(json.race)?json.race:[json.race]):[], gender:json.gender||'', age:json.age||'', factions:[], locations:[], relatedEvents:[], skills:json.skills||[], equipment:[], backpackItems:{}, avatar:'' };
      if (json.factions) json.factions.forEach(f => { const fid = typeof f === 'string' ? f : f.id; c.factions.push({id:fid, desc:''}); });
      else if (json.faction) c.factions.push({id:json.faction, desc:''});
      if (json.locations) json.locations.forEach(l => { const lid = typeof l === 'string' ? l : l.id; c.locations.push({id:lid, desc:''}); });
      else if (json.location) c.locations.push({id:json.location, desc:''});
      CHAR_DIMENSIONS.forEach(d=>{c[d.key]=json[d.key]||'';});
      state.data.characters.push(c);
      state.selectedCharacterId = c.id;
      autoSave(); renderTabContent();
    }
  }
}

function updateCharacter(key,value) { const c=(state.data.characters||[]).find(ch=>ch.id===state.selectedCharacterId); if (c) { if (key==='name'&&checkDuplicate(state.data.characters,value,c.id)){alert('已存在同名角色！');renderTabContent();return;} c[key]=value; autoSave(); } }
function setCharCustomProp(propId, value) { const c=(state.data.characters||[]).find(ch=>ch.id===state.selectedCharacterId); if (!c) return; if (!c.customProps) c.customProps = {}; c.customProps['cp_'+propId] = value; autoSave(); }
function updateCharDim(key,value) { const c=(state.data.characters||[]).find(ch=>ch.id===state.selectedCharacterId); if (c) { c[key]=value; autoSave(); } }
function toggleCharSkill(skillName,checked) { const c=(state.data.characters||[]).find(ch=>ch.id===state.selectedCharacterId); if (!c) return; if (!c.skills) c.skills=[]; if (checked) { if (!c.skills.includes(skillName)) c.skills.push(skillName); } else { c.skills=c.skills.filter(s=>s!==skillName); } autoSave(); }
function toggleCharEquip(itemId,checked) { const c=(state.data.characters||[]).find(ch=>ch.id===state.selectedCharacterId); if (!c) return; if (!c.equipment) c.equipment=[]; if (checked) { if (!c.equipment.includes(itemId)) c.equipment.push(itemId); } else { c.equipment=c.equipment.filter(id=>id!==itemId); } autoSave(); }
function removeCharFaction(fid) { const c=(state.data.characters||[]).find(ch=>ch.id===state.selectedCharacterId); if (!c||!c.factions) return; const oldIds=_linkIds(c.factions); c.factions=_removeLink(c.factions,fid); syncLink('character',c.id,'factions',_linkIds(c.factions),'',oldIds); autoSave(); if (state.editingCharacter) { const d=$('#char-detail'); if(d) d.innerHTML=renderCharEditForm(c); } }
function removeCharLocation(lid) { const c=(state.data.characters||[]).find(ch=>ch.id===state.selectedCharacterId); if (!c||!c.locations) return; const oldIds=_linkIds(c.locations); c.locations=_removeLink(c.locations,lid); syncLink('character',c.id,'locations',_linkIds(c.locations),'',oldIds); autoSave(); if (state.editingCharacter) { const d=$('#char-detail'); if(d) d.innerHTML=renderCharEditForm(c); } }
async function openCharFactionSelectModal() {
  const c=(state.data.characters||[]).find(ch=>ch.id===state.selectedCharacterId); if (!c) return;
  const allFactions=(state.data.factions||[]).map(f=>({id:f.id,name:f.name}));
  const result=await customLinkModal('🏰 选择所属势力',allFactions,c.factions||[],'简述关系');
  if (result===null) return;
  const oldIds=_linkIds(c.factions);
  c.factions=result;
  const newIds=result.map(r=>r.id);
  syncLink('character',c.id,'factions',newIds,'',oldIds);
  autoSave();
  if (state.editingCharacter) { const d=$('#char-detail'); if(d) d.innerHTML=renderCharEditForm(c); } else { renderTabContent(); }
}
async function openCharLocationSelectModal() {
  const c=(state.data.characters||[]).find(ch=>ch.id===state.selectedCharacterId); if (!c) return;
  const allLocations=(state.data.locations||[]).map(l=>({id:l.id,name:l.name}));
  const result=await customLinkModal('📍 选择常驻地点',allLocations,c.locations||[],'简述关系');
  if (result===null) return;
  const oldIds=_linkIds(c.locations);
  c.locations=result;
  const newIds=result.map(r=>r.id);
  syncLink('character',c.id,'locations',newIds,'',oldIds);
  autoSave();
  if (state.editingCharacter) { const d=$('#char-detail'); if(d) d.innerHTML=renderCharEditForm(c); } else { renderTabContent(); }
}
function removeCharEvent(eid) { const c=(state.data.characters||[]).find(ch=>ch.id===state.selectedCharacterId); if (!c) return; const oldIds=_linkIds(c.relatedEvents); c.relatedEvents=_removeLink(c.relatedEvents,eid); syncLink('character',c.id,'relatedEvents',_linkIds(c.relatedEvents),'',oldIds); autoSave(); if (state.editingCharacter) { const d=$('#char-detail'); if(d) d.innerHTML=renderCharEditForm(c); } }
async function openCharEventModal() {
  const c=(state.data.characters||[]).find(ch=>ch.id===state.selectedCharacterId); if (!c) return;
  const events=collectGlossary('event');
  if (events.length===0){alert('暂无事件');return;}
  const result=await customLinkModal('⚡ 选择关联事件',events,c.relatedEvents||[],'简述关系');
  if (result===null) return;
  const oldIds=_linkIds(c.relatedEvents);
  c.relatedEvents=result;
  const newIds=result.map(r=>r.id);
  syncLink('character',c.id,'relatedEvents',newIds,'',oldIds);
  autoSave();
  if (state.editingCharacter) { const d=$('#char-detail'); if(d) d.innerHTML=renderCharEditForm(c); } else { renderTabContent(); }
}
async function openCharVolumeModal() {
  const c=(state.data.characters||[]).find(ch=>ch.id===state.selectedCharacterId); if (!c) return;
  const outline=state.data.outline||[];
  if(outline.length===0){alert('暂无卷');return;}
  const volItems=outline.map((v,i)=>({id:String(i),name:v.title||('第'+(i+1)+'卷')}));
  const existingIds=_normLinks(c.relatedVolumes||[]).map(l=>l.id);
  const result=await customSelectModal('📑 选择关联卷',volItems,existingIds);
  if(result===null) return;
  if(!c.relatedVolumes) c.relatedVolumes=[];
  c.relatedVolumes=result.map(id=>({id}));
  autoSave();
  if(state.editingCharacter){const d=$('#char-detail');if(d)d.innerHTML=renderCharEditForm(c);}else{renderTabContent();}
}
function removeCharVolume(id) {
  const c=(state.data.characters||[]).find(ch=>ch.id===state.selectedCharacterId); if (!c) return;
  c.relatedVolumes=_normLinks(c.relatedVolumes||[]).filter(l=>l.id!==id).map(l=>({id:l.id,desc:l.desc}));
  autoSave();
  if(state.editingCharacter){const d=$('#char-detail');if(d)d.innerHTML=renderCharEditForm(c);}else{renderTabContent();}
}
async function openCharRaceSelectModal() {
  const c=(state.data.characters||[]).find(ch=>ch.id===state.selectedCharacterId); if (!c) return;
  const races=(state.data.races||[]).map(r=>({id:r.name,name:r.name}));
  const existing=collectGlossary('race');
  existing.forEach(name=>{if(!races.find(r=>r.id===name))races.push({id:name,name});});
  const currentRaces = Array.isArray(c.race) ? c.race : (c.race && c.race !== '未知' ? [c.race] : []);
  const result=await customSelectModal('🧬 选择种族',races,currentRaces);
  if (result===null) return;
  c.race=result; autoSave();
  if (state.editingCharacter) { const d=$('#char-detail'); if(d) d.innerHTML=renderCharEditForm(c); } else { renderTabContent(); }
}
async function addCharSkill() { const name=await customPrompt('新建技能',''); if (!name||!name.trim()) return; const c=(state.data.characters||[]).find(ch=>ch.id===state.selectedCharacterId); if (!c) return; if (!c.skills) c.skills=[]; if (!c.skills.includes(name.trim())) c.skills.push(name.trim()); autoSave(); if (state.editingCharacter) { const d=$('#char-detail'); if(d) d.innerHTML=renderCharEditForm(c); } else { renderTabContent(); } }
async function deleteCharacter(id) { if (!await customConfirm('确定删除此角色？')) return; state.data.characters=(state.data.characters||[]).filter(c=>c.id!==id); if (state.selectedCharacterId===id) state.selectedCharacterId=null; autoSave(); renderTabContent(); }