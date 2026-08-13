// ============================================================
// 世界生成器 — 角色关系
// 依赖: core/state.js, core/utils.js, core/modal.js, core/glossary.js
// ============================================================

function renderRelations() {
  const rels = state.data.characterRelations||[];
  const chars = state.data.characters||[];
  return `<div class="card"><h3>🕸️ 角色关系图</h3>
    <div class="ai-section-actions"><button class="btn btn-ai btn-sm" onclick="aiGenRelations()">🤖 AI 生成关系</button><button class="btn btn-sm btn-primary" onclick="addRelation()">+ 添加关系</button></div>
    <div id="ai-relations-result"></div>
    <div class="relations-canvas-container"><canvas id="relations-canvas" width="800" height="400"></canvas></div></div>
    <div class="card"><h3>📋 关系列表</h3><div class="relations-list">${rels.length===0?'<div class="empty-state"><div class="icon">🕸️</div><p>暂无关系</p></div>':rels.map((r,i)=>renderRelationItem(r,i,chars)).join('')}</div></div>`;
}

function renderRelationItem(r,i,chars) {
  const source = chars.find(c=>c.id===r.sourceId);
  const target = chars.find(c=>c.id===r.targetId);
  return `<div class="relation-item">
    <div class="relation-connector"><span class="relation-char">${esc(source?.name||'未知')}</span>
      <span class="relation-arrow" style="color:var(--accent)">——${esc(r.type||'关系')}——→</span><span class="relation-char">${esc(target?.name||'未知')}</span></div>
    ${r.description ? `<div class="relation-desc">${esc(r.description)}</div>` : ''}
    <div class="relation-actions">
      <input value="${esc(r.type||'')}" onchange="updateRelation(${i},'type',this.value)" placeholder="关系类型" style="padding:4px 8px;background:var(--white);border:1px solid var(--border);border-radius:var(--radius-xs);font-size:13px;font-family:var(--font-body);width:100px">
      <button class="btn btn-xs btn-danger" onclick="deleteRelation(${i})">×</button></div></div>`;
}

function setupRelations() { try { drawRelationsGraph(); } catch(e) { console.error('drawRelationsGraph error:', e); } }

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