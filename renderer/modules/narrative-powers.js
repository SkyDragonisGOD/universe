// ============================================================
// 世界生成器 — 力量体系
// 依赖: core/state.js, core/utils.js, core/modal.js, core/glossary.js, core/properties.js, core/ai.js
// ============================================================

function renderPowers() {
  const powers = state.data.powers||[];
  ensurePropertyDefs();
  const customProps = getCustomPropsForScope('powers');
  const hasLinks = (p) => {
    return _normLinks(p.relatedPowers||[]).length > 0 || (p.levelEntries||[]).length > 0 || (p.description||'').trim() !== '' || (p.rules||'').trim() !== '';
  };
  const filterLinked = state.powerFilterLinked || false;
  const powerRelDefs = [
    { key:'power', label:'🔮 体系', field:'relatedPowers', getItems:()=>(state.data.powers||[]).map((p,i)=>({id:String(i),name:p.name||'未命名体系'})) },
  ];
  const powerRelMatchDefs = [
    { key:'power', field:'relatedPowers' },
  ];
  let filteredPowers = filterLinked ? powers.filter(hasLinks) : powers;
  filteredPowers = filteredPowers.filter(p => matchRelFilter(p, 'powerRelFilter', powerRelMatchDefs));
  return `<div class="card"><h3>⚡ 力量体系</h3><div class="flex-between mb-8"><div class="flex-gap"><button class="btn btn-ai btn-sm" onclick="aiGenPowers()">🤖 AI 生成</button><button class="btn btn-sm btn-primary" onclick="addPower()">+ 添加体系</button></div></div>
    <div style="margin-bottom:8px;display:flex;align-items:center;gap:6px"><span style="font-size:12px;color:var(--warm-gray)">筛选：</span><button class="btn btn-xs ${filterLinked?'btn-outline':'btn-primary'}" onclick="state.powerFilterLinked=false;renderTabContent()">全部</button><button class="btn btn-xs ${filterLinked?'btn-primary':'btn-outline'}" onclick="state.powerFilterLinked=true;renderTabContent()">有关联/内容</button></div>
    ${renderSearchBox('powerSearch')}
    ${renderRelFilter('powerRelFilter', powerRelDefs)}
    <div id="ai-powers-result"></div><div class="powers-list" id="powers-list">${filteredPowers.length===0?'<div class="empty-state"><div class="icon">⚡</div><p>暂无力量体系</p></div>':filteredPowers.filter(p=>matchSearch(p.name,'powerSearch')).map((p,i)=>{const realIdx=powers.indexOf(p);return renderPowerItem(p,realIdx,customProps);}).join('')}</div></div>`;
}

function renderPowerItem(p,i,customProps) {
  if (!p.levels) p.levels = [];
  if (!p.levelEntries) p.levelEntries = [];
  if (!p.customProps) p.customProps = {};
  if (!p.relatedPowers) p.relatedPowers = [];
  const allPowers = (state.data.powers||[]).filter((_,pi)=>pi!==i);
  const relatedLinks = _normLinks(p.relatedPowers);

  const levelEntriesHtml = p.levelEntries.map((le,li) => {
    const leDesc = le.desc || '';
    return `<div style="display:flex;gap:6px;align-items:flex-start;margin-bottom:6px;padding:8px;background:var(--white);border:1px solid var(--border);border-radius:var(--radius-xs)">
      <span style="color:var(--warm-gray);font-size:12px;padding-top:8px;flex-shrink:0">${li+1}.</span>
      <div style="flex:1;min-width:0">
        <input value="${esc(le.name||'')}" placeholder="等级/境界名称" onchange="updatePowerLevelEntry(${i},${li},'name',this.value)" style="width:100%;padding:4px 8px;background:var(--white);border:1px solid var(--border);border-radius:var(--radius-xs);font-size:13px;font-family:var(--font-body)">
        <textarea rows="1" placeholder="简述（如：此境界特征、突破条件等）" onchange="updatePowerLevelEntry(${i},${li},'desc',this.value)" style="width:100%;padding:4px 8px;background:var(--white);border:1px solid var(--border);border-radius:var(--radius-xs);font-size:12px;font-family:var(--font-body);resize:vertical;margin-top:4px">${esc(leDesc)}</textarea>
      </div>
      <button class="btn btn-xs btn-danger" style="flex-shrink:0" onclick="removePowerLevelEntry(${i},${li})">×</button>
    </div>`;
  }).join('');

  const levelTagsHtml = p.levelEntries.filter(le=>le.name).map((le,li) => {
    const descAttr = le.desc ? ` title="${esc(le.desc)}"` : '';
    return `<span class="wiki-tag skill" style="cursor:pointer"${descAttr} onclick="openPowerLevelDetail(${i},${li})">${esc(le.name)}</span>`;
  }).join('');

  const relatedTagsHtml = relatedLinks.map(rl => {
    const rpIdx = parseInt(rl.id);
    const rp = state.data.powers[rpIdx];
    if (!rp) return '';
    const descArg = rl.desc ? `, '${jsStr(rl.desc)}'` : '';
    return `<span class="wiki-tag item" style="cursor:pointer" onclick="showPreviewCard('power','${esc(rpIdx)}',event${descArg})">${esc(rp.name)}<button class="btn btn-xs btn-icon btn-danger" style="font-size:8px;margin-left:2px" onclick="event.stopPropagation();removePowerRel(${i},'${esc(rl.id)}')">×</button></span>`;
  }).join('');

  return `<div class="power-item" style="border:1px solid var(--border);border-radius:var(--radius-sm);padding:16px;margin-bottom:12px;background:var(--bg-alt)">
    <div class="flex-between" style="margin-bottom:8px"><div style="display:flex;align-items:center;gap:6px"><span class="drag-handle" style="cursor:grab;font-size:10px;color:var(--muted);user-select:none">⠿</span><strong style="font-size:16px">${esc(p.name||'未命名体系')}</strong></div><button class="btn btn-xs btn-danger" onclick="deletePower(${i})">×</button></div>
    <div class="form-group"><label>体系名称</label><input value="${esc(p.name||'')}" onchange="updatePower(${i},'name',this.value)"></div>
    <div class="form-group"><label>描述</label><textarea rows="3" onchange="updatePower(${i},'description',this.value)">${esc(p.description||'')}</textarea></div>
    <div class="form-group"><label>等级/境界</label>
      ${levelTagsHtml ? `<div class="wiki-tags" style="margin-bottom:8px">${levelTagsHtml}</div>` : ''}
      <div style="margin-bottom:6px">${levelEntriesHtml}</div>
      <button class="btn btn-xs btn-outline" onclick="addPowerLevelEntry(${i})">+ 添加等级</button>
    </div>
    <div class="form-group"><label>规则/限制</label><textarea rows="2" onchange="updatePower(${i},'rules',this.value)">${esc(p.rules||'')}</textarea></div>
    ${customProps.length>0?`<div class="card" style="margin-bottom:8px;padding:10px"><h4 style="margin:0 0 8px">自定义属性</h4>${customProps.map(prop=>{
      const key='cp_'+prop.id;
      const val=p.customProps[key]||'';
      return renderCustomPropField(prop,val,`setPowerCustomProp(${i},'${prop.id}',this.value)`);
    }).join('')}</div>`:''}
    <div class="card" style="margin-bottom:0;padding:10px"><h4 style="margin:0 0 8px">关联力量体系</h4>
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
        <span class="text-xs text-muted">已选 ${relatedLinks.length} 个</span>
        <button class="btn btn-xs btn-outline" onclick="openPowerRelModal(${i})">选择</button>
      </div>
      ${relatedTagsHtml?`<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px">${relatedTagsHtml}</div>`:''}
    </div>
  </div>`;
}

function setupPowers() { registerSearchTarget('powerSearch','powers-list',()=>renderPowers()); setupDragSort({ containerId:'powers-list', itemSelector:'.power-item', handleSelector:'.drag-handle', getArray:()=>state.data.powers, setArray:(arr)=>{state.data.powers=arr;} }); }
function addPower() { if (!state.data.powers) state.data.powers=[]; state.data.powers.push({name:'',description:'',levels:[],levelEntries:[],rules:'',customProps:{},relatedPowers:[]}); autoSave(); renderTabContent(); }
async function aiGenPowers() { const el=$('#ai-powers-result'); const text=await runAI(window.api.aiGeneratePowerSystem(state.data),el); if (text) { const arr=tryParseJSONArray(text)||tryParseJSON(text); if (arr&&Array.isArray(arr)) { if (!state.data.powers) state.data.powers=[]; arr.forEach(p=>state.data.powers.push({name:p.name||p.title||'',description:p.description||'',levels:p.levels||[],levelEntries:(p.levels||[]).map(l=>typeof l==='object'?l:{name:l,desc:''}),rules:p.rules||'',customProps:{},relatedPowers:[]})); autoSave(); renderTabContent(); } } }
function updatePower(i,key,value) { if (state.data.powers&&state.data.powers[i]) { if (key==='levels'&&typeof value==='string') state.data.powers[i][key]=value.split('\n').filter(Boolean); else state.data.powers[i][key]=value; autoSave(); } }
function addPowerLevelEntry(i) { if (!state.data.powers[i].levelEntries) state.data.powers[i].levelEntries=[]; state.data.powers[i].levelEntries.push({name:'',desc:''}); autoSave(); renderTabContent(); }
function updatePowerLevelEntry(i,li,key,value) { if (state.data.powers&&state.data.powers[i]&&state.data.powers[i].levelEntries&&state.data.powers[i].levelEntries[li]) { state.data.powers[i].levelEntries[li][key]=value; autoSave(); } }
function removePowerLevelEntry(i,li) { if (state.data.powers&&state.data.powers[i]&&state.data.powers[i].levelEntries) { state.data.powers[i].levelEntries.splice(li,1); autoSave(); renderTabContent(); } }
function setPowerCustomProp(i,propId,value) { if(!state.data.powers||!state.data.powers[i]) return; if(!state.data.powers[i].customProps) state.data.powers[i].customProps={}; state.data.powers[i].customProps['cp_'+propId]=value; autoSave(); }
function openPowerLevelDetail(pi, li) {
  const p = (state.data.powers||[])[pi];
  if (!p || !p.levelEntries || !p.levelEntries[li]) return;
  const le = p.levelEntries[li];
  const overlay = $('#modal-overlay');
  const modal = $('#modal-box');
  modal.innerHTML = `
    <div class="wiki-page" style="padding:0">
      <div class="wiki-header" style="padding-bottom:12px;border-bottom:1px solid var(--border)">
        <h2 style="margin:0">🔮 ${esc(p.name||'未命名体系')} · ${esc(le.name||'第'+(li+1)+'级')}</h2>
      </div>
      <div class="wiki-section" style="margin-top:12px">
        <div class="wiki-field"><span class="wiki-label">等级序号</span><span class="wiki-value">${li+1}</span></div>
        <div class="wiki-field"><span class="wiki-label">等级名称</span><span class="wiki-value">${esc(le.name||'未命名')}</span></div>
      </div>
      ${le.desc?`<div class="wiki-section"><div class="wiki-section-title">简述</div><div class="wiki-value">${esc(le.desc)}</div></div>`:`<div class="wiki-section"><div class="wiki-section-title">简述</div><div class="text-xs text-muted">暂无简述</div></div>`}
      <div class="modal-actions" style="margin-top:16px">
        <button class="btn btn-outline" onclick="closeModal()">关闭</button>
      </div>
    </div>`;
  overlay.classList.remove('hidden');
  overlay.onclick = (e) => { if (e.target === overlay) closeModal(); };
}
async function openPowerRelModal(i) {
  const p = state.data.powers[i]; if(!p) return;
  const allPowers = (state.data.powers||[]).filter((_,pi)=>pi!==i);
  if (allPowers.length === 0) {
    const overlay = $('#modal-overlay');
    const modal = $('#modal-box');
    modal.innerHTML = `<h3>关联力量体系</h3><div class="modal-select-list" style="max-height:300px;overflow-y:auto"><div class="text-xs text-muted" style="padding:8px">暂无其他力量体系</div></div><div class="modal-actions"><button class="btn btn-primary" id="custom-link-ok">确定</button></div>`;
    overlay.classList.remove('hidden');
    let resolved = false;
    $('#custom-link-ok').onclick = () => { if (!resolved) { resolved = true; closeModal(); } };
    overlay.onclick = (e2) => { if (e2.target === overlay && !resolved) { resolved = true; closeModal(); } };
    return;
  }
  const options = allPowers.map((rp,ri)=>{const realIdx=state.data.powers.indexOf(rp);return {id:String(realIdx),name:rp.name||'未命名体系'};});
  const result = await customLinkModal('关联力量体系',options,p.relatedPowers||[],'简述关联');
  if(result===null) return;
  p.relatedPowers = result;
  autoSave(); renderTabContent();
}
function removePowerRel(i,id) {
  const p = state.data.powers[i]; if(!p) return;
  p.relatedPowers = _normLinks(p.relatedPowers||[]).filter(l=>l.id!==id).map(l=>({id:l.id,desc:l.desc}));
  autoSave(); renderTabContent();
}
async function deletePower(i) { if (!await customConfirm('删除此力量体系？')) return; state.data.powers.splice(i,1); autoSave(); renderTabContent(); }