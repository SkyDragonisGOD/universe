// ============================================================
// 世界百科 — 模板添加功能
// ============================================================

function openAddTemplateCategoryModal() {
  initEncyclopediaData();
  const existingCats = state.data.encyclopediaCategories || [];
  const existingNames = new Set(existingCats.map(c => c.name));
  const modal = $('#modal-box');
  const overlay = $('#modal-overlay');
  const templateList = DEFAULT_ENCYCLOPEDIA_TREE.map(t => {
    const exists = existingNames.has(t.label);
    let missingInfo = '';
    if (exists) {
      const cat = existingCats.find(c => c.name === t.label);
      const existingSubNames = new Set((state.data.encyclopediaSubCategories || []).filter(s => s.parentId === cat.id).map(s => s.name));
      const missingChildren = (t.children || []).filter(ch => !existingSubNames.has(ch.label));
      if (missingChildren.length > 0) {
        missingInfo = `<span class="text-xs" style="margin-left:auto;color:var(--accent)">缺${missingChildren.length}子类: ${missingChildren.map(c => c.label).join(', ')}</span>`;
      } else {
        missingInfo = '<span class="text-xs text-muted" style="margin-left:auto">子类完整</span>';
      }
    }
    return `<label style="display:flex;align-items:center;gap:8px;padding:8px 10px;border:1px solid var(--border);border-radius:var(--radius-xs);margin-bottom:4px;cursor:pointer">
      <input type="checkbox" value="${esc(t.id)}" ${exists ? 'checked' : ''}>
      <span>${t.icon} ${esc(t.label)}</span>
      ${exists ? '<span class="text-xs text-muted">(已存在)</span>' : ''}
      ${missingInfo}
    </label>`;
  }).join('');
  modal.innerHTML = `
    <h3>📋 添加模板类</h3>
    <p class="text-sm text-muted" style="margin-bottom:12px">勾选要添加的默认大类。已存在的大类会补全缺失的子类，已有子类不覆盖。</p>
    <div style="max-height:400px;overflow-y:auto">${templateList}</div>
    <div class="modal-actions">
      <button class="btn btn-outline" onclick="closeModal()">取消</button>
      <button class="btn btn-primary" onclick="applyAddTemplateCategories()">添加</button>
    </div>`;
  overlay.classList.remove('hidden');
  overlay.onclick = (e) => { if (e.target === overlay) closeModal(); };
}

function applyAddTemplateCategories() {
  initEncyclopediaData();
  const checks = document.querySelectorAll('#modal-box input[type=checkbox]:checked');
  const selectedIds = new Set(Array.from(checks).map(c => c.value));
  let addedCats = 0, addedSubs = 0, skippedSubs = 0;
  for (const t of DEFAULT_ENCYCLOPEDIA_TREE) {
    if (!selectedIds.has(t.id)) continue;
    let cat = (state.data.encyclopediaCategories || []).find(c => c.name === t.label);
    if (!cat) {
      cat = { id: t.id, name: t.label, icon: t.icon, description: '' };
      state.data.encyclopediaCategories.push(cat);
      addedCats++;
    }
    if (t.children) {
      const existingSubNames = new Set(
        (state.data.encyclopediaSubCategories || []).filter(s => s.parentId === cat.id).map(s => s.name)
      );
      for (const child of t.children) {
        if (existingSubNames.has(child.label)) {
          skippedSubs++;
        } else {
          state.data.encyclopediaSubCategories.push({
            id: child.id, name: child.label, icon: child.icon, description: '', parentId: cat.id
          });
          addedSubs++;
        }
      }
    }
  }
  autoSave();
  closeModal();
  renderTabContent();
  let msg = `添加了 ${addedCats} 个大类，${addedSubs} 个子类`;
  if (skippedSubs > 0) msg += `，${skippedSubs} 个子类已存在被跳过`;
  showToast(msg);
}