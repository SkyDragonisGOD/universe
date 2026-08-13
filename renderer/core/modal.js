// ============================================================
// 世界生成器 — 弹窗系统
// ============================================================

function closeModal() {
  const overlay = $('#modal-overlay');
  overlay.classList.add('hidden');
  overlay.onclick = null;
  $('#modal-box').innerHTML = '';
}

function customPrompt(title, defaultVal) {
  return new Promise((resolve) => {
    const modal = $('#modal-box');
    const overlay = $('#modal-overlay');
    modal.innerHTML = `
      <h3>${esc(title)}</h3>
      <div class="form-group"><input id="custom-prompt-input" value="${esc(defaultVal||'')}" style="width:100%;padding:10px 12px;font-size:15px;border:1px solid var(--border);border-radius:var(--radius-sm);background:var(--white);color:var(--black)"></div>
      <div class="modal-actions">
        <button class="btn btn-outline" id="custom-prompt-cancel">取消</button>
        <button class="btn btn-primary" id="custom-prompt-ok">确定</button>
      </div>`;
    overlay.classList.remove('hidden');
    const input = $('#custom-prompt-input');
    requestAnimationFrame(() => { input.focus(); input.select(); });
    const done = (val) => { if (done.called) return; done.called = true; closeModal(); resolve(val); };
    done.called = false;
    $('#custom-prompt-ok').onclick = () => done(input.value);
    $('#custom-prompt-cancel').onclick = () => done(null);
    input.onkeydown = (e) => { if (e.key === 'Enter') done(input.value); if (e.key === 'Escape') done(null); };
    overlay.onclick = (e) => { if (e.target === overlay) done(null); };
  });
}

function customConfirm(title) {
  return new Promise((resolve) => {
    const modal = $('#modal-box');
    const overlay = $('#modal-overlay');
    modal.innerHTML = `
      <h3>${esc(title)}</h3>
      <div class="modal-actions">
        <button class="btn btn-outline" id="custom-confirm-cancel">取消</button>
        <button class="btn btn-primary" id="custom-confirm-ok">确定</button>
      </div>`;
    overlay.classList.remove('hidden');
    const done = (val) => { if (done.called) return; done.called = true; closeModal(); resolve(val); };
    done.called = false;
    $('#custom-confirm-ok').onclick = () => done(true);
    $('#custom-confirm-cancel').onclick = () => done(false);
    overlay.onclick = (e) => { if (e.target === overlay) done(false); };
  });
}

function customSelectModal(title, options, selectedIds, maxSelect) {
  return new Promise((resolve) => {
    const modal = $('#modal-box');
    const overlay = $('#modal-overlay');
    const selSet = new Set(selectedIds || []);
    const isRadio = maxSelect === 1;
    const inputType = isRadio ? 'radio' : 'checkbox';
    const inputName = isRadio ? 'ms-radio-' + Date.now() : '';
    const items = (options || []).map(opt => {
      const id = opt.id || opt;
      const label = opt.name || opt;
      const checked = selSet.has(id);
      return `<label class="modal-select-item" style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border);cursor:pointer;font-size:14px">
        <input type="${inputType}" name="${inputName}" data-ms-id="${esc(String(id))}" ${checked?'checked':''} style="width:16px;height:16px;accent-color:var(--black)">
        <span>${esc(label)}</span></label>`;
    }).join('');
    modal.innerHTML = `
      <h3>${esc(title)}</h3>
      <div class="modal-select-list" style="max-height:400px;overflow-y:auto;margin:0 -8px;padding:0 8px">${items || '<div class="text-xs text-muted" style="padding:8px">暂无可选项</div>'}</div>
      <div class="modal-actions">
        <button class="btn btn-outline" id="custom-select-cancel">取消</button>
        <button class="btn btn-primary" id="custom-select-ok">确定</button>
      </div>`;
    overlay.classList.remove('hidden');
    const done = (val) => { if (done.called) return; done.called = true; closeModal(); resolve(val); };
    done.called = false;
    $('#custom-select-ok').onclick = () => {
      const checked = [...modal.querySelectorAll('input[data-ms-id]:checked')].map(cb => cb.dataset.msId);
      done(checked);
    };
    $('#custom-select-cancel').onclick = () => done(null);
    overlay.onclick = (e) => { if (e.target === overlay) done(null); };
  });
}

function customLinkModal(title, options, existingLinks, descPlaceholder) {
  return new Promise((resolve) => {
    const modal = $('#modal-box');
    const overlay = $('#modal-overlay');
    const linkMap = {};
    (_normLinks(existingLinks)).forEach(l => { linkMap[l.id] = l.desc || ''; });
    const selSet = new Set(Object.keys(linkMap));
    const items = (options || []).map(opt => {
      const id = opt.id || opt;
      const label = opt.name || opt;
      const checked = selSet.has(id);
      const desc = linkMap[id] || '';
      return `<div class="modal-link-item" style="padding:8px 0;border-bottom:1px solid var(--border);font-size:14px">
        <label style="display:flex;align-items:center;gap:10px;cursor:pointer;margin-bottom:4px">
          <input type="checkbox" data-ms-id="${esc(String(id))}" ${checked?'checked':''} style="width:16px;height:16px;accent-color:var(--black)">
          <span>${esc(label)}</span>
        </label>
        <input type="text" data-ms-desc="${esc(String(id))}" value="${esc(desc)}" placeholder="${esc(descPlaceholder||'简述关系')}" style="display:${checked?'block':'none'};width:100%;margin-left:26px;padding:4px 8px;font-size:12px;border:1px solid var(--border);border-radius:var(--radius-xs);background:var(--white)">
      </div>`;
    }).join('');
    modal.innerHTML = `
      <h3>${esc(title)}</h3>
      <div class="modal-select-list" style="max-height:400px;overflow-y:auto;margin:0 -8px;padding:0 8px">${items || '<div class="text-xs text-muted" style="padding:8px">暂无可选项</div>'}</div>
      <div class="modal-actions">
        <button class="btn btn-outline" id="custom-link-cancel">取消</button>
        <button class="btn btn-primary" id="custom-link-ok">确定</button>
      </div>`;
    overlay.classList.remove('hidden');
    modal.querySelectorAll('input[data-ms-id]').forEach(cb => {
      cb.onchange = () => {
        const descInput = modal.querySelector(`input[data-ms-desc="${cb.dataset.msId}"]`);
        if (descInput) descInput.style.display = cb.checked ? 'block' : 'none';
      };
    });
    const done = (val) => { if (done.called) return; done.called = true; closeModal(); resolve(val); };
    done.called = false;
    $('#custom-link-ok').onclick = () => {
      const result = [...modal.querySelectorAll('input[data-ms-id]:checked')].map(cb => {
        const descInput = modal.querySelector(`input[data-ms-desc="${cb.dataset.msId}"]`);
        return { id: cb.dataset.msId, desc: descInput ? descInput.value.trim() : '' };
      });
      done(result);
    };
    $('#custom-link-cancel').onclick = () => done(null);
    overlay.onclick = (e) => { if (e.target === overlay) done(null); };
  });
}