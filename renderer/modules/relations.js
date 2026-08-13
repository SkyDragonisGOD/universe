// ============================================================
// 世界生成器 — 角色关系
// 依赖: core/state.js, core/utils.js, core/modal.js, core/glossary.js
// ============================================================

function renderRelations() {
  const rels = state.data.characterRelations||[];
  const chars = state.data.characters||[];
  const relFilterDefs = [
    { key:'character', label:'角色', field:'sourceId', getItems:()=>chars.map(c=>({id:c.id,name:c.name||'未命名'})) },
    { key:'type', label:'类型', field:'type', getItems:()=>{const types=[...new Set(rels.map(r=>r.type).filter(Boolean))];return types.map(t=>({id:t,name:t}));} },
  ];
  return `<div class="relation-layout">
    <div class="relation-list-panel">
      <div class="flex-between mb-8"><h3>📋 关系列表</h3><div class="flex-gap"><button class="btn btn-ai btn-sm" onclick="aiGenRelations()">🤖 AI 生成</button><button class="btn btn-sm btn-primary" onclick="addRelation()">+ 新建</button></div></div>
      ${renderSearchBox('relSearch')}
      ${renderRelFilter('relRelFilter', relFilterDefs)}
      <div id="ai-relations-result"></div>
      <div id="relation-list" class="relations-list">${renderRelationList()}</div>
    </div>
    <div class="relation-detail-panel">
      <div class="card"><h3>🕸️ 角色关系图</h3>
        <div class="relations-canvas-container"><canvas id="relations-canvas" width="800" height="400"></canvas></div></div>
      <div id="relation-detail"></div>
    </div></div>`;
}

function renderRelationList() {
  const rels = state.data.characterRelations||[];
  const chars = state.data.characters||[];
  if (rels.length===0) return '<div class="empty-state"><div class="icon">🕸️</div><p>暂无关系</p></div>';
  const filtered = rels.filter(r => {
    const f = state.relRelFilter;
    if (!f) return true;
    const charIds = f.character || [];
    const typeIds = f.type || [];
    if (charIds.length > 0 && !charIds.includes(r.sourceId) && !charIds.includes(r.targetId)) return false;
    if (typeIds.length > 0 && !typeIds.includes(r.type)) return false;
    return true;
  }).filter(r => {
    const q = (state.relSearch || '').toLowerCase().trim();
    if (!q) return true;
    const source = chars.find(c=>c.id===r.sourceId);
    const target = chars.find(c=>c.id===r.targetId);
    return (source?.name||'').toLowerCase().includes(q) || (target?.name||'').toLowerCase().includes(q) || (r.type||'').toLowerCase().includes(q);
  });
  if (filtered.length===0) return '<div class="empty-state"><div class="icon">🔍</div><p>无匹配关系</p></div>';
  return filtered.map((r,i) => {
    const source = chars.find(c=>c.id===r.sourceId);
    const target = chars.find(c=>c.id===r.targetId);
    const isSelected = state.selectedRelationId === r.id;
    return `<div class="relation-item${isSelected?' selected':''}" data-rel-id="${esc(r.id)}" onclick="selectRelation('${esc(r.id)}')">
      <div class="relation-connector"><span class="relation-char">${esc(source?.name||'未知')}</span>
        <span class="relation-arrow">——${esc(r.type||'关系')}——→</span><span class="relation-char">${esc(target?.name||'未知')}</span></div>
      ${r.description ? `<div class="relation-desc">${esc(r.description)}</div>` : ''}
      <div class="relation-actions">
        <input value="${esc(r.type||'')}" onchange="updateRelation(${i},'type',this.value)" onclick="event.stopPropagation()" placeholder="关系类型" style="padding:3px 6px;background:var(--white);border:1px solid var(--border);border-radius:var(--radius-xs);font-size:12px;font-family:var(--font-body);width:70px">
        <button class="btn btn-xs btn-danger" onclick="event.stopPropagation();deleteRelation(${i})">×</button></div></div>`;
  }).join('');
}

function selectRelation(id) {
  state.selectedRelationId = id;
  const list = $('#relation-list');
  if (list) list.innerHTML = renderRelationList();
  const detail = $('#relation-detail');
  if (detail) detail.innerHTML = renderRelationDetail();
}

function renderRelationDetail() {
  const rels = state.data.characterRelations||[];
  const chars = state.data.characters||[];
  const r = rels.find(rel => rel.id === state.selectedRelationId);
  if (!r) return '<div class="empty-state"><div class="icon">👆</div><p>选择左侧关系查看详情</p></div>';
  const source = chars.find(c=>c.id===r.sourceId);
  const target = chars.find(c=>c.id===r.targetId);
  return `<div class="card detail-scroll-area">
    <div style="display:flex;align-items:center;gap:12px;font-size:16px;font-weight:500;margin-bottom:12px">
      <span style="cursor:pointer;color:var(--accent)" onclick="showPreviewCard('character','${esc(r.sourceId)}',event)">${esc(source?.name||'未知')}</span>
      <span style="color:var(--warm-gray)">——${esc(r.type||'关系')}——→</span>
      <span style="cursor:pointer;color:var(--accent)" onclick="showPreviewCard('character','${esc(r.targetId)}',event)">${esc(target?.name||'未知')}</span>
    </div>
    ${r.description ? `<div class="wiki-section"><div class="wiki-section-title">描述</div><p style="font-size:14px;line-height:1.6">${esc(r.description)}</p></div>` : ''}
    <div class="wiki-section"><div class="wiki-section-title">编辑</div>
      <div class="form-group"><label>关系类型</label><input value="${esc(r.type||'')}" onchange="updateRelationById('${esc(r.id)}','type',this.value)" style="width:100%;padding:8px 12px;background:var(--white);border:1px solid var(--border);border-radius:var(--radius-sm);font-size:14px;font-family:var(--font-body)"></div>
      <div class="form-group"><label>描述</label><textarea onchange="updateRelationById('${esc(r.id)}','description',this.value)" rows="3" style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);font-size:14px;font-family:var(--font-body);resize:vertical">${esc(r.description||'')}</textarea></div>
    </div>
  </div>
  <div class="detail-sticky-bar">
    <div></div>
    <button class="btn btn-sm btn-danger" onclick="deleteRelationById('${esc(r.id)}')">🗑️ 删除此关系</button>
  </div>`;
}

function updateRelationById(id, key, value) {
  const rels = state.data.characterRelations||[];
  const r = rels.find(rel => rel.id === id);
  if (r) { r[key] = value; autoSave(); }
}

function setupRelations() { registerSearchTarget('relSearch','relation-list',renderRelationList); try { drawRelationsGraph(); } catch(e) { console.error('drawRelationsGraph error:', e); } }

function drawRelationsGraph() {
  const canvas = $('#relations-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0,0,w,h);
  const chars = state.data.characters||[];
  const rels = state.data.characterRelations||[];
  if (chars.length===0) { ctx.fillStyle='#777169'; ctx.font='14px "Microsoft YaHei",sans-serif'; ctx.textAlign='center'; ctx.fillText('请先添加角色',w/2,h/2); return; }
  const positions = {};
  const cx=w/2, cy=h/2, r=Math.min(w,h)/2-40;
  chars.forEach((c,i)=>{ const angle=(Math.PI*2/chars.length)*i-Math.PI/2; positions[c.id]={x:cx+r*Math.cos(angle),y:cy+r*Math.sin(angle),name:c.name}; });
  rels.forEach(r=>{ const src=positions[r.sourceId],tgt=positions[r.targetId]; if (!src||!tgt) return; ctx.beginPath(); ctx.moveTo(src.x,src.y); ctx.lineTo(tgt.x,tgt.y); ctx.strokeStyle='#d69e2e'; ctx.lineWidth=1.5; ctx.globalAlpha=0.5; ctx.stroke(); ctx.globalAlpha=1; const mx=(src.x+tgt.x)/2,my=(src.y+tgt.y)/2; ctx.fillStyle='#d69e2e'; ctx.font='10px "Microsoft YaHei",sans-serif'; ctx.textAlign='center'; ctx.fillText(r.type||'关系',mx,my-6); });
  chars.forEach(c=>{ const pos=positions[c.id]; if (!pos) return; ctx.beginPath(); ctx.arc(pos.x,pos.y,18,0,Math.PI*2); ctx.fillStyle='#ffffff'; ctx.fill(); ctx.strokeStyle='#000000'; ctx.lineWidth=2; ctx.stroke(); ctx.fillStyle='#000000'; ctx.font='12px "Microsoft YaHei",sans-serif'; ctx.textAlign='center'; ctx.fillText(c.name.slice(0,3),pos.x,pos.y+4); });
}

async function addRelation() {
  const chars = state.data.characters||[];
  if (chars.length < 2) { alert('请先添加至少两个角色！'); return; }
  const modal = $('#modal-box');
  const overlay = $('#modal-overlay');
  modal.innerHTML = `
    <h3>添加关系</h3>
    <div class="form-group"><label>源角色</label><select id="rel-source" style="width:100%;padding:8px 12px;background:var(--white);border:1px solid var(--border);border-radius:var(--radius-sm);font-size:14px;font-family:var(--font-body)">${chars.map((c,i)=>`<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select></div>
    <div class="form-group"><label>目标角色</label><select id="rel-target" style="width:100%;padding:8px 12px;background:var(--white);border:1px solid var(--border);border-radius:var(--radius-sm);font-size:14px;font-family:var(--font-body)">${chars.map((c,i)=>`<option value="${c.id}"${i===1?' selected':''}>${esc(c.name)}</option>`).join('')}</select></div>
    <div class="form-group"><label>关系类型</label><input id="rel-type" placeholder="如：师徒、恋人、宿敌..." style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);font-size:14px;font-family:var(--font-body)"></div>
    <div class="form-group"><label>描述（可选）</label><textarea id="rel-desc" rows="2" style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);font-size:14px;font-family:var(--font-body);resize:vertical" placeholder="补充说明"></textarea></div>
    <div class="modal-actions">
      <button class="btn btn-outline" id="rel-cancel">取消</button>
      <button class="btn btn-primary" id="rel-ok">确定</button>
    </div>`;
  overlay.classList.remove('hidden');
  const done = (val) => { closeModal(); resolve(val); };
  return new Promise((resolve) => {
    const finish = (val) => { closeModal(); resolve(val); };
    $('#rel-ok').onclick = () => {
      const sourceId = $('#rel-source').value;
      const targetId = $('#rel-target').value;
      const type = $('#rel-type').value;
      const desc = $('#rel-desc').value;
      if (!type || !type.trim()) { alert('请填写关系类型'); return; }
      if (sourceId === targetId) { alert('源角色和目标角色不能相同'); return; }
      state.data.characterRelations.push({ id: uid(), sourceId, targetId, type: type.trim(), description: desc||'' });
      autoSave(); renderTabContent();
      finish(true);
    };
    $('#rel-cancel').onclick = () => finish(false);
    overlay.onclick = (e) => { if (e.target === overlay) finish(false); };
  });
}

async function aiGenRelations() {
  const el = $('#ai-relations-result');
  const text = await runAI(window.api.aiGenerateRelations(state.data), el);
  if (text) { const json = tryParseJSON(text); if (json && Array.isArray(json)) { json.forEach(r => { r.id = r.id || uid(); state.data.characterRelations.push(r); }); autoSave(); renderTabContent(); } }
}

function updateRelation(i, key, value) { if (state.data.characterRelations[i]) { state.data.characterRelations[i][key] = value; autoSave(); } }
async function deleteRelation(i) { if (!await customConfirm('删除此关系？')) return; state.data.characterRelations.splice(i, 1); autoSave(); if (state.editingCharacter) { const c=(state.data.characters||[]).find(ch=>ch.id===state.selectedCharacterId); if(c){const d=$('#char-detail');if(d)d.innerHTML=renderCharEditForm(c);} } else { renderTabContent(); } }
async function deleteRelationById(id) { if (!await customConfirm('删除此关系？')) return; const idx = (state.data.characterRelations||[]).findIndex(r=>r.id===id); if (idx>=0) { state.data.characterRelations.splice(idx,1); autoSave(); state.selectedRelationId=null; renderTabContent(); } }