// ============================================================
// 世界百科 — Emoji 选择器
// ============================================================

function openEncyclopediaEmojiPicker() {
  const modal = $('#modal-box');
  const overlay = $('#modal-overlay');
  const _seen1 = new Set();
  const customLib = (state.data.emojiLib || []).filter(em => { if (_seen1.has(em.emoji)) return false; _seen1.add(em.emoji); return true; }).map(em => em.emoji);
  const customLibHtml = customLib.length > 0 ? `<div class="emoji-cat"><div class="emoji-cat-title">⭐ 自定义 Emoji</div><div class="emoji-grid">${customLib.map(e => `<button class="emoji-btn" onclick="selectEncyclopediaEmoji('${e}')">${e}</button>`).join('')}</div></div>` : '';
  const categories = Object.entries(EMOJI_CATEGORIES).map(([cat, emojis]) => {
    return `<div class="emoji-cat"><div class="emoji-cat-title">${esc(cat)}</div><div class="emoji-grid">${emojis.map(e => `<button class="emoji-btn" onclick="selectEncyclopediaEmoji('${e}')">${e}</button>`).join('')}</div></div>`;
  }).join('');
  modal.innerHTML = `
    <h3>选择图标</h3>
    <div class="form-group"><label>自定义输入</label><input id="enc-emoji-custom-input" placeholder="输入emoji或文字" style="width:100%;padding:8px 12px;font-size:14px"></div>
    <div style="max-height:350px;overflow-y:auto">${customLibHtml}${categories}</div>
    <div class="modal-actions">
      <button class="btn btn-outline" onclick="closeModal()">取消</button>
      <button class="btn btn-primary" id="enc-emoji-ok-btn">确定</button>
    </div>`;
  showModalOverlay();
  $('#enc-emoji-ok-btn').onclick = () => { selectEncyclopediaEmoji(($('#enc-emoji-custom-input') || {}).value || '📦'); };
  overlay.onclick = (e) => { if (e.target === overlay) closeModal(); };
}

function selectEncyclopediaEmoji(emoji) {
  const input = $('#enc-item-icon');
  if (input) input.value = emoji;
  closeModal();
}

function openEncyclopediaCatIconPicker(catId) {
  const cat = (state.data.encyclopediaCategories || []).find(c => c.id === catId);
  if (!cat) return;
  const modal = $('#modal-box');
  const overlay = $('#modal-overlay');
  const _seen2 = new Set();
  const customLib = (state.data.emojiLib || []).filter(em => { if (_seen2.has(em.emoji)) return false; _seen2.add(em.emoji); return true; }).map(em => em.emoji);
  const customLibHtml = customLib.length > 0 ? `<div class="emoji-cat"><div class="emoji-cat-title">⭐ 自定义 Emoji</div><div class="emoji-grid">${customLib.map(e => `<button class="emoji-btn" onclick="selectEncyclopediaCatIcon('${esc(catId)}','${e}')">${e}</button>`).join('')}</div></div>` : '';
  const categories = Object.entries(EMOJI_CATEGORIES).map(([c, emojis]) => {
    return `<div class="emoji-cat"><div class="emoji-cat-title">${esc(c)}</div><div class="emoji-grid">${emojis.map(e => `<button class="emoji-btn" onclick="selectEncyclopediaCatIcon('${esc(catId)}','${e}')">${e}</button>`).join('')}</div></div>`;
  }).join('');
  modal.innerHTML = `
    <h3>选择大类图标</h3>
    <div class="form-group"><label>自定义输入</label><input id="enc-cat-icon-custom" placeholder="输入emoji或文字" value="${esc(cat.icon || '📁')}" style="width:100%;padding:8px 12px;font-size:14px"></div>
    <div style="max-height:350px;overflow-y:auto">${customLibHtml}${categories}</div>
    <div class="modal-actions">
      <button class="btn btn-outline" onclick="closeModal()">取消</button>
      <button class="btn btn-primary" id="enc-cat-icon-ok">确定</button>
    </div>`;
  showModalOverlay();
  $('#enc-cat-icon-ok').onclick = () => { selectEncyclopediaCatIcon(catId, ($('#enc-cat-icon-custom') || {}).value || '📁'); };
  overlay.onclick = (e) => { if (e.target === overlay) closeModal(); };
}

function selectEncyclopediaCatIcon(catId, icon) {
  const cat = (state.data.encyclopediaCategories || []).find(c => c.id === catId);
  if (!cat) return;
  cat.icon = icon;
  autoSave();
  closeModal();
  renderTabContent();
}

function openEncyclopediaSubIconPicker(subId) {
  const sub = (state.data.encyclopediaSubCategories || []).find(s => s.id === subId);
  if (!sub) return;
  const modal = $('#modal-box');
  const overlay = $('#modal-overlay');
  const _seen3 = new Set();
  const customLib = (state.data.emojiLib || []).filter(em => { if (_seen3.has(em.emoji)) return false; _seen3.add(em.emoji); return true; }).map(em => em.emoji);
  const customLibHtml = customLib.length > 0 ? `<div class="emoji-cat"><div class="emoji-cat-title">⭐ 自定义 Emoji</div><div class="emoji-grid">${customLib.map(e => `<button class="emoji-btn" onclick="selectEncyclopediaSubIcon('${esc(subId)}','${e}')">${e}</button>`).join('')}</div></div>` : '';
  const categories = Object.entries(EMOJI_CATEGORIES).map(([c, emojis]) => {
    return `<div class="emoji-cat"><div class="emoji-cat-title">${esc(c)}</div><div class="emoji-grid">${emojis.map(e => `<button class="emoji-btn" onclick="selectEncyclopediaSubIcon('${esc(subId)}','${e}')">${e}</button>`).join('')}</div></div>`;
  }).join('');
  modal.innerHTML = `
    <h3>选择子类图标</h3>
    <div class="form-group"><label>自定义输入</label><input id="enc-sub-icon-custom" placeholder="输入emoji或文字" value="${esc(sub.icon || '📂')}" style="width:100%;padding:8px 12px;font-size:14px"></div>
    <div style="max-height:350px;overflow-y:auto">${customLibHtml}${categories}</div>
    <div class="modal-actions">
      <button class="btn btn-outline" onclick="closeModal()">取消</button>
      <button class="btn btn-primary" id="enc-sub-icon-ok">确定</button>
    </div>`;
  showModalOverlay();
  $('#enc-sub-icon-ok').onclick = () => { selectEncyclopediaSubIcon(subId, ($('#enc-sub-icon-custom') || {}).value || '📂'); };
  overlay.onclick = (e) => { if (e.target === overlay) closeModal(); };
}

function selectEncyclopediaSubIcon(subId, icon) {
  const sub = (state.data.encyclopediaSubCategories || []).find(s => s.id === subId);
  if (!sub) return;
  sub.icon = icon;
  autoSave();
  closeModal();
  renderTabContent();
}